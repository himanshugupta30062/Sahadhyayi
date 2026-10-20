import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { Database } from './types';
import { brokeredPreviewStorage } from './previewAuthStorage';

const SUPABASE_URL =
  typeof import.meta !== 'undefined' ? import.meta.env?.VITE_SUPABASE_URL : undefined;
const SUPABASE_PUBLISHABLE_KEY =
  typeof import.meta !== 'undefined' ? import.meta.env?.VITE_SUPABASE_ANON_KEY : undefined;

export const isSupabaseConfigured = Boolean(SUPABASE_URL && SUPABASE_PUBLISHABLE_KEY);

/**
 * Avoid throwing during module evaluation when a deployment is missing its
 * public Supabase build-time variables. Throwing here prevents React from
 * mounting at all and leaves the production page blank. The unconfigured
 * client preserves method-shaped APIs so optional data paths can fail inside
 * their own error handling; it never bypasses auth or invents credentials.
 */
function createUnconfiguredClient(): SupabaseClient<Database> {
  const fail = async () => ({
    data: null,
    error: new Error(
      'Sahadhyayi is missing its public Supabase configuration. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in the hosting environment and redeploy.',
    ),
  });

  const queryBuilder = new Proxy({}, {
    get: (_target, method: string) => {
      if (method === 'then') return undefined;
      if (method === 'catch') return (handler: (error: Error) => unknown) => fail().catch(handler);
      if (method === 'finally') return (handler: () => unknown) => fail().finally(handler);
      return (..._args: unknown[]) => queryBuilder;
    },
  });

  const unsupportedAuth = new Proxy({}, {
    get: (_target, method: string) => {
      if (method === 'onAuthStateChange') {
        return (callback: (event: string, session: null) => void) => {
          queueMicrotask(() => callback('INITIAL_SESSION', null));
          return { data: { subscription: { unsubscribe: () => undefined } } };
        };
      }
      if (method === 'getSession') return async () => ({ data: { session: null }, error: new Error('Supabase is not configured.') });
      if (method === 'getUser') return async () => ({ data: { user: null }, error: new Error('Supabase is not configured.') });
      return async () => ({ data: null, error: new Error('Supabase is not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY and redeploy.') });
    },
  });

  return new Proxy({}, {
    get: (_target, method: string) => {
      if (method === 'auth') return unsupportedAuth;
      if (method === 'from') return (..._args: unknown[]) => queryBuilder;
      if (method === 'rpc') return (..._args: unknown[]) => queryBuilder;
      if (method === 'functions') return { invoke: fail };
      if (method === 'channel') return () => ({ on: () => ({ subscribe: () => ({ unsubscribe: () => undefined }) }), subscribe: () => ({ unsubscribe: () => undefined }) });
      if (method === 'removeChannel') return async () => ({ error: null });
      return undefined;
    },
  }) as SupabaseClient<Database>;
}

export const supabase: SupabaseClient<Database> = isSupabaseConfigured
  ? createClient<Database>(SUPABASE_URL!, SUPABASE_PUBLISHABLE_KEY!, {
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
    })
  : createUnconfiguredClient();
