import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import SEO from '@/components/SEO';
import { useToast } from '@/hooks/use-toast';
import { useQuotes, Quote } from '@/contexts/QuotesContext';


const QuotesPage = () => {
  const { quotes, addQuote } = useQuotes();
  const { toast } = useToast();
  const [quoteText, setQuoteText] = useState('');
  const [quoteSource, setQuoteSource] = useState('');

  const handleAddQuote = () => {
    if (!quoteText) return;
    addQuote(quoteText, quoteSource);
    setQuoteText('');
    setQuoteSource('');
  };

  const shareQuote = (text: string) => {
    toast({
      title: 'Quote Shared',
      description: 'Your quote was shared to the community feed!',
    });
  };

  return (
    <>
      <SEO
        title="Save Favorite Quotes - Sahadhyayi"
        description="Store inspiring book quotes, add sources, and revisit them anytime in your personal collection."
        canonical="https://sahadhyayi.com/quotes"
        url="https://sahadhyayi.com/quotes"
      />
      <div className="min-h-screen py-8 px-4">
      <div className="max-w-xl mx-auto space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base sm:text-lg">Save a Quote</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Textarea
              placeholder="Favorite quote"
              value={quoteText}
              onChange={(e) => setQuoteText(e.target.value)}
            />
            <Input
              placeholder="Book or author"
              value={quoteSource}
              onChange={(e) => setQuoteSource(e.target.value)}
            />
            <Button onClick={handleAddQuote} className="w-full">Add Quote</Button>
          </CardContent>
        </Card>
        {quotes.map((q) => (
          <Card key={q.id}>
            <CardContent className="space-y-2">
              <div>
                <p className="text-sm text-gray-700">"{q.text}"</p>
                {q.source && <p className="text-xs text-gray-500">— {q.source}</p>}
              </div>
              <Button size="sm" variant="outline" onClick={() => shareQuote(q.text)}>
                Share Quote
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
    </>
  );
};

export default QuotesPage;
