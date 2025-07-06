
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
      // Check if it's a direct PDF download or a preview link
      if (pdfUrl.includes('gutenberg') || pdfUrl.includes('archive.org') || pdfUrl.endsWith('.pdf')) {
        // Direct PDF download
        const link = document.createElement('a');
        link.href = pdfUrl;
        link.download = `${title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.pdf`;
        link.target = '_blank';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } else {
        // Preview link (Google Books, etc.)
        window.open(pdfUrl, '_blank');
      }
    } else {
      alert('PDF not available for this book');
    }
  };

  const getButtonText = () => {
    if (!pdfUrl) return 'PDF Not Available';
    if (pdfUrl.includes('gutenberg') || pdfUrl.includes('archive.org') || pdfUrl.endsWith('.pdf')) {
      return 'Download PDF';
    }
    return 'View Preview';
  };

  const isButtonDisabled = !pdfUrl;

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
          {/* PDF Button */}
          <Button 
            onClick={handleDownloadPDF}
            disabled={isButtonDisabled}
            className="w-full h-12 text-base" 
            variant={isButtonDisabled ? "outline" : "default"}
            size="lg"
          >
            <Download className="w-5 h-5 mr-2" />
            {getButtonText()}
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
