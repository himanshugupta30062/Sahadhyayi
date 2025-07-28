
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Star, BookOpen, Calendar, Globe, Info, Download } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import { slugify } from '@/utils/slugify';
import { useAuth } from '@/contexts/AuthContext';
import type { Book } from '@/hooks/useLibraryBooks';
import AudioSummaryButton from '@/components/books/AudioSummaryButton';
import PageSummarySection from '@/components/books/PageSummarySection';
import BookSummaryModal from '@/components/books/BookSummaryModal';
import ReadingStats from '@/components/books/ReadingStats';
import BookIdeasSection from '@/components/books/BookIdeasSection';
import BookContinuationSection from '@/components/books/BookContinuationSection';
import CreateYourVersionSection from '@/components/books/CreateYourVersionSection';

interface BookDetailModalProps {
  book: Book | null;
  isOpen: boolean;
  onClose: () => void;
}

const BookDetailModal = ({ book, isOpen, onClose }: BookDetailModalProps) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [showSummaryModal, setShowSummaryModal] = useState(false);

  if (!book) return null;

  const renderStars = (rating: number) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;

    for (let i = 0; i < fullStars; i++) {
      stars.push(<Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />);
    }

    if (hasHalfStar) {
      stars.push(<Star key="half" className="w-4 h-4 fill-yellow-400 text-yellow-400 opacity-50" />);
    }

    const remainingStars = 5 - fullStars - (hasHalfStar ? 1 : 0);
    for (let i = 0; i < remainingStars; i++) {
      stars.push(<Star key={`empty-${i}`} className="w-4 h-4 text-gray-300" />);
    }

    return stars;
  };

  const handleAuthorClick = () => {
    onClose();
    navigate('/authors', { state: { searchAuthor: book.author } });
  };

  const handleDownloadPDF = () => {
    if (book.pdf_url) {
      const link = document.createElement('a');
      link.href = book.pdf_url;
      link.download = `${book.title}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      console.log('PDF download requested for:', book.title);
    }
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold">{book.title}</DialogTitle>
          </DialogHeader>
          
          <div className="grid md:grid-cols-3 gap-6">
            {/* Book Cover */}
            <div className="md:col-span-1">
              <div className="aspect-[3/4] bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg overflow-hidden shadow-lg">
                {book.cover_image_url ? (
                  <img
                    src={book.cover_image_url}
                    alt={book.title}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                ) : (
                  <div className="flex items-center justify-center h-full text-white font-bold text-lg p-4 text-center">
                    {book.title}
                  </div>
                )}
              </div>
              
              {/* Price and Action Buttons */}
              <div className="mt-4 space-y-3">
                {book.price && (
                  <div className="text-center">
                    <span className="text-2xl font-bold text-green-600">${book.price}</span>
                  </div>
                )}
                
                <div className="space-y-2">
                  {/* Download PDF Button */}
                  <Button 
                    onClick={handleDownloadPDF}
                    className="w-full bg-gray-700 hover:bg-gray-800" 
                    variant="default"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Download PDF
                  </Button>

                  {/* Audio Summary Button */}
                  <AudioSummaryButton
                    bookId={book.id}
                    bookContent={book.description}
                  />
                </div>
              </div>
            </div>

            {/* Book Details */}
            <div className="md:col-span-2 space-y-6">
              {/* Basic Info */}
              <div>
              <div className="flex items-center gap-2 mb-2">
                <h3 className="text-xl font-semibold">
                  <Link to={`/authors/${slugify(book.author)}`}>by {book.author}</Link>
                </h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleAuthorClick}
                  className="p-1 h-auto text-blue-600 hover:text-blue-800"
                  title="Learn more about the author"
                >
                  <Info className="w-4 h-4" />
                </Button>
              </div>
                
                <div className="flex items-center gap-4 mb-4">
                  <div className="flex items-center gap-1">
                    {renderStars(book.rating || 0)}
                    <span className="ml-2 font-medium">{(book.rating || 0).toFixed(1)}</span>
                  </div>
                  
                  {book.genre && (
                    <Badge variant="secondary">{book.genre}</Badge>
                  )}
                </div>

                {/* Book Metadata */}
                <div className="grid grid-cols-2 gap-4 text-sm text-gray-600 mb-4">
                  {book.publication_year && (
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      <span>Published {book.publication_year}</span>
                    </div>
                  )}
                  
                  {book.pages && (
                    <div className="flex items-center gap-2">
                      <BookOpen className="w-4 h-4" />
                      <span>{book.pages} pages</span>
                    </div>
                  )}
                  
                  {book.language && (
                    <div className="flex items-center gap-2">
                      <Globe className="w-4 h-4" />
                      <span>{book.language}</span>
                    </div>
                  )}
                  
                  {book.isbn && (
                    <div className="text-xs">
                      <span className="font-medium">ISBN:</span> {book.isbn}
                    </div>
                  )}
                </div>
              </div>

              {/* Book Description */}
              {book.description && (
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <h4 className="font-semibold text-lg">About the Book</h4>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowSummaryModal(true)}
                      className="p-1 h-auto text-blue-600 hover:text-blue-800"
                      title="View detailed summary"
                    >
                      <Info className="w-4 h-4" />
                    </Button>
                  </div>
                  <p className="text-gray-700 leading-relaxed">{book.description}</p>
                </div>
              )}

              {/* Author Bio */}
              {book.author_bio && (
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <h4 className="font-semibold text-lg">About the Author</h4>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleAuthorClick}
                      className="p-1 h-auto text-blue-600 hover:text-blue-800"
                      title="Learn more about the author"
                    >
                      <Info className="w-4 h-4" />
                    </Button>
                  </div>
                  <p className="text-gray-700 leading-relaxed">{book.author_bio}</p>
                </div>
              )}
              
              {/* Page Summary Section */}
              <PageSummarySection bookId={book.id} bookTitle={book.title} />
              
              {/* Reading Statistics */}
              <ReadingStats bookId={book.id} bookTitle={book.title} />
              
              {/* User-Generated Content Sections */}
              <div className="space-y-6">
                {/* Create Your Own Version Section - Now prominently displayed */}
                <div className="bg-gradient-to-br from-purple-50 to-pink-50 p-4 rounded-lg border border-purple-200">
                  <CreateYourVersionSection 
                    bookId={book.id} 
                    bookTitle={book.title}
                  />
                </div>
                
                {/* Ideas & Feedback Section */}
                <BookIdeasSection bookId={book.id} bookTitle={book.title} />
                
                {/* Book Continuation Section - Only for Fiction Books */}
                <BookContinuationSection 
                  bookId={book.id} 
                  bookTitle={book.title} 
                  genre={book.genre}
                />
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Book Summary Modal */}
      <BookSummaryModal
        isOpen={showSummaryModal}
        onClose={() => setShowSummaryModal(false)}
        book={book}
      />
    </>
  );
};

export default BookDetailModal;
