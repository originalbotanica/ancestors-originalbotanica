import { NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { supabaseAdmin } from '@/lib/supabase';

// Stripe needs the raw request body to verify the webhook signature.
// We read the body as text and let Stripe parse it.
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

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
        // Phase 6 will send the customer a "card declined" email via Mailchimp Transactional.
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
