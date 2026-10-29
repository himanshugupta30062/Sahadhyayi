import { ArrowRight, BookOpen, LibraryBig } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import type { Author } from '@/hooks/useAuthors';
import type { Book } from '@/hooks/useLibraryBooks';
import { slugify } from '@/utils/slugify';

interface AuthorDiscoverySectionProps {
  authors: Author[];
  /** Optional exact-name index of books already loaded by the parent page. */
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
  description = 'Follow a writer’s trail from their profile to books already listed in the Sahadhyayi catalogue.',
  limit = 6,
}: AuthorDiscoverySectionProps) => {
  const entries = authors
    .map((author) => ({
      author,
      books: (booksByAuthor?.[authorKey(author.name)] || []).filter((book) => Boolean(book?.id && book?.title?.trim())),
    }))
    .filter(({ author, books }) => (author.books_count || 0) > 0 || books.length > 0)
    .sort((a, b) => {
      const countDifference = (b.author.books_count || b.books.length) - (a.author.books_count || a.books.length);
      return countDifference || a.author.name.localeCompare(b.author.name);
    })
    .slice(0, Math.max(1, limit));

  if (entries.length === 0) return null;

  return (
    <section
      aria-labelledby="author-discovery-title"
      className="my-8 rounded-3xl border border-[#E5DED2] bg-white/90 p-4 shadow-[0_8px_30px_rgba(28,32,29,0.035)] dark:border-[#29332D] dark:bg-[#111614] dark:shadow-none sm:p-6"
    >
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="max-w-2xl">
          <p className="mb-1 text-xs font-semibold uppercase tracking-[0.16em] text-[#98733A] dark:text-[#D5B16D]">
            Author-led discovery
          </p>
          <h2 id="author-discovery-title" className="font-serif text-2xl font-bold tracking-tight text-[#1C201D] dark:text-[#F3F0E7] sm:text-3xl">
            {title}
          </h2>
          <p className="mt-2 text-sm leading-6 text-[#636B65] dark:text-[#A5ADA6]">{description}</p>
        </div>
        <Link
          to="/authors"
          className="inline-flex min-h-10 shrink-0 items-center justify-center gap-2 rounded-xl border border-[#D5CEC2] px-3.5 py-2 text-sm font-semibold text-[#1C442D] transition hover:border-[#1C442D]/40 hover:bg-[#EBF2EC] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1C442D] dark:border-[#34443A] dark:text-[#D5B16D] dark:hover:bg-[#1C3024] dark:focus-visible:ring-[#D5B16D]"
        >
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
            <article
              key={author.id}
              className="flex min-w-0 flex-col rounded-2xl border border-[#E8E1D6] bg-[#FAF7F2] p-4 transition-colors hover:border-[#B68A35]/50 dark:border-[#29332D] dark:bg-[#0B0D0C] dark:hover:border-[#D5B16D]/40"
            >
              <div className="flex min-w-0 items-center gap-3">
                <Avatar className="h-12 w-12 shrink-0 border border-[#DCD5C9] dark:border-[#34443A]">
                  <AvatarImage src={author.profile_image_url || ''} alt={author.name} loading="lazy" />
                  <AvatarFallback className="bg-[#D5B16D] font-semibold text-[#14251B]">{initials}</AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <Link
                    to={profilePath}
                    className="block truncate font-serif text-lg font-bold text-[#1C201D] transition-colors hover:text-[#1C442D] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1C442D] dark:text-[#F3F0E7] dark:hover:text-[#D5B16D] dark:focus-visible:ring-[#D5B16D]"
                  >
                    {author.name}
                  </Link>
                  <p className="mt-0.5 text-xs text-[#737B75] dark:text-[#89938B]">
                    {bookCount.toLocaleString()} {bookCount === 1 ? 'book' : 'books'} in catalogue
                  </p>
                </div>
              </div>

              {author.genres?.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {author.genres.slice(0, 2).map((genre) => (
                    <span key={genre} className="rounded-full border border-[#DCD5C9] bg-white px-2.5 py-1 text-[10px] font-medium text-[#4F5D53] dark:border-[#34443A] dark:bg-[#111614] dark:text-[#B9C9BC]">
                      {genre}
                    </span>
                  ))}
                </div>
              )}

              {selectedBooks.length > 0 ? (
                <div className="mt-4 border-t border-[#E8E1D6] pt-3 dark:border-[#29332D]">
                  <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#737B75] dark:text-[#89938B]">
                    Books in Sahadhyayi
                  </p>
                  <div className="space-y-2">
                    {selectedBooks.map((book) => (
                      <Link
                        key={book.id}
                        to={`/book/${book.id}`}
                        className="flex min-w-0 items-start gap-2 text-sm font-medium leading-5 text-[#1C442D] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1C442D] dark:text-[#D5B16D] dark:focus-visible:ring-[#D5B16D]"
                      >
                        <BookOpen className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                        <span className="line-clamp-2">{book.title}</span>
                      </Link>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="mt-4 flex items-center gap-2 border-t border-[#E8E1D6] pt-3 text-xs text-[#737B75] dark:border-[#29332D] dark:text-[#89938B]">
                  <LibraryBig className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                  Explore this author’s catalogue
                </div>
              )}

              <div className="mt-auto flex flex-wrap items-center gap-x-4 gap-y-2 pt-4 text-xs font-semibold">
                <Link to={profilePath} className="text-[#1C442D] hover:underline dark:text-[#D5B16D]">
                  Author profile <span aria-hidden="true">→</span>
                </Link>
                <Link
                  to={`/library?author=${encodeURIComponent(author.name)}`}
                  className="text-[#636B65] hover:underline dark:text-[#A5ADA6]"
                >
                  All books <span aria-hidden="true">→</span>
                </Link>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
};

export default AuthorDiscoverySection;
