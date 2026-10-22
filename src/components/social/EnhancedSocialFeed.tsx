import React, { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client-universal';
import { resolveSocialPostImages } from '@/lib/socialPostMedia';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Heart, MessageCircle, Share2, Clock, Repeat2, MoreHorizontal, Trash2, Users, Copy, Check } from 'lucide-react';
import {
  useSocialPosts,
  useTogglePostLike,
  useToggleRepost,
  useDeletePost,
  SocialPost,
} from '@/hooks/useSocialPosts';
import { FeedComposer } from './FeedComposer';
import { EnhancedCommentSection } from './EnhancedCommentSection';
import { ShareModal } from './ShareModal';
import { RepostDialog } from './RepostDialog';
import { BookPulseBar } from './BookPulseBar';
import { DnaMatchChip } from './dna/DnaMatchChip';
import MarginNoteCard from './margins/MarginNoteCard';
import { SpoilerThreadCard } from './threads/SpoilerThreadCard';
import { useMarginNotes } from '@/hooks/useMarginNotes';
import { useSpoilerThreads } from '@/hooks/useSpoilerThreads';
import LoadingSpinner from '@/components/LoadingSpinner';
import { safeFormatDistanceToNow } from '@/lib/dateUtils';
import { useAuth } from '@/contexts/authHelpers';
import { Quote, Lock, Sparkles } from 'lucide-react';

const EmbeddedOriginalPost: React.FC<{
  post?: SocialPost | null;
  onImageClick?: (src: string, alt: string) => void;
}> = ({ post, onImageClick }) => {
  if (!post) return null;

  const profile = Array.isArray(post.profiles) ? post.profiles[0] : post.profiles;
  const book = Array.isArray(post.books_library) ? post.books_library[0] : post.books_library;

  return (
    <div className="mt-3 border border-[#E8E2D9] dark:border-[#29332D] rounded-xl p-3 bg-[#FAF7F2] dark:bg-[#161D19]/60">
      <div className="flex items-center gap-2 mb-2">
        <Avatar className="w-7 h-7 border border-[#E8E2D9] dark:border-[#29332D]">
          <AvatarImage src={profile?.profile_photo_url} />
          <AvatarFallback className="bg-[#EBF2EC] text-[#1C442D] dark:bg-[#1C3024] dark:text-[#D5B16D] text-[10px] font-semibold">
            {profile?.full_name?.charAt(0) || 'U'}
          </AvatarFallback>
        </Avatar>
        <div className="text-xs flex items-center gap-1.5 flex-wrap">
          <span className="font-medium text-[#1C201D] dark:text-[#F3F0E7]">{profile?.full_name || 'Anonymous'}</span>
          {post.user_id && <DnaMatchChip userId={post.user_id} userName={profile?.full_name || 'Reader'} />}
          {profile?.username && (
            <span className="text-[#636B65] dark:text-[#A5ADA6]"> · @{profile.username}</span>
          )}
          <span className="text-[#636B65] dark:text-[#A5ADA6]"> · {safeFormatDistanceToNow(post.created_at, { addSuffix: true })}</span>
        </div>
      </div>
      <p className="text-sm text-[#1C201D] dark:text-[#F3F0E7] whitespace-pre-wrap">{post.content}</p>
      {post.image_url && (
        <div className="mt-2 rounded-lg overflow-hidden border border-[#E8E2D9] dark:border-[#29332D]">
          <button
            type="button"
            onClick={() => onImageClick?.(post.image_url as string, post.image_alt?.trim() || 'Shared reading photo')}
            aria-label={`View image: ${post.image_alt?.trim() || 'Shared reading photo'}`}
            className="block w-full cursor-zoom-in focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1C442D] dark:focus-visible:ring-[#D5B16D]"
          >
            <img
              src={post.image_url}
              alt={post.image_alt?.trim() || "Shared reading photo"}
              loading="lazy"
              decoding="async"
              onError={(e) => {
                (e.currentTarget as HTMLElement).style.display = 'none';
              }}
              className="block max-h-72 w-full bg-[#F4EFEA] object-contain dark:bg-[#0B0D0C]"
            />
          </button>
        </div>
      )}
      {book && (
        <Link
          to={`/book/${post.book_id || book.id}`}
          aria-label={`View book: ${book.title}`}
          className="mt-2 flex items-center gap-2 text-xs text-[#636B65] hover:text-[#1C442D] dark:text-[#A5ADA6] dark:hover:text-[#D5B16D] transition-colors"
        >
          <span>📖</span>
          <span className="truncate">
            <strong className="text-[#1C201D] hover:text-[#1C442D] dark:text-[#F3F0E7] dark:hover:text-[#D5B16D] transition-colors">{book.title}</strong>
            {book.author ? ` — ${book.author}` : ''}
          </span>
        </Link>
      )}
    </div>
  );
};

