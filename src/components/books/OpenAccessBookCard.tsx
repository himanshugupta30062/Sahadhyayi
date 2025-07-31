import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ExternalBook } from '@/utils/searchExternalSources';

interface Props {
  book: ExternalBook;
}

const OpenAccessBookCard: React.FC<Props> = ({ book }) => {
  return (
    <Card className="bg-white/70 backdrop-blur-sm hover:shadow-lg transition">
      <CardContent className="p-4 space-y-2">
        <h3 className="font-semibold leading-snug">{book.title}</h3>
        {book.author && (
          <p className="text-sm text-muted-foreground">{book.author}</p>
        )}
        <div className="text-xs text-muted-foreground flex flex-wrap gap-2">
          {book.year && <span>{book.year}</span>}
          {book.language && <span>{book.language}</span>}
          {book.extension && <span>{book.extension.toUpperCase()}</span>}
          {book.size && <span>{book.size}</span>}
        </div>
        <Button asChild size="sm" className="mt-2">
          <a href={book.downloadUrl} target="_blank" rel="noopener noreferrer">
            Download
          </a>
        </Button>
      </CardContent>
    </Card>
  );
};

export default OpenAccessBookCard;
