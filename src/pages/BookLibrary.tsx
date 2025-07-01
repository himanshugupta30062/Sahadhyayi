
import React, { useState } from 'react';
import { BookOpen } from 'lucide-react';
import { SearchBar } from '@/components/ui/search-bar';
import FilterPopup from '@/components/library/FilterPopup';
import BooksCollection from '@/components/library/BooksCollection';
import GenreSelector from '@/components/library/GenreSelector';

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
      {/* SEO-optimized header */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-amber-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <div className="flex items-center justify-center space-x-3 mb-4">
              <div className="p-3 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl shadow-lg">
                <BookOpen className="w-8 h-8 text-white" />
              </div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent">
                Digital Library Collection
              </h1>
            </div>
            <p className="text-gray-600 text-lg max-w-2xl mx-auto mb-4">
              Discover and explore our vast collection of books from around the world. Browse through thousands of titles across multiple genres and languages.
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search and Filters Section */}
        <section aria-labelledby="search-filters-heading">
          <h2 id="search-filters-heading" className="sr-only">Search and Filter Books</h2>
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
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Browse by Genre</h3>
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
          </div>
        </section>

        {/* Books Collection Section */}
        <section aria-labelledby="books-collection-heading">
          <h2 id="books-collection-heading" className="text-2xl font-bold text-gray-900 mb-6">
            Available Books
          </h2>
          <BooksCollection
            searchQuery={searchQuery}
            selectedGenre={selectedGenre}
            selectedAuthor={selectedAuthor}
            selectedYear={selectedYear}
            selectedLanguage={selectedLanguage}
            priceRange={priceRange}
          />
        </section>

        {/* Popular Categories Section */}
        <section aria-labelledby="popular-categories-heading" className="mt-16">
          <h2 id="popular-categories-heading" className="text-2xl font-bold text-gray-900 mb-6">
            Popular Categories
          </h2>
          <div className="grid md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white/80 backdrop-blur-sm p-6 rounded-xl border border-gray-200 hover:shadow-lg transition-all">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Fiction & Literature</h3>
              <p className="text-gray-600 mb-4">Explore classic and contemporary fiction from renowned authors worldwide.</p>
              <button 
                onClick={() => setSelectedGenre('Fiction')}
                className="text-amber-600 hover:text-amber-700 font-medium"
              >
                Browse Fiction →
              </button>
            </div>
            <div className="bg-white/80 backdrop-blur-sm p-6 rounded-xl border border-gray-200 hover:shadow-lg transition-all">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Hindi Literature</h3>
              <p className="text-gray-600 mb-4">Discover the rich tradition of Hindi literature and contemporary works.</p>
              <button 
                onClick={() => setSelectedLanguage('Hindi')}
                className="text-amber-600 hover:text-amber-700 font-medium"
              >
                Browse Hindi Books →
              </button>
            </div>
            <div className="bg-white/80 backdrop-blur-sm p-6 rounded-xl border border-gray-200 hover:shadow-lg transition-all">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Science & Technology</h3>
              <p className="text-gray-600 mb-4">Stay updated with the latest scientific discoveries and technological advances.</p>
              <button 
                onClick={() => setSelectedGenre('Science')}
                className="text-amber-600 hover:text-amber-700 font-medium"
              >
                Browse Science Books →
              </button>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default BookLibrary;
