import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { afterEach, describe, expect, it, vi } from 'vitest';
import ArticleComments from '@/components/articles/ArticleComments';
import * as authHelpers from '@/contexts/authHelpers';
import * as articleSocialHooks from '@/hooks/useArticleSocial';

describe('ArticleComments', () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  const mockComments = [
    {
      id: 'c1',
      article_id: 'a1',
      user_id: 'u1',
      content: 'Fascinating perspective on literature!',
      author_name: 'Alice',
      author_avatar: '/alice.jpg',
      created_at: '2026-01-01T10:00:00Z',
      updated_at: '2026-01-01T10:00:00Z',
      parent_id: null,
    },
    {
      id: 'c2',
      article_id: 'a1',
      user_id: 'u2',
      content: 'I agree with Alice completely.',
      author_name: 'Bob',
      author_avatar: null,
      created_at: '2026-01-01T11:00:00Z',
      updated_at: '2026-01-01T11:00:00Z',
      parent_id: 'c1',
    },
  ];

  it('renders comments and replies in threaded structure', () => {
    vi.spyOn(authHelpers, 'useAuth').mockReturnValue({ user: null } as any);
    vi.spyOn(articleSocialHooks, 'useArticleComments').mockReturnValue({
      data: mockComments,
      isLoading: false,
    } as any);
    vi.spyOn(articleSocialHooks, 'useCreateComment').mockReturnValue({ mutate: vi.fn() } as any);
    vi.spyOn(articleSocialHooks, 'useDeleteComment').mockReturnValue({ mutate: vi.fn() } as any);
    vi.spyOn(articleSocialHooks, 'useUpdateComment').mockReturnValue({ mutate: vi.fn() } as any);

    render(<ArticleComments articleId="a1" />);

    expect(screen.getByText('Alice')).toBeInTheDocument();
    expect(screen.getByText('Fascinating perspective on literature!')).toBeInTheDocument();
    expect(screen.getByText('Bob')).toBeInTheDocument();
    expect(screen.getByText('I agree with Alice completely.')).toBeInTheDocument();
    expect(screen.getByText('Sign in to join the discussion')).toBeInTheDocument();
  });

  it('allows authenticated user to type and submit a comment', () => {
    const createMutate = vi.fn();
    vi.spyOn(authHelpers, 'useAuth').mockReturnValue({ user: { id: 'u1', email: 'alice@example.com' } } as any);
    vi.spyOn(articleSocialHooks, 'useArticleComments').mockReturnValue({
      data: mockComments,
      isLoading: false,
    } as any);
    vi.spyOn(articleSocialHooks, 'useCreateComment').mockReturnValue({ mutate: createMutate } as any);
    vi.spyOn(articleSocialHooks, 'useDeleteComment').mockReturnValue({ mutate: vi.fn() } as any);
    vi.spyOn(articleSocialHooks, 'useUpdateComment').mockReturnValue({ mutate: vi.fn() } as any);

    render(<ArticleComments articleId="a1" />);

    const textarea = screen.getByPlaceholderText('Share your thoughts...');
    fireEvent.change(textarea, { target: { value: 'Great read, thanks!' } });

    const postBtn = screen.getByRole('button', { name: /comment/i });
    fireEvent.click(postBtn);

    expect(createMutate).toHaveBeenCalledWith(
      { articleId: 'a1', content: 'Great read, thanks!' },
      expect.any(Object)
    );
  });
});
