import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import SEO from '@/components/SEO';
import Breadcrumb from '@/components/Breadcrumb';
import { Button } from '@/components/ui/button';
import { RefreshCw, PenTool } from 'lucide-react';
import SortingInfoTooltip from '@/components/library/SortingInfoTooltip';
import LibraryHero from '@/components/library/LibraryHero';
import BooksCollection from '@/components/library/BooksCollection';
import { useCommunityStats } from '@/hooks/useCommunityStats';

export default function Library() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGenre, setSelectedGenre] = useState('All');
  const [selectedAuthor, setSelectedAuthor] = useState('All');
  const [selectedYear, setSelectedYear] = useState('');
  const [selectedLanguage, setSelectedLanguage] = useState('All');
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 100]);

  const { stats: communityStats } = useCommunityStats();

  const normalizedParams = useMemo(
    () => ({
      search: searchParams.get('search') ?? '',
      genre: searchParams.get('genre') ?? 'All',
      author: searchParams.get('author') ?? 'All',
      year: searchParams.get('year') ?? '',
      language: searchParams.get('language') ?? 'All',
    }),
    [searchParams],
  );

  useEffect(() => {
    setSearchQuery(normalizedParams.search);
    setSelectedGenre(normalizedParams.genre);
    setSelectedAuthor(normalizedParams.author);
    setSelectedYear(normalizedParams.year);
    setSelectedLanguage(normalizedParams.language);
  }, [normalizedParams]);

  const updateLibraryParams = (nextParams: {
    search?: string;
    genre?: string;
    author?: string;
    year?: string;
    language?: string;
  }) => {
    const params = new URLSearchParams(searchParams);

    Object.entries(nextParams).forEach(([key, value]) => {
      const normalizedValue = (value ?? '').trim();
      const shouldDelete = !normalizedValue || normalizedValue === 'All';

      if (shouldDelete) {
        params.delete(key);
      } else {
        params.set(key, normalizedValue);
      }
    });

    setSearchParams(params, { replace: true });
  };

  const handleReset = () => {
    setSearchQuery('');
    setSelectedGenre('All');
    setSelectedAuthor('All');
    setSelectedYear('');
    setSelectedLanguage('All');
    setPriceRange([0, 100]);
    setSearchParams({}, { replace: true });
  };

  const handleSearch = () => {
    updateLibraryParams({
      search: searchQuery,
      genre: selectedGenre,
      author: selectedAuthor,
      year: selectedYear,
      language: selectedLanguage,
    });
  };

  const hasActiveFilters =
    !!searchQuery ||
    selectedGenre !== 'All' ||
    selectedAuthor !== 'All' ||
    !!selectedYear ||
    selectedLanguage !== 'All';

  const breadcrumbItems = [{ name: 'Library', path: '/library', current: true }];

  return (
    <div className="min-h-screen bg-background">
      <SEO
        title="Digital Library | Sahadhyayi"
        description="Step into our immersive digital library with interactive features, personalized recommendations, and a vast collection of books across all genres."
        keywords={[
          'digital library',
          'interactive reading',
          'book collection',
          'personalized recommendations',
          'reading experience',
          'online books',
        ]}
      />

      <LibraryHero
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onSearch={handleSearch}
        totalBooks={12500}
        activeReaders={communityStats?.totalSignups || 3200}
        avgRating={4.8}
        booksAddedToday={47}
      />

      <div className="container mx-auto px-4 py-8">
        <div className="mb-6 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Breadcrumb items={breadcrumbItems} />
            <SortingInfoTooltip />
          </div>

          <div className="flex items-center gap-2">
            {hasActiveFilters && (
              <Button variant="outline" onClick={handleReset} className="gap-2">
                <RefreshCw className="h-4 w-4" />
                Reset filters
              </Button>
            )}

            <Button onClick={() => navigate('/publish')} className="gap-2">
              <PenTool className="h-4 w-4" />
              Publish Your Book
            </Button>
          </div>
        </div>

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
}
