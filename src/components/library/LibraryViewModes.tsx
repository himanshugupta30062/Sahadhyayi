import React from 'react';
import { Button } from '@/components/ui/button';
import { Grid, List, BookOpen, SortAsc } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface LibraryViewModesProps {
  viewMode: 'grid' | 'list' | 'bookshelf';
  onViewModeChange: (mode: 'grid' | 'list' | 'bookshelf') => void;
  sortBy: string;
  onSortChange: (sort: string) => void;
  totalBooks: number;
}

const LibraryViewModes = ({
  viewMode,
  onViewModeChange,
  sortBy,
  onSortChange,
  totalBooks
}: LibraryViewModesProps) => {
  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-6 bg-white/80 backdrop-blur-sm rounded-xl shadow-lg border border-gray-100 mb-6">
      {/* Results count */}
      <div className="flex items-center gap-2">
        <span className="text-lg font-semibold text-gray-900">
          {totalBooks.toLocaleString()} Books
        </span>
        <span className="text-sm text-gray-500">available in collection</span>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-4">
        {/* Sort dropdown */}
        <div className="flex items-center gap-2">
          <SortAsc className="w-5 h-5 text-gray-500" />
          <Select value={sortBy} onValueChange={onSortChange}>
            <SelectTrigger className="w-48 bg-white border-gray-200">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="title-asc">Title A-Z</SelectItem>
              <SelectItem value="title-desc">Title Z-A</SelectItem>
              <SelectItem value="author-asc">Author A-Z</SelectItem>
              <SelectItem value="author-desc">Author Z-A</SelectItem>
              <SelectItem value="rating-desc">Highest Rated</SelectItem>
              <SelectItem value="rating-asc">Lowest Rated</SelectItem>
              <SelectItem value="popularity-desc">Most Popular</SelectItem>
              <SelectItem value="date-desc">Recently Added</SelectItem>
              <SelectItem value="date-asc">Oldest First</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* View mode toggle */}
        <div className="flex items-center bg-gray-100 rounded-lg p-1">
          <Button
            variant={viewMode === 'grid' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => onViewModeChange('grid')}
            className={`rounded-md px-3 ${
              viewMode === 'grid' 
                ? 'bg-white shadow-sm text-library-primary' 
                : 'text-gray-600 hover:text-gray-900 hover:bg-white/50'
            }`}
          >
            <Grid className="w-4 h-4" />
            <span className="ml-1 hidden sm:inline">Grid</span>
          </Button>
          
          <Button
            variant={viewMode === 'list' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => onViewModeChange('list')}
            className={`rounded-md px-3 ${
              viewMode === 'list' 
                ? 'bg-white shadow-sm text-library-primary' 
                : 'text-gray-600 hover:text-gray-900 hover:bg-white/50'
            }`}
          >
            <List className="w-4 h-4" />
            <span className="ml-1 hidden sm:inline">List</span>
          </Button>
          
          <Button
            variant={viewMode === 'bookshelf' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => onViewModeChange('bookshelf')}
            className={`rounded-md px-3 ${
              viewMode === 'bookshelf' 
                ? 'bg-white shadow-sm text-library-primary' 
                : 'text-gray-600 hover:text-gray-900 hover:bg-white/50'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span className="ml-1 hidden sm:inline">Shelf</span>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default LibraryViewModes;