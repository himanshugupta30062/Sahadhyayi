
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { BookOpen, PenTool, Vote, Users } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

interface BookContinuationSectionProps {
  bookId: string;
  bookTitle: string;
  genre?: string;
}

const BookContinuationSection = ({ bookId, bookTitle, genre }: BookContinuationSectionProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
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

  const handleSubmitContinuation = async () => {
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
      // Here you would typically save to database
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
    setVoteForSequel(vote);
    toast({
      title: "Vote Recorded!",
      description: `Your vote for ${vote === 'yes' ? 'wanting' : 'not wanting'} a sequel has been recorded.`,
    });
  };

  if (!user || !isFiction) return null;

  return (
    <Card className="w-full border-0 shadow-none">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-orange-900">
          <BookOpen className="w-6 h-6 text-orange-600" />
          Book Continuation
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Sequel Vote Section */}
        <div className="bg-gradient-to-br from-purple-50 to-indigo-50 p-6 rounded-lg border border-purple-200">
          <div className="flex items-center gap-2 mb-4">
            <Vote className="w-4 h-4 text-purple-600" />
            <span className="text-sm font-medium text-purple-800">Should there be a sequel?</span>
          </div>
          
          <p className="text-gray-700 mb-4 text-sm">
            Vote whether you think "{bookTitle}" deserves a continuation or sequel.
          </p>
          
          <div className="flex gap-3 mb-4">
            <Button
              variant={voteForSequel === 'yes' ? 'default' : 'outline'}
              onClick={() => handleVote('yes')}
              className={voteForSequel === 'yes' ? 'bg-green-600 hover:bg-green-700' : 'border-green-300 text-green-700 hover:bg-green-50'}
            >
              Yes, I want a sequel!
            </Button>
            <Button
              variant={voteForSequel === 'no' ? 'default' : 'outline'}
              onClick={() => handleVote('no')}
              className={voteForSequel === 'no' ? 'bg-red-600 hover:bg-red-700' : 'border-red-300 text-red-700 hover:bg-red-50'}
            >
              No, it's perfect as is
            </Button>
          </div>

          {/* Sample voting results */}
          <div className="bg-white p-3 rounded border border-purple-100">
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-green-600" />
                <span className="text-green-700 font-medium">147 want sequel</span>
              </div>
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-red-600" />
                <span className="text-red-700 font-medium">23 satisfied</span>
              </div>
            </div>
          </div>
        </div>

        {/* Write Your Continuation Section */}
        <div className="bg-gradient-to-br from-orange-50 to-amber-50 p-6 rounded-lg border border-orange-200">
          <div className="flex items-center gap-2 mb-4">
            <PenTool className="w-4 h-4 text-orange-600" />
            <span className="text-sm font-medium text-orange-800">Write Your Own Sequel Summary</span>
          </div>
          
          <p className="text-gray-700 mb-4 text-sm">
            Imagine what happens next! Write a brief summary of how you would continue this story.
          </p>
          
          <div className="space-y-4">
            <div>
              <label htmlFor="continuation" className="block text-sm font-medium mb-2 text-gray-700">
                Your Sequel Summary (200-500 words)
              </label>
              <Textarea
                id="continuation"
                value={continuationSummary}
                onChange={(e) => setContinuationSummary(e.target.value)}
                placeholder="What happens next in your version? Describe the main plot points, character developments, and how the story would unfold..."
                className="min-h-[150px]"
              />
              <p className="text-xs text-gray-500 mt-1">
                {continuationSummary.length}/500 characters
              </p>
            </div>

            <Button
              onClick={handleSubmitContinuation}
              disabled={isSubmitting}
              className="w-full bg-orange-600 hover:bg-orange-700"
            >
              {isSubmitting ? (
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
          <h4 className="font-semibold text-gray-800 flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-orange-600" />
            Community Sequel Ideas
          </h4>
          
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-gray-800">StoryTeller99</span>
                <Badge variant="secondary" className="text-xs">Top Rated</Badge>
              </div>
              <span className="text-xs text-gray-500">1 week ago</span>
            </div>
            <p className="text-sm text-gray-700 mb-2">
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
