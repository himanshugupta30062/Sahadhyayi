import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';
import { brokeredPreviewStorage } from './previewAuthStorage';

// Public browser-safe defaults for the production Supabase project.
// Explicit deployment variables override these values when supplied.
// This is the public anon key, not a service-role key.
const PRODUCTION_SUPABASE_URL = 'https://rknxtatvlzunatpyqxro.supabase.co';
const PRODUCTION_SUPABASE_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJrbnh0YXR2bHp1bmF0cHlxeHJvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk5MzI0MjUsImV4cCI6MjA2NTUwODQyNX0.NXIWEwm8NlvzHnxf55cgdsy1ljX2IbFKQL7OS8xlb-U';

const rawUrl =
  typeof import.meta !== 'undefined' ? import.meta.env?.VITE_SUPABASE_URL?.trim() : '';
const rawKey =
  typeof import.meta !== 'undefined' ? import.meta.env?.VITE_SUPABASE_ANON_KEY?.trim() : '';

const isProdTarget =
  Boolean(import.meta.env?.PROD) ||
  (typeof window !== 'undefined' &&
    (window.location.hostname === 'sahadhyayi.com' ||
      window.location.hostname === 'www.sahadhyayi.com' ||
      window.location.hostname.endsWith('.netlify.app') ||
      window.location.hostname.endsWith('.workers.dev')));

const configuredUrl = rawUrl || (isProdTarget ? PRODUCTION_SUPABASE_URL : '');
const configuredKey = rawKey || (isProdTarget ? PRODUCTION_SUPABASE_KEY : '');

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
