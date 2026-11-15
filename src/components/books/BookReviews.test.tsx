import React from 'react';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import BookReviews from '@/components/books/BookReviews';
import * as authHelpers from '@/contexts/authHelpers';
import * as reviewHooks from '@/hooks/useBookReviews';

describe('BookReviews', () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  const mockReviews = [
    {
      id: 'rev-1',
      book_id: 'book-1',
      user_id: 'u-other',
      profile_name: 'Reader One',
      profile_avatar: null,
      review_text: 'A thrilling masterpiece of literature.',
      contains_spoilers: false,
      overall_rating: 5,
      plot_rating: 5,
      characters_rating: 4,
      writing_rating: 5,
      reader_reaction: 'loved',
      dimensions: [{ dimension: 'writing', score: 5 }],
      created_at: '2026-01-01T12:00:00Z',
      updated_at: '2026-01-01T12:00:00Z',
    },
    {
      id: 'rev-2',
      book_id: 'book-1',
      user_id: 'u-spoiler',
      profile_name: 'Reader Two',
      profile_avatar: null,
      review_text: 'Major plot twist at the end!',
      contains_spoilers: true,
      overall_rating: 4,
      plot_rating: 4,
      characters_rating: 4,
      writing_rating: 4,
      reader_reaction: 'surprised',
      dimensions: [{ dimension: 'plot', score: 4 }],
      created_at: '2026-01-02T12:00:00Z',
      updated_at: '2026-01-02T12:00:00Z',
    },
  ];

  it('renders reviews analytics, review cards, and spoiler masking', () => {
    vi.spyOn(authHelpers, 'useAuth').mockReturnValue({ user: null } as any);
    vi.spyOn(reviewHooks, 'useBookReviews').mockReturnValue({
      data: mockReviews,
      isLoading: false,
      error: null,
    } as any);
    vi.spyOn(reviewHooks, 'useReviewHelpfulVotes').mockReturnValue({ data: [] } as any);
    vi.spyOn(reviewHooks, 'useToggleReviewHelpfulVote').mockReturnValue({ mutate: vi.fn() } as any);
    vi.spyOn(reviewHooks, 'useSaveBookReview').mockReturnValue({ mutateAsync: vi.fn() } as any);
    vi.spyOn(reviewHooks, 'useDeleteBookReview').mockReturnValue({ mutateAsync: vi.fn() } as any);

    render(
      <MemoryRouter>
        <BookReviews bookId="book-1" />
      </MemoryRouter>
    );

    expect(screen.getByText('Reader reviews')).toBeInTheDocument();
    expect(screen.getByText(/Community snapshot/i)).toBeInTheDocument();
    expect(screen.getByText('A thrilling masterpiece of literature.')).toBeInTheDocument();
    expect(screen.getByText('Spoiler hidden — reveal only if you want to continue.')).toBeInTheDocument();

    const revealBtn = screen.getByRole('button', { name: /reveal spoilers/i });
    fireEvent.click(revealBtn);
    expect(screen.getByText('Major plot twist at the end!')).toBeInTheDocument();
  });

  it('renders authenticated user review and allows editing', async () => {
    const myReview = {
      id: 'rev-my',
      book_id: 'book-1',
      user_id: 'my-user-id',
      profile_name: 'Me',
      review_text: 'I loved this book very much.',
      contains_spoilers: false,
      overall_rating: 5,
      created_at: '2026-01-03T12:00:00Z',
      updated_at: '2026-01-03T12:00:00Z',
    };

    vi.spyOn(authHelpers, 'useAuth').mockReturnValue({ user: { id: 'my-user-id' } } as any);
    vi.spyOn(reviewHooks, 'useBookReviews').mockReturnValue({
      data: [...mockReviews, myReview],
      isLoading: false,
      error: null,
    } as any);
    vi.spyOn(reviewHooks, 'useReviewHelpfulVotes').mockReturnValue({ data: [] } as any);
    vi.spyOn(reviewHooks, 'useToggleReviewHelpfulVote').mockReturnValue({ mutate: vi.fn() } as any);
    const saveMock = vi.fn().mockResolvedValue({});
    vi.spyOn(reviewHooks, 'useSaveBookReview').mockReturnValue({ mutateAsync: saveMock } as any);
    const deleteMock = vi.fn().mockResolvedValue({});
    vi.spyOn(reviewHooks, 'useDeleteBookReview').mockReturnValue({ mutateAsync: deleteMock } as any);

    render(
      <MemoryRouter>
        <BookReviews bookId="book-1" />
      </MemoryRouter>
    );

    expect(screen.getByText('Your review')).toBeInTheDocument();
    expect(screen.getByText('I loved this book very much.')).toBeInTheDocument();

    const editBtn = screen.getByRole('button', { name: /edit/i });
    fireEvent.click(editBtn);

    expect(screen.getByText('Edit your review')).toBeInTheDocument();
  });
});
