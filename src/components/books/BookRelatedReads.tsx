import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, BookOpen, Sparkles } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { LazyImage } from '@/components/ui/LazyImage';
import { useAllLibraryBooks, type Book } from '@/hooks/useLibraryBooks';

interface BookRelatedReadsProps {
  book: Pick<Book, 'id' | 'title' | 'author' | 'genre' | 'language'>;
}

const normalize = (value?: string | null) =>
  (value || '').trim().toLocaleLowerCase().replace(/[^\p{L}\p{N}]+/gu, ' ');

export default function BookRelatedReads({ book }: BookRelatedReadsProps) {
  const { data: catalog = [], isLoading, isError } = useAllLibraryBooks();

  const relatedBooks = useMemo(() => {
    const author = normalize(book.author);
    const genre = normalize(book.genre);
    const language = normalize(book.language);

    if (!author && !genre) return [];

    const seenTitles = new Set<string>([normalize(book.title)]);
    return (catalog as Book[])
      .filter((candidate) => candidate.id !== book.id)
      .map((candidate) => {
        const sameAuthor = Boolean(author && normalize(candidate.author) === author);
        const sameGenre = Boolean(genre && normalize(candidate.genre) === genre);
        const sameLanguage = Boolean(language && normalize(candidate.language) === language);
        const score = (sameAuthor ? 4 : 0) + (sameGenre ? 2 : 0) + (sameLanguage ? 1 : 0);
        return { ...candidate, sameAuthor, sameGenre, score, normalizedTitle: normalize(candidate.title) };
      })
      .filter((candidate) => candidate.score > 0 && candidate.normalizedTitle && !seenTitles.has(candidate.normalizedTitle))
      .sort((a, b) => b.score - a.score || a.title.localeCompare(b.title))
      .filter((candidate) => {
        if (seenTitles.has(candidate.normalizedTitle)) return false;
        seenTitles.add(candidate.normalizedTitle);
        return true;
      })
      .slice(0, 6);
  }, [book.author, book.genre, book.id, book.language, book.title, catalog]);

  if (isLoading || isError || relatedBooks.length === 0) return null;

  return (
    <section className="book-related-reads my-8" aria-labelledby="book-related-reads-heading">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="mb-1 flex items-center gap-2 text-primary">
            <Sparkles className="h-4 w-4" aria-hidden="true" />
            <span className="text-xs font-semibold uppercase tracking-[.16em]">Continue exploring</span>
          </div>
          <h2 id="book-related-reads-heading" className="font-serif text-2xl font-bold text-foreground">
            More books to explore
          </h2>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
            Picks connected by author or genre, based on the catalogue details available.
          </p>
        </div>
        <Link to="/discovery" className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline">
          Explore all books <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {relatedBooks.map((related) => (
          <Link
            key={related.id}
            to={`/book/${related.id}`}
            className="book-related-read group min-w-0 rounded-xl border border-border bg-card p-2.5 transition-[transform,border-color,box-shadow] duration-200 hover:-translate-y-1 hover:border-primary/40 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            aria-label={`View ${related.title}${related.author ? ` by ${related.author}` : ''}`}
          >
            <div className="book-related-read-cover mb-3 aspect-[3/4] overflow-hidden rounded-lg bg-muted">
              {related.cover_image_url ? (
                <LazyImage src={related.cover_image_url} alt={`Cover of ${related.title}`} className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.04]" />
              ) : (
                <div className="flex h-full flex-col items-center justify-center gap-2 p-3 text-muted-foreground">
                  <BookOpen className="h-8 w-8" aria-hidden="true" />
                  <span className="text-center text-[10px]">Cover unavailable</span>
                </div>
              )}
            </div>
            <div className="mb-2 flex min-h-5 flex-wrap gap-1">
              {related.sameAuthor && <Badge variant="secondary" className="max-w-full text-[10px]">Same author</Badge>}
              {!related.sameAuthor && related.sameGenre && <Badge variant="outline" className="max-w-full text-[10px]">Same genre</Badge>}
              {related.sameAuthor && related.sameGenre && <Badge variant="outline" className="max-w-full text-[10px]">Same genre</Badge>}
            </div>
            <h3 className="line-clamp-2 text-sm font-semibold leading-snug text-foreground group-hover:text-primary">{related.title}</h3>
            {related.author && <p className="mt-1 line-clamp-1 text-xs text-muted-foreground">{related.author}</p>}
          </Link>
        ))}
      </div>
    </section>
  );
}
