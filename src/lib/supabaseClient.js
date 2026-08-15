import { createClient } from '@supabase/supabase-js';

// TIP: unlike the Next.js reference version (which used @supabase/ssr
// for server-rendered auth), this is a plain Vite SPA — the browser is
// the only place auth ever happens, so the standard supabase-js client
// is all that's needed. Same underlying auth methods either way
// (signInWithOtp, verifyOtp, signInWithOAuth), just a simpler setup.
export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);
