
import React from 'react';
import { Button } from '@/components/ui/button';
import { Info } from 'lucide-react';

interface AuthorBioProps {
  authorBio: string;
  onAuthorClick: () => void;
}

const AuthorBio = ({ authorBio, onAuthorClick }: AuthorBioProps) => {
  return (
    <div className="bg-green-50 p-6 rounded-xl border border-green-200">
      <div className="flex items-center gap-2 mb-3">
        <h3 className="font-semibold text-xl text-green-900">About the Author</h3>
        <Button
          variant="ghost"
          size="sm"
          onClick={onAuthorClick}
          className="p-1 h-auto text-blue-600 hover:text-blue-800"
          title="Learn more about the author"
        >
          <Info className="w-4 h-4" />
        </Button>
      </div>
      <p className="text-gray-700 leading-relaxed">{authorBio}</p>
    </div>
  );
};

export default AuthorBio;
