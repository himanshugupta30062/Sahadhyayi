import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { Author } from '@/hooks/useAuthors';
import type { Book } from '@/hooks/useLibraryBooks';
import { slugify } from '@/utils/slugify';

interface AuthorDiscoverySectionProps {
  authors: Author[];
  booksByAuthor?: Record<string, Book[]>;
  title?: string;
  description?: string;
  limit?: number;
}

const authorKey = (name?: string | null) => (name || '').trim().toLocaleLowerCase();

const AuthorDiscoverySection = ({
  authors,
  booksByAuthor,
  title = 'Explore authors and their books',
  description = 'Follow a writer from their profile to books already listed in the Sahadhyayi catalogue.',
  limit = 6,
}: AuthorDiscoverySectionProps) => {
  const entries = authors
    .map((author) => ({
      author,
      books: (booksByAuthor?.[authorKey(author.name)] || []).filter((book) => Boolean(book?.id && book?.title?.trim())),
    }))
    .filter(({ author, books }) => (author.books_count || 0) > 0 || books.length > 0)
    .sort((a, b) => (b.author.books_count || b.books.length) - (a.author.books_count || a.books.length) || a.author.name.localeCompare(b.author.name))
    .slice(0, Math.max(1, limit));

  if (!entries.length) return null;

  return (
    <section aria-labelledby="author-discovery-title" className="my-8 rounded-2xl border border-border bg-card p-4 sm:p-6">
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="max-w-2xl">
          <p className="mb-1 text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">Author-led discovery</p>
          <h2 id="author-discovery-title" className="font-serif text-2xl font-bold sm:text-3xl">{title}</h2>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">{description}</p>
        </div>
        <Link to="/authors" className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-border px-3.5 py-2 text-sm font-semibold hover:bg-muted">
          All authors <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {entries.map(({ author, books }) => {
          const initials = author.name.trim().split(/\s+/).map((part) => part[0] || '').slice(0, 2).join('').toUpperCase() || 'A';
          const profilePath = `/authors/${slugify(author.name)}`;
          const selectedBooks = books.slice(0, 2);
          const bookCount = Math.max(author.books_count || 0, books.length);

          return (
            <article key={author.id} className="flex min-w-0 flex-col rounded-xl border border-border bg-background p-4">
              <div className="flex min-w-0 items-center gap-3">
                {author.profile_image_url ? (
                  <img src={author.profile_image_url} alt={author.name} loading="lazy" className="h-12 w-12 shrink-0 rounded-full border border-border object-cover" />
                ) : (
                  <span aria-hidden="true" className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-muted text-sm font-semibold">{initials}</span>
                )}
                <div className="min-w-0 flex-1">
                  <Link to={profilePath} className="block truncate font-serif text-lg font-bold hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">{author.name}</Link>
                  <p className="mt-0.5 text-xs text-muted-foreground">{bookCount.toLocaleString()} {bookCount === 1 ? 'book' : 'books'} in catalogue</p>
                </div>
              </div>

              {author.genres?.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {author.genres.slice(0, 2).map((genre) => <span key={genre} className="rounded-full border border-border px-2.5 py-1 text-[10px] text-muted-foreground">{genre}</span>)}
                </div>
              )}

              {selectedBooks.length > 0 && (
                <div className="mt-4 border-t border-border pt-3">
                  <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">Books in Sahadhyayi</p>
                  {selectedBooks.map((book) => (
                    <Link key={book.id} to={`/book/${book.id}`} className="mb-2 block line-clamp-2 text-sm font-medium leading-5 text-primary hover:underline">{book.title}</Link>
                  ))}
                </div>
              )}

              <div className="mt-auto flex flex-wrap gap-x-4 gap-y-2 pt-4 text-xs font-semibold">
                <Link to={profilePath} className="text-primary hover:underline">Author profile →</Link>
                <Link to={`/library?author=${encodeURIComponent(author.name)}`} className="text-muted-foreground hover:underline">All books →</Link>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
};

export default AuthorDiscoverySection;
