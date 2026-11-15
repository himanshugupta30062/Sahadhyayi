import { describe, expect, it, vi, afterEach } from 'vitest';

vi.mock('@/integrations/supabase/client-universal', () => ({
  supabase: {
    functions: {
      invoke: vi.fn(),
    },
  },
}));

import { logBookEvent } from '@/lib/supabase/events';
import { supabase } from '@/integrations/supabase/client-universal';

describe('logBookEvent', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('invokes log_book_event edge function with correct parameters', async () => {
    vi.mocked(supabase.functions.invoke).mockResolvedValue({
      data: { views: 10, downloads: 2 },
      error: null,
    } as any);

    const result = await logBookEvent('book-100', 'view');
    expect(result).toEqual({ views: 10, downloads: 2 });
    expect(supabase.functions.invoke).toHaveBeenCalledWith('log_book_event', {
      body: { book_id: 'book-100', event_type: 'view' },
    });
  });

  it('throws an error if edge function invocation fails', async () => {
    vi.mocked(supabase.functions.invoke).mockResolvedValue({
      data: null,
      error: new Error('Network error'),
    } as any);

    await expect(logBookEvent('book-100', 'download')).rejects.toThrow('Network error');
  });
});
