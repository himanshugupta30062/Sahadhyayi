import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ExternalLink, Download } from 'lucide-react';
import type { LibgenBook } from '@/utils/libgenApi';

interface LibgenBookCardProps {
  book: LibgenBook;
}

const LibgenBookCard: React.FC<LibgenBookCardProps> = ({ book }) => {
  const handleDownload = () => {
    if (book.mirrorLink) {
      window.open(book.mirrorLink, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <Card className="bg-white/70 backdrop-blur-sm hover:shadow-lg transition border-purple-200">
      <CardContent className="p-4 space-y-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h3 className="font-semibold leading-snug text-gray-900 line-clamp-2">
              {book.title}
            </h3>
            {book.author && (
              <p className="text-sm text-gray-600 mt-1">{book.author}</p>
            )}
          </div>
          <Badge variant="secondary" className="ml-2 bg-purple-100 text-purple-800 text-xs">
            Libgen
          </Badge>
        </div>

        <div className="flex flex-wrap gap-2 text-xs">
          {book.publisher && (
            <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded">
              {book.publisher}
            </span>
          )}
          {book.year && (
            <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded">
              {book.year}
            </span>
          )}
          {book.format && (
            <span className="bg-green-100 text-green-700 px-2 py-1 rounded">
              {book.format}
            </span>
          )}
          {book.size && (
            <span className="bg-orange-100 text-orange-700 px-2 py-1 rounded">
              {book.size}
            </span>
          )}
        </div>

        <div className="flex gap-2">
          <Button 
            size="sm" 
            onClick={handleDownload}
            disabled={!book.mirrorLink}
            className="flex-1 bg-purple-600 hover:bg-purple-700"
          >
            <ExternalLink className="w-4 h-4 mr-2" />
            Open in Libgen
          </Button>
        </div>

        <p className="text-xs text-gray-500 flex items-center gap-1">
          <span>📚</span>
          Source: Library Genesis (Libgen)
        </p>
      </CardContent>
    </Card>
  );
};

export default LibgenBookCard;