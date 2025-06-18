
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
    <Card className="w-full">
      <CardHeader className="p-4 sm:p-6">
        <CardTitle className="flex items-center text-lg sm:text-xl">
          <MessageCircle className="w-4 h-4 sm:w-5 sm:h-5 mr-2 text-amber-600 flex-shrink-0" />
          <span className="truncate">Reading Feed</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4 sm:p-6 pt-0 space-y-4 sm:space-y-6">
        {posts.map((post) => (
          <div key={post.id} className="border-b border-gray-100 pb-4 sm:pb-6 last:border-b-0">
            <div className="flex items-start space-x-2 sm:space-x-3">
              <Avatar className="w-8 h-8 sm:w-10 sm:h-10 flex-shrink-0">
                <AvatarImage src={post.user.avatar} />
                <AvatarFallback className="bg-amber-100 text-amber-700 text-xs sm:text-sm">
                  {post.user.name.split(' ').map(n => n[0]).join('')}
                </AvatarFallback>
              </Avatar>
              
              <div className="flex-1 min-w-0">
                <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 mb-2">
                  <span className="font-medium text-gray-900 text-sm sm:text-base truncate">
                    {post.user.name}
                  </span>
                  {post.book && (
                    <div className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm">
                      <span className="text-gray-400 hidden sm:inline">is reading</span>
                      <span className="text-amber-600 font-medium truncate">
                        {post.book.title}
                      </span>
                    </div>
                  )}
                </div>
                
                <p className="text-gray-700 mb-3 text-sm sm:text-base leading-relaxed">
                  {post.content}
                </p>
                
                <div className="flex items-center gap-2 sm:gap-4 mb-3">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleLike(post.id)}
                    className={`${post.liked ? 'text-red-500' : 'text-gray-500'} hover:text-red-500 px-2 py-1 h-auto text-xs sm:text-sm`}
                  >
                    <Heart className={`w-3 h-3 sm:w-4 sm:h-4 mr-1 ${post.liked ? 'fill-current' : ''}`} />
                    <span className="hidden xs:inline">{post.likes}</span>
                    <span className="xs:hidden">{post.likes}</span>
                  </Button>
                  
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="text-gray-500 hover:text-amber-600 px-2 py-1 h-auto text-xs sm:text-sm"
                  >
                    <MessageCircle className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                    <span className="hidden xs:inline">{post.comments.length}</span>
                    <span className="xs:hidden">{post.comments.length}</span>
                  </Button>
                </div>
                
                {/* Comments */}
                {post.comments.length > 0 && (
                  <div className="space-y-2 mb-3">
                    {post.comments.map((comment) => (
                      <div key={comment.id} className="bg-gray-50 rounded-lg p-2 sm:p-3">
                        <div className="flex flex-col sm:flex-row sm:items-start gap-1">
                          <span className="font-medium text-gray-900 text-xs sm:text-sm flex-shrink-0">
                            {comment.user}
                          </span>
                          <span className="text-gray-700 text-xs sm:text-sm break-words">
                            {comment.content}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                
                {/* Add Comment */}
                <div className="flex flex-col xs:flex-row gap-2">
                  <Input
                    placeholder="Write a comment..."
                    value={newComment[post.id] || ''}
                    onChange={(e) => setNewComment({ ...newComment, [post.id]: e.target.value })}
                    className="flex-1 text-xs sm:text-sm h-8 sm:h-9"
                    onKeyPress={(e) => e.key === 'Enter' && handleComment(post.id)}
                  />
                  <Button 
                    size="sm" 
                    onClick={() => handleComment(post.id)}
                    disabled={!newComment[post.id]?.trim()}
                    className="w-full xs:w-auto h-8 sm:h-9 text-xs sm:text-sm px-3 sm:px-4"
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
