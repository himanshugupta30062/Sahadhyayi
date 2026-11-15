import { describe, it, expect, vi } from 'vitest';
import { uploadBookCover } from './useBookCoverUpload';
import { supabase } from '@/integrations/supabase/client-universal';

vi.mock('@/integrations/supabase/client-universal', () => ({
  supabase: {
    storage: {
      createBucket: vi.fn().mockResolvedValue({ error: null }),
      from: vi.fn().mockReturnValue({
        upload: vi.fn().mockResolvedValue({ error: null }),
        getPublicUrl: vi.fn().mockReturnValue({
          data: { publicUrl: 'https://example.com/cover.webp' },
        }),
      }),
    },
  },
}));

describe('uploadBookCover', () => {
  it('throws an error if file is not an image', async () => {
    const textFile = new File(['hello'], 'test.txt', { type: 'text/plain' });
    await expect(uploadBookCover(textFile, 'book-123')).rejects.toThrow(
      'Only image uploads allowed'
    );
  });

  it('uploads valid image file and returns public url', async () => {
    const imageFile = new File(['imagebytes'], 'cover.png', { type: 'image/png' });
    const url = await uploadBookCover(imageFile, 'book-123');
    expect(url).toBe('https://example.com/cover.webp');
    expect(supabase.storage.from).toHaveBeenCalledWith('book-covers');
  });
});
