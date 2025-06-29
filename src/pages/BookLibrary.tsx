
import React, { useState } from 'react';
import { BookOpen } from 'lucide-react';
import { SearchBar } from '@/components/ui/search-bar';
import FilterPopup from '@/components/library/FilterPopup';
import MostReadBooks from '@/components/library/MostReadBooks';

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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <div className="flex items-center justify-center space-x-3 mb-4">
              <BookOpen className="w-10 h-10 text-blue-600" />
              <h1 className="text-4xl font-bold text-gray-900">
                Digital Library
              </h1>
            </div>
            <p className="text-gray-600 text-lg max-w-2xl mx-auto">
              Discover and explore our vast collection of books from around the world
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search Bar with Filter */}
        <div className="mb-8">
          <div className="max-w-2xl mx-auto">
            <div className="flex items-center gap-3">
              <div className="flex-1">
                <SearchBar
                  value={searchQuery}
                  onValueChange={setSearchQuery}
                  placeholder="Search books by title, author, or genre..."
                  className="h-14 text-lg shadow-lg border-2 border-blue-100 focus-within:border-blue-400 rounded-2xl"
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
          </div>
        </div>

        {/* Most Read Books */}
        <MostReadBooks
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
