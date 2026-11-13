import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { LazyImage } from '@/components/ui/LazyImage';
import { BookOpen, ChevronLeft, ChevronRight, Layers, Sparkles } from 'lucide-react';
import { useBookSeries } from '@/hooks/useBookSeries';
import type { SeriesVolume } from '@/types/bookCatalog';

interface BookSeriesSectionProps {
  book: {
    id: string;
    title: string;
    author?: string | null;
    description?: string | null;
    cover_image_url?: string | null;
    publication_year?: number | null;
  };
  className?: string;
}

export const BookSeriesSection: React.FC<BookSeriesSectionProps> = ({ book, className = '' }) => {
  const { series, prevVolume, nextVolume, isLoading, isStandalone } = useBookSeries(book);

  if (isLoading || isStandalone || !series || series.volumes.length <= 1) {
    return null;
  }

  const currentVolume = series.volumes.find(v => v.bookId === book.id || v.isCurrentBook);
  const sequenceDisplay = currentVolume?.rawSequence
    ? isNaN(Number(currentVolume.rawSequence))
      ? currentVolume.rawSequence
      : `Book ${currentVolume.rawSequence}${series.totalVolumes ? ` of ${series.totalVolumes}` : ''}`
    : currentVolume?.sequenceNumber
    ? `Book ${currentVolume.sequenceNumber}${series.totalVolumes ? ` of ${series.totalVolumes}` : ''}`
    : 'Series Volume';

  return (
    <section aria-label="Book series navigation" className={`space-y-4 ${className}`}>
      <Card className="border-indigo-100 bg-gradient-to-br from-indigo-50/60 via-white to-purple-50/60 shadow-sm overflow-hidden">
        <CardHeader className="pb-3 pt-5 px-5 sm:px-6 border-b border-indigo-50">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center shrink-0">
                <Layers className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs uppercase tracking-wider font-bold text-indigo-600">
                    Series Reading Order
                  </span>
                  <Badge variant="secondary" className="bg-indigo-100/80 text-indigo-800 text-xs px-2 py-0">
                    {sequenceDisplay}
                  </Badge>
                </div>
                <CardTitle className="text-lg sm:text-xl font-bold text-gray-900 mt-0.5">
                  {series.name}
                </CardTitle>
              </div>
            </div>

            {Boolean(series.totalVolumes) && (
              <span className="text-xs font-medium text-gray-500">
                {series.totalVolumes} {series.totalVolumes === 1 ? 'Volume' : 'Volumes'} in series
              </span>
            )}
          </div>
        </CardHeader>

        <CardContent className="p-5 sm:p-6 space-y-6">
          {/* Previous & Next Quick Navigation */}
          {(prevVolume || nextVolume) && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {prevVolume ? (
                <Link
                  to={`/book/${prevVolume.bookId}`}
                  className="group flex items-center gap-3 p-3 rounded-lg border border-gray-200 bg-white/80 hover:bg-white hover:border-indigo-300 hover:shadow-sm transition-all text-left"
                  aria-label={`Previous in series: ${prevVolume.title}`}
                >
                  <ChevronLeft className="w-5 h-5 text-gray-400 group-hover:text-indigo-600 shrink-0 transition-colors" />
                  <div className="w-10 h-14 bg-gray-100 rounded overflow-hidden shrink-0 shadow-inner">
                    {prevVolume.coverImageUrl ? (
                      <LazyImage
                        src={prevVolume.coverImageUrl}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400">
                        <BookOpen className="w-4 h-4" />
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <span className="text-[11px] font-semibold text-indigo-600 uppercase tracking-wide block">
                      ← Previous Book
                    </span>
                    <p className="text-sm font-medium text-gray-900 truncate group-hover:text-indigo-700">
                      {prevVolume.title}
                    </p>
                    <p className="text-xs text-gray-500 truncate">
                      {prevVolume.sequenceNumber ? `Book ${prevVolume.sequenceNumber}` : 'Previous volume'}
                    </p>
                  </div>
                </Link>
              ) : (
                <div className="hidden sm:flex items-center justify-center p-3 rounded-lg border border-dashed border-gray-200 text-xs text-gray-400">
                  First book in this series
                </div>
              )}

              {nextVolume ? (
                <Link
                  to={`/book/${nextVolume.bookId}`}
                  className="group flex items-center justify-between gap-3 p-3 rounded-lg border border-gray-200 bg-white/80 hover:bg-white hover:border-indigo-300 hover:shadow-sm transition-all text-right"
                  aria-label={`Next in series: ${nextVolume.title}`}
                >
                  <div className="min-w-0 flex-1">
                    <span className="text-[11px] font-semibold text-indigo-600 uppercase tracking-wide block">
                      Next Book →
                    </span>
                    <p className="text-sm font-medium text-gray-900 truncate group-hover:text-indigo-700">
                      {nextVolume.title}
                    </p>
                    <p className="text-xs text-gray-500 truncate">
                      {nextVolume.sequenceNumber ? `Book ${nextVolume.sequenceNumber}` : 'Next volume'}
                    </p>
                  </div>
                  <div className="w-10 h-14 bg-gray-100 rounded overflow-hidden shrink-0 shadow-inner">
                    {nextVolume.coverImageUrl ? (
                      <LazyImage
                        src={nextVolume.coverImageUrl}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400">
                        <BookOpen className="w-4 h-4" />
                      </div>
                    )}
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-indigo-600 shrink-0 transition-colors" />
                </Link>
              ) : (
                <div className="hidden sm:flex items-center justify-center p-3 rounded-lg border border-dashed border-gray-200 text-xs text-gray-400">
                  Latest published book in this series
                </div>
              )}
            </div>
          )}

          {/* Full Series Volumes Grid */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-3">
              All Volumes in Order
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
              {series.volumes.map((vol) => {
                const isCurrent = vol.bookId === book.id || vol.isCurrentBook;
                const volumeLabel = vol.rawSequence
                  ? isNaN(Number(vol.rawSequence))
                    ? vol.rawSequence
                    : `#${vol.rawSequence}`
                  : vol.sequenceNumber
                  ? `#${vol.sequenceNumber}`
                  : '—';

                return (
                  <Link
                    key={vol.bookId}
                    to={`/book/${vol.bookId}`}
                    className={`group relative flex flex-col p-2.5 rounded-lg border transition-all text-left ${
                      isCurrent
                        ? 'border-indigo-600 bg-indigo-50/70 shadow-sm ring-1 ring-indigo-600'
                        : 'border-gray-200 bg-white hover:border-indigo-300 hover:shadow-sm'
                    }`}
                  >
                    <div className="aspect-[3/4] bg-gray-100 rounded overflow-hidden mb-2 relative">
                      {vol.coverImageUrl ? (
                        <LazyImage
                          src={vol.coverImageUrl}
                          alt=""
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400">
                          <BookOpen className="w-6 h-6" />
                        </div>
                      )}
                      <span className="absolute top-1 left-1 bg-black/70 backdrop-blur-xs text-white text-[10px] font-bold px-1.5 py-0.5 rounded">
                        {volumeLabel}
                      </span>
                    </div>

                    <p className="text-xs font-medium text-gray-900 line-clamp-2 leading-tight group-hover:text-indigo-700">
                      {vol.title}
                    </p>

                    {isCurrent ? (
                      <span className="text-[10px] font-bold text-indigo-700 mt-1 block">
                        • Current Edition
                      </span>
                    ) : vol.publicationYear ? (
                      <span className="text-[10px] text-gray-500 mt-1 block">
                        {vol.publicationYear}
                      </span>
                    ) : null}
                  </Link>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>
    </section>
  );
};

