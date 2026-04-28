import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { createSupabaseServerClient } from '@/lib/auth-server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// PATCH /api/memorials/[hash]
// Update a memorial's editable fields (name, dates, dedication).
// Auth + ownership are enforced at the database layer via RLS — the user-scoped
// Supabase client only sees rows where owner_id = auth.uid(). Anyone trying to
// edit someone else's candle just gets back zero rows updated, which we surface
// as a 404.
export async function PATCH(request, { params }) {
  const { hash } = await params;

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'You must be signed in.' }, { status: 401 });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
  }

  const name = (body.name || '').toString().trim();
  const birthDate = body.birthDate ? body.birthDate.toString().trim() : null;
  const deathDate = body.deathDate ? body.deathDate.toString().trim() : null;
  const dedication = body.dedication ? body.dedication.toString().trim() : null;
  // photoUrl is opt-in: clients that don't include it leave the existing
  // value untouched. An explicit `null` clears the photo. A string sets it.
  const hasPhotoUrlField = Object.prototype.hasOwnProperty.call(body, 'photoUrl');
  const photoUrl =
    body.photoUrl === null
      ? null
      : typeof body.photoUrl === 'string'
        ? body.photoUrl.trim() || null
        : undefined;

  if (!name) {
    return NextResponse.json({ error: 'Please tell us their name.' }, { status: 400 });
  }
  if (name.length > 200) {
    return NextResponse.json(
      { error: 'Names should be under 200 characters.' },
      { status: 400 }
    );
  }
  if (dedication && dedication.length > 2000) {
    return NextResponse.json(
      { error: 'Dedications should be under 2000 characters.' },
      { status: 400 }
    );
  }

  // Validate dates are well-formed if provided. Supabase will also reject
  // bad input, but we want a friendly error rather than a 500.
  if (birthDate && Number.isNaN(Date.parse(birthDate))) {
    return NextResponse.json({ error: 'Birthday is not a valid date.' }, { status: 400 });
  }
  if (deathDate && Number.isNaN(Date.parse(deathDate))) {
    return NextResponse.json(
      { error: 'Date of passing is not a valid date.' },
      { status: 400 }
    );
  }

  const updatePayload = {
    name,
    birth_date: birthDate,
    death_date: deathDate,
    dedication,
    updated_at: new Date().toISOString(),
  };
  if (hasPhotoUrlField) {
    updatePayload.photo_url = photoUrl; // null clears, string sets
  }

  const { data, error } = await supabase
    .from('memorials')
    .update(updatePayload)
    .eq('hash', hash)
    .select()
    .maybeSingle();

  if (error) {
    console.error('Memorial PATCH error:', error);
    return NextResponse.json({ error: 'Could not save your changes.' }, { status: 500 });
  }

  if (!data) {
    // RLS filtered it out — either the candle doesn't exist or it's not theirs.
    return NextResponse.json(
      { error: "We couldn't find that candle on your altar." },
      { status: 404 }
    );
  }

  // Bust the Next.js cache for any page that renders this memorial so the
  // edits show up immediately when the user clicks "Visit candle" or visits
  // /altar instead of waiting for the 60s revalidate window.
  revalidatePath(`/candle/${hash}`);
  revalidatePath('/altar');
  revalidatePath('/account');

  return NextResponse.json({ ok: true, memorial: data });
}
