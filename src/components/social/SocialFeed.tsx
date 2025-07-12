
import React, { useState } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Heart, MessageCircle, Share2, BookOpen, Send, Filter, MoreHorizontal, ThumbsUp, Smile, Camera, Image as ImageIcon } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Comment {
  id: string;
  user: { name: string; avatar?: string };
  content: string;
  timestamp: string;
  likes: number;
}

interface Post {
  id: string;
  user: { name: string; avatar?: string; username: string };
  content: string;
  image?: string;
  book?: { title: string; author: string };
  likes: number;
  comments: Comment[];
  shares: number;
  timestamp: string;
  liked: boolean;
  reactions: { type: string; count: number; users: string[] }[];
}

const mockPosts: Post[] = [
  {
    id: '1',
    user: { name: 'Sarah Johnson', username: 'sarah_reads', avatar: '/api/placeholder/40/40' },
    content: 'Just finished "The Seven Husbands of Evelyn Hugo" and I\'m absolutely mesmerized! The storytelling is incredible. Has anyone else read this masterpiece? 📚✨',
    image: 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=500&h=300&fit=crop',
    book: { title: 'The Seven Husbands of Evelyn Hugo', author: 'Taylor Jenkins Reid' },
    likes: 24,
    comments: [
      { id: '1', user: { name: 'Emma Wilson', avatar: '/api/placeholder/32/32' }, content: 'I loved this book too! The plot twists were amazing 🤩', timestamp: '1 hour ago', likes: 5 },
      { id: '2', user: { name: 'Alex Kumar', avatar: '/api/placeholder/32/32' }, content: 'Adding this to my reading list right now!', timestamp: '30 min ago', likes: 2 }
    ],
    shares: 3,
    timestamp: '2 hours ago',
    liked: false,
    reactions: [
      { type: '👍', count: 15, users: ['Emma', 'Alex', 'John'] },
      { type: '❤️', count: 8, users: ['Maria', 'Sarah'] },
      { type: '😍', count: 1, users: ['Lisa'] }
    ]
  },
  {
    id: '2',
    user: { name: 'Mike Chen', username: 'bookworm_mike', avatar: '/api/placeholder/40/40' },
    content: 'Starting my reading challenge for this month! Goal is to read 3 books. First up is "Atomic Habits" - excited to dive in! Who wants to join me? 💪📖',
    book: { title: 'Atomic Habits', author: 'James Clear' },
    likes: 18,
    comments: [
      { id: '3', user: { name: 'Sophie Lee', avatar: '/api/placeholder/32/32' }, content: 'Count me in! I need to build better reading habits 📚', timestamp: '2 hours ago', likes: 3 }
    ],
    shares: 2,
    timestamp: '4 hours ago',
    liked: true,
    reactions: [
      { type: '👍', count: 12, users: ['Sophie', 'David'] },
      { type: '💪', count: 6, users: ['Emma', 'Alex'] }
    ]
  },
  {
    id: '3',
    user: { name: 'Emma Wilson', username: 'emma_bookclub', avatar: '/api/placeholder/40/40' },
    content: 'Beautiful sunset reading session today! There\'s nothing quite like getting lost in a good book while watching the world wind down. Currently reading "The Midnight Library" and it\'s absolutely captivating! 🌅📚',
    image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=500&h=300&fit=crop',
    book: { title: 'The Midnight Library', author: 'Matt Haig' },
    likes: 32,
    comments: [
      { id: '4', user: { name: 'Sarah Johnson', avatar: '/api/placeholder/32/32' }, content: 'This looks so peaceful! Love your reading spot 😊', timestamp: '1 hour ago', likes: 4 },
      { id: '5', user: { name: 'Mike Chen', avatar: '/api/placeholder/32/32' }, content: 'The Midnight Library is on my wishlist! How are you finding it?', timestamp: '45 min ago', likes: 2 }
    ],
    shares: 7,
    timestamp: '6 hours ago',
    liked: false,
    reactions: [
      { type: '❤️', count: 20, users: ['Sarah', 'Mike', 'Alex'] },
      { type: '😍', count: 8, users: ['Emma', 'Lisa'] },
      { type: '📚', count: 4, users: ['Sophie'] }
    ]
  }
];

