
import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Star, Calendar, BookOpen, Globe, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import BookCover from '@/components/books/BookCover';
import BookDescription from '@/components/books/BookDescription';
import SEO from '@/components/SEO';
import AuthorBio from '@/components/books/AuthorBio';
import BookIdeasSection from '@/components/books/BookIdeasSection';
import BookContinuationSection from '@/components/books/BookContinuationSection';
import CreateYourVersionSection from '@/components/books/CreateYourVersionSection';
import BookReadersConnection from '@/components/books/BookReadersConnection';
import { useBookById } from '@/hooks/useBookById';

const BookDetails = () => {
  const { id } = useParams<{ id: string }>();
  const { data: book, isLoading, error } = useBookById(id);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="animate-pulse text-center">
          <div className="w-16 h-16 bg-blue-200 rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600">Loading book details...</p>
        </div>
      </div>
    );
  }

  if (error || !book) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-red-200 rounded-full mx-auto mb-4 flex items-center justify-center">
            <BookOpen className="w-8 h-8 text-red-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Book Not Found</h2>
          <p className="text-gray-600 mb-4">Sorry, we couldn't find the book you're looking for.</p>
          <Link to="/library">
            <Button variant="outline">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Library
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const rating = book.rating || 4.2;

  const handleViewSummary = () => {
    console.log('View summary clicked for book:', book.title);
  };

  const handleAuthorClick = () => {
    console.log('Author clicked:', book.author);
  };

  const canonicalUrl = `https://sahadhyayi.com/books/${id}`;

  return (
    <>
      <SEO
        title={`${book.title} - Sahadhyayi`}
        description={book.description}
        canonical={canonicalUrl}
        url={canonicalUrl}
        image={book.cover_image_url}
      />
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-blue-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <Link to="/library">
            <Button variant="ghost" className="hover:bg-blue-100">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Library
            </Button>
          </Link>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 mb-12">
          {/* Book Cover - Left Side */}
          <div className="lg:col-span-2">
            <BookCover
              title={book.title}
              bookId={book.id}
              coverImageUrl={book.cover_image_url}
              price={book.price}
              description={book.description}
              pdfUrl={book.pdf_url}
            />
          </div>

          {/* Book Info - Right Side */}
          <div className="lg:col-span-3 space-y-6">
            {/* Title and Basic Info */}
            <div>
              <h1 className="text-4xl font-bold text-gray-900 mb-4 leading-tight">
                {book.title}
              </h1>
              
              <div className="flex flex-wrap items-center gap-4 mb-6">
                {book.author && (
                  <div className="flex items-center gap-2">
                    <User className="w-5 h-5 text-gray-500" />
                    <span className="text-lg text-gray-700 font-medium">{book.author}</span>
                  </div>
                )}
                
                <div className="flex items-center gap-1">
                  <Star className="w-5 h-5 text-yellow-500 fill-current" />
                  <span className="text-lg font-semibold text-gray-900">{rating.toFixed(1)}</span>
                  <span className="text-gray-500">({Math.floor(Math.random() * 500 + 100)} reviews)</span>
                </div>
              </div>

              {/* Metadata Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                {book.genre && (
                  <Card className="bg-blue-50 border-blue-200">
                    <CardContent className="p-3 text-center">
                      <Badge variant="secondary" className="bg-blue-100 text-blue-800 mb-1">
                        {book.genre}
                      </Badge>
                      <p className="text-xs text-gray-600">Genre</p>
                    </CardContent>
                  </Card>
                )}
                
                {book.publication_year && (
                  <Card className="bg-green-50 border-green-200">
                    <CardContent className="p-3 text-center">
                      <div className="flex items-center justify-center gap-1 mb-1">
                        <Calendar className="w-4 h-4 text-green-600" />
                        <span className="font-semibold text-green-800">{book.publication_year}</span>
                      </div>
                      <p className="text-xs text-gray-600">Published</p>
                    </CardContent>
                  </Card>
                )}
                
                {book.pages && (
                  <Card className="bg-purple-50 border-purple-200">
                    <CardContent className="p-3 text-center">
                      <div className="flex items-center justify-center gap-1 mb-1">
                        <BookOpen className="w-4 h-4 text-purple-600" />
                        <span className="font-semibold text-purple-800">{book.pages}</span>
                      </div>
                      <p className="text-xs text-gray-600">Pages</p>
                    </CardContent>
                  </Card>
                )}
                
                {book.language && (
                  <Card className="bg-orange-50 border-orange-200">
                    <CardContent className="p-3 text-center">
                      <div className="flex items-center justify-center gap-1 mb-1">
                        <Globe className="w-4 h-4 text-orange-600" />
                        <span className="font-semibold text-orange-800">{book.language}</span>
                      </div>
                      <p className="text-xs text-gray-600">Language</p>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>

            {/* Book Description */}
            {book.description && (
              <Card className="bg-white/60 backdrop-blur-sm border-gray-200">
                <CardContent className="p-6">
                  <BookDescription 
                    description={book.description} 
                    onViewSummary={handleViewSummary}
                  />
                </CardContent>
              </Card>
            )}

            {/* Author Bio */}
            {book.author_bio && (
              <Card className="bg-white/60 backdrop-blur-sm border-gray-200">
                <CardContent className="p-6">
                  <AuthorBio 
                    authorBio={book.author_bio}
                    onAuthorClick={handleAuthorClick}
                  />
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        <Separator className="my-8" />

        {/* Interactive Sections */}
        <div className="space-y-8">
          {/* Readers Connection Section - New prominent section */}
          <BookReadersConnection 
            bookId={book.id}
            bookTitle={book.title}
          />

          {/* Create Your Own Version Section */}
          <Card className="bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200 shadow-lg">
            <CardContent className="p-6">
              <CreateYourVersionSection 
                bookId={book.id}
                bookTitle={book.title}
              />
            </CardContent>
          </Card>

          {/* Ideas & Feedback Section */}
          <Card className="bg-white/60 backdrop-blur-sm border-gray-200">
            <CardContent className="p-6">
              <BookIdeasSection 
                bookId={book.id} 
                bookTitle={book.title}
              />
            </CardContent>
          </Card>

          {/* Book Continuation Section */}
          <Card className="bg-white/60 backdrop-blur-sm border-gray-200">
            <CardContent className="p-6">
              <BookContinuationSection 
                bookId={book.id}
                bookTitle={book.title}
                genre={book.genre}
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
    </>
  );
};

export default BookDetails;
