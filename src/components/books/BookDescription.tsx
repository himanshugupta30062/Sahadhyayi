
import React from 'react';
import { Button } from '@/components/ui/button';
import { Info } from 'lucide-react';

interface BookDescriptionProps {
  description: string;
  onViewSummary?: () => void;
}

const BookDescription = ({ description, onViewSummary }: BookDescriptionProps) => {
  const handleViewSummary = () => {
    if (onViewSummary) {
      onViewSummary();
    } else {
      // Default behavior - could show a modal or navigate to a summary page
      console.log('View summary clicked');
    }
  };

  return (
    <div className="bg-blue-50 p-6 rounded-xl border border-blue-200">
      <div className="flex items-center gap-2 mb-3">
        <h3 className="font-semibold text-xl text-blue-900">About the Book</h3>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleViewSummary}
          className="p-1 h-auto text-blue-600 hover:text-blue-800"
          title="View detailed summary"
        >
          <Info className="w-4 h-4" />
        </Button>
      </div>
      <p className="text-gray-700 leading-relaxed">{description}</p>
    </div>
  );
};

export default BookDescription;
