import React, { useEffect } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import BookSearchBar from '@/components/books/BookSearchBar';
import BookTestGrid from '@/components/books/BookTestGrid';
import { useBookSearch } from '@/hooks/useBookSearch';
import { Database, RefreshCw, AlertCircle } from 'lucide-react';
import SEO from '@/components/SEO';

const BookSearchTest = () => {
  const {
    loading,
    error,
    searchResults,
    searchBooks,
    getAllTestBooks,
    clearResults
  } = useBookSearch();

  useEffect(() => {
    // Load existing books on component mount
    getAllTestBooks();
  }, []);

  return (
    <>
      <SEO
        title="Book Search Test - API Integration | Sahadhyayi"
        description="Test book search functionality with Open Library and Google Books API integration"
        canonical="https://sahadhyayi.com/book-search-test"
        url="https://sahadhyayi.com/book-search-test"
      />

      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
        <div className="container mx-auto px-4 py-8 space-y-8">
          {/* Header */}
          <div className="text-center space-y-4">
            <div className="flex items-center justify-center gap-3">
              <div className="p-3 bg-primary/10 rounded-xl">
                <Database className="w-8 h-8 text-primary" />
              </div>
              <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                Book Search Test
              </h1>
            </div>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Test the book search functionality with Open Library and Google Books API integration
            </p>
          </div>

          {/* Search Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="w-5 h-5" />
                Search & Save Books
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex flex-col sm:flex-row items-center gap-4">
                <BookSearchBar onSearch={searchBooks} loading={loading} />
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={getAllTestBooks}
                    disabled={loading}
                    className="flex items-center gap-2"
                  >
                    <RefreshCw className="w-4 h-4" />
                    Refresh
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={clearResults}
                    disabled={loading || searchResults.length === 0}
                  >
                    Clear
                  </Button>
                </div>
              </div>

              <div className="text-sm text-muted-foreground bg-muted/50 p-4 rounded-lg">
                <h4 className="font-medium mb-2">How it works:</h4>
                <ul className="space-y-1 text-xs">
                  <li>• First searches Open Library API for books</li>
                  <li>• Falls back to Google Books API if no results found</li>
                  <li>• Automatically saves new books to the test database</li>
                  <li>• Prevents duplicates by checking ISBN and title+author</li>
                  <li>• Displays all saved books in a responsive grid</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* Error Display */}
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Results Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold flex items-center gap-2">
                <Database className="w-6 h-6" />
                Books in Test Database
                {searchResults.length > 0 && (
                  <span className="text-sm font-normal text-muted-foreground ml-2">
                    ({searchResults.length} books)
                  </span>
                )}
              </h2>
            </div>

            <Separator />

            <BookTestGrid books={searchResults} loading={loading} />
          </div>
        </div>
      </div>
    </>
  );
};

export default BookSearchTest;