export const EnhancedSocialFeed = () => {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const queryClient = useQueryClient();
  const requestedPostId = searchParams.get('post');
  const [highlightedPostId, setHighlightedPostId] = useState<string | null>(null);
  const [imageViewer, setImageViewer] = useState<{ src: string; alt: string } | null>(null);
  const [streamMode, setStreamMode] = useState<'community' | 'following'>('community');
  const { posts, isLoading, error, refetch, hasMore, isLoadingMore, loadMore, loadMoreError } = useSocialPosts(streamMode);
  const toggleLike = useTogglePostLike();
  const toggleRepost = useToggleRepost();
  const deletePost = useDeletePost();
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [repostPost, setRepostPost] = useState<SocialPost | null>(null);
  const [selectedPost, setSelectedPost] = useState<SocialPost | null>(null);
  const [showComments, setShowComments] = useState<{ [key: string]: boolean }>({});
  const [copiedQuoteId, setCopiedQuoteId] = useState<string | null>(null);
  const [feedFilter, setFeedFilter] = useState<'all' | 'posts' | 'margins' | 'threads'>('all');
  const {
    data: marginNotes = [],
    isLoading: marginLoading,
    error: marginError,
    refetch: refetchMarginNotes,
  } = useMarginNotes({ filter: 'all' });
  const {
    data: spoilerThreads = [],
    isLoading: threadsLoading,
    error: threadsError,
    refetch: refetchThreads,
  } = useSpoilerThreads(undefined, { enabled: feedFilter === 'threads' });

  // Shared URLs use /social?post=<id>. Resolve the single post through the same
  // audience-aware RLS boundary as the feed, so an inaccessible post is never
  // rendered merely because someone knows its identifier.
  useEffect(() => {
    if (!requestedPostId || !user?.id || streamMode !== 'community' || isLoading) return;

    let cancelled = false;
    let scrollTimer: number | undefined;
    let clearTimer: number | undefined;
    const queryKey = ['social-posts', user.id, streamMode] as const;

    const revealPost = async () => {
      const cachedPosts = queryClient.getQueryData<SocialPost[]>(queryKey) || [];
      if (!cachedPosts.some((post) => post.id === requestedPostId)) {
        const { data, error: postError } = await supabase
          .from('posts')
          .select(`
            *,
            profiles!posts_user_id_profiles_fkey(id, full_name, username, profile_photo_url),
            books_library(id, title, author, cover_image_url)
          `)
          .eq('id', requestedPostId)
          .maybeSingle();

        if (cancelled) return;
        if (postError) {
          console.warn('Unable to resolve shared social post:', postError);
          return;
        }
        if (!data) return;
        const [resolvedPost] = await resolveSocialPostImages([data as unknown as SocialPost]);
        if (cancelled) return;

        queryClient.setQueryData<SocialPost[]>(queryKey, (current = []) => (
          current.some((post) => post.id === requestedPostId)
            ? current
            : [resolvedPost, ...current]
        ));
      }

      scrollTimer = window.setTimeout(() => {
        if (cancelled) return;
        const target = document.getElementById(`social-post-${requestedPostId}`);
        if (!target) return;
        target.scrollIntoView({ behavior: 'smooth', block: 'center' });
        setHighlightedPostId(requestedPostId);
        clearTimer = window.setTimeout(() => {
          setHighlightedPostId((current) => current === requestedPostId ? null : current);
        }, 2600);
      }, 350);
    };

    void revealPost();
    return () => {
      cancelled = true;
      if (scrollTimer !== undefined) window.clearTimeout(scrollTimer);
      if (clearTimer !== undefined) window.clearTimeout(clearTimer);
    };
  }, [requestedPostId, user?.id, streamMode, queryClient, isLoading]);

  const handleLike = (post: SocialPost) => {
    if (!user) return;
    toggleLike.mutate({ postId: post.id, isLiked: post.user_liked || false });
  };

  const handleRepostClick = (post: SocialPost) => {
    if (!user) return;
    if (post.user_reposted) {
      // Undo repost directly
      toggleRepost.mutate({ post, isReposted: true });
    } else {
      setRepostPost(post);
    }
  };

  const handleShare = (post: SocialPost) => {
    setSelectedPost(post);
    setShareModalOpen(true);
  };

  const handleCopyQuote = async (post: SocialPost) => {
    const quote = post.quote_text?.trim();
    if (!quote) return;
    const attribution = [post.quote_author?.trim(), post.quote_source?.trim()].filter(Boolean).join(' — ');
    const shareText = [`“${quote}”`, attribution, post.quote_context?.trim(), `${window.location.origin}/social?post=${encodeURIComponent(post.id)}`].filter(Boolean).join('\n\n');
    try {
      await navigator.clipboard.writeText(shareText);
      setCopiedQuoteId(post.id);
      window.setTimeout(() => setCopiedQuoteId((current) => current === post.id ? null : current), 1800);
    } catch (error) {
      console.error('Could not copy quote card text:', error);
    }
  };

  const toggleComments = (postId: string) => {
    setShowComments((prev) => ({ ...prev, [postId]: !prev[postId] }));
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Live Book Pulse Bar */}
      <BookPulseBar />

      {/* Real server-filtered feed scopes */}
      <div className="flex items-center gap-2" role="group" aria-label="Choose feed">
        <Button
          size="sm"
          variant={streamMode === 'community' ? 'default' : 'outline'}
          aria-pressed={streamMode === 'community'}
          onClick={() => setStreamMode('community')}
          className={streamMode === 'community' ? 'bg-[#1C442D] text-white hover:bg-[#153522] dark:bg-[#1C3024] dark:text-[#F3F0E7]' : 'border-[#E8E2D9] bg-white text-[#1C201D] dark:border-[#29332D] dark:bg-[#111614] dark:text-[#F3F0E7]'}
        >
          <Sparkles className="w-3.5 h-3.5 mr-1.5" />
          Community
        </Button>
        <Button
          size="sm"
          variant={streamMode === 'following' ? 'default' : 'outline'}
          aria-pressed={streamMode === 'following'}
          onClick={() => setStreamMode('following')}
          className={streamMode === 'following' ? 'bg-[#1C442D] text-white hover:bg-[#153522] dark:bg-[#1C3024] dark:text-[#F3F0E7]' : 'border-[#E8E2D9] bg-white text-[#1C201D] dark:border-[#29332D] dark:bg-[#111614] dark:text-[#F3F0E7]'}
        >
          <Users className="w-3.5 h-3.5 mr-1.5" />
          Following
        </Button>
      </div>

      {/* Feed Stream Filter Pills */}
      <div className="flex items-center gap-1.5 bg-white dark:bg-[#111614] p-1.5 rounded-xl border border-[#E8E2D9] dark:border-[#29332D] shadow-[0_2px_8px_rgba(28,32,29,0.04)] dark:shadow-xs w-fit flex-wrap transition-colors">
        <Button
          size="sm"
          variant={feedFilter === 'all' ? 'default' : 'ghost'}
          className={feedFilter === 'all' ? 'h-8 px-3 text-xs bg-[#1C442D] text-white dark:bg-[#1C3024] dark:border dark:border-[#315C43] dark:text-[#F3F0E7] shadow-xs' : 'h-8 px-3 text-xs text-[#636B65] hover:text-[#1C201D] hover:bg-[#FAF7F2] dark:text-[#A5ADA6] dark:hover:text-[#F3F0E7] dark:hover:bg-[#1B241E]'}
          onClick={() => setFeedFilter('all')}
        >
          <Sparkles className="w-3.5 h-3.5 mr-1.5 text-amber-500 dark:text-[#D5B16D]" />
          All posts
        </Button>
        <Button
          size="sm"
          variant={feedFilter === 'posts' ? 'default' : 'ghost'}
          className={feedFilter === 'posts' ? 'h-8 px-3 text-xs bg-[#1C442D] text-white dark:bg-[#1C3024] dark:border dark:border-[#315C43] dark:text-[#F3F0E7] shadow-xs' : 'h-8 px-3 text-xs text-[#636B65] hover:text-[#1C201D] hover:bg-[#FAF7F2] dark:text-[#A5ADA6] dark:hover:text-[#F3F0E7] dark:hover:bg-[#1B241E]'}
          onClick={() => setFeedFilter('posts')}
        >
          <MessageCircle className="w-3.5 h-3.5 mr-1.5 text-emerald-600 dark:text-emerald-400" />
          Posts
        </Button>
        <Button
          size="sm"
          variant={feedFilter === 'margins' ? 'default' : 'ghost'}
          className={feedFilter === 'margins' ? 'h-8 px-3 text-xs bg-[#1C442D] text-white dark:bg-[#1C3024] dark:border dark:border-[#315C43] dark:text-[#F3F0E7] shadow-xs' : 'h-8 px-3 text-xs text-[#636B65] hover:text-[#1C201D] hover:bg-[#FAF7F2] dark:text-[#A5ADA6] dark:hover:text-[#F3F0E7] dark:hover:bg-[#1B241E]'}
          onClick={() => setFeedFilter('margins')}
        >
          <Quote className="w-3.5 h-3.5 mr-1.5 text-amber-600 dark:text-amber-400" />
          Margin Notes ({marginNotes.length})
        </Button>
        <Button
          size="sm"
          variant={feedFilter === 'threads' ? 'default' : 'ghost'}
          className={feedFilter === 'threads' ? 'h-8 px-3 text-xs bg-[#1C442D] text-white dark:bg-[#1C3024] dark:border dark:border-[#315C43] dark:text-[#F3F0E7] shadow-xs' : 'h-8 px-3 text-xs text-[#636B65] hover:text-[#1C201D] hover:bg-[#FAF7F2] dark:text-[#A5ADA6] dark:hover:text-[#F3F0E7] dark:hover:bg-[#1B241E]'}
          onClick={() => setFeedFilter('threads')}
        >
          <Lock className="w-3.5 h-3.5 mr-1.5 text-indigo-600 dark:text-indigo-400" />
          Chapter Threads{feedFilter === 'threads' ? ` (${spoilerThreads.length})` : ''}
        </Button>
      </div>

      {feedFilter === 'margins' ? (
        marginLoading ? (
          <div className="flex justify-center py-8" role="status"><LoadingSpinner /></div>
        ) : marginError ? (
          <Card role="alert" className="bg-white dark:bg-[#111614] border-destructive/40 text-[#1C201D] dark:text-[#F3F0E7] rounded-2xl p-8 text-center">
            <p className="text-sm text-destructive font-medium mb-3">Margin notes could not be loaded.</p>
            <Button type="button" variant="outline" size="sm" onClick={() => void refetchMarginNotes()}>Retry</Button>
          </Card>
        ) : marginNotes.length === 0 ? (
          <Card className="bg-white dark:bg-[#111614] border-[#E8E2D9] dark:border-[#29332D] text-[#1C201D] dark:text-[#F3F0E7] rounded-2xl p-8 text-center shadow-[0_2px_8px_rgba(28,32,29,0.04)] dark:shadow-xs">
            <Quote className="w-8 h-8 text-amber-600 dark:text-amber-400 mx-auto mb-2" />
            <p className="text-sm font-semibold text-[#1C201D] dark:text-[#F3F0E7]">No margin notes yet</p>
            <p className="text-xs text-[#636B65] dark:text-[#A5ADA6] mt-1">Open any book in the reader to highlight quotes and leave margin notes.</p>
          </Card>
        ) : (
          <div className="space-y-4">
            {marginNotes.map((note) => (
              <MarginNoteCard key={note.id} note={note} />
            ))}
          </div>
        )
      ) : feedFilter === 'threads' ? (
        threadsLoading ? (
          <div className="flex justify-center py-8" role="status"><LoadingSpinner /></div>
        ) : threadsError ? (
          <Card role="alert" className="bg-white dark:bg-[#111614] border-destructive/40 text-[#1C201D] dark:text-[#F3F0E7] rounded-2xl p-8 text-center">
            <p className="text-sm text-destructive font-medium mb-3">Chapter threads could not be loaded.</p>
            <Button type="button" variant="outline" size="sm" onClick={() => void refetchThreads()}>Retry</Button>
          </Card>
        ) : spoilerThreads.length === 0 ? (
          <Card className="bg-white dark:bg-[#111614] border-[#E8E2D9] dark:border-[#29332D] text-[#1C201D] dark:text-[#F3F0E7] rounded-2xl p-8 text-center shadow-[0_2px_8px_rgba(28,32,29,0.04)] dark:shadow-xs">
            <Lock className="w-8 h-8 text-indigo-600 dark:text-indigo-400 mx-auto mb-2" />
            <p className="text-sm font-semibold text-[#1C201D] dark:text-[#F3F0E7]">No spoiler-safe threads yet</p>
            <p className="text-xs text-[#636B65] dark:text-[#A5ADA6] mt-1">Start a chapter discussion from the Threads tab.</p>
          </Card>
        ) : (
          <div className="space-y-4">
            {spoilerThreads.map((thread) => (
              <SpoilerThreadCard key={thread.id} thread={thread} />
            ))}
          </div>
        )
      ) : (
        <>
          <FeedComposer />

          {error ? (
            <Card className="bg-white dark:bg-[#111614] border-destructive/40 text-[#1C201D] dark:text-[#F3F0E7] rounded-2xl shadow-[0_2px_8px_rgba(28,32,29,0.04)] dark:shadow-xs">
              <CardContent className="p-8 text-center">
                <p className="text-sm text-destructive font-medium mb-3">
                  Unable to load feed posts: {(error as Error)?.message || 'Unknown network error'}
                </p>
                <Button variant="outline" size="sm" onClick={() => refetch()} className="border-[#E8E2D9] dark:border-[#29332D] bg-[#FAF7F2] dark:bg-[#16211A] text-[#1C201D] dark:text-[#F3F0E7] hover:bg-[#EBF2EC] dark:hover:bg-[#1C3024]">
                  Retry
                </Button>
              </CardContent>
            </Card>
          ) : posts.length === 0 ? (
            <Card className="bg-white dark:bg-[#111614] border-[#E8E2D9] dark:border-[#29332D] text-[#1C201D] dark:text-[#F3F0E7] rounded-2xl shadow-[0_2px_8px_rgba(28,32,29,0.04)] dark:shadow-xs">
              <CardContent className="p-10 text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-[#EBF2EC] dark:bg-[#1C3024] border border-[#C8DBCB] dark:border-[#315C43]/50 flex items-center justify-center text-[#1C442D] dark:text-[#D5B16D]">
                  <MessageCircle className="w-8 h-8" />
                </div>
                <h3 className="text-lg font-serif font-bold text-[#1C201D] dark:text-[#F3F0E7] mb-1">
                  {streamMode === 'following' ? 'Your Following feed is quiet' : 'No posts yet'}
                </h3>
                <p className="text-sm text-[#636B65] dark:text-[#A5ADA6]">
                  {streamMode === 'following'
                    ? 'Follow readers to see their eligible book discussions and reading updates here.'
                    : 'Be the first to share something with the community.'}
                </p>
                {streamMode === 'following' && (
                  <Link
                    to="/social?tab=friends"
                    className="inline-flex mt-4 text-sm font-medium text-[#1C442D] dark:text-[#D5B16D] hover:underline"
                  >
                    Discover readers to follow
                  </Link>
                )}
              </CardContent>
            </Card>
          ) : (
        posts.map((post, idx) => {
          const isRepost = !!post.repost_of_id && !!post.reposted_post;
          const isOwn = post.user_id === user?.id;
          const postProfile = Array.isArray(post.profiles) ? post.profiles[0] : post.profiles;
          const postBook = Array.isArray(post.books_library) ? post.books_library[0] : post.books_library;

          return (
            <React.Fragment key={post.id || idx}>
              <Card
                id={`social-post-${post.id}`}
                className={`bg-white dark:bg-[#111614] border-[#E8E2D9] dark:border-[#29332D] text-[#1C201D] dark:text-[#F3F0E7] rounded-2xl hover:border-[#1C442D]/40 dark:hover:border-[#315C43] shadow-[0_2px_8px_rgba(28,32,29,0.04)] dark:shadow-xs transition-all duration-200 overflow-hidden ${highlightedPostId === post.id ? 'ring-2 ring-[#D5B16D] ring-offset-2 ring-offset-[#FAF7F2] dark:ring-offset-[#0B0D0C]' : ''}`}
              >
              <CardContent className="p-5">
                {/* Repost banner */}
                {isRepost && (
                  <div className="flex items-center gap-2 text-xs text-[#636B65] dark:text-[#A5ADA6] mb-3">
                    <Repeat2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                    <span>
                      <strong className="text-[#1C201D] dark:text-[#F3F0E7]">{isOwn ? 'You' : (postProfile?.full_name || 'Someone')}</strong> reposted
                    </span>
                  </div>
                )}

                {/* Post Header */}
                <div className="flex min-w-0 items-start justify-between gap-3 mb-4 sm:items-center">
                  <div className="flex min-w-0 flex-1 items-center space-x-3">
                    <Avatar className="w-10 h-10 border border-[#E8E2D9] dark:border-[#29332D]">
                      <AvatarImage src={postProfile?.profile_photo_url} />
                      <AvatarFallback className="bg-[#EBF2EC] text-[#1C442D] dark:bg-[#1C3024] dark:text-[#D5B16D] font-semibold text-xs">
                        {postProfile?.full_name?.charAt(0) || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <div className="flex min-w-0 items-center gap-2 flex-wrap">
                        <h4 className="max-w-full truncate font-semibold text-[#1C201D] dark:text-[#F3F0E7]">
                          {isOwn ? 'You' : (postProfile?.full_name || 'Anonymous')}
                        </h4>
                        {!isOwn && post.user_id && (
                          <DnaMatchChip userId={post.user_id} userName={postProfile?.full_name || 'Reader'} />
                        )}
                        {post.feeling_emoji && post.feeling_label && (
                          <span className="text-sm text-[#636B65] dark:text-[#A5ADA6]">
                            is feeling {post.feeling_emoji} {post.feeling_label}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-[#636B65] dark:text-[#A5ADA6] mt-0.5">
                        <Clock className="w-3 h-3" />
                        <span>{safeFormatDistanceToNow(post.created_at, { addSuffix: true })}</span>
                        {postProfile?.username && (
                          <span className="text-[#636B65]/70 dark:text-[#A5ADA6]/70">• @{postProfile.username}</span>
                        )}
                      </div>
                    </div>
                  </div>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-[#636B65] hover:text-[#1C201D] dark:text-[#A5ADA6] dark:hover:text-[#F3F0E7] rounded-full h-9 w-9 p-0"
                        aria-label="More options"
                      >
                        <MoreHorizontal className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="bg-white dark:bg-[#111614] border-[#E8E2D9] dark:border-[#29332D] text-[#1C201D] dark:text-[#F3F0E7]">
                      <DropdownMenuItem onClick={() => handleShare(post)} className="cursor-pointer">
                        <Share2 className="w-4 h-4 mr-2" /> Share
                      </DropdownMenuItem>
                      {isOwn && (
                        <DropdownMenuItem
                          className="text-destructive focus:text-destructive cursor-pointer"
                          onClick={() => {
                            if (window.confirm('Delete this post?')) deletePost.mutate(post.id);
                          }}
                        >
                          <Trash2 className="w-4 h-4 mr-2" /> Delete
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                {/* Post Content */}
                <div className="mb-4">
                  {!isRepost && post.post_kind === 'quote' && post.quote_text && (
                    <section aria-label="Shareable literary quote" className="relative my-2 overflow-hidden rounded-2xl border border-[#C8DBCB] bg-gradient-to-br from-[#F7F2E9] via-[#FFFCF7] to-[#EAF1E8] p-5 shadow-[0_3px_12px_rgba(28,68,45,0.06)] dark:border-[#315C43] dark:from-[#16211A] dark:via-[#111614] dark:to-[#1C3024] sm:p-7">
                      <div className="pointer-events-none absolute -right-4 -top-7 select-none font-serif text-[150px] leading-none text-[#1C442D]/[0.07] dark:text-[#D5B16D]/[0.08]" aria-hidden="true">”</div>
                      <div className="relative">
                        <div className="mb-4 flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-[#1C442D] dark:text-[#D5B16D]">
                          <Quote className="h-4 w-4" /> Sahadhyayi · A passage worth keeping
                        </div>
                        <blockquote className="whitespace-pre-wrap break-words font-serif text-xl leading-relaxed text-[#1C201D] dark:text-[#F3F0E7] sm:text-2xl">
                          “{post.quote_text}”
                        </blockquote>
                        {post.quote_context && (
                          <p className="mt-4 border-l-2 border-[#D5B16D] pl-3 text-sm italic leading-relaxed text-[#636B65] dark:text-[#C4CCC4]">
                            {post.quote_context}
                          </p>
                        )}
                        {(post.quote_author || post.quote_source) && (
                          <div className="mt-5 border-t border-[#C8DBCB]/80 pt-4 dark:border-[#315C43]">
                            {post.quote_author && <p className="font-semibold text-sm text-[#1C442D] dark:text-[#D5B16D]">— {post.quote_author}</p>}
                            {post.quote_source && <p className="mt-1 text-xs text-[#636B65] dark:text-[#A5ADA6]">{post.quote_source}</p>}
                          </div>
                        )}
                        <div className="mt-4 flex items-center justify-between gap-3">
                          <span className="text-[10px] tracking-wide text-[#636B65] dark:text-[#A5ADA6]">READ · REFLECT · SHARE</span>
                          <Button type="button" size="sm" variant="outline" onClick={() => void handleCopyQuote(post)} className="h-8 shrink-0 gap-1.5 rounded-lg border-[#C8DBCB] bg-white/80 text-xs text-[#1C442D] hover:bg-white dark:border-[#315C43] dark:bg-[#0B0D0C]/70 dark:text-[#D5B16D]" aria-label="Copy quote and attribution">
                            {copiedQuoteId === post.id ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                            {copiedQuoteId === post.id ? 'Copied' : 'Copy quote'}
                          </Button>
                        </div>
                      </div>
                    </section>
                  )}
                  {post.content && (
                    <p className="text-[#1C201D] dark:text-[#F3F0E7] leading-relaxed mb-3 whitespace-pre-wrap">{post.content}</p>
                  )}

                  {/* Embedded original post (when this is a repost) */}
                  {isRepost && post.reposted_post && (
                    <EmbeddedOriginalPost
                      post={post.reposted_post}
                      onImageClick={(src, alt) => setImageViewer({ src, alt })}
                    />
                  )}

                  {/* Book Card (only on non-reposts) */}
                  {!isRepost && postBook && (
                    <Link
                      to={`/book/${post.book_id || postBook.id}`}
                      className="block group my-3"
                      aria-label={`View book: ${postBook.title}`}
                    >
                      <div className="bg-[#FAF7F2] dark:bg-[#16211A]/80 border border-[#E8E2D9] dark:border-[#315C43]/50 rounded-xl p-3 flex items-center gap-3 transition-colors hover:border-[#1C442D]/40 dark:hover:border-[#D5B16D]/50 hover:bg-[#F4EFEA] dark:hover:bg-[#1A261F]">
                        <div className="w-12 h-16 bg-[#EBF2EC] dark:bg-[#1C3024] rounded-md flex-shrink-0 overflow-hidden shadow-xs border border-[#E8E2D9] dark:border-[#315C43]/40 flex items-center justify-center">
                          {postBook.cover_image_url ? (
                            <img
                              src={postBook.cover_image_url}
                              alt={postBook.title || 'Book cover'}
                              onError={(e) => {
                                (e.currentTarget as HTMLElement).style.display = 'none';
                              }}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-[#1C442D] dark:text-[#D5B16D] text-xs font-bold">
                              {postBook.title?.charAt(0) || '📖'}
                            </div>
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <h5 className="font-semibold text-[#1C201D] dark:text-[#F3F0E7] text-sm truncate group-hover:text-[#1C442D] dark:group-hover:text-[#D5B16D] transition-colors">
                            {postBook.title}
                          </h5>
                          {postBook.author && (
                            <p className="text-xs text-[#636B65] dark:text-[#A5ADA6] truncate mt-0.5">{postBook.author}</p>
                          )}
                          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                            <Badge
                              variant="outline"
                              className="text-[10px] border-[#C8DBCB] dark:border-[#315C43] text-[#1C442D] dark:text-[#D5B16D] bg-white dark:bg-[#111614] px-1.5 py-0 h-4 font-medium"
                            >
                              Currently Reading
                            </Badge>
                            {postBook.genre && (
                              <span className="text-[10px] text-[#636B65] dark:text-[#A5ADA6]">
                                • {postBook.genre}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </Link>
                  )}

                  {/* Image (only on non-reposts) */}
                  {!isRepost && post.image_url && (
                    <div className="mt-3 overflow-hidden rounded-xl border border-[#E8E2D9] dark:border-[#29332D]">
                      <button
                        type="button"
                        onClick={() => setImageViewer({
                          src: post.image_url as string,
                          alt: post.image_alt?.trim() || 'Post attachment',
                        })}
                        aria-label={`View image: ${post.image_alt?.trim() || 'Post attachment'}`}
                        className="block w-full cursor-zoom-in focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1C442D] dark:focus-visible:ring-[#D5B16D]"
                      >
                        <img
                          src={post.image_url}
                          alt={post.image_alt?.trim() || "Post attachment"}
                          loading="lazy"
                          decoding="async"
                          onError={(e) => {
                            (e.currentTarget as HTMLElement).style.display = 'none';
                          }}
                          className="block max-h-[520px] w-full bg-[#F4EFEA] object-contain dark:bg-[#0B0D0C]"
                        />
                      </button>
                    </div>
                  )}
                </div>

                {/* Post Actions */}
                <div className="flex items-center justify-around gap-1 pt-3 border-t border-[#E8E2D9] dark:border-[#29332D]">
                  <Button
                    variant="ghost"
                    size="sm"
                    aria-label={post.user_liked ? `Unlike post, ${post.likes_count} likes` : `Like post, ${post.likes_count} likes`}
                    onClick={() => handleLike(post)}
                    disabled={toggleLike.isPending || !user}
                    className={`flex-1 rounded-lg gap-2 text-xs h-8 ${post.user_liked ? 'text-rose-600 dark:text-rose-400 hover:text-rose-700 dark:hover:text-rose-300 hover:bg-rose-50 dark:hover:bg-rose-950/20' : 'text-[#636B65] hover:text-[#1C201D] hover:bg-[#FAF7F2] dark:text-[#A5ADA6] dark:hover:text-[#F3F0E7] dark:hover:bg-[#1B241E]'}`}
                  >
                    <Heart className={`w-4 h-4 ${post.user_liked ? 'fill-current' : ''}`} />
                    <span className="font-medium">{post.likes_count}</span>
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    aria-label={showComments[post.id] ? `Hide comments, ${post.comments_count} comments` : `Show comments, ${post.comments_count} comments`}
                    className="flex-1 rounded-lg gap-2 text-xs h-8 text-[#636B65] hover:text-[#1C201D] hover:bg-[#FAF7F2] dark:text-[#A5ADA6] dark:hover:text-[#F3F0E7] dark:hover:bg-[#1B241E]"
                    onClick={() => toggleComments(post.id)}
                  >
                    <MessageCircle className="w-4 h-4" />
                    <span className="font-medium">{post.comments_count}</span>
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    aria-label={post.user_reposted ? `Undo repost, ${post.reposts_count || 0} reposts` : `Repost, ${post.reposts_count || 0} reposts`}
                    onClick={() => handleRepostClick(post)}
                    disabled={toggleRepost.isPending || !user}
                    className={`flex-1 rounded-lg gap-2 text-xs h-8 ${post.user_reposted ? 'text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/20' : 'text-[#636B65] hover:text-[#1C201D] hover:bg-[#FAF7F2] dark:text-[#A5ADA6] dark:hover:text-[#F3F0E7] dark:hover:bg-[#1B241E]'}`}
                  >
                    <Repeat2 className="w-4 h-4" />
                    <span className="font-medium">{post.reposts_count || 0}</span>
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    aria-label="Share post"
                    className="flex-1 rounded-lg gap-2 text-xs h-8 text-[#636B65] hover:text-[#1C201D] hover:bg-[#FAF7F2] dark:text-[#A5ADA6] dark:hover:text-[#F3F0E7] dark:hover:bg-[#1B241E]"
                    onClick={() => handleShare(post)}
                  >
                    <Share2 className="w-4 h-4" />
                    <span className="font-medium hidden sm:inline">Share</span>
                  </Button>
                </div>

                {/* Comments Section */}
                {showComments[post.id] && <EnhancedCommentSection postId={post.id} />}
              </CardContent>
            </Card>

            {/* In 'All Community' feed, interleave a margin note every 3 posts */}
            {feedFilter === 'all' && marginNotes[Math.floor(idx / 3)] && idx % 3 === 1 && (
              <div className="my-2">
                <div className="text-[11px] font-semibold text-[#636B65] dark:text-[#A5ADA6] uppercase tracking-wider mb-2 flex items-center gap-1.5 px-1">
                  <Quote className="w-3 h-3 text-amber-600 dark:text-amber-500" />
                  <span>From Community Margins</span>
                </div>
                <MarginNoteCard note={marginNotes[Math.floor(idx / 3)]} />
              </div>
            )}
          </React.Fragment>
        );
      }))}
          {(hasMore || loadMoreError) && (
            <div className="flex flex-col items-center gap-2 py-3" aria-live="polite">
              {loadMoreError && (
                <p className="text-xs text-destructive text-center" role="alert">
                  Could not load older posts: {loadMoreError.message}
                </p>
              )}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => void loadMore()}
                disabled={isLoadingMore}
                className="border-[#E8E2D9] dark:border-[#29332D] bg-white dark:bg-[#111614] text-[#1C442D] dark:text-[#D5B16D] hover:bg-[#EBF2EC] dark:hover:bg-[#1C3024]"
              >
                {isLoadingMore ? 'Loading older posts…' : loadMoreError ? 'Retry loading older posts' : 'Load older posts'}
              </Button>
            </div>
          )}
        </>
      )}

      {imageViewer && (
        <Dialog open={Boolean(imageViewer)} onOpenChange={(open) => { if (!open) setImageViewer(null); }}>
          <DialogContent className="w-[calc(100vw-1.5rem)] max-w-5xl border-[#E8E2D9] bg-[#FAF7F2] p-3 dark:border-[#29332D] dark:bg-[#111614] sm:p-5">
            <DialogHeader>
              <DialogTitle className="text-sm text-[#1C201D] dark:text-[#F3F0E7]">
                {imageViewer.alt || 'Post image'}
              </DialogTitle>
            </DialogHeader>
            <img
              src={imageViewer.src}
              alt={imageViewer.alt}
              className="max-h-[78vh] w-full rounded-lg object-contain"
            />
          </DialogContent>
        </Dialog>
      )}

      {selectedPost && (
        <ShareModal
          isOpen={shareModalOpen}
          onClose={() => setShareModalOpen(false)}
          postContent={selectedPost.content}
          postId={selectedPost.id}
          quoteText={selectedPost.quote_text}
          quoteAuthor={selectedPost.quote_author}
          quoteSource={selectedPost.quote_source}
          quoteContext={selectedPost.quote_context}
        />
      )}

      {repostPost && (
        <RepostDialog
          post={repostPost}
          isOpen={!!repostPost}
          onClose={() => setRepostPost(null)}
        />
      )}
    </div>
  );
};
