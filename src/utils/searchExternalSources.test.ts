import { describe, expect, it, vi, beforeEach } from 'vitest';
import { searchExternalSources } from './searchExternalSources';
import { supabase } from '@/integrations/supabase/client';

const mockInvoke = vi.fn();

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    functions: {
      invoke: (...args: any[]) => mockInvoke(...args),
    },
  },
}));

describe('searchExternalSources', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    mockInvoke.mockReset();
  });

  it('invokes search-books-preview and maps books with pdf_url to ExternalBook', async () => {
    mockInvoke.mockResolvedValue({
      data: {
        books: [
          {
            title: 'Siddhartha',
            author: 'Hermann Hesse',
            publication_year: 1922,
            language: 'English',
            pages: 152,
            pdf_url: 'https://example.com/siddhartha.pdf',
            isbn: '9780553208849',
          },
          {
            title: 'No PDF Book',
            author: 'Anonymous',
          },
        ],
      },
      error: null,
    });

    const result = await searchExternalSources('Hesse');

    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({
      id: '9780553208849-pdf',
      title: 'Siddhartha',
      author: 'Hermann Hesse',
      year: '1922',
      language: 'English',
      extension: 'pdf',
      size: '152 pages',
      md5: '9780553208849',
      downloadUrl: 'https://example.com/siddhartha.pdf',
      source: 'open_access',
      format: 'pdf',
    });
  });

  it('handles empty books response', async () => {
    mockInvoke.mockResolvedValue({
      data: { books: [] },
      error: null,
    });

    const result = await searchExternalSources('unknown');
    expect(result).toEqual([]);
  });

  it('returns empty array when invoke returns an error', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    mockInvoke.mockResolvedValue({
      data: null,
      error: new Error('Edge function failed'),
    });

    const result = await searchExternalSources('error');
    expect(result).toEqual([]);
    expect(errorSpy).toHaveBeenCalled();
  });
});
