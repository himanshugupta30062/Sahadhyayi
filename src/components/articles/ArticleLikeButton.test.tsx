import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { afterEach, describe, expect, it, vi } from 'vitest';
import ArticleLikeButton from '@/components/articles/ArticleLikeButton';
import * as authHelpers from '@/contexts/authHelpers';
import * as articleSocialHooks from '@/hooks/useArticleSocial';

describe('ArticleLikeButton', () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('renders disabled button with tooltip for unauthenticated user', () => {
    vi.spyOn(authHelpers, 'useAuth').mockReturnValue({ user: null } as any);
    vi.spyOn(articleSocialHooks, 'useArticleLikes').mockReturnValue({
      count: 10,
      hasLiked: false,
      isLoading: false,
    } as any);
    vi.spyOn(articleSocialHooks, 'useToggleArticleLike').mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
    } as any);

    render(<ArticleLikeButton articleId="art-1" />);

    const btn = screen.getByRole('button', { name: /like article/i });
    expect(btn).toBeDisabled();
    expect(screen.getByText('10')).toBeInTheDocument();
  });

  it('toggles like optimistically and calls mutate for logged in user', () => {
    const mutate = vi.fn();
    vi.spyOn(authHelpers, 'useAuth').mockReturnValue({ user: { id: 'u1' } } as any);
    vi.spyOn(articleSocialHooks, 'useArticleLikes').mockReturnValue({
      count: 5,
      hasLiked: false,
      isLoading: false,
    } as any);
    vi.spyOn(articleSocialHooks, 'useToggleArticleLike').mockReturnValue({
      mutate,
      isPending: false,
    } as any);

    render(<ArticleLikeButton articleId="art-1" />);

    const btn = screen.getByRole('button', { name: /like article/i });
    expect(btn).not.toBeDisabled();
    expect(screen.getByText('5')).toBeInTheDocument();

    fireEvent.click(btn);
    expect(screen.getByText('6')).toBeInTheDocument();
    expect(mutate).toHaveBeenCalledWith(
      { articleId: 'art-1', hasLiked: false },
      expect.any(Object)
    );
  });
});
