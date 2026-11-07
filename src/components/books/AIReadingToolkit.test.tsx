// @vitest-environment jsdom
import React from 'react';
import '@testing-library/jest-dom/vitest';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import AIReadingToolkit from './AIReadingToolkit';

const mockInvoke = vi.fn();

vi.mock('@/integrations/supabase/client-universal', () => ({
  supabase: {
    functions: {
      invoke: (...args: any[]) => mockInvoke(...args),
    },
  },
}));

vi.mock('@/hooks/useVoiceReading', () => ({
  useVoiceReading: () => ({
    isSupported: true,
    isPlaying: false,
    isPaused: false,
    currentText: '',
    speak: vi.fn(),
    pause: vi.fn(),
    resume: vi.fn(),
    stop: vi.fn(),
    toggle: vi.fn(),
  }),
}));

const mockBook = {
  id: 'book-456',
  title: 'Godaan',
  author: 'Munshi Premchand',
  description: 'A classic story of rural Indian struggle and peasant life.',
  language: 'hindi',
};

describe('AIReadingToolkit', () => {
  beforeEach(() => {
    mockInvoke.mockReset();
  });

  afterEach(() => {
    cleanup();
  });

  it('renders all 4 core AI learning activities', () => {
    render(
      <MemoryRouter>
        <AIReadingToolkit book={mockBook} />
      </MemoryRouter>
    );

    expect(screen.getByText('AI Reading Toolkit')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /test my understanding/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /make flashcards/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /discussion questions/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /key takeaways/i })).toBeInTheDocument();
  });

  it('generates activity with citations and page links when clicked', async () => {
    mockInvoke.mockResolvedValueOnce({
      data: {
        reply: 'Here are 5 comprehension questions for Godaan:\n1. What is Hori’s deepest aspiration? [S1]',
        citations: [
          {
            id: 'S1',
            title: 'Godaan',
            pageNumber: 24,
            chapterTitle: 'Chapter 2',
            sourceType: 'book_content',
            excerpt: 'Hori dreamed of owning a cow...',
          },
        ],
      },
      error: null,
    });

    render(
      <MemoryRouter>
        <AIReadingToolkit book={mockBook} />
      </MemoryRouter>
    );

    const quizButton = screen.getByRole('button', { name: /test my understanding/i });
    fireEvent.click(quizButton);

    await waitFor(() => {
      expect(screen.getByText(/Here are 5 comprehension questions/)).toBeInTheDocument();
    });

    expect(screen.getByText('[S1]')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /\(p\. 24\)/i })).toHaveAttribute(
      'href',
      '/reader/book-456?page=24'
    );
  });
});

