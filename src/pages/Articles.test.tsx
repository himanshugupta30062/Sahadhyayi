/** @vitest-environment jsdom */
import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import '@testing-library/jest-dom/vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Articles from './Articles';
import * as articlesHook from '@/hooks/useArticles';
import * as authHook from '@/contexts/authHelpers';

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

const mockArticles = [
  {
    id: 'art-1',
    slug: 'the-art-of-reading-deeply',
    title: 'The Art of Reading Deeply',
    subtitle: 'Why slow reading is the ultimate superpower in a distracted world',
    content: 'Full article text here...',
    author_name: 'Aarav Sharma',
    author_id: 'user-1',
    author_avatar_url: 'https://example.com/avatar.jpg',
    tags: ['reading', 'mindfulness', 'philosophy'],
    published_at: new Date('2026-10-01').toISOString(),
    likes_count: 42,
    views_count: 120,
    cover_image_url: 'https://example.com/cover1.jpg',
  },
  {
    id: 'art-2',
    slug: 'science-and-society',
    title: 'Science and Society',
    subtitle: 'Connecting the dots between discovery and social progress',
    content: 'Scientific breakthroughs shape civilization...',
    author_name: 'Priya Patel',
    author_id: 'user-2',
    tags: ['science', 'society'],
    published_at: new Date('2026-09-15').toISOString(),
    likes_count: 15,
    views_count: 80,
  },
  {
    id: 'art-3',
    slug: 'literary-criticism-modernism',
    title: 'Modernism Revisited',
    subtitle: 'A fresh perspective on early 20th century classics',
    content: 'Modernist literature redefined narrative...',
    author_name: 'David Miller',
    author_id: 'user-3',
    tags: ['criticism', 'literature'],
    published_at: new Date('2026-08-20').toISOString(),
    likes_count: 55,
    views_count: 300,
  },
];

