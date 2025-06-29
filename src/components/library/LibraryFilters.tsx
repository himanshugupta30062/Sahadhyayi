
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { useGenres } from '@/hooks/useLibraryBooks';
import type { Genre } from '@/hooks/useLibraryBooks';

interface LibraryFiltersProps {
  selectedGenre: string;
  onGenreChange: (genre: string) => void;
  ratingFilter: number[];
  onRatingFilterChange: (rating: number[]) => void;
  shelfFilter: string;
  onShelfFilterChange: (shelf: string) => void;
}

const LibraryFilters = ({
  selectedGenre,
  onGenreChange,
  ratingFilter,
  onRatingFilterChange,
  shelfFilter,
  onShelfFilterChange
}: LibraryFiltersProps) => {
  const { data: genres = [] } = useGenres();

  const shelves = [
    { id: 'all', name: 'All Books' },
    { id: 'want-to-read', name: 'Want to Read' },
    { id: 'currently-reading', name: 'Currently Reading' },
    { id: 'read', name: 'Read' },
    { id: 'did-not-finish', name: 'Did Not Finish' }
  ];

  return (
    <div className="w-64 space-y-6">
      {/* Genres Filter */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Genres</CardTitle>
        </CardHeader>
        <CardContent>
          <Select value={selectedGenre} onValueChange={onGenreChange}>
            <SelectTrigger>
              <SelectValue placeholder="Select genre" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="All">All Genres</SelectItem>
              {genres.map((genre: Genre) => (
                <SelectItem key={genre.id} value={genre.name}>
                  {genre.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Rating Filter */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Average Rating</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex justify-between text-sm text-gray-600">
              <span>{ratingFilter[0]} stars</span>
              <span>{ratingFilter[1]} stars</span>
            </div>
            <Slider
              value={ratingFilter}
              onValueChange={onRatingFilterChange}
              max={5}
              min={0}
              step={0.5}
              className="w-full"
            />
          </div>
        </CardContent>
      </Card>

      {/* Shelf Filter */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">My Shelves</CardTitle>
        </CardHeader>
        <CardContent>
          <Select value={shelfFilter} onValueChange={onShelfFilterChange}>
            <SelectTrigger>
              <SelectValue placeholder="Select shelf" />
            </SelectTrigger>
            <SelectContent>
              {shelves.map((shelf) => (
                <SelectItem key={shelf.id} value={shelf.id}>
                  {shelf.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Publication Year - Simple for now */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Publication Year</CardTitle>
        </CardHeader>
        <CardContent>
          <Select defaultValue="all">
            <SelectTrigger>
              <SelectValue placeholder="Select year range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Years</SelectItem>
              <SelectItem value="2020s">2020s</SelectItem>
              <SelectItem value="2010s">2010s</SelectItem>
              <SelectItem value="2000s">2000s</SelectItem>
              <SelectItem value="1990s">1990s</SelectItem>
              <SelectItem value="older">Before 1990</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>
    </div>
  );
};

export default LibraryFilters;
