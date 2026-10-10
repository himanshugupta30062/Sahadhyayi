import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Radio, Quote, Lock, Sparkles, ArrowRight, BookOpen, Users } from 'lucide-react';
import { useReadingRooms } from '@/hooks/useReadingRoom';
import { useMarginNotes } from '@/hooks/useMarginNotes';
import { useSpoilerThreads } from '@/hooks/useSpoilerThreads';

export const BookPulseBar: React.FC = () => {
  const navigate = useNavigate();
  const { data: rooms = [], isLoading: roomsLoading } = useReadingRooms();
  const { data: marginNotes = [], isLoading: marginsLoading } = useMarginNotes();
  const { data: threads = [], isLoading: threadsLoading } = useSpoilerThreads();

  const activeRooms = rooms.slice(0, 3);
  const recentMargins = marginNotes.slice(0, 3);
  const recentThreads = threads.slice(0, 3);

  const hasAnyActivity = activeRooms.length > 0 || recentMargins.length > 0 || recentThreads.length > 0;

  return (
    <Card className="bg-gradient-to-r from-card via-card to-brand-primary/5 border border-border/80 rounded-2xl shadow-xs overflow-hidden">
      <CardContent className="p-3.5 sm:p-4">
        {/* Header */}
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
            </span>
            <span className="text-xs font-semibold text-foreground tracking-wide uppercase flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-brand-primary" />
              Book Pulse
            </span>
            <span className="hidden sm:inline text-xs text-muted-foreground">· Live community activity</span>
          </div>

          <div className="flex items-center gap-1">
            <Button
              size="sm"
              variant="ghost"
              className="h-7 px-2 text-xs text-muted-foreground hover:text-brand-primary"
              onClick={() => navigate('/social?tab=rooms')}
            >
              <Radio className="w-3 h-3 mr-1 text-emerald-500" />
              <span className="hidden xs:inline">Rooms</span> ({rooms.length})
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="h-7 px-2 text-xs text-muted-foreground hover:text-brand-primary"
              onClick={() => navigate('/social?tab=margins')}
            >
              <Quote className="w-3 h-3 mr-1 text-amber-500" />
              <span className="hidden xs:inline">Margins</span> ({marginNotes.length})
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="h-7 px-2 text-xs text-muted-foreground hover:text-brand-primary"
              onClick={() => navigate('/social?tab=threads')}
            >
              <Lock className="w-3 h-3 mr-1 text-indigo-500" />
              <span className="hidden xs:inline">Threads</span> ({threads.length})
            </Button>
          </div>
        </div>

        {/* Pulse Scroll Items */}
        <div className="flex items-center gap-2.5 overflow-x-auto pb-1 scrollbar-none">
          {/* Active Reading Rooms */}
          {activeRooms.map((room) => (
            <div
              key={room.id}
              onClick={() => navigate('/social?tab=rooms')}
              className="shrink-0 flex items-center gap-2.5 px-3 py-2 rounded-xl bg-background/90 hover:bg-background border border-emerald-500/20 hover:border-emerald-500/40 cursor-pointer transition-all max-w-[260px] group shadow-2xs"
            >
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                <Radio className="w-4 h-4 animate-pulse" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <Badge variant="secondary" className="text-[9px] px-1 py-0 h-3.5 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-none font-medium">
                    Co-Reading
                  </Badge>
                  <span className="text-[11px] text-muted-foreground truncate">
                    {room.books_library?.title || 'Open Room'}
                  </span>
                </div>
                <p className="text-xs font-medium text-foreground truncate group-hover:text-emerald-600 transition-colors">
                  {room.name}
                </p>
              </div>
            </div>
          ))}

          {/* Recent Margin Notes */}
          {recentMargins.map((note) => (
            <div
              key={note.id}
              onClick={() => navigate(`/book/${note.book_id}?tab=read&page=${note.page}`)}
              className="shrink-0 flex items-center gap-2.5 px-3 py-2 rounded-xl bg-background/90 hover:bg-background border border-amber-500/20 hover:border-amber-500/40 cursor-pointer transition-all max-w-[280px] group shadow-2xs"
            >
              <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                <Quote className="w-4 h-4" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <Badge variant="secondary" className="text-[9px] px-1 py-0 h-3.5 bg-amber-500/10 text-amber-700 dark:text-amber-300 border-none font-medium">
                    p. {note.page}
                  </Badge>
                  <span className="text-[11px] text-muted-foreground truncate">
                    {note.books_library?.title || 'Book Margin'}
                  </span>
                </div>
                <p className="text-xs font-serif italic text-foreground/90 truncate group-hover:text-amber-600 transition-colors">
                  "{note.quote || note.note}"
                </p>
              </div>
            </div>
          ))}

          {/* Recent Spoiler-Safe Chapter Threads */}
          {recentThreads.map((thread) => (
            <div
              key={thread.id}
              onClick={() => navigate('/social?tab=threads')}
              className="shrink-0 flex items-center gap-2.5 px-3 py-2 rounded-xl bg-background/90 hover:bg-background border border-indigo-500/20 hover:border-indigo-500/40 cursor-pointer transition-all max-w-[260px] group shadow-2xs"
            >
              <div className="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
                <Lock className="w-4 h-4" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <Badge variant="secondary" className="text-[9px] px-1 py-0 h-3.5 bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border-none font-medium">
                    Ch. {thread.min_chapter}
                  </Badge>
                  <span className="text-[11px] text-muted-foreground truncate">
                    {thread.books_library?.title || 'Book Thread'}
                  </span>
                </div>
                <p className="text-xs font-medium text-foreground truncate group-hover:text-indigo-600 transition-colors">
                  {thread.title}
                </p>
              </div>
            </div>
          ))}

          {/* Empty / Intro state if nothing recorded yet */}
          {!hasAnyActivity && !roomsLoading && !marginsLoading && !threadsLoading && (
            <div className="flex items-center gap-3 py-1 px-2 text-xs text-muted-foreground">
              <BookOpen className="w-4 h-4 text-brand-primary" />
              <span>Co-read in real-time rooms, annotate margins, and discuss spoiler-free chapters.</span>
              <Button
                size="sm"
                variant="outline"
                className="h-6 text-[11px] px-2 text-brand-primary border-brand-primary/30"
                onClick={() => navigate('/social?tab=rooms')}
              >
                Start a Room <ArrowRight className="w-3 h-3 ml-1" />
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
export default BookPulseBar;
