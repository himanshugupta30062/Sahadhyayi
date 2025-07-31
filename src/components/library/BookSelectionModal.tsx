import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { BookOpen, Download, Plus, Check, User } from 'lucide-react';
import OpenAccessBookCard from '@/components/books/OpenAccessBookCard';
import type { ExternalBook } from '@/utils/searchExternalSources';
import { Link } from 'react-router-dom';
import { slugify } from '@/utils/slugify';
import { useAddToPersonalLibrary } from '@/hooks/usePersonalLibrary';
import { useBookSearch } from '@/hooks/useBookSearch';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/components/ui/use-toast';

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
  created_at: string;
}

interface BookSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  books: BookSearchResult[];
  externalBooks?: ExternalBook[];
  searchTerm: string;
  onBooksAdded?: () => void;
}

const BookSelectionModal = ({ isOpen, onClose, books, externalBooks = [], searchTerm, onBooksAdded }: BookSelectionModalProps) => {
  const { user } = useAuth();
  const addToLibraryMutation = useAddToPersonalLibrary();
  const { saveSelectedBooks, loading: isSaving } = useBookSearch();
  
  const [selectedBooks, setSelectedBooks] = useState<Set<string>>(new Set());
  const [savedBookIds, setSavedBookIds] = useState<Set<string>>(new Set());

  const handleBookSelection = (bookId: string, isSelected: boolean) => {
    const newSelection = new Set(selectedBooks);
    if (isSelected) {
      newSelection.add(bookId);
    } else {
      newSelection.delete(bookId);
    }
    setSelectedBooks(newSelection);
  };

  const handleSelectAll = () => {
    if (selectedBooks.size === books.length) {
      setSelectedBooks(new Set());
    } else {
      setSelectedBooks(new Set(books.map(book => book.id)));
    }
  };

  const handleSaveSelectedBooks = async () => {
    if (selectedBooks.size === 0) {
      toast({
        title: "No books selected",
        description: "Please select at least one book to save.",
        variant: "destructive"
      });
      return;
    }

    const booksToSave = books.filter(book => selectedBooks.has(book.id));
    
    try {
      const result = await saveSelectedBooks(booksToSave);
      
      if (result) {
        const { savedBooks, duplicates, duplicatesFound } = result;
        
        // Update saved book IDs
        const newSavedIds = new Set([...savedBookIds, ...savedBooks.map(book => book.id)]);
        setSavedBookIds(newSavedIds);
        
        // Show success message with duplicate info
        let description = `Added ${savedBooks.length} new book(s) to the library.`;
        if (duplicatesFound > 0) {
          description += ` ${duplicatesFound} book(s) were already in the library.`;
        }
        
        toast({
          title: savedBooks.length > 0 ? "Books saved successfully!" : "Duplicates found",
          description,
          variant: duplicatesFound > 0 && savedBooks.length === 0 ? "destructive" : "default"
        });
        
        // Clear selection after saving
        setSelectedBooks(new Set());
        
        // Notify parent component and close modal
        onBooksAdded?.();
        
        // Auto-close modal after successful save
        setTimeout(() => {
          onClose();
        }, 1500);
      }
    } catch (error) {
      toast({
        title: "Error saving books",
        description: "Failed to save books to the library. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleAddToPersonalLibrary = async (bookId: string) => {
    if (!user) {
      toast({
        title: "Sign in required",
        description: "Please sign in to add books to your personal library.",
        variant: "destructive"
      });
      return;
    }
    
    try {
      await addToLibraryMutation.mutateAsync(bookId);
      // Trigger refresh of all library data
      onBooksAdded?.();
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

  const handleClose = () => {
    setSelectedBooks(new Set());
    onClose();
  };

  if (books.length === 0) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-5xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">
            Book Search Results - "{searchTerm}"
          </DialogTitle>
          <p className="text-muted-foreground">
            Found {books.length} book{books.length !== 1 ? 's' : ''}. Preview and select books to add to the library.
          </p>
        </DialogHeader>

        {/* Action Bar */}
        <div className="flex items-center justify-between gap-4 py-4 border-b">
          <div className="flex items-center gap-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="select-all"
                checked={selectedBooks.size === books.length && books.length > 0}
                onCheckedChange={handleSelectAll}
              />
              <label htmlFor="select-all" className="text-sm font-medium cursor-pointer">
                Select All ({selectedBooks.size}/{books.length})
              </label>
            </div>
          </div>

          <div className="flex gap-2">
            <Button
              onClick={handleSaveSelectedBooks}
              disabled={selectedBooks.size === 0 || isSaving}
              className="flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              {isSaving ? 'Saving...' : `Add Selected to Library (${selectedBooks.size})`}
            </Button>
          </div>
        </div>

        <div className="grid gap-4 mt-4">
          {books.map((book) => {
            const isSelected = selectedBooks.has(book.id);
            const isSaved = savedBookIds.has(book.id);
            
            return (
              <Card key={book.id} className={`overflow-hidden transition-all ${isSelected ? 'ring-2 ring-primary' : ''}`}>
                <CardContent className="p-0">
                  <div className="flex gap-4 p-4">
                    {/* Selection Checkbox */}
                    <div className="flex-shrink-0 pt-1">
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={(checked) => handleBookSelection(book.id, !!checked)}
                        disabled={isSaved}
                      />
                    </div>

                    {/* Book Cover */}
                    <div className="flex-shrink-0">
                      <div className="w-16 h-24 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg overflow-hidden">
                        {book.cover_image_url ? (
                          <img
                            src={book.cover_image_url}
                            alt={book.title}
                            loading="lazy"
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
                          <h3 className="font-semibold text-lg text-foreground line-clamp-2">
                            {book.title}
                          </h3>
                          {book.author && (
                            <p className="text-muted-foreground mt-1">
                              <Link to={`/authors/${slugify(book.author)}`}>{book.author}</Link>
                            </p>
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
                            {isSaved && (
                              <Badge className="bg-green-100 text-green-800">
                                <Check className="w-3 h-3 mr-1" />
                                Saved
                              </Badge>
                            )}
                          </div>

                          {book.description && (
                            <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                              {book.description.length > 150 
                                ? book.description.substring(0, 150) + '...'
                                : book.description
                              }
                            </p>
                          )}
                        </div>

                        {/* Action Buttons */}
                        <div className="flex flex-col gap-2">
                          {user && (
                            <Button
                              onClick={() => handleAddToPersonalLibrary(book.id)}
                              disabled={addToLibraryMutation.isPending}
                              className="flex items-center gap-2"
                              size="sm"
                            >
                              <User className="w-4 h-4" />
                              Add to Personal Library
                            </Button>
                          )}

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
            );
          })}
        </div>

        {externalBooks.length > 0 && (
          <div className="mt-6 space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <BookOpen className="w-4 h-4" />
              <span>\ud83d\udcda Found on Open Access Sources</span>
            </h3>
            <div className="grid gap-4">
              {externalBooks.map(book => (
                <OpenAccessBookCard key={book.id} book={book} />
              ))}
            </div>
          </div>
        )}

        <div className="flex justify-between items-center gap-2 mt-6 pt-4 border-t">
          <div className="text-sm text-muted-foreground">
            {user ? (
              "Select books to add to the global library, or click 'Add to Personal Library' for individual books to save them to your personal collection."
            ) : (
              `Select books and click 'Add Selected to Library' to save them to the database for all users.`
            )}
          </div>
          
          <div className="flex gap-2">
            {selectedBooks.size > 0 && (
              <Button
                onClick={handleSaveSelectedBooks}
                disabled={isSaving}
                className="flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                {isSaving ? 'Saving...' : `Add Selected (${selectedBooks.size})`}
              </Button>
            )}
            
            <Button variant="outline" onClick={handleClose}>
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default BookSelectionModal;