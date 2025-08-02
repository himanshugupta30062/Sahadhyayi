import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MessageSquare } from 'lucide-react';
import { useAskQuestion } from '@/hooks/useAuthorQuestions';
import { useAuth } from '@/contexts/AuthContext';

interface AskQuestionFormProps {
  authorId: string;
  authorName: string;
}

export const AskQuestionForm = ({ authorId, authorName }: AskQuestionFormProps) => {
  const [question, setQuestion] = useState('');
  const { user } = useAuth();
  const askQuestionMutation = useAskQuestion();

  if (!user) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-center text-muted-foreground">
            Please sign in to ask questions
          </p>
        </CardContent>
      </Card>
    );
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (question.trim()) {
      askQuestionMutation.mutate({ authorId, question });
      setQuestion('');
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="w-5 h-5" />
          Ask {authorName} a Question
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Textarea
            placeholder="What would you like to ask the author?"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            rows={4}
            maxLength={500}
          />
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">
              {question.length}/500 characters
            </span>
            <Button 
              type="submit" 
              disabled={!question.trim() || askQuestionMutation.isPending}
            >
              {askQuestionMutation.isPending ? 'Submitting...' : 'Ask Question'}
            </Button>
          </div>
        </form>
        <p className="text-xs text-muted-foreground mt-2">
          Your question will be sent to the author. If answered, it will appear in the public Q&A section.
        </p>
      </CardContent>
    </Card>
  );
};