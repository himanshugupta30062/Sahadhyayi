import React, { useState } from 'react';
import SEO from '@/components/SEO';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, RefreshCw } from 'lucide-react';
import BooksCollection from '@/components/library/BooksCollection';

export default function Library() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGenre, setSelectedGenre] = useState('All');
  const [selectedAuthor, setSelectedAuthor] = useState('All');
  const [selectedYear, setSelectedYear] = useState('');
  const [selectedLanguage, setSelectedLanguage] = useState('All');
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 100]);

  const handleReset = () => {
    setSearchQuery('');
    setSelectedGenre('All');
    setSelectedAuthor('All');
    setSelectedYear('');
    setSelectedLanguage('All');
    setPriceRange([0, 100]);
  };

  return (
    <div className="min-h-screen bg-background">
      <SEO 
        title="Sahadhyayi Digital Library - Free Books Collection"
        description="Explore our vast collection of free digital books. Read, download, and discover books in multiple languages and genres."
        keywords={["digital library", "free books", "online reading", "Hindi books", "English books", "download books"]}
      />
      
      <div className="container mx-auto px-4 py-8 space-y-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent mb-4">
            सहाध्यायी Digital Library
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Discover, read, and download from our vast collection of digital books. 
            Access literature in multiple languages and genres, all for free.
          </p>
        </div>

        {/* Search and Filters Section */}
        <Card className="bg-gradient-to-r from-primary/5 to-primary/10 border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Search className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h3 className="text-lg font-bold">Search & Filter Books</h3>
                <p className="text-sm text-muted-foreground font-normal">
                  Find your next great read from our collection
                </p>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Search Input */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Search books, authors..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>

              {/* Genre Filter */}
              <Select value={selectedGenre} onValueChange={setSelectedGenre}>
                <SelectTrigger>
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
                <SelectTrigger>
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
              <Button variant="outline" onClick={handleReset} className="flex items-center gap-2">
                <RefreshCw className="w-4 h-4" />
                Reset Filters
              </Button>
            </div>

            {/* Publication Year Filter */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Publication Year</label>
                <Input
                  type="number"
                  placeholder="e.g. 2020"
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(e.target.value)}
                  min="1900"
                  max={new Date().getFullYear()}
                />
              </div>
            </div>
          </CardContent>
        </Card>

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