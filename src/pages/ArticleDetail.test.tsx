// @vitest-environment jsdom
import React from 'react';
import '@testing-library/jest-dom/vitest';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import ArticleDetail from './ArticleDetail';
import * as articlesHook from '@/hooks/useArticles';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/authHelpers';

vi.mock('@/components/SEO', () => ({
  default: () => null,
}));

vi.mock('@/components/ui/BookFlipLoader', () => ({
  default: () => <div>Loading article...</div>,
}));

vi.mock('@/components/articles/MarkdownPreview', () => ({
  default: ({ content }: any) => <div data-testid="markdown-preview">{content}</div>,
}));

vi.mock('@/components/articles/ReadingProgress', () => ({
  default: () => null,
}));

vi.mock('@/components/articles/ArticleLikeButton', () => ({
  default: () => <button>Like</button>,
}));

vi.mock('@/components/articles/ArticleComments', () => ({
  default: () => <div>Comments</div>,
}));

vi.mock('@/components/articles/FollowAuthorButton', () => ({
  default: () => <button>Follow</button>,
}));

vi.mock('@/components/articles/BookmarkButton', () => ({
  default: () => <button>Bookmark</button>,
}));

vi.mock('@/components/articles/ShareButton', () => ({
  default: () => <button>Share</button>,
}));

vi.mock('@/components/articles/CopyArticleButton', () => ({
  default: () => <button>Copy</button>,
}));

vi.mock('@/components/articles/TableOfContents', () => ({
  default: () => <div>TOC</div>,
}));

vi.mock('@/components/articles/RelatedArticles', () => ({
  default: () => <div>Related</div>,
}));

vi.mock('@/contexts/authHelpers', () => ({
  useAuth: vi.fn(),
}));

describe('ArticleDetail', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
      },
    });
    vi.restoreAllMocks();
    sessionStorage.clear();
    vi.mocked(useAuth).mockReturnValue({ user: null } as any);
  });

  afterEach(() => {
    cleanup();
  });

  it('renders loading state while article is loading', () => {
    vi.spyOn(articlesHook, 'useArticleBySlug').mockReturnValue({
      data: null,
      isLoading: true,
      error: null,
    } as any);

    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={['/articles/test-article']}>
          <Routes>
            <Route path="/articles/:slug" element={<ArticleDetail />} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>
    );

    expect(screen.getByText('Loading article...')).toBeInTheDocument();
  });

  it('renders not found state when article does not exist', () => {
    vi.spyOn(articlesHook, 'useArticleBySlug').mockReturnValue({
      data: null,
      isLoading: false,
      error: new Error('Article not found'),
    } as any);

    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={['/articles/missing-article']}>
          <Routes>
            <Route path="/articles/:slug" element={<ArticleDetail />} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>
    );

    expect(screen.getByRole('heading', { name: 'Article not found' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Back to Articles/i })).toHaveAttribute('href', '/articles');
  });

  it('renders article details and content when found', () => {
    const rpcSpy = vi.spyOn(supabase, 'rpc').mockResolvedValue({ data: null, error: null } as any);

    vi.spyOn(articlesHook, 'useArticleBySlug').mockReturnValue({
      data: {
        id: 'art-1',
        slug: 'the-art-of-reading',
        title: 'The Art of Reading Slowly',
        subtitle: 'Why deep contemplation matters in modern times',
        content: '# Deep Reading\nTake your time.',
        author_name: 'Harold Bloom',
        published_at: '2026-11-01T00:00:00Z',
        views_count: 142,
        reading_time_minutes: 5,
        category: 'Literary',
        cover_image_url: 'https://example.com/broken-cover.jpg',
        tags: ['Contemplation', 'Philosophy'],
      },
      isLoading: false,
      error: null,
    } as any);

    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={['/articles/the-art-of-reading']}>
          <Routes>
            <Route path="/articles/:slug" element={<ArticleDetail />} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>
    );

    expect(screen.getByRole('heading', { level: 1, name: 'The Art of Reading Slowly' })).toBeInTheDocument();
    expect(screen.getByText('Why deep contemplation matters in modern times')).toBeInTheDocument();
    expect(screen.getByText('Contemplation')).toBeInTheDocument();
    expect(screen.getByText('Philosophy')).toBeInTheDocument();

    const img = screen.getByRole('img');
    expect(img).toBeInTheDocument();
    img.dispatchEvent(new Event('error'));
    expect(img.style.display).toBe('none');

    expect(rpcSpy).toHaveBeenCalledWith('increment_article_views', { _article_id: 'art-1' });
  });
});

