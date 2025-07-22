
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Heart, MessageCircle, Share2, Plus, BookOpen, Users, Activity } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

interface Post {
  id: string;
  content: string;
  book_title?: string;
  book_author?: string;
  created_at: string;
  user: {
    id: string;
    full_name: string;
    username?: string;
    profile_photo_url?: string;
  };
  likes_count: number;
  comments_count: number;
  is_liked: boolean;
}

export const EnhancedSocialFeed = () => {
  const { user } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [newPost, setNewPost] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isPosting, setIsPosting] = useState(false);

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    try {
      setIsLoading(true);
      
      // Fetch posts with user profiles
      const { data, error } = await supabase
        .from('posts')
        .select(`
          id,
          content,
          book_title,
          book_author,
          created_at,
          user_id,
          profiles!inner(
            id,
            full_name,
            username,
            profile_photo_url
          )
        `)
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) {
        console.error('Error fetching posts:', error);
        setPosts([]);
        return;
      }

      // Transform data to match Post interface
      const transformedPosts = (data || []).map((post: any) => ({
        id: post.id,
        content: post.content,
        book_title: post.book_title,
        book_author: post.book_author,
        created_at: post.created_at,
        user: {
          id: post.profiles.id,
          full_name: post.profiles.full_name,
          username: post.profiles.username,
          profile_photo_url: post.profiles.profile_photo_url,
        },
        likes_count: Math.floor(Math.random() * 20), // Mock data for now
        comments_count: Math.floor(Math.random() * 10),
        is_liked: Math.random() > 0.7,
      }));

      setPosts(transformedPosts);
    } catch (error) {
      console.error('Error in fetchPosts:', error);
      setPosts([]);
    } finally {
      setIsLoading(false);
    }
  };

  const createPost = async () => {
    if (!newPost.trim() || !user) return;

    try {
      setIsPosting(true);
      
      const { error } = await supabase
        .from('posts')
        .insert({
          user_id: user.id,
          content: newPost,
          created_at: new Date().toISOString(),
        });

      if (error) {
        console.error('Error creating post:', error);
        return;
      }

      setNewPost('');
      fetchPosts(); // Refresh posts
    } catch (error) {
      console.error('Error in createPost:', error);
    } finally {
      setIsPosting(false);
    }
  };

  const getInitials = (name: string) => {
    return name?.split(' ').map(n => n[0]).join('').toUpperCase() || '?';
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
                <div className="flex-1 space-y-3">
                  <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                  <div className="space-y-2">
                    <div className="h-4 bg-gray-200 rounded"></div>
                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Create Post Section */}
      {user && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="w-5 h-5" />
              Share Your Reading Journey
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start gap-4">
              <Avatar className="w-10 h-10">
                <AvatarImage src={user.user_metadata?.avatar_url} />
                <AvatarFallback className="bg-orange-100 text-orange-700">
                  {getInitials(user.user_metadata?.full_name || user.email || '')}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 space-y-3">
                <Textarea
                  placeholder="What are you reading? Share your thoughts, recommendations, or reading progress..."
                  value={newPost}
                  onChange={(e) => setNewPost(e.target.value)}
                  className="min-h-[100px] resize-none"
                />
                <div className="flex justify-between items-center">
                  <div className="flex gap-2">
                    <Badge variant="secondary" className="cursor-pointer hover:bg-orange-100">
                      <BookOpen className="w-3 h-3 mr-1" />
                      Book Review
                    </Badge>
                    <Badge variant="secondary" className="cursor-pointer hover:bg-blue-100">
                      <Activity className="w-3 h-3 mr-1" />
                      Reading Progress
                    </Badge>
                  </div>
                  <Button 
                    onClick={createPost}
                    disabled={!newPost.trim() || isPosting}
                    className="bg-orange-600 hover:bg-orange-700"
                  >
                    {isPosting ? 'Posting...' : 'Share'}
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Posts Feed */}
      {posts.length > 0 ? (
        posts.map((post) => (
          <Card key={post.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <Avatar className="w-12 h-12">
                  <AvatarImage src={post.user.profile_photo_url || ''} />
                  <AvatarFallback className="bg-gradient-to-r from-orange-400 to-amber-500 text-white">
                    {getInitials(post.user.full_name)}
                  </AvatarFallback>
                </Avatar>
                
                <div className="flex-1 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-semibold text-gray-900">{post.user.full_name}</h4>
                      <p className="text-sm text-gray-500">
                        @{post.user.username || 'reader'} • {formatDate(post.created_at)}
                      </p>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <p className="text-gray-800 leading-relaxed">{post.content}</p>
                    
                    {(post.book_title || post.book_author) && (
                      <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
                        <div className="flex items-center gap-2 text-orange-700">
                          <BookOpen className="w-4 h-4" />
                          <span className="text-sm font-medium">
                            {post.book_title && post.book_author 
                              ? `"${post.book_title}" by ${post.book_author}`
                              : post.book_title || post.book_author
                            }
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-6 pt-2 border-t border-gray-100">
                    <button className={`flex items-center gap-2 text-sm transition-colors ${
                      post.is_liked ? 'text-red-600' : 'text-gray-500 hover:text-red-600'
                    }`}>
                      <Heart className={`w-4 h-4 ${post.is_liked ? 'fill-current' : ''}`} />
                      {post.likes_count}
                    </button>
                    
                    <button className="flex items-center gap-2 text-sm text-gray-500 hover:text-blue-600 transition-colors">
                      <MessageCircle className="w-4 h-4" />
                      {post.comments_count}
                    </button>
                    
                    <button className="flex items-center gap-2 text-sm text-gray-500 hover:text-green-600 transition-colors">
                      <Share2 className="w-4 h-4" />
                      Share
                    </button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))
      ) : (
        <Card className="text-center py-12">
          <CardContent>
            <div className="space-y-4">
              <Users className="w-16 h-16 mx-auto text-gray-400" />
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  No Posts Yet
                </h3>
                <p className="text-gray-600 mb-4">
                  Be the first to share your reading experience with the community!
                </p>
                {user && (
                  <p className="text-sm text-gray-500">
                    Start a conversation about your favorite books, share reading progress, or ask for recommendations.
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
