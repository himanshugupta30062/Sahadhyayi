import React, { useState } from 'react';
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
import LoadingSpinner from '@/components/LoadingSpinner';
import { formatDistanceToNow } from 'date-fns';
import { useAuth } from '@/contexts/authHelpers';

const EmbeddedOriginalPost: React.FC<{ post: NonNullable<SocialPost['reposted_post']> }> = ({ post }) => (
  <div className="mt-3 border border-border rounded-xl p-3 bg-muted/30">
    <div className="flex items-center gap-2 mb-2">
      <Avatar className="w-7 h-7">
        <AvatarImage src={post.profiles?.profile_photo_url} />
        <AvatarFallback className="bg-gradient-button text-white text-[10px]">
          {post.profiles?.full_name?.charAt(0) || 'U'}
        </AvatarFallback>
      </Avatar>
      <div className="text-xs">
        <span className="font-medium text-foreground">{post.profiles?.full_name || 'Anonymous'}</span>
        {post.profiles?.username && (
          <span className="text-muted-foreground"> · @{post.profiles.username}</span>
        )}
        <span className="text-muted-foreground"> · {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}</span>
      </div>
    </div>
    <p className="text-sm text-foreground whitespace-pre-wrap">{post.content}</p>
    {post.image_url && (
      <div className="mt-2 rounded-lg overflow-hidden border border-border">
        <img src={post.image_url} alt="" className="w-full max-h-72 object-cover" />
      </div>
    )}
    {post.books_library && (
      <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
        <span>📖</span>
        <span className="truncate">
          <strong className="text-foreground">{post.books_library.title}</strong>
          {post.books_library.author ? ` — ${post.books_library.author}` : ''}
        </span>
      </div>
    )}
  </div>
);

