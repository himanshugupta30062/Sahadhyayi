import { Link } from 'react-router-dom';
import type { Author } from '@/hooks/useAuthors';
import { slugify } from '@/utils/slugify';

interface AuthorDiscoverySectionProps {
  authors: Author[];
  title?: string;
  description?: string;
  limit?: number;
}

const AuthorDiscoverySection = ({
  authors,
  title = 'Explore authors and their books',
  description = 'Discover writers in our catalogue, then browse their profiles and books.',
  limit = 6,
}: AuthorDiscoverySectionProps) => {
  const entries = authors
    .filter((author) => (author.books_count || 0) > 0)
    .sort((a, b) => (b.books_count || 0) - (a.books_count || 0) || a.name.localeCompare(b.name))
    .slice(0, Math.max(1, limit));

  if (!entries.length) return null;

  return (
    <section aria-labelledby="author-discovery-title" className="my-8 rounded-2xl border border-border bg-card p-4 sm:p-6">
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 id="author-discovery-title" className="font-serif text-2xl font-bold sm:text-3xl">{title}</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">{description}</p>
        </div>
        <Link to="/authors" className="shrink-0 rounded-xl border border-border px-3.5 py-2 text-sm font-semibold hover:bg-muted">All authors →</Link>
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {entries.map((author) => {
          const profilePath = `/authors/${slugify(author.name)}`;
          const initials = author.name.trim().split(/\s+/).map((part) => part[0] || '').slice(0, 2).join('').toUpperCase() || 'A';
          return (
            <article key={author.id} className="flex min-w-0 items-center gap-3 rounded-xl border border-border bg-background p-3">
              {author.profile_image_url ? (
                <img src={author.profile_image_url} alt={author.name} width="44" height="44" loading="lazy" className="h-11 w-11 shrink-0 rounded-full object-cover" />
              ) : (
                <span aria-hidden="true" className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-muted text-sm font-semibold">{initials}</span>
              )}
              <div className="min-w-0 flex-1">
                <Link to={profilePath} className="block truncate font-semibold hover:text-primary hover:underline">{author.name}</Link>
                <p className="text-xs text-muted-foreground">{author.books_count.toLocaleString()} {author.books_count === 1 ? 'book' : 'books'} in catalogue</p>
                <Link to={`/library?author=${encodeURIComponent(author.name)}`} className="mt-1 inline-block text-xs font-semibold text-primary hover:underline">Browse books →</Link>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
};

export default AuthorDiscoverySection;
