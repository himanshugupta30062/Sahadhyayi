import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import BookExperienceTags from '@/components/books/BookExperienceTags';
import * as authHelpers from '@/contexts/authHelpers';
import * as bookExpHooks from '@/hooks/useBookExperience';

describe('BookExperienceTags', () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('renders sign in prompt when user is not logged in', () => {
    vi.spyOn(authHelpers, 'useAuth').mockReturnValue({ user: null } as any);
    vi.spyOn(bookExpHooks, 'useBookExperience').mockReturnValue({
      data: null,
      isLoading: false,
      save: { mutate: vi.fn(), isPending: false } as any,
    });

    render(
      <MemoryRouter>
        <BookExperienceTags bookId="book-123" />
      </MemoryRouter>
    );

    expect(screen.getByText('Track your reading experience')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Sign in' })).toBeInTheDocument();
  });

  it('renders experience form and toggles selections when authenticated', () => {
    const mutate = vi.fn();
    vi.spyOn(authHelpers, 'useAuth').mockReturnValue({ user: { id: 'u1' } } as any);
    vi.spyOn(bookExpHooks, 'useBookExperience').mockReturnValue({
      data: { moods: ['inspiring'], pacing: 'medium', content_warnings: [], custom_warning: '' },
      isLoading: false,
      save: { mutate, isPending: false } as any,
    });

    render(
      <MemoryRouter>
        <BookExperienceTags bookId="book-123" />
      </MemoryRouter>
    );

    expect(screen.getByText('Your reading experience')).toBeInTheDocument();

    const saveBtn = screen.getByRole('button', { name: 'Save' });
    fireEvent.click(saveBtn);
    expect(mutate).toHaveBeenCalled();
  });
});
