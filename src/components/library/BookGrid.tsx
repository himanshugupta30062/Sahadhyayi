
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Star, BookOpen, MapPin, Users } from 'lucide-react';
import { useBooksByGenre, useGenres } from '@/hooks/useLibraryBooks';
import type { Book } from '@/hooks/useLibraryBooks';

const BookGrid = () => {
  const [selectedGenre, setSelectedGenre] = useState<string>('All');
  const { data: books = [], isLoading: booksLoading } = useBooksByGenre(selectedGenre);
  const { data: genres = [], isLoading: genresLoading } = useGenres();

  if (booksLoading || genresLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {[...Array(8)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <div className="h-48 bg-gray-200 rounded-t-lg"></div>
            <CardContent className="p-4">
              <div className="h-4 bg-gray-200 rounded mb-2"></div>
              <div className="h-3 bg-gray-200 rounded mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-2/3"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Genre Filter */}
      <div className="flex items-center gap-4">
        <label htmlFor="genre-select" className="text-sm font-medium">
          Filter by Genre:
        </label>
        <Select value={selectedGenre} onValueChange={setSelectedGenre}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Select genre" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="All">All Genres</SelectItem>
            {genres.map((genre: any) => (
              <SelectItem key={genre.id} value={genre.name}>
                {genre.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Books Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {books.map((book: Book) => (
          <Card key={book.id} className="hover:shadow-lg transition-shadow duration-200 overflow-hidden">
            <div className="aspect-[3/4] relative overflow-hidden">
              {book.cover_image_url ? (
                <img
                  src={book.cover_image_url}
                  alt={book.title}
                  className="w-full h-full object-cover hover:scale-105 transition-transform duration-200"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center">
                  <BookOpen className="w-16 h-16 text-gray-400" />
                </div>
              )}
              <div className="absolute top-2 right-2">
                <Badge variant="secondary" className="bg-white/90 text-gray-800">
                  {book.genre}
                </Badge>
              </div>
            </div>
            
            <CardContent className="p-4">
              <div className="space-y-2">
                <h3 className="font-semibold text-lg leading-tight line-clamp-2">
                  {book.title}
                </h3>
                <p className="text-sm text-gray-600">{book.author}</p>
                
                <div className="flex items-center gap-1">
                  <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  <span className="text-sm font-medium">{book.rating.toFixed(1)}</span>
                </div>
                
                {book.description && (
                  <p className="text-xs text-gray-500 line-clamp-2">
                    {book.description}
                  </p>
                )}
                
                <div className="flex items-center justify-between text-xs text-gray-500">
                  {book.location && (
                    <div className="flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      <span>{book.location}</span>
                    </div>
                  )}
                  {book.publication_year && (
                    <span>{book.publication_year}</span>
                  )}
                </div>
                
                {book.community && (
                  <div className="flex items-center gap-1 text-xs text-gray-500">
                    <Users className="w-3 h-3" />
                    <span>{book.community}</span>
                  </div>
                )}
              </div>
              
              <div className="mt-4 flex gap-2">
                <Button size="sm" className="flex-1">
                  <BookOpen className="w-4 h-4 mr-1" />
                  Read
                </Button>
                <Button size="sm" variant="outline" className="flex-1">
                  Add to Shelf
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      
      {books.length === 0 && (
        <div className="text-center py-12">
          <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No books found</h3>
          <p className="text-gray-500">
            {selectedGenre === 'All' 
              ? 'No books are available in the library yet.' 
              : `No books found in the ${selectedGenre} genre.`}
          </p>
        </div>
      )}
    </div>
  );
};

export default BookGrid;
