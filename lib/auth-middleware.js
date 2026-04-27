import { createServerClient } from '@supabase/ssr';
import { NextResponse } from 'next/server';

// Refresh the Supabase auth session cookie on every request.
// Without this, server components see stale auth state and the user appears logged out
// even when their browser still has a valid token.
export async function updateSession(request) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Touch the session — getUser() validates and refreshes if needed.
  await supabase.auth.getUser();

  return response;
}
