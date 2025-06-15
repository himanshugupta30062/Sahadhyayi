
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Library, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useLibraryBooks } from '@/hooks/useLibrary';

const LibraryPreview = () => {
  const { data: books = [], isLoading } = useLibraryBooks();

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <Library className="w-5 h-5" />
          Library Preview
        </CardTitle>
        <Link to="/library">
          <Button size="sm" variant="outline">
            <ExternalLink className="w-4 h-4 mr-2" />
            Browse All
          </Button>
        </Link>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="grid grid-cols-2 gap-3">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="animate-pulse bg-gray-200 h-24 rounded"></div>
            ))}
          </div>
        ) : books.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Library className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No books in library yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {books.slice(0, 4).map((book) => (
              <div key={book.id} className="border rounded-lg p-3 hover:bg-gray-50 transition-colors">
                <div className="aspect-[3/4] bg-gradient-to-br from-amber-100 to-orange-200 rounded mb-2 flex items-center justify-center">
                  {book.cover_image_url ? (
                    <img 
                      src={book.cover_image_url} 
                      alt={book.title}
                      className="w-full h-full object-cover rounded"
                    />
                  ) : (
                    <Library className="w-8 h-8 text-amber-600" />
                  )}
                </div>
                <h4 className="font-medium text-xs truncate">{book.title}</h4>
                {book.author && (
                  <p className="text-xs text-gray-500 truncate">{book.author}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default LibraryPreview;
