
import React, { useState } from 'react';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Link } from 'react-router-dom';

const slugify = (text: string) =>
  text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
import { BookOpen } from 'lucide-react';
import { useBooksByGenre, useGenres } from '@/hooks/useLibraryBooks';
import type { Book, Genre } from '@/hooks/useLibraryBooks';

const BookGrid = () => {
  const [selectedGenre, setSelectedGenre] = useState<string>('All');
  const [readIds, setReadIds] = useState<string[]>([]);
  const { data: books = [], isLoading: booksLoading } = useBooksByGenre(selectedGenre);
  const { data: genres = [], isLoading: genresLoading } = useGenres();

  const markAsRead = (id: string) => {
    if (!readIds.includes(id)) {
      setReadIds([...readIds, id]);
    }
  };

  if (booksLoading || genresLoading) {
    return (
      <div className="max-w-7xl mx-auto p-4">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-4 bg-gray-200 rounded mb-2"></div>
                <div className="h-3 bg-gray-200 rounded mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-2/3"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-4">
      {/* Genre Filter */}
      <div className="mb-6 flex items-center gap-4">
        <label htmlFor="genre-select" className="text-sm font-medium">
          Filter by Genre:
        </label>
        <Select value={selectedGenre} onValueChange={setSelectedGenre}>
          <SelectTrigger className="w-48">
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
      </div>

      {/* Books Grid */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {books.map((book: Book) => (
          <Card key={book.id} className="flex flex-col">
            <CardContent className="flex-1 space-y-1 p-6">
              <h3 className="text-lg font-semibold">{book.title}</h3>
              <p className="text-sm text-gray-500">
                <Link to={`/authors/${slugify(book.author)}`} className="underline hover:text-blue-700">
                  {book.author}
                </Link>
              </p>
              {book.genre && (
                <p className="text-xs text-blue-600 font-medium">
                  <Link to={`/library?genre=${encodeURIComponent(book.genre)}`} className="hover:underline">
                    {book.genre}
                  </Link>
                </p>
              )}
              {book.description && (
                <p className="text-sm text-gray-700 line-clamp-2">
                  {book.description}
                </p>
              )}
            </CardContent>
            <CardFooter className="pt-0">
              <Link to={`/books/${book.id}`} className="ml-auto">
                <Button size="sm" className="bg-amber-600 hover:bg-amber-700">
                  About
                </Button>
              </Link>
            </CardFooter>
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
