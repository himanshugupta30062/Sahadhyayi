
import React, { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { BookOpen, PenTool, Vote, Users, LogIn } from 'lucide-react';
import { useAuth } from '@/contexts/authHelpers';
import { useToast } from '@/hooks/use-toast';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

interface BookContinuationSectionProps {
  bookId: string;
  bookTitle: string;
  genre?: string;
}

interface ContinuationRow {
  id: string;
  user_id: string;
  content: string;
  created_at: string;
}

interface SequelVotePayload {
  bookId: string;
  vote: 'yes' | 'no';
}

interface SequelVoteRow {
  id: string;
  user_id: string;
  comment: string | null;
}

const parseSequelVote = (comment: string | null): SequelVotePayload | null => {
  if (!comment) return null;
  try {
    const payload = JSON.parse(comment) as Partial<SequelVotePayload>;
    if (payload.bookId && (payload.vote === 'yes' || payload.vote === 'no')) {
      return { bookId: payload.bookId, vote: payload.vote };
    }
  } catch {
    return null;
  }
  return null;
};

const BookContinuationSection = ({ bookId, bookTitle, genre }: BookContinuationSectionProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const [continuationSummary, setContinuationSummary] = useState('');

  const continuationQueryKey = ['book-continuations', bookId];
  const sequelVotesQueryKey = ['book-sequel-votes', bookId, user?.id];

  const { data: continuations = [], isLoading: continuationsLoading } = useQuery({
    queryKey: continuationQueryKey,
    queryFn: async (): Promise<ContinuationRow[]> => {
      const { data, error } = await supabase
        .from('user_generated_content')
        .select('id, user_id, content, created_at')
        .eq('book_id', bookId)
        .eq('content_type', 'continuation')
        .eq('is_published', true)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data as ContinuationRow[]) || [];
    },
  });

  const { data: sequelVotes = [] } = useQuery({
    queryKey: sequelVotesQueryKey,
    queryFn: async (): Promise<SequelVoteRow[]> => {
      const { data, error } = await supabase
        .from('content_feedback')
        .select('id, user_id, comment')
        .eq('feedback_type', 'sequel_vote')
        .limit(1000);
      if (error) throw error;
      return ((data as SequelVoteRow[]) || []).filter((row) => parseSequelVote(row.comment)?.bookId === bookId);
    },
  });

  const voteForSequel = useMemo<'yes' | 'no' | null>(() => {
    if (!user) return null;
    const ownVote = sequelVotes.find((row) => row.user_id === user.id);
    return parseSequelVote(ownVote?.comment ?? null)?.vote ?? null;
  }, [sequelVotes, user]);

  const voteCounts = useMemo(() => sequelVotes.reduce(
    (counts, row) => {
      const vote = parseSequelVote(row.comment)?.vote;
      if (vote) counts[vote] += 1;
      return counts;
    },
    { yes: 0, no: 0 },
  ), [sequelVotes]);

  const submitContinuation = useMutation({
    mutationFn: async (content: string) => {
      if (!user) throw new Error('Please sign in to publish.');
      const { error } = await supabase.from('user_generated_content').insert({
        user_id: user.id,
        book_id: bookId,
        title: `Continuation of ${bookTitle}`,
        content,
        content_type: 'continuation',
        is_published: true,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      setContinuationSummary('');
      queryClient.invalidateQueries({ queryKey: continuationQueryKey });
      toast({
        title: 'Continuation submitted!',
        description: 'Your sequel summary has been added to the community collection.',
      });
    },
    onError: (error: Error) => {
      toast({ title: 'Could not publish continuation', description: error.message, variant: 'destructive' });
    },
  });

  const saveVote = useMutation({
    mutationFn: async (vote: 'yes' | 'no') => {
      if (!user) throw new Error('Please sign in to vote.');
      const payload = JSON.stringify({ bookId, vote } satisfies SequelVotePayload);
      const existingVote = sequelVotes.find((row) => row.user_id === user.id);
      if (existingVote) {
        const { error } = await supabase
          .from('content_feedback')
          .update({ comment: payload })
          .eq('id', existingVote.id)
          .eq('user_id', user.id);
        if (error) throw error;
        return;
      }
      const { error } = await supabase.from('content_feedback').insert({
        user_id: user.id,
        feedback_type: 'sequel_vote',
        comment: payload,
      });
      if (error) throw error;
    },
    onSuccess: (_, vote) => {
      queryClient.invalidateQueries({ queryKey: sequelVotesQueryKey });
      toast({
        title: 'Vote recorded!',
        description: `Your vote for ${vote === 'yes' ? 'wanting' : 'not wanting'} a sequel has been saved.`,
      });
    },
    onError: (error: Error) => {
      toast({ title: 'Could not save vote', description: error.message, variant: 'destructive' });
    },
  });

  // Only show for fiction books
  const isFiction = genre?.toLowerCase().includes('fiction') || 
                   genre?.toLowerCase().includes('novel') ||
                   genre?.toLowerCase().includes('fantasy') ||
                   genre?.toLowerCase().includes('sci-fi') ||
                   genre?.toLowerCase().includes('romance') ||
                   genre?.toLowerCase().includes('mystery');

  const handleSignInPrompt = () => {
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('redirectScrollY', String(window.scrollY));
    }
    const redirect = `${location.pathname}${location.search}${location.hash}`;
    navigate(`/signin?redirect=${encodeURIComponent(redirect)}`, { state: { from: redirect } });
  };

  const handleSubmitContinuation = async () => {
    if (!user) {
      handleSignInPrompt();
      return;
    }

    if (!continuationSummary.trim()) {
      toast({
        title: "Missing Content",
        description: "Please write your continuation summary.",
        variant: "destructive",
      });
      return;
    }

    submitContinuation.mutate(continuationSummary.trim());
  };

  const handleVote = (vote: 'yes' | 'no') => {
    if (!user) {
      handleSignInPrompt();
      return;
    }

    saveVote.mutate(vote);
  };

  if (!isFiction) return null;

  return (
    <Card className="w-full border-0 shadow-none">
      <CardHeader className="pb-3 px-4 sm:px-6">
        <CardTitle className="flex items-center gap-2 text-lg sm:text-xl text-orange-900">
          <BookOpen className="w-5 h-5 sm:w-6 sm:h-6 text-orange-600 flex-shrink-0" />
          <span>Book Continuation</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="px-4 sm:px-6 space-y-4 sm:space-y-6">
        {/* Sequel Vote Section */}
        <div className="bg-gradient-to-br from-purple-50 to-indigo-50 p-4 sm:p-6 rounded-lg border border-purple-200">
          <div className="flex items-center gap-2 mb-3 sm:mb-4">
            <Vote className="w-4 h-4 text-purple-600 flex-shrink-0" />
            <span className="text-sm font-medium text-purple-800">Should there be a sequel?</span>
          </div>
          
          <p className="text-gray-700 mb-4 text-sm sm:text-base">
            Vote whether you think "{bookTitle}" deserves a continuation or sequel.
          </p>

          {!user && (
            <div className="mb-4 p-3 sm:p-4 bg-white rounded-lg border border-purple-200">
              <div className="text-center">
                <p className="text-sm sm:text-base text-gray-600 mb-3">Sign in to vote and share your sequel ideas</p>
                <Button 
                  onClick={handleSignInPrompt}
                  className="bg-purple-600 hover:bg-purple-700 w-full sm:w-auto"
                  size="sm"
                >
                  <LogIn className="w-4 h-4 mr-2" />
                  Sign In to Vote
                </Button>
              </div>
            </div>
          )}
          
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 mb-4">
            <Button
              variant={voteForSequel === 'yes' ? 'default' : 'outline'}
              onClick={() => handleVote('yes')}
              className={`${voteForSequel === 'yes' ? 'bg-green-600 hover:bg-green-700' : 'border-green-300 text-green-700 hover:bg-green-50'} w-full sm:w-auto text-sm`}
              disabled={!user || saveVote.isPending}
              size="sm"
            >
              Yes, I want a sequel!
            </Button>
            <Button
              variant={voteForSequel === 'no' ? 'default' : 'outline'}
              onClick={() => handleVote('no')}
              className={`${voteForSequel === 'no' ? 'bg-red-600 hover:bg-red-700' : 'border-red-300 text-red-700 hover:bg-red-50'} w-full sm:w-auto text-sm`}
              disabled={!user || saveVote.isPending}
              size="sm"
            >
              No, it's perfect as is
            </Button>
          </div>

          {/* Voting results */}
          <div className="bg-white p-3 rounded border border-purple-100">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-sm">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-green-600 flex-shrink-0" />
                <span className="text-green-700 font-medium">{voteCounts.yes} want sequel</span>
              </div>
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-red-600 flex-shrink-0" />
                <span className="text-red-700 font-medium">{voteCounts.no} satisfied</span>
              </div>
            </div>
          </div>
        </div>

        {/* Write Your Continuation Section */}
        <div className="bg-gradient-to-br from-orange-50 to-amber-50 p-4 sm:p-6 rounded-lg border border-orange-200">
          <div className="flex items-center gap-2 mb-3 sm:mb-4">
            <PenTool className="w-4 h-4 text-orange-600 flex-shrink-0" />
            <span className="text-sm font-medium text-orange-800">Write Your Own Sequel Summary</span>
          </div>
          
          <p className="text-gray-700 mb-4 text-sm sm:text-base">
            Imagine what happens next! Write a brief summary of how you would continue this story.
          </p>
          
          <div className="space-y-3 sm:space-y-4">
            <div>
              <label htmlFor="continuation" className="block text-sm font-medium mb-2 text-gray-700">
                Your Sequel Summary (up to 500 characters)
              </label>
              <Textarea
                id="continuation"
                value={continuationSummary}
                onChange={(e) => setContinuationSummary(e.target.value)}
                placeholder={user ? "What happens next in your version? Describe the main plot points, character developments, and how the story would unfold..." : "Sign in to write your sequel summary..."}
                className="min-h-[120px] sm:min-h-[150px] text-sm sm:text-base"
                disabled={!user}
                maxLength={500}
              />
              <p className="text-xs text-gray-500 mt-1">
                {continuationSummary.length}/500 characters
              </p>
            </div>

            <Button
              onClick={handleSubmitContinuation}
              disabled={submitContinuation.isPending || !user}
              className="w-full bg-orange-600 hover:bg-orange-700 text-sm sm:text-base"
              size="sm"
            >
              {!user ? (
                <>
                  <LogIn className="w-4 h-4 mr-2" />
                  Sign In to Publish
                </>
              ) : submitContinuation.isPending ? (
                'Publishing...'
              ) : (
                <>
                  <PenTool className="w-4 h-4 mr-2" />
                  Publish Your Sequel Summary
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Community Continuations */}
        <div className="space-y-3">
          <h4 className="font-semibold text-sm sm:text-base text-gray-800 flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-orange-600 flex-shrink-0" />
            Community Sequel Ideas
          </h4>
          
          {continuationsLoading && <p className="text-sm text-gray-500">Loading sequel ideas…</p>}
          {!continuationsLoading && continuations.length === 0 && (
            <div className="bg-white p-4 rounded-lg border border-gray-200 text-sm text-gray-600">
              No sequel ideas yet. Be the first to publish one.
            </div>
          )}
          {continuations.map((continuation) => (
            <div key={continuation.id} className="bg-white p-3 sm:p-4 rounded-lg border border-gray-200">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between mb-2 gap-2">
                <span className="text-sm font-medium text-gray-800">
                  {continuation.user_id === user?.id ? 'Your sequel idea' : 'Reader sequel idea'}
                </span>
                <span className="text-xs text-gray-500 self-start sm:self-auto">
                  {new Date(continuation.created_at).toLocaleDateString()}
                </span>
              </div>
              <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{continuation.content}</p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default BookContinuationSection;
