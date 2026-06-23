import React, { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Heart, MessageCircle, Reply, Send, Clock } from 'lucide-react';
import { usePostComments, useCreateComment, useToggleCommentLike } from '@/hooks/useSocialPosts';
import { useAuth } from '@/contexts/authHelpers';
import { formatDistanceToNow } from 'date-fns';
import LoadingSpinner from '@/components/LoadingSpinner';

interface CommentRow {
  id: string;
  user_id: string;
  post_id: string;
  content: string;
  parent_comment_id?: string | null;
  created_at: string;
  likes_count?: number;
  user_liked?: boolean;
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
  const [replyingTo, setReplyingTo] = useState<{ id: string; name: string } | null>(null);
  const { data: comments = [], isLoading } = usePostComments(postId);
  const createComment = useCreateComment();
  const toggleLike = useToggleCommentLike(postId);

  const tree = useMemo(() => {
    const byParent = new Map<string | null, CommentRow[]>();
    (comments as CommentRow[]).forEach((c) => {
      const key = c.parent_comment_id || null;
      if (!byParent.has(key)) byParent.set(key, []);
      byParent.get(key)!.push(c);
    });
    return byParent;
  }, [comments]);

  const handleSend = async () => {
    if (!newComment.trim() || !user) return;
    try {
      await createComment.mutateAsync({
        postId,
        content: newComment.trim(),
        parentCommentId: replyingTo?.id ?? null,
      });
      setNewComment('');
      setReplyingTo(null);
    } catch (e) {
      console.error(e);
    }
  };

  const renderComment = (c: CommentRow, depth = 0) => {
    const replies = tree.get(c.id) || [];
    return (
      <div key={c.id} className={depth > 0 ? 'ml-8 mt-3' : ''}>
        <div className="flex space-x-3">
          <Avatar className="w-8 h-8 flex-shrink-0">
            <AvatarImage src={c.profiles?.profile_photo_url} />
            <AvatarFallback className="bg-gradient-to-r from-orange-400 to-amber-500 text-white text-xs">
              {c.profiles?.full_name?.charAt(0) || 'U'}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <div className="bg-muted/60 rounded-2xl px-3 py-2">
              <div className="flex items-center justify-between gap-2">
                <h5 className="font-medium text-sm text-foreground truncate">
                  {c.user_id === user?.id ? 'You' : (c.profiles?.full_name || 'Anonymous')}
                </h5>
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Clock className="w-3 h-3" />
                  <span>{formatDistanceToNow(new Date(c.created_at), { addSuffix: true })}</span>
                </div>
              </div>
              <p className="text-sm text-foreground whitespace-pre-wrap mt-0.5">{c.content}</p>
            </div>
            <div className="flex items-center space-x-3 mt-1 ml-1">
              <Button
                variant="ghost"
                size="sm"
                disabled={!user || toggleLike.isPending}
                onClick={() => toggleLike.mutate({ commentId: c.id, isLiked: !!c.user_liked })}
                className={`h-auto p-1 text-xs ${c.user_liked ? 'text-rose-500 hover:text-rose-600' : 'text-muted-foreground hover:text-foreground'}`}
              >
                <Heart className={`w-3 h-3 mr-1 ${c.user_liked ? 'fill-current' : ''}`} />
                {c.likes_count || 0}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                disabled={!user}
                onClick={() => setReplyingTo({ id: c.id, name: c.profiles?.full_name || 'user' })}
                className="text-muted-foreground hover:text-foreground h-auto p-1 text-xs"
              >
                <Reply className="w-3 h-3 mr-1" />
                Reply
              </Button>
            </div>
            {replies.length > 0 && (
              <div className="mt-1">
                {replies.map((r) => renderComment(r, depth + 1))}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-4">
        <LoadingSpinner />
      </div>
    );
  }

  const roots = tree.get(null) || [];

  return (
    <div className="mt-4 pt-4 border-t border-border">
      <div className="space-y-4 max-h-96 overflow-y-auto">
        {roots.length === 0 ? (
          <div className="text-center text-muted-foreground py-4">
            <MessageCircle className="w-8 h-8 mx-auto mb-2 text-muted-foreground/40" />
            <p className="text-sm">No comments yet. Be the first to comment!</p>
          </div>
        ) : (
          roots.map((c) => renderComment(c))
        )}
      </div>

      <div className="pt-4 border-t border-border mt-2">
        {replyingTo && (
          <div className="flex items-center justify-between bg-brand-primary/10 text-brand-primary text-xs px-3 py-1.5 rounded-md mb-2">
            <span>Replying to <strong>{replyingTo.name}</strong></span>
            <button onClick={() => setReplyingTo(null)} className="hover:underline">Cancel</button>
          </div>
        )}
        <div className="flex space-x-3">
          <Avatar className="w-8 h-8">
            <AvatarImage src={user?.user_metadata?.avatar_url} />
            <AvatarFallback className="bg-gradient-to-r from-orange-400 to-amber-500 text-white text-xs">
              {user?.user_metadata?.full_name?.charAt(0) || user?.email?.charAt(0) || 'U'}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 flex space-x-2">
            <Input
              placeholder={replyingTo ? `Reply to ${replyingTo.name}...` : 'Write a comment...'}
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              className="flex-1"
              disabled={createComment.isPending || !user}
            />
            <Button
              onClick={handleSend}
              disabled={!newComment.trim() || createComment.isPending || !user}
              size="sm"
              className="bg-orange-600 hover:bg-orange-700"
            >
              {createComment.isPending ? <LoadingSpinner /> : <Send className="w-4 h-4" />}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
