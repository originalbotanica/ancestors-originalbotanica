import { createClient } from '@supabase/supabase-js';

// Server-side Supabase client using the service-role key.
// NEVER use this in browser code — the service role bypasses RLS and has full DB access.
// Used by API routes (in app/api/*) to write to the database on the user's behalf.
export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);
