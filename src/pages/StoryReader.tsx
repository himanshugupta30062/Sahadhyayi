import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowRight,
  Bookmark,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  Heart,
  Layers,
  List,
  Loader2,
  MessageCircle,
  Plus,
  Radio,
  Share2,
  Sparkles,
  Type,
  UserPlus,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Textarea } from '@/components/ui/textarea';
import SEO from '@/components/SEO';
import {
  useAddStoryComment,
  useSaveStoryProgress,
  useStoryComments,
  useStoryPart,
  useToggleStoryBookmark,
  useToggleStoryFollow,
  useToggleStoryLike,
} from '@/hooks/useStories';
import { useAuth } from '@/contexts/authHelpers';
import { safeFormatDistanceToNow } from '@/lib/dateUtils';
import { toast } from 'sonner';

export default function StoryReader() {
  const { storyId, partNumber: partNumParam } = useParams<{ storyId: string; partNumber?: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const currentPartNum = partNumParam ? Math.max(1, parseInt(partNumParam, 10) || 1) : 1;

  // Query part details
  const { data, isLoading, isError, error } = useStoryPart(storyId, currentPartNum);
  const { story, part, allParts = [], isAuthor } = data || {};

  // Interactions hooks
  const toggleLike = useToggleStoryLike();
  const toggleBookmark = useToggleStoryBookmark();
  const toggleFollow = useToggleStoryFollow();
  const saveProgress = useSaveStoryProgress();
  const { data: comments = [], isLoading: isLoadingComments } = useStoryComments(storyId);
  const addComment = useAddStoryComment();

  // Reader Customization State
  const [fontSize, setFontSize] = useState<'sm' | 'base' | 'lg' | 'xl'>('base');
  const [newComment, setNewComment] = useState('');
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [isChapterListOpen, setIsChapterListOpen] = useState(false);
  const articleRef = useRef<HTMLElement>(null);

  // Monitor Scroll Progress
  useEffect(() => {
    const handleScroll = () => {
      const el = articleRef.current;
      if (!el) return;
      const totalHeight = el.scrollHeight - window.innerHeight;
      if (totalHeight <= 0) {
        setScrollProgress(100);
        return;
      }
      const currentScroll = window.scrollY - el.offsetTop;
      const pct = Math.min(100, Math.max(0, Math.round((currentScroll / totalHeight) * 100)));
      setScrollProgress(pct);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [part?.content]);

  // Save progress when user views a part
  useEffect(() => {
    if (user && storyId && part?.id) {
      saveProgress.mutate({
        storyId,
        partId: part.id,
        partNumber: currentPartNum,
        percentage: 100,
      });
    }
  }, [user, storyId, part?.id, currentPartNum, saveProgress]);

  // Break content into comfortable paragraphs
  const paragraphs = useMemo(() => {
    if (!part?.content) return [];
    return part.content.split(/\r?\n+/).map((p) => p.trim()).filter(Boolean);
  }, [part?.content]);

  const authorName = story?.author_name || story?.profiles?.full_name || 'Reader';
  const authorPhoto = story?.profiles?.profile_photo_url;
  const initial = authorName.charAt(0).toUpperCase();

  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({
          title: story?.title,
          text: `Read "${story?.title}" by ${authorName} on Sahadhyayi`,
          url,
        });
      } catch {
        // User cancelled share
      }
    } else {
      await navigator.clipboard.writeText(url);
      toast.success('Story link copied to clipboard!');
    }
  };

  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast.error('Sign in to leave a comment.');
      return;
    }
    if (!newComment.trim() || !storyId) return;

    setIsSubmittingComment(true);
    try {
      await addComment.mutateAsync({
        storyId,
        content: newComment.trim(),
        partId: part?.id,
      });
      setNewComment('');
    } catch (err: any) {
      toast.error(err?.message || 'Failed to post comment.');
    } finally {
      setIsSubmittingComment(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-[70vh] flex-col items-center justify-center gap-3 text-muted-foreground">
        <Loader2 className="h-8 w-8 animate-spin text-[#1C442D] dark:text-[#D5B16D]" />
        <p className="font-serif text-sm">Opening story reader…</p>
      </div>
    );
  }

  if (isError || !story || !part) {
    return (
      <div className="mx-auto max-w-xl px-4 py-20 text-center">
        <h2 className="font-serif text-2xl font-bold text-rose-700 dark:text-rose-400">
          Story part not available
        </h2>
        <p className="mt-2 text-sm text-[#636B65] dark:text-[#A5ADA6]">
          {error instanceof Error ? error.message : 'The requested story chapter could not be found.'}
        </p>
        <Link to="/social?tab=stories">
          <Button className="mt-5 rounded-xl bg-[#1C442D] text-white hover:bg-[#143221]">
            ← Return to Stories Feed
          </Button>
        </Link>
      </div>
    );
  }

  const isSeries = story.story_type === 'series';
  const totalParts = allParts.length || 1;
  const hasPrevious = currentPartNum > 1;
  const hasNext = currentPartNum < totalParts;

  const fontClass = {
    sm: 'text-sm sm:text-base leading-relaxed',
    base: 'text-base sm:text-lg leading-loose',
    lg: 'text-lg sm:text-xl leading-loose',
    xl: 'text-xl sm:text-2xl leading-loose',
  }[fontSize];

  return (
    <>
      <SEO
        title={`${part.title} · ${story.title} | Sahadhyayi Stories`}
        description={story.description || `Read ${story.title} by ${authorName} on Sahadhyayi.`}
        canonical={`https://sahadhyayi.com/stories/${story.id}/part/${currentPartNum}`}
      />

      {/* Top sticky reading progress bar */}
      <div className="fixed top-16 inset-x-0 z-40 h-1 bg-transparent">
        <div
          className="h-full bg-gradient-to-r from-[#1C442D] via-[#2F6F49] to-[#D5B16D] transition-all duration-150"
          style={{ width: `${scrollProgress}%` }}
        />
      </div>

      <div className="min-h-screen bg-[#FAFAF8] pb-24 text-[#1C201D] dark:bg-[#0B0D0C] dark:text-[#F3F0E7]">
        {/* ── Top Navigation & Series Bar ── */}
        <header className="sticky top-16 z-30 border-b border-[#E8E2D9] bg-white/95 backdrop-blur-md dark:border-[#29332D] dark:bg-[#111614]/95">
          <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-3 sm:px-6">
            <div className="flex items-center gap-3 truncate">
              <Link
                to="/social?tab=stories"
                className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-[#E8E2D9] text-[#636B65] hover:bg-[#FAF7F2] hover:text-[#1C201D] dark:border-[#29332D] dark:text-[#A5ADA6] dark:hover:bg-[#1A231D]"
                aria-label="Back to stories"
              >
                <ArrowLeft className="h-4 w-4" />
              </Link>

              <div className="min-w-0">
                <p className="truncate font-serif text-sm font-bold text-[#1C201D] dark:text-[#F3F0E7]">
                  {story.title}
                </p>
                <div className="flex items-center gap-2 text-[11px] text-[#636B65] dark:text-[#A5ADA6]">
                  <span>by {authorName}</span>
                  {isSeries && (
                    <>
                      <span>·</span>
                      <span className="font-semibold text-[#1C442D] dark:text-[#D5B16D]">
                        Part {currentPartNum} of {totalParts}
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              {/* Font Resizer */}
              <div className="hidden sm:flex items-center rounded-xl border border-[#E8E2D9] p-0.5 dark:border-[#29332D]">
                <button
                  type="button"
                  onClick={() => setFontSize('sm')}
                  className={`px-2 py-1 text-[11px] font-bold rounded-lg ${fontSize === 'sm' ? 'bg-[#1C442D] text-white dark:bg-[#D5B16D] dark:text-[#0B0D0C]' : 'text-muted-foreground'}`}
                >
                  A-
                </button>
                <button
                  type="button"
                  onClick={() => setFontSize('base')}
                  className={`px-2 py-1 text-[11px] font-bold rounded-lg ${fontSize === 'base' ? 'bg-[#1C442D] text-white dark:bg-[#D5B16D] dark:text-[#0B0D0C]' : 'text-muted-foreground'}`}
                >
                  A
                </button>
                <button
                  type="button"
                  onClick={() => setFontSize('lg')}
                  className={`px-2 py-1 text-[11px] font-bold rounded-lg ${fontSize === 'lg' ? 'bg-[#1C442D] text-white dark:bg-[#D5B16D] dark:text-[#0B0D0C]' : 'text-muted-foreground'}`}
                >
                  A+
                </button>
              </div>

              {/* Chapter Drawer for Series */}
              {isSeries && (
                <Sheet open={isChapterListOpen} onOpenChange={setIsChapterListOpen}>
                  <SheetTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-1.5 rounded-xl border-[#E8E2D9] text-xs dark:border-[#29332D]"
                    >
                      <List className="h-4 w-4" />
                      <span className="hidden sm:inline">Parts</span>
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="right" className="w-[340px] sm:w-[400px] border-[#E8E2D9] dark:border-[#29332D]">
                    <SheetHeader className="pb-3 border-b border-[#E8E2D9] dark:border-[#29332D]">
                      <SheetTitle className="font-serif text-lg font-bold">Chapter List</SheetTitle>
                      <SheetDescription className="text-xs">
                        {story.title} ({totalParts} parts)
                      </SheetDescription>
                    </SheetHeader>
                    <div className="mt-4 space-y-1 overflow-y-auto max-h-[80vh] pr-1">
                      {allParts.map((item) => {
                        const isCurrent = item.part_number === currentPartNum;
                        return (
                          <button
                            key={item.id}
                            type="button"
                            onClick={() => {
                              setIsChapterListOpen(false);
                              navigate(`/stories/${story.id}/part/${item.part_number}`);
                            }}
                            className={`flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left text-xs transition-colors ${
                              isCurrent
                                ? 'bg-[#1C442D] text-white font-semibold dark:bg-[#D5B16D] dark:text-[#0B0D0C]'
                                : 'text-[#1C201D] hover:bg-[#FAF7F2] dark:text-[#F3F0E7] dark:hover:bg-[#1A231D]'
                            }`}
                          >
                            <span className="truncate">
                              Part {item.part_number}: {item.title}
                            </span>
                            {isCurrent && <span className="text-[10px] font-bold uppercase ml-2">Reading</span>}
                          </button>
                        );
                      })}
                    </div>
                  </SheetContent>
                </Sheet>
              )}

              {/* Share button */}
              <Button
                variant="ghost"
                size="icon"
                onClick={handleShare}
                aria-label="Share story"
                className="h-9 w-9 rounded-xl text-muted-foreground hover:text-foreground"
              >
                <Share2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </header>

        {/* ── Main Prose Container ── */}
        <main ref={articleRef} className="mx-auto max-w-2xl px-4 sm:px-6 pt-10 sm:pt-14">
          {/* Header Meta */}
          <div className="mb-10 text-center space-y-3">
            <div className="inline-flex items-center gap-2">
              <Badge className="bg-[#1C442D]/10 text-[#1C442D] dark:bg-[#D5B16D]/15 dark:text-[#D5B16D] font-semibold text-xs border-0">
                {story.genre}
              </Badge>
              {isSeries && (
                <Badge variant="secondary" className="text-xs">
                  Part {currentPartNum} of {totalParts}
                </Badge>
              )}
              {story.completion_status === 'completed' && (
                <Badge variant="outline" className="text-xs text-emerald-600 dark:text-emerald-400 gap-1">
                  <CheckCircle2 className="h-3 w-3" /> Completed
                </Badge>
              )}
            </div>

            <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-[#1C201D] dark:text-[#F3F0E7] leading-tight">
              {part.title}
            </h1>

            {part.title !== story.title && (
              <p className="font-serif text-base text-[#636B65] dark:text-[#A5ADA6] italic">
                from "{story.title}"
              </p>
            )}

            <div className="flex items-center justify-center gap-3 pt-2 text-xs text-[#636B65] dark:text-[#A5ADA6]">
              <span className="flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" />
                {story.reading_time_minutes} min read
              </span>
              <span>·</span>
              <span>Published {part.published_at ? safeFormatDistanceToNow(part.published_at, { addSuffix: true }) : 'Recently'}</span>
            </div>
          </div>

          {/* Reading Prose Body */}
          <article className="prose prose-neutral dark:prose-invert max-w-none">
            <div className={`space-y-6 sm:space-y-7 font-serif text-[#1C201D] dark:text-[#E8E6DF] ${fontClass}`}>
              {paragraphs.map((p, idx) => (
                <p key={idx} className="leading-relaxed sm:leading-loose">
                  {p}
                </p>
              ))}
            </div>
          </article>

          {/* Series Part Navigation (Previous / Next) */}
          {isSeries && (
            <div className="mt-14 flex items-center justify-between border-y border-[#E8E2D9] py-5 dark:border-[#29332D]">
              {hasPrevious ? (
                <Link to={`/stories/${story.id}/part/${currentPartNum - 1}`}>
                  <Button variant="outline" className="gap-2 rounded-xl text-xs h-10">
                    <ChevronLeft className="h-4 w-4" /> Previous Part
                  </Button>
                </Link>
              ) : (
                <div />
              )}

              {hasNext ? (
                <Link to={`/stories/${story.id}/part/${currentPartNum + 1}`}>
                  <Button className="gap-2 rounded-xl bg-[#1C442D] text-white hover:bg-[#143221] dark:bg-[#D5B16D] dark:text-[#0B0D0C] dark:hover:bg-[#c49f5c] text-xs h-10 px-5 font-semibold">
                    Next Part <ChevronRight className="h-4 w-4" />
                  </Button>
                </Link>
              ) : (
                <div className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4" />
                  You've reached the latest chapter!
                </div>
              )}
            </div>
          )}

          {/* ── Story Engagement Toolbar ── */}
          <div className="mt-10 rounded-2xl border border-[#E8E2D9] bg-white p-4 sm:p-5 dark:border-[#29332D] dark:bg-[#111614] flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Button
                variant={story.user_liked ? 'default' : 'outline'}
                size="sm"
                onClick={() => toggleLike.mutate({ storyId: story.id, isLiked: Boolean(story.user_liked) })}
                className={`gap-1.5 rounded-xl text-xs ${
                  story.user_liked
                    ? 'bg-rose-600 text-white hover:bg-rose-700'
                    : 'border-[#E8E2D9] dark:border-[#29332D]'
                }`}
              >
                <Heart className={`h-4 w-4 ${story.user_liked ? 'fill-current' : ''}`} />
                <span>{story.likes_count || 0} Likes</span>
              </Button>

              <Button
                variant={story.user_bookmarked ? 'default' : 'outline'}
                size="sm"
                onClick={() => toggleBookmark.mutate({ storyId: story.id, isBookmarked: Boolean(story.user_bookmarked) })}
                className={`gap-1.5 rounded-xl text-xs ${
                  story.user_bookmarked
                    ? 'bg-[#1C442D] text-white hover:bg-[#143221] dark:bg-[#D5B16D] dark:text-[#0B0D0C]'
                    : 'border-[#E8E2D9] dark:border-[#29332D]'
                }`}
              >
                <Bookmark className={`h-4 w-4 ${story.user_bookmarked ? 'fill-current' : ''}`} />
                <span>{story.user_bookmarked ? 'Bookmarked' : 'Bookmark'}</span>
              </Button>

              {isSeries && (
                <Button
                  variant={story.user_following ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => toggleFollow.mutate({ storyId: story.id, isFollowing: Boolean(story.user_following) })}
                  className={`gap-1.5 rounded-xl text-xs ${
                    story.user_following
                      ? 'bg-amber-600 text-white hover:bg-amber-700'
                      : 'border-[#E8E2D9] dark:border-[#29332D]'
                  }`}
                >
                  <Radio className="h-4 w-4" />
                  <span>{story.user_following ? 'Following Series' : 'Follow Series'}</span>
                </Button>
              )}
            </div>

            <Button
              variant="ghost"
              size="sm"
              onClick={handleShare}
              className="gap-1.5 rounded-xl text-xs text-muted-foreground hover:text-foreground"
            >
              <Share2 className="h-4 w-4" />
              Share
            </Button>
          </div>

          {/* ── Author Bio Card ── */}
          <div className="mt-8 rounded-2xl border border-[#E8E2D9] bg-[#FAF7F2] p-5 sm:p-6 dark:border-[#29332D] dark:bg-[#161D19]">
            <div className="flex items-start gap-4">
              <Avatar className="h-12 w-12 border-2 border-[#1C442D]/20 dark:border-[#D5B16D]/30 shrink-0">
                <AvatarImage src={authorPhoto || undefined} alt={authorName} />
                <AvatarFallback className="bg-[#EBF2EC] font-serif text-base font-bold text-[#1C442D] dark:bg-[#1C3024] dark:text-[#D5B16D]">
                  {initial}
                </AvatarFallback>
              </Avatar>

              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between">
                  <h3 className="font-serif text-base font-bold text-[#1C201D] dark:text-[#F3F0E7]">
                    Written by {authorName}
                  </h3>
                  <Link to="/social?tab=stories">
                    <span className="text-xs font-semibold text-[#1C442D] hover:underline dark:text-[#D5B16D]">
                      More stories →
                    </span>
                  </Link>
                </div>
                <p className="mt-1 text-xs leading-relaxed text-[#636B65] dark:text-[#A5ADA6]">
                  A passionate reader and storyteller on Sahadhyayi. Connecting ideas, imagination, and literature.
                </p>
              </div>
            </div>
          </div>

          {/* ── Story Comments & Discussion ── */}
          <section className="mt-12 space-y-6">
            <div className="border-b border-[#E8E2D9] pb-3 dark:border-[#29332D]">
              <h3 className="flex items-center gap-2 font-serif text-xl font-bold text-[#1C201D] dark:text-[#F3F0E7]">
                <MessageCircle className="h-5 w-5 text-[#1C442D] dark:text-[#D5B16D]" />
                Reader Reactions ({comments.length})
              </h3>
            </div>

            {/* Comment composer */}
            <form onSubmit={handleCommentSubmit} className="space-y-3">
              <Textarea
                placeholder={user ? "Share your thoughts on this story or chapter..." : "Sign in to leave a reaction or reflection..."}
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                disabled={!user || isSubmittingComment}
                rows={3}
                className="rounded-xl border-[#E8E2D9] dark:border-[#29332D] text-xs resize-none"
              />
              <div className="flex justify-end">
                <Button
                  type="submit"
                  size="sm"
                  disabled={!user || !newComment.trim() || isSubmittingComment}
                  className="rounded-xl bg-[#1C442D] text-white hover:bg-[#143221] dark:bg-[#D5B16D] dark:text-[#0B0D0C] text-xs font-semibold"
                >
                  {isSubmittingComment ? 'Posting…' : 'Post Reflection'}
                </Button>
              </div>
            </form>

            {/* Comments list */}
            {isLoadingComments ? (
              <div className="py-6 text-center text-xs text-muted-foreground">Loading comments…</div>
            ) : comments.length === 0 ? (
              <p className="py-6 text-center text-xs text-[#636B65] dark:text-[#A5ADA6]">
                No reactions yet. Be the first reader to share a reflection!
              </p>
            ) : (
              <div className="space-y-3">
                {comments.map((comment) => {
                  const commenter = comment.profiles?.full_name || 'Reader';
                  return (
                    <div
                      key={comment.id}
                      className="rounded-xl border border-[#E8E2D9] bg-white p-3.5 text-xs dark:border-[#29332D] dark:bg-[#111614]"
                    >
                      <div className="flex items-center justify-between text-[#636B65] dark:text-[#A5ADA6] mb-1.5">
                        <span className="font-semibold text-[#1C201D] dark:text-[#F3F0E7]">{commenter}</span>
                        <span className="text-[10px]">{safeFormatDistanceToNow(comment.created_at, { addSuffix: true })}</span>
                      </div>
                      <p className="leading-relaxed text-[#1C201D] dark:text-[#F3F0E7]">{comment.content}</p>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        </main>
      </div>
    </>
  );
}
