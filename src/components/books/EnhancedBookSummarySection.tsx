import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, BookOpen, Clock, FileText, Sparkles } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client-universal';

interface EnhancedBookSummarySectionProps {
  bookId: string;
  bookTitle: string;
}

const EnhancedBookSummarySection = ({ bookId, bookTitle }: EnhancedBookSummarySectionProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [summary, setSummary] = useState('');
  const [summaryType, setSummaryType] = useState<'full_book' | 'chapter' | 'page_range'>('full_book');
  const [startPage, setStartPage] = useState('');
  const [endPage, setEndPage] = useState('');
  const [chapterNumber, setChapterNumber] = useState('');
  const [contentIdentifier, setContentIdentifier] = useState('');

  const handleGenerateSummary = async () => {
    const isPageRangeValid = summaryType !== 'page_range' || (startPage && endPage && parseInt(startPage) <= parseInt(endPage));
    const isChapterValid = summaryType !== 'chapter' || chapterNumber;
    
    if (!isPageRangeValid) {
      alert('Please enter valid page range (start page ≤ end page)');
      return;
    }
    
    if (!isChapterValid) {
      alert('Please enter a chapter number');
      return;
    }

    setIsLoading(true);
    try {
      const requestBody = {
        bookId,
        bookTitle,
        summaryType,
        ...(summaryType === 'page_range' && { 
          pageStart: parseInt(startPage), 
          pageEnd: parseInt(endPage) 
        }),
        ...(summaryType === 'chapter' && { 
          chapterNumber: parseInt(chapterNumber) 
        })
      };

      const response = await supabase.functions.invoke('enhanced-book-summary', {
        body: requestBody
      });
      
      if (response.error) {
        throw new Error(response.error.message);
      }
      
      if (response.data?.summary) {
        setSummary(response.data.summary);
        setContentIdentifier(response.data.contentIdentifier || '');
      } else {
        throw new Error('No summary received from the service');
      }
    } catch (error) {
      console.error('Error generating enhanced summary:', error);
      alert('Failed to generate summary. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full border-0 shadow-warm">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-sahadhyayi-warm">
          <Sparkles className="w-6 h-6 text-sahadhyayi-orange" />
          Enhanced Book Summary Generator
          <Badge className="bg-sahadhyayi-orange-light text-sahadhyayi-orange border-sahadhyayi-orange">
            <Clock className="w-3 h-3 mr-1" />
            15 min read
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="bg-gradient-warm p-6 rounded-lg border border-sahadhyayi-amber/20">
          <div className="flex items-center gap-2 mb-4">
            <BookOpen className="w-5 h-5 text-sahadhyayi-orange" />
            <span className="font-medium text-sahadhyayi-warm">Choose Summary Type</span>
          </div>
          
          <Tabs value={summaryType} onValueChange={(value) => setSummaryType(value as any)}>
            <TabsList className="grid w-full grid-cols-3 mb-4">
              <TabsTrigger value="full_book" className="text-xs sm:text-sm">Full Book</TabsTrigger>
              <TabsTrigger value="chapter" className="text-xs sm:text-sm">Chapter</TabsTrigger>
              <TabsTrigger value="page_range" className="text-xs sm:text-sm">Page Range</TabsTrigger>
            </TabsList>
            
            <TabsContent value="full_book" className="space-y-3">
              <p className="text-sm text-sahadhyayi-warm/70">
                Get a comprehensive 15-minute summary of the entire book covering main themes, 
                key insights, and important takeaways.
              </p>
            </TabsContent>
            
            <TabsContent value="chapter" className="space-y-3">
              <div>
                <label htmlFor="chapter" className="block text-sm font-medium mb-2 text-sahadhyayi-warm">
                  Chapter Number
                </label>
                <Input
                  id="chapter"
                  type="number"
                  value={chapterNumber}
                  onChange={(e) => setChapterNumber(e.target.value)}
                  placeholder="e.g., 5"
                  min="1"
                  className="h-10"
                />
              </div>
            </TabsContent>
            
            <TabsContent value="page_range" className="space-y-3">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="startPage" className="block text-sm font-medium mb-2 text-sahadhyayi-warm">
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
                  <label htmlFor="endPage" className="block text-sm font-medium mb-2 text-sahadhyayi-warm">
                    End Page
                  </label>
                  <Input
                    id="endPage"
                    type="number"
                    value={endPage}
                    onChange={(e) => setEndPage(e.target.value)}
                    placeholder="e.g., 50"
                    min="1"
                    className="h-10"
                  />
                </div>
              </div>
            </TabsContent>
          </Tabs>
          
          <Button 
            onClick={handleGenerateSummary}
            disabled={isLoading}
            className="w-full bg-sahadhyayi-orange hover:bg-sahadhyayi-orange/90 h-12 text-white shadow-warm transition-all duration-200"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Generating Enhanced Summary...
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5 mr-2" />
                Generate 15-Minute Summary
              </>
            )}
          </Button>
        </div>
        
        {summary && (
          <div className="bg-gradient-to-br from-sahadhyayi-warm-light to-sahadhyayi-amber-light p-6 rounded-lg border border-sahadhyayi-amber/30 shadow-soft">
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-semibold text-sahadhyayi-warm flex items-center gap-2">
                <FileText className="w-5 h-5 text-sahadhyayi-orange" />
                Enhanced Summary: {contentIdentifier}
              </h4>
              <Badge className="bg-sahadhyayi-orange-light text-sahadhyayi-orange border-sahadhyayi-orange">
                <Clock className="w-3 h-3 mr-1" />
                ~15 min read
              </Badge>
            </div>
            <div className="prose prose-sm max-w-none text-sahadhyayi-warm leading-relaxed whitespace-pre-wrap">
              {summary}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default EnhancedBookSummarySection;