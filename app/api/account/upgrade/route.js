import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { stripe, priceIdFor } from '@/lib/stripe';

// POST /api/account/upgrade
// Upgrades an existing memorial-tier subscription to family tier.
// Requires Authorization: Bearer <access_token> header.
// Stripe prorates the charge automatically â the customer pays only the
// difference for the remainder of their current billing cycle.
export async function POST(request) {
  try {
    // 1) Validate session
    const authHeader = request.headers.get('authorization') || '';
    const token = authHeader.replace('Bearer ', '').trim();
    if (!token) {
      return NextResponse.json({ error: 'Please sign in to continue.' }, { status: 401 });
    }

    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
    if (authError || !user) {
      return NextResponse.json({ error: 'Session expired. Please sign in again.' }, { status: 401 });
    }

    // 2) Get Stripe customer ID from user metadata
    const stripeCustomerId = user.user_metadata?.stripe_customer_id;
    if (!stripeCustomerId) {
      return NextResponse.json(
        { error: 'No billing account found. Please contact support.' },
        { status: 400 }
      );
    }

    // 3) Find the active memorial subscription for this customer
    const subscriptions = await stripe.subscriptions.list({
      customer: stripeCustomerId,
      status: 'active',
      limit: 10,
    });

    const memorialSub = subscriptions.data.find(
      (s) => s.metadata?.tier === 'memorial'
    );

    if (!memorialSub) {
      return NextResponse.json(
        { error: 'No active Memorial Candle subscription found.' },
        { status: 400 }
      );
    }

    // 4) Determine current billing interval and look up the family price
    const billingInterval = memorialSub.metadata?.billing_interval || 'monthly';
    const newPriceId = priceIdFor('family', billingInterval);

    if (!newPriceId) {
      console.error(`Missing family price for interval=${billingInterval}`);
      return NextResponse.json(
        { error: 'Family Altar plan is not available right now. Please contact support.' },
        { status: 500 }
      );
    }

    // 5) Check they're not already on family (shouldn't happen but be safe)
    const currentPriceId = memorialSub.items.data[0]?.price?.id;
    if (currentPriceId === newPriceId) {
      return NextResponse.json(
        { error: 'You are already on the Family Altar plan.' },
        { status: 400 }
      );
    }

    // 6) Upgrade the Stripe subscription â prorate immediately
    const subItem = memorialSub.items.data[0];
    const updatedSub = await stripe.subscriptions.update(memorialSub.id, {
      items: [{ id: subItem.id, price: newPriceId }],
      proration_behavior: 'create_prorations',
      metadata: {
        ...memorialSub.metadata,
        tier: 'family',
        billing_interval: billingInterval,
      },
    });

    // 7) Update the subscriptions table in Supabase
    const { error: dbError } = await supabaseAdmin
      .from('subscriptions')
      .update({ tier: 'family' })
      .eq('user_id', user.id)
      .neq('status', 'canceled');

    if (dbError) {
      // Non-fatal â Stripe is the source of truth and the webhook will sync it
      console.error('Supabase subscriptions update error (non-fatal):', dbError);
    }

    return NextResponse.json({
      ok: true,
      tier: 'family',
      billing_interval: billingInterval,
      subscription_id: updatedSub.id,
    });
  } catch (err) {
    console.error('Upgrade handler error:', err);
    return NextResponse.json(
      { error: 'Something went wrong. Please try again or contact support.' },
      { status: 500 }
    );
  }
}
