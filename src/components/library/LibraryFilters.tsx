
import React from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Filter, X, Sparkles } from 'lucide-react';

interface LibraryFiltersProps {
  selectedGenre: string;
  onGenreChange: (genre: string) => void;
  selectedLanguage: string;
  onLanguageChange: (language: string) => void;
  selectedYear: string;
  onYearChange: (year: string) => void;
  searchQuery?: string;
  onClearSearch?: () => void;
  onResetAll?: () => void;
}

const POPULAR_GENRES = [
  'All',
  'Spiritual',
  'Fiction',
  'Hindi',
  'Philosophy',
  'Classics',
  'History',
  'Science',
  'Biography',
];

const LANGUAGES = [
  'All',
  'Hindi',
  'English',
  'Sanskrit',
  'Bengali',
  'Tamil',
  'Marathi',
  'Gujarati',
  'German',
  'French',
  'Spanish',
];

const LibraryFilters = ({
  selectedGenre,
  onGenreChange,
  selectedLanguage,
  onLanguageChange,
  selectedYear,
  onYearChange,
  searchQuery,
  onClearSearch,
  onResetAll,
}: LibraryFiltersProps) => {
  const hasActiveFilters =
    Boolean(searchQuery?.trim()) ||
    (selectedGenre && selectedGenre !== 'All') ||
    (selectedLanguage && selectedLanguage !== 'All') ||
    Boolean(selectedYear?.trim());

  return (
    <div className="mb-6 min-w-0 max-w-full space-y-4 overflow-hidden">
      {/* Genre Navigation Pills */}
      <div className="flex min-w-0 max-w-full items-center gap-2 overflow-x-auto overscroll-x-contain pb-2 scrollbar-none">
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider shrink-0 flex items-center gap-1 mr-1">
          <Sparkles className="w-3.5 h-3.5 text-primary" />
          Genres:
        </span>
        <div className="flex w-max shrink-0 items-center gap-1.5 pr-2">
          {POPULAR_GENRES.map((genre) => {
            const isSelected = selectedGenre === genre;
            return (
              <button
                key={genre}
                onClick={() => onGenreChange(genre)}
                className={`
                  px-3.5 py-1.5 rounded-full text-xs font-medium transition-all duration-200
                  ${
                    isSelected
                      ? 'bg-primary text-primary-foreground shadow-sm scale-105'
                      : 'bg-card text-muted-foreground hover:bg-muted hover:text-foreground border border-border/60'
                  }
                `}
                aria-pressed={isSelected}
              >
                {genre}
              </button>
            );
          })}
        </div>
      </div>

      {/* Secondary Controls: Language & Publication Year */}
      <div className="flex min-w-0 flex-col items-stretch gap-3 rounded-xl border border-border/60 bg-card/60 p-3 backdrop-blur-xs sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
        <div className="flex min-w-0 flex-col items-stretch gap-3 sm:flex-row sm:flex-wrap sm:items-center">
          {/* Language Selector */}
          <div className="flex min-w-0 items-center justify-between gap-2 sm:justify-start">
            <span className="text-xs text-muted-foreground font-medium">Language:</span>
            <Select value={selectedLanguage} onValueChange={onLanguageChange}>
              <SelectTrigger className="h-10 w-[min(9rem,58vw)] text-xs bg-background sm:h-8 sm:w-32">
                <SelectValue placeholder="All Languages" />
              </SelectTrigger>
              <SelectContent className="bg-popover z-50">
                {LANGUAGES.map((lang) => (
                  <SelectItem key={lang} value={lang} className="text-xs">
                    {lang === 'All' ? 'All Languages' : lang}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Publication Year Filter */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground font-medium">Year:</span>
            <Input
              type="number"
              placeholder="e.g. 1950"
              value={selectedYear}
              onChange={(e) => onYearChange(e.target.value)}
              className="h-10 w-28 text-xs bg-background sm:h-8 sm:w-24"
              min={1500}
              max={new Date().getFullYear()}
            />
          </div>
        </div>

        {/* Reset All Button */}
        {hasActiveFilters && onResetAll && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onResetAll}
            className="h-8 text-xs text-muted-foreground hover:text-destructive gap-1 px-2.5"
          >
            <Filter className="w-3.5 h-3.5" />
            Reset all filters
          </Button>
        )}
      </div>

      {/* Active Filter Badges */}
      {hasActiveFilters && (
        <div className="flex flex-wrap items-center gap-2 pt-1">
          <span className="text-xs text-muted-foreground">Active filters:</span>
          {searchQuery?.trim() && onClearSearch && (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs bg-primary/10 text-primary border border-primary/20">
              Query: "{searchQuery}"
              <button
                onClick={onClearSearch}
                aria-label="Remove search filter"
                className="hover:opacity-75"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          )}
          {selectedGenre && selectedGenre !== 'All' && (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs bg-primary/10 text-primary border border-primary/20">
              Genre: {selectedGenre}
              <button
                onClick={() => onGenreChange('All')}
                aria-label={`Remove genre ${selectedGenre} filter`}
                className="hover:opacity-75"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          )}
          {selectedLanguage && selectedLanguage !== 'All' && (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs bg-accent text-accent-foreground border border-border">
              Language: {selectedLanguage}
              <button
                onClick={() => onLanguageChange('All')}
                aria-label={`Remove language ${selectedLanguage} filter`}
                className="hover:opacity-75"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          )}
          {selectedYear?.trim() && (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs bg-muted text-foreground border border-border">
              Year: {selectedYear}
              <button
                onClick={() => onYearChange('')}
                aria-label="Remove year filter"
                className="hover:opacity-75"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          )}
        </div>
      )}
    </div>
  );
};

export default LibraryFilters;

