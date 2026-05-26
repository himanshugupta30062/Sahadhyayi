// Re-export the project Supabase client to avoid multiple GoTrueClient instances
// sharing the same storage key. We cast to `any` so existing untyped usages
// (selects across relations that aren't in the generated Database types) keep working.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
import { supabase as typedClient } from './client';
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const supabase: any = typedClient;