export const SocialFeed = () => {
  const [posts, setPosts] = useState<Post[]>(mockPosts);
  const [newPost, setNewPost] = useState('');
  const [selectedBook, setSelectedBook] = useState('');
  const [filter, setFilter] = useState('all');
  const [newComment, setNewComment] = useState<{ [key: string]: string }>({});
  const [showComments, setShowComments] = useState<{ [key: string]: boolean }>({});
  const { toast } = useToast();

  const handleCreatePost = () => {
    if (!newPost.trim()) return;

    const post: Post = {
      id: Date.now().toString(),
      user: { name: 'You', username: 'your_username', avatar: '/api/placeholder/40/40' },
      content: newPost,
      book: selectedBook ? { title: selectedBook, author: 'Unknown Author' } : undefined,
      likes: 0,
      comments: [],
      shares: 0,
      timestamp: 'now',
      liked: false,
      reactions: []
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

  const handleComment = (postId: string) => {
    const commentText = newComment[postId];
    if (!commentText?.trim()) return;

    const comment: Comment = {
      id: Date.now().toString(),
      user: { name: 'You', avatar: '/api/placeholder/32/32' },
      content: commentText,
      timestamp: 'now',
      likes: 0
    };

    setPosts(posts.map(post => 
      post.id === postId 
        ? { ...post, comments: [...post.comments, comment] }
        : post
    ));

    setNewComment({ ...newComment, [postId]: '' });
  };

  const toggleComments = (postId: string) => {
    setShowComments({ ...showComments, [postId]: !showComments[postId] });
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
    <div className="space-y-4">
      {/* Create Post */}
      <Card className="bg-white shadow-sm border-0 rounded-xl">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <Avatar className="w-10 h-10 flex-shrink-0">
              <AvatarImage src="/api/placeholder/40/40" />
              <AvatarFallback className="bg-gradient-to-r from-orange-400 to-amber-500 text-white">
                Y
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <Textarea
                placeholder="What's on your mind? Share your reading journey..."
                value={newPost}
                onChange={(e) => setNewPost(e.target.value)}
                className="min-h-[60px] border-0 resize-none bg-gray-50 rounded-2xl px-4 py-3 text-base placeholder:text-gray-500 focus:bg-white"
              />
              <div className="flex items-center justify-between mt-3">
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="sm" className="text-gray-500 hover:bg-gray-100 rounded-xl">
                    <ImageIcon className="w-5 h-5 mr-2" />
                    Photo
                  </Button>
                  <Select value={selectedBook} onValueChange={setSelectedBook}>
                    <SelectTrigger className="w-40 border-0 bg-transparent h-8">
                      <SelectValue placeholder="Tag a book" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="atomic-habits">Atomic Habits</SelectItem>
                      <SelectItem value="seven-husbands">The Seven Husbands of Evelyn Hugo</SelectItem>
                      <SelectItem value="midnight-library">The Midnight Library</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button 
                  onClick={handleCreatePost} 
                  disabled={!newPost.trim()}
                  className="bg-orange-600 hover:bg-orange-700 rounded-xl px-6 disabled:opacity-50"
                >
                  Post
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Filter Options */}
      <div className="flex items-center gap-3 bg-white rounded-xl p-3 shadow-sm">
        <div className="flex gap-2 flex-1 overflow-x-auto">
          <Button
            variant={filter === 'all' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setFilter('all')}
            className="rounded-xl whitespace-nowrap"
          >
            All Posts
          </Button>
          <Button
            variant={filter === 'friends' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setFilter('friends')}
            className="rounded-xl whitespace-nowrap"
          >
            Friends
          </Button>
          <Button
            variant={filter === 'books' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setFilter('books')}
            className="rounded-xl whitespace-nowrap"
          >
            📚 Book Posts
          </Button>
        </div>
      </div>

      {/* Posts Feed */}
      <div className="space-y-4">
        {filteredPosts.map((post) => (
          <Card key={post.id} className="bg-white shadow-sm border-0 rounded-xl hover:shadow-md transition-all duration-200">
            <CardContent className="p-0">
              {/* User Header */}
              <div className="flex items-center justify-between p-4 pb-3">
                <div className="flex items-center space-x-3">
                  <Avatar className="w-11 h-11">
                    <AvatarImage src={post.user.avatar} />
                    <AvatarFallback className="bg-gradient-to-r from-orange-400 to-amber-500 text-white font-semibold">
                      {post.user.name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h4 className="font-semibold text-gray-900">{post.user.name}</h4>
                    <p className="text-sm text-gray-500">{post.timestamp}</p>
                  </div>
                </div>
                <Button variant="ghost" size="sm" className="rounded-full h-8 w-8 p-0">
                  <MoreHorizontal className="w-5 h-5 text-gray-400" />
                </Button>
              </div>

              {/* Post Content */}
              <div className="px-4 pb-3">
                <p className="text-gray-800 leading-relaxed">{post.content}</p>
              </div>

              {/* Book Tag */}
              {post.book && (
                <div className="mx-4 mb-3 p-3 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-xl">
                  <div className="flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-orange-600" />
                    <span className="font-semibold text-orange-800">{post.book.title}</span>
                    <span className="text-orange-600">by {post.book.author}</span>
                  </div>
                </div>
              )}

              {/* Post Image */}
              {post.image && (
                <div className="mb-3">
                  <img 
                    src={post.image} 
                    alt="Post content" 
                    className="w-full max-h-96 object-cover cursor-pointer hover:brightness-95 transition-all"
                  />
                </div>
              )}

              {/* Reactions Summary */}
              {post.reactions.length > 0 && (
                <div className="px-4 py-2 flex items-center justify-between text-sm text-gray-500 border-b border-gray-100">
                  <div className="flex items-center gap-1">
                    <div className="flex -space-x-1">
                      {post.reactions.map((reaction, index) => (
                        <span key={index} className="text-lg">{reaction.type}</span>
                      ))}
                    </div>
                    <span>{post.reactions.reduce((sum, r) => sum + r.count, 0)}</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span>{post.comments.length} comments</span>
                    <span>{post.shares} shares</span>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="px-4 py-3 border-b border-gray-100">
                <div className="flex items-center justify-around">
                  <button
                    onClick={() => handleLike(post.id)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all duration-200 ${
                      post.liked 
                        ? 'text-blue-600 bg-blue-50' 
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    <ThumbsUp className={`w-5 h-5 ${post.liked ? 'fill-current' : ''}`} />
                    <span className="font-medium">Like</span>
                  </button>
                  
                  <button 
                    onClick={() => toggleComments(post.id)}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl text-gray-600 hover:bg-gray-100 transition-all duration-200"
                  >
                    <MessageCircle className="w-5 h-5" />
                    <span className="font-medium">Comment</span>
                  </button>

                  <button className="flex items-center gap-2 px-4 py-2 rounded-xl text-gray-600 hover:bg-gray-100 transition-all duration-200">
                    <Share2 className="w-5 h-5" />
                    <span className="font-medium">Share</span>
                  </button>
                </div>
              </div>

              {/* Comments Section */}
              {(showComments[post.id] || post.comments.length > 0) && (
                <div className="px-4 py-3 space-y-3">
                  {/* Existing Comments */}
                  {post.comments.slice(0, showComments[post.id] ? post.comments.length : 2).map((comment) => (
                    <div key={comment.id} className="flex items-start gap-3">
                      <Avatar className="w-8 h-8 flex-shrink-0">
                        <AvatarImage src={comment.user.avatar} />
                        <AvatarFallback className="bg-gradient-to-r from-gray-400 to-gray-500 text-white text-sm">
                          {comment.user.name.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="bg-gray-100 rounded-2xl px-4 py-2">
                          <h5 className="font-semibold text-sm text-gray-900">{comment.user.name}</h5>
                          <p className="text-gray-800 text-sm">{comment.content}</p>
                        </div>
                        <div className="flex items-center gap-4 mt-1 text-xs text-gray-500">
                          <button className="hover:underline">{comment.timestamp}</button>
                          <button className="hover:underline">Like</button>
                          <button className="hover:underline">Reply</button>
                        </div>
                      </div>
                    </div>
                  ))}

                  {/* Show more comments button */}
                  {post.comments.length > 2 && !showComments[post.id] && (
                    <button 
                      onClick={() => toggleComments(post.id)}
                      className="text-sm text-gray-500 hover:underline"
                    >
                      View {post.comments.length - 2} more comments
                    </button>
                  )}

                  {/* Add Comment */}
                  <div className="flex items-center gap-3 pt-2">
                    <Avatar className="w-8 h-8 flex-shrink-0">
                      <AvatarImage src="/api/placeholder/32/32" />
                      <AvatarFallback className="bg-gradient-to-r from-orange-400 to-amber-500 text-white text-sm">
                        Y
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 flex items-center gap-2">
                      <Input
                        placeholder="Write a comment..."
                        value={newComment[post.id] || ''}
                        onChange={(e) => setNewComment({ ...newComment, [post.id]: e.target.value })}
                        className="border-0 bg-gray-100 rounded-2xl px-4 py-2 text-sm focus:bg-white"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            handleComment(post.id);
                          }
                        }}
                      />
                      <Button
                        size="sm"
                        onClick={() => handleComment(post.id)}
                        disabled={!newComment[post.id]?.trim()}
                        className="rounded-full h-8 w-8 p-0 bg-orange-600 hover:bg-orange-700 disabled:opacity-50"
                      >
                        <Send className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};
