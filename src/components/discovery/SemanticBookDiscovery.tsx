import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  BookOpen,
  Compass,
  Heart,
  History,
  Lightbulb,
  LoaderCircle,
  Plus,
  Rocket,
  Search,
  Sparkles,
  Zap,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client-universal';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { useAddToBookshelf } from '@/hooks/useUserBookshelf';
import { useAuth } from '@/contexts/authHelpers';
import { useToast } from '@/hooks/use-toast';

interface RecommendedBook {
  id: string;
  title: string;
  author?: string | null;
  genre?: string | null;
  cover_image_url?: string | null;
  description?: string | null;
  readingUrl?: string | null;
  isDirectPdf?: boolean;
}

const QUICK_MOODS = [
  { label: 'Finding Purpose & Growth', icon: Compass, query: 'Books about finding purpose, inner resilience, and self-discovery' },
  { label: 'Heartbreak & Healing', icon: Heart, query: 'Deep emotional books dealing with love, loss, grief, and emotional healing' },
  { label: 'Historical Epics & Freedom', icon: History, query: 'Rich historical stories, freedom struggles, and classic societal revolutions' },
  { label: 'Philosophy & Big Ideas', icon: Lightbulb, query: 'Philosophical books on consciousness, meaning of life, and profound questions' },
  { label: 'Hindi Classics & Realism', icon: Sparkles, query: 'Famous Hindi literature, social realism, Munshi Premchand, and classic Hindi stories' },
  { label: 'Sci-Fi & Future Worlds', icon: Rocket, query: 'Visionary science fiction exploring space, time travel, and future societies' },
];

