
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Heart, MessageCircle, BookOpen } from 'lucide-react';

interface FeedPost {
  id: string;
  user: {
    name: string;
    avatar?: string;
  };
  book?: {
    title: string;
    cover?: string;
  };
  content: string;
  likes: number;
  comments: Array<{
    id: string;
    user: string;
    content: string;
  }>;
  liked: boolean;
}

const ReadingFeed: React.FC = () => {
  const [newComment, setNewComment] = useState<{ [key: string]: string }>({});
  
  // Mock data - in real app, this would come from Supabase
  const [posts, setPosts] = useState<FeedPost[]>([
    {
      id: '1',
      user: { name: 'Sarah Chen', avatar: undefined },
      book: { title: 'The Seven Husbands of Evelyn Hugo', cover: undefined },
      content: 'Just finished this amazing novel! The storytelling is absolutely captivating. Highly recommend for anyone who loves character-driven stories.',
      likes: 12,
      comments: [
        { id: '1', user: 'Mike', content: 'I loved this book too! The plot twists were incredible.' }
      ],
      liked: false
    },
    {
      id: '2',
      user: { name: 'David Rodriguez', avatar: undefined },
      book: undefined,
      content: 'Reading goal update: 15/30 books completed this year! Currently diving into some sci-fi classics.',
      likes: 8,
      comments: [],
      liked: true
    }
  ]);

  const handleLike = (postId: string) => {
    setPosts(posts.map(post => 
      post.id === postId 
        ? { ...post, liked: !post.liked, likes: post.liked ? post.likes - 1 : post.likes + 1 }
        : post
    ));
  };

  const handleComment = (postId: string) => {
    const comment = newComment[postId];
    if (!comment?.trim()) return;
    
    setPosts(posts.map(post => 
      post.id === postId 
        ? { 
            ...post, 
            comments: [...post.comments, { 
              id: Date.now().toString(), 
              user: 'You', 
              content: comment 
            }] 
          }
        : post
    ));
    setNewComment({ ...newComment, [postId]: '' });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <MessageCircle className="w-5 h-5 mr-2 text-amber-600" />
          Reading Feed
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {posts.map((post) => (
          <div key={post.id} className="border-b border-gray-100 pb-6 last:border-b-0">
            <div className="flex items-start space-x-3">
              <Avatar className="w-10 h-10">
                <AvatarImage src={post.user.avatar} />
                <AvatarFallback className="bg-amber-100 text-amber-700">
                  {post.user.name.split(' ').map(n => n[0]).join('')}
                </AvatarFallback>
              </Avatar>
              
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-2">
                  <span className="font-medium text-gray-900">{post.user.name}</span>
                  {post.book && (
                    <>
                      <span className="text-gray-400">is reading</span>
                      <span className="text-amber-600 font-medium">{post.book.title}</span>
                    </>
                  )}
                </div>
                
                <p className="text-gray-700 mb-3">{post.content}</p>
                
                <div className="flex items-center space-x-4 mb-3">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleLike(post.id)}
                    className={`${post.liked ? 'text-red-500' : 'text-gray-500'} hover:text-red-500`}
                  >
                    <Heart className={`w-4 h-4 mr-1 ${post.liked ? 'fill-current' : ''}`} />
                    {post.likes}
                  </Button>
                  
                  <Button variant="ghost" size="sm" className="text-gray-500 hover:text-amber-600">
                    <MessageCircle className="w-4 h-4 mr-1" />
                    {post.comments.length}
                  </Button>
                </div>
                
                {/* Comments */}
                {post.comments.length > 0 && (
                  <div className="space-y-2 mb-3">
                    {post.comments.map((comment) => (
                      <div key={comment.id} className="bg-gray-50 rounded-lg p-2 text-sm">
                        <span className="font-medium text-gray-900">{comment.user}</span>
                        <span className="text-gray-700 ml-2">{comment.content}</span>
                      </div>
                    ))}
                  </div>
                )}
                
                {/* Add Comment */}
                <div className="flex space-x-2">
                  <Input
                    placeholder="Write a comment..."
                    value={newComment[post.id] || ''}
                    onChange={(e) => setNewComment({ ...newComment, [post.id]: e.target.value })}
                    className="flex-1 text-sm"
                    onKeyPress={(e) => e.key === 'Enter' && handleComment(post.id)}
                  />
                  <Button 
                    size="sm" 
                    onClick={() => handleComment(post.id)}
                    disabled={!newComment[post.id]?.trim()}
                  >
                    Post
                  </Button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};

export default ReadingFeed;
