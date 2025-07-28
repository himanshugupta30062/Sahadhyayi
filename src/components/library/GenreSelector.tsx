import * as React from 'react';
import { Button } from '@/components/ui/button';

interface GenreSelectorProps {
  genres: string[];
  selected: string;
  onSelect: (genre: string) => void;
}

const GenreSelector = ({ genres, selected, onSelect }: GenreSelectorProps) => {
  return (
    <div className="flex flex-wrap gap-2">
      {genres.map((genre) => (
        <Button
          key={genre}
          variant={selected === genre ? 'default' : 'outline'}
          size="sm"
          onClick={() => onSelect(genre)}
          aria-pressed={selected === genre}
          className={selected === genre ? 'bg-orange-600 hover:bg-orange-700 text-white' : ''}
        >
          {genre}
        </Button>
      ))}
    </div>
  );
};

export default GenreSelector;
