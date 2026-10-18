import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, ArrowRight, Compass, Pause, Play, ChevronLeft, ChevronRight } from 'lucide-react';
import {
  useLibraryBooks,
  useGenres,
  getBookCompletenessScore,
  compareLibraryBooks,
  hasValidCover,
  getAuthorDiversificationKey,
  getTitleDiversificationKey,
  diversifyBooksPerPage,
  type Book,
} from '@/hooks/useLibraryBooks';
import { EnhancedLazyImage } from '@/components/ui/EnhancedLazyImage';
import { Button } from '@/components/ui/button';
import { createCanonicalClusterKey, normalizeAuthor } from '@/utils/catalog/metadataNormalization';
import { identifyJunkCandidate } from '@/utils/catalog/deduplicationEngine';

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
  const genreBarRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const { data: genres = [] } = useGenres();
  // Widen query limit to 600 so discovery accesses the full available catalog of covers without artificial starvation
  const {
    data: allBooks = [],
    isLoading,
    isError,
    refetch,
  } = useLibraryBooks(undefined, 600, { requireCover: true, genre: selectedGenre });

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
   * Filter and curate diverse books across distinct authors and genres.
   * - Enforces at most 1 book per author (name) and at most 1 book per title.
   * - Only includes real books with valid, verified covers (no placeholders).
   * - Selects each author's and title's single most complete masterpiece based on library completeness score.
   * - In "All", performs fair stratified round-robin sampling across all available genres.
   * - Guarantees no author (including prolific authors like CIA Reading Room or Stephen Hawking) dominates the carousel.
   */
  const curatedBooks = useMemo(() => {
    const validBooks = allBooks.filter((book) => {
      const cover = getDatabaseCoverUrl(book.cover_image_url);
      if (!cover || !hasValidCover(book)) return false;
      const junk = identifyJunkCandidate(book);
      if (junk.isJunk) return false;
      return true;
    });

    if (validBooks.length === 0) return [];

    // Sort valid books by library completeness and cover priority
    const sorted = [...validBooks].sort(compareLibraryBooks);

    // If specific genre is selected, strictly enforce 1 book per author and 1 per title within that genre
    if (selectedGenre !== 'All') {
      const genreBooks = sorted.filter(
        (b) => b.genre?.trim().toLowerCase() === selectedGenre.trim().toLowerCase()
      );
      const seenAuthors = new Set<string>();
      const seenTitles = new Set<string>();
      const uniqueGenreBooks: Book[] = [];
      for (const b of genreBooks) {
        if (uniqueGenreBooks.length >= 24) break;
        const aKey = getAuthorDiversificationKey(b.author, b.title);
        const tKey = getTitleDiversificationKey(b.title);
        if (aKey && seenAuthors.has(aKey)) continue;
        if (tKey && seenTitles.has(tKey)) continue;
        uniqueGenreBooks.push(b);
        if (aKey) seenAuthors.add(aKey);
        if (tKey) seenTitles.add(tKey);
      }
      return uniqueGenreBooks;
    }

    // "All" view: Select each author's and each title's single best masterpiece
    const authorBestMap = new Map<string, Book>();
    const titleBestMap = new Map<string, Book>();

    for (const book of sorted) {
      const aKey = getAuthorDiversificationKey(book.author, book.title);
      const tKey = getTitleDiversificationKey(book.title);

      if (aKey && !authorBestMap.has(aKey)) {
        authorBestMap.set(aKey, book);
      }
      if (tKey && !titleBestMap.has(tKey)) {
        titleBestMap.set(tKey, book);
      }
    }

    // Stratify by genre so the ribbon features diverse literary categories
    const genreBuckets = new Map<string, Book[]>();
    for (const book of sorted) {
      const aKey = getAuthorDiversificationKey(book.author, book.title);
      const tKey = getTitleDiversificationKey(book.title);

      // Only allow the author's single best book and title's single best book
      if (aKey && authorBestMap.get(aKey)?.id !== book.id) continue;
      if (tKey && titleBestMap.get(tKey)?.id !== book.id) continue;

      const g = book.genre?.trim() || 'General';
      if (!genreBuckets.has(g)) genreBuckets.set(g, []);
      genreBuckets.get(g)!.push(book);
    }

    // Sort genre buckets so populated literary genres rotate first
    const sortedGenreNames = Array.from(genreBuckets.keys()).sort((a, b) => {
      if (a === 'General') return 1;
      if (b === 'General') return -1;
      return genreBuckets.get(b)!.length - genreBuckets.get(a)!.length;
    });

    const curated: Book[] = [];
    const usedAuthorKeys = new Set<string>();
    const usedTitleKeys = new Set<string>();
    const TARGET_COUNT = 24;
    const maxRounds = 12;

    for (let round = 0; round < maxRounds && curated.length < TARGET_COUNT; round++) {
      for (const gName of sortedGenreNames) {
        if (curated.length >= TARGET_COUNT) break;
        const bucket = genreBuckets.get(gName) || [];

        const cand = bucket.find((b) => {
          const aKey = getAuthorDiversificationKey(b.author, b.title);
          const tKey = getTitleDiversificationKey(b.title);
          if (aKey && usedAuthorKeys.has(aKey)) return false;
          if (tKey && usedTitleKeys.has(tKey)) return false;
          return true;
        });

        if (cand) {
          const aKey = getAuthorDiversificationKey(cand.author, cand.title);
          const tKey = getTitleDiversificationKey(cand.title);
          curated.push(cand);
          if (aKey) usedAuthorKeys.add(aKey);
          if (tKey) usedTitleKeys.add(tKey);
        }
      }
    }

    // Fallback if target count isn't reached: backfill from remaining sorted candidates with diversity
    if (curated.length < TARGET_COUNT) {
      for (const b of sorted) {
        if (curated.length >= TARGET_COUNT) break;
        const aKey = getAuthorDiversificationKey(b.author, b.title);
        const tKey = getTitleDiversificationKey(b.title);
        if (aKey && usedAuthorKeys.has(aKey)) continue;
        if (tKey && usedTitleKeys.has(tKey)) continue;
        curated.push(b);
        if (aKey) usedAuthorKeys.add(aKey);
        if (tKey) usedTitleKeys.add(tKey);
      }
    }

    return curated;
  }, [allBooks, selectedGenre]);

  // Extract all real genres from the catalog without artificial truncation
  const allAvailableGenres = useMemo(() => {
    const genreCounts = new Map<string, number>();
    for (const b of allBooks) {
      if (b.cover_image_url && b.genre) {
        const trimmed = b.genre.trim();
        if (trimmed) {
          genreCounts.set(trimmed, (genreCounts.get(trimmed) || 0) + 1);
        }
      }
    }

    const set = new Set<string>();
    genres.forEach((g) => {
      const name = g.name?.trim();
      if (name) set.add(name);
    });
    allBooks.forEach((b) => {
      const name = b.genre?.trim();
      if (name) set.add(name);
    });

    const filtered = Array.from(set).filter(
      (name) => !/^subject headings/i.test(name) && !/^gazettes/i.test(name)
    );

    filtered.sort((a, b) => {
      const countA = genreCounts.get(a) || 0;
      const countB = genreCounts.get(b) || 0;
      if (countB !== countA) return countB - countA;
      return a.localeCompare(b);
    });

    return ['All', ...filtered];
  }, [genres, allBooks]);

  // Keep track of horizontal genre bar scroll buttons
  const updateScrollButtons = useCallback(() => {
    if (!genreBarRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = genreBarRef.current;
    setCanScrollLeft(scrollLeft > 4);
    setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 4);
  }, []);

  useEffect(() => {
    updateScrollButtons();
    const el = genreBarRef.current;
    if (!el) return;
    el.addEventListener('scroll', updateScrollButtons, { passive: true });
    window.addEventListener('resize', updateScrollButtons);
    return () => {
      el.removeEventListener('scroll', updateScrollButtons);
      window.removeEventListener('resize', updateScrollButtons);
    };
  }, [updateScrollButtons, allAvailableGenres]);

  const scrollGenres = (direction: 'left' | 'right') => {
    if (genreBarRef.current) {
      const offset = direction === 'left' ? -260 : 260;
      genreBarRef.current.scrollBy({ left: offset, behavior: 'smooth' });
    }
  };

  // Build marquee base items: if fewer than 8 books, repeat them so the loop has sufficient width
  const marqueeItems = useMemo(() => {
    if (curatedBooks.length <= 1) return curatedBooks;
    if (curatedBooks.length >= 8) return curatedBooks;
    const repetitions = Math.ceil(8 / curatedBooks.length);
    const repeated: Book[] = [];
    for (let i = 0; i < repetitions; i++) {
      repeated.push(...curatedBooks);
    }
    return repeated;
  }, [curatedBooks]);

  // Determine marquee playback state
  const isMarqueeActive = !isPaused && !prefersReducedMotion && curatedBooks.length > 1;

  return (
    <section
      className="home-book-discovery relative isolate py-16 sm:py-20 lg:py-24 bg-[#F2F7F0] dark:bg-[#0B0D0C] border-b border-[#D8E5D6] dark:border-[#29332D] text-[#1C201D] dark:text-[#F3F0E7] overflow-hidden transition-colors duration-300"
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
          animation: sahadhyayi-marquee-scroll 48s linear infinite;
        }
        .sahadhyayi-marquee-animating:hover,
        .sahadhyayi-marquee-animating:focus-within {
          animation-play-state: paused !important;
        }
        @keyframes homeSectionGlowDrift {
          0%, 100% { transform: translate3d(0, 0, 0) scale(1); }
          50% { transform: translate3d(-18px, 16px, 0) scale(1.05); }
        }
        .home-section-glow { animation: homeSectionGlowDrift 22s ease-in-out infinite; }
        .home-section-glow-delayed { animation-delay: -11s; }
        @media (prefers-reduced-motion: reduce) {
          .home-section-glow { animation: none; }
        }
        @media (prefers-reduced-motion: reduce) {
          .sahadhyayi-marquee-animating {
            animation: none !important;
          }
        }
      `}</style>

      <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden dark:hidden">
        <div className="home-section-glow absolute -right-24 top-12 h-80 w-80 rounded-full bg-[#BEDDBF]/55 blur-[90px]" />
        <div className="home-section-glow home-section-glow-delayed absolute -left-20 bottom-[-8rem] h-72 w-72 rounded-full bg-[#F0DEB6]/45 blur-[90px]" />
      </div>
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-8 sm:mb-10">
          <div className="max-w-xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white dark:bg-[#161D19] border border-[#D8E5D6] dark:border-[#29332D] text-xs font-semibold text-[#B68A35] dark:text-[#D5B16D] mb-4 shadow-2xs">
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
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-medium text-[#2E3430] hover:text-[#1C201D] dark:text-[#A5ADA6] dark:hover:text-[#F3F0E7] bg-white hover:bg-[#EAF2E8] dark:bg-[#161D19] dark:hover:bg-[#1E2621] border border-[#D8E5D6] dark:border-[#29332D] shadow-2xs transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B68A35] dark:focus-visible:ring-[#D5B16D]"
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

        {/* Category Pills (All Real Genres from Catalog) */}
        {allAvailableGenres.length > 1 && (
          <div className="relative mb-8 -mx-1 px-1">
            {/* Scroll Navigation Chevrons */}
            {canScrollLeft && (
              <button
                type="button"
                onClick={() => scrollGenres('left')}
                aria-label="Scroll genres left"
                className="hidden sm:flex absolute -left-2 top-1/2 -translate-y-1/2 z-20 w-8 h-8 rounded-full items-center justify-center bg-white/95 dark:bg-[#161D19]/95 text-[#2E3430] dark:text-[#A5ADA6] hover:text-[#1C201D] dark:hover:text-[#F3F0E7] border border-[#D8E5D6] dark:border-[#29332D] shadow-md backdrop-blur-xs transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B68A35]"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
            )}
            {canScrollRight && (
              <button
                type="button"
                onClick={() => scrollGenres('right')}
                aria-label="Scroll genres right"
                className="hidden sm:flex absolute -right-2 top-1/2 -translate-y-1/2 z-20 w-8 h-8 rounded-full items-center justify-center bg-white/95 dark:bg-[#161D19]/95 text-[#2E3430] dark:text-[#A5ADA6] hover:text-[#1C201D] dark:hover:text-[#F3F0E7] border border-[#D8E5D6] dark:border-[#29332D] shadow-md backdrop-blur-xs transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B68A35]"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            )}

            <div
              ref={genreBarRef}
              className="flex items-center gap-2 overflow-x-auto scrollbar-none pb-2 scroll-smooth"
            >
              {allAvailableGenres.map((genre) => {
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
                        : 'bg-white text-[#636B65] hover:text-[#1C201D] hover:bg-[#EAF2E8] border border-[#D8E5D6] dark:bg-[#111413] dark:text-[#A5ADA6] dark:hover:text-[#F3F0E7] dark:hover:bg-[#181C1A] dark:border-[#26302A]'
                    }`}
                  >
                    {genre}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Loading Skeleton */}
        {isLoading && (
          <div className="flex gap-4 sm:gap-6 overflow-hidden py-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="w-36 sm:w-44 md:w-48 flex-shrink-0 space-y-3 animate-pulse">
                <div className="aspect-[2/3] w-full rounded-xl bg-[#E3EDE0] dark:bg-[#161D19] border border-[#D8E5D6] dark:border-[#29332D]" />
                <div className="h-4 bg-[#E3EDE0] dark:bg-[#161D19] rounded w-3/4" />
                <div className="h-3 bg-[#E3EDE0] dark:bg-[#161D19] rounded w-1/2" />
              </div>
            ))}
          </div>
        )}

        {/* Error State */}
        {isError && (
          <div className="rounded-2xl border border-[#D8E5D6] dark:border-[#29332D] bg-white dark:bg-[#111614] p-8 text-center max-w-lg mx-auto shadow-sm">
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
                className="border-[#D8E5D6] dark:border-[#29332D] bg-white dark:bg-[#161D19] text-[#1C201D] dark:text-[#F3F0E7] hover:bg-[#EAF2E8] dark:hover:bg-[#1B241E]"
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
          <div className="rounded-2xl border border-[#D8E5D6] dark:border-[#29332D] bg-white dark:bg-[#111614] p-8 text-center max-w-lg mx-auto shadow-sm">
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
                className="border-[#D8E5D6] dark:border-[#29332D] bg-white dark:bg-[#161D19] text-[#1C201D] dark:text-[#F3F0E7] hover:bg-[#EAF2E8] dark:hover:bg-[#1B241E]"
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
            className="pointer-events-none absolute left-0 top-0 bottom-0 w-8 sm:w-20 bg-gradient-to-r from-[#F2F7F0] dark:from-[#0B0D0C] to-transparent z-10"
            aria-hidden="true"
          />
          <div
            className="pointer-events-none absolute right-0 top-0 bottom-0 w-8 sm:w-20 bg-gradient-to-l from-[#F2F7F0] dark:from-[#0B0D0C] to-transparent z-10"
            aria-hidden="true"
          />

          <div
            className={`sahadhyayi-marquee-track flex gap-4 sm:gap-6 px-4 ${
              isMarqueeActive ? 'sahadhyayi-marquee-animating' : 'overflow-x-auto scrollbar-none justify-center'
            }`}
            style={{
              animationPlayState: isPaused ? 'paused' : 'running',
            }}
          >
            {/* Primary Track Set A (Always accessible to screen readers & keyboard navigation) */}
            <div className="flex gap-4 sm:gap-6 flex-shrink-0">
              {marqueeItems.map((book: Book, idx: number) => (
                <Link
                  key={`primary-${book.id}-${idx}`}
                  to={`/book/${book.id}`}
                  className="group flex flex-col w-36 sm:w-44 md:w-48 flex-shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B68A35] dark:focus-visible:ring-[#D5B16D] rounded-xl"
                  title={`${book.title} by ${book.author || 'Unknown author'}`}
                  aria-label={`View details for ${book.title} by ${book.author || 'Unknown author'}`}
                >
                  {/* Book Cover Container with 2:3 aspect ratio */}
                  <div className="relative aspect-[2/3] w-full rounded-xl overflow-hidden bg-white dark:bg-[#141816] border border-[#D8E5D6] dark:border-[#26302A] shadow-[0_4px_16px_rgba(28,32,29,0.08)] dark:shadow-sm transition-all duration-300 group-hover:border-[#B68A35]/80 dark:group-hover:border-[#D5B16D]/70 group-hover:shadow-[0_12px_28px_rgba(28,32,29,0.14)] dark:group-hover:shadow-[0_12px_28px_rgba(0,0,0,0.65)] group-hover:-translate-y-1.5">
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

            {/* Seamless Duplicate Track Set B (Only rendered when marquee is active for infinite loop) */}
            {isMarqueeActive && (
              <div className="flex gap-4 sm:gap-6 flex-shrink-0" aria-hidden="true">
                {marqueeItems.map((book: Book, idx: number) => (
                  <Link
                    key={`duplicate-${book.id}-${idx}`}
                    to={`/book/${book.id}`}
                    tabIndex={-1}
                    aria-hidden="true"
                    className="group flex flex-col w-36 sm:w-44 md:w-48 flex-shrink-0 rounded-xl"
                  >
                    {/* Book Cover Container with 2:3 aspect ratio */}
                    <div className="relative aspect-[2/3] w-full rounded-xl overflow-hidden bg-white dark:bg-[#141816] border border-[#D8E5D6] dark:border-[#26302A] shadow-[0_4px_16px_rgba(28,32,29,0.08)] dark:shadow-sm transition-all duration-300 group-hover:border-[#B68A35]/80 dark:group-hover:border-[#D5B16D]/70 group-hover:shadow-[0_12px_28px_rgba(28,32,29,0.14)] dark:group-hover:shadow-[0_12px_28px_rgba(0,0,0,0.65)] group-hover:-translate-y-1.5">
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
