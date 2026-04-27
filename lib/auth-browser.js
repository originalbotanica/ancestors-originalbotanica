'use client';

import { createBrowserClient } from '@supabase/ssr';

// Auth-aware Supabase client for use in Client Components.
// Reads/writes the session cookie that the Next.js middleware refreshes on every request.
export function createSupabaseBrowserClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
}
