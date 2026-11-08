import React from 'react';
import { Link } from 'react-router-dom';
import { Bookmark, Clock, BookOpen, Layers, CheckCircle2, Flame, Heart } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Story, useToggleStoryBookmark, useToggleStoryLike } from '@/hooks/useStories';
import { useAuth } from '@/contexts/authHelpers';
import { safeFormatDistanceToNow } from '@/lib/dateUtils';

interface StoryCardProps {
  story: Story;
  showContinueReading?: boolean;
}

export const StoryCard: React.FC<StoryCardProps> = ({ story, showContinueReading = false }) => {
  const { user } = useAuth();
  const toggleBookmark = useToggleStoryBookmark();
  const toggleLike = useToggleStoryLike();

  const isSeries = story.story_type === 'series' || Boolean(story.parts_count && story.parts_count > 1);
  const authorName = story.author_name || story.profiles?.full_name || 'Reader';
  const authorPhoto = story.profiles?.profile_photo_url;
  const initial = authorName.charAt(0).toUpperCase();

  const handleBookmark = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleBookmark.mutate({ storyId: story.id, isBookmarked: Boolean(story.user_bookmarked) });
  };

  const handleLike = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleLike.mutate({ storyId: story.id, isLiked: Boolean(story.user_liked) });
  };

  const readTargetUrl = showContinueReading && story.last_read_part_number
    ? `/stories/${story.id}/part/${story.last_read_part_number}`
    : `/stories/${story.id}`;

  return (
    <Card className="group h-full overflow-hidden rounded-2xl border border-[#E8E2D9] bg-white transition-all duration-200 hover:-translate-y-1 hover:border-[#1C442D]/40 hover:shadow-lg dark:border-[#29332D] dark:bg-[#111614] flex flex-col">
      <Link to={readTargetUrl} className="block relative aspect-[16/9] w-full overflow-hidden bg-muted">
        {story.cover_image_url ? (
          <img
            src={story.cover_image_url}
            alt={story.title}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
            onError={(e) => {
              (e.currentTarget as HTMLElement).style.display = 'none';
            }}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-[#1C442D]/90 via-[#223528] to-[#122218] p-5 text-white">
            <div className="text-center">
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 backdrop-blur-xs text-[#D5B16D] mb-2 shadow-xs">
                {isSeries ? <Layers className="h-5 w-5" /> : <BookOpen className="h-5 w-5" />}
              </span>
              <p className="line-clamp-2 font-serif text-sm font-semibold tracking-tight text-[#FAF7F2]">
                {story.title}
              </p>
              <p className="mt-1 text-[11px] font-medium text-white/70">
                {story.genre}
              </p>
            </div>
          </div>
        )}

        {/* Top badges */}
        <div className="absolute left-3 top-3 flex flex-wrap gap-1.5">
          <Badge className="bg-[#1C442D]/90 text-white backdrop-blur-xs dark:bg-[#D5B16D] dark:text-[#0B0D0C] text-[11px] font-semibold border-0">
            {story.genre}
          </Badge>
          {isSeries && (
            <Badge variant="secondary" className="backdrop-blur-xs bg-white/85 text-[#1C201D] dark:bg-[#0B0D0C]/85 dark:text-[#F3F0E7] text-[11px]">
              <Layers className="mr-1 h-3 w-3" />
              Series
            </Badge>
          )}
          {user && user.id === story.user_id && (
            <Badge variant="secondary" className="backdrop-blur-xs bg-amber-500/80 text-white text-[10px] font-semibold border-0">
              Your Story
            </Badge>
          )}
        </div>

        {/* Status badge */}
        <div className="absolute right-3 top-3 flex items-center gap-1.5">
          {story.status === 'draft' ? (
            <Badge className="bg-amber-600/90 text-white backdrop-blur-xs text-[10px] font-medium border-0">
              Draft
            </Badge>
          ) : story.completion_status === 'completed' ? (
            <Badge className="bg-emerald-600/90 text-white backdrop-blur-xs text-[10px] font-medium border-0 gap-1">
              <CheckCircle2 className="h-3 w-3" />
              Completed
            </Badge>
          ) : (
            <Badge variant="outline" className="bg-white/85 text-[#636B65] dark:bg-[#0B0D0C]/85 dark:text-[#A5ADA6] backdrop-blur-xs text-[10px] font-medium border-0">
              Ongoing
            </Badge>
          )}
        </div>

        {/* Continue reading banner if applicable */}
        {showContinueReading && Boolean(story.last_read_part_number) && (
          <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-2.5 text-white flex items-center justify-between text-xs">
            <span className="font-medium text-[#D5B16D]">Resume Part {story.last_read_part_number}</span>
            <span className="text-[10px] text-white/80">Continue reading →</span>
          </div>
        )}
      </Link>

      <CardContent className="flex flex-1 flex-col p-4 sm:p-5">
        {/* Title */}
        <Link
          to={readTargetUrl}
          className="line-clamp-2 font-serif text-lg font-bold leading-snug text-[#1C201D] transition-colors hover:text-[#1C442D] dark:text-[#F3F0E7] dark:hover:text-[#D5B16D]"
        >
          {story.title}
        </Link>

        {/* Description */}
        <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-[#636B65] dark:text-[#A5ADA6] flex-1">
          {story.description || 'No description provided.'}
        </p>

        {/* Author info */}
        <div className="mt-4 flex items-center gap-2 border-t border-[#E8E2D9] pt-3 dark:border-[#29332D]">
          <Avatar className="h-6 w-6 border border-[#E8E2D9] dark:border-[#29332D]">
            <AvatarImage src={authorPhoto || undefined} alt={authorName} />
            <AvatarFallback className="bg-[#EBF2EC] text-[10px] font-bold text-[#1C442D] dark:bg-[#1C3024] dark:text-[#D5B16D]">
              {initial}
            </AvatarFallback>
          </Avatar>
          <span className="truncate text-xs font-medium text-[#1C201D] dark:text-[#F3F0E7]">
            {authorName}
          </span>
          <span className="text-xs text-[#636B65] dark:text-[#A5ADA6]">·</span>
          <span className="text-[11px] text-[#636B65] dark:text-[#A5ADA6] shrink-0">
            {story.published_at ? safeFormatDistanceToNow(story.published_at, { addSuffix: true }) : 'Draft'}
          </span>
        </div>

        {/* Card footer metrics & actions */}
        <div className="mt-3 flex items-center justify-between text-xs text-[#636B65] dark:text-[#A5ADA6]">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1" title="Reading time">
              <Clock className="h-3.5 w-3.5 text-muted-foreground" />
              {story.reading_time_minutes}m read
            </span>
            {isSeries && (
              <span className="flex items-center gap-1" title="Total parts">
                <Layers className="h-3.5 w-3.5 text-muted-foreground" />
                {story.parts_count || 1} {story.parts_count === 1 ? 'part' : 'parts'}
              </span>
            )}
          </div>

          <div className="flex items-center gap-1">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label={story.user_liked ? 'Unlike story' : 'Like story'}
              onClick={handleLike}
              className={`h-7 w-7 rounded-lg ${story.user_liked ? 'text-rose-600 hover:text-rose-700 dark:text-rose-400' : 'text-[#636B65] hover:text-[#1C201D] dark:text-[#A5ADA6] dark:hover:text-white'}`}
            >
              <Heart className={`h-3.5 w-3.5 ${story.user_liked ? 'fill-current' : ''}`} />
            </Button>
            <span className="text-[11px] mr-1">{story.likes_count || 0}</span>

            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label={story.user_bookmarked ? 'Remove bookmark' : 'Bookmark story'}
              onClick={handleBookmark}
              className={`h-7 w-7 rounded-lg ${story.user_bookmarked ? 'text-[#1C442D] dark:text-[#D5B16D]' : 'text-[#636B65] hover:text-[#1C201D] dark:text-[#A5ADA6] dark:hover:text-white'}`}
            >
              <Bookmark className={`h-3.5 w-3.5 ${story.user_bookmarked ? 'fill-current' : ''}`} />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
