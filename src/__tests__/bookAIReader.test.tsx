/** @vitest-environment jsdom */

import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import '@testing-library/jest-dom/vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import BookAIReader from '@/components/books/BookAIReader';

const mocks = vi.hoisted(() => ({
  invoke: vi.fn(),
  voiceToggle: vi.fn(),
  voiceStop: vi.fn(),
}));

vi.mock('@/integrations/supabase/client-universal', () => ({
  supabase: {
    functions: {
      invoke: (...args: unknown[]) => mocks.invoke(...args),
    },
  },
}));

vi.mock('@/hooks/useVoiceReading', () => ({
  useVoiceReading: () => ({
    isSupported: true,
    isPlaying: false,
    isPaused: false,
    toggle: mocks.voiceToggle,
    stop: mocks.voiceStop,
  }),
}));

const mockBook = {
  id: 'b1234567-89ab-cdef-0123-456789abcdef',
  title: 'Discovery of India',
  author: 'Jawaharlal Nehru',
  description: 'An insightful history of India.',
  language: 'en',
};

describe('BookAIReader Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  it('renders prompt suggestions, textarea, and submit button', () => {
    render(
      <MemoryRouter>
        <BookAIReader book={mockBook} />
      </MemoryRouter>
    );

    expect(screen.getByText('Ask AI about this book')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Explain this book simply' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'What are its key themes and lessons?' })).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Ask anything about "Discovery of India"…/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Ask Book AI/i })).toBeDisabled();
  });

  it('submits question and renders successful response with citations', async () => {
    mocks.invoke.mockResolvedValueOnce({
      data: {
        reply: 'The Discovery of India was written by Jawaharlal Nehru during his imprisonment at Ahmednagar fort.',
        citations: [
          {
            id: 'S1',
            title: 'Discovery of India',
            pageNumber: 42,
            chapterTitle: 'The Panorama of India\'s Past',
            excerpt: 'Nehru reflects on Indian history.',
          },
        ],
      },
      error: null,
    });

    render(
      <MemoryRouter>
        <BookAIReader book={mockBook} />
      </MemoryRouter>
    );

    const textarea = screen.getByPlaceholderText(/Ask anything about "Discovery of India"…/i);
    fireEvent.change(textarea, { target: { value: 'Where was this book written?' } });
    const submitBtn = screen.getByRole('button', { name: /Ask Book AI/i });
    expect(submitBtn).toBeEnabled();

    fireEvent.click(submitBtn);

    expect(screen.getByText('Consulting Book Expert…')).toBeInTheDocument();
    expect(mocks.invoke).toHaveBeenCalledWith('book-expert-gemini', expect.objectContaining({
      body: expect.objectContaining({
        text: 'Where was this book written?',
        bookContext: expect.objectContaining({
          id: mockBook.id,
          title: mockBook.title,
        }),
      }),
    }));

    await waitFor(() => {
      expect(screen.getByText(/written by Jawaharlal Nehru during his imprisonment/i)).toBeInTheDocument();
    });

    expect(screen.getByText('[S1]')).toBeInTheDocument();
    expect(screen.getByText('(p. 42)')).toBeInTheDocument();
  });

  it('handles clicking a preset prompt button', async () => {
    mocks.invoke.mockResolvedValueOnce({
      data: {
        reply: 'This book explores India from ancient times through British rule.',
        citations: [],
      },
      error: null,
    });

    render(
      <MemoryRouter>
        <BookAIReader book={mockBook} />
      </MemoryRouter>
    );

    const presetBtn = screen.getByRole('button', { name: 'Explain this book simply' });
    fireEvent.click(presetBtn);

    await waitFor(() => {
      expect(screen.getByText(/explores India from ancient times/i)).toBeInTheDocument();
    });

    expect(mocks.invoke).toHaveBeenCalledWith('book-expert-gemini', expect.objectContaining({
      body: expect.objectContaining({
        text: 'Explain this book simply',
      }),
    }));
  });

  it('displays timeout message and offers Retry when 504 error occurs', async () => {
    mocks.invoke.mockRejectedValueOnce({
      name: 'FunctionsHttpError',
      message: 'Edge Function returned a non-2xx status code: 504',
      context: {
        status: 504,
        json: async () => ({ error: 'Book Expert took too long to respond. Please try again.' }),
      },
    });

    render(
      <MemoryRouter>
        <BookAIReader book={mockBook} />
      </MemoryRouter>
    );

    const textarea = screen.getByPlaceholderText(/Ask anything about "Discovery of India"…/i);
    fireEvent.change(textarea, { target: { value: 'Explain key themes' } });
    fireEvent.click(screen.getByRole('button', { name: /Ask Book AI/i }));

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent(/Book Expert took too long to respond/i);
    });

    const retryBtn = screen.getByRole('button', { name: /Retry/i });
    expect(retryBtn).toBeInTheDocument();

    // Now test retry action
    mocks.invoke.mockResolvedValueOnce({
      data: { reply: 'Key themes include unity in diversity and cultural continuity.', citations: [] },
      error: null,
    });

    fireEvent.click(retryBtn);

    await waitFor(() => {
      expect(screen.getByText(/unity in diversity/i)).toBeInTheDocument();
    });

    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('displays rate limit message on 429 status', async () => {
    mocks.invoke.mockRejectedValueOnce({
      name: 'FunctionsHttpError',
      context: {
        status: 429,
        json: async () => ({ error: 'You have reached the short-term request limit. Please wait a minute and try again.' }),
      },
    });

    render(
      <MemoryRouter>
        <BookAIReader book={mockBook} />
      </MemoryRouter>
    );

    const textarea = screen.getByPlaceholderText(/Ask anything about "Discovery of India"…/i);
    fireEvent.change(textarea, { target: { value: 'Quick test' } });
    fireEvent.click(screen.getByRole('button', { name: /Ask Book AI/i }));

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent(/short-term request limit/i);
    });
  });

  it('prevents duplicate submissions while request is in flight', async () => {
    let resolver: any;
    mocks.invoke.mockImplementationOnce(() => new Promise((resolve) => { resolver = resolve; }));

    render(
      <MemoryRouter>
        <BookAIReader book={mockBook} />
      </MemoryRouter>
    );

    const textarea = screen.getByPlaceholderText(/Ask anything about "Discovery of India"…/i);
    fireEvent.change(textarea, { target: { value: 'First call' } });
    const submitBtn = screen.getByRole('button', { name: /Ask Book AI/i });
    fireEvent.click(submitBtn);

    expect(submitBtn).toBeDisabled();
    expect(textarea).toBeDisabled();

    // Second click attempt should be blocked
    fireEvent.click(submitBtn);
    expect(mocks.invoke).toHaveBeenCalledTimes(1);

    resolver({ data: { reply: 'Finished', citations: [] }, error: null });
    await waitFor(() => {
      expect(screen.getByText('Finished')).toBeInTheDocument();
    });
  });

  it('copies response text to clipboard when copy button is clicked', async () => {
    const writeTextMock = vi.fn().mockResolvedValue(undefined);
    Object.assign(navigator, {
      clipboard: {
        writeText: writeTextMock,
      },
    });

    mocks.invoke.mockResolvedValueOnce({
      data: { reply: 'Detailed answer to copy', citations: [] },
      error: null,
    });

    render(
      <MemoryRouter>
        <BookAIReader book={mockBook} />
      </MemoryRouter>
    );

    fireEvent.change(screen.getByPlaceholderText(/Ask anything about "Discovery of India"…/i), {
      target: { value: 'Tell me about this book' },
    });
    fireEvent.click(screen.getByRole('button', { name: /Ask Book AI/i }));

    await waitFor(() => {
      expect(screen.getByText('Detailed answer to copy')).toBeInTheDocument();
    });

    const copyBtn = screen.getByRole('button', { name: /Copy/i });
    fireEvent.click(copyBtn);

    expect(writeTextMock).toHaveBeenCalledWith('Detailed answer to copy');
    await waitFor(() => {
      expect(screen.getByText('Copied')).toBeInTheDocument();
    });
  });
});
