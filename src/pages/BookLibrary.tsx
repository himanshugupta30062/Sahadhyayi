import React, { useState, useEffect } from 'react';
import { BookOpen, Users } from 'lucide-react';
import { SearchBar } from '@/components/ui/search-bar';
import FilterPopup from '@/components/library/FilterPopup';
import BooksCollection from '@/components/library/BooksCollection';
import GenreSelector from '@/components/library/GenreSelector';
import { useGenres } from '@/hooks/useLibraryBooks';
import SEO from '@/components/SEO';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';

const BookLibrary = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGenre, setSelectedGenre] = useState<string>('All');
  const [selectedAuthor, setSelectedAuthor] = useState<string>('All');
  const [selectedYear, setSelectedYear] = useState<string>('');
  const [selectedLanguage, setSelectedLanguage] = useState<string>('All');
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 100]);

  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const { data: genresData } = useGenres();

  const availableGenres = React.useMemo(() => {
    const set = new Set<string>(['All']);
    genresData?.forEach(g => set.add(g.name));
    return Array.from(set);
  }, [genresData]);

  useEffect(() => {
    const stored = sessionStorage.getItem('scroll-/library');
    if (stored) {
      const y = parseInt(stored, 10);
      window.scrollTo(0, y);
    }
    return () => {
      sessionStorage.setItem('scroll-/library', String(window.scrollY));
    };
  }, []);

  useEffect(() => {
    const genreParam = searchParams.get('genre');
    const languageParam = searchParams.get('language');

    if (genreParam) {
      setSelectedGenre(genreParam.charAt(0).toUpperCase() + genreParam.slice(1));
    }

    if (languageParam) {
      setSelectedLanguage(languageParam.charAt(0).toUpperCase() + languageParam.slice(1));
    }
  }, [searchParams]);

  const handleClearFilters = () => {
    setSelectedGenre('All');
    setSelectedAuthor('All');
    setSelectedYear('');
    setSelectedLanguage('All');
    setPriceRange([0, 100]);
  };

  const handleSearch = () => {
    setSearchQuery((q) => q.trim());
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
        title="Digital Book Library - Discover & Read Books Online | Sahadhyayi"
        description="Explore our comprehensive digital library with thousands of books across all genres. Read online, track progress, and join discussions with fellow readers worldwide."
        canonical="https://sahadhyayi.com/library"
        keywords={['digital library', 'online books', 'read books online', 'ebooks', 'book collection', 'reading platform']}
      />
      <script type="application/ld+json">
        {JSON.stringify(structuredData)}
      </script>
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-white to-orange-50">
      {/* Fixed SEO-optimized header with proper spacing */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-amber-200" style={{scrollMarginTop: '80px'}}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
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
                    onSearch={handleSearch}
                    placeholder="Search books, authors, genres..."
                    className="bg-white/90 backdrop-blur-sm border-2 border-amber-200 focus-within:border-amber-400 rounded-xl shadow-sm"
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
                {availableGenres.length > 0 && (
                  <GenreSelector
                    genres={availableGenres}
                    selected={selectedGenre}
                    onSelect={setSelectedGenre}
                  />
                )}
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
              to="/social"
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
                onClick={() => navigate('/library?genre=Fiction')}
                className="text-amber-600 hover:text-amber-700 font-medium"
              >
                Browse Fiction →
              </button>
            </div>
            <div className="bg-white/80 backdrop-blur-sm p-6 rounded-xl border border-gray-200 hover:shadow-lg transition-all">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Hindi Literature</h3>
              <p className="text-gray-600 mb-4">Discover the rich tradition of Hindi literature and contemporary works.</p>
              <button
                onClick={() => navigate('/library?language=Hindi')}
                className="text-amber-600 hover:text-amber-700 font-medium"
              >
                Browse Hindi Books →
              </button>
            </div>
            <div className="bg-white/80 backdrop-blur-sm p-6 rounded-xl border border-gray-200 hover:shadow-lg transition-all">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Science & Technology</h3>
              <p className="text-gray-600 mb-4">Stay updated with the latest scientific discoveries and technological advances.</p>
              <button
                onClick={() => navigate('/library?genre=Science')}
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
                  to="/social"
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
