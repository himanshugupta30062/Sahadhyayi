import React from 'react';
import { Radio, Quote, MessageCircle, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useReadingRooms } from '@/hooks/useReadingRoom';
import { useMarginNotes } from '@/hooks/useMarginNotes';
import { useSpoilerThreads } from '@/hooks/useSpoilerThreads';

/**
 * BookPulseBar
 * A compact live-activity bar that surfaces real-time counts of Reading Rooms,
 * Margin Notes and Spoiler Threads. Rendered on the Social landing page for
 * both guests (preview) and authenticated users.
 */
export const BookPulseBar: React.FC = () => {
  const { data: rooms = [], isLoading: roomsLoading } = useReadingRooms();
  const { data: marginNotes = [], isLoading: notesLoading } = useMarginNotes({ filter: 'all' });
  const { data: spoilerThreads = [], isLoading: threadsLoading } = useSpoilerThreads();

  const isLoading = roomsLoading || notesLoading || threadsLoading;

  // Latest active room name (if any)
  const latestRoom = rooms[0];

  return (
    <div
      className="rounded-xl border border-border/60 bg-card/70 backdrop-blur-sm px-4 py-3 flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-6 shadow-xs"
      aria-label="Book Pulse – live reading activity"
    >
      {/* Header label */}
      <div className="flex items-center gap-2 shrink-0">
        <span className="relative flex h-2.5 w-2.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
        </span>
        <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          Book Pulse
        </span>
      </div>

      {/* Stats */}
      <div className="flex flex-wrap items-center gap-4 flex-1">
        {/* Rooms */}
        <Link
          to="/social?tab=rooms"
          className="flex items-center gap-1.5 text-sm text-foreground hover:text-brand-primary transition-colors group"
        >
          <Radio className="w-4 h-4 text-emerald-500 group-hover:animate-pulse" />
          {isLoading ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin text-muted-foreground" />
          ) : (
            <span className="font-semibold">{rooms.length}</span>
          )}
          <span className="text-muted-foreground">Rooms</span>
        </Link>

        {/* Margins */}
        <Link
          to="/social?tab=margins"
          className="flex items-center gap-1.5 text-sm text-foreground hover:text-brand-primary transition-colors"
        >
          <Quote className="w-4 h-4 text-amber-500" />
          {isLoading ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin text-muted-foreground" />
          ) : (
            <span className="font-semibold">{marginNotes.length}</span>
          )}
          <span className="text-muted-foreground">Margins</span>
        </Link>

        {/* Threads */}
        <Link
          to="/social?tab=threads"
          className="flex items-center gap-1.5 text-sm text-foreground hover:text-brand-primary transition-colors"
        >
          <MessageCircle className="w-4 h-4 text-violet-500" />
          {isLoading ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin text-muted-foreground" />
          ) : (
            <span className="font-semibold">{spoilerThreads.length}</span>
          )}
          <span className="text-muted-foreground">Threads</span>
        </Link>
      </div>

      {/* Latest active room callout */}
      {!isLoading && latestRoom && (
        <Link
          to="/social?tab=rooms"
          className="hidden md:flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors max-w-[220px] truncate"
          title={latestRoom.name}
        >
          <span className="shrink-0 font-medium text-emerald-600 dark:text-emerald-400">Live:</span>
          <span className="truncate">{latestRoom.name}</span>
        </Link>
      )}
    </div>
  );
};

export default BookPulseBar;
