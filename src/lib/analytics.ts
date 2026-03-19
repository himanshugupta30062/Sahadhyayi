import { supabase } from '@/integrations/supabase/client-universal';

type AnalyticsMetadata = Record<string, string | number | boolean | null | undefined>;

const sanitizeValue = (value: string) => value.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 64);

export const trackUiEvent = async (eventName: string, metadata: AnalyticsMetadata = {}) => {
  if (typeof window === 'undefined') return;

  try {
    const serializedMeta = Object.entries(metadata)
      .filter(([, value]) => value !== undefined)
      .map(([key, value]) => `${sanitizeValue(key)}:${sanitizeValue(String(value ?? 'null'))}`)
      .join(',');

    const payload = [
      window.location.pathname,
      `event=${sanitizeValue(eventName)}`,
      serializedMeta ? `meta=${serializedMeta}` : null,
    ]
      .filter(Boolean)
      .join('#');

    await supabase.functions.invoke('website-clicks', {
      body: {
        page_url: payload,
      },
    });
  } catch {
    // Non-blocking analytics
  }
};

