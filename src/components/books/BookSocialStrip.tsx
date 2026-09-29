import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Radio, Quote, Lock, Sparkles, ArrowRight, MessageSquare } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useReadingRooms } from '@/hooks/useReadingRoom';
import { useMarginNotes } from '@/hooks/useMarginNotes';
import { useSpoilerThreads } from '@/hooks/useSpoilerThreads';

interface BookSocialStripProps {
  bookId: string;
  bookTitle: string;
  onTabSelect?: (tab: string) => void;
}

export const BookSocialStrip: React.FC<BookSocialStripProps> = ({
  bookId,
  bookTitle,
  onTabSelect,
}) => {
  const navigate = useNavigate();
  const { data: allRooms = [] } = useReadingRooms();
  const { data: bookNotes = [] } = useMarginNotes({ bookId });
  const { data: allThreads = [] } = useSpoilerThreads();

  const rooms = allRooms.filter((r) => r.book_id === bookId);
  const threads = allThreads.filter((t) => t.book_id === bookId);

  return (
    <Card className="bg-gradient-to-r from-amber-500/10 via-purple-500/10 to-blue-500/10 border-border/80 rounded-2xl shadow-xs overflow-hidden mb-6">
      <CardContent className="p-3.5 sm:p-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-primary opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-brand-primary" />
            </span>
            <span className="text-xs font-semibold text-foreground tracking-wide uppercase flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-brand-primary" />
              Book Community
            </span>
            <span className="text-xs text-muted-foreground">· Co-read & discuss</span>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Reading Rooms */}
            <Button
              size="sm"
              variant="outline"
              className="h-8 px-2.5 text-xs bg-background/80 hover:bg-background border-emerald-500/30 text-emerald-800 dark:text-emerald-300 gap-1.5"
              onClick={() => navigate('/social?tab=rooms')}
            >
              <Radio className="w-3.5 h-3.5 text-emerald-500 animate-pulse" />
              <span>{rooms.length} {rooms.length === 1 ? 'Active Room' : 'Active Rooms'}</span>
            </Button>

            {/* Margin Notes */}
            <Button
              size="sm"
              variant="outline"
              className="h-8 px-2.5 text-xs bg-background/80 hover:bg-background border-amber-500/30 text-amber-800 dark:text-amber-300 gap-1.5"
              onClick={() => {
                if (onTabSelect) {
                  onTabSelect('read');
                } else {
                  navigate(`/book/${bookId}?tab=read`);
                }
              }}
            >
              <Quote className="w-3.5 h-3.5 text-amber-500" />
              <span>{bookNotes.length} Margin {bookNotes.length === 1 ? 'Note' : 'Notes'}</span>
            </Button>

            {/* Chapter Threads */}
            <Button
              size="sm"
              variant="outline"
              className="h-8 px-2.5 text-xs bg-background/80 hover:bg-background border-indigo-500/30 text-indigo-800 dark:text-indigo-300 gap-1.5"
              onClick={() => navigate('/social?tab=threads')}
            >
              <Lock className="w-3.5 h-3.5 text-indigo-500" />
              <span>{threads.length} {threads.length === 1 ? 'Thread' : 'Threads'}</span>
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
export default BookSocialStrip;
