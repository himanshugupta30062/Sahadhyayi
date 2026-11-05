// @vitest-environment jsdom
import React from 'react';
import '@testing-library/jest-dom/vitest';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import AudioSummaryButton from './AudioSummaryButton';
import * as audioSummariesHook from '@/hooks/useAudioSummaries';

describe('AudioSummaryButton', () => {
  const mockMutateAsync = vi.fn();

  beforeEach(() => {
    vi.restoreAllMocks();
    mockMutateAsync.mockReset();
    vi.spyOn(audioSummariesHook, 'useAudioSummary').mockReturnValue({
      data: null,
      isLoading: false,
    } as any);
    vi.spyOn(audioSummariesHook, 'useCreateAudioSummary').mockReturnValue({
      mutateAsync: mockMutateAsync,
      isPending: false,
    } as any);

    // Mock HTMLMediaElement play/pause
    window.HTMLMediaElement.prototype.play = vi.fn().mockResolvedValue(undefined);
    window.HTMLMediaElement.prototype.pause = vi.fn();
    window.alert = vi.fn();
  });

  afterEach(() => {
    cleanup();
  });

  it('renders the initial 15 Min Audio Summary button', () => {
    render(<AudioSummaryButton bookId="book-1" bookContent="Sample text" />);
    expect(screen.getByRole('button', { name: /15 Min Audio Summary/i })).toBeInTheDocument();
  });

  it('alerts if book content is not provided and no existing audio summary exists', async () => {
    render(<AudioSummaryButton bookId="book-1" />);
    fireEvent.click(screen.getByRole('button', { name: /15 Min Audio Summary/i }));

    expect(window.alert).toHaveBeenCalledWith('Book content not available for audio summary');
  });

  it('creates audio summary when clicked and plays the generated audio', async () => {
    mockMutateAsync.mockResolvedValue({ audio_url: 'https://example.com/audio.mp3' });

    render(<AudioSummaryButton bookId="book-1" bookContent="Full book content text" />);
    fireEvent.click(screen.getByRole('button', { name: /15 Min Audio Summary/i }));

    await waitFor(() => {
      expect(mockMutateAsync).toHaveBeenCalledWith({
        bookId: 'book-1',
        content: 'Full book content text',
      });
    });

    await waitFor(() => {
      expect(window.HTMLMediaElement.prototype.play).toHaveBeenCalled();
    });
  });

  it('uses existing summary audio_url directly without calling mutateAsync', async () => {
    vi.spyOn(audioSummariesHook, 'useAudioSummary').mockReturnValue({
      data: { audio_url: 'https://example.com/existing.mp3' },
      isLoading: false,
    } as any);

    render(<AudioSummaryButton bookId="book-1" bookContent="Book text" />);
    fireEvent.click(screen.getByRole('button', { name: /15 Min Audio Summary/i }));

    await waitFor(() => {
      expect(window.HTMLMediaElement.prototype.play).toHaveBeenCalled();
    });
    expect(mockMutateAsync).not.toHaveBeenCalled();
  });

  it('toggles pause and resume when the play/pause button is clicked', async () => {
    vi.spyOn(audioSummariesHook, 'useAudioSummary').mockReturnValue({
      data: { audio_url: 'https://example.com/existing.mp3' },
      isLoading: false,
    } as any);

    render(<AudioSummaryButton bookId="book-1" bookContent="Book text" />);
    fireEvent.click(screen.getByRole('button', { name: /15 Min Audio Summary/i }));

    await waitFor(() => {
      expect(window.HTMLMediaElement.prototype.play).toHaveBeenCalledTimes(1);
    });

    // Pause button should now be rendered (second button)
    const buttons = screen.getAllByRole('button');
    expect(buttons.length).toBe(2);

    // Pause audio
    fireEvent.click(buttons[1]);
    expect(window.HTMLMediaElement.prototype.pause).toHaveBeenCalled();

    // Resume audio
    fireEvent.click(buttons[1]);
    await waitFor(() => {
      expect(window.HTMLMediaElement.prototype.play).toHaveBeenCalledTimes(2);
    });
  });

  it('shows loading state when audio creation is pending', () => {
    vi.spyOn(audioSummariesHook, 'useCreateAudioSummary').mockReturnValue({
      mutateAsync: mockMutateAsync,
      isPending: true,
    } as any);

    render(<AudioSummaryButton bookId="book-1" bookContent="Book text" />);
    expect(screen.getByRole('button', { name: /Generating Audio\.\.\./i })).toBeDisabled();
  });
});
