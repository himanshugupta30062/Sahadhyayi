import { Link, useParams } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Star, ExternalLink, BookOpen, Calendar, Globe, ArrowLeft } from 'lucide-react';
import { useBookById } from '@/hooks/useBookById';

const BookDetails = () => {
  const { id } = useParams<{ id: string }>();
  const { data: book, isLoading } = useBookById(id);

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

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  if (!book) {
    return <div className="min-h-screen flex items-center justify-center">Book not found.</div>;
  }

  const purchaseLinks = [
    { name: 'Amazon', url: book.amazon_url, icon: ExternalLink },
    { name: 'Google Books', url: book.google_books_url, icon: ExternalLink },
    { name: 'Internet Archive', url: book.internet_archive_url, icon: ExternalLink },
  ].filter(link => link.url);

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
                {purchaseLinks.map(link => (
                  <Button key={link.name} asChild className="w-full" variant={link.name === 'Amazon' ? 'default' : 'outline'}>
                    <a href={link.url!} target="_blank" rel="noopener noreferrer">
                      <link.icon className="w-4 h-4 mr-2" />
                      {link.name === 'Amazon' ? 'Buy on Amazon' : link.name === 'Google Books' ? 'Google Books' : 'Read Free'}
                    </a>
                  </Button>
                ))}
              </div>
            </div>
          </div>
          <div className="md:col-span-2 space-y-6">
            <div>
              <h3 className="text-xl font-semibold mb-2">by {book.author}</h3>
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
                <h4 className="font-semibold text-lg mb-2">About the Book</h4>
                <p className="text-gray-700 leading-relaxed">{book.description}</p>
              </div>
            )}
            {book.author_bio && (
              <div>
                <h4 className="font-semibold text-lg mb-2">About the Author</h4>
                <p className="text-gray-700 leading-relaxed">{book.author_bio}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookDetails;
