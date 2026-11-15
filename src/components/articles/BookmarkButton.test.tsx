import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import BookmarkButton from './BookmarkButton';

const mockMutate = vi.fn();
vi.mock('@/contexts/authHelpers', () => ({
  useAuth: () => ({ user: { id: 'user-abc' } }),
}));

vi.mock('@/hooks/useArticleBookmarks', () => ({
  useIsBookmarked: () => ({ data: false, isLoading: false }),
  useToggleBookmark: () => ({ mutate: mockMutate, isPending: false }),
}));

describe('BookmarkButton', () => {
  it('renders bookmark button and triggers mutation on click', () => {
    render(<BookmarkButton articleId="art-1" variant="full" />);
    const button = screen.getByRole('button', { name: /save article/i });
    expect(button).toBeInTheDocument();

    fireEvent.click(button);
    expect(mockMutate).toHaveBeenCalledWith({
      articleId: 'art-1',
      isBookmarked: false,
    });
  });
});
