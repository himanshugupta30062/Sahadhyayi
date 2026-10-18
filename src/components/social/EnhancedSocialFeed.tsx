import React, { useState } from 'react';
import { Link } from 'react-router-dom';
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
import { Heart, MessageCircle, Share2, Clock, Repeat2, MoreHorizontal, Trash2 } from 'lucide-react';
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

const EmbeddedOriginalPost: React.FC<{ post?: SocialPost | null }> = ({ post }) => {
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
          <img
            src={post.image_url}
            alt=""
            onError={(e) => {
              (e.currentTarget as HTMLElement).style.display = 'none';
            }}
            className="w-full max-h-72 object-cover"
          />
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
  const { posts, isLoading, error, refetch } = useSocialPosts();
  const toggleLike = useTogglePostLike();
  const toggleRepost = useToggleRepost();
  const deletePost = useDeletePost();
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [repostPost, setRepostPost] = useState<SocialPost | null>(null);
  const [selectedPost, setSelectedPost] = useState<SocialPost | null>(null);
  const [showComments, setShowComments] = useState<{ [key: string]: boolean }>({});
  const [feedFilter, setFeedFilter] = useState<'all' | 'posts' | 'margins' | 'threads'>('all');
  const { data: marginNotes = [], isLoading: marginLoading } = useMarginNotes({ filter: 'all' });
  const { data: spoilerThreads = [], isLoading: threadsLoading } = useSpoilerThreads();

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

      {/* Feed Stream Filter Pills */}
      <div className="flex items-center gap-1.5 bg-white dark:bg-[#111614] p-1.5 rounded-xl border border-[#E8E2D9] dark:border-[#29332D] shadow-[0_2px_8px_rgba(28,32,29,0.04)] dark:shadow-xs w-fit flex-wrap transition-colors">
        <Button
          size="sm"
          variant={feedFilter === 'all' ? 'default' : 'ghost'}
          className={feedFilter === 'all' ? 'h-8 px-3 text-xs bg-[#1C442D] text-white dark:bg-[#1C3024] dark:border dark:border-[#315C43] dark:text-[#F3F0E7] shadow-xs' : 'h-8 px-3 text-xs text-[#636B65] hover:text-[#1C201D] hover:bg-[#FAF7F2] dark:text-[#A5ADA6] dark:hover:text-[#F3F0E7] dark:hover:bg-[#1B241E]'}
          onClick={() => setFeedFilter('all')}
        >
          <Sparkles className="w-3.5 h-3.5 mr-1.5 text-amber-500 dark:text-[#D5B16D]" />
          All Community
        </Button>
        <Button
          size="sm"
          variant={feedFilter === 'posts' ? 'default' : 'ghost'}
          className={feedFilter === 'posts' ? 'h-8 px-3 text-xs bg-[#1C442D] text-white dark:bg-[#1C3024] dark:border dark:border-[#315C43] dark:text-[#F3F0E7] shadow-xs' : 'h-8 px-3 text-xs text-[#636B65] hover:text-[#1C201D] hover:bg-[#FAF7F2] dark:text-[#A5ADA6] dark:hover:text-[#F3F0E7] dark:hover:bg-[#1B241E]'}
          onClick={() => setFeedFilter('posts')}
        >
          <MessageCircle className="w-3.5 h-3.5 mr-1.5 text-emerald-600 dark:text-emerald-400" />
          Discussions
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
          Chapter Threads ({spoilerThreads.length})
        </Button>
      </div>

      {feedFilter === 'margins' ? (
        marginLoading ? (
          <div className="flex justify-center py-8"><LoadingSpinner /></div>
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
          <div className="flex justify-center py-8"><LoadingSpinner /></div>
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
                <h3 className="text-lg font-serif font-bold text-[#1C201D] dark:text-[#F3F0E7] mb-1">No posts yet</h3>
                <p className="text-sm text-[#636B65] dark:text-[#A5ADA6]">Be the first to share something with the community.</p>
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
                className="bg-white dark:bg-[#111614] border-[#E8E2D9] dark:border-[#29332D] text-[#1C201D] dark:text-[#F3F0E7] rounded-2xl hover:border-[#1C442D]/40 dark:hover:border-[#315C43] shadow-[0_2px_8px_rgba(28,32,29,0.04)] dark:shadow-xs transition-all duration-200 overflow-hidden"
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
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <Avatar className="w-10 h-10 border border-[#E8E2D9] dark:border-[#29332D]">
                      <AvatarImage src={postProfile?.profile_photo_url} />
                      <AvatarFallback className="bg-[#EBF2EC] text-[#1C442D] dark:bg-[#1C3024] dark:text-[#D5B16D] font-semibold text-xs">
                        {postProfile?.full_name?.charAt(0) || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="font-semibold text-[#1C201D] dark:text-[#F3F0E7]">
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
                  {post.content && (
                    <p className="text-[#1C201D] dark:text-[#F3F0E7] leading-relaxed mb-3 whitespace-pre-wrap">{post.content}</p>
                  )}

                  {/* Embedded original post (when this is a repost) */}
                  {isRepost && post.reposted_post && (
                    <EmbeddedOriginalPost post={post.reposted_post} />
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
                    <div className="mt-3 rounded-xl overflow-hidden border border-[#E8E2D9] dark:border-[#29332D]">
                      <img
                        src={post.image_url}
                        alt="Post attachment"
                        onError={(e) => {
                          (e.currentTarget as HTMLElement).style.display = 'none';
                        }}
                        className="w-full max-h-96 object-cover"
                      />
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
        </>
      )}

      {selectedPost && (
        <ShareModal
          isOpen={shareModalOpen}
          onClose={() => setShareModalOpen(false)}
          postContent={selectedPost.content}
          postId={selectedPost.id}
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
