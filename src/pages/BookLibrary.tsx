
import React, { useState } from 'react';
import { BookOpen } from 'lucide-react';
import LibraryHeader from '@/components/library/LibraryHeader';
import LibraryFilters from '@/components/library/LibraryFilters';
import LibraryContent from '@/components/library/LibraryContent';
import TrendingCarousel from '@/components/library/TrendingCarousel';

const BookLibrary = () => {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGenre, setSelectedGenre] = useState<string>('All');
  const [sortBy, setSortBy] = useState<string>('title-asc');
  const [ratingFilter, setRatingFilter] = useState<number[]>([0, 5]);
  const [shelfFilter, setShelfFilter] = useState<string>('all');

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center space-x-3">
            <BookOpen className="w-8 h-8 text-orange-600" />
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Library (पुस्तकालय)
              </h1>
              <p className="text-gray-600 mt-1">
                Discover and explore our collection of books
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Trending Carousel */}
      <TrendingCarousel />

      {/* Library Header with Search and Controls */}
      <LibraryHeader
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        sortBy={sortBy}
        onSortChange={setSortBy}
      />

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex gap-8">
          {/* Filters Sidebar */}
          <LibraryFilters
            selectedGenre={selectedGenre}
            onGenreChange={setSelectedGenre}
            ratingFilter={ratingFilter}
            onRatingFilterChange={setRatingFilter}
            shelfFilter={shelfFilter}
            onShelfFilterChange={setShelfFilter}
          />

          {/* Books Content */}
          <LibraryContent
            viewMode={viewMode}
            searchQuery={searchQuery}
            selectedGenre={selectedGenre}
            sortBy={sortBy}
            ratingFilter={ratingFilter}
            shelfFilter={shelfFilter}
          />
        </div>
      </div>
    </div>
  );
};

export default BookLibrary;
