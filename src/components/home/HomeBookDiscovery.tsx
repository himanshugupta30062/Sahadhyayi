import React, { useState, useMemo, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, ArrowRight, Compass, Pause, Play } from 'lucide-react';
import { useLibraryBooks, useGenres, type Book } from '@/hooks/useLibraryBooks';
import { EnhancedLazyImage } from '@/components/ui/EnhancedLazyImage';
import { Button } from '@/components/ui/button';

/**
 * Only accept a usable HTTP(S) cover URL saved on the catalog record.
 * The homepage intentionally doesn't create or substitute generated book art.
 */
function getDatabaseCoverUrl(rawUrl?: string | null): string | null {
  const value = rawUrl?.trim();
  if (!value || value.toLowerCase() === 'null' || value.toLowerCase() === 'undefined') {
    return null;
  }

  try {
    const url = new URL(value);
    if (url.protocol !== 'https:' && url.protocol !== 'http:') return null;
    // Avoid mixed-content image requests when a legacy catalog URL uses HTTP.
    if (url.protocol === 'http:') url.protocol = 'https:';
    return url.toString();
  } catch {
    return null;
  }
}

const CoverUnavailable: React.FC<{ title: string }> = ({ title }) => (
  <div
    role="img"
    aria-label={`Cover image unavailable for ${title}`}
    className="flex h-full w-full flex-col items-center justify-center gap-2 bg-[#101512] text-[#7A847D]"
  >
    <BookOpen className="h-8 w-8 opacity-60" aria-hidden="true" />
    <span className="text-[10px] uppercase tracking-wider">Cover unavailable</span>
  </div>
);

const DiscoveryBookCover: React.FC<{ book: Book }> = ({ book }) => {
  const coverUrl = getDatabaseCoverUrl(book.cover_image_url);
  if (!coverUrl) return <CoverUnavailable title={book.title} />;

  return (
    <EnhancedLazyImage
      key={coverUrl}
      src={coverUrl}
      alt={`Cover of ${book.title}`}
      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
      fallback={<CoverUnavailable title={book.title} />}
      sizes="(max-width: 640px) 144px, (max-width: 1024px) 176px, 192px"
    />
  );
};

