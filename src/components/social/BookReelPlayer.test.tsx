// @vitest-environment jsdom

import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act, cleanup } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { BookReelPlayer } from './BookReelPlayer';
import { BookReelItem } from '@/data/sampleSocialPosts';

describe('BookReelPlayer', () => {
  const sampleVideoReel: BookReelItem = {
    id: 'reel-video-1',
    tag: '📚 COMMUNITY REEL',
    tagColor: 'bg-emerald-700/80 text-white',
    readerName: 'Kavita Rao',
    readerHandle: 'kavita_reads',
    readerAvatar: 'https://example.com/avatar.jpg',
    bookTitle: 'The God of Small Things',
    bookAuthor: 'Arundhati Roy',
    hook: 'A heartbreaking perspective on family.',
    fullQuote: '“Things can change in a day.”',
    moodAudio: 'Community video',
    imageUrl: 'https://example.com/cover.jpg',
    videoUrl: 'https://example.com/video.mp4',
    durationSeconds: 10,
    likesCount: 15,
    commentsCount: 2,
  };

  const sampleStaticReel: BookReelItem = {
    id: 'reel-static-1',
    tag: '🌙 2 AM THOUGHTS',
    tagColor: 'bg-indigo-600/80 text-white',
    readerName: 'Priya Sharma',
    readerHandle: 'priya_reads_late',
    readerAvatar: 'https://example.com/priya.jpg',
    bookTitle: 'The Song of Achilles',
    bookAuthor: 'Madeline Miller',
    hook: 'POV: Chapter 20 completely ruined you.',
    fullQuote: '“I could recognize him by touch alone.”',
    moodAudio: '♫ Nocturne in C-sharp minor',
    imageUrl: 'https://example.com/achilles.jpg',
    likesCount: 42,
    commentsCount: 5,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  it('renders video element with controls and metadata when videoUrl is present', () => {
    render(<BookReelPlayer reel={sampleVideoReel} isActive={true} />);

    const video = screen.getByLabelText(/The God of Small Things video/i) as HTMLVideoElement;
    expect(video).toBeInTheDocument();
    expect(video).toHaveAttribute('src', 'https://example.com/video.mp4');
    expect(video).toHaveAttribute('playsinline');
    expect(video).toHaveAttribute('preload', 'metadata');
    expect(video.controls).toBe(true);

    // Initial time and duration display
    expect(screen.getByText('00:00 / 00:10')).toBeInTheDocument();
  });

  it('updates time, progress, and detects reel completion at >= 90% playback', () => {
    const onComplete = vi.fn();
    render(
      <BookReelPlayer
        reel={sampleVideoReel}
        isActive={true}
        onComplete={onComplete}
      />
    );

    const video = screen.getByLabelText(/The God of Small Things video/i) as HTMLVideoElement;

    // Simulate play
    fireEvent.play(video);

    // Set duration to 10s and currentTime to 4s
    Object.defineProperty(video, 'duration', { value: 10, writable: true, configurable: true });
    Object.defineProperty(video, 'currentTime', { value: 4, writable: true, configurable: true });
    fireEvent.timeUpdate(video);

    expect(screen.getByText('00:04 / 00:10')).toBeInTheDocument();
    expect(screen.getByText('-00:06')).toBeInTheDocument();
    expect(onComplete).not.toHaveBeenCalled();

    // Now advance to 9.5s (>= 90%)
    Object.defineProperty(video, 'currentTime', { value: 9.5, writable: true, configurable: true });
    fireEvent.timeUpdate(video);

    expect(screen.getByText(/Reel completed/i)).toBeInTheDocument();
    expect(onComplete).toHaveBeenCalledWith('reel-video-1');
  });

  it('handles replay action correctly', () => {
    render(<BookReelPlayer reel={sampleVideoReel} isActive={true} />);

    const video = screen.getByLabelText(/The God of Small Things video/i) as HTMLVideoElement;
    const playSpy = vi.spyOn(video, 'play').mockResolvedValue(undefined);

    // Trigger completion
    Object.defineProperty(video, 'duration', { value: 10, writable: true, configurable: true });
    Object.defineProperty(video, 'currentTime', { value: 10, writable: true, configurable: true });
    fireEvent.timeUpdate(video);

    expect(screen.getByText(/Reel completed/i)).toBeInTheDocument();

    const replayBtn = screen.getByRole('button', { name: /replay reel/i });
    fireEvent.click(replayBtn);

    expect(video.currentTime).toBe(0);
    expect(playSpy).toHaveBeenCalled();
  });

  it('displays error state and allows retry on video loading failure', () => {
    render(<BookReelPlayer reel={sampleVideoReel} isActive={true} />);

    const video = screen.getByLabelText(/The God of Small Things video/i) as HTMLVideoElement;
    const loadSpy = vi.spyOn(video, 'load').mockImplementation(() => {});

    fireEvent.error(video);

    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(screen.getByText(/Video could not be loaded/i)).toBeInTheDocument();

    const retryBtn = screen.getByRole('button', { name: /retry/i });
    fireEvent.click(retryBtn);

    expect(loadSpy).toHaveBeenCalled();
  });

  it('renders static aesthetic quote card when reel has no videoUrl', () => {
    render(<BookReelPlayer reel={sampleStaticReel} isActive={true} />);

    expect(screen.queryByRole('video')).not.toBeInTheDocument();
    expect(screen.getByText(/POV: Chapter 20 completely ruined you/i)).toBeInTheDocument();
    expect(screen.getByText(/The Song of Achilles/i)).toBeInTheDocument();
    expect(screen.getByText(/Madeline Miller/i)).toBeInTheDocument();
    expect(screen.getByText(/♫ Nocturne in C-sharp minor/i)).toBeInTheDocument();
  });

  it('pauses video when isActive becomes false', () => {
    const { rerender } = render(<BookReelPlayer reel={sampleVideoReel} isActive={true} />);

    const video = screen.getByLabelText(/The God of Small Things video/i) as HTMLVideoElement;
    const pauseSpy = vi.spyOn(video, 'pause').mockImplementation(() => {});

    rerender(<BookReelPlayer reel={sampleVideoReel} isActive={false} />);
    expect(pauseSpy).toHaveBeenCalled();
  });
});
