import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, ArrowRight, Compass, Sparkles, Loader2 } from 'lucide-react';
import { useLibraryBooks, useGenres, type Book } from '@/hooks/useLibraryBooks';
import { EnhancedLazyImage } from '@/components/ui/EnhancedLazyImage';
import GeneratedBookCover from '@/components/library/GeneratedBookCover';
import { Button } from '@/components/ui/button';

export const HomeBookDiscovery: React.FC = () => {
  const [selectedGenre, setSelectedGenre] = useState<string>('All');
  const { data: genres = [] } = useGenres();
  const { data: allBooks = [], isLoading, isError } = useLibraryBooks(undefined, 24);

  // Filter books by selected genre if not 'All'
  const filteredBooks = React.useMemo(() => {
    if (selectedGenre === 'All') return allBooks.slice(0, 8);
    return allBooks
      .filter((b) => b.genre?.toLowerCase() === selectedGenre.toLowerCase())
      .slice(0, 8);
  }, [allBooks, selectedGenre]);

  // Curate popular top genres from real library records (max 5 pills)
  const popularGenres = React.useMemo(() => {
    const list = genres
      .map((g) => g.name)
      .filter((name): name is string => Boolean(name && name.trim()))
      .slice(0, 5);
    return ['All', ...list];
  }, [genres]);

  return (
    <section
      className="py-16 sm:py-20 lg:py-24 px-4 sm:px-6 lg:px-8 bg-[#0B0D0C] border-b border-[#29332D] text-[#F3F0E7]"
      aria-label="Book Discovery"
    >
      <div className="max-w-7xl mx-auto">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-10">
          <div className="max-w-xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#161D19] border border-[#29332D] text-xs font-semibold text-[#D5B16D] mb-4">
              <Compass className="w-3.5 h-3.5" />
              <span>Curated Catalog</span>
            </div>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-serif font-bold text-[#F3F0E7] tracking-tight">
              Discover your next read
            </h2>
            <p className="mt-2.5 text-sm sm:text-base text-[#A5ADA6] leading-relaxed">
              Find books worth your time, explore new ideas, and discover stories that stay with you.
            </p>
          </div>

          <Link
            to="/library"
            className="inline-flex items-center gap-2 text-xs sm:text-sm font-semibold text-[#D5B16D] hover:text-[#e4c688] transition-colors self-start md:self-end group"
          >
            <span>Explore the library</span>
            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
          </Link>
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
                  className={`px-4 py-2 min-h-[38px] rounded-full text-xs font-medium whitespace-nowrap transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D5B16D] ${
                    isSelected
                      ? 'bg-[#D5B16D] text-black font-semibold shadow-xs'
                      : 'bg-[#111413] text-[#A5ADA6] hover:text-[#F3F0E7] hover:bg-[#181C1A] border border-[#26302A]'
                  }`}
                >
                  {genre}
                </button>
              );
            })}
          </div>
        )}

        {/* Loading State */}
        {isLoading && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-4 sm:gap-6">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="space-y-3 animate-pulse">
                <div className="aspect-[2/3] w-full rounded-xl bg-[#161D19] border border-[#29332D]" />
                <div className="h-4 bg-[#161D19] rounded w-3/4" />
                <div className="h-3 bg-[#161D19] rounded w-1/2" />
              </div>
            ))}
          </div>
        )}

        {/* Error State */}
        {isError && (
          <div className="rounded-2xl border border-[#29332D] bg-[#111614] p-8 text-center max-w-lg mx-auto">
            <BookOpen className="w-8 h-8 text-[#A5ADA6] mx-auto mb-3" />
            <h3 className="text-base font-semibold text-[#F3F0E7]">Unable to load library books</h3>
            <p className="text-xs text-[#A5ADA6] mt-1 mb-5">
              A temporary network issue prevented loading books. You can still explore the complete digital catalog.
            </p>
            <Link to="/library">
              <Button size="sm" className="bg-[#1C3024] hover:bg-[#254231] text-[#F3F0E7] border border-[#315C43]">
                Open Full Library
              </Button>
            </Link>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && !isError && filteredBooks.length === 0 && (
          <div className="rounded-2xl border border-[#29332D] bg-[#111614] p-8 text-center max-w-lg mx-auto">
            <BookOpen className="w-8 h-8 text-[#A5ADA6] mx-auto mb-3" />
            <h3 className="text-base font-semibold text-[#F3F0E7]">No books found in this category</h3>
            <p className="text-xs text-[#A5ADA6] mt-1 mb-5">
              Try choosing another genre or browse the full collection in our digital library.
            </p>
            <div className="flex items-center justify-center gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedGenre('All')}
                className="border-[#29332D] bg-[#161D19] text-[#F3F0E7] hover:bg-[#1B241E]"
              >
                Reset Filter
              </Button>
              <Link to="/library">
                <Button size="sm" className="bg-[#1C3024] hover:bg-[#254231] text-[#F3F0E7] border border-[#315C43]">
                  Browse Library
                </Button>
              </Link>
            </div>
          </div>
        )}

        {/* Real Books Grid — Prominent covers matching the reference design */}
        {!isLoading && !isError && filteredBooks.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 sm:gap-6">
            {filteredBooks.map((book: Book) => {
              return (
                <Link
                  key={book.id}
                  to={`/book/${book.id}`}
                  className="group flex flex-col focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D5B16D] rounded-xl"
                  title={`${book.title} by ${book.author || 'Unknown'}`}
                  aria-label={`View details for ${book.title} by ${book.author || 'Unknown author'}`}
                >
                  {/* Book Cover Container with 2:3 aspect ratio */}
                  <div className="relative aspect-[2/3] w-full rounded-xl overflow-hidden bg-[#141816] border border-[#26302A] shadow-sm transition-all duration-300 group-hover:border-[#D5B16D]/60 group-hover:shadow-[0_8px_24px_rgba(0,0,0,0.6)] group-hover:-translate-y-1">
                    {book.cover_image_url ? (
                      <EnhancedLazyImage
                        src={book.cover_image_url}
                        alt={`Cover of ${book.title}`}
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                        fallback={
                          <GeneratedBookCover title={book.title} author={book.author} genre={book.genre} />
                        }
                      />
                    ) : (
                      <GeneratedBookCover title={book.title} author={book.author} genre={book.genre} />
                    )}

                    {/* Subtle Dark Vignette on Hover */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none" />
                  </div>

                  {/* Metadata */}
                  <div className="mt-2.5 min-w-0">
                    <h3 className="text-xs sm:text-sm font-medium text-[#F3F0E7] truncate group-hover:text-[#D5B16D] transition-colors leading-snug">
                      {book.title}
                    </h3>
                    <p className="text-[11px] text-[#A5ADA6] truncate mt-0.5">
                      {book.author || 'Unknown author'}
                    </p>
                    {book.genre && (
                      <span className="inline-block mt-1 text-[10px] text-[#D5B16D]/80 font-medium truncate">
                        {book.genre}
                      </span>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
};

export default HomeBookDiscovery;

