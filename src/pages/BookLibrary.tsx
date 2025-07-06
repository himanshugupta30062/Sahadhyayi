
import React, { useState } from 'react';
import { BookOpen, Users, Database, Plus } from 'lucide-react';
import { SearchBar } from '@/components/ui/search-bar';
import FilterPopup from '@/components/library/FilterPopup';
import BooksCollection from '@/components/library/BooksCollection';
import GenreSelector from '@/components/library/GenreSelector';
import BookSearchBar from '@/components/books/BookSearchBar';
import BookTestGrid from '@/components/books/BookTestGrid';
import SEO from '@/components/SEO';
import { Link } from 'react-router-dom';
import { useBookSearch } from '@/hooks/useBookSearch';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { AlertCircle, RefreshCw } from 'lucide-react';

const BookLibrary = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGenre, setSelectedGenre] = useState<string>('All');
  const [selectedAuthor, setSelectedAuthor] = useState<string>('All');
  const [selectedYear, setSelectedYear] = useState<string>('');
  const [selectedLanguage, setSelectedLanguage] = useState<string>('All');
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 100]);

  // Book search functionality
  const {
    loading: searchLoading,
    error: searchError,
    searchResults,
    searchBooks,
    getAllTestBooks,
    clearResults
  } = useBookSearch();

  // Load existing books from test table on mount
  React.useEffect(() => {
    getAllTestBooks();
  }, []);

  const handleClearFilters = () => {
    setSelectedGenre('All');
    setSelectedAuthor('All');
    setSelectedYear('');
    setSelectedLanguage('All');
    setPriceRange([0, 100]);
  };

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "name": "Sahadhyayi Digital Library",
    "description": "Comprehensive digital book collection with thousands of titles",
    "url": "https://sahadhyayi.com/library",
    "mainEntity": {
      "@type": "ItemList",
      "name": "Book Collection",
      "description": "Digital books across multiple genres and languages"
    },
    "breadcrumb": {
      "@type": "BreadcrumbList",
      "itemListElement": [
        {
          "@type": "ListItem",
          "position": 1,
          "name": "Home",
          "item": "https://sahadhyayi.com"
        },
        {
          "@type": "ListItem",
          "position": 2,
          "name": "Library",
          "item": "https://sahadhyayi.com/library"
        }
      ]
    }
  };

  return (
    <>
      <SEO
        title="Digital Book Library - Browse 10,000+ Books | Sahadhyayi"
        description="Browse our extensive digital library with 10,000+ books across all genres. Find your next great read with free PDFs, community reviews, and personalized recommendations."
        canonical="https://sahadhyayi.com/library"
        url="https://sahadhyayi.com/library"
      />
      <script type="application/ld+json">
        {JSON.stringify(structuredData)}
      </script>
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-white to-orange-50">
      {/* Fixed SEO-optimized header with proper spacing - increased margins */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-amber-200 mt-20 md:mt-24" style={{marginTop: '100px'}}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 pb-20" style={{paddingTop: '40px', paddingBottom: '40px'}}>
          <div className="text-center">
            <div className="flex items-center justify-center space-x-3 mb-8" style={{marginBottom: '30px', marginTop: '20px'}}>
              <div className="p-3 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl shadow-lg">
                <BookOpen className="w-8 h-8 text-white" />
              </div>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent leading-relaxed">
                Digital Library
              </h1>
            </div>
            <h2 className="text-xl sm:text-2xl font-semibold text-gray-800 mb-8 leading-relaxed">
              Discover Your Next Great Read
            </h2>
            <p className="text-gray-600 text-lg max-w-3xl mx-auto mb-8 leading-relaxed">
              Browse our extensive digital library with 10,000+ books across all genres. Find your next great read with free PDFs, community reviews, and personalized recommendations from fellow readers.
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
            <Link 
              to="/reviews" 
              className="inline-flex items-center gap-2 px-4 py-2 bg-amber-100 hover:bg-amber-200 text-amber-800 rounded-lg transition-colors font-medium"
            >
              <Users className="w-4 h-4" />
              Join our reading community
            </Link>
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

        {/* Book Search & Discovery Section */}
        <section aria-labelledby="book-search-heading" className="mt-16">
          <div className="space-y-8">
            <div className="text-center">
              <h2 id="book-search-heading" className="text-3xl font-bold text-gray-900 mb-4">
                Discover New Books
              </h2>
              <p className="text-gray-600 max-w-2xl mx-auto mb-8">
                Search for books from our extensive database using Open Library and Google Books. 
                Found books are automatically added to our collection for everyone to discover.
              </p>
            </div>

            {/* API Book Search Card */}
            <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Database className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">Search & Add Books</h3>
                    <p className="text-sm text-gray-600 font-normal">
                      Search millions of books and add them to our library
                    </p>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex flex-col sm:flex-row items-center gap-4">
                  <div className="flex-1 w-full">
                    <BookSearchBar onSearch={searchBooks} loading={searchLoading} />
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={getAllTestBooks}
                      disabled={searchLoading}
                      className="flex items-center gap-2"
                    >
                      <RefreshCw className="w-4 h-4" />
                      Refresh Library
                    </Button>
                    {searchResults.length > 0 && (
                      <Button
                        variant="ghost"
                        onClick={clearResults}
                        disabled={searchLoading}
                      >
                        Clear Results
                      </Button>
                    )}
                  </div>
                </div>

                <div className="bg-white/60 backdrop-blur-sm p-4 rounded-lg border border-blue-100">
                  <div className="grid sm:grid-cols-2 gap-4 text-sm">
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">How it works:</h4>
                      <ul className="space-y-1 text-gray-600 text-xs">
                        <li>• Search Open Library & Google Books APIs</li>
                        <li>• Automatically prevents duplicate entries</li>
                        <li>• Saves books with covers, descriptions & metadata</li>
                      </ul>
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">Search Tips:</h4>
                      <ul className="space-y-1 text-gray-600 text-xs">
                        <li>• Try book titles, author names, or topics</li>
                        <li>• Use specific terms for better results</li>
                        <li>• Books are added to the community library</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Error Display */}
            {searchError && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{searchError}</AlertDescription>
              </Alert>
            )}

            {/* Search Results */}
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-amber-100 rounded-lg">
                    <BookOpen className="w-5 h-5 text-amber-600" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">
                      Community Book Collection
                    </h3>
                    {searchResults.length > 0 && (
                      <p className="text-sm text-gray-600">
                        {searchResults.length} books available
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <Separator />

              <BookTestGrid books={searchResults} loading={searchLoading} />
            </div>
          </div>
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
                  <Link to="/authors" className="text-amber-600 hover:text-amber-700 font-medium ml-1">Connect with authors</Link> too!
                </p>
                <Link 
                  to="/reviews" 
                  className="inline-flex items-center gap-2 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg transition-colors font-medium"
                >
                  <Users className="w-4 h-4" />
                  Explore Social Feed
                </Link>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Track Your Reading Progress</h3>
                <p className="text-gray-600 mb-4">
                  Monitor your reading goals, track book completion, and celebrate your achievements with the community.
                </p>
                <Link 
                  to="/dashboard" 
                  className="text-amber-600 hover:text-amber-700 font-medium"
                >
                  Track your reading progress →
                </Link>
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
