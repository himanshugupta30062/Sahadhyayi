
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Heart, MessageCircle, Share2, BookOpen, Send, Image, Smile } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

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
      avatar: '/api/placeholder/40/40',
      isOnline: true
    },
    content: 'Just finished reading "Atomic Habits" - incredible insights on building sustainable habits! The 1% improvement rule is a game-changer. Anyone else read this?',
    book: {
      title: 'Atomic Habits',
      author: 'James Clear',
      cover: '/api/placeholder/60/80'
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
      avatar: '/api/placeholder/40/40',
      isOnline: false
    },
    content: 'Started a new reading challenge today! Aiming to read 50 books this year. Who wants to join me? 📚',
    timestamp: '4 hours ago',
    likes: 15,
    comments: 12,
    isLiked: true
  }
];

export const SocialFeed = () => {
  const [posts, setPosts] = useState<Post[]>(mockPosts);
  const [newPost, setNewPost] = useState('');
  const { toast } = useToast();

  const handleLike = (postId: string) => {
    setPosts(posts.map(post => 
      post.id === postId 
        ? { ...post, isLiked: !post.isLiked, likes: post.isLiked ? post.likes - 1 : post.likes + 1 }
        : post
    ));
  };

  const handleCreatePost = () => {
    if (!newPost.trim()) return;
    
    const post: Post = {
      id: Date.now().toString(),
      user: {
        name: 'You',
        username: 'your_username',
        avatar: '/api/placeholder/40/40',
        isOnline: true
      },
      content: newPost,
      timestamp: 'Just now',
      likes: 0,
      comments: 0,
      isLiked: false
    };
    
    setPosts([post, ...posts]);
    setNewPost('');
    toast({ title: 'Post created successfully!' });
  };

  return (
    <div className="space-y-6">
      {/* Create Post */}
      <Card className="bg-white shadow-sm border-0 rounded-xl">
        <CardContent className="p-4">
          <div className="flex items-start space-x-3">
            <Avatar className="w-10 h-10">
              <AvatarImage src="/api/placeholder/40/40" />
              <AvatarFallback className="bg-gradient-to-r from-orange-400 to-amber-500 text-white">
                Y
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 space-y-3">
              <Textarea
                placeholder="What's on your reading mind?"
                value={newPost}
                onChange={(e) => setNewPost(e.target.value)}
                className="min-h-[80px] border-0 bg-gray-50 rounded-xl resize-none focus:bg-white"
              />
              <div className="flex items-center justify-between">
                <div className="flex space-x-2">
                  <Button variant="ghost" size="sm" className="text-gray-500 hover:text-gray-700">
                    <Image className="w-4 h-4 mr-1" />
                    Photo
                  </Button>
                  <Button variant="ghost" size="sm" className="text-gray-500 hover:text-gray-700">
                    <BookOpen className="w-4 h-4 mr-1" />
                    Book
                  </Button>
                  <Button variant="ghost" size="sm" className="text-gray-500 hover:text-gray-700">
                    <Smile className="w-4 h-4 mr-1" />
                    Feeling
                  </Button>
                </div>
                <Button 
                  onClick={handleCreatePost}
                  disabled={!newPost.trim()}
                  className="bg-orange-600 hover:bg-orange-700 rounded-xl"
                >
                  <Send className="w-4 h-4 mr-1" />
                  Post
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

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
                  <h4 className="font-medium text-gray-900">{post.user.name}</h4>
                  <p className="text-sm text-gray-500">@{post.user.username} • {post.timestamp}</p>
                </div>
              </div>
              <Button variant="ghost" size="sm" className="text-gray-400 hover:text-gray-600">
                •••
              </Button>
            </div>

            {/* Post Content */}
            <div className="mb-4">
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
            </div>

            {/* Post Actions */}
            <div className="flex items-center space-x-6 pt-3 border-t border-gray-100">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleLike(post.id)}
                className={`${post.isLiked ? 'text-red-500 hover:text-red-600' : 'text-gray-500 hover:text-gray-700'}`}
              >
                <Heart className={`w-4 h-4 mr-1 ${post.isLiked ? 'fill-current' : ''}`} />
                {post.likes}
              </Button>
              <Button variant="ghost" size="sm" className="text-gray-500 hover:text-gray-700">
                <MessageCircle className="w-4 h-4 mr-1" />
                {post.comments}
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
