// Re-export the project Supabase client to avoid multiple GoTrueClient instances
// sharing the same storage key. Preserve the generated Database type so query
// errors can be caught by TypeScript.
export { supabase, isSupabaseConfigured } from './client';
