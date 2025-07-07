
import React, { useState } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Heart, MessageCircle, Share2, BookOpen, Send, Filter } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Post {
  id: string;
  user: { name: string; avatar?: string; username: string };
  content: string;
  book?: { title: string; author: string };
  likes: number;
  comments: number;
  shares: number;
  timestamp: string;
  liked: boolean;
}

const mockPosts: Post[] = [
  {
    id: '1',
    user: { name: 'Sarah Johnson', username: 'sarah_reads', avatar: '' },
    content: 'Just finished "The Seven Husbands of Evelyn Hugo" and I\'m absolutely mesmerized! The storytelling is incredible. Has anyone else read this masterpiece?',
    book: { title: 'The Seven Husbands of Evelyn Hugo', author: 'Taylor Jenkins Reid' },
    likes: 24,
    comments: 8,
    shares: 3,
    timestamp: '2 hours ago',
    liked: false
  },
  {
    id: '2',
    user: { name: 'Mike Chen', username: 'bookworm_mike', avatar: '' },
    content: 'Starting my reading challenge for this month! Goal is to read 3 books. First up is "Atomic Habits" - excited to dive in!',
    book: { title: 'Atomic Habits', author: 'James Clear' },
    likes: 18,
    comments: 5,
    shares: 2,
    timestamp: '4 hours ago',
    liked: true
  }
];

export const SocialFeed = () => {
  const [posts, setPosts] = useState<Post[]>(mockPosts);
  const [newPost, setNewPost] = useState('');
  const [selectedBook, setSelectedBook] = useState('');
  const [filter, setFilter] = useState('all');
  const { toast } = useToast();

  const handleCreatePost = () => {
    if (!newPost.trim()) return;

    const post: Post = {
      id: Date.now().toString(),
      user: { name: 'You', username: 'your_username', avatar: '' },
      content: newPost,
      book: selectedBook ? { title: selectedBook, author: 'Unknown Author' } : undefined,
      likes: 0,
      comments: 0,
      shares: 0,
      timestamp: 'now',
      liked: false
    };

    setPosts([post, ...posts]);
    setNewPost('');
    setSelectedBook('');
    toast({ title: 'Post created successfully!' });
  };

  const handleLike = (postId: string) => {
    setPosts(posts.map(post => 
      post.id === postId 
        ? { ...post, liked: !post.liked, likes: post.liked ? post.likes - 1 : post.likes + 1 }
        : post
    ));
  };

  const filteredPosts = posts.filter(post => {
    switch (filter) {
      case 'friends': return true;
      case 'groups': return false;
      case 'books': return post.book !== undefined;
      default: return true;
    }
  });

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Create Post */}
      <Card className="bg-white shadow-sm">
        <CardHeader>
          <h3 className="text-lg font-semibold text-gray-900">Share Your Reading Journey</h3>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea
            placeholder="What are you reading? Share your thoughts..."
            value={newPost}
            onChange={(e) => setNewPost(e.target.value)}
            className="min-h-[100px]"
          />
          
          <div className="flex items-center gap-3">
            <Select value={selectedBook} onValueChange={setSelectedBook}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Tag a book" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="atomic-habits">Atomic Habits</SelectItem>
                <SelectItem value="seven-husbands">The Seven Husbands of Evelyn Hugo</SelectItem>
                <SelectItem value="midnight-library">The Midnight Library</SelectItem>
              </SelectContent>
            </Select>
            
            <Button onClick={handleCreatePost} className="bg-orange-600 hover:bg-orange-700 ml-auto">
              <Send className="w-4 h-4 mr-2" />
              Post
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Filter Options */}
      <div className="flex items-center gap-4 bg-white rounded-lg p-4 shadow-sm">
        <Filter className="w-5 h-5 text-gray-600" />
        <div className="flex gap-2">
          <Button
            variant={filter === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('all')}
          >
            All Posts
          </Button>
          <Button
            variant={filter === 'friends' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('friends')}
          >
            Friends
          </Button>
          <Button
            variant={filter === 'groups' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('groups')}
          >
            Groups
          </Button>
          <Button
            variant={filter === 'books' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('books')}
          >
            My Books
          </Button>
        </div>
      </div>

      {/* Posts Feed */}
      <div className="space-y-6">
        {filteredPosts.map((post) => (
          <Card key={post.id} className="bg-white shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              {/* User Header */}
              <div className="flex items-center space-x-3 mb-4">
                <Avatar className="w-10 h-10">
                  <AvatarImage src={post.user.avatar} />
                  <AvatarFallback className="bg-gradient-to-r from-amber-400 to-orange-500 text-white">
                    {post.user.name.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h4 className="font-semibold text-gray-900">{post.user.name}</h4>
                  <p className="text-sm text-gray-500">@{post.user.username} • {post.timestamp}</p>
                </div>
              </div>

              {/* Post Content */}
              <p className="text-gray-800 mb-4 leading-relaxed">{post.content}</p>

              {/* Book Tag */}
              {post.book && (
                <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                  <div className="flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-amber-600" />
                    <span className="font-medium text-amber-800">{post.book.title}</span>
                    <span className="text-amber-600">by {post.book.author}</span>
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                <div className="flex items-center space-x-6">
                  <button
                    onClick={() => handleLike(post.id)}
                    className={`flex items-center space-x-2 transition-colors ${
                      post.liked ? 'text-red-500' : 'text-gray-500 hover:text-red-500'
                    }`}
                  >
                    <Heart className={`w-5 h-5 ${post.liked ? 'fill-current' : ''}`} />
                    <span className="font-medium">{post.likes}</span>
                  </button>
                  
                  <button className="flex items-center space-x-2 text-gray-500 hover:text-amber-600 transition-colors">
                    <MessageCircle className="w-5 h-5" />
                    <span className="font-medium">{post.comments}</span>
                  </button>

                  <button className="flex items-center space-x-2 text-gray-500 hover:text-blue-600 transition-colors">
                    <Share2 className="w-5 h-5" />
                    <span className="font-medium">{post.shares}</span>
                  </button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};
