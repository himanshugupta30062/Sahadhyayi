import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';
import { brokeredPreviewStorage } from './previewAuthStorage';

// These are the project's public Supabase client defaults. The anon/publishable
// key is intended to be exposed to browsers; authorization must be enforced by
// Supabase Auth and Row Level Security. Netlify may override these using env vars.
const SUPABASE_URL =
  (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPABASE_URL) ||
  'https://rknxtatvlzunatpyqxro.supabase.co';
const SUPABASE_PUBLISHABLE_KEY =
  (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPABASE_ANON_KEY) ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXNzIiwicmVmIjoicmtueHRhdHZsenVuYXRweXF4cm8iLCJyb2xlIjoiYW5vbiIsImlhdCI6MTc0OTkzMjQyNSwiZXhwIjoyMDY1NTA4NDI1fQ.NXIWEwm8NlvzHnxf55cgdsy1ljX2IbFKQL7OS8xlb-U';

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
