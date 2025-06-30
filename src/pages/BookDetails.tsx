import { Link, useParams, useNavigate } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Star, ExternalLink, BookOpen, Calendar, Globe, ArrowLeft, Info } from 'lucide-react';
import { useBookById } from '@/hooks/useBookById';
import { useAuth } from '@/contexts/AuthContext';
import { useState } from 'react';
import AudioSummaryButton from '@/components/books/AudioSummaryButton';
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
    navigate('/authors', { state: { searchAuthor: book?.author } });
  };

  const handleCreateContent = () => {
    if (!user) {
      navigate('/signin');
      return;
    }
    setShowContentEditor(true);
  };

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  if (!book) {
    return <div className="min-h-screen flex items-center justify-center">Book not found.</div>;
  }

  // Only keep Internet Archive (Read Free) link
  const readFreeLink = book.internet_archive_url;

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-purple-50 py-8 px-4">
      <div className="max-w-6xl mx-auto space-y-8">
        <Link to="/library" className="inline-flex items-center text-sm text-blue-600 hover:underline font-medium">
          <ArrowLeft className="w-4 h-4 mr-1" /> Back to Library
        </Link>
        
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          <div className="p-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-6">{book.title}</h1>
            
            <div className="grid lg:grid-cols-5 gap-8">
              {/* Book Cover - Left Column */}
              <div className="lg:col-span-2">
                <div className="aspect-[3/4] bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl overflow-hidden shadow-lg mb-6">
                  {book.cover_image_url ? (
                    <img src={book.cover_image_url} alt={book.title} className="w-full h-full object-cover" loading="lazy" />
                  ) : (
                    <div className="flex items-center justify-center h-full text-white font-bold text-lg p-4 text-center">
                      {book.title}
                    </div>
                  )}
                </div>
                
                {/* Action Buttons */}
                <div className="space-y-4">
                  {book.price && (
                    <div className="text-center">
                      <span className="text-3xl font-bold text-green-600">${book.price}</span>
                    </div>
                  )}
                  
                  <div className="space-y-3">
                    {/* Read Free Button */}
                    {readFreeLink && (
                      <Button asChild className="w-full h-12 text-base" variant="outline">
                        <a href={readFreeLink} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="w-5 h-5 mr-2" />
                          Read Free
                        </a>
                      </Button>
                    )}

                    {/* Audio Summary Button - Full Width */}
                    <div className="w-full">
                      <AudioSummaryButton
                        bookId={book.id}
                        bookContent={book.description}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Book Details - Right Column */}
              <div className="lg:col-span-3 space-y-8">
                {/* Author and Rating */}
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <h2 className="text-2xl font-semibold text-gray-800">by {book.author}</h2>
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
                  <div className="flex items-center gap-4 mb-6">
                    <div className="flex items-center gap-1">
                      {renderStars(book.rating || 0)}
                      <span className="ml-2 font-medium text-lg">{(book.rating || 0).toFixed(1)}</span>
                    </div>
                    {book.genre && <Badge variant="secondary" className="text-sm px-3 py-1">{book.genre}</Badge>}
                  </div>
                  
                  {/* Book Metadata */}
                  <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
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
                  <div className="bg-blue-50 p-6 rounded-xl border border-blue-200">
                    <div className="flex items-center gap-2 mb-3">
                      <h3 className="font-semibold text-xl text-blue-900">About the Book</h3>
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
                  <div className="bg-green-50 p-6 rounded-xl border border-green-200">
                    <div className="flex items-center gap-2 mb-3">
                      <h3 className="font-semibold text-xl text-green-900">About the Author</h3>
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
