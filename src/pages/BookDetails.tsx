
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useBookById } from '@/hooks/useBookById';
import { useAuth } from '@/contexts/AuthContext';
import { useState } from 'react';
import BookDetailsHeader from '@/components/books/BookDetailsHeader';
import BookCover from '@/components/books/BookCover';
import BookInfo from '@/components/books/BookInfo';
import BookDescription from '@/components/books/BookDescription';
import AuthorBio from '@/components/books/AuthorBio';
import PageSummarySection from '@/components/books/PageSummarySection';
import BookSummaryModal from '@/components/books/BookSummaryModal';
import ReadingStats from '@/components/books/ReadingStats';
import UserContentEditor from '@/components/content/UserContentEditor';
import BookIdeasSection from '@/components/books/BookIdeasSection';
import BookContinuationSection from '@/components/books/BookContinuationSection';

const BookDetails = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: book, isLoading } = useBookById(id);
  const [showSummaryModal, setShowSummaryModal] = useState(false);
  const [showContentEditor, setShowContentEditor] = useState(false);

  const handleAuthorClick = () => {
    navigate('/authors', { state: { searchAuthor: book?.author } });
  };

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  if (!book) {
    return <div className="min-h-screen flex items-center justify-center">Book not found.</div>;
  }

  const readFreeLink = book.internet_archive_url;

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-purple-50 py-8 px-4">
      <div className="max-w-6xl mx-auto space-y-8">
        <BookDetailsHeader title={book.title} />
        
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          <div className="p-8">
            <div className="grid lg:grid-cols-5 gap-8">
              {/* Book Cover - Left Column */}
              <BookCover
                title={book.title}
                coverImageUrl={book.cover_image_url}
                price={book.price}
                readFreeLink={readFreeLink}
                bookId={book.id}
                description={book.description}
              />

              {/* Book Details - Right Column */}
              <div className="lg:col-span-3 space-y-8">
                {/* Author and Rating */}
                <BookInfo
                  author={book.author}
                  rating={book.rating}
                  genre={book.genre}
                  publicationYear={book.publication_year}
                  pages={book.pages}
                  language={book.language}
                  isbn={book.isbn}
                  onAuthorClick={handleAuthorClick}
                />
                
                {/* Book Description */}
                {book.description && (
                  <BookDescription
                    description={book.description}
                    onViewSummary={() => setShowSummaryModal(true)}
                  />
                )}
                
                {/* Author Bio */}
                {book.author_bio && (
                  <AuthorBio
                    authorBio={book.author_bio}
                    onAuthorClick={handleAuthorClick}
                  />
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Interactive Sections */}
        <div className="grid lg:grid-cols-2 gap-8">
          {/* Page Summary Section */}
          <div className="bg-white rounded-xl shadow-lg">
            <PageSummarySection bookId={book.id} bookTitle={book.title} />
          </div>
          
          {/* Reading Statistics */}
          <div className="bg-white rounded-xl shadow-lg">
            <ReadingStats bookId={book.id} bookTitle={book.title} />
          </div>
        </div>
        
        {/* User-Generated Content Sections */}
        {user && (
          <div className="grid lg:grid-cols-2 gap-8">
            {/* Ideas & Feedback Section */}
            <div className="bg-white rounded-xl shadow-lg">
              <BookIdeasSection bookId={book.id} bookTitle={book.title} />
            </div>
            
            {/* Book Continuation Section - Only for Fiction Books */}
            <div className="bg-white rounded-xl shadow-lg">
              <BookContinuationSection 
                bookId={book.id} 
                bookTitle={book.title} 
                genre={book.genre}
              />
            </div>
          </div>
        )}
        
        {/* User Content Creation Section */}
        <div className="bg-white rounded-xl shadow-lg p-8">
          <div className="bg-gradient-to-br from-purple-50 to-pink-50 p-8 rounded-xl border border-purple-200">
            <h3 className="font-semibold text-2xl mb-4 text-purple-900">Create Your Own Version</h3>
            <p className="text-gray-700 mb-6 text-lg">
              Want to reimagine a chapter or create an alternative ending? Share your creative interpretation of this book!
            </p>
            {user ? (
              <div className="space-y-6">
                {!showContentEditor ? (
                  <Button 
                    onClick={() => setShowContentEditor(true)}
                    className="bg-purple-600 hover:bg-purple-700 h-12 px-8 text-base"
                  >
                    Start Writing Your Version
                  </Button>
                ) : (
                  <UserContentEditor 
                    bookId={book.id}
                    onSuccess={() => setShowContentEditor(false)}
                  />
                )}
              </div>
            ) : (
              <div className="text-center p-6 bg-white rounded-lg border border-purple-200">
                <p className="text-gray-600 mb-4 text-lg">Sign in to create your own version of this book</p>
                <Button 
                  onClick={() => navigate('/signin')}
                  className="bg-purple-600 hover:bg-purple-700 h-12 px-8 text-base"
                >
                  Sign In to Continue
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Book Summary Modal */}
      <BookSummaryModal
        isOpen={showSummaryModal}
        onClose={() => setShowSummaryModal(false)}
        book={book}
      />
    </div>
  );
};

export default BookDetails;
