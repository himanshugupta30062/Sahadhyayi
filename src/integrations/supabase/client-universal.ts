// Re-export the single Supabase client to avoid multiple GoTrueClient instances
// sharing the same storage key (which causes auth desync warnings).
export { supabase } from './client';
