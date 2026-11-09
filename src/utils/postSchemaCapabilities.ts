import { supabase } from '@/integrations/supabase/client-universal';

export interface PostSchemaCapabilities {
  hasExtendedColumns: boolean;
  checked: boolean;
}

const POST_SCHEMA_CAPS_STORAGE_KEY = 'sahadhyayi_post_schema_caps_v1';

const DEFAULT_POST_CAPABILITIES: PostSchemaCapabilities = {
  hasExtendedColumns: false,
  checked: false,
};

function readPersistedPostCapabilities(): PostSchemaCapabilities | null {
  if (typeof window !== 'undefined' && window.sessionStorage) {
    try {
      const stored = window.sessionStorage.getItem(POST_SCHEMA_CAPS_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed && typeof parsed === 'object' && typeof parsed.hasExtendedColumns === 'boolean') {
          return parsed as PostSchemaCapabilities;
        }
      }
    } catch {
      // Ignore sessionStorage access errors
    }
  }
  return null;
}

let cachedPostCapabilities: PostSchemaCapabilities =
  readPersistedPostCapabilities() || DEFAULT_POST_CAPABILITIES;
let pendingPostDetectionPromise: Promise<PostSchemaCapabilities> | null = null;

export const setCachedPostCapabilities = (caps: PostSchemaCapabilities) => {
  cachedPostCapabilities = caps;
  if (typeof window !== 'undefined' && window.sessionStorage) {
    try {
      window.sessionStorage.setItem(POST_SCHEMA_CAPS_STORAGE_KEY, JSON.stringify(caps));
    } catch {
      // Ignore sessionStorage write errors
    }
  }
};

export const getCachedPostCapabilities = (): PostSchemaCapabilities => {
  return cachedPostCapabilities;
};

export const resetPostSchemaCapabilities = () => {
  cachedPostCapabilities = { ...DEFAULT_POST_CAPABILITIES };
  if (typeof window !== 'undefined' && window.sessionStorage) {
    try {
      window.sessionStorage.removeItem(POST_SCHEMA_CAPS_STORAGE_KEY);
    } catch {
      // Ignore sessionStorage removal errors
    }
  }
};

/**
 * Return post schema capabilities with zero latency and no failing 400 probes on subsequent calls.
 * Caches results in sessionStorage for the user session.
 */
export async function detectPostSchemaCapabilities(): Promise<PostSchemaCapabilities> {
  if (cachedPostCapabilities && cachedPostCapabilities.checked) {
    return cachedPostCapabilities;
  }

  if (pendingPostDetectionPromise !== null) {
    return pendingPostDetectionPromise;
  }

  pendingPostDetectionPromise = (async () => {
    try {
      // Attempt a lightweight single-column probe for post_kind
      const { error } = await supabase
        .from('posts')
        .select('post_kind, image_alt')
        .limit(1);

      if (!error) {
        cachedPostCapabilities = { hasExtendedColumns: true, checked: true };
      } else if (
        error.code === '42703' ||
        (typeof error.message === 'string' && error.message.toLowerCase().includes('does not exist'))
      ) {
        // 42703 = undefined_column
        cachedPostCapabilities = { hasExtendedColumns: false, checked: true };
      } else if (error.code === '42501' || error.code === 'PGRST116') {
        // 42501 (permission denied) or PGRST116 means PostgREST successfully parsed the column names in schema cache
        cachedPostCapabilities = { hasExtendedColumns: true, checked: true };
      } else {
        cachedPostCapabilities = { hasExtendedColumns: false, checked: true };
      }

      setCachedPostCapabilities(cachedPostCapabilities);
      return cachedPostCapabilities;
    } catch {
      cachedPostCapabilities = { hasExtendedColumns: false, checked: true };
      return cachedPostCapabilities;
    } finally {
      pendingPostDetectionPromise = null;
    }
  })();

  return pendingPostDetectionPromise;
}

export const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function isValidUuid(id: unknown): id is string {
  return typeof id === 'string' && UUID_REGEX.test(id.trim());
}
