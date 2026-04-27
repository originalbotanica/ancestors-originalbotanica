import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/auth-server';

export const dynamic = 'force-dynamic';

// Supabase's auth emails (password reset, magic link, email confirmation) use the
// PKCE flow — the link points at this route with a `?code=...` query param.
// We exchange the code for a session (which sets the auth cookies), then redirect
// to wherever the user was actually trying to land.
export async function GET(request) {
  const url = new URL(request.url);
  const code = url.searchParams.get('code');
  const next = url.searchParams.get('next') || '/account';

  if (code) {
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${url.origin}${next}`);
    }
    console.error('exchangeCodeForSession error:', error);
  }

  // Code missing or invalid → bounce to login with a friendly note.
  const loginUrl = new URL('/account/login', url.origin);
  loginUrl.searchParams.set('error', 'invalid-reset-link');
  return NextResponse.redirect(loginUrl);
}
