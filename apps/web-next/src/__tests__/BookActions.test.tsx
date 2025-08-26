import { render, screen, fireEvent, waitFor, cleanup, act } from '@testing-library/react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import BookActions from '../components/library/BookActions';

vi.mock('../lib/supabase/userBooks', () => {
  return {
    getStatus: vi.fn().mockResolvedValue(null),
    setStatus: vi.fn().mockResolvedValue(undefined),
    toggleWishlist: vi.fn().mockResolvedValue(true),
  };
});

vi.mock('../lib/supabase/notes', () => {
  return {
    getNote: vi.fn().mockResolvedValue(''),
    upsertNote: vi.fn().mockResolvedValue(undefined),
  };
});

vi.mock('../integrations/supabase/client', () => {
  return {
    supabase: {
      from: vi.fn(() => ({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({ data: null }),
        insert: vi.fn().mockResolvedValue({}),
      })),
    },
  };
});

import { setStatus, toggleWishlist } from '../lib/supabase/userBooks';

describe('BookActions', () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });
  it('adds book to library', async () => {
    render(<BookActions bookId="1" />);
    const addBtn = await screen.findByTestId('add-btn');
    fireEvent.click(addBtn);
    await waitFor(() => {
      expect(setStatus).toHaveBeenCalledWith('1', 'to_read');
    });
  });

  it('toggles wishlist', async () => {
    render(<BookActions bookId="1" />);
    const wishBtn = await screen.findByTestId('wishlist-btn');
    fireEvent.click(wishBtn);
    await waitFor(() => {
      expect(toggleWishlist).toHaveBeenCalledWith('1');
    });
  });

});

