// @vitest-environment jsdom
import React from 'react';
import '@testing-library/jest-dom/vitest';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import AudioSummaryPlayer from './AudioSummaryPlayer';
import * as audioSummariesHook from '@/hooks/useAudioSummaries';
import { toast } from '@/hooks/use-toast';

vi.mock('@/hooks/use-toast', () => ({
  toast: vi.fn(),
}));

describe('AudioSummaryPlayer', () => {
  const mockMutateAsync = vi.fn();

  beforeEach(() => {
    vi.restoreAllMocks();
    vi.spyOn(audioSummariesHook, 'useCreateAudioSummary').mockReturnValue({
      mutateAsync: mockMutateAsync,
      data: null,
    } as any);
  });

  afterEach(() => {
    cleanup();
  });

  it('renders generate prompt when no summary exists', () => {
    vi.spyOn(audioSummariesHook, 'useAudioSummary').mockReturnValue({
      data: null,
    } as any);

    render(
      <AudioSummaryPlayer
        bookId="book-1"
        bookTitle="A Tale of Two Cities"
      />
    );

    expect(screen.getByText(/Generate an engaging 15-minute audio summary of "A Tale of Two Cities"/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Generate Audio Summary/i })).toBeInTheDocument();
  });

  it('shows error toast when generating without book content', () => {
    vi.spyOn(audioSummariesHook, 'useAudioSummary').mockReturnValue({
      data: null,
    } as any);

    render(
      <AudioSummaryPlayer
        bookId="book-1"
        bookTitle="A Tale of Two Cities"
      />
    );

    fireEvent.click(screen.getByRole('button', { name: /Generate Audio Summary/i }));
    expect(toast).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Error',
        description: 'Book content is required to generate audio summary.',
      })
    );
  });

  it('calls createAudioSummary when generate button is clicked with content', async () => {
    vi.spyOn(audioSummariesHook, 'useAudioSummary').mockReturnValue({
      data: null,
    } as any);
    mockMutateAsync.mockResolvedValue({ id: 'summary-1', audio_url: 'https://example.com/audio.mp3' });

    render(
      <AudioSummaryPlayer
        bookId="book-1"
        bookTitle="A Tale of Two Cities"
        bookContent="It was the best of times..."
      />
    );

    fireEvent.click(screen.getByRole('button', { name: /Generate Audio Summary/i }));

    await waitFor(() => {
      expect(mockMutateAsync).toHaveBeenCalledWith({
        bookId: 'book-1',
        content: 'It was the best of times...',
      });
      expect(toast).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Audio Summary Generated',
        })
      );
    });
  });

  it('renders audio player controls when summary exists', async () => {
    vi.spyOn(audioSummariesHook, 'useAudioSummary').mockReturnValue({
      data: {
        id: 'sum-1',
        audio_url: 'https://example.com/audio.mp3',
      },
    } as any);

    // Mock HTMLMediaElement methods
    const playMock = vi.spyOn(window.HTMLMediaElement.prototype, 'play').mockResolvedValue(undefined);
    const pauseMock = vi.spyOn(window.HTMLMediaElement.prototype, 'pause').mockImplementation(() => {});

    render(
      <AudioSummaryPlayer
        bookId="book-1"
        bookTitle="A Tale of Two Cities"
      />
    );

    const playButton = screen.getAllByRole('button')[1]; // play/pause button
    fireEvent.click(playButton);

    await waitFor(() => {
      expect(playMock).toHaveBeenCalled();
    });

    fireEvent.click(playButton);
    expect(pauseMock).toHaveBeenCalled();
  });
});

