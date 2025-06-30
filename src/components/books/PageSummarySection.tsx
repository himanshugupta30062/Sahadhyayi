
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, FileText } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface PageSummarySectionProps {
  bookId: string;
  bookTitle: string;
}

const PageSummarySection = ({ bookId, bookTitle }: PageSummarySectionProps) => {
  const [startPage, setStartPage] = useState('');
  const [endPage, setEndPage] = useState('');
  const [summary, setSummary] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleGenerateSummary = async () => {
    if (!startPage || !endPage) {
      alert('Please enter both start and end page numbers');
      return;
    }

    if (parseInt(startPage) > parseInt(endPage)) {
      alert('Start page must be less than or equal to end page');
      return;
    }

    setIsLoading(true);
    try {
      const response = await supabase.functions.invoke('generate-summary', {
        body: { 
          content: `Generate a summary for pages ${startPage} to ${endPage} of the book "${bookTitle}". This is a page range summary request.`,
          type: 'chapter'
        }
      });
      
      if (response.error) {
        throw new Error(response.error.message);
      }
      
      setSummary(response.data.summary);
    } catch (error) {
      console.error('Error generating summary:', error);
      alert('Failed to generate summary. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="w-5 h-5" />
          Page Range Summary
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-4 items-end">
          <div className="flex-1">
            <label htmlFor="startPage" className="block text-sm font-medium mb-1">
              Start Page
            </label>
            <Input
              id="startPage"
              type="number"
              value={startPage}
              onChange={(e) => setStartPage(e.target.value)}
              placeholder="e.g., 1"
              min="1"
            />
          </div>
          <div className="flex-1">
            <label htmlFor="endPage" className="block text-sm font-medium mb-1">
              End Page
            </label>
            <Input
              id="endPage"
              type="number"
              value={endPage}
              onChange={(e) => setEndPage(e.target.value)}
              placeholder="e.g., 10"
              min="1"
            />
          </div>
          <Button 
            onClick={handleGenerateSummary}
            disabled={isLoading || !startPage || !endPage}
            className="bg-orange-600 hover:bg-orange-700"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Generating...
              </>
            ) : (
              'Generate Summary'
            )}
          </Button>
        </div>
        
        {summary && (
          <div className="mt-4 p-4 bg-gray-50 rounded-lg">
            <h4 className="font-semibold mb-2">
              Summary (Pages {startPage}-{endPage})
            </h4>
            <p className="text-gray-700 leading-relaxed">{summary}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default PageSummarySection;
