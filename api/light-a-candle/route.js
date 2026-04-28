import { NextResponse } from 'next/server';
import { randomBytes } from 'crypto';
import { supabaseAdmin } from '@/lib/supabase';
import { stripe, priceIdFor, tierLabel } from '@/lib/stripe';

// Generate a short URL-friendly hash for memorial URLs.
function makeHash() {
  return 'c' + randomBytes(12).toString('hex').slice(0, 16);

const VALID_TIERS = new Set(['memorial', 'family']);
const VALID_INTERVALS = new Set(['monthly', 'yearly']);

// POST /api/light-a-candle
//   1. Creates the Supabase auth user.
//   2. Creates a 'pending' memorial owned by that user.
//   3. Creates a Stripe Checkout session for the chosen tier + interval.
//   4. Returns the Checkout URL — client redirects there.
//
// After successful payment, our /api/stripe/webhook flips the memorial to 'active'.
export async function POST(request) {
  try {
    const body = await request.json().catch(() => ({}));

    const lovedOneName = (body.lovedOneName || '').toString().trim().slice(0, 200);
    const birthDate = (body.birthDate || '').toString().trim() || null;
    const deathDate = (body.deathDate || '').toString().trim() || null;
    const dedication = (body.dedication || '').toString().trim().slice(0, 2000) || null;
    const tier = VALID_TIERS.has(body.tier) ? body.tier : 'memorial';
    const billingInterval = VALID_INTERVALS.has(body.billingInterval)
      ? body.billingInterval
      : 'monthly';
    const customerName = (body.customerName || '').toString().trim();
    const email = (body.email || '').toString().trim().toLowerCase();
    const password = (body.password || '').toString();

    // Validate required fields
    if (!lovedOneName) {
      return NextResponse.json(
        { error: 'Please tell us who you are remembering.' },
        { status: 400 }
      );
    }
    if (!customerName) {
      return NextResponse.json({ error: 'Please tell us your name.' }, { status: 400 });
    }
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: 'Please enter a valid email address.' }, { status: 400 });
    }
    if (!password || password.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters.' },
        { status: 400 }
      );
    }

    // Look up the Stripe price for the chosen tier + interval.
    const priceId = priceIdFor(tier, billingInterval);
    if (!priceId) {
      console.error(`Missing Stripe price ID for tier=${tier} interval=${billingInterval}`);
      return NextResponse.json(
        { error: 'This plan is not available right now. Please try again or contact us.' },
        { status: 500 }
      );
    }

    // 1) Create the Supabase auth user. Auto-confirmed (email verification comes later).
    const { data: userData, error: userError } =
      await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: {
          full_name: customerName,
          intended_tier: tier,
          intended_billing: billingInterval,
        },
      });

    if (userError) {
      console.error('Auth createUser error:', userError);
      return NextResponse.json(
        { error: 'Could not create your account. Please try again.' },
        { status: 500 }
      );
    }

    const ownerId = userData.user?.id;
    if (!ownerId) {
      return NextResponse.json(
        { error: 'Account creation succeeded but did not return a user ID.' },
        { status: 500 }
      );
    }

    // 2) Insert a 'pending' memorial. It won't show on /altar until the
    // webhook marks it 'active' after successful payment.
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
        owner_id: ownerId,
      });
      if (!error) {
        memorialHash = candidate;
        break;
      }
      lastError = error;
      if (error.code !== '23505') break;
    }

    if (!memorialHash) {
      console.error('Memorial insert failed:', lastError);
      try {
        await supabaseAdmin.auth.admin.deleteUser(ownerId);
      } catch (cleanupErr) {
        console.error('Cleanup error:', cleanupErr);
      }
      return NextResponse.json(
        { error: 'We could not place the candle on the altar. Please try again.' },
        { status: 500 }
      );
    }

    // 3) Create the Stripe customer and Checkout session.
    const origin =
      request.headers.get('origin') ||
      `https://${request.headers.get('host')}` ||
      'https://ancestors-originalbotanica.vercel.app';

    let customer;
    try {
      customer = await stripe.customers.create({
        email,
        name: customerName,
        metadata: {
          supabase_user_id: ownerId,
          memorial_hash: memorialHash,
          source: 'ancestors',
        },
      });
    } catch (e) {
      console.error('Stripe customer create error:', e);
      return NextResponse.json(
        { error: 'Could not start checkout. Please try again.' },
        { status: 500 }
      );
    }

    // Save the Stripe customer ID to the user's metadata for future reference.
    try {
      await supabaseAdmin.auth.admin.updateUserById(ownerId, {
        user_metadata: {
          full_name: customerName,
          intended_tier: tier,
          intended_billing: billingInterval,
          stripe_customer_id: customer.id,
        },
      });
    } catch (e) {
      console.error('User metadata update error (non-fatal):', e);
    }

    let session;
    try {
      session = await stripe.checkout.sessions.create({
        mode: 'subscription',
        customer: customer.id,
        line_items: [{ price: priceId, quantity: 1 }],
        success_url: `${origin}/light-a-candle/success/${memorialHash}?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${origin}/light-a-candle?canceled=1`,
        allow_promotion_codes: true,
        billing_address_collection: 'auto',
        subscription_data: {
          metadata: {
            supabase_user_id: ownerId,
            memorial_hash: memorialHash,
            tier,
            billing_interval: billingInterval,
            product_label: tierLabel(tier),
          },
        },
        metadata: {
          supabase_user_id: ownerId,
          memorial_hash: memorialHash,
          tier,
          billing_interval: billingInterval,
        },
      });
    } catch (e) {
      console.error('Stripe checkout session create error:', e);
      return NextResponse.json(
        { error: 'Could not start checkout. Please try again.' },
        { status: 500 }
      );
    }

    return NextResponse.json({ ok: true, hash: memorialHash, checkoutUrl: session.url });
  } catch (err) {
    console.error('Light-a-candle handler error:', err);
    return NextResponse.json(
      { error: 'Something went wrong. Please try again.' },
      { status: 500 }
    );
  }
}
