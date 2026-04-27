import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/auth-server';

export const dynamic = 'force-dynamic';

// Sign the user out of Supabase (clears the auth cookies) and bounce them home.
export async function POST(request) {
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();

  const origin = new URL(request.url).origin;
  return NextResponse.redirect(`${origin}/`, { status: 303 });
}
