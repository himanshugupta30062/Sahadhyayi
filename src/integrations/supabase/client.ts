import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';
import { brokeredPreviewStorage } from './previewAuthStorage';

// Never silently direct a staging, preview, or CI build to production.
// The local placeholders allow the app shell to render while the configuration
// warning is shown; they cannot reach the production Supabase project.
const configuredUrl =
  typeof import.meta !== 'undefined' ? import.meta.env?.VITE_SUPABASE_URL?.trim() : '';
const configuredKey =
  typeof import.meta !== 'undefined' ? import.meta.env?.VITE_SUPABASE_ANON_KEY?.trim() : '';
const SUPABASE_URL = configuredUrl || 'http://127.0.0.1:54321';
const SUPABASE_PUBLISHABLE_KEY = configuredKey || 'missing-supabase-public-key';

export const isSupabaseConfigured = Boolean(configuredUrl && configuredKey);

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    storage: brokeredPreviewStorage(),
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    flowType: 'pkce',
  },
  global: {
    headers: {
      'X-Client-Info': 'sahadhyayi-app',
    },
  },
});
