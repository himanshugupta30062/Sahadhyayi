
import React from 'react';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import AudioSummaryButton from './AudioSummaryButton';

interface BookCoverProps {
  title: string;
  coverImageUrl?: string;
  price?: number;
  bookId: string;
  description?: string;
  pdfUrl?: string;
}

const BookCover = ({ title, coverImageUrl, price, bookId, description, pdfUrl }: BookCoverProps) => {
  const handleDownloadPDF = () => {
    if (pdfUrl) {
      const link = document.createElement('a');
      link.href = pdfUrl;
      link.download = `${title}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      console.log('PDF download requested for:', title);
      // Here you could implement a fallback or show a message
    }
  };

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
          {/* Download PDF Button */}
          <Button 
            onClick={handleDownloadPDF}
            className="w-full h-12 text-base bg-gray-700 hover:bg-gray-800 text-white" 
            size="lg"
          >
            <Download className="w-5 h-5 mr-2" />
            Download PDF
          </Button>

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
