import React, { useState, useEffect } from 'react';
import SEO from '@/components/SEO';
import { useAllLibraryBooks } from '@/hooks/useLibraryBooks';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { BookOpen, Download, Plus, Search, Grid, List, X, Calendar, FileText, Globe, User, ChevronLeft, ChevronRight } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import CurrentReads from '@/components/library/CurrentReads';

interface Book {
  id: string;
  title: string;
  author?: string | null;
  genre?: string | null;
  language?: string | null;
  cover_image_url?: string | null;
  description?: string | null;
  publication_year?: number | null;
  pages?: number | null;
  pdf_url?: string | null;
}

export default function Library() {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGenre, setSelectedGenre] = useState<string>('');
  const [selectedLanguage, setSelectedLanguage] = useState<string>('');
  const [sortBy, setSortBy] = useState<string>('title');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const booksPerPage = 24;

  const { data: books = [], isLoading, error } = useAllLibraryBooks();

  // Filter and search logic
  const filteredBooks = React.useMemo(() => {
    let result = books;

    // Search filter
    if (searchQuery) {
      result = result.filter(book => 
        book.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        book.author?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        book.description?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Genre filter
    if (selectedGenre) {
      result = result.filter(book => book.genre === selectedGenre);
    }

    // Language filter
    if (selectedLanguage) {
      result = result.filter(book => book.language === selectedLanguage);
    }

    // Sort
    result.sort((a, b) => {
      switch (sortBy) {
        case 'title':
          return a.title.localeCompare(b.title);
        case 'author':
          return (a.author || '').localeCompare(b.author || '');
        case 'year':
          return (b.publication_year || 0) - (a.publication_year || 0);
        default:
          return 0;
      }
    });

    return result;
  }, [books, searchQuery, selectedGenre, selectedLanguage, sortBy]);

  // Pagination
  const totalPages = Math.ceil(filteredBooks.length / booksPerPage);
  const startIndex = (currentPage - 1) * booksPerPage;
  const currentBooks = filteredBooks.slice(startIndex, startIndex + booksPerPage);

  // Get unique values for filters
  const genres = React.useMemo(() => {
    const genreSet = new Set(books.map(book => book.genre).filter(Boolean));
    return Array.from(genreSet).sort();
  }, [books]);

  const languages = React.useMemo(() => {
    const languageSet = new Set(books.map(book => book.language).filter(Boolean));
    return Array.from(languageSet).sort();
  }, [books]);

  const handleClearFilters = () => {
    setSearchQuery('');
    setSelectedGenre('');
    setSelectedLanguage('');
    setSortBy('title');
    setCurrentPage(1);
  };

  const handleAddToLibrary = async (book: Book) => {
    try {
      const { error } = await supabase
        .from('user_books')
        .insert({
          user_id: (await supabase.auth.getUser()).data.user?.id,
          book_id: book.id,
          status: 'want_to_read'
        });

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Book added to your library!'
      });
    } catch (error) {
      console.error('Error adding book to library:', error);
      toast({
        title: 'Error',
        description: 'Failed to add book to library. Please try again.',
        variant: 'destructive'
      });
    }
  };

  const handleDownload = (book: Book) => {
    if (book.pdf_url) {
      window.open(book.pdf_url, '_blank');
    } else {
      toast({
        title: 'Download Unavailable',
        description: 'PDF not available for this book',
        variant: 'destructive'
      });
    }
  };

  const BookCard = ({ book, viewMode: cardViewMode = 'grid' }: { book: Book; viewMode?: 'grid' | 'list' }) => {
    const truncateText = (text: string, length: number) => {
      return text.length > length ? text.substring(0, length) + '...' : text;
    };

    if (cardViewMode === 'list') {
      return (
        <Card className="hover:shadow-lg transition-shadow cursor-pointer overflow-hidden">
          <div className="flex" onClick={() => setSelectedBook(book)}>
            {/* Book Cover */}
            <div className="w-32 h-48 flex-shrink-0">
              {book.cover_image_url ? (
                <img
                  src={book.cover_image_url}
                  alt={book.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-muted flex items-center justify-center">
                  <BookOpen className="h-8 w-8 text-muted-foreground" />
                </div>
              )}
            </div>

            {/* Book Details */}
            <CardContent className="flex-1 p-6">
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                  <h3 className="font-semibold text-lg mb-1">
                    {book.title}
                  </h3>
                  {book.author && (
                    <p className="text-muted-foreground mb-2">by {book.author}</p>
                  )}
                  
                  <div className="flex flex-wrap gap-2 mb-3">
                    {book.genre && (
                      <Badge variant="secondary">{book.genre}</Badge>
                    )}
                    {book.language && (
                      <Badge variant="outline">{book.language}</Badge>
                    )}
                  </div>

                  {book.description && (
                    <p className="text-sm text-muted-foreground mb-4">
                      {truncateText(book.description, 200)}
                    </p>
                  )}

                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    {book.publication_year && (
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        {book.publication_year}
                      </div>
                    )}
                    {book.pages && (
                      <div className="flex items-center gap-1">
                        <FileText className="h-4 w-4" />
                        {book.pages} pages
                      </div>
                    )}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col gap-2 ml-4">
                  <Button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleAddToLibrary(book);
                    }}
                    size="sm"
                    className="w-32"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add to Library
                  </Button>
                  <Button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDownload(book);
                    }}
                    variant="outline"
                    size="sm"
                    className="w-32"
                    disabled={!book.pdf_url}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download
                  </Button>
                </div>
              </div>
            </CardContent>
          </div>
        </Card>
      );
    }

    return (
      <Card className="group hover:shadow-lg transition-all duration-300 cursor-pointer overflow-hidden h-full">
        <div className="aspect-[3/4] relative overflow-hidden" onClick={() => setSelectedBook(book)}>
          {book.cover_image_url ? (
            <img
              src={book.cover_image_url}
              alt={book.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="w-full h-full bg-muted flex items-center justify-center">
              <BookOpen className="h-8 w-8 text-muted-foreground" />
            </div>
          )}
          
          {/* Overlay with quick actions */}
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/60 transition-colors duration-300 flex items-center justify-center opacity-0 group-hover:opacity-100">
            <div className="flex gap-2">
              <Button 
                size="sm" 
                variant="secondary" 
                onClick={(e) => {
                  e.stopPropagation();
                  handleAddToLibrary(book);
                }}
              >
                <Plus className="h-4 w-4" />
              </Button>
              <Button 
                size="sm" 
                variant="secondary" 
                onClick={(e) => {
                  e.stopPropagation();
                  handleDownload(book);
                }} 
                disabled={!book.pdf_url}
              >
                <Download className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        <CardContent className="p-4" onClick={() => setSelectedBook(book)}>
          <h3 className="font-semibold text-sm mb-1 line-clamp-2 min-h-[2.5rem]">
            {book.title}
          </h3>
          
          {book.author && (
            <p className="text-xs text-muted-foreground mb-2 line-clamp-1">
              {book.author}
            </p>
          )}

          <div className="flex flex-wrap gap-1 mb-2">
            {book.genre && (
              <Badge variant="secondary" className="text-xs px-2 py-0">
                {book.genre}
              </Badge>
            )}
            {book.language && (
              <Badge variant="outline" className="text-xs px-2 py-0">
                {book.language}
              </Badge>
            )}
          </div>

          <div className="flex items-center justify-between text-xs text-muted-foreground">
            {book.publication_year && (
              <span>{book.publication_year}</span>
            )}
            {book.pages && (
              <span>{book.pages}p</span>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  const LoadingGrid = () => (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-6">
      {Array.from({ length: 24 }).map((_, index) => (
        <div key={index} className="space-y-3">
          <Skeleton className="aspect-[3/4] w-full rounded-lg" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-3 w-2/3" />
            <div className="flex gap-1">
              <Skeleton className="h-5 w-12 rounded-full" />
              <Skeleton className="h-5 w-16 rounded-full" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );

  const Pagination = () => {
    if (totalPages <= 1) return null;

    return (
      <div className="flex items-center justify-center gap-2 mt-8">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setCurrentPage(currentPage - 1)}
          disabled={currentPage === 1}
        >
          <ChevronLeft className="h-4 w-4" />
          Previous
        </Button>

        <div className="flex items-center gap-1">
          {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
            const page = i + 1;
            return (
              <Button
                key={page}
                variant={currentPage === page ? 'default' : 'outline'}
                size="sm"
                onClick={() => setCurrentPage(page)}
                className="min-w-[40px]"
              >
                {page}
              </Button>
            );
          })}
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => setCurrentPage(currentPage + 1)}
          disabled={currentPage === totalPages}
        >
          Next
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    );
  };

  if (error) {
    console.error('Library error:', error);
    return (
      <div className="min-h-screen bg-background">
        <SEO 
          title="Digital Library - Error"
          description="Error loading digital library"
        />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-destructive mb-4">Error Loading Library</h1>
            <p className="text-muted-foreground mb-4">
              {error instanceof Error ? error.message : 'Something went wrong. Please try again later.'}
            </p>
            <Button onClick={() => window.location.reload()}>
              Try Again
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <SEO 
        title="Sahadhyayi Digital Library - Free Books Collection"
        description="Explore our vast collection of free digital books. Read, download, and discover books in multiple languages and genres."
        keywords={["digital library", "free books", "online reading", "Hindi books", "English books", "download books"]}
      />
      
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="text-center mb-8">
            <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent mb-4">
              सहाध्यायी Digital Library
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Discover, read, and download from our vast collection of digital books. 
              Access literature in multiple languages and genres, all for free.
            </p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-card rounded-lg p-6 text-center border shadow-sm">
              <BookOpen className="h-8 w-8 text-primary mx-auto mb-2" />
              <div className="text-2xl font-bold text-foreground">{books.length.toLocaleString()}</div>
              <div className="text-sm text-muted-foreground">Total Books</div>
            </div>
            
            <div className="bg-card rounded-lg p-6 text-center border shadow-sm">
              <User className="h-8 w-8 text-primary mx-auto mb-2" />
              <div className="text-2xl font-bold text-foreground">50K+</div>
              <div className="text-sm text-muted-foreground">Active Readers</div>
            </div>
            
            <div className="bg-card rounded-lg p-6 text-center border shadow-sm">
              <Download className="h-8 w-8 text-primary mx-auto mb-2" />
              <div className="text-2xl font-bold text-foreground">Free</div>
              <div className="text-sm text-muted-foreground">Downloads</div>
            </div>
          </div>
        </div>

        <div className="mb-8">
          <CurrentReads />
        </div>

        {/* Search and Filters */}
        <div className="mb-8 space-y-4">
          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              type="text"
              placeholder="Search books, authors, genres... / किताबें, लेखक, विधाएं खोजें..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-3 w-full text-lg"
            />
          </div>

          {/* Filters */}
          <div className="flex flex-wrap gap-4 items-center">
            {/* Genre Filter */}
            <div className="min-w-[150px]">
              <Select value={selectedGenre} onValueChange={setSelectedGenre}>
                <SelectTrigger>
                  <SelectValue placeholder="All Genres" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Genres</SelectItem>
                  {genres.map(genre => (
                    <SelectItem key={genre} value={genre}>
                      {genre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Language Filter */}
            <div className="min-w-[150px]">
              <Select value={selectedLanguage} onValueChange={setSelectedLanguage}>
                <SelectTrigger>
                  <SelectValue placeholder="All Languages" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Languages</SelectItem>
                  {languages.map(language => (
                    <SelectItem key={language} value={language}>
                      {language}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Sort Filter */}
            <div className="min-w-[150px]">
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger>
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="title">Title A-Z</SelectItem>
                  <SelectItem value="author">Author A-Z</SelectItem>
                  <SelectItem value="year">Publication Year</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Clear Filters */}
            {(searchQuery || selectedGenre || selectedLanguage || sortBy !== 'title') && (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleClearFilters}
                className="flex items-center gap-2"
              >
                <X className="h-4 w-4" />
                Clear Filters
              </Button>
            )}
          </div>
        </div>

        {/* View Toggle and Results Info */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div className="text-sm text-muted-foreground">
            Showing {currentBooks.length} of {filteredBooks.length} books
            {searchQuery && ` for "${searchQuery}"`}
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant={viewMode === 'grid' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('grid')}
            >
              <Grid className="h-4 w-4" />
              Grid
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('list')}
            >
              <List className="h-4 w-4" />
              List
            </Button>
          </div>
        </div>

        {/* Books Display */}
        {isLoading ? (
          <LoadingGrid />
        ) : filteredBooks.length === 0 ? (
          <div className="text-center py-12">
            <div className="max-w-md mx-auto">
              <h3 className="text-lg font-semibold mb-2">No books found</h3>
              <p className="text-muted-foreground mb-4">
                {searchQuery || selectedGenre || selectedLanguage
                  ? "Try adjusting your search or filters"
                  : "No books available in the library"
                }
              </p>
              {(searchQuery || selectedGenre || selectedLanguage) && (
                <Button onClick={handleClearFilters} variant="outline">
                  Clear all filters
                </Button>
              )}
            </div>
          </div>
        ) : (
          <>
            {viewMode === 'grid' ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-6">
                {currentBooks.map((book) => (
                  <BookCard key={book.id} book={book} viewMode="grid" />
                ))}
              </div>
            ) : (
              <div className="space-y-6">
                {currentBooks.map((book) => (
                  <BookCard key={book.id} book={book} viewMode="list" />
                ))}
              </div>
            )}

            {/* Pagination */}
            <Pagination />
          </>
        )}
      </div>

      {/* Book Detail Modal */}
      {selectedBook && (
        <Dialog open={!!selectedBook} onOpenChange={() => setSelectedBook(null)}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-2xl">{selectedBook.title}</DialogTitle>
            </DialogHeader>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Book Cover */}
              <div className="md:col-span-1">
                <div className="aspect-[3/4] w-full max-w-sm mx-auto">
                  {selectedBook.cover_image_url ? (
                    <img
                      src={selectedBook.cover_image_url}
                      alt={selectedBook.title}
                      className="w-full h-full object-cover rounded-lg shadow-lg"
                    />
                  ) : (
                    <div className="w-full h-full bg-muted rounded-lg flex items-center justify-center">
                      <BookOpen className="h-16 w-16 text-muted-foreground" />
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="space-y-3 mt-6">
                  <Button 
                    onClick={() => handleDownload(selectedBook)} 
                    className="w-full"
                    size="lg"
                    disabled={!selectedBook.pdf_url}
                  >
                    <BookOpen className="h-5 w-5 mr-2" />
                    Read Now
                  </Button>
                  
                  <Button 
                    onClick={() => handleDownload(selectedBook)} 
                    variant="outline" 
                    className="w-full"
                    size="lg"
                    disabled={!selectedBook.pdf_url}
                  >
                    <Download className="h-5 w-5 mr-2" />
                    Download PDF
                  </Button>
                  
                  <Button 
                    onClick={() => handleAddToLibrary(selectedBook)}
                    variant="secondary" 
                    className="w-full"
                    size="lg"
                  >
                    <Plus className="h-5 w-5 mr-2" />
                    Add to Library
                  </Button>
                </div>
              </div>

              {/* Book Details */}
              <div className="md:col-span-2 space-y-6">
                {/* Author and Metadata */}
                <div className="space-y-4">
                  {selectedBook.author && (
                    <div className="flex items-center gap-2">
                      <User className="h-5 w-5 text-muted-foreground" />
                      <span className="text-lg">{selectedBook.author}</span>
                    </div>
                  )}

                  <div className="flex flex-wrap gap-2">
                    {selectedBook.genre && (
                      <Badge variant="secondary" className="text-sm px-3 py-1">
                        {selectedBook.genre}
                      </Badge>
                    )}
                    {selectedBook.language && (
                      <Badge variant="outline" className="text-sm px-3 py-1">
                        <Globe className="h-4 w-4 mr-1" />
                        {selectedBook.language}
                      </Badge>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-sm text-muted-foreground">
                    {selectedBook.publication_year && (
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        <span>Published {selectedBook.publication_year}</span>
                      </div>
                    )}
                    {selectedBook.pages && (
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4" />
                        <span>{selectedBook.pages} pages</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Description */}
                {selectedBook.description && (
                  <div className="space-y-2">
                    <h3 className="text-lg font-semibold">Description</h3>
                    <p className="text-muted-foreground leading-relaxed">
                      {selectedBook.description}
                    </p>
                  </div>
                )}

                {/* Additional Info */}
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold">About This Book</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium">Title:</span> {selectedBook.title}
                    </div>
                    {selectedBook.author && (
                      <div>
                        <span className="font-medium">Author:</span> {selectedBook.author}
                      </div>
                    )}
                    {selectedBook.genre && (
                      <div>
                        <span className="font-medium">Genre:</span> {selectedBook.genre}
                      </div>
                    )}
                    {selectedBook.language && (
                      <div>
                        <span className="font-medium">Language:</span> {selectedBook.language}
                      </div>
                    )}
                    {selectedBook.publication_year && (
                      <div>
                        <span className="font-medium">Year:</span> {selectedBook.publication_year}
                      </div>
                    )}
                    {selectedBook.pages && (
                      <div>
                        <span className="font-medium">Pages:</span> {selectedBook.pages}
                      </div>
                    )}
                  </div>
                </div>

                {/* Reading Features */}
                <div className="bg-muted/50 rounded-lg p-4">
                  <h4 className="font-semibold mb-2">Reading Features</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• Read online or download for offline reading</li>
                    <li>• Adjustable font size and reading mode</li>
                    <li>• Bookmark and highlight support</li>
                    <li>• Add to your personal library</li>
                    <li>• Share with friends and community</li>
                  </ul>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}