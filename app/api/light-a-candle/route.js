import { NextResponse } from 'next/server';
import { randomBytes } from 'crypto';
import { supabaseAdmin } from '@/lib/supabase';

// Generate a short, URL-friendly hash for memorial URLs.
// Result: 'c' + 9 alphanumeric characters (e.g., 'cA7b3K9m2x') ~ 53 bits of entropy.
function makeHash() {
  const raw = randomBytes(8).toString('base64url').replace(/[-_]/g, '');
  return 'c' + raw.slice(0, 9);
}

const VALID_TIERS = new Set(['memorial', 'family']);

// POST /api/light-a-candle
// Creates a Supabase auth user + a memorial owned by that user.
// Returns the new memorial's hash so the client can redirect to /light-a-candle/success/<hash>.
export async function POST(request) {
  try {
    const body = await request.json().catch(() => ({}));

    const lovedOneName = (body.lovedOneName || '').toString().trim();
    const birthDate = (body.birthDate || '').toString().trim() || null;
    const deathDate = (body.deathDate || '').toString().trim() || null;
    const dedication = (body.dedication || '').toString().trim() || null;
    const tier = VALID_TIERS.has(body.tier) ? body.tier : 'memorial';
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
      return NextResponse.json(
        { error: 'Please tell us your name.' },
        { status: 400 }
      );
    }
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json(
        { error: 'Please enter a valid email address.' },
        { status: 400 }
      );
    }
    if (!password || password.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters.' },
        { status: 400 }
      );
    }

    // Step 1: Create the Supabase auth user (auto-confirmed for now — we'll add
    // email verification in a later phase).
    const { data: userData, error: userError } =
      await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { full_name: customerName },
      });

    if (userError) {
      // Email already in use → friendly error
      if (
        userError.message?.toLowerCase().includes('already') ||
        userError.code === 'email_exists' ||
        userError.status === 422
      ) {
        return NextResponse.json(
          {
            error:
              'An account with this email already exists. We will add a sign-in option soon — for now, please use a different email.',
          },
          { status: 409 }
        );
      }
      console.error('Auth createUser error:', userError);
      return NextResponse.json(
        { error: 'Could not create your account. Please try again.' },
        { status: 500 }
      );
    }

    const ownerId = userData.user?.id;
    if (!ownerId) {
      return NextResponse.json(
        { error: 'Account creation succeeded but did not return a user ID. Please try again.' },
        { status: 500 }
      );
    }

    // Step 2: Insert the memorial. Try a few times in the (very unlikely) case
    // of a hash collision with an existing memorial.
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
        status: 'active',
        owner_id: ownerId,
      });
      if (!error) {
        memorialHash = candidate;
        break;
      }
      lastError = error;
      // 23505 = unique constraint violation (hash collision)
      if (error.code !== '23505') break;
    }

    if (!memorialHash) {
      console.error('Memorial insert failed:', lastError);
      // Best-effort cleanup of the auth user we just created
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

    // Step 3: Record the tier choice as user metadata for now (Phase 4 will
    // hand this off to Stripe and replace this with a real subscription record).
    try {
      await supabaseAdmin.auth.admin.updateUserById(ownerId, {
        user_metadata: {
          full_name: customerName,
          intended_tier: tier,
          intended_billing: 'pending', // updated after Stripe checkout in Phase 4
        },
      });
    } catch (e) {
      // Non-fatal; the memorial is already placed.
      console.error('User metadata update error (non-fatal):', e);
    }

    return NextResponse.json({ ok: true, hash: memorialHash });
  } catch (err) {
    console.error('Light-a-candle handler error:', err);
    return NextResponse.json(
      { error: 'Something went wrong. Please try again.' },
      { status: 500 }
    );
  }
}
