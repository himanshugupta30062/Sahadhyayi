import React, { useState } from 'react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Quote, Radio, Plus, MessageCircle, ExternalLink } from 'lucide-react';
import { useMarginNotes } from '@/hooks/useMarginNotes';
import { useReadingRooms } from '@/hooks/useReadingRoom';
import MarginNoteCard from '@/components/social/margins/MarginNoteCard';
import { AddMarginNoteDialog } from '@/components/social/margins/AddMarginNoteDialog';
import { useAuth } from '@/contexts/authHelpers';
import { useNavigate } from 'react-router-dom';

interface ReaderMarginDrawerProps {
  bookId: string;
  bookTitle: string;
  currentPage: number;
  selectedText?: string;
  trigger?: React.ReactNode;
}

export const ReaderMarginDrawer: React.FC<ReaderMarginDrawerProps> = ({
  bookId,
  bookTitle,
  currentPage,
  selectedText = '',
  trigger,
}) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [viewScope, setViewScope] = useState<'page' | 'all'>('page');
  const [addDialogOpen, setAddDialogOpen] = useState(false);

  const { data: allNotes = [], isLoading: notesLoading } = useMarginNotes({ bookId });
  const { data: rooms = [] } = useReadingRooms();

  const pageNotes = allNotes.filter((n) => Number(n.page) === Number(currentPage));
  const displayedNotes = viewScope === 'page' ? pageNotes : allNotes;
  const activeBookRoom = rooms.find((r) => r.book_id === bookId);

  return (
    <Sheet>
      <SheetTrigger asChild>
        {trigger ? (
          trigger
        ) : (
          <Button
            variant="outline"
            size="sm"
            className="flex items-center gap-1.5 text-xs text-amber-700 dark:text-amber-300 border-amber-300/50 hover:bg-amber-50 dark:hover:bg-amber-950/40 relative"
          >
            <Quote className="w-3.5 h-3.5 text-amber-500" />
            <span>Margins</span>
            {pageNotes.length > 0 && (
              <Badge className="h-4 px-1 text-[10px] bg-amber-500 text-white rounded-full">
                {pageNotes.length}
              </Badge>
            )}
          </Button>
        )}
      </SheetTrigger>

      <SheetContent side="right" className="w-full sm:max-w-md p-0 flex flex-col bg-background">
        <SheetHeader className="p-4 border-b border-border text-left">
          <div className="flex items-center justify-between pr-6">
            <div>
              <SheetTitle className="text-base font-bold flex items-center gap-2">
                <Quote className="w-4 h-4 text-amber-500" />
                Community Margins
              </SheetTitle>
              <p className="text-xs text-muted-foreground truncate max-w-xs mt-0.5">
                {bookTitle}
              </p>
            </div>

            {user && (
              <Button
                size="sm"
                className="h-8 px-2.5 text-xs bg-amber-600 hover:bg-amber-700 text-white gap-1 shrink-0"
                onClick={() => setAddDialogOpen(true)}
              >
                <Plus className="w-3.5 h-3.5" />
                Add Note
              </Button>
            )}
          </div>

          {/* Active Co-Reading Room Banner if present */}
          {activeBookRoom && (
            <div
              onClick={() => navigate('/social?tab=rooms')}
              className="mt-3 flex items-center justify-between p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 cursor-pointer hover:bg-emerald-500/15 transition-all"
            >
              <div className="flex items-center gap-2 min-w-0">
                <Radio className="w-4 h-4 text-emerald-600 animate-pulse shrink-0" />
                <div className="min-w-0">
                  <p className="text-xs font-medium text-emerald-800 dark:text-emerald-300 truncate">
                    Live Room: {activeBookRoom.name}
                  </p>
                  <p className="text-[10px] text-muted-foreground">Join readers co-reading this title</p>
                </div>
              </div>
              <ExternalLink className="w-3.5 h-3.5 text-emerald-600 shrink-0 ml-2" />
            </div>
          )}

          {/* Tabs: This Page vs All Notes */}
          <div className="flex items-center gap-1.5 pt-2">
            <Button
              size="sm"
              variant={viewScope === 'page' ? 'secondary' : 'ghost'}
              className="h-7 text-xs px-2.5"
              onClick={() => setViewScope('page')}
            >
              This Page ({pageNotes.length})
            </Button>
            <Button
              size="sm"
              variant={viewScope === 'all' ? 'secondary' : 'ghost'}
              className="h-7 text-xs px-2.5"
              onClick={() => setViewScope('all')}
            >
              All Pages ({allNotes.length})
            </Button>
          </div>
        </SheetHeader>

        {/* Notes Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {notesLoading ? (
            <div className="text-center py-10 text-xs text-muted-foreground">
              Loading margin notes…
            </div>
          ) : displayedNotes.length === 0 ? (
            <div className="text-center py-12 px-4 space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-600 flex items-center justify-center mx-auto">
                <Quote className="w-6 h-6" />
              </div>
              <h4 className="text-sm font-semibold text-foreground">
                {viewScope === 'page' ? `No notes on Page ${currentPage}` : 'No margin notes for this book yet'}
              </h4>
              <p className="text-xs text-muted-foreground max-w-xs mx-auto">
                Highlight passages and record your thoughts or reactions. Notes are pinned to exact pages for fellow readers to discover.
              </p>
              {user ? (
                <Button
                  size="sm"
                  variant="outline"
                  className="text-xs text-amber-700 border-amber-300"
                  onClick={() => setAddDialogOpen(true)}
                >
                  <Plus className="w-3.5 h-3.5 mr-1" />
                  Leave Note on Page {currentPage}
                </Button>
              ) : (
                <p className="text-[11px] text-muted-foreground italic">Sign in to leave margin notes.</p>
              )}
            </div>
          ) : (
            displayedNotes.map((note) => (
              <MarginNoteCard key={note.id} note={note} />
            ))
          )}
        </div>
      </SheetContent>

      {/* Add Margin Note Dialog with current page & selected text */}
      <AddMarginNoteDialog
        open={addDialogOpen}
        onOpenChange={setAddDialogOpen}
        initialBookId={bookId}
        initialBookTitle={bookTitle}
        initialPage={currentPage}
        initialQuote={selectedText}
      />
    </Sheet>
  );
};
export default ReaderMarginDrawer;
