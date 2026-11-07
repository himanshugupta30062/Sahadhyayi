import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import SEO from '@/components/SEO';
import { useToast } from '@/hooks/use-toast';
import { useQuotes } from '@/contexts/quotesHelpers';
import { useReaderHighlights, useDeleteReaderHighlight } from '@/hooks/useReaderHighlights';


const QuotesPage = () => {
  const { quotes, addQuote, removeQuote } = useQuotes();
  const { data: highlights = [], isLoading: highlightsLoading } = useReaderHighlights();
  const deleteHighlight = useDeleteReaderHighlight();
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
        <Card>
          <CardHeader><CardTitle className="text-base">My Highlights ({highlights.length})</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {highlightsLoading ? <p className="text-sm text-muted-foreground">Loading highlights…</p> :
              highlights.length === 0 ? <p className="text-sm text-muted-foreground">Highlights you save while reading will appear here.</p> :
              highlights.map(h => <div key={h.id} className="rounded-lg border p-3 space-y-2">
                <p className="text-sm whitespace-pre-wrap">“{h.text}”</p>
                <p className="text-xs text-muted-foreground">Page {h.page} · {h.color}</p>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => window.location.assign(`/reader/${h.book_id}?page=${h.page}`)}>Open in Reader</Button>
                  <Button size="sm" variant="ghost" onClick={() => deleteHighlight.mutate({id:h.id,bookId:h.book_id})} disabled={deleteHighlight.isPending}>Delete</Button>
                </div>
              </div>)}
          </CardContent>
        </Card>
        {quotes.map((q) => (
          <Card key={q.id}>
            <CardContent className="space-y-2">
              <div>
                <p className="text-sm text-gray-700">"{q.text}"</p>
                {q.source && <p className="text-xs text-gray-500">— {q.source}</p>}
                {(q.page || q.location) && <p className="text-xs text-muted-foreground">{q.page ? `Page ${q.page}` : 'Reading location'}{q.location ? ` · ${q.location.slice(0, 28)}` : ''}</p>}
              </div>
              <Button size="sm" variant="ghost" onClick={() => removeQuote(q.id)}>Delete</Button>
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
