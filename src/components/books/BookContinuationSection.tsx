
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { BookOpen, PenTool, Vote, Users, LogIn } from 'lucide-react';
import { useAuth } from '@/contexts/authHelpers';
import { useToast } from '@/hooks/use-toast';
import { useNavigate, useLocation } from 'react-router-dom';

interface BookContinuationSectionProps {
  bookId: string;
  bookTitle: string;
  genre?: string;
}

const BookContinuationSection = ({ bookId, bookTitle, genre }: BookContinuationSectionProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const [continuationSummary, setContinuationSummary] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [voteForSequel, setVoteForSequel] = useState<'yes' | 'no' | null>(null);

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

    setIsSubmitting(true);
    try {
      console.log('Submitting continuation:', {
        bookId,
        continuationSummary,
        userId: user?.id
      });

      toast({
        title: "Continuation Submitted!",
        description: "Your sequel summary has been added to the community collection.",
      });

      setContinuationSummary('');
    } catch (error) {
      console.error('Error submitting continuation:', error);
      toast({
        title: "Error",
        description: "Failed to submit your continuation. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVote = (vote: 'yes' | 'no') => {
    if (!user) {
      handleSignInPrompt();
      return;
    }

    setVoteForSequel(vote);
    toast({
      title: "Vote Recorded!",
      description: `Your vote for ${vote === 'yes' ? 'wanting' : 'not wanting'} a sequel has been recorded.`,
    });
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
              disabled={!user}
              size="sm"
            >
              Yes, I want a sequel!
            </Button>
            <Button
              variant={voteForSequel === 'no' ? 'default' : 'outline'}
              onClick={() => handleVote('no')}
              className={`${voteForSequel === 'no' ? 'bg-red-600 hover:bg-red-700' : 'border-red-300 text-red-700 hover:bg-red-50'} w-full sm:w-auto text-sm`}
              disabled={!user}
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
                <span className="text-green-700 font-medium">147 want sequel</span>
              </div>
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-red-600 flex-shrink-0" />
                <span className="text-red-700 font-medium">23 satisfied</span>
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
                Your Sequel Summary (200-500 words)
              </label>
              <Textarea
                id="continuation"
                value={continuationSummary}
                onChange={(e) => setContinuationSummary(e.target.value)}
                placeholder={user ? "What happens next in your version? Describe the main plot points, character developments, and how the story would unfold..." : "Sign in to write your sequel summary..."}
                className="min-h-[120px] sm:min-h-[150px] text-sm sm:text-base"
                disabled={!user}
              />
              <p className="text-xs text-gray-500 mt-1">
                {continuationSummary.length}/500 characters
              </p>
            </div>

            <Button
              onClick={handleSubmitContinuation}
              disabled={isSubmitting || !user}
              className="w-full bg-orange-600 hover:bg-orange-700 text-sm sm:text-base"
              size="sm"
            >
              {!user ? (
                <>
                  <LogIn className="w-4 h-4 mr-2" />
                  Sign In to Publish
                </>
              ) : isSubmitting ? (
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
          
          <div className="bg-white p-3 sm:p-4 rounded-lg border border-gray-200">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between mb-2 gap-2">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm font-medium text-gray-800">StoryTeller99</span>
                <Badge variant="secondary" className="text-xs">Top Rated</Badge>
              </div>
              <span className="text-xs text-gray-500 self-start sm:self-auto">1 week ago</span>
            </div>
            <p className="text-sm text-gray-700 mb-2 leading-relaxed">
              "In my sequel, the protagonist would return to their hometown after 10 years, only to discover that the magical events from the first book have left lasting changes in the community. The story would explore themes of homecoming and responsibility..."
            </p>
            <div className="flex items-center gap-3 text-xs text-gray-500">
              <span>❤️ 23 likes</span>
              <span>💬 5 comments</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default BookContinuationSection;
