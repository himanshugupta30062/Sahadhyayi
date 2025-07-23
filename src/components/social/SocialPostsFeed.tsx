
import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Heart, MessageCircle, Share2, BookOpen, Users } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

interface Post {
  id: string;
  content: string;
  created_at: string;
  user_profile: {
    id: string;
    full_name: string;
    username: string;
    profile_photo_url: string;
  };
  likes_count: number;
  comments_count: number;
  is_liked: boolean;
}

export const SocialPostsFeed: React.FC = () => {
  const { user } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPosts = async () => {
    if (!user) return;

    try {
      setIsLoading(true);
      setError(null);

      // For now, we'll create mock posts since we don't have a posts table yet
      // In a real implementation, you would fetch from a posts table
      const mockPosts: Post[] = [
        {
          id: '1',
          content: "Just finished reading 'The Alchemist' - what an incredible journey! The message about following your dreams really resonated with me. 📚✨",
          created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          user_profile: {
            id: user.id,
            full_name: user.user_metadata?.full_name || 'You',
            username: user.email?.split('@')[0] || 'you',
            profile_photo_url: user.user_metadata?.avatar_url || ''
          },
          likes_count: 0,
          comments_count: 0,
          is_liked: false
        }
      ];

      setPosts(mockPosts);
    } catch (err) {
      console.error('Error fetching posts:', err);
      setError('Failed to load posts');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, [user]);

  const handleLike = async (postId: string) => {
    setPosts(posts.map(post => 
      post.id === postId 
        ? { 
            ...post, 
            is_liked: !post.is_liked, 
            likes_count: post.is_liked ? post.likes_count - 1 : post.likes_count + 1 
          }
        : post
    ));
  };

  const getInitials = (name: string) => {
    return name?.split(' ').map(n => n[0]).join('').toUpperCase() || '?';
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <Card key={i} className="bg-white shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-10 h-10 bg-gray-300 rounded-full animate-pulse"></div>
                <div className="space-y-1">
                  <div className="w-24 h-4 bg-gray-300 rounded animate-pulse"></div>
                  <div className="w-16 h-3 bg-gray-300 rounded animate-pulse"></div>
                </div>
              </div>
              <div className="space-y-2">
                <div className="w-full h-4 bg-gray-300 rounded animate-pulse"></div>
                <div className="w-3/4 h-4 bg-gray-300 rounded animate-pulse"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8 text-red-500">
        <p className="text-sm">{error}</p>
        <Button onClick={fetchPosts} variant="outline" className="mt-2">
          Try Again
        </Button>
      </div>
    );
  }

  if (posts.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        <BookOpen className="w-16 h-16 mx-auto mb-4 opacity-50" />
        <h3 className="text-lg font-medium mb-2">No Posts Yet</h3>
        <p className="text-sm max-w-md mx-auto">
          Be the first to share your reading journey! Start by adding friends and sharing your thoughts about books.
        </p>
        <Button className="mt-4 bg-orange-600 hover:bg-orange-700">
          Create Your First Post
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {posts.map((post) => (
        <Card key={post.id} className="bg-white shadow-sm border-0 rounded-xl">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3 mb-4">
              <Avatar className="w-10 h-10">
                <AvatarImage src={post.user_profile.profile_photo_url} />
                <AvatarFallback className="bg-gradient-to-r from-orange-400 to-amber-500 text-white">
                  {getInitials(post.user_profile.full_name)}
                </AvatarFallback>
              </Avatar>
              <div>
                <h4 className="font-medium text-gray-900">{post.user_profile.full_name}</h4>
                <p className="text-sm text-gray-500">
                  @{post.user_profile.username} • {new Date(post.created_at).toLocaleDateString()}
                </p>
              </div>
            </div>

            <div className="mb-4">
              <p className="text-gray-800">{post.content}</p>
            </div>

            <div className="flex items-center space-x-6 pt-3 border-t border-gray-100">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleLike(post.id)}
                className={`${post.is_liked ? 'text-red-500 hover:text-red-600' : 'text-gray-500 hover:text-gray-700'}`}
              >
                <Heart className={`w-4 h-4 mr-1 ${post.is_liked ? 'fill-current' : ''}`} />
                {post.likes_count}
              </Button>
              <Button variant="ghost" size="sm" className="text-gray-500 hover:text-gray-700">
                <MessageCircle className="w-4 h-4 mr-1" />
                {post.comments_count}
              </Button>
              <Button variant="ghost" size="sm" className="text-gray-500 hover:text-gray-700">
                <Share2 className="w-4 h-4 mr-1" />
                Share
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