export const EnhancedSocialFeed = () => {
  const { user } = useAuth();
  const { posts, isLoading } = useSocialPosts();
  const toggleLike = useTogglePostLike();
  const toggleRepost = useToggleRepost();
  const deletePost = useDeletePost();
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [repostPost, setRepostPost] = useState<SocialPost | null>(null);
  const [selectedPost, setSelectedPost] = useState<SocialPost | null>(null);
  const [showComments, setShowComments] = useState<{ [key: string]: boolean }>({});

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
      <FeedComposer />

      {posts.length === 0 ? (
        <Card className="bg-card border-border rounded-2xl">
          <CardContent className="p-10 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-brand-primary/10 flex items-center justify-center">
              <MessageCircle className="w-8 h-8 text-brand-primary" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-1">No posts yet</h3>
            <p className="text-sm text-muted-foreground">Be the first to share something with the community.</p>
          </CardContent>
        </Card>
      ) : (
        posts.map((post) => {
          const isRepost = !!post.repost_of_id && !!post.reposted_post;
          const isOwn = post.user_id === user?.id;

          return (
            <Card
              key={post.id}
              className="bg-card border-border rounded-2xl hover:shadow-[var(--shadow-elevated)] transition-all duration-200 overflow-hidden"
            >
              <CardContent className="p-5">
                {/* Repost banner */}
                {isRepost && (
                  <div className="flex items-center gap-2 text-xs text-muted-foreground mb-3">
                    <Repeat2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>
                      <strong className="text-foreground">{isOwn ? 'You' : (post.profiles?.full_name || 'Someone')}</strong> reposted
                    </span>
                  </div>
                )}

                {/* Post Header */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <Avatar className="w-11 h-11 ring-2 ring-brand-primary/10">
                      <AvatarImage src={post.profiles?.profile_photo_url} />
                      <AvatarFallback className="bg-gradient-button text-white font-semibold">
                        {post.profiles?.full_name?.charAt(0) || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="font-semibold text-foreground">
                          {isOwn ? 'You' : (post.profiles?.full_name || 'Anonymous')}
                        </h4>
                        {post.feeling_emoji && post.feeling_label && (
                          <span className="text-sm text-muted-foreground">
                            is feeling {post.feeling_emoji} {post.feeling_label}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-0.5">
                        <Clock className="w-3 h-3" />
                        <span>{formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}</span>
                        {post.profiles?.username && (
                          <span className="text-muted-foreground/70">• @{post.profiles.username}</span>
                        )}
                      </div>
                    </div>
                  </div>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-muted-foreground hover:text-foreground rounded-full h-9 w-9 p-0"
                        aria-label="More options"
                      >
                        <MoreHorizontal className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleShare(post)}>
                        <Share2 className="w-4 h-4 mr-2" /> Share
                      </DropdownMenuItem>
                      {isOwn && (
                        <DropdownMenuItem
                          className="text-destructive focus:text-destructive"
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
                    <p className="text-foreground leading-relaxed mb-3 whitespace-pre-wrap">{post.content}</p>
                  )}

                  {/* Embedded original post (when this is a repost) */}
                  {isRepost && post.reposted_post && (
                    <EmbeddedOriginalPost post={post.reposted_post} />
                  )}

                  {/* Book Card (only on non-reposts) */}
                  {!isRepost && post.books_library && (
                    <div className="bg-brand-primary/5 border border-brand-primary/20 rounded-xl p-3 flex items-center gap-3">
                      <div className="w-12 h-16 bg-gradient-button rounded-md flex-shrink-0 overflow-hidden shadow-sm">
                        {post.books_library.cover_image_url ? (
                          <img
                            src={post.books_library.cover_image_url}
                            alt={post.books_library.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-white text-xs font-bold">
                            {post.books_library.title.charAt(0)}
                          </div>
                        )}
                      </div>
                      <div className="min-w-0">
                        <h5 className="font-semibold text-foreground text-sm truncate">{post.books_library.title}</h5>
                        {post.books_library.author && (
                          <p className="text-xs text-muted-foreground truncate">{post.books_library.author}</p>
                        )}
                        <Badge
                          variant="outline"
                          className="mt-1.5 text-[10px] border-brand-primary/40 text-brand-primary bg-background"
                        >
                          Currently Reading
                        </Badge>
                      </div>
                    </div>
                  )}

                  {/* Image (only on non-reposts) */}
                  {!isRepost && post.image_url && (
                    <div className="mt-3 rounded-xl overflow-hidden border border-border">
                      <img src={post.image_url} alt="Post" className="w-full max-h-96 object-cover" />
                    </div>
                  )}
                </div>

                {/* Post Actions */}
                <div className="flex items-center justify-around gap-1 pt-3 border-t border-border">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleLike(post)}
                    disabled={toggleLike.isPending || !user}
                    className={`flex-1 rounded-lg gap-2 ${post.user_liked ? 'text-rose-500 hover:text-rose-600 hover:bg-rose-50' : 'text-muted-foreground hover:text-foreground hover:bg-muted'}`}
                  >
                    <Heart className={`w-4 h-4 ${post.user_liked ? 'fill-current' : ''}`} />
                    <span className="text-sm font-medium">{post.likes_count}</span>
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="flex-1 rounded-lg gap-2 text-muted-foreground hover:text-foreground hover:bg-muted"
                    onClick={() => toggleComments(post.id)}
                  >
                    <MessageCircle className="w-4 h-4" />
                    <span className="text-sm font-medium">{post.comments_count}</span>
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRepostClick(post)}
                    disabled={toggleRepost.isPending || !user}
                    className={`flex-1 rounded-lg gap-2 ${post.user_reposted ? 'text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50' : 'text-muted-foreground hover:text-foreground hover:bg-muted'}`}
                  >
                    <Repeat2 className="w-4 h-4" />
                    <span className="text-sm font-medium">{post.reposts_count || 0}</span>
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="flex-1 rounded-lg gap-2 text-muted-foreground hover:text-foreground hover:bg-muted"
                    onClick={() => handleShare(post)}
                  >
                    <Share2 className="w-4 h-4" />
                    <span className="text-sm font-medium hidden sm:inline">Share</span>
                  </Button>
                </div>

                {/* Comments Section */}
                {showComments[post.id] && <EnhancedCommentSection postId={post.id} />}
              </CardContent>
            </Card>
          );
        })
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
