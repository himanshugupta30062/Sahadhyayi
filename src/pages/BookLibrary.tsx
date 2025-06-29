
import React, { useState } from 'react';
import { BookOpen } from 'lucide-react';
import { SearchBar } from '@/components/ui/search-bar';
import FilterPopup from '@/components/library/FilterPopup';
import BooksCollection from '@/components/library/BooksCollection';
import GenreSelector from '@/components/library/GenreSelector';
import TrendingCarousel from '@/components/library/TrendingCarousel';

const BookLibrary = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGenre, setSelectedGenre] = useState<string>('All');
  const [selectedAuthor, setSelectedAuthor] = useState<string>('All');
  const [selectedYear, setSelectedYear] = useState<string>('');
  const [selectedLanguage, setSelectedLanguage] = useState<string>('All');
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 100]);

  const handleClearFilters = () => {
    setSelectedGenre('All');
    setSelectedAuthor('All');
    setSelectedYear('');
    setSelectedLanguage('All');
    setPriceRange([0, 100]);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-white to-orange-50">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-amber-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <div className="flex items-center justify-center space-x-3 mb-4">
              <div className="p-3 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl shadow-lg">
                <BookOpen className="w-8 h-8 text-white" />
              </div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent">
                Digital Library
              </h1>
            </div>
            <p className="text-gray-600 text-lg max-w-2xl mx-auto">
              Discover and explore our vast collection of books from around the world
            </p>
          </div>
        </div>
      </div>

      <TrendingCarousel />

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search and Filters */}
        <div className="mb-8">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center gap-4 mb-6">
              <div className="flex-1">
                <SearchBar
                  value={searchQuery}
                  onValueChange={setSearchQuery}
                  placeholder="Search books by title, author, or genre..."
                  className="h-12 text-base bg-white/90 backdrop-blur-sm border-2 border-amber-200 focus-within:border-amber-400 rounded-xl shadow-sm"
                />
              </div>
              <FilterPopup
                selectedGenre={selectedGenre}
                onGenreChange={setSelectedGenre}
                selectedAuthor={selectedAuthor}
                onAuthorChange={setSelectedAuthor}
                selectedYear={selectedYear}
                onYearChange={setSelectedYear}
                selectedLanguage={selectedLanguage}
                onLanguageChange={setSelectedLanguage}
                priceRange={priceRange}
                onPriceRangeChange={setPriceRange}
                onClearFilters={handleClearFilters}
              />
            </div>

            {/* Genre Selector */}
            <GenreSelector
              genres={[
                'All',
                'Science',
                'Fiction',
                'Hindi',
                'Devotional',
                'Biography',
                'History'
              ]}
              selected={selectedGenre}
              onSelect={setSelectedGenre}
            />
          </div>
        </div>

        {/* Books Collection */}
        <BooksCollection
          searchQuery={searchQuery}
          selectedGenre={selectedGenre}
          selectedAuthor={selectedAuthor}
          selectedYear={selectedYear}
          selectedLanguage={selectedLanguage}
          priceRange={priceRange}
        />
      </div>
    </div>
  );
};

export default BookLibrary;
