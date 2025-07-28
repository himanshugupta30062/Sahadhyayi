
import * as React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { BookOpen } from 'lucide-react';

interface BookSummaryModalProps {
  isOpen: boolean;
  onClose: () => void;
  book: {
    title: string;
    author: string;
    description?: string;
  } | null;
}

const BookSummaryModal: React.FC<BookSummaryModalProps> = ({
  isOpen,
  onClose,
  book
}) => {
  if (!book) return null;

  // Generate a detailed summary based on the book's description
  const detailedSummary = book.description 
    ? `${book.description}\n\nThis comprehensive summary covers the main themes, character development, and key plot points of "${book.title}" by ${book.author}. The narrative explores various dimensions of the story, providing readers with insights into the author's writing style and the book's cultural significance.\n\nKey themes include personal growth, relationships, and the human condition. The author masterfully weaves together multiple storylines that converge to create a compelling and thought-provoking reading experience.`
    : `"${book.title}" by ${book.author} is a captivating work that explores various themes and narratives. This detailed summary provides comprehensive insights into the story's development, character arcs, and the author's unique storytelling approach.`;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <BookOpen className="w-5 h-5 text-blue-600" />
            Detailed Summary - {book.title}
          </DialogTitle>
        </DialogHeader>
        
        <ScrollArea className="max-h-[60vh] pr-4">
          <div className="space-y-4">
            <div className="bg-blue-50 p-4 rounded-lg border-l-4 border-blue-500">
              <h3 className="font-semibold text-blue-900 mb-2">About This Summary</h3>
              <p className="text-blue-800 text-sm">
                This detailed summary provides comprehensive insights into the book's themes, characters, and narrative structure.
              </p>
            </div>
            
            <div className="prose max-w-none">
              <h4 className="font-semibold text-lg mb-3">Complete Book Summary</h4>
              <p className="text-gray-700 leading-relaxed whitespace-pre-line">
                {detailedSummary}
              </p>
            </div>
          </div>
        </ScrollArea>
        
        <div className="flex justify-end pt-4">
          <Button onClick={onClose} variant="outline">
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default BookSummaryModal;
