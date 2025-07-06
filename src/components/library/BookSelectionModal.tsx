
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BookOpen, Download, Plus, Check } from 'lucide-react';
import { useAddToPersonalLibrary } from '@/hooks/usePersonalLibrary';
import { useAuth } from '@/contexts/AuthContext';

interface BookSearchResult {
  id: string;
  title: string;
  author?: string;
  genre?: string;
  cover_image_url?: string;
  description?: string;
  publication_year?: number;
  language?: string;
  pdf_url?: string;
  pages?: number;
}

interface BookSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  books: BookSearchResult[];
  searchTerm: string;
}

const BookSelectionModal = ({ isOpen, onClose, books, searchTerm }: BookSelectionModalProps) => {
  const { user } = useAuth();
  const addToLibraryMutation = useAddToPersonalLibrary();

  const handleAddBook = async (bookId: string) => {
    if (!user) {
      alert('Please sign in to add books to your library');
      return;
    }
    
    try {
      await addToLibraryMutation.mutateAsync(bookId);
    } catch (error) {
      // Error handling is done in the mutation
    }
  };

  const getButtonText = (pdfUrl?: string) => {
    if (!pdfUrl) return 'No PDF Available';
    if (pdfUrl.includes('gutenberg') || pdfUrl.includes('archive.org') || pdfUrl.endsWith('.pdf')) {
      return 'Download PDF';
    }
    return 'View Preview';
  };

  if (books.length === 0) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">
            Select Books to Add - "{searchTerm}"
          </DialogTitle>
          <p className="text-gray-600">
            Found {books.length} version{books.length !== 1 ? 's' : ''}. Choose which ones to add to your personal library.
          </p>
        </DialogHeader>

        <div className="grid gap-4 mt-4">
          {books.map((book) => (
            <Card key={book.id} className="overflow-hidden">
              <CardContent className="p-0">
                <div className="flex gap-4 p-4">
                  {/* Book Cover */}
                  <div className="flex-shrink-0">
                    <div className="w-16 h-24 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg overflow-hidden">
                      {book.cover_image_url ? (
                        <img 
                          src={book.cover_image_url} 
                          alt={book.title}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                            e.currentTarget.nextElementSibling?.classList.remove('hidden');
                          }}
                        />
                      ) : null}
                      <div className={`w-full h-full flex items-center justify-center text-white text-xs ${book.cover_image_url ? 'hidden' : ''}`}>
                        <BookOpen className="w-6 h-6" />
                      </div>
                    </div>
                  </div>

                  {/* Book Details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg text-gray-900 line-clamp-2">
                          {book.title}
                        </h3>
                        {book.author && (
                          <p className="text-gray-600 mt-1">{book.author}</p>
                        )}
                        
                        <div className="flex flex-wrap gap-2 mt-2">
                          {book.language && book.language !== 'English' && (
                            <Badge variant="secondary">{book.language}</Badge>
                          )}
                          {book.genre && (
                            <Badge variant="outline">{book.genre}</Badge>
                          )}
                          {book.publication_year && (
                            <Badge variant="outline">{book.publication_year}</Badge>
                          )}
                          {book.pages && (
                            <Badge variant="outline">{book.pages} pages</Badge>
                          )}
                        </div>

                        {book.description && (
                          <p className="text-sm text-gray-600 mt-2 line-clamp-2">
                            {book.description.length > 150 
                              ? book.description.substring(0, 150) + '...'
                              : book.description
                            }
                          </p>
                        )}
                      </div>

                      {/* Action Buttons */}
                      <div className="flex flex-col gap-2">
                        <Button
                          onClick={() => handleAddBook(book.id)}
                          disabled={addToLibraryMutation.isPending}
                          className="flex items-center gap-2"
                          size="sm"
                        >
                          <Plus className="w-4 h-4" />
                          Add to Library
                        </Button>

                        {book.pdf_url && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              if (book.pdf_url!.includes('gutenberg') || book.pdf_url!.includes('archive.org') || book.pdf_url!.endsWith('.pdf')) {
                                const link = document.createElement('a');
                                link.href = book.pdf_url!;
                                link.download = `${book.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.pdf`;
                                link.target = '_blank';
                                document.body.appendChild(link);
                                link.click();
                                document.body.removeChild(link);
                              } else {
                                window.open(book.pdf_url!, '_blank');
                              }
                            }}
                            className="flex items-center gap-2"
                          >
                            <Download className="w-4 h-4" />
                            {getButtonText(book.pdf_url)}
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="flex justify-end gap-2 mt-6 pt-4 border-t">
          <Button variant="outline" onClick={onClose}>
            Done
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default BookSelectionModal;
