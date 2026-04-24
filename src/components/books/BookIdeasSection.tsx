import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import SignInLink from '@/components/SignInLink';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Lightbulb, Bug, ThumbsUp, AlertTriangle, User, Send, Loader2, Pencil, Trash2, X, Check } from 'lucide-react';
import { useAuth } from '@/contexts/authHelpers';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { formatDistanceToNow } from 'date-fns';

interface BookIdeasSectionProps {
  bookId: string;
  bookTitle: string;
}

type FeedbackType = 'idea' | 'issue' | 'improvement';
type Priority = 'low' | 'medium' | 'high';

interface FeedbackPayload {
  bookId: string;
  title: string;
  body: string;
  priority: Priority;
}

interface FeedbackRow {
  id: string;
  user_id: string;
  feedback_type: string;
  comment: string | null;
  created_at: string;
}

interface ParsedFeedback {
  id: string;
  user_id: string;
  type: FeedbackType;
  title: string;
  body: string;
  priority: Priority;
  created_at: string;
  authorName: string;
  upvotes: number;
  isUpvoted: boolean;
}

const parseComment = (raw: string | null): { bookId?: string; title: string; body: string; priority: Priority } => {
  if (!raw) return { title: '(no title)', body: '', priority: 'medium' };
  try {
    const parsed = JSON.parse(raw) as FeedbackPayload;
    if (parsed && typeof parsed === 'object' && 'title' in parsed) {
      return {
        bookId: parsed.bookId,
        title: parsed.title || '(no title)',
        body: parsed.body || '',
        priority: parsed.priority || 'medium',
      };
    }
  } catch {
    // legacy / plain text
  }
  return { title: '(no title)', body: raw, priority: 'medium' };
};

