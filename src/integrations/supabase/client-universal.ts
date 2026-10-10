// Re-export the project Supabase client to avoid multiple GoTrueClient instances
// sharing the same storage key. We cast to `any` so existing untyped usages
// (selects across relations that aren't in the generated Database types) keep working.
import { supabase as typedClient } from './client';
export const supabase: any = typedClient;
