import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

// Auth-aware Supabase client for use in Server Components, Server Actions, and Route Handlers.
// Respects RLS — every query runs as the signed-in user (or anonymous if no session).
export async function createSupabaseServerClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // setAll was called from a Server Component (read-only cookies).
            // The Next.js middleware will refresh the session on the next request,
            // so it's safe to ignore this error here.
          }
        },
      },
    }
  );
}
