
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { MessageSquare, ThumbsUp, ThumbsDown, Send, LogIn } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';

interface BookIdeasSectionProps {
  bookId: string;
  bookTitle: string;
}

const BookIdeasSection = ({ bookId, bookTitle }: BookIdeasSectionProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [sectionReference, setSectionReference] = useState('');
  const [comment, setComment] = useState('');
  const [feedbackType, setFeedbackType] = useState<'like' | 'dislike' | 'neutral'>('neutral');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSignInPrompt = () => {
    navigate('/signin');
  };

  const handleSubmitIdea = async () => {
    if (!user) {
      handleSignInPrompt();
      return;
    }

    if (!comment.trim() || !sectionReference.trim()) {
      toast({
        title: "Missing Information",
        description: "Please provide both section reference and your comment.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      // Here you would typically save to database
      // For now, we'll just show a success message
      console.log('Submitting idea:', {
        bookId,
        sectionReference,
        comment,
        feedbackType,
        userId: user?.id
      });

      toast({
        title: "Idea Submitted!",
        description: "Your feedback has been shared with the community.",
      });

      // Reset form
      setSectionReference('');
      setComment('');
      setFeedbackType('neutral');
    } catch (error) {
      console.error('Error submitting idea:', error);
      toast({
        title: "Error",
        description: "Failed to submit your idea. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="w-full border-0 shadow-none">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-orange-900">
          <MessageSquare className="w-6 h-6 text-orange-600" />
          Ideas & Feedback
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-6 rounded-lg border border-blue-200">
          <div className="flex items-center gap-2 mb-4">
            <MessageSquare className="w-4 h-4 text-blue-600" />
            <span className="text-sm font-medium text-blue-800">Share Your Thoughts</span>
          </div>
          
          {!user && (
            <div className="mb-4 p-4 bg-white rounded-lg border border-blue-200">
              <div className="text-center">
                <p className="text-gray-600 mb-3">Sign in to share your thoughts and feedback about this book</p>
                <Button 
                  onClick={handleSignInPrompt}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <LogIn className="w-4 h-4 mr-2" />
                  Sign In to Share Ideas
                </Button>
              </div>
            </div>
          )}
          
          <div className="space-y-4">
            <div>
              <label htmlFor="sectionRef" className="block text-sm font-medium mb-2 text-gray-700">
                Section Reference (e.g., "Chapter 5", "Page 45-50", "The ending")
              </label>
              <Input
                id="sectionRef"
                value={sectionReference}
                onChange={(e) => setSectionReference(e.target.value)}
                placeholder="Which part of the book are you commenting on?"
                className="h-10"
                disabled={!user}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700">
                Your Feedback Type
              </label>
              <div className="flex gap-2 mb-3">
                <Button
                  variant={feedbackType === 'like' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => user ? setFeedbackType('like') : handleSignInPrompt()}
                  className={feedbackType === 'like' ? 'bg-green-600 hover:bg-green-700' : ''}
                  disabled={!user}
                >
                  <ThumbsUp className="w-4 h-4 mr-1" />
                  Like
                </Button>
                <Button
                  variant={feedbackType === 'dislike' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => user ? setFeedbackType('dislike') : handleSignInPrompt()}
                  className={feedbackType === 'dislike' ? 'bg-red-600 hover:bg-red-700' : ''}
                  disabled={!user}
                >
                  <ThumbsDown className="w-4 h-4 mr-1" />
                  Dislike
                </Button>
                <Button
                  variant={feedbackType === 'neutral' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => user ? setFeedbackType('neutral') : handleSignInPrompt()}
                  className={feedbackType === 'neutral' ? 'bg-blue-600 hover:bg-blue-700' : ''}
                  disabled={!user}
                >
                  <MessageSquare className="w-4 h-4 mr-1" />
                  General
                </Button>
              </div>
            </div>

            <div>
              <label htmlFor="comment" className="block text-sm font-medium mb-2 text-gray-700">
                Your Comment
              </label>
              <Textarea
                id="comment"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder={user ? "Share your thoughts, suggestions, or feedback about this section..." : "Sign in to share your thoughts..."}
                className="min-h-[100px]"
                disabled={!user}
              />
            </div>

            <Button
              onClick={handleSubmitIdea}
              disabled={isSubmitting || !user}
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              {!user ? (
                <>
                  <LogIn className="w-4 h-4 mr-2" />
                  Sign In to Share
                </>
              ) : isSubmitting ? (
                'Submitting...'
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  Share Your Idea
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Sample existing ideas - visible to all users */}
        <div className="space-y-3">
          <h4 className="font-semibold text-gray-800 flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-orange-600" />
            Community Ideas
          </h4>
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-gray-800">BookLover23</span>
                <Badge variant="secondary" className="text-xs">Chapter 3</Badge>
                <Badge variant="outline" className="text-xs bg-green-50 text-green-700">
                  <ThumbsUp className="w-3 h-3 mr-1" />
                  Like
                </Badge>
              </div>
              <span className="text-xs text-gray-500">2 days ago</span>
            </div>
            <p className="text-sm text-gray-700">
              "The character development in this chapter was amazing! I loved how the author revealed the protagonist's backstory."
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default BookIdeasSection;
