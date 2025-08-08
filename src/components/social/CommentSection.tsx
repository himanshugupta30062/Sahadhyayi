
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { MessageCircle, Edit2, Trash2, Reply } from 'lucide-react';
import { useComments, useAddComment, useUpdateComment, useDeleteComment, Comment } from '@/hooks/useComments';
import { useAuth } from '@/contexts/authHelpers';
import { formatDistanceToNow } from 'date-fns';

interface CommentSectionProps {
  postId: string;
}

interface CommentItemProps {
  comment: Comment;
  postId: string;
  isReply?: boolean;
}

const CommentItem = ({ comment, postId, isReply = false }: CommentItemProps) => {
  const { user } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [isReplying, setIsReplying] = useState(false);
  const [editContent, setEditContent] = useState(comment.content);
  const [replyContent, setReplyContent] = useState('');

  const updateComment = useUpdateComment();
  const deleteComment = useDeleteComment();
  const addComment = useAddComment();

  const isOwner = user?.id === comment.user_id;

  const handleEdit = () => {
    updateComment.mutate({
      id: comment.id,
      content: editContent,
      postId,
    });
    setIsEditing(false);
  };

  const handleDelete = () => {
    if (window.confirm('Are you sure you want to delete this comment?')) {
      deleteComment.mutate({ id: comment.id, postId });
    }
  };

  const handleReply = () => {
    addComment.mutate({
      postId,
      content: replyContent,
      parentCommentId: comment.id,
    });
    setReplyContent('');
    setIsReplying(false);
  };

  return (
    <div className={`${isReply ? 'ml-10' : ''} mb-4`}>
      <div className="flex space-x-3">
        <Avatar className="w-8 h-8">
          <AvatarImage src={comment.user?.profile_photo_url} />
          <AvatarFallback className="bg-gradient-to-r from-orange-400 to-amber-500 text-white text-xs">
            {comment.user?.full_name?.charAt(0) || 'U'}
          </AvatarFallback>
        </Avatar>
        
        <div className="flex-1">
          <div className="bg-gray-100 rounded-2xl px-3 py-2">
            <div className="flex items-center space-x-2 mb-1">
              <span className="font-medium text-sm text-gray-900">{comment.user?.full_name || 'Unknown User'}</span>
              <span className="text-xs text-gray-500">
                {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
              </span>
            </div>
            
            {isEditing ? (
              <div className="space-y-2">
                <Textarea
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  className="min-h-[60px] text-sm"
                />
                <div className="flex space-x-2">
                  <Button size="sm" onClick={handleEdit} disabled={updateComment.isPending}>
                    Save
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => setIsEditing(false)}>
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <p className="text-sm text-gray-800">{comment.content}</p>
            )}
          </div>
          
          <div className="flex items-center space-x-4 mt-1 ml-3">
            {!isReply && (
              <Button
                variant="ghost"
                size="sm"
                className="text-xs text-gray-600 hover:text-gray-800 p-0 h-auto"
                onClick={() => setIsReplying(!isReplying)}
              >
                <Reply className="w-3 h-3 mr-1" />
                Reply
              </Button>
            )}
            
            {isOwner && (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-xs text-gray-600 hover:text-gray-800 p-0 h-auto"
                  onClick={() => setIsEditing(true)}
                >
                  <Edit2 className="w-3 h-3 mr-1" />
                  Edit
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-xs text-red-600 hover:text-red-800 p-0 h-auto"
                  onClick={handleDelete}
                >
                  <Trash2 className="w-3 h-3 mr-1" />
                  Delete
                </Button>
              </>
            )}
          </div>

          {isReplying && (
            <div className="mt-2 ml-3">
              <div className="flex space-x-2">
                <Avatar className="w-6 h-6">
                  <AvatarFallback className="bg-gradient-to-r from-orange-400 to-amber-500 text-white text-xs">
                    {user?.user_metadata?.full_name?.charAt(0) || 'U'}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <Textarea
                    placeholder="Write a reply..."
                    value={replyContent}
                    onChange={(e) => setReplyContent(e.target.value)}
                    className="min-h-[60px] text-sm"
                  />
                  <div className="flex space-x-2 mt-2">
                    <Button size="sm" onClick={handleReply} disabled={!replyContent.trim() || addComment.isPending}>
                      Reply
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => setIsReplying(false)}>
                      Cancel
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Render replies */}
          {comment.replies && comment.replies.length > 0 && (
            <div className="mt-3">
              {comment.replies.map((reply) => (
                <CommentItem key={reply.id} comment={reply} postId={postId} isReply={true} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export const CommentSection = ({ postId }: CommentSectionProps) => {
  const { user } = useAuth();
  const [newComment, setNewComment] = useState('');
  const { data: comments, isLoading } = useComments(postId);
  const addComment = useAddComment();

  const handleAddComment = () => {
    if (!newComment.trim()) return;
    
    addComment.mutate({
      postId,
      content: newComment.trim(),
    });
    setNewComment('');
  };

  const totalComments = comments?.reduce((total, comment) => {
    return total + 1 + (comment.replies?.length || 0);
  }, 0) || 0;

  return (
    <div className="mt-4 space-y-4">
      {/* Comment counter */}
      {totalComments > 0 && (
        <div className="flex items-center text-sm text-gray-600">
          <MessageCircle className="w-4 h-4 mr-1" />
          {totalComments} {totalComments === 1 ? 'Comment' : 'Comments'}
        </div>
      )}

      {/* Add new comment */}
      <div className="flex space-x-3">
        <Avatar className="w-8 h-8">
          <AvatarFallback className="bg-gradient-to-r from-orange-400 to-amber-500 text-white text-xs">
            {user?.user_metadata?.full_name?.charAt(0) || 'U'}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <Textarea
            placeholder="Write a comment..."
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            className="min-h-[60px] rounded-2xl border-gray-200"
          />
          <Button
            className="mt-2"
            size="sm"
            onClick={handleAddComment}
            disabled={!newComment.trim() || addComment.isPending}
          >
            Comment
          </Button>
        </div>
      </div>

      {/* Comments list */}
      {isLoading ? (
        <div className="text-center py-4 text-gray-500">Loading comments...</div>
      ) : comments && comments.length > 0 ? (
        <div className="space-y-4">
          {comments.map((comment) => (
            <CommentItem key={comment.id} comment={comment} postId={postId} />
          ))}
        </div>
      ) : (
        <div className="text-center py-4 text-gray-500">No comments yet. Be the first to comment!</div>
      )}
    </div>
  );
};
