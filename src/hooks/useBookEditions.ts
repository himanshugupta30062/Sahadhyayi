import { useMemo } from 'react';
import { useWorkEditions } from '@/hooks/useWorkEditions';
import { useUserBookshelf } from '@/hooks/useUserBookshelf';
import { mapRawToEdition } from '@/utils/catalog/deduplicationEngine';
import { getEditionReadingContext } from '@/utils/catalog/bookSeriesAndEditions';
import type { Edition, Work } from '@/types/bookCatalog';
import type { EditionReadingContext } from '@/utils/catalog/bookSeriesAndEditions';

export interface UseBookEditionsParams {
  id: string;
  title: string;
  author?: string | null;
  isbn?: string | null;
  publication_year?: number | null;
  pages?: number | null;
  language?: string | null;
  publisher?: string | null;
  cover_image_url?: string | null;
  pdf_url?: string | null;
  epub_url?: string | null;
  genre?: string | null;
  description?: string | null;
}

export interface BookEditionsHookResult {
  currentEdition: Edition;
  alternativeEditions: Edition[];
  allEditions: Edition[];
  totalEditionsCount: number;
  readingContext: EditionReadingContext;
  isLoading: boolean;
}

export function useBookEditions(book?: UseBookEditionsParams | null): BookEditionsHookResult | null {
  const { data: alternativeEditions = [], isLoading: isAltLoading } = useWorkEditions(
    book?.title,
    book?.id,
  );
  const { data: shelfItems = [], isLoading: isShelfLoading } = useUserBookshelf();

  const currentEdition = useMemo(() => {
    if (!book) return null;
    return mapRawToEdition(book);
  }, [book]);

  const allEditions = useMemo(() => {
    if (!currentEdition) return [];
    return [currentEdition, ...alternativeEditions];
  }, [currentEdition, alternativeEditions]);

  const readingContext = useMemo(() => {
    if (!book?.id) {
      return {
        currentEditionId: '',
        isCurrentEditionShelved: false,
        currentShelfItem: null,
        hasOtherShelvedEdition: false,
        otherShelvedEdition: null,
        otherShelfItem: null,
      };
    }
    return getEditionReadingContext(book.id, allEditions, shelfItems);
  }, [book?.id, allEditions, shelfItems]);

  if (!currentEdition) return null;

  return {
    currentEdition,
    alternativeEditions,
    allEditions,
    totalEditionsCount: allEditions.length,
    readingContext,
    isLoading: isAltLoading || isShelfLoading,
  };
}

