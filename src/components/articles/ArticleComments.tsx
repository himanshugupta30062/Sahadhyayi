import React, { useState, useMemo } from 'react';
import {
  useArticleComments,
  useCreateComment,
  useDeleteComment,
  useUpdateComment,
  ArticleComment,
} from '@/hooks/useArticleSocial';
import { useAuth } from '@/contexts/authHelpers';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { MessageCircle, Reply, Trash2, Send, Pencil, X } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface Props {
  articleId: string;
}

const ArticleComments: React.FC<Props> = ({ articleId }) => {
  const { user } = useAuth();
  const { data: comments = [], isLoading } = useArticleComments(articleId);
  const createComment = useCreateComment();
  const deleteComment = useDeleteComment();

  const [newComment, setNewComment] = useState('');
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const updateComment = useUpdateComment();

  // Build thread structure
  const { topLevel, replies } = useMemo(() => {
    const top: ArticleComment[] = [];
    const rep = new Map<string, ArticleComment[]>();

    comments.forEach((c) => {
      if (!c.parent_id) {
        top.push(c);
      } else {
        const existing = rep.get(c.parent_id) || [];
        existing.push(c);
        rep.set(c.parent_id, existing);
      }
    });

    return { topLevel: top, replies: rep };
  }, [comments]);

  const handleSubmit = () => {
    if (!newComment.trim() || !user) return;
    createComment.mutate(
      { articleId, content: newComment.trim() },
      { onSuccess: () => setNewComment('') }
    );
  };

  const handleReply = (parentId: string) => {
    if (!replyContent.trim() || !user) return;
    createComment.mutate(
      { articleId, content: replyContent.trim(), parentId },
      {
        onSuccess: () => {
          setReplyContent('');
          setReplyingTo(null);
        },
      }
    );
  };

  const handleDelete = (commentId: string) => {
    deleteComment.mutate({ commentId, articleId });
  };

  const startEdit = (comment: ArticleComment) => {
    setEditingId(comment.id);
    setEditContent(comment.content);
  };

  const handleSaveEdit = (commentId: string) => {
    if (!editContent.trim()) return;
    updateComment.mutate(
      { commentId, articleId, content: editContent.trim() },
      {
        onSuccess: () => {
          setEditingId(null);
          setEditContent('');
        },
      }
    );
  };

  const CommentItem = ({ comment, isReply = false }: { comment: ArticleComment; isReply?: boolean }) => {
    const isEditing = editingId === comment.id;
    const wasEdited = comment.updated_at && comment.updated_at !== comment.created_at;
    return (
    <div className={`flex gap-3 ${isReply ? 'ml-10 mt-3' : ''}`}>
      <Avatar className="w-8 h-8 shrink-0">
        <AvatarImage src={comment.author_avatar} />
        <AvatarFallback className="text-xs bg-muted text-muted-foreground">
          {comment.author_name?.charAt(0) || '?'}
        </AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0">
        <div className="bg-muted/50 rounded-lg p-3">
          <div className="flex items-center justify-between gap-2 mb-1">
            <span className="text-sm font-medium text-foreground">{comment.author_name}</span>
            <span className="text-xs text-muted-foreground shrink-0">
              {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
              {wasEdited && <span className="ml-1 italic">· edited</span>}
            </span>
          </div>
          {isEditing ? (
            <div className="space-y-2">
              <Textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                className="text-sm min-h-[60px] resize-none"
                rows={2}
                autoFocus
              />
              <div className="flex justify-end gap-2">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => { setEditingId(null); setEditContent(''); }}
                  className="text-xs"
                >
                  <X className="w-3 h-3 mr-1" /> Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={() => handleSaveEdit(comment.id)}
                  disabled={!editContent.trim() || updateComment.isPending}
                  className="bg-[hsl(var(--brand-primary))] hover:bg-[hsl(var(--brand-primary)/0.9)] text-white text-xs"
                >
                  Save
                </Button>
              </div>
            </div>
          ) : (
            <p className="text-sm text-foreground/90 whitespace-pre-wrap break-words">{comment.content}</p>
          )}
        </div>
        {!isEditing && (
        <div className="flex items-center gap-2 mt-1">
          {user && !isReply && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs text-muted-foreground hover:text-foreground"
              onClick={() => setReplyingTo(replyingTo === comment.id ? null : comment.id)}
            >
              <Reply className="w-3 h-3 mr-1" />
              Reply
            </Button>
          )}
          {user?.id === comment.user_id && (
            <>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-xs text-muted-foreground hover:text-foreground"
                onClick={() => startEdit(comment)}
              >
                <Pencil className="w-3 h-3 mr-1" />
                Edit
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-xs text-muted-foreground hover:text-destructive"
                onClick={() => handleDelete(comment.id)}
              >
                <Trash2 className="w-3 h-3 mr-1" />
                Delete
              </Button>
            </>
          )}
        </div>
        )}

        {/* Reply input */}
        {replyingTo === comment.id && (
          <div className="mt-2 flex gap-2">
            <Textarea
              placeholder={`Reply to ${comment.author_name}...`}
              value={replyContent}
              onChange={(e) => setReplyContent(e.target.value)}
              className="text-sm min-h-[60px] resize-none"
              rows={2}
            />
            <div className="flex flex-col gap-1">
              <Button
                size="sm"
                onClick={() => handleReply(comment.id)}
                disabled={!replyContent.trim() || createComment.isPending}
                className="bg-[hsl(var(--brand-primary))] hover:bg-[hsl(var(--brand-primary)/0.9)] text-white"
              >
                <Send className="w-3 h-3" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => { setReplyingTo(null); setReplyContent(''); }}
                className="text-xs"
              >
                Cancel
              </Button>
            </div>
          </div>
        )}

        {/* Replies */}
        {replies.get(comment.id)?.map((reply) => (
          <CommentItem key={reply.id} comment={reply} isReply />
        ))}
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
        <MessageCircle className="w-5 h-5" />
        Comments ({comments.length})
      </h3>

      {/* New Comment Input */}
      {user ? (
        <div className="flex gap-3">
          <Avatar className="w-8 h-8 shrink-0">
            <AvatarFallback className="bg-[hsl(var(--brand-primary)/0.1)] text-[hsl(var(--brand-primary))] text-xs">
              {user.email?.charAt(0).toUpperCase() || 'U'}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <Textarea
              placeholder="Share your thoughts..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              className="text-sm min-h-[80px] resize-none mb-2"
              rows={3}
            />
            <div className="flex justify-end">
              <Button
                size="sm"
                onClick={handleSubmit}
                disabled={!newComment.trim() || createComment.isPending}
                className="bg-[hsl(var(--brand-primary))] hover:bg-[hsl(var(--brand-primary)/0.9)] text-white"
              >
                <Send className="w-4 h-4 mr-2" />
                Comment
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <p className="text-sm text-muted-foreground text-center py-4 bg-muted/30 rounded-lg">
          Sign in to join the discussion
        </p>
      )}

      {/* Comments List */}
      {isLoading ? (
        <div className="text-center py-6 text-muted-foreground text-sm">Loading comments...</div>
      ) : topLevel.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <MessageCircle className="w-10 h-10 mx-auto mb-2 opacity-40" />
          <p className="text-sm">No comments yet. Be the first to share your thoughts!</p>
        </div>
      ) : (
        <div className="space-y-5">
          {topLevel.map((comment) => (
            <CommentItem key={comment.id} comment={comment} />
          ))}
        </div>
      )}
    </div>
  );
};

export default ArticleComments;
