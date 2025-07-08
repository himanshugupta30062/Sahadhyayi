
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Users, MessageCircle, Heart, Share, AtSign, Send, User } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

interface BookReadersConnectionProps {
  bookId: string;
  bookTitle: string;
}

interface Comment {
  id: string;
  user: string;
  content: string;
  type: 'comment' | 'quote';
  timestamp: string;
  likes: number;
  isLiked: boolean;
}

const BookReadersConnection = ({ bookId, bookTitle }: BookReadersConnectionProps) => {
  const { user } = useAuth();
  const [newComment, setNewComment] = useState('');
  const [commentType, setCommentType] = useState<'comment' | 'quote'>('comment');
  const [taggedFriends, setTaggedFriends] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');

  // Mock data - replace with real data from your backend
  const [comments, setComments] = useState<Comment[]>([
    {
      id: '1',
      user: 'Sarah M.',
      content: 'This book completely changed my perspective on life. The author\'s writing style is so engaging!',
      type: 'comment',
      timestamp: '2 hours ago',
      likes: 12,
      isLiked: false
    },
    {
      id: '2',
      user: 'Michael R.',
      content: '"The only way to do great work is to love what you do." - This quote from the book really resonated with me.',
      type: 'quote',
      timestamp: '5 hours ago',
      likes: 8,
      isLiked: true
    },
    {
      id: '3',
      user: 'Emma L.',
      content: 'Currently on chapter 7 and loving every page. Anyone else reading this?',
      type: 'comment',
      timestamp: '1 day ago',
      likes: 5,
      isLiked: false
    }
  ]);

  const readersCount = 247; // Mock data

  const handleSubmitComment = () => {
    if (!newComment.trim() || !user) return;

    const comment: Comment = {
      id: Date.now().toString(),
      user: user.email?.split('@')[0] || 'Anonymous',
      content: newComment,
      type: commentType,
      timestamp: 'Just now',
      likes: 0,
      isLiked: false
    };

    setComments([comment, ...comments]);
    setNewComment('');
    setTaggedFriends([]);
  };

  const handleLikeComment = (commentId: string) => {
    setComments(comments.map(comment => 
      comment.id === commentId 
        ? { ...comment, likes: comment.isLiked ? comment.likes - 1 : comment.likes + 1, isLiked: !comment.isLiked }
        : comment
    ));
  };

  const handleTagFriend = () => {
    if (tagInput.trim() && !taggedFriends.includes(tagInput.trim())) {
      setTaggedFriends([...taggedFriends, tagInput.trim()]);
      setTagInput('');
    }
  };

  const removeTag = (tag: string) => {
    setTaggedFriends(taggedFriends.filter(t => t !== tag));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <div className="flex items-center justify-center gap-2 mb-2">
          <Users className="w-6 h-6 text-blue-600" />
          <h3 className="text-2xl font-bold text-blue-900">Connect with Fellow Readers</h3>
        </div>
        <p className="text-blue-700">Share your thoughts and connect with other readers of "{bookTitle}"</p>
        <div className="mt-3">
          <Badge className="bg-blue-100 text-blue-800 text-sm px-3 py-1">
            <Users className="w-4 h-4 mr-1" />
            {readersCount} readers
          </Badge>
        </div>
      </div>

      {/* Post New Comment/Quote */}
      {user ? (
        <div className="bg-white/80 backdrop-blur-sm rounded-xl p-6 border border-blue-200 shadow-sm">
          <div className="space-y-4">
            {/* Comment Type Toggle */}
            <div className="flex gap-2">
              <Button
                variant={commentType === 'comment' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setCommentType('comment')}
                className={commentType === 'comment' ? 'bg-blue-600 hover:bg-blue-700' : ''}
              >
                <MessageCircle className="w-4 h-4 mr-1" />
                Comment
              </Button>
              <Button
                variant={commentType === 'quote' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setCommentType('quote')}
                className={commentType === 'quote' ? 'bg-purple-600 hover:bg-purple-700' : ''}
              >
                <Share className="w-4 h-4 mr-1" />
                Quote
              </Button>
            </div>

            {/* Text Area */}
            <Textarea
              placeholder={commentType === 'comment' 
                ? "Share your thoughts about this book..." 
                : "Share a memorable quote from the book..."
              }
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              className="min-h-[100px] resize-none"
            />

            {/* Tag Friends */}
            <div className="space-y-2">
              <div className="flex gap-2">
                <Input
                  placeholder="Tag friends (@username)"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleTagFriend()}
                  className="flex-1"
                />
                <Button variant="outline" size="sm" onClick={handleTagFriend}>
                  <AtSign className="w-4 h-4" />
                </Button>
              </div>
              
              {taggedFriends.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {taggedFriends.map((tag, index) => (
                    <Badge key={index} variant="secondary" className="cursor-pointer" onClick={() => removeTag(tag)}>
                      @{tag} ×
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            {/* Submit Button */}
            <div className="flex justify-end">
              <Button onClick={handleSubmitComment} disabled={!newComment.trim()}>
                <Send className="w-4 h-4 mr-2" />
                Post {commentType === 'comment' ? 'Comment' : 'Quote'}
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white/80 backdrop-blur-sm rounded-xl p-6 border border-blue-200 shadow-sm text-center">
          <p className="text-gray-600 mb-4">Sign in to connect with fellow readers and share your thoughts</p>
          <Button variant="outline">Sign In</Button>
        </div>
      )}

      <Separator />

      {/* Comments List */}
      <div className="space-y-4">
        <h4 className="text-lg font-semibold text-gray-900">Reader Comments & Quotes</h4>
        
        {comments.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <MessageCircle className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No comments yet. Be the first to share your thoughts!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {comments.map((comment) => (
              <div key={comment.id} className="bg-white/60 backdrop-blur-sm rounded-lg p-4 border border-gray-200">
                <div className="flex items-start space-x-3">
                  <Avatar className="w-8 h-8">
                    <AvatarFallback>
                      <User className="w-4 h-4" />
                    </AvatarFallback>
                  </Avatar>
                  
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-900">{comment.user}</span>
                      <Badge variant={comment.type === 'quote' ? 'secondary' : 'outline'} className="text-xs">
                        {comment.type === 'quote' ? 'Quote' : 'Comment'}
                      </Badge>
                      <span className="text-xs text-gray-500">{comment.timestamp}</span>
                    </div>
                    
                    <p className={`text-gray-700 ${comment.type === 'quote' ? 'italic border-l-2 border-purple-300 pl-3' : ''}`}>
                      {comment.content}
                    </p>
                    
                    <div className="flex items-center gap-4">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleLikeComment(comment.id)}
                        className={`text-xs ${comment.isLiked ? 'text-red-600' : 'text-gray-500'}`}
                      >
                        <Heart className={`w-4 h-4 mr-1 ${comment.isLiked ? 'fill-current' : ''}`} />
                        {comment.likes}
                      </Button>
                      <Button variant="ghost" size="sm" className="text-xs text-gray-500">
                        <MessageCircle className="w-4 h-4 mr-1" />
                        Reply
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default BookReadersConnection;
