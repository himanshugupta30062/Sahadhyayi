import React, { useState } from 'react';
import {
  BookOpen,
  CheckCircle2,
  Clock,
  Compass,
  Filter,
  Flame,
  Layers,
  Loader2,
  PenSquare,
  Plus,
  RefreshCw,
  Search,
  Sparkles,
  User,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { StoryCard } from './StoryCard';
import { StoryEditorDialog } from './StoryEditorDialog';
import { STORY_GENRES } from '@/config/stories';
import { StoryFilterOptions, useContinueReadingStories, useStories } from '@/hooks/useStories';
import { useAuth } from '@/contexts/authHelpers';
import SignInLink from '@/components/SignInLink';

export const StoriesFeed: React.FC = () => {
  const { user } = useAuth();
  const [activeFilter, setActiveFilter] = useState<'trending' | 'recent' | 'updated' | 'completed' | 'continue' | 'my-stories'>('recent');
  const [selectedGenre, setSelectedGenre] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [isEditorOpen, setIsEditorOpen] = useState(false);

  const queryOptions: StoryFilterOptions = {
    filter: activeFilter === 'continue' ? 'recent' : activeFilter,
    genre: selectedGenre,
    search: searchQuery,
  };

  const { data: stories = [], isLoading, isError, refetch } = useStories(queryOptions);
  const { data: continueStories = [], isLoading: isLoadingContinue } = useContinueReadingStories();

  const handleOpenEditor = () => {
    setIsEditorOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* ── Stories Hero & Publishing Bar ── */}
      <div className="relative overflow-hidden rounded-2xl border border-[#E8E2D9] bg-gradient-to-r from-[#FAF7F2] via-white to-[#F4EFEA] p-5 sm:p-6 dark:border-[#29332D] dark:from-[#111614] dark:via-[#161D19] dark:to-[#0B0D0C] shadow-xs">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-[#1C442D] dark:text-[#D5B16D]">
              <Sparkles className="h-3.5 w-3.5" />
              Community Short Stories & Serials
            </div>
            <h2 className="font-serif text-2xl sm:text-3xl font-bold tracking-tight text-[#1C201D] dark:text-[#F3F0E7]">
              Stories from Readers
            </h2>
            <p className="max-w-xl text-xs sm:text-sm text-[#636B65] dark:text-[#A5ADA6] leading-relaxed">
              Read captivating short fiction, serialized novels, and personal narratives written by fellow readers.
            </p>
          </div>

          <div className="shrink-0 flex items-center gap-2">
            {user ? (
              <Button
                onClick={handleOpenEditor}
                className="gap-2 bg-[#1C442D] text-white hover:bg-[#143221] dark:bg-[#D5B16D] dark:text-[#0B0D0C] dark:hover:bg-[#c49f5c] rounded-xl text-sm font-semibold h-11 px-5 shadow-sm"
              >
                <PenSquare className="h-4 w-4" />
                Write a Story
              </Button>
            ) : (
              <SignInLink redirectPath="/social?tab=stories">
                <Button className="gap-2 bg-[#1C442D] text-white hover:bg-[#143221] dark:bg-[#D5B16D] dark:text-[#0B0D0C] dark:hover:bg-[#c49f5c] rounded-xl text-sm font-semibold h-11 px-5">
                  <PenSquare className="h-4 w-4" />
                  Sign In to Write
                </Button>
              </SignInLink>
            )}
          </div>
        </div>
      </div>

      {/* ── Continue Reading Rail (when user has active reading progress) ── */}
      {user && continueStories.length > 0 && activeFilter !== 'continue' && (
        <div className="space-y-3 rounded-2xl border border-[#E8E2D9] bg-[#FAF7F2] p-4 sm:p-5 dark:border-[#29332D] dark:bg-[#101712]">
          <div className="flex items-center justify-between">
            <h3 className="flex items-center gap-2 font-serif text-base font-bold text-[#1C201D] dark:text-[#F3F0E7]">
              <Clock className="h-4 w-4 text-[#1C442D] dark:text-[#D5B16D]" />
              Continue Reading
            </h3>
            <button
              type="button"
              onClick={() => setActiveFilter('continue')}
              className="text-xs font-semibold text-[#1C442D] hover:underline dark:text-[#D5B16D]"
            >
              View all ({continueStories.length}) →
            </button>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {continueStories.slice(0, 3).map((story) => (
              <StoryCard key={story.id} story={story} showContinueReading={true} />
            ))}
          </div>
        </div>
      )}

      {/* ── Filter & Search Controls ── */}
      <div className="flex flex-col gap-3 rounded-2xl border border-[#E8E2D9] bg-white p-3 sm:p-4 dark:border-[#29332D] dark:bg-[#111614] shadow-xs">
        {/* Primary Discovery Tabs */}
        <div className="flex flex-wrap items-center gap-1.5 border-b border-[#E8E2D9] pb-3 dark:border-[#29332D]">
          {[
            { id: 'recent', label: 'Recently Published', icon: Sparkles },
            { id: 'trending', label: 'Trending Stories', icon: Flame },
            { id: 'updated', label: 'Recently Updated', icon: RefreshCw },
            { id: 'completed', label: 'Completed Series', icon: CheckCircle2 },
            ...(user ? [{ id: 'continue', label: 'Continue Reading', icon: Clock }] : []),
            ...(user ? [{ id: 'my-stories', label: 'My Stories', icon: User }] : []),
          ].map(({ id, label, icon: Icon }) => {
            const isActive = activeFilter === id;
            return (
              <button
                key={id}
                type="button"
                onClick={() => setActiveFilter(id as any)}
                className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-medium transition-colors ${
                  isActive
                    ? 'bg-[#1C442D] text-white dark:bg-[#D5B16D] dark:text-[#0B0D0C] font-semibold'
                    : 'text-[#636B65] hover:bg-[#FAF7F2] hover:text-[#1C201D] dark:text-[#A5ADA6] dark:hover:bg-[#161D19] dark:hover:text-[#F3F0E7]'
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                {label}
              </button>
            );
          })}
        </div>

        {/* Secondary Search & Genre Filters */}
        <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between pt-1">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              placeholder="Search stories by title, author, or keywords..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-9 pl-9 rounded-xl border-[#E8E2D9] dark:border-[#29332D] text-xs"
            />
          </div>

          <div className="flex items-center gap-2">
            <Select value={selectedGenre} onValueChange={setSelectedGenre}>
              <SelectTrigger className="h-9 w-44 rounded-xl border-[#E8E2D9] dark:border-[#29332D] text-xs">
                <Filter className="mr-1.5 h-3.5 w-3.5 text-muted-foreground" />
                <SelectValue placeholder="All Genres" />
              </SelectTrigger>
              <SelectContent className="max-h-60 rounded-xl text-xs">
                <SelectItem value="All">All Genres</SelectItem>
                {STORY_GENRES.map((g) => (
                  <SelectItem key={g} value={g}>
                    {g}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {(searchQuery || selectedGenre !== 'All') && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSearchQuery('');
                  setSelectedGenre('All');
                }}
                className="h-9 text-xs rounded-xl"
              >
                Reset
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* ── Stories Grid & Feed ── */}
      {isLoading || (activeFilter === 'continue' && isLoadingContinue) ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3 text-muted-foreground">
          <Loader2 className="h-7 w-7 animate-spin text-[#1C442D] dark:text-[#D5B16D]" />
          <p className="text-sm font-medium">Loading stories…</p>
        </div>
      ) : isError ? (
        <div className="rounded-2xl border border-rose-300/60 bg-rose-50/60 p-8 text-center dark:border-rose-900/60 dark:bg-rose-950/20">
          <p className="text-sm text-rose-700 dark:text-rose-300">
            Stories could not be loaded. Please check your connection and try again.
          </p>
          <Button variant="outline" size="sm" onClick={() => void refetch()} className="mt-3 rounded-xl">
            Retry
          </Button>
        </div>
      ) : activeFilter === 'continue' ? (
        continueStories.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-[#E8E2D9] p-12 text-center dark:border-[#29332D]">
            <Clock className="mx-auto mb-3 h-10 w-10 text-muted-foreground" />
            <h3 className="font-serif text-lg font-bold text-[#1C201D] dark:text-[#F3F0E7]">
              No active stories to continue
            </h3>
            <p className="mt-1 text-xs text-[#636B65] dark:text-[#A5ADA6]">
              Start reading any story below and your progress will appear here automatically.
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setActiveFilter('recent')}
              className="mt-4 rounded-xl text-xs"
            >
              Browse Stories
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {continueStories.map((story) => (
              <StoryCard key={story.id} story={story} showContinueReading={true} />
            ))}
          </div>
        )
      ) : stories.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[#E8E2D9] p-12 text-center dark:border-[#29332D]">
          <BookOpen className="mx-auto mb-3 h-10 w-10 text-muted-foreground" />
          <h3 className="font-serif text-lg font-bold text-[#1C201D] dark:text-[#F3F0E7]">
            {activeFilter === 'my-stories'
              ? "You haven't written any stories yet"
              : searchQuery || selectedGenre !== 'All'
              ? 'No matching stories found'
              : 'Be the first to publish a short story'}
          </h3>
          <p className="mt-1 max-w-md mx-auto text-xs text-[#636B65] dark:text-[#A5ADA6] leading-relaxed">
            {activeFilter === 'my-stories'
              ? 'Share a standalone piece or start an episodic reading series with the community.'
              : 'Try adjusting your search filters or start writing your own story.'}
          </p>
          <Button
            onClick={handleOpenEditor}
            className="mt-4 gap-2 bg-[#1C442D] text-white hover:bg-[#143221] dark:bg-[#D5B16D] dark:text-[#0B0D0C] dark:hover:bg-[#c49f5c] rounded-xl text-xs h-10 px-5 font-semibold"
          >
            <PenSquare className="h-4 w-4" />
            Start Writing
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {stories.map((story) => (
            <StoryCard key={story.id} story={story} />
          ))}
        </div>
      )}

      {/* Editor Modal */}
      <StoryEditorDialog open={isEditorOpen} onOpenChange={setIsEditorOpen} />
    </div>
  );
};