export default function SemanticBookDiscovery() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<RecommendedBook[]>([]);
  const [explanation, setExplanation] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searched, setSearched] = useState(false);
  const [error, setError] = useState('');

  const { user } = useAuth();
  const addToShelf = useAddToBookshelf();
  const { toast } = useToast();

  const handleSearch = async (textToSearch = query) => {
    const trimmed = textToSearch.trim();
    if (!trimmed || isSearching) return;

    setQuery(trimmed);
    setIsSearching(true);
    setError('');
    setSearched(true);

    try {
      const prompt = `SEMANTIC_BOOK_DISCOVERY: The reader is searching for books matching this mood, concept, or theme: "${trimmed}". 
Recommend the best matching books from the Sahadhyayi catalog. 
Give a warm 2-3 sentence overview explaining how these works connect to the reader's intent.`;

      const { data, error: invokeError } = await supabase.functions.invoke('book-expert-gemini', {
        body: { text: prompt },
      });

      if (invokeError) throw invokeError;
      if (!data) throw new Error('No response from AI discovery');

      setExplanation(typeof data.reply === 'string' ? data.reply : '');
      if (Array.isArray(data.books)) {
        setResults(data.books);
      } else {
        setResults([]);
      }
    } catch {
      setError('Semantic search is temporarily unavailable. Please try again.');
    } finally {
      setIsSearching(false);
    }
  };

  const handleAddToShelf = (bookId: string, bookTitle: string) => {
    if (!user) {
      toast({
        title: 'Sign in required',
        description: 'Sign in to save books to your personal bookshelf.',
      });
      return;
    }
    addToShelf.mutate(
      { bookId, status: 'want_to_read' },
      {
        onSuccess: () => {
          toast({
            title: 'Added to Bookshelf',
            description: `"${bookTitle}" added to your Want to Read shelf.`,
          });
        },
      }
    );
  };

  return (
    <div className="space-y-6">
      {/* Search Header Banner */}
      <div className="rounded-2xl border border-indigo-200/80 bg-gradient-to-br from-indigo-50/80 via-white to-purple-50/70 p-5 shadow-xs sm:p-7 dark:border-indigo-900/40 dark:from-indigo-950/30 dark:via-background dark:to-purple-950/20">
        <div className="max-w-3xl space-y-3">
          <div className="inline-flex items-center gap-2 rounded-full border border-indigo-300 bg-white/90 px-3 py-1 text-xs font-semibold text-indigo-700 shadow-xs dark:border-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300">
            <Zap className="h-3.5 w-3.5 text-amber-500" />
            AI Semantic Discovery & Mood Finder
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Search by meaning, mood, or idea
          </h2>
          <p className="text-sm leading-relaxed text-muted-foreground sm:text-base">
            Don't know the exact title or author? Describe what you want to feel, learn, or explore in English or Hindi, and our AI will match titles by conceptual meaning.
          </p>

          {/* Search Input Bar */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              void handleSearch();
            }}
            className="flex flex-col gap-2 pt-2 sm:flex-row sm:items-center"
          >
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder='e.g. "Books about resilience and starting over", or "प्रेमचंद की कहानियां"'
                className="h-11 rounded-xl border-border/80 bg-white pl-10 pr-4 text-sm shadow-xs focus-visible:ring-indigo-500 dark:bg-card/90"
              />
            </div>
            <Button
              type="submit"
              disabled={!query.trim() || isSearching}
              className="h-11 rounded-xl bg-indigo-600 px-6 font-semibold text-white shadow-xs hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600"
            >
              {isSearching ? <LoaderCircle className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
              Discover with AI
            </Button>
          </form>

          {/* Quick Mood Chips */}
          <div className="space-y-1.5 pt-2">
            <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Or explore popular moods:
            </span>
            <div className="flex flex-wrap gap-1.5">
              {QUICK_MOODS.map((mood) => {
                const Icon = mood.icon;
                return (
                  <button
                    key={mood.label}
                    type="button"
                    onClick={() => void handleSearch(mood.query)}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-border/80 bg-white/80 px-2.5 py-1 text-xs font-medium text-foreground transition-colors hover:border-indigo-300 hover:bg-indigo-50/60 dark:bg-card/70 dark:hover:border-indigo-700 dark:hover:bg-indigo-950/40"
                  >
                    <Icon className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400" />
                    <span>{mood.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Error state */}
      {error && (
        <div role="alert" className="rounded-xl border border-destructive/20 bg-destructive/10 p-4 text-sm text-destructive">
          {error}
        </div>
      )}

      {/* AI Explanation of recommendations */}
      {explanation && (
        <div className="rounded-xl border border-indigo-200/70 bg-indigo-50/40 p-4 shadow-xs sm:p-5 dark:border-indigo-900/40 dark:bg-indigo-950/20">
          <div className="mb-2 flex items-center gap-2 text-sm font-bold text-indigo-700 dark:text-indigo-300">
            <Sparkles className="h-4 w-4" />
            AI Curator's Note
          </div>
          <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground/90">{explanation}</p>
        </div>
      )}

      {/* Books Grid */}
      {results.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-bold text-foreground">
            Matched Titles ({results.length})
          </h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {results.map((book) => (
              <Card
                key={book.id}
                className="group flex flex-col justify-between overflow-hidden border-border/80 bg-card transition-all hover:border-indigo-300 hover:shadow-md dark:hover:border-indigo-800"
              >
                <CardContent className="flex flex-col gap-3 p-4">
                  <div className="flex gap-3">
                    {book.cover_image_url ? (
                      <img
                        src={book.cover_image_url}
                        alt={book.title}
                        className="h-24 w-16 shrink-0 rounded-md object-cover shadow-xs"
                        loading="lazy"
                      />
                    ) : (
                      <div className="flex h-24 w-16 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
                        <BookOpen className="h-6 w-6" />
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <Link
                        to={`/book/${book.id}`}
                        className="line-clamp-2 text-sm font-bold text-foreground transition-colors hover:text-indigo-600 dark:hover:text-indigo-400"
                      >
                        {book.title}
                      </Link>
                      {book.author && (
                        <p className="line-clamp-1 text-xs text-muted-foreground">{book.author}</p>
                      )}
                      {book.genre && (
                        <Badge variant="outline" className="mt-2 text-[10px] font-medium">
                          {book.genre}
                        </Badge>
                      )}
                    </div>
                  </div>

                  {book.description && (
                    <p className="line-clamp-3 text-xs leading-relaxed text-muted-foreground">
                      {book.description}
                    </p>
                  )}

                  <div className="flex items-center gap-2 pt-2">
                    <Button asChild size="sm" variant="default" className="flex-1 bg-indigo-600 text-xs text-white hover:bg-indigo-700">
                      <Link to={`/book/${book.id}`}>View Book</Link>
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleAddToShelf(book.id, book.title)}
                      className="px-2.5"
                      title="Add to Bookshelf"
                    >
                      <Plus className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Empty State after search */}
      {searched && !isSearching && results.length === 0 && !error && (
        <div className="rounded-xl border border-dashed border-border py-12 text-center">
          <BookOpen className="mx-auto h-8 w-8 text-muted-foreground" />
          <h4 className="mt-2 text-sm font-semibold text-foreground">No catalog matches found</h4>
          <p className="mt-1 text-xs text-muted-foreground">
            Try broadening your description or selecting one of the popular moods above.
          </p>
        </div>
      )}
    </div>
  );
}

