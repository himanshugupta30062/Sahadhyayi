import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  Loader2,
  Play,
  RotateCcw,
  Volume2,
  BookOpen,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { BookReelItem } from '@/data/sampleSocialPosts';
import { formatReelTime } from '@/utils/reelDuration';
import { supabase } from '@/integrations/supabase/client-universal';

export interface BookReelPlayerProps {
  reel: BookReelItem;
  isActive: boolean;
  onComplete?: (reelId: string) => void;
  onViewRecorded?: (reelId: string) => void;
  className?: string;
}

export const BookReelPlayer: React.FC<BookReelPlayerProps> = ({
  reel,
  isActive,
  onComplete,
  onViewRecorded,
  className = '',
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const viewRecordedRef = useRef(false);
  const completionRecordedRef = useRef(false);

  const initialDuration =
    reel.durationSeconds != null && reel.durationSeconds > 0
      ? Number(reel.durationSeconds)
      : 10;

  const [duration, setDuration] = useState<number>(initialDuration);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [hasError, setHasError] = useState<boolean>(false);
  const [isCompleted, setIsCompleted] = useState<boolean>(false);

  // Reset state when the active reel changes
  useEffect(() => {
    setCurrentTime(0);
    setIsPlaying(false);
    setIsLoading(false);
    setHasError(false);
    setIsCompleted(false);
    viewRecordedRef.current = false;
    completionRecordedRef.current = false;
    setDuration(
      reel.durationSeconds != null && reel.durationSeconds > 0
        ? Number(reel.durationSeconds)
        : 10
    );

    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.currentTime = 0;
    }
  }, [reel.id, reel.durationSeconds]);

  // Pause playback when the player modal becomes inactive / closes
  useEffect(() => {
    if (!isActive && videoRef.current) {
      videoRef.current.pause();
      setIsPlaying(false);
    }
  }, [isActive]);

  // Record view once per session per reel
  const recordView = useCallback(async () => {
    if (viewRecordedRef.current || !reel.id) return;
    viewRecordedRef.current = true;
    onViewRecorded?.(reel.id);

    try {
      const key = `book-reel-view:${reel.id}`;
      if (typeof window !== 'undefined' && sessionStorage.getItem(key)) {
        return;
      }
      sessionStorage.setItem(key, '1');

      const { data: { user } } = await supabase.auth.getUser();
      await supabase.from('book_reel_views').insert({
        reel_id: reel.id,
        viewer_id: user?.id ?? null,
      });
    } catch {
      // Viewing analytics should never interrupt the playback experience
    }
  }, [reel.id, onViewRecorded]);

  // Video event handlers
  const handleLoadedMetadata = () => {
    if (videoRef.current && !isNaN(videoRef.current.duration) && videoRef.current.duration > 0) {
      setDuration(videoRef.current.duration);
    }
    setIsLoading(false);
  };

  const markCompleted = () => {
    if (completionRecordedRef.current) return;
    completionRecordedRef.current = true;
    markCompleted();
  };

  const handleTimeUpdate = () => {
    if (!videoRef.current) return;
    const current = videoRef.current.currentTime;
    setCurrentTime(current);

    const effectiveDuration = duration > 0 ? duration : 10;
    // Mark completed if >= 90% watched or within 0.3s of end
    if (!isCompleted && (current / effectiveDuration >= 0.9 || current >= effectiveDuration - 0.3)) {
      markCompleted();
    }
  };

  const handleEnded = () => {
    setIsPlaying(false);
    setIsCompleted(true);
    onComplete?.(reel.id);
  };

  const handlePlay = () => {
    setIsPlaying(true);
    void recordView();
  };

  const handlePause = () => {
    setIsPlaying(false);
  };

  const handleRetry = () => {
    setHasError(false);
    setIsLoading(true);
    if (videoRef.current) {
      videoRef.current.load();
    }
  };

  const handleReplay = () => {
    if (!videoRef.current) return;
    try {
      videoRef.current.currentTime = 0;
    } catch {
      // jsdom environment compatibility
    }
    setCurrentTime(0);
    setIsCompleted(false);
    completionRecordedRef.current = false;
    void videoRef.current.play().catch(() => {
      // Browser autoplay restriction handling
    });
  };

  const progressPercent = duration > 0 ? Math.min(100, (currentTime / duration) * 100) : 0;
  const remainingSeconds = Math.max(0, duration - currentTime);

  // If this is a video reel
  if (reel.videoUrl) {
    return (
      <div className={`flex flex-col items-center gap-3 ${className}`}>
        {/* Video Viewport Container */}
        <div className="relative aspect-[9/16] w-full max-h-[56vh] sm:max-h-[60vh] overflow-hidden rounded-2xl bg-black shadow-lg">
          {/* Loading Indicator */}
          {isLoading && !hasError && (
            <div
              className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/60 backdrop-blur-xs text-white"
              role="status"
              aria-label="Loading video"
            >
              <Loader2 className="h-8 w-8 animate-spin text-amber-400" />
              <span className="mt-2 text-xs text-white/80">Loading reel…</span>
            </div>
          )}

          {/* Error State with Retry */}
          {hasError && (
            <div
              className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/85 p-4 text-center text-white"
              role="alert"
            >
              <AlertCircle className="h-8 w-8 text-rose-400" />
              <p className="mt-2 text-sm font-semibold">Video could not be loaded</p>
              <p className="mt-1 text-xs text-white/70">
                Check your network connection and try again.
              </p>
              <Button
                size="sm"
                variant="outline"
                onClick={handleRetry}
                className="mt-3 gap-1.5 border-white/20 bg-white/10 text-white hover:bg-white/20"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                Retry
              </Button>
            </div>
          )}

          {/* HTML5 Native Video */}
          <video
            ref={videoRef}
            src={reel.videoUrl}
            controls
            playsInline
            preload="metadata"
            onLoadStart={() => setIsLoading(true)}
            onWaiting={() => setIsLoading(true)}
            onCanPlay={() => setIsLoading(false)}
            onLoadedMetadata={handleLoadedMetadata}
            onTimeUpdate={handleTimeUpdate}
            onPlay={handlePlay}
            onPause={handlePause}
            onEnded={handleEnded}
            onError={() => {
              setHasError(true);
              setIsLoading(false);
            }}
            className="h-full w-full object-contain"
            aria-label={`${reel.bookTitle || 'Book reel'} video`}
          />
        </div>

        {/* 10-Second Reel Progress Companion Bar */}
        <div className="w-full space-y-1.5 px-1">
          <div className="flex items-center justify-between text-xs font-mono text-white/80">
            <span>
              {formatReelTime(currentTime)} / {formatReelTime(duration)}
            </span>
            <div className="flex items-center gap-2">
              {isCompleted ? (
                <Badge
                  variant="outline"
                  className="gap-1 border-emerald-400/60 bg-emerald-950/60 text-[10px] text-emerald-300"
                >
                  <CheckCircle2 className="h-3 w-3 text-emerald-400" />
                  Reel completed
                </Badge>
              ) : (
                <span className="text-[11px] text-white/60">-{formatReelTime(remainingSeconds)}</span>
              )}
              {isCompleted && (
                <button
                  type="button"
                  onClick={handleReplay}
                  aria-label="Replay reel"
                  className="inline-flex items-center gap-1 text-[11px] font-sans text-amber-300 hover:underline"
                >
                  <RotateCcw className="h-3 w-3" />
                  Replay
                </button>
              )}
            </div>
          </div>

          <Progress
            value={progressPercent}
            className="h-1.5 bg-white/20"
            aria-label="Reel playback progress"
          />
        </div>
      </div>
    );
  }

  // Fallback for Sample / Static Reels (Quotes and Images)
  return (
    <div className={`relative flex flex-col justify-between overflow-hidden rounded-2xl min-h-[380px] p-5 ${className}`}>
      {/* Background Aesthetic Image */}
      <img
        src={reel.imageUrl}
        alt=""
        className="absolute inset-0 h-full w-full object-cover filter blur-[2px] brightness-50"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-[#0B0D0C] via-[#0B0D0C]/75 to-black/60" />

      {/* Reader Hook & Quote */}
      <div className="relative z-10 space-y-3 rounded-2xl border border-white/10 bg-black/45 p-4 backdrop-blur-md">
        <p className="font-serif text-base font-bold leading-snug text-amber-100 sm:text-lg">
          {reel.hook}
        </p>
        <p className="whitespace-pre-line text-xs leading-relaxed text-white/90">
          {reel.fullQuote}
        </p>

        {/* Attached Book Reference */}
        <div className="flex items-center gap-2.5 rounded-xl border border-white/15 bg-white/10 p-2.5">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-amber-500/20 text-amber-300">
            <BookOpen className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <p className="truncate text-xs font-bold text-white">{reel.bookTitle}</p>
            <p className="truncate text-[10px] text-white/70">{reel.bookAuthor}</p>
          </div>
        </div>
      </div>

      {/* Mood Audio & Duration Badge */}
      <div className="relative z-10 mt-3 flex items-center justify-between text-xs text-amber-300">
        <div className="flex items-center gap-1.5">
          <Volume2 className="h-3.5 w-3.5 animate-pulse" />
          <span className="text-[11px] truncate max-w-[200px]">{reel.moodAudio}</span>
        </div>
        {reel.durationSeconds != null && (
          <Badge variant="outline" className="border-amber-400/40 text-amber-300 text-[10px]">
            {formatReelTime(reel.durationSeconds)} micro-moment
          </Badge>
        )}
      </div>
    </div>
  );
};

export default BookReelPlayer;
