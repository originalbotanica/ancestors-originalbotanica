import { createClient } from '@supabase/supabase-js';

// Server-side admin client (uses service-role key, BYPASSES RLS).
// Only use in API routes / server code, never in browser code.
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

// Public-read client (uses publishable/anon key, RESPECTS RLS).
// Safe for use in any context — protected by RLS policies in the database.
// Use for reading public data like the active altar memorials.
export const supabasePublic = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);
