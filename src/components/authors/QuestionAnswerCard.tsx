import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MessageSquare, Clock } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import type { AuthorQuestion } from '@/hooks/useAuthorQuestions';

interface QuestionAnswerCardProps {
  qa: AuthorQuestion;
}

export const QuestionAnswerCard = ({ qa }: QuestionAnswerCardProps) => {
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-primary" />
            <Badge variant="secondary">Q&A</Badge>
          </div>
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Clock className="w-3 h-3" />
            {formatDistanceToNow(new Date(qa.answered_at!), { addSuffix: true })}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <h4 className="font-medium text-foreground mb-2">Question:</h4>
          <p className="text-muted-foreground leading-relaxed">{qa.question}</p>
        </div>
        <div className="border-t pt-4">
          <h4 className="font-medium text-foreground mb-2">Author's Answer:</h4>
          <div className="prose prose-sm dark:prose-invert max-w-none">
            <p className="text-foreground leading-relaxed whitespace-pre-wrap">{qa.answer}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};