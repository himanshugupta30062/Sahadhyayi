
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronDown, ChevronUp, Sparkles, BookOpen } from 'lucide-react';
import { useCreateReadingSummary } from '@/hooks/useReadingSummaries';
import { toast } from '@/hooks/use-toast';

interface ChapterSummaryCardProps {
  bookId: string;
  chapterNumber: number;
  chapterContent: string;
  existingSummary?: string;
}

const ChapterSummaryCard: React.FC<ChapterSummaryCardProps> = ({
  bookId,
  chapterNumber,
  chapterContent,
  existingSummary
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const createSummary = useCreateReadingSummary();

  const handleGenerateSummary = async () => {
    try {
      await createSummary.mutateAsync({
        bookId,
        chapterNumber,
        content: chapterContent
      });
      toast({
        title: "Summary Generated",
        description: "Your personalized chapter summary has been created!"
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to generate summary. Please try again.",
        variant: "destructive"
      });
    }
  };

  if (!existingSummary && !createSummary.data) {
    return (
      <Card className="mt-6 border-amber-200 bg-amber-50">
        <CardContent className="pt-6">
          <div className="text-center">
            <BookOpen className="w-12 h-12 mx-auto mb-4 text-amber-600 opacity-50" />
            <p className="text-amber-700 mb-4">
              Generate a personalized summary for Chapter {chapterNumber}
            </p>
            <Button 
              onClick={handleGenerateSummary}
              disabled={createSummary.isPending}
              className="bg-amber-600 hover:bg-amber-700"
            >
              <Sparkles className="w-4 h-4 mr-2" />
              {createSummary.isPending ? 'Generating...' : 'Generate Summary'}
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  const summaryText = existingSummary || createSummary.data?.summary_text;

  return (
    <Card className="mt-6 border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between text-amber-900">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-600" />
            Chapter {chapterNumber} Summary
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-amber-700 hover:text-amber-900"
            aria-label={isExpanded ? 'Collapse summary' : 'Expand summary'}
          >
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </Button>
        </CardTitle>
      </CardHeader>
      {isExpanded && (
        <CardContent>
          <div className="prose prose-sm max-w-none text-amber-800">
            {summaryText}
          </div>
        </CardContent>
      )}
    </Card>
  );
};

export default ChapterSummaryCard;
