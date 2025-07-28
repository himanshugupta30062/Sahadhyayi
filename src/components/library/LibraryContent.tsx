
import React from 'react';
import { useBooksByGenre } from '@/hooks/useLibraryBooks';
import BookGridView from '@/components/library/BookGridView';
import BookListView from '@/components/library/BookListView';
import LibraryPagination from '@/components/library/LibraryPagination';

interface LibraryContentProps {
  viewMode: 'grid' | 'list';
  searchQuery: string;
  selectedGenre: string;
  sortBy: string;
  ratingFilter: number[];
  shelfFilter: string;
}

const LibraryContent = ({
  viewMode,
  searchQuery,
  selectedGenre,
  sortBy,
  ratingFilter,
  shelfFilter
}: LibraryContentProps) => {
  const { data: books = [], isLoading } = useBooksByGenre(selectedGenre);

  // Filter and sort books based on all criteria
  const filteredBooks = React.useMemo(() => {
    let filtered = books.filter(book => {
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        return (
          book.title.toLowerCase().includes(query) ||
          book.author.toLowerCase().includes(query) ||
          (book.genre && book.genre.toLowerCase().includes(query))
        );
      }
      return true;
    });

    // Rating filter
    filtered = filtered.filter(book => {
      const rating = book.rating || 0;
      return rating >= ratingFilter[0] && rating <= ratingFilter[1];
    });

    // Sort books
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'title-asc':
          return a.title.localeCompare(b.title);
        case 'title-desc':
          return b.title.localeCompare(a.title);
        case 'author-asc':
          return a.author.localeCompare(b.author);
        case 'author-desc':
          return b.author.localeCompare(a.author);
        case 'rating-desc':
          return (b.rating || 0) - (a.rating || 0);
        case 'rating-asc':
          return (a.rating || 0) - (b.rating || 0);
        case 'price-asc':
          return (a.price || 0) - (b.price || 0);
        case 'price-desc':
          return (b.price || 0) - (a.price || 0);
        case 'date-desc':
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        case 'date-asc':
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        default:
          return 0;
      }
    });

    return filtered;
  }, [books, searchQuery, ratingFilter, sortBy]);

  if (isLoading) {
    return (
      <div className="flex-1">
        <div className="animate-pulse space-y-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-64 bg-gray-200 rounded-lg"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1">
      {/* Results count */}
      <div className="mb-6">
        <p className="text-gray-600 text-lg">
          Showing {filteredBooks.length} book{filteredBooks.length !== 1 ? 's' : ''}
          {searchQuery && ` for "${searchQuery}"`}
        </p>
      </div>

      {/* Books Display */}
      {viewMode === 'grid' ? (
        <BookGridView books={filteredBooks} />
      ) : (
        <BookListView books={filteredBooks} />
      )}

      {/* Pagination */}
      {filteredBooks.length > 0 && (
        <LibraryPagination
          totalCount={filteredBooks.length}
          currentPage={1}
          pageSize={filteredBooks.length}
          onPageChange={() => {}}
          onPageSizeChange={() => {}}
        />
      )}
    </div>
  );
};

export default LibraryContent;
