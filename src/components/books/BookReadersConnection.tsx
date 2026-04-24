import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import SignInLink from '@/components/SignInLink';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Users, MessageCircle, Heart, Share, Send, User, Loader2, Pencil, Trash2, X, Check } from 'lucide-react';
import { useAuth } from '@/contexts/authHelpers';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { formatDistanceToNow } from 'date-fns';

interface BookReadersConnectionProps {
  bookId: string;
  bookTitle: string;
}

type CommentKind = 'comment' | 'quote';

interface CommentPayload {
  bookId: string;
  kind: CommentKind;
  text: string;
}

interface FeedbackRow {
  id: string;
  user_id: string;
  feedback_type: string;
  comment: string | null;
  created_at: string;
}

interface ReaderComment {
  id: string;
  user_id: string;
  kind: CommentKind;
  text: string;
  created_at: string;
  authorName: string;
  likes: number;
  isLiked: boolean;
}

const FEEDBACK_TYPE = 'reader_comment';

const parsePayload = (raw: string | null): CommentPayload | null => {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as CommentPayload;
    if (parsed && parsed.bookId && parsed.text) return parsed;
  } catch {
    /* ignore */
  }
  return null;
};

const BookReadersConnection = ({ bookId, bookTitle }: BookReadersConnectionProps) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [newComment, setNewComment] = useState('');
  const [commentType, setCommentType] = useState<CommentKind>('comment');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');

  const queryKey = ['book_reader_comments', bookId];

  const { data: comments = [], isLoading } = useQuery({
    queryKey,
    queryFn: async (): Promise<ReaderComment[]> => {
      const { data, error } = await supabase
        .from('content_feedback')
        .select('id, user_id, feedback_type, comment, created_at')
        .eq('feedback_type', FEEDBACK_TYPE)
        .order('created_at', { ascending: false })
        .limit(500);
      if (error) throw error;

      const matching = (data as FeedbackRow[])
        .map((row) => ({ row, payload: parsePayload(row.comment) }))
        .filter((x) => x.payload && x.payload.bookId === bookId);

      if (matching.length === 0) return [];

      const userIds = [...new Set(matching.map((m) => m.row.user_id))];
      const ids = matching.map((m) => m.row.id);

      const [profilesRes, votesRes] = await Promise.all([
        supabase.from('profiles').select('id, full_name, username').in('id', userIds),
        supabase.from('content_votes').select('content_id, user_id, vote_type').in('content_id', ids),
      ]);

      const profiles = profilesRes.data || [];
      const votes = votesRes.data || [];

      return matching.map(({ row, payload }) => {
        const profile = profiles.find((p) => p.id === row.user_id);
        const rowVotes = votes.filter((v) => v.content_id === row.id);
        const likes = rowVotes.filter((v) => v.vote_type === 'like').length;
        const isLiked = !!user && rowVotes.some((v) => v.user_id === user.id && v.vote_type === 'like');
        return {
          id: row.id,
          user_id: row.user_id,
          kind: payload!.kind || 'comment',
          text: payload!.text,
          created_at: row.created_at,
          authorName: profile?.full_name || profile?.username || 'Reader',
          likes,
          isLiked,
        };
      });
    },
  });

  const submitMutation = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error('Not authenticated');
      const payload: CommentPayload = { bookId, kind: commentType, text: newComment.trim() };
      const { error } = await supabase.from('content_feedback').insert({
        user_id: user.id,
        feedback_type: FEEDBACK_TYPE,
        comment: JSON.stringify(payload),
      });
      if (error) throw error;
    },
    onSuccess: () => {
      setNewComment('');
      toast({ title: commentType === 'comment' ? 'Comment posted' : 'Quote posted' });
      queryClient.invalidateQueries({ queryKey });
    },
    onError: (err: Error) => {
      toast({ title: 'Could not post', description: err.message, variant: 'destructive' });
    },
  });

  const likeMutation = useMutation({
    mutationFn: async ({ commentId, isLiked }: { commentId: string; isLiked: boolean }) => {
      if (!user) throw new Error('Not authenticated');
      if (isLiked) {
        const { error } = await supabase
          .from('content_votes')
          .delete()
          .eq('content_id', commentId)
          .eq('user_id', user.id)
          .eq('vote_type', 'like');
        if (error) throw error;
      } else {
        const { error } = await supabase.from('content_votes').insert({
          user_id: user.id,
          content_id: commentId,
          vote_type: 'like',
        });
        if (error) throw error;
      }
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey }),
    onError: (err: Error) => toast({ title: 'Like failed', description: err.message, variant: 'destructive' }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('content_feedback').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: 'Deleted' });
      queryClient.invalidateQueries({ queryKey });
    },
    onError: (err: Error) => toast({ title: 'Delete failed', description: err.message, variant: 'destructive' }),
  });

  const editMutation = useMutation({
    mutationFn: async ({ id, current }: { id: string; current: ReaderComment }) => {
      const payload: CommentPayload = { bookId, kind: current.kind, text: editText.trim() };
      const { error } = await supabase
        .from('content_feedback')
        .update({ comment: JSON.stringify(payload) })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      setEditingId(null);
      toast({ title: 'Updated' });
      queryClient.invalidateQueries({ queryKey });
    },
    onError: (err: Error) => toast({ title: 'Update failed', description: err.message, variant: 'destructive' }),
  });

  const startEdit = (c: ReaderComment) => {
    setEditingId(c.id);
    setEditText(c.text);
  };

  const handleSubmit = () => {
    if (!newComment.trim() || !user) return;
    submitMutation.mutate();
  };

  const readersCount = comments.length;

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
            <MessageCircle className="w-4 h-4 mr-1" />
            {readersCount} {readersCount === 1 ? 'post' : 'posts'}
          </Badge>
        </div>
      </div>

      {/* Post New Comment/Quote */}
      {user ? (
        <div className="bg-white/80 backdrop-blur-sm rounded-xl p-6 border border-blue-200 shadow-sm">
          <div className="space-y-4">
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

            <Textarea
              placeholder={
                commentType === 'comment'
                  ? 'Share your thoughts about this book...'
                  : 'Share a memorable quote from the book...'
              }
              value={newComment}
              maxLength={2000}
              onChange={(e) => setNewComment(e.target.value)}
              className="min-h-[100px] resize-none"
            />

            <div className="flex justify-end">
              <Button onClick={handleSubmit} disabled={!newComment.trim() || submitMutation.isPending}>
                {submitMutation.isPending ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Send className="w-4 h-4 mr-2" />
                )}
                Post {commentType === 'comment' ? 'Comment' : 'Quote'}
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white/80 backdrop-blur-sm rounded-xl p-6 border border-blue-200 shadow-sm text-center">
          <p className="text-gray-600 mb-4">Sign in to connect with fellow readers and share your thoughts</p>
          <Button variant="outline" asChild>
            <SignInLink>Sign In</SignInLink>
          </Button>
        </div>
      )}

      <Separator />

      {/* Comments List */}
      <div className="space-y-4">
        <h4 className="text-lg font-semibold text-gray-900">Reader Comments & Quotes</h4>

        {isLoading ? (
          <div className="text-center py-8 text-gray-500">
            <Loader2 className="w-6 h-6 mx-auto mb-2 animate-spin" />
            <p>Loading...</p>
          </div>
        ) : comments.length === 0 ? (
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

                  <div className="flex-1 space-y-2 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-gray-900">{comment.authorName}</span>
                      <Badge variant={comment.kind === 'quote' ? 'secondary' : 'outline'} className="text-xs">
                        {comment.kind === 'quote' ? 'Quote' : 'Comment'}
                      </Badge>
                      <span className="text-xs text-gray-500">
                        {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
                      </span>
                    </div>

                    {editingId === comment.id ? (
                      <Textarea value={editText} onChange={(e) => setEditText(e.target.value)} maxLength={2000} className="min-h-[80px]" />
                    ) : (
                      <p
                        className={`text-gray-700 whitespace-pre-wrap break-words ${
                          comment.kind === 'quote' ? 'italic border-l-2 border-purple-300 pl-3' : ''
                        }`}
                      >
                        {comment.text}
                      </p>
                    )}

                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          disabled={!user || likeMutation.isPending}
                          onClick={() =>
                            likeMutation.mutate({ commentId: comment.id, isLiked: comment.isLiked })
                          }
                          className={`text-xs ${comment.isLiked ? 'text-red-600' : 'text-gray-500'}`}
                        >
                          <Heart className={`w-4 h-4 mr-1 ${comment.isLiked ? 'fill-current' : ''}`} />
                          {comment.likes}
                        </Button>
                      </div>
                      {user?.id === comment.user_id && (
                        <div className="flex items-center gap-1">
                          {editingId === comment.id ? (
                            <>
                              <Button variant="ghost" size="sm" disabled={editMutation.isPending || !editText.trim()} onClick={() => editMutation.mutate({ id: comment.id, current: comment })}>
                                <Check className="w-4 h-4 mr-1" /> Save
                              </Button>
                              <Button variant="ghost" size="sm" onClick={() => setEditingId(null)}>
                                <X className="w-4 h-4 mr-1" /> Cancel
                              </Button>
                            </>
                          ) : (
                            <>
                              <Button variant="ghost" size="sm" onClick={() => startEdit(comment)} className="text-xs text-gray-500">
                                <Pencil className="w-4 h-4 mr-1" /> Edit
                              </Button>
                              <Button variant="ghost" size="sm" disabled={deleteMutation.isPending} onClick={() => { if (confirm('Delete this post?')) deleteMutation.mutate(comment.id); }} className="text-xs text-red-500 hover:text-red-700">
                                <Trash2 className="w-4 h-4 mr-1" /> Delete
                              </Button>
                            </>
                          )}
                        </div>
                      )}
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
