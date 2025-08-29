import React, { useState } from 'react';
import SEO from '@/components/SEO';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { RefreshCw, Sparkles, BookOpen, Users, Star } from 'lucide-react';
import LibraryHero from '@/components/library/LibraryHero';
import BooksCollection from '@/components/library/BooksCollection';
import ResponsiveBookGrid from '@/components/library/ResponsiveBookGrid';
import { useCommunityStats } from '@/hooks/useCommunityStats';

export default function Library() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGenre, setSelectedGenre] = useState('All');
  const [selectedAuthor, setSelectedAuthor] = useState('All');
  const [selectedYear, setSelectedYear] = useState('');
  const [selectedLanguage, setSelectedLanguage] = useState('All');
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 100]);

  // Get community stats for hero stats
  const { stats: communityStats } = useCommunityStats();

  const handleReset = () => {
    setSearchQuery('');
    setSelectedGenre('All');
    setSelectedAuthor('All');
    setSelectedYear('');
    setSelectedLanguage('All');
    setPriceRange([0, 100]);
  };

  const handleSearch = () => {
    // Search functionality will be handled by BooksCollection
  };


  return (
    <div className="min-h-screen bg-background">
      <SEO 
        title="Enhanced Digital Library - Immersive Reading Experience | Sahadhyayi"
        description="Step into our immersive digital library with interactive features, personalized recommendations, and a vast collection of books across all genres."
        keywords={["digital library", "interactive reading", "book collection", "personalized recommendations", "reading experience", "online books"]}
      />
      
      {/* Hero Section with improved stats */}
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
        {/* Main Books Collection */}
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