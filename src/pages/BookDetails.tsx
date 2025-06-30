
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
    <div className="min-h-screen py-8 px-4">
      <div className="max-w-4xl mx-auto space-y-6">
        <Link to="/library" className="inline-flex items-center text-sm text-blue-600 hover:underline">
          <ArrowLeft className="w-4 h-4 mr-1" /> Back to Library
        </Link>
        <h1 className="text-3xl font-bold text-gray-900">{book.title}</h1>
        <div className="grid md:grid-cols-3 gap-6">
          <div className="md:col-span-1">
            <div className="aspect-[3/4] bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg overflow-hidden shadow-lg">
              {book.cover_image_url ? (
                <img src={book.cover_image_url} alt={book.title} className="w-full h-full object-cover" loading="lazy" />
              ) : (
                <div className="flex items-center justify-center h-full text-white font-bold text-lg p-4 text-center">
                  {book.title}
                </div>
              )}
            </div>
            <div className="mt-4 space-y-3">
              {book.price && (
                <div className="text-center">
                  <span className="text-2xl font-bold text-green-600">${book.price}</span>
                </div>
              )}
              <div className="space-y-2">
                {/* Read Free link */}
                {readFreeLink && (
                  <Button asChild className="w-full" variant="outline">
                    <a href={readFreeLink} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="w-4 h-4 mr-2" />
                      Read Free
                    </a>
                  </Button>
                )}

                {/* Audio Summary Button */}
                <AudioSummaryButton
                  bookId={book.id}
                  bookContent={book.description}
                />
              </div>
            </div>
          </div>
          <div className="md:col-span-2 space-y-6">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <h3 className="text-xl font-semibold">by {book.author}</h3>
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
                {book.genre && <Badge variant="secondary">{book.genre}</Badge>}
              </div>
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
            
            {/* User Content Creation Section */}
            <div className="bg-gradient-to-br from-purple-50 to-pink-50 p-6 rounded-lg border border-purple-200">
              <h4 className="font-semibold text-lg mb-3 text-purple-900">Create Your Own Version</h4>
              <p className="text-gray-700 mb-4">
                Want to reimagine a chapter or create an alternative ending? Share your creative interpretation of this book!
              </p>
              {user ? (
                <div className="space-y-4">
                  {!showContentEditor ? (
                    <Button 
                      onClick={() => setShowContentEditor(true)}
                      className="bg-purple-600 hover:bg-purple-700"
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
                <div className="text-center p-4 bg-white rounded-lg border border-purple-200">
                  <p className="text-gray-600 mb-3">Sign in to create your own version of this book</p>
                  <Button 
                    onClick={() => navigate('/signin')}
                    className="bg-purple-600 hover:bg-purple-700"
                  >
                    Sign In to Continue
                  </Button>
                </div>
              )}
            </div>
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
