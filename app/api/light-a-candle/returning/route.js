import { NextResponse } from 'next/server';
import { randomBytes } from 'crypto';
import { supabaseAdmin } from '@/lib/supabase';
import { stripe, priceIdFor, tierLabel } from '@/lib/stripe';

function makeHash() {
  const raw = randomBytes(8).toString('base64url').replace(/[-_]/g, '');
  return 'c' + raw.slice(0, 9);
}

const VALID_TIERS = new Set(['memorial', 'family']);
const VALID_INTERVALS = new Set(['monthly', 'yearly']);

// POST /api/light-a-candle/returning
// For signed-in users who already have an account and want to add a new memorial.
// Requires Authorization: Bearer <access_token> header.
export async function POST(request) {
  try {
    // Validate session token
    const authHeader = request.headers.get('authorization') || '';
    const token = authHeader.replace('Bearer ', '').trim();
    if (!token) {
      return NextResponse.json({ error: 'Please sign in to continue.' }, { status: 401 });
    }

    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
    if (authError || !user) {
      return NextResponse.json({ error: 'Session expired. Please sign in again.' }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const lovedOneName = (body.lovedOneName || '').toString().trim();
    const birthDate = (body.birthDate || '').toString().trim() || null;
    const deathDate = (body.deathDate || '').toString().trim() || null;
    const dedication = (body.dedication || '').toString().trim() || null;
    const tier = VALID_TIERS.has(body.tier) ? body.tier : 'memorial';
    const billingInterval = VALID_INTERVALS.has(body.billingInterval)
      ? body.billingInterval
      : 'monthly';
    const isPrivate = !!body.isPrivate;

    if (!lovedOneName) {
      return NextResponse.json(
        { error: 'Please tell us who you are remembering.' },
        { status: 400 }
      );
    }

    const priceId = priceIdFor(tier, billingInterval);
    if (!priceId) {
      return NextResponse.json(
        { error: 'This plan is not available right now.' },
        { status: 500 }
      );
    }

    // Create memorial
    let memorialHash = null;
    let lastError = null;
    for (let attempt = 0; attempt < 5; attempt++) {
      const candidate = makeHash();
      const { error } = await supabaseAdmin.from('memorials').insert({
        hash: candidate,
        name: lovedOneName,
        birth_date: birthDate,
        death_date: deathDate,
        dedication,
        status: 'pending',
        owner_id: user.id,
        is_private: isPrivate,
      });
      if (!error) { memorialHash = candidate; break; }
      lastError = error;
      if (error.code !== '23505') break;
    }

    if (!memorialHash) {
      console.error('Memorial insert failed (returning user):', lastError);
      return NextResponse.json(
        { error: 'Could not place the candle on the altar. Please try again.' },
        { status: 500 }
      );
    }

    const origin =
      request.headers.get('origin') ||
      `https://${request.headers.get('host')}` ||
      'https://ancestors-originalbotanica.vercel.app';

    // Re-use existing Stripe customer if we have one, otherwise create
    const stripeCustomerId = user.user_metadata?.stripe_customer_id;
    let customer;
    if (stripeCustomerId) {
      try {
        customer = await stripe.customers.retrieve(stripeCustomerId);
        if (customer.deleted) customer = null;
      } catch { customer = null; }
    }
    if (!customer) {
      customer = await stripe.customers.create({
        email: user.email,
        name: user.user_metadata?.full_name || '',
        metadata: {
          supabase_user_id: user.id,
          memorial_hash: memorialHash,
          source: 'ancestors',
        },
      });
      try {
        await supabaseAdmin.auth.admin.updateUserById(user.id, {
          user_metadata: {
            ...user.user_metadata,
            stripe_customer_id: customer.id,
          },
        });
      } catch (e) {
        console.error('Metadata update error (non-fatal):', e);
      }
    }

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      customer: customer.id,
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${origin}/light-a-candle/success/${memorialHash}?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/light-a-candle?canceled=1`,
      allow_promotion_codes: true,
      billing_address_collection: 'auto',
      subscription_data: {
        metadata: {
          supabase_user_id: user.id,
          memorial_hash: memorialHash,
          tier,
          billing_interval: billingInterval,
          product_label: tierLabel(tier),
        },
      },
      metadata: {
        supabase_user_id: user.id,
        memorial_hash: memorialHash,
        tier,
        billing_interval: billingInterval,
      },
    });

    return NextResponse.json({ ok: true, hash: memorialHash, checkoutUrl: session.url });
  } catch (err) {
    console.error('Returning user light-a-candle error:', err);
    return NextResponse.json(
      { error: 'Something went wrong. Please try again.' },
      { status: 500 }
    );
  }
}
