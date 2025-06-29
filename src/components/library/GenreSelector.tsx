import React from 'react';
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
          className={selected === genre ? 'bg-blue-600 hover:bg-blue-700 text-white' : ''}
        >
          {genre}
        </Button>
      ))}
    </div>
  );
};

export default GenreSelector;
