
import React, { useState } from 'react';
import { BookOpen, Users } from 'lucide-react';
import { SearchBar } from '@/components/ui/search-bar';
import FilterPopup from '@/components/library/FilterPopup';
import BooksCollection from '@/components/library/BooksCollection';
import GenreSelector from '@/components/library/GenreSelector';
import SEO from '@/components/SEO';

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
    <>
      <SEO
        title="Sahadhyayi Digital Library"
        description="Browse thousands of books across genres in Sahadhyayi's online library."/>
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-white to-orange-50">
      {/* SEO-optimized header */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-amber-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center">
            <div className="flex items-center justify-center space-x-3 mb-6">
              <div className="p-3 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl shadow-lg">
                <BookOpen className="w-8 h-8 text-white" />
              </div>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent">
                Digital Library Collection
              </h1>
            </div>
            <p className="text-gray-600 text-lg max-w-3xl mx-auto mb-6">
              Discover and explore our vast collection of books from around the world. Browse through thousands of titles across multiple genres and languages. Connect with fellow readers and join our vibrant reading community.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-4 text-sm text-gray-500">
              <span>📚 10,000+ Books</span>
              <span>🌍 Multiple Languages</span>
              <span>👥 Active Reading Community</span>
              <span>📖 Free PDF Downloads</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search and Filters Section */}
        <section aria-labelledby="search-filters-heading">
          <h2 id="search-filters-heading" className="text-2xl font-bold text-gray-900 mb-6">
            Find Your Next Great Read
          </h2>
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
          <div className="flex items-center justify-between mb-6">
            <h2 id="books-collection-heading" className="text-2xl font-bold text-gray-900">
              Available Books
            </h2>
            <a 
              href="/reviews" 
              className="inline-flex items-center gap-2 px-4 py-2 bg-amber-100 hover:bg-amber-200 text-amber-800 rounded-lg transition-colors font-medium"
            >
              <Users className="w-4 h-4" />
              Join Reading Community
            </a>
          </div>
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
            Popular Reading Categories
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

        {/* Community Features Section */}
        <section aria-labelledby="community-features-heading" className="mt-16">
          <h2 id="community-features-heading" className="text-2xl font-bold text-gray-900 mb-6">
            Join Our Reading Community
          </h2>
          <div className="bg-gradient-to-r from-amber-50 to-orange-50 p-6 rounded-xl border border-amber-200">
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Connect with Fellow Readers</h3>
                <p className="text-gray-600 mb-4">
                  Share your reading journey, discover what others are reading, and join discussions about your favorite books.
                </p>
                <a 
                  href="/reviews" 
                  className="inline-flex items-center gap-2 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg transition-colors font-medium"
                >
                  <Users className="w-4 h-4" />
                  Explore Social Feed
                </a>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Find Reading Partners</h3>
                <p className="text-gray-600 mb-4">
                  Discover readers who are enjoying the same books as you and start meaningful conversations.
                </p>
                <a 
                  href="/reading-groups" 
                  className="text-amber-600 hover:text-amber-700 font-medium"
                >
                  Join Reading Groups →
                </a>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
    </>
  );
};

export default BookLibrary;
