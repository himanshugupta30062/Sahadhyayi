// @vitest-environment jsdom
import React from 'react';
import '@testing-library/jest-dom/vitest';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import AuthorDetails from './AuthorDetails';
import * as authorSlugHook from '@/hooks/useAuthorBySlug';
import * as authorBooksHook from '@/hooks/useAuthorBooks';
import { useAuth } from '@/contexts/authHelpers';

vi.mock('@/components/SEO', () => ({
  default: () => null,
}));

vi.mock('@/components/ui/BookFlipLoader', () => ({
  default: () => <div>Loading author...</div>,
}));

vi.mock('@/components/authors/FollowButton', () => ({
  FollowButton: () => <button>Follow</button>,
}));

vi.mock('@/components/authors/VerificationBadge', () => ({
  VerificationBadge: () => <span>Verified</span>,
}));

vi.mock('@/contexts/authHelpers', () => ({
  useAuth: vi.fn(),
}));

describe('AuthorDetails', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.mocked(useAuth).mockReturnValue({ user: null } as any);
  });

  afterEach(() => {
    cleanup();
  });

  it('renders loading state while loading author', () => {
    vi.spyOn(authorSlugHook, 'useAuthorBySlug').mockReturnValue({
      data: null,
      isLoading: true,
      error: null,
    } as any);
    vi.spyOn(authorBooksHook, 'useAuthorBooks').mockReturnValue({
      data: [],
      isLoading: false,
    } as any);

    render(
      <MemoryRouter initialEntries={['/authors/george-orwell']}>
        <Routes>
          <Route path="/authors/:slug" element={<AuthorDetails />} />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText('Loading author...')).toBeInTheDocument();
  });

  it('renders not found state when author does not exist', () => {
    vi.spyOn(authorSlugHook, 'useAuthorBySlug').mockReturnValue({
      data: null,
      isLoading: false,
      error: new Error('Not found'),
    } as any);
    vi.spyOn(authorBooksHook, 'useAuthorBooks').mockReturnValue({
      data: [],
      isLoading: false,
    } as any);

    render(
      <MemoryRouter initialEntries={['/authors/unknown-author']}>
        <Routes>
          <Route path="/authors/:slug" element={<AuthorDetails />} />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByRole('heading', { name: 'Author Not Found' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Browse Authors/i })).toHaveAttribute('href', '/authors');
  });

  it('renders author profile and books when author is found', () => {
    vi.spyOn(authorSlugHook, 'useAuthorBySlug').mockReturnValue({
      data: {
        id: 'author-1',
        name: 'George Orwell',
        bio: 'English novelist and essayist, journalist and critic.',
        avatar_url: 'https://example.com/orwell.jpg',
        followers_count: 1200,
        birth_date: '1903-06-25',
        death_date: '1950-01-21',
        nationality: 'British',
      },
      isLoading: false,
      error: null,
    } as any);

    vi.spyOn(authorBooksHook, 'useAuthorBooks').mockReturnValue({
      data: [
        {
          id: 'book-1',
          title: 'Animal Farm',
          cover_image_url: 'https://example.com/animal-farm.jpg',
          rating: 4.8,
        },
      ],
      isLoading: false,
    } as any);

    render(
      <MemoryRouter initialEntries={['/authors/george-orwell']}>
        <Routes>
          <Route path="/authors/:slug" element={<AuthorDetails />} />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByRole('heading', { level: 1, name: 'George Orwell' })).toBeInTheDocument();
    expect(screen.getByText(/English novelist and essayist/i)).toBeInTheDocument();
    expect(screen.getByText('Animal Farm')).toBeInTheDocument();
  });
});

