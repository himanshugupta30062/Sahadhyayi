import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Link } from 'react-router-dom';
import { 
  BookOpen, 
  Download, 
  Star, 
  Heart, 
  Share, 
  Eye, 
  Clock,
  Users,
  Award,
  Bookmark
} from 'lucide-react';
import type { Book } from '@/hooks/useLibraryBooks';

interface InteractiveBookCardProps {
  book: Book;
  onDownloadPDF?: (book: Book) => void;
  viewMode?: 'grid' | 'list' | 'bookshelf';
}

const InteractiveBookCard = ({ 
  book, 
  onDownloadPDF,
  viewMode = 'grid'
}: InteractiveBookCardProps) => {
  const [isHovered, setIsHovered] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [isLiked, setIsLiked] = useState(false);

  const rating = book.rating || Math.floor(Math.random() * 2) + 4; // 4-5 stars
  const readingTime = Math.floor(Math.random() * 8) + 2; // 2-10 hours
  const readers = Math.floor(Math.random() * 500) + 50; // 50-550 readers

  if (viewMode === 'list') {
    return (
      <Link to={`/book/${book.id}`}>
        <Card className="mb-4 overflow-hidden hover:shadow-xl transition-all duration-300 bg-white/80 backdrop-blur-sm cursor-pointer">
        <CardContent className="p-6">
          <div className="flex gap-6">
            {/* Book Cover */}
            <div className="flex-shrink-0">
              <div className="relative group">
                <img
                  src={book.cover_image_url || '/placeholder.svg'}
                  alt={book.title}
                  className="w-24 h-32 object-cover rounded-lg shadow-lg group-hover:shadow-xl transition-all duration-300"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = '/placeholder.svg';
                  }}
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 rounded-lg transition-all duration-300 flex items-center justify-center">
                  <Eye className="w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition-all duration-300" />
                </div>
              </div>
            </div>

            {/* Book Info */}
            <div className="flex-1 min-w-0">
              <div className="flex justify-between items-start mb-2">
                <h3 className="text-xl font-semibold text-gray-900 line-clamp-2">{book.title}</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsBookmarked(!isBookmarked)}
                  className={`ml-2 ${isBookmarked ? 'text-library-primary' : 'text-gray-400'}`}
                >
                  <Bookmark className="w-5 h-5" fill={isBookmarked ? 'currentColor' : 'none'} />
                </Button>
              </div>
              
              <p className="text-gray-600 mb-2">by {book.author}</p>
              
              <div className="flex items-center gap-4 mb-3">
                <div className="flex items-center">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`w-4 h-4 ${i < rating ? 'text-yellow-400 fill-current' : 'text-gray-300'}`}
                    />
                  ))}
                  <span className="ml-1 text-sm text-gray-600">({rating})</span>
                </div>
                <div className="flex items-center text-sm text-gray-500">
                  <Clock className="w-4 h-4 mr-1" />
                  {readingTime}h read
                </div>
                <div className="flex items-center text-sm text-gray-500">
                  <Users className="w-4 h-4 mr-1" />
                  {readers} readers
                </div>
              </div>

              <p className="text-gray-700 line-clamp-2 mb-4">{book.description}</p>

              <div className="flex items-center justify-between">
                <div className="flex gap-2">
                  {book.genre && <Badge variant="secondary">{book.genre}</Badge>}
                  {book.language && <Badge variant="outline">{book.language}</Badge>}
                </div>
                
                <div className="flex gap-2">
                  <Button variant="ghost" size="sm" onClick={() => setIsLiked(!isLiked)}>
                    <Heart className={`w-4 h-4 mr-1 ${isLiked ? 'text-red-500 fill-current' : ''}`} />
                    Like
                  </Button>
                  <Button variant="ghost" size="sm">
                    <Share className="w-4 h-4 mr-1" />
                    Share
                  </Button>
                  {book.pdf_url && onDownloadPDF && (
                    <Button onClick={() => onDownloadPDF(book)} className="bg-library-primary hover:bg-library-secondary">
                      <Download className="w-4 h-4 mr-1" />
                      Download
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      </Link>
    );
  }

  if (viewMode === 'bookshelf') {
    return (
      <Link to={`/book/${book.id}`}>
        <div className="relative cursor-pointer">
        <div 
          className="w-full h-48 bg-gradient-to-b from-library-primary to-library-secondary rounded-t-lg shadow-lg transform hover:-translate-y-2 transition-all duration-300 cursor-pointer"
          style={{
            background: `linear-gradient(135deg, ${book.cover_image_url ? 'transparent' : 'hsl(var(--library-primary))'}, ${book.cover_image_url ? 'transparent' : 'hsl(var(--library-secondary))'})`,
            backgroundImage: book.cover_image_url ? `url(${book.cover_image_url})` : 'none',
            backgroundSize: 'cover',
            backgroundPosition: 'center'
          }}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          {!book.cover_image_url && (
            <div className="flex items-center justify-center h-full">
              <BookOpen className="w-12 h-12 text-white/80" />
            </div>
          )}
          
          {isHovered && (
            <div className="absolute inset-0 bg-black/60 rounded-t-lg flex items-center justify-center">
              <div className="text-center text-white p-4">
                <h4 className="font-semibold text-sm line-clamp-2 mb-2">{book.title}</h4>
                <p className="text-xs opacity-90">{book.author}</p>
                <div className="flex justify-center mt-2">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className={`w-3 h-3 ${i < rating ? 'text-yellow-400 fill-current' : 'text-gray-400'}`} />
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
        
        {/* Book spine */}
        <div className="h-6 bg-gradient-to-r from-library-accent to-library-secondary rounded-b-lg shadow-md"></div>
      </div>
      </Link>
    );
  }

  // Default grid view
  return (
    <Link to={`/book/${book.id}`}>
      <Card 
        className="overflow-hidden hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 bg-white/90 backdrop-blur-sm cursor-pointer"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
      <CardContent className="p-0">
        {/* Book Cover */}
        <div className="relative aspect-[3/4] overflow-hidden">
          <img
            src={book.cover_image_url || '/placeholder.svg'}
            alt={book.title}
            className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
            onError={(e) => {
              (e.target as HTMLImageElement).src = '/placeholder.svg';
            }}
          />
          
          {/* Overlay with actions - hidden on mobile */}
          <div className={`absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent transition-opacity duration-300 hidden md:block ${isHovered ? 'opacity-100' : 'opacity-0'}`}>
            <div className="absolute bottom-4 left-4 right-4">
              <div className="flex justify-between items-center mb-3">
                <div className="flex items-center">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className={`w-3 h-3 ${i < rating ? 'text-yellow-400 fill-current' : 'text-gray-300'}`} />
                  ))}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsBookmarked(!isBookmarked)}
                  className={`p-1 ${isBookmarked ? 'text-library-primary' : 'text-white'}`}
                >
                  <Bookmark className="w-4 h-4" fill={isBookmarked ? 'currentColor' : 'none'} />
                </Button>
              </div>
              
              <div className="flex gap-1">
                <Button variant="ghost" size="sm" className="text-white p-1" onClick={() => setIsLiked(!isLiked)}>
                  <Heart className={`w-4 h-4 ${isLiked ? 'text-red-500 fill-current' : ''}`} />
                </Button>
                <Button variant="ghost" size="sm" className="text-white p-1">
                  <Share className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="sm" className="text-white p-1">
                  <Eye className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Status badges */}
          <div className="absolute top-2 left-2">
            {book.pdf_url && <Badge className="bg-green-500 text-white text-xs">PDF</Badge>}
          </div>

          {/* Reading stats */}
          <div className="absolute top-2 right-2 space-y-1">
            <div className="bg-black/50 text-white text-xs px-2 py-1 rounded-full flex items-center">
              <Users className="w-3 h-3 mr-1" />
              {readers}
            </div>
          </div>
        </div>

        {/* Book Info */}
        <div className="p-4 space-y-2">
          <h3 className="font-semibold text-gray-900 line-clamp-2 text-sm" title={book.title}>
            {book.title}
          </h3>
          <p className="text-xs text-gray-600 line-clamp-1">{book.author}</p>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center text-xs text-gray-500">
              <Clock className="w-3 h-3 mr-1" />
              {readingTime}h
            </div>
            {book.pdf_url && onDownloadPDF && isHovered && (
              <Button 
                size="sm" 
                onClick={() => onDownloadPDF(book)}
                className="bg-library-primary hover:bg-library-secondary text-xs px-3 py-1"
              >
                <Download className="w-3 h-3 mr-1" />
                Get
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
    </Link>
  );
};

export default InteractiveBookCard;