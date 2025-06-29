
import React from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { Filter, X } from 'lucide-react';

interface FilterPopupProps {
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
  onClearFilters: () => void;
}

const FilterPopup = ({
  selectedGenre,
  onGenreChange,
  selectedAuthor,
  onAuthorChange,
  selectedYear,
  onYearChange,
  selectedLanguage,
  onLanguageChange,
  priceRange,
  onPriceRangeChange,
  onClearFilters
}: FilterPopupProps) => {
  const genres = ['All', 'Fiction', 'Science', 'History', 'Biography', 'Philosophy', 'Technology', 'Self-Help'];
  const authors = ['All', 'J.K. Rowling', 'Stephen King', 'Agatha Christie', 'Isaac Asimov', 'Maya Angelou', 'Stephen Hawking'];
  const languages = ['All', 'English', 'Spanish', 'French', 'German', 'Italian', 'Portuguese'];

  const hasActiveFilters = selectedGenre !== 'All' || selectedAuthor !== 'All' || 
    selectedYear !== '' || selectedLanguage !== 'All' || 
    priceRange[0] !== 0 || priceRange[1] !== 100;

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button 
          variant="outline" 
          size="sm" 
          className="flex items-center gap-2 bg-white border-2 border-blue-200 hover:border-blue-400 transition-colors"
        >
          <Filter className="w-4 h-4" />
          Filter
          {hasActiveFilters && (
            <span className="bg-blue-500 text-white text-xs px-2 py-1 rounded-full">
              Active
            </span>
          )}
        </Button>
      </SheetTrigger>
      
      <SheetContent side="right" className="w-80 sm:w-96">
        <SheetHeader className="mb-6">
          <SheetTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Filter className="w-5 h-5" />
              Filter Books
            </span>
            {hasActiveFilters && (
              <Button
                variant="outline"
                size="sm"
                onClick={onClearFilters}
                className="text-sm"
              >
                <X className="w-4 h-4 mr-1" />
                Clear All
              </Button>
            )}
          </SheetTitle>
        </SheetHeader>
        
        <div className="space-y-6">
          {/* Genre Filter */}
          <div className="space-y-3">
            <label className="text-sm font-medium text-gray-700 block">Genre</label>
            <Select value={selectedGenre} onValueChange={onGenreChange}>
              <SelectTrigger className="w-full">
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
          <div className="space-y-3">
            <label className="text-sm font-medium text-gray-700 block">Author</label>
            <Select value={selectedAuthor} onValueChange={onAuthorChange}>
              <SelectTrigger className="w-full">
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
          <div className="space-y-3">
            <label className="text-sm font-medium text-gray-700 block">Publication Year</label>
            <Input
              type="number"
              placeholder="e.g. 2020"
              value={selectedYear}
              onChange={(e) => onYearChange(e.target.value)}
              className="w-full"
            />
          </div>

          {/* Language Filter */}
          <div className="space-y-3">
            <label className="text-sm font-medium text-gray-700 block">Language</label>
            <Select value={selectedLanguage} onValueChange={onLanguageChange}>
              <SelectTrigger className="w-full">
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
          <div className="space-y-3">
            <label className="text-sm font-medium text-gray-700 block">
              Price Range: ${priceRange[0]} - ${priceRange[1]}
            </label>
            <div className="px-3">
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
      </SheetContent>
    </Sheet>
  );
};

export default FilterPopup;
