import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Star, User, Calendar } from 'lucide-react';

interface Book {
  id: number;
  title: string;
  author: string;
  genre?: string;
  rating?: number;
  image_url?: string;
  published_year?: number;
  description?: string;
}

interface ResponsiveBookGridProps {
  books: Book[];
  isLoading?: boolean;
}

const ResponsiveBookGrid: React.FC<ResponsiveBookGridProps> = ({ books, isLoading }) => {
  if (isLoading) {
    return (
      <div className="library-grid gap-6">
        {Array.from({ length: 12 }).map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-4">
              <div className="aspect-[3/4] bg-gray-200 rounded-lg mb-4"></div>
              <div className="h-4 bg-gray-200 rounded mb-2"></div>
              <div className="h-3 bg-gray-200 rounded mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (books.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="w-24 h-24 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
          <User className="w-12 h-12 text-gray-400" />
        </div>
        <h3 className="text-xl font-semibold text-text-primary mb-2">No books found</h3>
        <p className="text-text-muted">Try adjusting your search or filter criteria</p>
      </div>
    );
  }

  return (
    <div className="library-grid gap-6">
      {books.map((book) => (
        <Link key={book.id} to={`/book/${book.id}`}>
          <Card className="group h-full bg-gradient-card border-0 shadow-card hover:shadow-elevated transition-all duration-300 hover:-translate-y-1">
            <CardContent className="p-4">
              {/* Book Cover */}
              <div className="aspect-[3/4] mb-4 relative overflow-hidden rounded-lg bg-gray-100">
                {book.image_url ? (
                  <img
                    src={book.image_url}
                    alt={`${book.title} cover`}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    loading="lazy"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-brand-primary/20 to-brand-secondary/20">
                    <span className="text-4xl font-bold text-brand-primary/60">
                      {book.title.charAt(0)}
                    </span>
                  </div>
                )}
                
                {/* Overlay on hover */}
                <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                  <span className="text-white font-medium">View Details</span>
                </div>
              </div>
              
              {/* Book Info */}
              <div className="space-y-2">
                <h3 className="font-semibold text-text-primary line-clamp-2 group-hover:text-brand-primary transition-colors">
                  {book.title}
                </h3>
                
                <div className="flex items-center text-sm text-text-muted">
                  <User className="w-3 h-3 mr-1" />
                  <span className="line-clamp-1">{book.author}</span>
                </div>
                
                <div className="flex items-center justify-between">
                  {book.genre && (
                    <Badge variant="secondary" className="text-xs bg-brand-neutral text-brand-primary border-brand-primary/20">
                      {book.genre}
                    </Badge>
                  )}
                  
                  {book.rating && (
                    <div className="flex items-center text-sm text-yellow-600">
                      <Star className="w-3 h-3 mr-1 fill-current" />
                      <span>{book.rating.toFixed(1)}</span>
                    </div>
                  )}
                </div>
                
                {book.published_year && (
                  <div className="flex items-center text-xs text-text-muted">
                    <Calendar className="w-3 h-3 mr-1" />
                    <span>{book.published_year}</span>
                  </div>
                )}
                
                {book.description && (
                  <p className="text-xs text-text-muted line-clamp-2 mt-2">
                    {book.description}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  );
};

export default ResponsiveBookGrid;