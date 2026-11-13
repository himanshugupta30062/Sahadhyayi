import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client-universal';
import {
  parseBookSeries,
  compareSeriesVolumes,
  buildSeriesNavigation,
  deduplicateSeriesVolumes,
} from '@/utils/catalog/bookSeriesAndEditions';
import type { BookSeries, SeriesVolume } from '@/types/bookCatalog';
import {
  detectBookSchemaCapabilities,
  getPublicBookSelectColumns,
  applyPublicBookFilter,
  filterPublicBooks,
} from '@/utils/catalog/bookVisibility';

export interface UseBookSeriesParams {
  id?: string;
  title?: string;
  author?: string | null;
  description?: string | null;
  cover_image_url?: string | null;
  publication_year?: number | null;
}

export interface BookSeriesHookResult {
  series: BookSeries | null;
  prevVolume: SeriesVolume | null;
  nextVolume: SeriesVolume | null;
  isLoading: boolean;
  isStandalone: boolean;
}

export function useBookSeries(book?: UseBookSeriesParams | null): BookSeriesHookResult {
  const parsedSeries = book?.title ? parseBookSeries(book.title, book.description) : null;
  const seriesName = parsedSeries?.seriesName;

  const query = useQuery({
    queryKey: ['book-series', seriesName, book?.id],
    queryFn: async (): Promise<BookSeries | null> => {
      if (!seriesName || !book) return null;

      const caps = await detectBookSchemaCapabilities();
      const selectCols = getPublicBookSelectColumns(caps);

      // Search books_library matching the series name
      let dbQuery = supabase
        .from('books_library')
        .select(selectCols)
        .ilike('title', `%${seriesName}%`);

      dbQuery = applyPublicBookFilter(dbQuery, caps);

      const { data, error } = await dbQuery.limit(20);

      const rows = !error && Array.isArray(data) ? filterPublicBooks(data) : [];

      // Convert rows to SeriesVolume
      const rawVolumes: SeriesVolume[] = [];

      // Always include current book
      const currentParsed = parseBookSeries(book.title || '', book.description);
      rawVolumes.push({
        bookId: book.id || 'current',
        title: book.title || 'Untitled',
        author: book.author || undefined,
        coverImageUrl: book.cover_image_url || undefined,
        seriesName,
        sequenceNumber: currentParsed?.volumeNumber,
        rawSequence: currentParsed?.rawSequence,
        totalVolumes: currentParsed?.totalVolumes,
        publicationYear: book.publication_year,
        isCurrentBook: true,
      });

      for (const row of rows) {
        if (row.id === book.id) continue;
        const rowParsed = parseBookSeries(row.title, row.description);
        rawVolumes.push({
          bookId: row.id,
          title: row.title,
          author: row.author || undefined,
          coverImageUrl: row.cover_image_url || undefined,
          seriesName: rowParsed?.seriesName || seriesName,
          sequenceNumber: rowParsed?.volumeNumber,
          rawSequence: rowParsed?.rawSequence,
          totalVolumes: rowParsed?.totalVolumes,
          publicationYear: row.publication_year,
          isCurrentBook: false,
        });
      }

      // Deduplicate alternative editions of the same volume
      const uniqueVolumes = deduplicateSeriesVolumes(rawVolumes);
      uniqueVolumes.sort(compareSeriesVolumes);

      // Max total volumes discovered or declared
      const totalDeclared = parsedSeries?.totalVolumes || null;
      const totalCalculated = Math.max(
        totalDeclared || 0,
        uniqueVolumes.length,
        ...uniqueVolumes.map(v => (typeof v.sequenceNumber === 'number' ? v.sequenceNumber : 0)),
      );

      return {
        id: `series-${seriesName.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
        name: seriesName,
        totalVolumes: totalCalculated > 0 ? totalCalculated : null,
        volumes: uniqueVolumes,
      };
    },
    enabled: Boolean(seriesName && book?.id),
    staleTime: 5 * 60 * 1000,
  });

  const series = query.data || null;
  const nav = series && book?.id
    ? buildSeriesNavigation(series.volumes, book.id)
    : { prevVolume: null, nextVolume: null };

  return {
    series,
    prevVolume: nav.prevVolume,
    nextVolume: nav.nextVolume,
    isLoading: query.isLoading,
    isStandalone: !seriesName,
  };
}
