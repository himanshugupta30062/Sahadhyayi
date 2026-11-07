// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { useVoiceReading } from './useVoiceReading';

describe('useVoiceReading', () => {
  let mockSpeak: any;
  let mockCancel: any;
  let mockPause: any;
  let mockResume: any;

  beforeEach(() => {
    mockSpeak = vi.fn();
    mockCancel = vi.fn();
    mockPause = vi.fn();
    mockResume = vi.fn();

    // Mock speechSynthesis
    Object.defineProperty(window, 'speechSynthesis', {
      value: {
        speak: mockSpeak,
        cancel: mockCancel,
        pause: mockPause,
        resume: mockResume,
      },
      writable: true,
      configurable: true,
    });

    // Mock SpeechSynthesisUtterance constructor
    class MockUtterance {
      text: string;
      lang = '';
      rate = 1;
      pitch = 1;
      onend: (() => void) | null = null;
      onerror: ((e: any) => void) | null = null;
      constructor(text: string) {
        this.text = text;
      }
    }
    (globalThis as any).SpeechSynthesisUtterance = MockUtterance;
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('detects browser speech synthesis support', () => {
    const { result } = renderHook(() => useVoiceReading());
    expect(result.current.isSupported).toBe(true);
  });

  it('speaks text in English or Hindi depending on script', () => {
    const { result } = renderHook(() => useVoiceReading());

    act(() => {
      result.current.speak('Hello, welcome to Sahadhyayi AI reading companion.');
    });

    expect(mockSpeak).toHaveBeenCalled();
    expect(result.current.isPlaying).toBe(true);
  });

  it('pauses, resumes, and stops speech properly', () => {
    const { result } = renderHook(() => useVoiceReading());

    act(() => {
      result.current.speak('A short story to read aloud.');
    });
    expect(result.current.isPlaying).toBe(true);

    act(() => {
      result.current.pause();
    });
    expect(mockPause).toHaveBeenCalled();
    expect(result.current.isPaused).toBe(true);

    act(() => {
      result.current.resume();
    });
    expect(mockResume).toHaveBeenCalled();
    expect(result.current.isPaused).toBe(false);

    act(() => {
      result.current.stop();
    });
    expect(mockCancel).toHaveBeenCalled();
    expect(result.current.isPlaying).toBe(false);
  });
});
