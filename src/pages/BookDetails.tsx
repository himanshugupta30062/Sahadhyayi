import React, { useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Calendar, BookOpen, Globe, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import BookCover from '@/components/books/BookCover';
import BookDescription from '@/components/books/BookDescription';
import SEO from '@/components/SEO';
import Breadcrumb from '@/components/Breadcrumb';
import AuthorBio from '@/components/books/AuthorBio';
import BookReadersConnection from '@/components/books/BookReadersConnection';
import CreateYourVersionSection from '@/components/books/CreateYourVersionSection';
import BookIdeasSection from '@/components/books/BookIdeasSection';
import BookReader from '@/components/books/BookReader';
import { useBookById } from '@/hooks/useBookById';
import { useBookRatings, useRateBook } from '@/hooks/useBookRatings';
import StarRating from '@/components/StarRating';
import { generateBookSchema, generateBreadcrumbSchema } from '@/utils/schema';
import { logBookEvent } from '@/lib/supabase/events';

const BookDetails = () => {
  const { id } = useParams<{ id: string }>();
  const { data: book, isLoading, error } = useBookById(id);
  const { data: ratingData, isLoading: ratingLoading } = useBookRatings(id);
  const rateMutation = useRateBook(id);

  console.log('BookDetails - Route params:', { id });
  console.log('BookDetails - Book data:', book);
  console.log('BookDetails - Loading state:', isLoading);
  console.log('BookDetails - Error state:', error);

  useEffect(() => {
    if (book?.id) {
      logBookEvent(book.id, 'view');
    }
  }, [book?.id]);

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

  if (error) {
    console.error('Error loading book:', error);
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-red-200 rounded-full mx-auto mb-4 flex items-center justify-center">
            <BookOpen className="w-8 h-8 text-red-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Error Loading Book</h1>
          <p className="text-gray-600 mb-4">We encountered an error while loading the book details.</p>
          <p className="text-sm text-gray-500 mb-4">Error: {error.message}</p>
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

  if (!book) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-red-200 rounded-full mx-auto mb-4 flex items-center justify-center">
            <BookOpen className="w-8 h-8 text-red-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Book Not Found</h1>
          <p className="text-gray-600 mb-4">Sorry, we couldn't find the book you're looking for.</p>
          <p className="text-sm text-gray-500 mb-4">Book ID: {id}</p>
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

  const averageRating = ratingData?.average || 0;
  const ratingCount = ratingData?.count || 0;
  const userRating = ratingData?.userRating ?? 0;
  const canonicalUrl = `https://sahadhyayi.com/book/${id}`;
  
  const seoTitle = `${book.title}${book.author ? ` by ${book.author}` : ''} - Read Online`;
  const seoDescription = book.description 
    ? `${book.description.substring(0, 150)}...` 
    : `Read ${book.title}${book.author ? ` by ${book.author}` : ''} online. Join Sahadhyayi's reading community for discussions and insights.`;
  
  const keywords = [
    'read online',
    'digital books',
    'ebooks',
    book.title,
    book.author,
    book.genre,
    'reading community',
    'book discussion',
    'sahadhyayi'
  ].filter(Boolean);

  const breadcrumbItems = [
    { name: 'Explore', path: '/library' },
    ...(book.genre ? [{ name: book.genre, path: `/library?genre=${encodeURIComponent(book.genre)}` }] : []),
    { name: book.title, path: `/book/${id}`, current: true }
  ];

  const bookSchema = generateBookSchema({
    title: book.title,
    author: book.author || 'Unknown Author',
    description: book.description || '',
    genre: book.genre,
    isbn: book.isbn,
    publicationYear: book.publication_year,
    language: book.language,
    pages: book.pages,
    coverImage: book.cover_image_url,
    rating: averageRating,
    ratingCount: ratingCount,
    url: canonicalUrl
  });

  const breadcrumbSchema = generateBreadcrumbSchema(
    breadcrumbItems.map(item => ({ name: item.name, url: `https://sahadhyayi.com${item.path}` }))
  );

  const combinedSchema = [bookSchema, breadcrumbSchema] as any;

  const handleViewSummary = () => {
    console.log('View summary clicked for book:', book.title);
  };

  const handleAuthorClick = () => {
    console.log('Author clicked:', book.author);
  };

  const handleDownload = () => {
    if (book?.id) {
      logBookEvent(book.id, 'download');
    }
  };

  return (
    <>
      <SEO
        title={seoTitle}
        description={seoDescription}
        canonical={canonicalUrl}
        url={canonicalUrl}
        image={book.cover_image_url}
        type="book"
        author={book.author}
        keywords={keywords}
        schema={combinedSchema}
      />
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
        {/* Header */}
        <div className="bg-white/80 backdrop-blur-sm border-b border-blue-200 sticky top-0 z-10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center justify-between">
              <Link to="/library">
                <Button variant="ghost" className="hover:bg-blue-100">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Library
                </Button>
              </Link>
              
              <Breadcrumb 
                items={breadcrumbItems} 
                className="hidden sm:flex"
              />
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Mobile Breadcrumb */}
          <Breadcrumb 
            items={breadcrumbItems} 
            className="sm:hidden mb-6"
          />

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
                      <Link
                        to={`/author/${book.author.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')}`}
                        className="text-lg text-blue-600 font-medium hover:text-blue-800 hover:underline"
                      >
                        {book.author}
                      </Link>
                    </div>
                  )}

                  <div className="flex items-center gap-1">
                    <StarRating value={averageRating} readOnly />
                    <span className="text-lg font-semibold text-gray-900">{averageRating.toFixed(1)}</span>
                    <span className="text-gray-500">({ratingCount} {ratingCount === 1 ? 'rating' : 'ratings'})</span>
                  </div>
                </div>
                <div className="mb-6">
                  <p className="text-sm text-gray-600 mb-1">Rate this book:</p>
                  {ratingLoading ? (
                    <div className="text-sm text-gray-500">Loading...</div>
                  ) : (
                    <StarRating
                      value={userRating || 0}
                      onChange={(val) => rateMutation.mutate(val)}
                      readOnly={rateMutation.isPending}
                    />
                  )}
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
                    <h3 className="text-xl font-semibold mb-4 text-gray-900">About this Book</h3>
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
                    <h3 className="text-xl font-semibold mb-4 text-gray-900">About the Author</h3>
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

          {/* Interactive Tabs Section - Mobile Responsive */}
          <div className="w-full">
            <Tabs defaultValue="connect" className="w-full">
              <TabsList className="grid w-full grid-cols-2 lg:grid-cols-4 gap-2 mb-6 bg-white/80 backdrop-blur-sm border border-gray-200 rounded-xl h-auto p-2">
                <TabsTrigger
                  value="connect"
                  className="text-xs sm:text-sm font-medium px-2 sm:px-4 py-3 rounded-lg data-[state=active]:bg-blue-100 data-[state=active]:text-blue-800 data-[state=active]:shadow-sm min-h-[48px] whitespace-normal leading-tight"
                >
                  Connect with Readers
                </TabsTrigger>
                <TabsTrigger
                  value="create"
                  className="text-xs sm:text-sm font-medium px-2 sm:px-4 py-3 rounded-lg data-[state=active]:bg-purple-100 data-[state=active]:text-purple-800 data-[state=active]:shadow-sm min-h-[48px] whitespace-normal leading-tight"
                >
                  Create Version
                </TabsTrigger>
                <TabsTrigger
                  value="feedback"
                  className="text-xs sm:text-sm font-medium px-2 sm:px-4 py-3 rounded-lg data-[state=active]:bg-green-100 data-[state=active]:text-green-800 data-[state=active]:shadow-sm min-h-[48px] whitespace-normal leading-tight"
                >
                  Ideas & Feedback
                </TabsTrigger>
                <TabsTrigger
                  value="read"
                  className="text-xs sm:text-sm font-medium px-2 sm:px-4 py-3 rounded-lg data-[state=active]:bg-orange-100 data-[state=active]:text-orange-800 data-[state=active]:shadow-sm min-h-[48px] whitespace-normal leading-tight"
                >
                  Read Book
                </TabsTrigger>
              </TabsList>

              <TabsContent value="connect" className="mt-0">
                <Card className="bg-gradient-to-br from-blue-50 to-cyan-50 border-blue-200 shadow-lg">
                  <CardContent className="p-6">
                    <BookReadersConnection 
                      bookId={book.id}
                      bookTitle={book.title}
                    />
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="create" className="mt-0">
                <Card className="bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200 shadow-lg">
                  <CardContent className="p-6">
                    <CreateYourVersionSection 
                      bookId={book.id}
                      bookTitle={book.title}
                    />
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="feedback" className="mt-0">
                <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200 shadow-lg">
                  <CardContent className="p-6">
                    <BookIdeasSection 
                      bookId={book.id} 
                      bookTitle={book.title}
                    />
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="read" className="mt-0">
                <Card className="bg-gradient-to-br from-orange-50 to-yellow-50 border-orange-200 shadow-lg">
                  <CardContent className="p-6">
                    <BookReader
                      bookId={book.id}
                      bookTitle={book.title}
                      pdfUrl={book.pdf_url}
                      epubUrl={undefined}
                      onDownload={handleDownload}
                    />
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </>
  );
};

export default BookDetails;