export const HomeBookDiscovery: React.FC = () => {
  const [selectedGenre, setSelectedGenre] = useState<string>('All');
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState<boolean>(false);

  const { data: genres = [] } = useGenres();
  const {
    data: allBooks = [],
    isLoading,
    isError,
    refetch,
  } = useLibraryBooks(undefined, 80, { requireCover: true, genre: selectedGenre });

  // Listen to prefers-reduced-motion media query
  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);

    const listener = (event: MediaQueryListEvent) => {
      setPrefersReducedMotion(event.matches);
    };

    if (typeof mediaQuery.addEventListener === 'function') {
      mediaQuery.addEventListener('change', listener);
      return () => mediaQuery.removeEventListener('change', listener);
    } else if (typeof mediaQuery.addListener === 'function') {
      mediaQuery.addListener(listener);
      return () => mediaQuery.removeListener(listener);
    }
  }, []);

  /**
   * Filter and curate diverse books across distinct authors.
   * For authors with multiple catalog records, select their best book
   * based on metadata completeness, access format, and description.
   * Ensure no consecutive books share the same author.
   */
  const curatedBooks = useMemo(() => {
    const validBooks = allBooks
      .filter((book) => Boolean(getDatabaseCoverUrl(book.cover_image_url)))
      .filter(
        (book) =>
          selectedGenre === 'All' ||
          book.genre?.toLowerCase() === selectedGenre.toLowerCase()
      );

    if (validBooks.length === 0) return [];

    // Calculate completeness score for each candidate book
    const scoredBooks = validBooks.map((book) => {
      let score = 0;
      if (book.description && book.description.trim().length > 40) score += 40;
      if (book.pdf_url || book.epub_url) score += 30;
      if (book.pages && book.pages > 50) score += 20;
      if (book.publication_year && book.publication_year > 1000) score += 10;
      if (book.isbn) score += 10;
      return { book, score };
    });

    // Group by normalized author to select their highest-scoring masterpiece
    const authorBestMap = new Map<string, { book: Book; score: number }>();
    const unknownAuthorBooks: Book[] = [];

    for (const item of scoredBooks) {
      const rawAuthor = item.book.author?.trim();
      if (!rawAuthor || rawAuthor.toLowerCase() === 'unknown author') {
        unknownAuthorBooks.push(item.book);
        continue;
      }
      const normAuthor = rawAuthor
        .replace(/\s+(LLM|PhD|MD|Esq\.?|QC|KC)$/gi, '')
        .trim()
        .toLowerCase();

      const existing = authorBestMap.get(normAuthor);
      if (!existing || item.score > existing.score) {
        authorBestMap.set(normAuthor, item);
      }
    }

    const uniqueAuthorBooks = Array.from(authorBestMap.values())
      .sort((a, b) => b.score - a.score)
      .map((x) => x.book);

    // Feature each unique author's single highest-scoring work, followed by any works with unknown authors
    const curated = [...uniqueAuthorBooks, ...unknownAuthorBooks];
    return curated.slice(0, 20);
  }, [allBooks, selectedGenre]);

  // Curate popular top genres from real library records (max 5 pills)
  const popularGenres = useMemo(() => {
    const list = genres
      .map((g) => g.name)
      .filter((name): name is string => Boolean(name && name.trim()))
      .slice(0, 5);
    return ['All', ...list];
  }, [genres]);

  // Determine marquee playback state
  const isMarqueeActive = !isPaused && !prefersReducedMotion && curatedBooks.length > 1;

  return (
    <section
      className="py-16 sm:py-20 lg:py-24 bg-[#FAF7F2] dark:bg-[#0B0D0C] border-b border-[#E8E2D9] dark:border-[#29332D] text-[#1C201D] dark:text-[#F3F0E7] overflow-hidden transition-colors duration-200"
      aria-label="Book Discovery"
    >
      <style>{`
        @keyframes sahadhyayi-marquee-scroll {
          0% {
            transform: translate3d(0, 0, 0);
          }
          100% {
            transform: translate3d(-50%, 0, 0);
          }
        }
        .sahadhyayi-marquee-track {
          display: flex;
          width: max-content;
          will-change: transform;
        }
        .sahadhyayi-marquee-animating {
          animation: sahadhyayi-marquee-scroll 45s linear infinite;
        }
        .sahadhyayi-marquee-animating:hover,
        .sahadhyayi-marquee-animating:focus-within {
          animation-play-state: paused !important;
        }
        @media (prefers-reduced-motion: reduce) {
          .sahadhyayi-marquee-animating {
            animation: none !important;
          }
        }
      `}</style>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-8 sm:mb-10">
          <div className="max-w-xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white dark:bg-[#161D19] border border-[#E8E2D9] dark:border-[#29332D] text-xs font-semibold text-[#B68A35] dark:text-[#D5B16D] mb-4 shadow-2xs">
              <Compass className="w-3.5 h-3.5" />
              <span>Curated Catalog</span>
            </div>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-serif font-bold text-[#1C201D] dark:text-[#F3F0E7] tracking-tight">
              Discover your next read
            </h2>
            <p className="mt-2.5 text-sm sm:text-base text-[#636B65] dark:text-[#A5ADA6] leading-relaxed">
              Find books worth your time, explore new ideas, and discover stories that stay with you.
            </p>
          </div>

          <div className="flex items-center gap-3 self-start md:self-end flex-wrap">
            {curatedBooks.length > 1 && (
              <button
                type="button"
                onClick={() => setIsPaused((prev) => !prev)}
                aria-label={isPaused ? 'Resume book carousel animation' : 'Pause book carousel animation'}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-medium text-[#2E3430] hover:text-[#1C201D] dark:text-[#A5ADA6] dark:hover:text-[#F3F0E7] bg-white hover:bg-[#F4EFEA] dark:bg-[#161D19] dark:hover:bg-[#1E2621] border border-[#E8E2D9] dark:border-[#29332D] shadow-2xs transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B68A35] dark:focus-visible:ring-[#D5B16D]"
              >
                {isPaused ? (
                  <Play className="w-3.5 h-3.5 text-[#B68A35] dark:text-[#D5B16D]" aria-hidden="true" />
                ) : (
                  <Pause className="w-3.5 h-3.5 text-[#B68A35] dark:text-[#D5B16D]" aria-hidden="true" />
                )}
                <span>{isPaused ? 'Resume' : 'Pause'}</span>
              </button>
            )}

            <Link
              to="/library"
              className="inline-flex items-center gap-2 text-xs sm:text-sm font-semibold text-[#1C442D] hover:text-[#2D5A40] dark:text-[#D5B16D] dark:hover:text-[#e4c688] transition-colors group"
            >
              <span>Explore the library</span>
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </div>
        </div>

        {/* Category Pills (Real Genres) */}
        {popularGenres.length > 1 && (
          <div className="flex items-center gap-2 overflow-x-auto scrollbar-none pb-2 mb-8 -mx-1 px-1">
            {popularGenres.map((genre) => {
              const isSelected = selectedGenre.toLowerCase() === genre.toLowerCase();
              return (
                <button
                  key={genre}
                  type="button"
                  aria-pressed={isSelected}
                  onClick={() => setSelectedGenre(genre)}
                  className={`px-4 py-2 min-h-[38px] rounded-full text-xs font-medium whitespace-nowrap transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B68A35] dark:focus-visible:ring-[#D5B16D] ${
                    isSelected
                      ? 'bg-[#1C442D] text-white font-semibold shadow-xs dark:bg-[#D5B16D] dark:text-black'
                      : 'bg-white text-[#636B65] hover:text-[#1C201D] hover:bg-[#F4EFEA] border border-[#E8E2D9] dark:bg-[#111413] dark:text-[#A5ADA6] dark:hover:text-[#F3F0E7] dark:hover:bg-[#181C1A] dark:border-[#26302A]'
                  }`}
                >
                  {genre}
                </button>
              );
            })}
          </div>
        )}

        {/* Loading Skeleton */}
        {isLoading && (
          <div className="flex gap-4 sm:gap-6 overflow-hidden py-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="w-36 sm:w-44 md:w-48 flex-shrink-0 space-y-3 animate-pulse">
                <div className="aspect-[2/3] w-full rounded-xl bg-[#EFEBE4] dark:bg-[#161D19] border border-[#E8E2D9] dark:border-[#29332D]" />
                <div className="h-4 bg-[#EFEBE4] dark:bg-[#161D19] rounded w-3/4" />
                <div className="h-3 bg-[#EFEBE4] dark:bg-[#161D19] rounded w-1/2" />
              </div>
            ))}
          </div>
        )}

        {/* Error State */}
        {isError && (
          <div className="rounded-2xl border border-[#E8E2D9] dark:border-[#29332D] bg-white dark:bg-[#111614] p-8 text-center max-w-lg mx-auto shadow-sm">
            <BookOpen className="w-8 h-8 text-[#636B65] dark:text-[#A5ADA6] mx-auto mb-3" />
            <h3 className="text-base font-semibold text-[#1C201D] dark:text-[#F3F0E7]">Unable to load library books</h3>
            <p className="text-xs text-[#636B65] dark:text-[#A5ADA6] mt-1 mb-5">
              A temporary network issue prevented loading books. You can still explore the complete digital catalog.
            </p>
            <div className="flex items-center justify-center gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => refetch()}
                className="border-[#E8E2D9] dark:border-[#29332D] bg-white dark:bg-[#161D19] text-[#1C201D] dark:text-[#F3F0E7] hover:bg-[#F4EFEA] dark:hover:bg-[#1B241E]"
              >
                Try Again
              </Button>
              <Link to="/library">
                <Button size="sm" className="bg-[#1C442D] hover:bg-[#255438] text-white border border-[#1C442D] dark:bg-[#1C3024] dark:hover:bg-[#254231] dark:text-[#F3F0E7] dark:border-[#315C43]">
                  Open Full Library
                </Button>
              </Link>
            </div>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && !isError && curatedBooks.length === 0 && (
          <div className="rounded-2xl border border-[#E8E2D9] dark:border-[#29332D] bg-white dark:bg-[#111614] p-8 text-center max-w-lg mx-auto shadow-sm">
            <BookOpen className="w-8 h-8 text-[#636B65] dark:text-[#A5ADA6] mx-auto mb-3" />
            <h3 className="text-base font-semibold text-[#1C201D] dark:text-[#F3F0E7]">No real covers available in this category yet</h3>
            <p className="text-xs text-[#636B65] dark:text-[#A5ADA6] mt-1 mb-5">
              This section only displays cover images stored in Sahadhyayi’s catalog. Try another genre or browse the full library.
            </p>
            <div className="flex items-center justify-center gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedGenre('All')}
                className="border-[#E8E2D9] dark:border-[#29332D] bg-white dark:bg-[#161D19] text-[#1C201D] dark:text-[#F3F0E7] hover:bg-[#F4EFEA] dark:hover:bg-[#1B241E]"
              >
                Reset Filter
              </Button>
              <Link to="/library">
                <Button size="sm" className="bg-[#1C442D] hover:bg-[#255438] text-white border border-[#1C442D] dark:bg-[#1C3024] dark:hover:bg-[#254231] dark:text-[#F3F0E7] dark:border-[#315C43]">
                  Browse Library
                </Button>
              </Link>
            </div>
          </div>
        )}
      </div>

      {/* Continuously Moving Book Cover Ribbon Carousel */}
      {!isLoading && !isError && curatedBooks.length > 0 && (
        <div className="relative w-full overflow-hidden mt-2 py-4">
          {/* Subtle editorial fade edges */}
          <div
            className="pointer-events-none absolute left-0 top-0 bottom-0 w-8 sm:w-20 bg-gradient-to-r from-[#FAF7F2] dark:from-[#0B0D0C] to-transparent z-10"
            aria-hidden="true"
          />
          <div
            className="pointer-events-none absolute right-0 top-0 bottom-0 w-8 sm:w-20 bg-gradient-to-l from-[#FAF7F2] dark:from-[#0B0D0C] to-transparent z-10"
            aria-hidden="true"
          />

          <div
            className={`sahadhyayi-marquee-track flex gap-4 sm:gap-6 px-4 ${
              isMarqueeActive ? 'sahadhyayi-marquee-animating' : 'overflow-x-auto scrollbar-none'
            }`}
            style={{
              animationPlayState: isPaused ? 'paused' : 'running',
            }}
          >
            {/* Primary Track Set A (Always accessible to screen readers & keyboard navigation) */}
            <div className="flex gap-4 sm:gap-6 flex-shrink-0">
              {curatedBooks.map((book: Book) => (
                <Link
                  key={`primary-${book.id}`}
                  to={`/book/${book.id}`}
                  className="group flex flex-col w-36 sm:w-44 md:w-48 flex-shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B68A35] dark:focus-visible:ring-[#D5B16D] rounded-xl"
                  title={`${book.title} by ${book.author || 'Unknown author'}`}
                  aria-label={`View details for ${book.title} by ${book.author || 'Unknown author'}`}
                >
                  {/* Book Cover Container with 2:3 aspect ratio */}
                  <div className="relative aspect-[2/3] w-full rounded-xl overflow-hidden bg-white dark:bg-[#141816] border border-[#E8E2D9] dark:border-[#26302A] shadow-[0_4px_16px_rgba(28,32,29,0.08)] dark:shadow-sm transition-all duration-300 group-hover:border-[#B68A35]/80 dark:group-hover:border-[#D5B16D]/70 group-hover:shadow-[0_12px_28px_rgba(28,32,29,0.14)] dark:group-hover:shadow-[0_12px_28px_rgba(0,0,0,0.65)] group-hover:-translate-y-1.5">
                    <DiscoveryBookCover book={book} />
                    {/* Subtle Vignette on Hover */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 dark:from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none" />
                  </div>

                  {/* Metadata */}
                  <div className="mt-2.5 min-w-0">
                    <h3 className="text-xs sm:text-sm font-medium text-[#1C201D] dark:text-[#F3F0E7] truncate group-hover:text-[#B68A35] dark:group-hover:text-[#D5B16D] transition-colors leading-snug">
                      {book.title}
                    </h3>
                    <p className="text-[11px] text-[#636B65] dark:text-[#A5ADA6] truncate mt-0.5">
                      {book.author || 'Unknown author'}
                    </p>
                    {book.genre && (
                      <span className="inline-block mt-0.5 text-[10px] text-[#1C442D] dark:text-[#D5B16D]/80 font-medium truncate">
                        {book.genre}
                      </span>
                    )}
                  </div>
                </Link>
              ))}
            </div>

            {/* Seamless Duplicate Track Set B (Only rendered when multiple books exist for continuous loop) */}
            {curatedBooks.length > 1 && (
              <div className="flex gap-4 sm:gap-6 flex-shrink-0" aria-hidden="true">
                {curatedBooks.map((book: Book) => (
                  <Link
                    key={`duplicate-${book.id}`}
                    to={`/book/${book.id}`}
                    tabIndex={-1}
                    aria-hidden="true"
                    className="group flex flex-col w-36 sm:w-44 md:w-48 flex-shrink-0 rounded-xl"
                  >
                    {/* Book Cover Container with 2:3 aspect ratio */}
                    <div className="relative aspect-[2/3] w-full rounded-xl overflow-hidden bg-white dark:bg-[#141816] border border-[#E8E2D9] dark:border-[#26302A] shadow-[0_4px_16px_rgba(28,32,29,0.08)] dark:shadow-sm transition-all duration-300 group-hover:border-[#B68A35]/80 dark:group-hover:border-[#D5B16D]/70 group-hover:shadow-[0_12px_28px_rgba(28,32,29,0.14)] dark:group-hover:shadow-[0_12px_28px_rgba(0,0,0,0.65)] group-hover:-translate-y-1.5">
                      <DiscoveryBookCover book={book} />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/40 dark:from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none" />
                    </div>

                    {/* Metadata */}
                    <div className="mt-2.5 min-w-0">
                      <h3 className="text-xs sm:text-sm font-medium text-[#1C201D] dark:text-[#F3F0E7] truncate group-hover:text-[#B68A35] dark:group-hover:text-[#D5B16D] transition-colors leading-snug">
                        {book.title}
                      </h3>
                      <p className="text-[11px] text-[#636B65] dark:text-[#A5ADA6] truncate mt-0.5">
                        {book.author || 'Unknown author'}
                      </p>
                      {book.genre && (
                        <span className="inline-block mt-0.5 text-[10px] text-[#1C442D] dark:text-[#D5B16D]/80 font-medium truncate">
                          {book.genre}
                        </span>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </section>
  );
};

export default HomeBookDiscovery;
