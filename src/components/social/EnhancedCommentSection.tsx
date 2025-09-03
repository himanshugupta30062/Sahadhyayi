import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Heart, MessageCircle, Reply, Send, Clock } from 'lucide-react';
import { usePostComments, useCreateComment } from '@/hooks/useSocialPosts';
import { useAuth } from '@/contexts/authHelpers';
import { formatDistanceToNow } from 'date-fns';
import LoadingSpinner from '@/components/LoadingSpinner';

interface Comment {
  id: string;
  user_id: string;
  post_id: string;
  content: string;
  parent_comment_id?: string;
  created_at: string;
  updated_at: string;
  profiles?: {
    id: string;
    full_name?: string;
    username?: string;
    profile_photo_url?: string;
  };
}

interface CommentSectionProps {
  postId: string;
}

export const EnhancedCommentSection: React.FC<CommentSectionProps> = ({ postId }) => {
  const { user } = useAuth();
  const [newComment, setNewComment] = useState('');
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const { data: comments = [], isLoading } = usePostComments(postId);
  const createComment = useCreateComment();

  const handleAddComment = async () => {
    if (!newComment.trim() || !user) return;
    
    try {
      await createComment.mutateAsync({
        postId,
        content: newComment.trim()
      });
      setNewComment('');
      setReplyingTo(null);
    } catch (error) {
      console.error('Error adding comment:', error);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleAddComment();
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-4">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="mt-4 pt-4 border-t border-gray-100">
      {/* Comments List */}
      <div className="space-y-4 max-h-80 overflow-y-auto">
        {comments.length === 0 ? (
          <div className="text-center text-gray-500 py-4">
            <MessageCircle className="w-8 h-8 mx-auto mb-2 text-gray-300" />
            <p className="text-sm">No comments yet. Be the first to comment!</p>
          </div>
        ) : (
          comments.map((comment) => (
            <div key={comment.id} className="flex space-x-3">
              <Avatar className="w-8 h-8">
                <AvatarImage src={comment.profiles?.profile_photo_url} />
                <AvatarFallback className="bg-gradient-to-r from-orange-400 to-amber-500 text-white text-xs">
                  {comment.profiles?.full_name?.charAt(0) || 'U'}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <div className="bg-gray-50 rounded-lg px-3 py-2">
                  <div className="flex items-center justify-between mb-1">
                    <h5 className="font-medium text-sm text-gray-900">
                      {comment.user_id === user?.id ? 'You' : (comment.profiles?.full_name || 'Anonymous')}
                    </h5>
                    <div className="flex items-center gap-1 text-xs text-gray-500">
                      <Clock className="w-3 h-3" />
                      <span>{formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}</span>
                    </div>
                  </div>
                  <p className="text-sm text-gray-800 whitespace-pre-wrap">{comment.content}</p>
                </div>
                <div className="flex items-center space-x-4 mt-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-gray-500 h-auto p-1"
                  >
                    <Heart className="w-3 h-3 mr-1" />
                    0
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setReplyingTo(comment.id)}
                    className="text-gray-500 h-auto p-1"
                  >
                    <Reply className="w-3 h-3 mr-1" />
                    Reply
                  </Button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add Comment */}
      <div className="flex space-x-3 pt-4 border-t">
        <Avatar className="w-8 h-8">
          <AvatarImage src={user?.user_metadata?.avatar_url} />
          <AvatarFallback className="bg-gradient-to-r from-orange-400 to-amber-500 text-white text-xs">
            {user?.user_metadata?.full_name?.charAt(0) || user?.email?.charAt(0) || 'U'}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 flex space-x-2">
          <Input
            placeholder={replyingTo ? "Write a reply..." : "Write a comment..."}
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            onKeyPress={handleKeyPress}
            className="flex-1"
            disabled={createComment.isPending}
          />
          <Button 
            onClick={handleAddComment} 
            disabled={!newComment.trim() || createComment.isPending || !user}
            size="sm"
            className="bg-orange-600 hover:bg-orange-700"
          >
            {createComment.isPending ? (
              <LoadingSpinner />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};