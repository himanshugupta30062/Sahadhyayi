import React from 'react';
import { Button } from '@/components/ui/button';
import { Plus, Check, Download, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import SignInLink from '@/components/SignInLink';
import { useAuth } from '@/contexts/authHelpers';
import { useAddToBookshelf, useUserBookshelf } from '@/hooks/useUserBookshelf';
import { toast } from '@/hooks/use-toast';
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
    addToBookshelf.mutate(
      { bookId: book.id, status: 'reading' },
      {
        onError: (error: any) => {
          toast({
            title: 'Error',
            description: error.message || 'Failed to add book to shelf',
            variant: 'destructive',
          });
        },
      }
    );
  };

  if (!user) {
    return (
      <div className="flex flex-col sm:flex-row gap-2 mt-3">
        <SignInLink className="flex-1">
          <Button
            variant="outline"
            size="sm"
            className="w-full whitespace-normal"
            aria-label="Sign in to add book to shelf"
          >
            Sign in to Add to Shelf
          </Button>
        </SignInLink>
        {book.pdf_url && onDownloadPDF && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => onDownloadPDF(book)}
            className="sm:w-auto"
            aria-label={`Download PDF of ${book.title}`}
          >
            <Download className="w-4 h-4 mr-1" />
            PDF
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col sm:flex-row gap-2 mt-3">
      <Button
        onClick={handleAddToShelf}
        disabled={isInShelf || addToBookshelf.isPending}
        className="flex-1 bg-amber-600 hover:bg-amber-700"
        size="sm"
        aria-label={isInShelf ? `${book.title} is already in your shelf` : `Add ${book.title} to your shelf`}
      >
        {addToBookshelf.isPending ? (
          <>
            <Loader2 className="w-4 h-4 mr-1 animate-spin" />
            Adding...
          </>
        ) : isInShelf ? (
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
          className="sm:w-auto"
          aria-label={`Download PDF of ${book.title}`}
        >
          <Download className="w-4 h-4 mr-1" />
          PDF
        </Button>
      )}
    </div>
  );
};

export default AuthenticatedActions;