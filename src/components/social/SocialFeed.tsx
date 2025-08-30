
import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Heart, MessageCircle, Share2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { FeedComposer } from './FeedComposer';
import { CommentSection } from './CommentSection';
import { ShareModal } from './ShareModal';
import { PostViewerModal } from './PostViewerModal';

interface Post {
  id: string;
  user: {
    name: string;
    username: string;
    avatar: string;
    isOnline: boolean;
  };
  content: string;
  book?: {
    title: string;
    author: string;
    cover: string;
  };
  image?: string;
  feeling?: {
    emoji: string;
    label: string;
  };
  timestamp: string;
  likes: number;
  comments: number;
  isLiked: boolean;
}

const mockPosts: Post[] = [
  {
    id: '1',
    user: {
      name: 'Sarah Johnson',
      username: 'sarah_reads',
      avatar: '',
      isOnline: true
    },
    content: 'Just finished reading "Atomic Habits" - incredible insights on building sustainable habits! The 1% improvement rule is a game-changer. Anyone else read this?',
    book: {
      title: 'Atomic Habits',
      author: 'James Clear',
      cover: ''
    },
    timestamp: '2 hours ago',
    likes: 24,
    comments: 8,
    isLiked: false
  },
  {
    id: '2',
    user: {
      name: 'Mike Chen',
      username: 'bookworm_mike',
      avatar: '',
      isOnline: false
    },
    content: 'Started a new reading challenge today! Aiming to read 50 books this year. Who wants to join me?',
    feeling: {
      emoji: '📚',
      label: 'motivated'
    },
    timestamp: '4 hours ago',
    likes: 15,
    comments: 12,
    isLiked: true
  }
];

export const SocialFeed = () => {
  const [posts, setPosts] = useState<Post[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('social-feed');
        return stored ? JSON.parse(stored) : mockPosts;
      } catch {
        return mockPosts;
      }
    }
    return mockPosts;
  });
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [showComments, setShowComments] = useState<{[key: string]: boolean}>({});
  const [postViewerOpen, setPostViewerOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('social-feed', JSON.stringify(posts));
    }
  }, [posts]);

  const handleLike = (postId: string) => {
    setPosts(prevPosts =>
      prevPosts.map(post =>
        post.id === postId
          ? { ...post, isLiked: !post.isLiked, likes: post.isLiked ? post.likes - 1 : post.likes + 1 }
          : post
      )
    );
  };

  const handleCreatePost = async (postData: any) => {
    const newPost: Post = {
      id: Date.now().toString(),
      user: {
        name: 'You',
        username: 'your_username',
        avatar: '',
        isOnline: true
      },
      content: postData.content,
      book: postData.book,
      feeling: postData.feeling,
      image: postData.image,
      timestamp: 'Just now',
      likes: 0,
      comments: 0,
      isLiked: false
    };
    
    setPosts(prev => [newPost, ...prev]);
  };

  const handleShare = (post: Post) => {
    setSelectedPost(post);
    setShareModalOpen(true);
  };

  const handlePostClick = (post: Post) => {
    setSelectedPost(post);
    setPostViewerOpen(true);
  };

  const toggleComments = (postId: string) => {
    setShowComments(prev => ({
      ...prev,
      [postId]: !prev[postId]
    }));
  };

  return (
    <div className="space-y-6">
      <FeedComposer onPost={handleCreatePost} />

      {/* Posts Feed */}
      {posts.map((post) => (
        <Card key={post.id} className="bg-white shadow-sm border-0 rounded-xl">
          <CardContent className="p-4">
            {/* Post Header */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="relative">
                  <Avatar className="w-10 h-10">
                    <AvatarImage src={post.user.avatar} />
                    <AvatarFallback className="bg-gradient-to-r from-orange-400 to-amber-500 text-white">
                      {post.user.name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  {post.user.isOnline && (
                    <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="font-medium text-gray-900">{post.user.name}</h4>
                    {post.feeling && (
                      <span className="text-sm text-gray-500">
                        is feeling {post.feeling.emoji} {post.feeling.label}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-500">@{post.user.username} • {post.timestamp}</p>
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

            {/* Post Content - Clickable */}
            <div 
              className="mb-4 cursor-pointer hover:bg-gray-50 rounded-lg p-2 -m-2 transition-colors"
              onClick={() => handlePostClick(post)}
            >
              <p className="text-gray-800 mb-3">{post.content}</p>
              
              {/* Book Card */}
              {post.book && (
                <div className="bg-gray-50 rounded-xl p-3 flex items-center space-x-3">
                  <div className="w-12 h-16 bg-gradient-to-br from-orange-400 to-amber-500 rounded flex-shrink-0"></div>
                  <div>
                    <h5 className="font-medium text-gray-900 text-sm">{post.book.title}</h5>
                    <p className="text-xs text-gray-500">{post.book.author}</p>
                    <Badge variant="outline" className="mt-1 text-xs">
                      Currently Reading
                    </Badge>
                  </div>
                </div>
              )}

              {/* Image */}
              {post.image && (
                <div className="mt-3">
                  <img src={post.image} alt="Post image" className="w-full max-h-96 object-cover rounded-xl" />
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
                  handleLike(post.id);
                }}
                className={`${post.isLiked ? 'text-red-500 hover:text-red-600' : 'text-gray-500 hover:text-gray-700'}`}
              >
                <Heart className={`w-4 h-4 mr-1 ${post.isLiked ? 'fill-current' : ''}`} />
                {post.likes}
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
                {post.comments}
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
              <CommentSection postId={post.id} />
            )}
          </CardContent>
        </Card>
      ))}

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
      <PostViewerModal
        post={selectedPost}
        isOpen={postViewerOpen}
        onClose={() => setPostViewerOpen(false)}
      />
    </div>
  );
};
