/** @vitest-environment jsdom */

import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import '@testing-library/jest-dom/vitest';
import { cleanup, fireEvent, render, screen, waitFor, act } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { EnhancedGlobalSearch } from '@/components/EnhancedGlobalSearch';
import { supabase } from '@/integrations/supabase/client-universal';

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe('EnhancedGlobalSearch Multi-Category Search', () => {
  const onClose = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  afterEach(() => {
    cleanup();
  });

  it('renders input and recent searches when open, handles Esc to close', () => {
    localStorage.setItem('global_recent_searches', JSON.stringify(['Bhagavad Gita', 'Premchand']));

    render(
      <MemoryRouter>
        <EnhancedGlobalSearch isOpen={true} onClose={onClose} />
      </MemoryRouter>
    );

    expect(screen.getByPlaceholderText(/search books, authors, or articles/i)).toBeInTheDocument();
    expect(screen.getByText('Recent Searches')).toBeInTheDocument();
    expect(screen.getByText('Bhagavad Gita')).toBeInTheDocument();
    expect(screen.getByText('Premchand')).toBeInTheDocument();

    // Press Escape
    fireEvent.keyDown(screen.getByPlaceholderText(/search books, authors, or articles/i), {
      key: 'Escape',
      code: 'Escape',
    });
    expect(onClose).toHaveBeenCalled();
  });

  it('searches books, authors, and articles with relevance ranking and category tabs', async () => {
    // Mock Supabase tables
    const mockBooks = [
      { id: '101', title: 'Godan', author: 'Munshi Premchand', genre: 'Fiction', cover_image_url: 'https://example.com/godan.jpg' },
    ];
    const mockAuthors = [
      { id: '201', name: 'Munshi Premchand', bio: 'Pioneering Hindi and Urdu novelist', profile_image_url: null, genres: ['Fiction', 'Classics'], books_count: 14 },
    ];
    const mockArticles = [
      { id: '301', title: 'The Legacy of Premchand', subtitle: 'How realism reshaped literature', slug: 'legacy-of-premchand', cover_image_url: null, reading_time_minutes: 5 },
    ];

    const fromSpy = vi.spyOn(supabase, 'from').mockImplementation((table: string): any => {
      if (table === 'books_library') {
        return {
          select: () => ({
            or: () => ({
              limit: vi.fn().mockResolvedValue({ data: mockBooks, error: null }),
            }),
          }),
        };
      }
      if (table === 'authors') {
        return {
          select: () => ({
            or: () => ({
              limit: vi.fn().mockResolvedValue({ data: mockAuthors, error: null }),
            }),
          }),
        };
      }
      if (table === 'articles') {
        return {
          select: () => ({
            eq: () => ({
              or: () => ({
                limit: vi.fn().mockResolvedValue({ data: mockArticles, error: null }),
              }),
            }),
          }),
        };
      }
      return { select: () => ({ limit: vi.fn().mockResolvedValue({ data: [], error: null }) }) };
    });

    render(
      <MemoryRouter>
        <EnhancedGlobalSearch isOpen={true} onClose={onClose} />
      </MemoryRouter>
    );

    const input = screen.getByPlaceholderText(/search books, authors, or articles/i);

    // Type query
    await act(async () => {
      fireEvent.change(input, { target: { value: 'Premchand' } });
      // Wait for 300ms debounce
      await new Promise((r) => setTimeout(r, 350));
    });

    await waitFor(() => {
      expect(screen.getByText('Godan')).toBeInTheDocument();
      expect(screen.getByText('Munshi Premchand')).toBeInTheDocument();
      expect(screen.getByText('The Legacy of Premchand')).toBeInTheDocument();
    });

    // Check category tabs
    expect(screen.getByRole('button', { name: /all results/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^books/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^authors/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^articles/i })).toBeInTheDocument();

    // Click "Books" filter tab
    fireEvent.click(screen.getByRole('button', { name: /^books/i }));
    expect(screen.getByText('Godan')).toBeInTheDocument();
    expect(screen.queryByText('The Legacy of Premchand')).not.toBeInTheDocument();

    // Click "Authors" filter tab
    fireEvent.click(screen.getByRole('button', { name: /^authors/i }));
    expect(screen.getByText('Munshi Premchand')).toBeInTheDocument();
    expect(screen.queryByText('Godan')).not.toBeInTheDocument();

    fromSpy.mockRestore();
  });

  it('navigates with keyboard ArrowDown and Enter, saving recent search', async () => {
    const mockBooks = [
      { id: '101', title: 'Gaban', author: 'Premchand', genre: 'Fiction' },
    ];

    const fromSpy = vi.spyOn(supabase, 'from').mockImplementation((table: string): any => {
      if (table === 'books_library') {
        return {
          select: () => ({
            or: () => ({
              limit: vi.fn().mockResolvedValue({ data: mockBooks, error: null }),
            }),
          }),
        };
      }
      return {
        select: () => ({
          or: () => ({
            limit: vi.fn().mockResolvedValue({ data: [], error: null }),
          }),
          eq: () => ({
            or: () => ({
              limit: vi.fn().mockResolvedValue({ data: [], error: null }),
            }),
          }),
        }),
      };
    });

    render(
      <MemoryRouter>
        <EnhancedGlobalSearch isOpen={true} onClose={onClose} />
      </MemoryRouter>
    );

    const input = screen.getByPlaceholderText(/search books, authors, or articles/i);

    await act(async () => {
      fireEvent.change(input, { target: { value: 'Gaban' } });
      await new Promise((r) => setTimeout(r, 350));
    });

    await waitFor(() => {
      expect(screen.getByText('Gaban')).toBeInTheDocument();
    });

    // Press ArrowDown to highlight first item
    fireEvent.keyDown(input, { key: 'ArrowDown', code: 'ArrowDown' });

    // Press Enter to navigate
    fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' });

    expect(mockNavigate).toHaveBeenCalledWith('/book/101');
    expect(onClose).toHaveBeenCalled();

    // Verify saved in localStorage
    const saved = JSON.parse(localStorage.getItem('global_recent_searches') || '[]');
    expect(saved).toContain('Gaban');

    fromSpy.mockRestore();
  });

  it('falls back to library search when Enter is pressed without an active selection', async () => {
    render(
      <MemoryRouter>
        <EnhancedGlobalSearch isOpen={true} onClose={onClose} />
      </MemoryRouter>
    );

    const input = screen.getByPlaceholderText(/search books, authors, or articles/i);
    fireEvent.change(input, { target: { value: 'Quantum Physics' } });
    fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' });

    expect(mockNavigate).toHaveBeenCalledWith('/library?search=Quantum%20Physics');
    expect(onClose).toHaveBeenCalled();
  });

  it('is resilient when one table query fails via Promise.allSettled', async () => {
    const mockBooks = [
      { id: '99', title: 'Resilient Book', author: 'Author Name' },
    ];

    const fromSpy = vi.spyOn(supabase, 'from').mockImplementation((table: string): any => {
      if (table === 'books_library') {
        return {
          select: () => ({
            or: () => ({
              limit: vi.fn().mockResolvedValue({ data: mockBooks, error: null }),
            }),
          }),
        };
      }
      if (table === 'authors') {
        // Authors table throws an error
        return {
          select: () => ({
            or: () => ({
              limit: vi.fn().mockRejectedValue(new Error('Authors RLS error')),
            }),
          }),
        };
      }
      return {
        select: () => ({
          eq: () => ({
            or: () => ({
              limit: vi.fn().mockResolvedValue({ data: [], error: null }),
            }),
          }),
        }),
      };
    });

    render(
      <MemoryRouter>
        <EnhancedGlobalSearch isOpen={true} onClose={onClose} />
      </MemoryRouter>
    );

    const input = screen.getByPlaceholderText(/search books, authors, or articles/i);

    await act(async () => {
      fireEvent.change(input, { target: { value: 'Resilient' } });
      await new Promise((r) => setTimeout(r, 350));
    });

    // Books should still render despite author error
    await waitFor(() => {
      expect(screen.getByText('Resilient Book')).toBeInTheDocument();
    });

    fromSpy.mockRestore();
  });
});
