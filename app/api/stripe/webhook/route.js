import { NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { supabaseAdmin } from '@/lib/supabase';
import { Resend } from 'resend';

// Stripe needs the raw request body to verify the webhook signature.
// We read the body as text and let Stripe parse it.
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const resend = new Resend(process.env.RESEND_API_KEY);

// POST /api/stripe/webhook
// Stripe calls this whenever a subscription event happens.
// We verify the signature, then update Supabase accordingly.
export async function POST(request) {
  const sig = request.headers.get('stripe-signature');
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  const rawBody = await request.text();

  let event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, sig, secret);
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return new NextResponse(`Webhook signature error: ${err.message}`, { status: 400 });
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        const memorialHash = session.metadata?.memorial_hash;
        const userId = session.metadata?.supabase_user_id;
        const subscriptionId = session.subscription;
        const customerId = session.customer;

        if (!memorialHash) {
          console.error('checkout.session.completed missing memorial_hash');
          break;
        }

        // Mark the memorial as active so it appears on the altar.
        await supabaseAdmin
          .from('memorials')
          .update({ status: 'active' })
          .eq('hash', memorialHash);

        // Send confirmation email to the customer.
        const customerEmail = session.customer_details?.email || session.customer_email;
        if (customerEmail) {
          try {
            const { data: memorial } = await supabaseAdmin
              .from('memorials')
              .select('name')
              .eq('hash', memorialHash)
              .maybeSingle();

            if (memorial?.name) {
              const siteUrl =
                process.env.NEXT_PUBLIC_SITE_URL || 'https://ancestor.originalbotanica.com';
              const candleUrl = `${siteUrl}/candle/${memorialHash}`;
              await resend.emails.send({
                from: 'Original Botanica Ancestor Altar <altar@originalbotanica.com>',
                to: [customerEmail],
                subject: `Your candle for ${memorial.name} is lit`,
                html: `
                  <!DOCTYPE html>
                  <html>
                  <head>
                    <meta charset="utf-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                  </head>
                  <body style="margin:0;padding:0;background:#0e0b08;font-family:Georgia,serif;">
                    <table width="100%" cellpadding="0" cellspacing="0" style="background:#0e0b08;padding:40px 20px;">
                      <tr>
                        <td align="center">
                          <table width="100%" style="max-width:520px;background:#1a1410;border-radius:12px;overflow:hidden;">
                            <tr>
                              <td style="background:linear-gradient(135deg,#1a1410 0%,#2a1f0e 100%);padding:40px 32px 32px;text-align:center;border-bottom:1px solid rgba(193,125,60,0.2);">
                                <p style="margin:0 0 8px;color:#c17d3c;font-size:13px;letter-spacing:2px;text-transform:uppercase;">Original Botanica</p>
                                <h1 style="margin:0;color:#f5e6c8;font-size:26px;font-weight:400;line-height:1.3;">A candle burns for ${memorial.name}</h1>
                              </td>
                            </tr>
                            <tr>
                              <td style="padding:32px;color:#d4c4a0;font-size:16px;line-height:1.7;">
                                <p style="margin:0 0 20px;">Your candle has been lit on the Original Botanica Ancestor Altar. The sacred flame holds space for ${memorial.name} and carries your intentions forward.</p>
                                <p style="margin:0 0 28px;">This light burns as a bridge between worlds — honoring those who came before and the love that never fades.</p>
                                <table width="100%" cellpadding="0" cellspacing="0">
                                  <tr>
                                    <td align="center">
                                      <a href="${candleUrl}" style="display:inline-block;background:#c17d3c;color:#fff;text-decoration:none;padding:14px 32px;border-radius:6px;font-size:15px;letter-spacing:0.5px;">View Your Candle</a>
                                    </td>
                                  </tr>
                                </table>
                              </td>
                            </tr>
                            <tr>
                              <td style="padding:20px 32px 32px;border-top:1px solid rgba(193,125,60,0.15);text-align:center;">
                                <p style="margin:0;color:#7a6a50;font-size:13px;line-height:1.6;">
                                  Original Botanica &middot; Family-owned since 1959 &middot; The Bronx, New York<br>
                                  <a href="https://originalbotanica.com" style="color:#c17d3c;text-decoration:none;">originalbotanica.com</a>
                                </p>
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                    </table>
                  </body>
                  </html>
                `,
              });
            }
          } catch (emailErr) {
            console.error('Confirmation email error (non-fatal):', emailErr);
          }
        }

        // Upsert subscription record.
        if (subscriptionId) {
          const sub = await stripe.subscriptions.retrieve(subscriptionId);
          await upsertSubscription(sub, { userId, memorialHash, customerId });
        }
        break;
      }

      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const sub = event.data.object;
        await upsertSubscription(sub);

        // Mirror subscription status onto the memorial — but only for clear
        // end-states. Intermediate states like 'incomplete' fire transiently
        // during Checkout (before the first payment lands) and would race
        // with the 'active' status that checkout.session.completed just set.
        // We leave the memorial alone for those.
        //
        //   paused                                         → paused
        //   canceled / unpaid / incomplete_expired         → archived
        //   active / trialing / past_due                   → active
        //   anything else (incl. 'incomplete')             → no change
        const memorialHash = sub.metadata?.memorial_hash;
        if (memorialHash) {
          let memorialStatus = null;
          if (sub.pause_collection) {
            memorialStatus = 'paused';
          } else if (
            sub.status === 'canceled' ||
            sub.status === 'unpaid' ||
            sub.status === 'incomplete_expired'
          ) {
            memorialStatus = 'archived';
          } else if (
            sub.status === 'active' ||
            sub.status === 'trialing' ||
            sub.status === 'past_due'
          ) {
            memorialStatus = 'active';
          }
          if (memorialStatus) {
            await supabaseAdmin
              .from('memorials')
              .update({ status: memorialStatus })
              .eq('hash', memorialHash);
          }
        }
        break;
      }

      case 'customer.subscription.deleted': {
        const sub = event.data.object;
        await upsertSubscription(sub);
        const memorialHash = sub.metadata?.memorial_hash;
        if (memorialHash) {
          await supabaseAdmin
            .from('memorials')
            .update({ status: 'archived' })
            .eq('hash', memorialHash);
        }
        break;
      }

      case 'invoice.payment_failed': {
        // Stripe handles smart retries automatically — we just log this for now.
        const invoice = event.data.object;
        console.log('Invoice payment failed:', invoice.id, 'subscription:', invoice.subscription);
        break;
      }

      default:
        // Unhandled event types are fine — we ignore them.
        break;
    }

    return NextResponse.json({ received: true });
  } catch (err) {
    console.error(`Webhook handler error for ${event.type}:`, err);
    return new NextResponse(`Webhook handler error: ${err.message}`, { status: 500 });
  }
}

// Upsert a row into the public.subscriptions table from a Stripe Subscription object.
async function upsertSubscription(sub, hints = {}) {
  const userId = hints.userId || sub.metadata?.supabase_user_id || null;
  const memorialHash = hints.memorialHash || sub.metadata?.memorial_hash || null;
  const customerId = hints.customerId || sub.customer || null;
  const priceId = sub.items?.data?.[0]?.price?.id || null;
  const tier = sub.metadata?.tier || null;
  const billingInterval = sub.metadata?.billing_interval || null;

  const { error } = await supabaseAdmin
    .from('subscriptions')
    .upsert(
      {
        stripe_subscription_id: sub.id,
        user_id: userId,
        memorial_hash: memorialHash,
        stripe_customer_id: customerId,
        stripe_price_id: priceId,
        tier,
        billing_interval: billingInterval,
        status: sub.status,
        cancel_at_period_end: sub.cancel_at_period_end || false,
        current_period_end: sub.current_period_end
          ? new Date(sub.current_period_end * 1000).toISOString()
          : null,
        paused: !!sub.pause_collection,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'stripe_subscription_id' }
    );

  if (error) {
    console.error('subscriptions upsert error:', error);
  }
}
