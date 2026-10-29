/**
 * Read-only public Supabase config for build-time SEO generation.
 *
 * The anon key is intentionally public and is already used by the browser app.
 * Never put a service-role key in this module or any VITE_* variable.
 * Explicit build variables take precedence; the production fallback is used only
 * when neither variable is supplied. Tests may opt out with the disable flag.
 */
const PRODUCTION_SUPABASE_URL = "https://rknxtatvlzunatpyqxro.supabase.co";
const PRODUCTION_SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJrbnh0YXR2bHp1bmF0cHlxeHJvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk5MzI0MjUsImV4cCI6MjA2NTUwODQyNX0.NXIWEwm8NlvzHnxf55cgdsy1ljX2IbFKQL7OS8xlb-U";

export function getPublicSupabaseConfig(env = process.env) {
  const url = env.VITE_SUPABASE_URL?.trim() || "";
  const key = env.VITE_SUPABASE_ANON_KEY?.trim() || "";
  if (env.SAHADHYAYI_DISABLE_PUBLIC_SEO_CONFIG === "1") return { url, key };
  if (url || key) return { url, key };
  return { url: PRODUCTION_SUPABASE_URL, key: PRODUCTION_SUPABASE_ANON_KEY };
}