describe('Articles Page', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    mockNavigate.mockClear();
    vi.spyOn(authHook, 'useAuth').mockReturnValue({
      user: { id: 'test-user', email: 'test@example.com' } as any,
      session: {} as any,
      loading: false,
      signIn: vi.fn(),
      signOut: vi.fn(),
      signUp: vi.fn(),
      signInWithOAuth: vi.fn(),
      resetPassword: vi.fn(),
    });
  });

  afterEach(() => {
    cleanup();
  });

  it('renders loading state when articles are fetching', () => {
    vi.spyOn(articlesHook, 'usePublishedArticles').mockReturnValue({
      data: undefined,
      isLoading: true,
      error: null,
    } as any);

    render(
      <MemoryRouter>
        <Articles />
      </MemoryRouter>
    );

    expect(screen.getByText('Loading articles...')).toBeInTheDocument();
  });

  it('renders list of articles with featured article, author and tags', () => {
    vi.spyOn(articlesHook, 'usePublishedArticles').mockReturnValue({
      data: mockArticles,
      isLoading: false,
      error: null,
    } as any);

    render(
      <MemoryRouter>
        <Articles />
      </MemoryRouter>
    );

    expect(screen.getByText('The Art of Reading Deeply')).toBeInTheDocument();
    expect(screen.getByText('Science and Society')).toBeInTheDocument();
    expect(screen.getByText('Modernism Revisited')).toBeInTheDocument();
    expect(screen.getAllByText('Aarav Sharma').length).toBeGreaterThan(0);
  });

  it('filters articles based on search query and clears search', () => {
    vi.spyOn(articlesHook, 'usePublishedArticles').mockReturnValue({
      data: mockArticles,
      isLoading: false,
      error: null,
    } as any);

    render(
      <MemoryRouter>
        <Articles />
      </MemoryRouter>
    );

    const searchInput = screen.getAllByLabelText(/Search articles, authors, or tags/i)[0];
    fireEvent.change(searchInput, { target: { value: 'Science' } });

    expect(screen.getByText('Science and Society')).toBeInTheDocument();
    expect(screen.queryByText('Modernism Revisited')).not.toBeInTheDocument();

    const clearButton = screen.getByLabelText(/Clear article search/i);
    fireEvent.click(clearButton);
    expect(screen.getByText('Modernism Revisited')).toBeInTheDocument();
  });

  it('filters articles when clicking a tag', () => {
    vi.spyOn(articlesHook, 'usePublishedArticles').mockReturnValue({
      data: mockArticles,
      isLoading: false,
      error: null,
    } as any);

    render(
      <MemoryRouter>
        <Articles />
      </MemoryRouter>
    );

    const scienceTag = screen.getByRole('button', { name: '#science' });
    fireEvent.click(scienceTag);

    expect(screen.getByText('Science and Society')).toBeInTheDocument();
    expect(screen.queryByText('The Art of Reading Deeply')).not.toBeInTheDocument();

    // Toggle off tag
    fireEvent.click(scienceTag);
    expect(screen.getByText('The Art of Reading Deeply')).toBeInTheDocument();
  });

  it('filters articles by format buttons (All, Book Reviews, Literary Criticism)', () => {
    vi.spyOn(articlesHook, 'usePublishedArticles').mockReturnValue({
      data: mockArticles,
      isLoading: false,
      error: null,
    } as any);

    render(
      <MemoryRouter>
        <Articles />
      </MemoryRouter>
    );

    const reviewsButton = screen.getByRole('button', { name: 'Book Reviews' });
    fireEvent.click(reviewsButton);
    expect(reviewsButton).toBeInTheDocument();

    const allButton = screen.getByRole('button', { name: 'All articles' });
    fireEvent.click(allButton);
    expect(screen.getByText('The Art of Reading Deeply')).toBeInTheDocument();
  });

  it('sorts articles by popular and latest', () => {
    vi.spyOn(articlesHook, 'usePublishedArticles').mockReturnValue({
      data: mockArticles,
      isLoading: false,
      error: null,
    } as any);

    render(
      <MemoryRouter>
        <Articles />
      </MemoryRouter>
    );

    const popularButton = screen.getByRole('button', { name: /Popular/i });
    fireEvent.click(popularButton);
    expect(screen.getByText('Modernism Revisited')).toBeInTheDocument();

    const latestButton = screen.getByRole('button', { name: /Latest/i });
    fireEvent.click(latestButton);
    expect(screen.getByText('The Art of Reading Deeply')).toBeInTheDocument();
  });

  it('shows empty state when no articles match filter', () => {
    vi.spyOn(articlesHook, 'usePublishedArticles').mockReturnValue({
      data: mockArticles,
      isLoading: false,
      error: null,
    } as any);

    render(
      <MemoryRouter>
        <Articles />
      </MemoryRouter>
    );

    const searchInput = screen.getAllByLabelText(/Search articles, authors, or tags/i)[0];
    fireEvent.change(searchInput, { target: { value: 'nonexistentquery12345' } });

    expect(screen.getByText('No matching articles')).toBeInTheDocument();
    const clearFiltersBtn = screen.getByRole('button', { name: 'Clear filters' });
    fireEvent.click(clearFiltersBtn);
    expect(screen.getByText('The Art of Reading Deeply')).toBeInTheDocument();
  });

  it('navigates to write article when write button is clicked by logged in user', () => {
    vi.spyOn(articlesHook, 'usePublishedArticles').mockReturnValue({
      data: mockArticles,
      isLoading: false,
      error: null,
    } as any);

    render(
      <MemoryRouter>
        <Articles />
      </MemoryRouter>
    );

    const writeButton = screen.getAllByRole('button', { name: /Write an article/i })[0];
    fireEvent.click(writeButton);
    expect(mockNavigate).toHaveBeenCalledWith('/articles/write');
  });

  it('navigates to signin when unauthenticated user clicks write button', () => {
    vi.spyOn(authHook, 'useAuth').mockReturnValue({
      user: null,
      session: null,
      loading: false,
      signIn: vi.fn(),
      signOut: vi.fn(),
      signUp: vi.fn(),
      signInWithOAuth: vi.fn(),
      resetPassword: vi.fn(),
    });

    vi.spyOn(articlesHook, 'usePublishedArticles').mockReturnValue({
      data: mockArticles,
      isLoading: false,
      error: null,
    } as any);

    render(
      <MemoryRouter>
        <Articles />
      </MemoryRouter>
    );

    const writeButton = screen.getAllByRole('button', { name: /Write an article/i })[0];
    fireEvent.click(writeButton);
    expect(mockNavigate).toHaveBeenCalledWith('/signin?redirect=%2Farticles%2Fwrite');
  });
});
