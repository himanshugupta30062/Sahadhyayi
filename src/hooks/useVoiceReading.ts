import { useCallback, useEffect, useRef, useState } from 'react';

export interface VoiceReadingOptions {
  lang?: string;
  rate?: number;
  pitch?: number;
}

export function useVoiceReading() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [currentText, setCurrentText] = useState('');
  const utteranceQueueRef = useRef<SpeechSynthesisUtterance[]>([]);
  const isSupported = typeof window !== 'undefined' && 'speechSynthesis' in window;

  const stop = useCallback(() => {
    if (!isSupported) return;
    try {
      window.speechSynthesis.cancel();
    } catch {
      // Ignore synthesis cancel errors in sandboxes
    }
    utteranceQueueRef.current = [];
    setIsPlaying(false);
    setIsPaused(false);
    setCurrentText('');
  }, [isSupported]);

  const pause = useCallback(() => {
    if (!isSupported) return;
    try {
      window.speechSynthesis.pause();
      setIsPaused(true);
    } catch {
      // Ignore synthesis pause errors
    }
  }, [isSupported]);

  const resume = useCallback(() => {
    if (!isSupported) return;
    try {
      window.speechSynthesis.resume();
      setIsPaused(false);
    } catch {
      // Ignore synthesis resume errors
    }
  }, [isSupported]);

  const speak = useCallback((text: string, options?: VoiceReadingOptions) => {
    if (!isSupported || !text?.trim()) return;

    stop();
    setCurrentText(text);
    setIsPlaying(true);
    setIsPaused(false);

    const isHindi = /[\u0900-\u097F]/.test(text);
    const targetLang = options?.lang || (isHindi ? 'hi-IN' : 'en-US');

    // Split text into short paragraphs or sentences so speech synthesis doesn't clip on long text
    const sentences = text
      .split(/(?<=[.?!।\n])\s+/)
      .map((s) => s.trim())
      .filter(Boolean);

    const utterances: SpeechSynthesisUtterance[] = [];

    sentences.forEach((sentence, idx) => {
      const utterance = new SpeechSynthesisUtterance(sentence);
      utterance.lang = targetLang;
      utterance.rate = options?.rate || 0.95;
      utterance.pitch = options?.pitch || 1.0;

      if (idx === sentences.length - 1) {
        utterance.onend = () => {
          setIsPlaying(false);
          setIsPaused(false);
          setCurrentText('');
        };
      }

      utterance.onerror = (e) => {
        // 'interrupted' or 'canceled' happens naturally when stop() is called
        if (e.error !== 'interrupted' && e.error !== 'canceled') {
          console.warn('Speech synthesis error:', e.error);
        }
        if (idx === sentences.length - 1) {
          setIsPlaying(false);
          setIsPaused(false);
        }
      };

      utterances.push(utterance);
    });

    utteranceQueueRef.current = utterances;
    utterances.forEach((u) => {
      window.speechSynthesis.speak(u);
    });
  }, [isSupported, stop]);

  const toggle = useCallback((text: string, options?: VoiceReadingOptions) => {
    if (isPlaying && !isPaused) {
      pause();
    } else if (isPlaying && isPaused) {
      resume();
    } else {
      speak(text, options);
    }
  }, [isPlaying, isPaused, pause, resume, speak]);

  useEffect(() => {
    return () => {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        try {
          window.speechSynthesis.cancel();
        } catch {
          // Ignore
        }
      }
    };
  }, []);

  return {
    isSupported,
    isPlaying,
    isPaused,
    currentText,
    speak,
    pause,
    resume,
    stop,
    toggle,
  };
}

