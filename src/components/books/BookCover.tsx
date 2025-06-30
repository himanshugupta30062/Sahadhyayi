
import React from 'react';
import { Button } from '@/components/ui/button';
import { ExternalLink } from 'lucide-react';
import AudioSummaryButton from './AudioSummaryButton';

interface BookCoverProps {
  title: string;
  coverImageUrl?: string;
  price?: number;
  readFreeLink?: string;
  bookId: string;
  description?: string;
}

const BookCover = ({ title, coverImageUrl, price, readFreeLink, bookId, description }: BookCoverProps) => {
  return (
    <div className="lg:col-span-2">
      <div className="aspect-[3/4] bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl overflow-hidden shadow-lg mb-6">
        {coverImageUrl ? (
          <img src={coverImageUrl} alt={title} className="w-full h-full object-cover" loading="lazy" />
        ) : (
          <div className="flex items-center justify-center h-full text-white font-bold text-lg p-4 text-center">
            {title}
          </div>
        )}
      </div>
      
      {/* Action Buttons */}
      <div className="space-y-4">
        {price && (
          <div className="text-center">
            <span className="text-3xl font-bold text-green-600">${price}</span>
          </div>
        )}
        
        <div className="space-y-3">
          {/* Read Free Button - Show if internet_archive_url exists */}
          {readFreeLink && (
            <Button asChild className="w-full h-12 text-base bg-blue-600 hover:bg-blue-700" size="lg">
              <a href={readFreeLink} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="w-5 h-5 mr-2" />
                Read Free Online
              </a>
            </Button>
          )}

          {/* Audio Summary Button - Full Width */}
          <div className="w-full">
            <AudioSummaryButton
              bookId={bookId}
              bookContent={description}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookCover;
