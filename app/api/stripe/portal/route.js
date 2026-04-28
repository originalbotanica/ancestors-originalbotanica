import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/auth-server';
import { supabaseAdmin } from '@/lib/supabase';
import { stripe } from '@/lib/stripe';

// POST /api/stripe/portal
//   Returns a Stripe Billing Portal session URL for the signed-in user.
//   The client redirects the browser there; Stripe handles payment method
//   updates, invoice history, pause, and cancellation. Plan switching is
//   handled in our own UI (Phase 5e), so that feature is disabled in the
//   Portal configuration.
export async function POST(request) {
  try {
    // 1. Verify the user is signed in.
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Not signed in.' }, { status: 401 });
    }

    // 2. Look up the Stripe customer ID.
    //    Primary source: user_metadata (written during /api/light-a-candle).
    //    Fallback: subscriptions table (stripe_customer_id column).
    let customerId = user.user_metadata?.stripe_customer_id || null;

    if (!customerId) {
      const { data: sub } = await supabaseAdmin
        .from('subscriptions')
        .select('stripe_customer_id')
        .eq('user_id', user.id)
        .maybeSingle();
      customerId = sub?.stripe_customer_id || null;
    }

    if (!customerId) {
      return NextResponse.json(
        { error: 'No billing account found for this user.' },
        { status: 404 }
      );
    }

    // 3. Determine return URL — where Stripe sends the customer back after
    //    they finish in the Portal.
    const origin =
      request.headers.get('origin') ||
      `https://${request.headers.get('host')}` ||
      'https://ancestors-originalbotanica.vercel.app';

    // 4. Create the Billing Portal session.
    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: `${origin}/account`,
    });

    return NextResponse.json({ url: session.url });
  } catch (err) {
    console.error('Stripe portal session error:', err);
    return NextResponse.json(
      { error: 'Could not open billing portal. Please try again.' },
      { status: 500 }
    );
  }
}
