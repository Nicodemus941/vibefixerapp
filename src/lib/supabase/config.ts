// Public Supabase connection values. The URL and publishable (anon) key are
// designed to ship in client bundles — access is governed by RLS, not by
// keeping these secret. Vercel/`.env` values take precedence when present;
// the literals are a committed fallback so a missing build-time env var can't
// produce an undefined client (which throws in @supabase/ssr).
//
// Do NOT add the service-role key or any API key here — those are secret and
// must come from the environment only.
export const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL ??
  "https://aeflghmsqvcwkiaynnab.supabase.co";

export const SUPABASE_PUBLISHABLE_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
  "sb_publishable_2fi9dhN6YB3pUaybW98KPw_WKiMJ_KE";
