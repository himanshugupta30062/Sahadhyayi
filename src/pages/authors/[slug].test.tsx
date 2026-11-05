// @vitest-environment jsdom
import React from 'react';
import '@testing-library/jest-dom/vitest';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import AuthorSlugPage from './[slug]';
import * as authorSlugHook from '@/hooks/useAuthorBySlug';
import * as authorBooksHook from '@/hooks/useAuthorBooks';
import * as authorPostsHook from '@/hooks/useAuthorPosts';
import * as authorQuestionsHook from '@/hooks/useAuthorQuestions';
import * as authorEventsHook from '@/hooks/useAuthorEvents';
import { useAuth } from '@/contexts/authHelpers';

vi.mock('@/components/SEO', () => ({
  default: () => null,
}));

vi.mock('@/components/Breadcrumb', () => ({
  default: () => <nav data-testid="breadcrumb" />,
}));

vi.mock('../NotFound', () => ({
  default: () => <div>Author Not Found Component</div>,
}));

vi.mock('@/components/authors/FollowButton', () => ({
  FollowButton: () => <button>Follow</button>,
}));

vi.mock('@/components/authors/VerificationBadge', () => ({
  VerificationBadge: () => null,
}));

vi.mock('@/components/SocialShare', () => ({
  default: () => null,
}));

vi.mock('@/contexts/authHelpers', () => ({
  useAuth: vi.fn(),
}));

describe('AuthorSlugPage', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.mocked(useAuth).mockReturnValue({ user: null } as any);
    vi.spyOn(authorBooksHook, 'useAuthorBooks').mockReturnValue({ data: [], isLoading: false } as any);
    vi.spyOn(authorPostsHook, 'useAuthorPosts').mockReturnValue({ data: [], isLoading: false } as any);
    vi.spyOn(authorQuestionsHook, 'useAuthorQuestions').mockReturnValue({ data: [], isLoading: false } as any);
    vi.spyOn(authorEventsHook, 'useAuthorEvents').mockReturnValue({ data: [], isLoading: false } as any);
  });

  afterEach(() => {
    cleanup();
  });

  it('renders loading indicator while loading', () => {
    vi.spyOn(authorSlugHook, 'useAuthorBySlug').mockReturnValue({
      data: null,
      isLoading: true,
    } as any);

    render(
      <MemoryRouter initialEntries={['/authors/tagore']}>
        <Routes>
          <Route path="/authors/:slug" element={<AuthorSlugPage />} />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText('Loading author...')).toBeInTheDocument();
  });

  it('renders NotFound component when author is not found', () => {
    vi.spyOn(authorSlugHook, 'useAuthorBySlug').mockReturnValue({
      data: null,
      isLoading: false,
    } as any);

    render(
      <MemoryRouter initialEntries={['/authors/non-existent']}>
        <Routes>
          <Route path="/authors/:slug" element={<AuthorSlugPage />} />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText('Author Not Found Component')).toBeInTheDocument();
  });

  it('renders author profile when author is found', () => {
    vi.spyOn(authorSlugHook, 'useAuthorBySlug').mockReturnValue({
      data: {
        id: 'auth-1',
        name: 'Rabindranath Tagore',
        bio: 'Polymath, poet, musician, and artist.',
        location: 'Kolkata, India',
        books_count: 50,
        followers_count: 5000,
      },
      isLoading: false,
    } as any);

    render(
      <MemoryRouter initialEntries={['/authors/rabindranath-tagore']}>
        <Routes>
          <Route path="/authors/:slug" element={<AuthorSlugPage />} />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByRole('heading', { level: 1, name: 'Rabindranath Tagore' })).toBeInTheDocument();
    expect(screen.getByText('Polymath, poet, musician, and artist.')).toBeInTheDocument();
    expect(screen.getByText('Kolkata, India')).toBeInTheDocument();
  });
});

