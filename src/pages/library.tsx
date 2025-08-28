import React, { useState } from 'react';
import SEO from '@/components/SEO';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { RefreshCw, Sparkles, BookOpen, Users, Star } from 'lucide-react';
import LibraryHero from '@/components/library/LibraryHero';
import LibraryViewModes from '@/components/library/LibraryViewModes';
import LibraryStats from '@/components/library/LibraryStats';
import InteractiveBookCard from '@/components/library/InteractiveBookCard';
import { useLibraryBooks } from '@/hooks/useLibraryBooks';

export default function Library() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGenre, setSelectedGenre] = useState('All');
  const [selectedAuthor, setSelectedAuthor] = useState('All');
  const [selectedYear, setSelectedYear] = useState('');
  const [selectedLanguage, setSelectedLanguage] = useState('All');
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 100]);
  const [viewMode, setViewMode] = useState<'grid' | 'list' | 'bookshelf'>('grid');
  const [sortBy, setSortBy] = useState('popularity-desc');

  // Use the library books hook
  const { data: books = [], isLoading, error } = useLibraryBooks();

  const handleReset = () => {
    setSearchQuery('');
    setSelectedGenre('All');
    setSelectedAuthor('All');
    setSelectedYear('');
    setSelectedLanguage('All');
    setPriceRange([0, 100]);
  };

  const handleSearch = () => {
    // Search functionality will be handled by filtering
  };

  const handleDownloadPDF = (book: any) => {
    if (book.pdf_url) {
      window.open(book.pdf_url, '_blank');
    }
  };

  // Filter and sort books
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

    // Genre filter
    if (selectedGenre !== 'All') {
      filtered = filtered.filter(book => book.genre === selectedGenre);
    }

    // Language filter
    if (selectedLanguage !== 'All') {
      filtered = filtered.filter(book => book.language === selectedLanguage);
    }

    // Year filter
    if (selectedYear) {
      filtered = filtered.filter(book => 
        book.publication_year && book.publication_year.toString() === selectedYear
      );
    }

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
        case 'date-desc':
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        case 'date-asc':
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        default:
          return 0;
      }
    });

    return filtered;
  }, [books, searchQuery, selectedGenre, selectedLanguage, selectedYear, sortBy]);

  if (error) {
    return (
      <div className="min-h-screen bg-neutral flex items-center justify-center">
        <Card className="p-8 text-center">
          <CardContent>
            <p className="text-red-500 mb-4">Error loading library: {error.message}</p>
            <Button onClick={() => window.location.reload()}>Try Again</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral">
      <SEO 
        title="Enhanced Digital Library - Immersive Reading Experience | Sahadhyayi"
        description="Step into our immersive digital library with interactive features, personalized recommendations, and a vast collection of books across all genres."
        keywords={["digital library", "interactive reading", "book collection", "personalized recommendations", "reading experience", "online books"]}
      />
      
      {/* Hero Section */}
      <LibraryHero
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onSearch={handleSearch}
        totalBooks={books.length}
        activeReaders={2847}
      />

      <div className="page-container space-y-8">
        {/* Two-column layout */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Main content */}
          <div className="lg:col-span-3 space-y-6">
            {/* Enhanced Filters */}
            <Card className="bg-gradient-to-r from-library-primary/5 to-library-secondary/5 border-library-primary/20">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-library-primary/10 rounded-lg">
                    <Sparkles className="w-5 h-5 text-library-primary" />
                  </div>
                  <h3 className="text-lg font-bold">Advanced Filters</h3>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Genre Filter */}
                  <Select value={selectedGenre} onValueChange={setSelectedGenre}>
                    <SelectTrigger className="bg-white">
                      <SelectValue placeholder="Select Genre" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="All">All Genres</SelectItem>
                      <SelectItem value="Fiction">Fiction</SelectItem>
                      <SelectItem value="Non-Fiction">Non-Fiction</SelectItem>
                      <SelectItem value="Science">Science</SelectItem>
                      <SelectItem value="History">History</SelectItem>
                      <SelectItem value="Biography">Biography</SelectItem>
                      <SelectItem value="Philosophy">Philosophy</SelectItem>
                      <SelectItem value="Hindi">Hindi Literature</SelectItem>
                    </SelectContent>
                  </Select>

                  {/* Language Filter */}
                  <Select value={selectedLanguage} onValueChange={setSelectedLanguage}>
                    <SelectTrigger className="bg-white">
                      <SelectValue placeholder="Select Language" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="All">All Languages</SelectItem>
                      <SelectItem value="English">English</SelectItem>
                      <SelectItem value="Hindi">Hindi</SelectItem>
                      <SelectItem value="Sanskrit">Sanskrit</SelectItem>
                      <SelectItem value="Urdu">Urdu</SelectItem>
                    </SelectContent>
                  </Select>

                  {/* Reset Button */}
                  <Button variant="outline" onClick={handleReset} className="bg-white">
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Reset All
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* View Controls */}
            <LibraryViewModes
              viewMode={viewMode}
              onViewModeChange={setViewMode}
              sortBy={sortBy}
              onSortChange={setSortBy}
              totalBooks={filteredBooks.length}
            />

            {/* Books Display */}
            {isLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {[...Array(12)].map((_, i) => (
                  <Card key={i} className="animate-pulse">
                    <div className="aspect-[3/4] bg-gray-200" />
                    <CardContent className="p-4 space-y-2">
                      <div className="h-4 bg-gray-200 rounded" />
                      <div className="h-3 bg-gray-200 rounded w-2/3" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : filteredBooks.length === 0 ? (
              <Card className="p-12 text-center">
                <CardContent>
                  <BookOpen className="w-16 h-16 text-brand mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-brand mb-2">No Books Found</h3>
                  <p className="mb-4">
                    Try adjusting your search criteria or filters to find more books.
                  </p>
                  <Button onClick={handleReset} variant="outline" className="btn-primary">
                    Clear Filters
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className={`${
                viewMode === 'grid' 
                  ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6' 
                  : viewMode === 'bookshelf'
                    ? 'grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-4'
                    : 'space-y-4'
              }`}>
                {filteredBooks.map((book) => (
                  <InteractiveBookCard
                    key={book.id}
                    book={book}
                    viewMode={viewMode}
                    onDownloadPDF={handleDownloadPDF}
                  />
                ))}
              </div>
            )}

            {/* Featured Collections */}
            <div className="grid md:grid-cols-3 gap-6 mt-12">
              <Card className="bg-neutral border-brand">
                <CardContent className="p-6 text-center">
                  <div className="p-3 bg-brand text-white rounded-full w-fit mx-auto mb-4">
                    <Star className="w-6 h-6" />
                  </div>
                  <h3 className="font-semibold text-brand mb-2">Editor's Choice</h3>
                  <p className="text-sm mb-4">Handpicked books by our editorial team</p>
                  <Button variant="outline" size="sm" className="btn-primary">Explore</Button>
                </CardContent>
              </Card>

              <Card className="bg-neutral border-brand">
                <CardContent className="p-6 text-center">
                  <div className="p-3 bg-brand text-white rounded-full w-fit mx-auto mb-4">
                    <Users className="w-6 h-6" />
                  </div>
                  <h3 className="font-semibold text-brand mb-2">Community Favorites</h3>
                  <p className="text-sm mb-4">Most loved books by our readers</p>
                  <Button variant="outline" size="sm" className="btn-primary">Discover</Button>
                </CardContent>
              </Card>

              <Card className="bg-neutral border-brand">
                <CardContent className="p-6 text-center">
                  <div className="p-3 bg-brand text-white rounded-full w-fit mx-auto mb-4">
                    <Sparkles className="w-6 h-6" />
                  </div>
                  <h3 className="font-semibold text-brand mb-2">New Arrivals</h3>
                  <p className="text-sm mb-4">Latest additions to our collection</p>
                  <Button variant="outline" size="sm" className="btn-primary">Browse</Button>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Sidebar with stats */}
          <div className="lg:col-span-1">
            <LibraryStats />
          </div>
        </div>
      </div>
    </div>
  );
};