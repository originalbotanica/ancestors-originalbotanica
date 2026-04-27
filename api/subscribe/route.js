import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

// POST /api/subscribe — accepts { email } and inserts into the signups table.
// Used by the coming-soon page email capture form.
export async function POST(request) {
  try {
    const body = await request.json().catch(() => ({}));
    const email = (body.email || '').toString().trim().toLowerCase();

    if (!email) {
      return NextResponse.json({ error: 'Email is required.' }, { status: 400 });
    }
    // Simple email format check (full RFC validation is not needed here)
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json(
        { error: 'Please enter a valid email address.' },
        { status: 400 }
      );
    }

    const { error } = await supabaseAdmin
      .from('signups')
      .insert({ email });

    if (error) {
      // Postgres unique-constraint violation → user already on the list. Treat as success.
      if (error.code === '23505') {
        return NextResponse.json({ ok: true, alreadySubscribed: true });
      }
      console.error('Supabase insert error:', error);
      return NextResponse.json(
        { error: 'Something went wrong. Please try again.' },
        { status: 500 }
      );
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('Subscribe handler error:', err);
    return NextResponse.json(
      { error: 'Something went wrong. Please try again.' },
      { status: 500 }
    );
  }
}