const BookIdeasSection = ({ bookId, bookTitle }: BookIdeasSectionProps) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [feedbackType, setFeedbackType] = useState<FeedbackType>('idea');
  const [priority, setPriority] = useState<Priority>('medium');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editBody, setEditBody] = useState('');

  const { data: feedbackList = [], isLoading } = useQuery({
    queryKey: ['book_feedback', bookId],
    queryFn: async (): Promise<ParsedFeedback[]> => {
      // Fetch all feedback (table doesn't track book_id, we filter via JSON payload)
      const { data, error } = await supabase
        .from('content_feedback')
        .select('id, user_id, feedback_type, comment, created_at')
        .order('created_at', { ascending: false })
        .limit(500);
      if (error) throw error;

      const matching = (data as FeedbackRow[]).filter((row) => {
        const parsed = parseComment(row.comment);
        return parsed.bookId === bookId;
      });

      if (matching.length === 0) return [];

      const userIds = [...new Set(matching.map((m) => m.user_id))];
      const ids = matching.map((m) => m.id);

      const [profilesRes, votesRes] = await Promise.all([
        supabase.from('profiles').select('id, full_name, username').in('id', userIds),
        supabase.from('content_votes').select('content_id, user_id, vote_type').in('content_id', ids),
      ]);

      const profiles = profilesRes.data || [];
      const votes = votesRes.data || [];

      return matching.map((row) => {
        const parsed = parseComment(row.comment);
        const profile = profiles.find((p) => p.id === row.user_id);
        const rowVotes = votes.filter((v) => v.content_id === row.id);
        const upvotes = rowVotes.filter((v) => v.vote_type === 'upvote').length;
        const isUpvoted = !!user && rowVotes.some((v) => v.user_id === user.id && v.vote_type === 'upvote');
        return {
          id: row.id,
          user_id: row.user_id,
          type: (row.feedback_type as FeedbackType) || 'idea',
          title: parsed.title,
          body: parsed.body,
          priority: parsed.priority,
          created_at: row.created_at,
          authorName: profile?.full_name || profile?.username || 'Reader',
          upvotes,
          isUpvoted,
        };
      });
    },
  });

  const submitMutation = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error('Not authenticated');
      const payload: FeedbackPayload = {
        bookId,
        title: title.trim(),
        body: content.trim(),
        priority,
      };
      const { error } = await supabase.from('content_feedback').insert({
        user_id: user.id,
        feedback_type: feedbackType,
        comment: JSON.stringify(payload),
      });
      if (error) throw error;
    },
    onSuccess: () => {
      setTitle('');
      setContent('');
      toast({ title: 'Feedback submitted', description: 'Thanks for sharing!' });
      queryClient.invalidateQueries({ queryKey: ['book_feedback', bookId] });
    },
    onError: (err: Error) => {
      toast({ title: 'Could not submit feedback', description: err.message, variant: 'destructive' });
    },
  });

  const upvoteMutation = useMutation({
    mutationFn: async ({ feedbackId, isUpvoted }: { feedbackId: string; isUpvoted: boolean }) => {
      if (!user) throw new Error('Not authenticated');
      if (isUpvoted) {
        const { error } = await supabase
          .from('content_votes')
          .delete()
          .eq('content_id', feedbackId)
          .eq('user_id', user.id)
          .eq('vote_type', 'upvote');
        if (error) throw error;
      } else {
        const { error } = await supabase.from('content_votes').insert({
          user_id: user.id,
          content_id: feedbackId,
          vote_type: 'upvote',
        });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['book_feedback', bookId] });
    },
    onError: (err: Error) => {
      toast({ title: 'Vote failed', description: err.message, variant: 'destructive' });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('content_feedback').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: 'Deleted' });
      queryClient.invalidateQueries({ queryKey: ['book_feedback', bookId] });
    },
    onError: (err: Error) => toast({ title: 'Delete failed', description: err.message, variant: 'destructive' }),
  });

  const editMutation = useMutation({
    mutationFn: async ({ id, current }: { id: string; current: ParsedFeedback }) => {
      const payload: FeedbackPayload = {
        bookId,
        title: editTitle.trim() || current.title,
        body: editBody.trim() || current.body,
        priority: current.priority,
      };
      const { error } = await supabase
        .from('content_feedback')
        .update({ comment: JSON.stringify(payload) })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      setEditingId(null);
      toast({ title: 'Updated' });
      queryClient.invalidateQueries({ queryKey: ['book_feedback', bookId] });
    },
    onError: (err: Error) => toast({ title: 'Update failed', description: err.message, variant: 'destructive' }),
  });

  const startEdit = (f: ParsedFeedback) => {
    setEditingId(f.id);
    setEditTitle(f.title);
    setEditBody(f.body);
  };

  const handleSubmitFeedback = () => {
    if (!title.trim() || !content.trim() || !user) return;
    submitMutation.mutate();
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'idea': return <Lightbulb className="w-4 h-4" />;
      case 'issue': return <Bug className="w-4 h-4" />;
      case 'improvement': return <AlertTriangle className="w-4 h-4" />;
      default: return <Lightbulb className="w-4 h-4" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'idea': return 'bg-green-100 text-green-800';
      case 'issue': return 'bg-red-100 text-red-800';
      case 'improvement': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800 border-red-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <div className="flex items-center justify-center gap-2 mb-2">
          <Lightbulb className="w-6 h-6 text-green-600" />
          <h3 className="text-2xl font-bold text-green-900">Ideas and Feedback</h3>
        </div>
        <p className="text-green-700">Share your ideas or report issues about "{bookTitle}"</p>
      </div>

      {/* Submit Feedback Form */}
      {user ? (
        <Card className="bg-white/80 backdrop-blur-sm border-green-200 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg text-green-900">Share Your Feedback</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="feedback-title">Title</Label>
              <Input
                id="feedback-title"
                placeholder="Brief description of your feedback..."
                value={title}
                maxLength={120}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="feedback-type">Type</Label>
                <Select value={feedbackType} onValueChange={(value: FeedbackType) => setFeedbackType(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="idea">💡 Idea</SelectItem>
                    <SelectItem value="issue">🐛 Issue</SelectItem>
                    <SelectItem value="improvement">⚠️ Improvement</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="feedback-priority">Priority</Label>
                <Select value={priority} onValueChange={(value: Priority) => setPriority(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">🟢 Low</SelectItem>
                    <SelectItem value="medium">🟡 Medium</SelectItem>
                    <SelectItem value="high">🔴 High</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="feedback-content">Details</Label>
              <Textarea
                id="feedback-content"
                placeholder="Provide more details about your feedback..."
                value={content}
                maxLength={2000}
                onChange={(e) => setContent(e.target.value)}
                className="min-h-[120px] resize-none"
              />
            </div>

            <div className="flex justify-end">
              <Button
                onClick={handleSubmitFeedback}
                disabled={!title.trim() || !content.trim() || submitMutation.isPending}
              >
                {submitMutation.isPending ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Send className="w-4 h-4 mr-2" />
                )}
                Submit Feedback
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="bg-white/80 backdrop-blur-sm border-green-200 shadow-sm">
          <CardContent className="p-6 text-center">
            <p className="text-gray-600 mb-4">Sign in to share your ideas and feedback</p>
            <Button variant="outline" asChild>
              <SignInLink>Sign In</SignInLink>
            </Button>
          </CardContent>
        </Card>
      )}

      <Separator />

      {/* Feedback List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="text-lg font-semibold text-gray-900">Community Feedback</h4>
          <Badge variant="outline" className="text-xs">
            {feedbackList.length} {feedbackList.length === 1 ? 'entry' : 'entries'}
          </Badge>
        </div>

        {isLoading ? (
          <div className="text-center py-8 text-gray-500">
            <Loader2 className="w-6 h-6 mx-auto mb-2 animate-spin" />
            <p>Loading feedback...</p>
          </div>
        ) : feedbackList.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Lightbulb className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No feedback yet. Be the first to share your ideas!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {feedbackList.map((feedback) => (
              <Card key={feedback.id} className="bg-white/60 backdrop-blur-sm border-gray-200 hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-2 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <Avatar className="w-6 h-6">
                            <AvatarFallback>
                              <User className="w-3 h-3" />
                            </AvatarFallback>
                          </Avatar>
                          <span className="font-medium text-gray-900">{feedback.authorName}</span>
                          <span className="text-xs text-gray-500">
                            {formatDistanceToNow(new Date(feedback.created_at), { addSuffix: true })}
                          </span>
                        </div>
                        <h5 className="font-semibold text-lg text-gray-900 break-words">{feedback.title}</h5>
                      </div>
                      <div className="flex flex-col gap-1 shrink-0">
                        <Badge className={getTypeColor(feedback.type)}>
                          {getTypeIcon(feedback.type)}
                          <span className="ml-1 capitalize">{feedback.type}</span>
                        </Badge>
                      </div>
                    </div>

                    <Badge variant="outline" className={`${getPriorityColor(feedback.priority)} w-fit`}>
                      {feedback.priority.toUpperCase()} Priority
                    </Badge>

                    <p className="text-gray-700 text-sm leading-relaxed whitespace-pre-wrap break-words">
                      {feedback.body}
                    </p>

                    <div className="flex items-center justify-end pt-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        disabled={!user || upvoteMutation.isPending}
                        onClick={() => upvoteMutation.mutate({ feedbackId: feedback.id, isUpvoted: feedback.isUpvoted })}
                        className={`${feedback.isUpvoted ? 'text-green-600' : 'text-gray-500'}`}
                      >
                        <ThumbsUp className={`w-4 h-4 mr-1 ${feedback.isUpvoted ? 'fill-current' : ''}`} />
                        {feedback.upvotes}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default BookIdeasSection;
