import React from 'react';
import { Button } from '@/components/ui/button';
import { Plus, Check, Download } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useAddToBookshelf, useUserBookshelf } from '@/hooks/useUserBookshelf';
import type { Book } from '@/hooks/useLibraryBooks';

interface AuthenticatedActionsProps {
  book: Book;
  onDownloadPDF?: (book: Book) => void;
}

const AuthenticatedActions: React.FC<AuthenticatedActionsProps> = ({ book, onDownloadPDF }) => {
  const { user } = useAuth();
  const { data: bookshelf = [] } = useUserBookshelf();
  const addToBookshelf = useAddToBookshelf();

  const isInShelf = bookshelf.some(item => item.book_id === book.id);

  const handleAddToShelf = () => {
    if (!user) return;
    addToBookshelf.mutate({ bookId: book.id });
  };

  if (!user) {
    return (
      <div className="flex gap-2 mt-3">
        <Link to="/signin" className="flex-1">
          <Button variant="outline" size="sm" className="w-full">
            Sign in to Add to Shelf
          </Button>
        </Link>
        {book.pdf_url && onDownloadPDF && (
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => onDownloadPDF(book)}
          >
            <Download className="w-4 h-4 mr-1" />
            PDF
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="flex gap-2 mt-3">
      <Button
        onClick={handleAddToShelf}
        disabled={isInShelf || addToBookshelf.isPending}
        className="flex-1 bg-amber-600 hover:bg-amber-700"
        size="sm"
      >
        {isInShelf ? (
          <>
            <Check className="w-4 h-4 mr-1" />
            Added
          </>
        ) : (
          <>
            <Plus className="w-4 h-4 mr-1" />
            Add to Shelf
          </>
        )}
      </Button>
      {book.pdf_url && onDownloadPDF && (
        <Button 
          variant="outline" 
          size="sm"
          onClick={() => onDownloadPDF(book)}
        >
          <Download className="w-4 h-4 mr-1" />
          PDF
        </Button>
      )}
    </div>
  );
};

export default AuthenticatedActions;