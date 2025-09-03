import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Heart, MessageCircle, Share2, Clock } from 'lucide-react';
import { useSocialPosts, useTogglePostLike, SocialPost } from '@/hooks/useSocialPosts';
import { FeedComposer } from './FeedComposer';
import { EnhancedCommentSection } from './EnhancedCommentSection';
import { ShareModal } from './ShareModal';
import { PostViewerModal } from './PostViewerModal';
import LoadingSpinner from '@/components/LoadingSpinner';
import { formatDistanceToNow } from 'date-fns';
import { useAuth } from '@/contexts/authHelpers';

export const EnhancedSocialFeed = () => {
  const { user } = useAuth();
  const { posts, isLoading } = useSocialPosts();
  const toggleLike = useTogglePostLike();
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [selectedPost, setSelectedPost] = useState<SocialPost | null>(null);
  const [showComments, setShowComments] = useState<{[key: string]: boolean}>({});
  const [postViewerOpen, setPostViewerOpen] = useState(false);

  const handleLike = (post: SocialPost) => {
    if (!user) return;
    toggleLike.mutate({ 
      postId: post.id, 
      isLiked: post.user_liked || false 
    });
  };

  const handleShare = (post: SocialPost) => {
    setSelectedPost(post);
    setShareModalOpen(true);
  };

  const handlePostClick = (post: SocialPost) => {
    setSelectedPost(post);
    setPostViewerOpen(true);
  };

  const toggleComments = (postId: string) => {
    setShowComments(prev => ({
      ...prev,
      [postId]: !prev[postId]
    }));
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
        <Card className="bg-white shadow-sm border-0 rounded-xl">
          <CardContent className="p-8 text-center">
            <div className="text-gray-500">
              <MessageCircle className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <h3 className="text-lg font-medium mb-2">No posts yet</h3>
              <p>Be the first to share something with the community!</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        posts.map((post) => (
          <Card key={post.id} className="bg-white shadow-sm border-0 rounded-xl hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              {/* Post Header */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <Avatar className="w-10 h-10">
                    <AvatarImage src={post.profiles?.profile_photo_url} />
                    <AvatarFallback className="bg-gradient-to-r from-orange-400 to-amber-500 text-white">
                      {post.profiles?.full_name?.charAt(0) || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium text-gray-900">
                        {post.user_id === user?.id ? 'You' : (post.profiles?.full_name || 'Anonymous')}
                      </h4>
                      {post.feeling_emoji && post.feeling_label && (
                        <span className="text-sm text-gray-500">
                          is feeling {post.feeling_emoji} {post.feeling_label}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1 text-sm text-gray-500">
                      <Clock className="w-3 h-3" />
                      <span>{formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}</span>
                      {post.profiles?.username && (
                        <span>• @{post.profiles.username}</span>
                      )}
                    </div>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-gray-400 hover:text-gray-600"
                  aria-label="More options"
                >
                  •••
                </Button>
              </div>

              {/* Post Content */}
              <div 
                className="mb-4 cursor-pointer hover:bg-gray-50 rounded-lg p-2 -m-2 transition-colors"
                onClick={() => handlePostClick(post)}
              >
                <p className="text-gray-800 mb-3 whitespace-pre-wrap">{post.content}</p>
                
                {/* Book Card */}
                {post.books_library && (
                  <div className="bg-gradient-to-r from-orange-50 to-amber-50 border border-orange-100 rounded-xl p-3 flex items-center space-x-3">
                    <div className="w-12 h-16 bg-gradient-to-br from-orange-400 to-amber-500 rounded flex-shrink-0 overflow-hidden">
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
                    <div>
                      <h5 className="font-medium text-gray-900 text-sm">{post.books_library.title}</h5>
                      {post.books_library.author && (
                        <p className="text-xs text-gray-600">{post.books_library.author}</p>
                      )}
                      <Badge variant="outline" className="mt-1 text-xs border-orange-300 text-orange-700">
                        Currently Reading
                      </Badge>
                    </div>
                  </div>
                )}

                {/* Image */}
                {post.image_url && (
                  <div className="mt-3">
                    <img 
                      src={post.image_url} 
                      alt="Post image" 
                      className="w-full max-h-96 object-cover rounded-xl border"
                    />
                  </div>
                )}
              </div>

              {/* Post Actions */}
              <div className="flex items-center space-x-6 pt-3 border-t border-gray-100">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleLike(post);
                  }}
                  disabled={toggleLike.isPending}
                  className={`${post.user_liked ? 'text-red-500 hover:text-red-600' : 'text-gray-500 hover:text-gray-700'}`}
                >
                  <Heart className={`w-4 h-4 mr-1 ${post.user_liked ? 'fill-current' : ''}`} />
                  {post.likes_count}
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="text-gray-500 hover:text-gray-700"
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleComments(post.id);
                  }}
                >
                  <MessageCircle className="w-4 h-4 mr-1" />
                  {post.comments_count}
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="text-gray-500 hover:text-gray-700"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleShare(post);
                  }}
                >
                  <Share2 className="w-4 h-4 mr-1" />
                  Share
                </Button>
              </div>

              {/* Comments Section */}
              {showComments[post.id] && (
                <EnhancedCommentSection postId={post.id} />
              )}
            </CardContent>
          </Card>
        ))
      )}

      {/* Share Modal */}
      {selectedPost && (
        <ShareModal
          isOpen={shareModalOpen}
          onClose={() => setShareModalOpen(false)}
          postContent={selectedPost.content}
          postId={selectedPost.id}
        />
      )}

      {/* Post Viewer Modal */}
      {selectedPost && (
        <PostViewerModal
          post={{
            id: selectedPost.id,
            user: {
              name: selectedPost.profiles?.full_name || 'Anonymous',
              username: selectedPost.profiles?.username || 'user',
              avatar: selectedPost.profiles?.profile_photo_url || '',
              isOnline: true
            },
            content: selectedPost.content,
            book: selectedPost.books_library ? {
              title: selectedPost.books_library.title,
              author: selectedPost.books_library.author || '',
              cover: selectedPost.books_library.cover_image_url || ''
            } : undefined,
            image: selectedPost.image_url,
            feeling: selectedPost.feeling_emoji && selectedPost.feeling_label ? {
              emoji: selectedPost.feeling_emoji,
              label: selectedPost.feeling_label
            } : undefined,
            timestamp: formatDistanceToNow(new Date(selectedPost.created_at), { addSuffix: true }),
            likes: selectedPost.likes_count,
            comments: selectedPost.comments_count,
            isLiked: selectedPost.user_liked || false
          }}
          isOpen={postViewerOpen}
          onClose={() => setPostViewerOpen(false)}
        />
      )}
    </div>
  );
};