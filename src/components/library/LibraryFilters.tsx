
import * as React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { Filter } from 'lucide-react';

interface LibraryFiltersProps {
  selectedGenre: string;
  onGenreChange: (genre: string) => void;
  selectedAuthor: string;
  onAuthorChange: (author: string) => void;
  selectedYear: string;
  onYearChange: (year: string) => void;
  selectedLanguage: string;
  onLanguageChange: (language: string) => void;
  priceRange: [number, number];
  onPriceRangeChange: (range: [number, number]) => void;
}

const LibraryFilters = ({
  selectedGenre,
  onGenreChange,
  selectedAuthor,
  onAuthorChange,
  selectedYear,
  onYearChange,
  selectedLanguage,
  onLanguageChange,
  priceRange,
  onPriceRangeChange
}: LibraryFiltersProps) => {
  const genres = ['All', 'Fiction', 'Science', 'History', 'Biography', 'Philosophy', 'Technology', 'Self-Help'];
  const authors = ['All', 'J.K. Rowling', 'Stephen King', 'Agatha Christie', 'Isaac Asimov', 'Maya Angelou'];
  const languages = ['All', 'English', 'Spanish', 'French', 'German', 'Italian', 'Portuguese'];

  return (
    <Card className="mb-8 shadow-lg border-0 bg-white/80 backdrop-blur-sm">
      <CardContent className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <Filter className="w-5 h-5 text-blue-600" />
          <h2 className="text-lg font-semibold text-gray-900">Filter Books</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {/* Genre Filter */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Genre</label>
            <Select value={selectedGenre} onValueChange={onGenreChange}>
              <SelectTrigger className="h-10">
                <SelectValue placeholder="Select genre" />
              </SelectTrigger>
              <SelectContent>
                {genres.map((genre) => (
                  <SelectItem key={genre} value={genre}>
                    {genre}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Author Filter */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Author</label>
            <Select value={selectedAuthor} onValueChange={onAuthorChange}>
              <SelectTrigger className="h-10">
                <SelectValue placeholder="Select author" />
              </SelectTrigger>
              <SelectContent>
                {authors.map((author) => (
                  <SelectItem key={author} value={author}>
                    {author}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Year Filter */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Publication Year</label>
            <Input
              type="number"
              placeholder="e.g. 2020"
              value={selectedYear}
              onChange={(e) => onYearChange(e.target.value)}
              className="h-10"
            />
          </div>

          {/* Language Filter */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Language</label>
            <Select value={selectedLanguage} onValueChange={onLanguageChange}>
              <SelectTrigger className="h-10">
                <SelectValue placeholder="Select language" />
              </SelectTrigger>
              <SelectContent>
                {languages.map((language) => (
                  <SelectItem key={language} value={language}>
                    {language}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Price Range Filter */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">
              Price Range: ${priceRange[0]} - ${priceRange[1]}
            </label>
            <div className="pt-2">
              <Slider
                value={priceRange}
                onValueChange={(value) => onPriceRangeChange(value as [number, number])}
                max={100}
                min={0}
                step={5}
                className="w-full"
              />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default LibraryFilters;
