
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, FileText, BookOpen } from 'lucide-react';
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
    <Card className="w-full border-0 shadow-none">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-orange-900">
          <FileText className="w-6 h-6 text-orange-600" />
          Page Range Summary
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
          <div className="flex items-center gap-2 mb-3">
            <BookOpen className="w-4 h-4 text-orange-600" />
            <span className="text-sm font-medium text-orange-800">Get Summary of Specific Pages</span>
          </div>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label htmlFor="startPage" className="block text-sm font-medium mb-2 text-gray-700">
                Start Page
              </label>
              <Input
                id="startPage"
                type="number"
                value={startPage}
                onChange={(e) => setStartPage(e.target.value)}
                placeholder="e.g., 1"
                min="1"
                className="h-10"
              />
            </div>
            <div>
              <label htmlFor="endPage" className="block text-sm font-medium mb-2 text-gray-700">
                End Page
              </label>
              <Input
                id="endPage"
                type="number"
                value={endPage}
                onChange={(e) => setEndPage(e.target.value)}
                placeholder="e.g., 10"
                min="1"
                className="h-10"
              />
            </div>
          </div>
          <Button 
            onClick={handleGenerateSummary}
            disabled={isLoading || !startPage || !endPage}
            className="w-full bg-orange-600 hover:bg-orange-700 h-10"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Generating Summary...
              </>
            ) : (
              'Generate Page Summary'
            )}
          </Button>
        </div>
        
        {summary && (
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-6 rounded-lg border border-blue-200">
            <h4 className="font-semibold mb-3 text-blue-900 flex items-center gap-2">
              <FileText className="w-4 h-4" />
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
