// @vitest-environment jsdom
import React from 'react';
import '@testing-library/jest-dom/vitest';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import MyPublications from './MyPublications';
import * as publishHook from '@/hooks/usePublishBook';

vi.mock('@/components/SEO', () => ({
  default: () => null,
}));

vi.mock('@/components/Breadcrumb', () => ({
  default: () => <nav data-testid="breadcrumb" />,
}));

describe('MyPublications', () => {
  const mockSubmitForReview = { mutate: vi.fn(), isPending: false };
  const mockDeleteBook = { mutate: vi.fn(), isPending: false };

  beforeEach(() => {
    vi.restoreAllMocks();
    vi.spyOn(publishHook, 'usePublishBook').mockReturnValue({
      submitForReview: mockSubmitForReview,
      deleteBook: mockDeleteBook,
    } as any);
  });

  afterEach(() => {
    cleanup();
  });

  it('renders empty state when user has no publications', () => {
    vi.spyOn(publishHook, 'useMyPublications').mockReturnValue({
      data: [],
      isLoading: false,
    } as any);

    render(
      <MemoryRouter>
        <MyPublications />
      </MemoryRouter>
    );

    expect(screen.getByRole('heading', { name: 'My Publications' })).toBeInTheDocument();
    expect(screen.getByText('No publications yet')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Publish Your First Book' })).toBeInTheDocument();
  });

  it('renders list of user publications with action buttons', () => {
    const mockBooks = [
      {
        id: 'pub-1',
        title: 'My First Novella',
        author_name: 'Author Me',
        status: 'draft',
        genre: 'Fantasy',
        file_size: 1048576,
        reading_time_minutes: 45,
        description: 'A magical journey.',
      },
    ];

    vi.spyOn(publishHook, 'useMyPublications').mockReturnValue({
      data: mockBooks,
      isLoading: false,
    } as any);

    render(
      <MemoryRouter>
        <MyPublications />
      </MemoryRouter>
    );

    expect(screen.getByText('My First Novella')).toBeInTheDocument();
    expect(screen.getByText('by Author Me')).toBeInTheDocument();
    expect(screen.getByText('Draft')).toBeInTheDocument();

    const submitBtn = screen.getByRole('button', { name: /Submit/i });
    fireEvent.click(submitBtn);
    expect(mockSubmitForReview.mutate).toHaveBeenCalledWith('pub-1');

    const deleteBtn = screen.getByRole('button', { name: /Delete/i });
    fireEvent.click(deleteBtn);
    expect(mockDeleteBook.mutate).toHaveBeenCalledWith('pub-1');
  });
});

