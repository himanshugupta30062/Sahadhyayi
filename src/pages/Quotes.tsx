import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

interface Quote {
  id: number;
  text: string;
  source: string;
}

const QuotesPage = () => {
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [quoteText, setQuoteText] = useState('');
  const [quoteSource, setQuoteSource] = useState('');

  const addQuote = () => {
    if (!quoteText) return;
    setQuotes((prev) => [
      ...prev,
      { id: Date.now(), text: quoteText, source: quoteSource }
    ]);
    setQuoteText('');
    setQuoteSource('');
  };

  return (
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
            <Button onClick={addQuote} className="w-full">Add Quote</Button>
          </CardContent>
        </Card>
        {quotes.map((q) => (
          <Card key={q.id}>
            <CardContent className="space-y-1">
              <p className="text-sm text-gray-700">"{q.text}"</p>
              {q.source && <p className="text-xs text-gray-500">— {q.source}</p>}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default QuotesPage;
