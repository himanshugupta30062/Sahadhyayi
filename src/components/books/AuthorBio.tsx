
import React from 'react';
import { Button } from '@/components/ui/button';
import { Info } from 'lucide-react';

interface AuthorBioProps {
  authorName: string;
  bio: string;
  onAuthorClick?: () => void;
}

const AuthorBio = ({ authorName, bio, onAuthorClick }: AuthorBioProps) => {
  const handleAuthorClick = () => {
    if (onAuthorClick) {
      onAuthorClick();
    } else {
      // Default behavior - could show author details or navigate to author page
      console.log('Author info clicked for:', authorName);
    }
  };

  return (
    <div className="bg-green-50 p-6 rounded-xl border border-green-200">
      <div className="flex items-center gap-2 mb-3">
        <h3 className="font-semibold text-xl text-green-900">About {authorName}</h3>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleAuthorClick}
          className="p-1 h-auto text-blue-600 hover:text-blue-800"
          title="Learn more about the author"
        >
          <Info className="w-4 h-4" />
        </Button>
      </div>
      <p className="text-gray-700 leading-relaxed">{bio}</p>
    </div>
  );
};

export default AuthorBio;
