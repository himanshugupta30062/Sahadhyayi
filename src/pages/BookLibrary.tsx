import React, { useState, useEffect } from 'react';
import { BookOpen, Users } from 'lucide-react';
import { SearchBar } from '@/components/ui/search-bar';
import FilterPopup from '@/components/library/FilterPopup';
import BooksCollection from '@/components/library/BooksCollection';
import GenreSelector from '@/components/library/GenreSelector';
import SEO from '@/components/SEO';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuthors } from '@/hooks/useAuthors';
import AuthorDiscoverySection from '@/components/authors/AuthorDiscoverySection';

const cap = (s: string) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s);

const BookLibrary = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { data: authors = [] } = useAuthors();

  const [searchQuery, setSearchQuery] = useState(() => searchParams.get('q') || '');
  const [selectedGenre, setSelectedGenre] = useState<string>(() => cap(searchParams.get('genre') || '') || 'All');
  const [selectedAuthor, setSelectedAuthor] = useState<string>(() => searchParams.get('author') || 'All');
  const [selectedYear, setSelectedYear] = useState<string>(() => searchParams.get('year') || '');
  const [selectedLanguage, setSelectedLanguage] = useState<string>(() => cap(searchParams.get('language') || '') || 'All');
  const [priceRange, setPriceRange] = useState<[number, number]>(() => {
    const p = searchParams.get('price');
    if (p) {
      const [lo, hi] = p.split('-').map(Number);
      if (!Number.isNaN(lo) && !Number.isNaN(hi)) return [lo, hi];
    }
    return [0, 100];
  });

  useEffect(() => {
    const stored = sessionStorage.getItem('scroll-/library');
    if (stored) {
      const y = Number.parseInt(stored, 10);
      window.scrollTo(0, y);
    }
    return () => {
      sessionStorage.setItem('scroll-/library', String(window.scrollY));
    };
  }, []);

  // Sync filter state -> URL for shareable searches
  useEffect(() => {
    const next = new URLSearchParams();
    if (searchQuery.trim()) next.set('q', searchQuery.trim());
    if (selectedGenre && selectedGenre !== 'All') next.set('genre', selectedGenre);
    if (selectedAuthor && selectedAuthor !== 'All') next.set('author', selectedAuthor);
    if (selectedYear) next.set('year', selectedYear);
    if (selectedLanguage && selectedLanguage !== 'All') next.set('language', selectedLanguage);
    if (priceRange[0] !== 0 || priceRange[1] !== 100) next.set('price', `${priceRange[0]}-${priceRange[1]}`);
    setSearchParams(next, { replace: true });
  }, [searchQuery, selectedGenre, selectedAuthor, selectedYear, selectedLanguage, priceRange, setSearchParams]);

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
        description="Explore our digital library of books across multiple genres. Check each title's available reading options, track progress, and join discussions with fellow readers."
        canonical="https://sahadhyayi.com/library"
        keywords={['digital library', 'online books', 'read books online', 'ebooks', 'book collection', 'reading platform']}
      />
      <script type="application/ld+json">
        {JSON.stringify(structuredData)}
      </script>
      <div className="min-h-screen bg-[#FAFAF8] text-[#1C201D] dark:bg-[#0B0D0C] dark:text-[#F3F0E7]">
      {/* Photo-led Library hero: real bookshelves anchor the page in the act of reading. */}
      <section aria-labelledby="library-hero-title" className="relative isolate overflow-hidden border-b border-[#E8E8E3] bg-[#F4F3EF] dark:border-[#29332D] dark:bg-[#101711]" style={{ scrollMarginTop: '80px' }}>
        <div aria-hidden="true" className="absolute inset-0 bg-cover bg-center opacity-25 dark:opacity-100" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1507842217343-583bb7270b66?auto=format&fit=crop&w=2400&q=85')", backgroundPosition: 'center 48%' }} />
        <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-r from-[#FAFAF8]/95 via-[#FAFAF8]/85 to-[#FAFAF8]/55 dark:bg-gradient-to-r dark:from-[#09120D]/95 dark:via-[#09120D]/79 dark:to-[#09120D]/38" />
        <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-t from-[#F4F3EF]/75 via-transparent to-white/20 dark:from-[#09120D]/70 dark:via-transparent dark:to-[#09120D]/25" />
        <div className="relative mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8 lg:py-20">
          <div className="mx-auto max-w-4xl text-center">
            <div className="flex items-center justify-center space-x-3 mb-8" style={{marginBottom: '30px', marginTop: '20px'}}>
              <div className="p-3 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl shadow-lg">
                <BookOpen className="w-8 h-8 text-white" />
              </div>
              <h1 id="library-hero-title" className="text-3xl sm:text-4xl lg:text-5xl font-bold text-[#1C442D] dark:bg-gradient-to-r dark:from-[#E8CC91] dark:to-[#D5B16D] dark:bg-clip-text dark:text-transparent leading-relaxed">
                Digital Library
              </h1>
            </div>
            <h2 className="text-xl sm:text-2xl font-semibold text-[#26352C] dark:text-[#F3F0E7] mb-8 leading-relaxed">
              Discover Your Next Great Read
            </h2>
            <p className="text-[#59635B] dark:text-white/75 text-lg max-w-3xl mx-auto mb-8 leading-relaxed">
              Browse books across multiple genres and discover your next great read. Reading and PDF availability varies by title; book details show the options currently available.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-4 text-sm text-[#59635B] dark:text-white/65">
              <span>📚 Books Across Genres</span>
              <span>🌍 Multiple Languages</span>
              <span>👥 Active Reading Community</span>
              <span>📖 Title-Specific Reading Options</span>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search and Filters Section */}
        <section aria-labelledby="search-filters-heading">
          <h2 id="search-filters-heading" className="text-2xl font-bold text-[#1C201D] dark:text-[#F3F0E7] mb-6">
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
                <GenreSelector
                  genres={[
                    'All',
                    'Science',
                    'Fiction',
                    'Fantasy',
                    'Mystery',
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

        {!searchQuery.trim() && selectedGenre === 'All' && selectedAuthor === 'All' && !selectedYear && selectedLanguage === 'All' && priceRange[0] === 0 && priceRange[1] === 100 && (
          <AuthorDiscoverySection
            authors={authors}
            title="Explore books by author"
            description="Discover writers already represented in the Sahadhyayi catalogue, then open their profile or browse their books."
            limit={6}
          />
        )}

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
