
import * as React from 'react';
import { useState, useEffect } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut, RotateCw, BookOpen, X, Maximize, Minimize } from 'lucide-react';
import type { Book } from '@/hooks/useLibraryBooks';

interface BookReaderProps {
  book: Book | null;
  isOpen: boolean;
  onClose: () => void;
}

const BookReader = ({ book, isOpen, onClose }: BookReaderProps) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(200); // Default, would come from book data
  const [zoom, setZoom] = useState(100);
  const [rotation, setRotation] = useState(0);
  const [viewMode, setViewMode] = useState<'single' | 'double'>('double');
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    if (book) {
      setTotalPages(book.pages || 200);
      setCurrentPage(1);
    }
  }, [book]);

  if (!book) return null;

  const handlePrevPage = () => {
    if (viewMode === 'double') {
      setCurrentPage(Math.max(1, currentPage - 2));
    } else {
      setCurrentPage(Math.max(1, currentPage - 1));
    }
  };

  const handleNextPage = () => {
    if (viewMode === 'double') {
      setCurrentPage(Math.min(totalPages - 1, currentPage + 2));
    } else {
      setCurrentPage(Math.min(totalPages, currentPage + 1));
    }
  };

  const handleZoomIn = () => setZoom(Math.min(200, zoom + 25));
  const handleZoomOut = () => setZoom(Math.max(50, zoom - 25));
  const handleRotate = () => setRotation((rotation + 90) % 360);

  const renderPage = (pageNumber: number) => (
    <div 
      className="bg-white shadow-lg border rounded-lg overflow-hidden flex items-center justify-center"
      style={{
        transform: `scale(${zoom / 100}) rotate(${rotation}deg)`,
        transformOrigin: 'center',
        width: '100%',
        height: '600px',
        minWidth: '400px'
      }}
    >
      {/* Simulated page content - in a real implementation, this would load actual page images */}
      <div className="p-8 w-full h-full flex flex-col">
        <div className="text-2xl font-bold mb-4 text-center">{book.title}</div>
        <div className="text-lg mb-2 text-center">by {book.author}</div>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <BookOpen className="w-24 h-24 mx-auto mb-4 text-gray-400" />
            <div className="text-lg font-semibold mb-2">Page {pageNumber}</div>
            <div className="text-sm text-gray-600 max-w-md">
              {pageNumber === 1 ? book.description : 
               `This would show the actual content of page ${pageNumber}. In a real implementation, this would display the actual book pages as images or formatted text.`}
            </div>
          </div>
        </div>
        <div className="text-center text-sm text-gray-500 mt-4">
          Page {pageNumber} of {totalPages}
        </div>
      </div>
    </div>
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className={`max-w-full ${isFullscreen ? 'h-screen' : 'max-h-[90vh]'} p-0 bg-gray-100`}>
        {/* Top Toolbar */}
        <div className="bg-white border-b px-4 py-3 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <h2 className="text-lg font-semibold truncate">{book.title}</h2>
            <span className="text-sm text-gray-500">by {book.author}</span>
          </div>
          
          <div className="flex items-center space-x-2">
            {/* View Mode Toggle */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setViewMode(viewMode === 'single' ? 'double' : 'single')}
            >
              {viewMode === 'single' ? 'Single Page' : 'Double Page'}
            </Button>
            
            {/* Zoom Controls */}
            <Button
              variant="outline"
              size="sm"
              onClick={handleZoomOut}
              aria-label="Zoom out"
            >
              <ZoomOut className="w-4 h-4" />
            </Button>
            <span className="text-sm min-w-[50px] text-center">{zoom}%</span>
            <Button
              variant="outline"
              size="sm"
              onClick={handleZoomIn}
              aria-label="Zoom in"
            >
              <ZoomIn className="w-4 h-4" />
            </Button>
            
            {/* Rotate */}
            <Button
              variant="outline"
              size="sm"
              onClick={handleRotate}
              aria-label="Rotate page"
            >
              <RotateCw className="w-4 h-4" />
            </Button>
            
            {/* Fullscreen Toggle */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsFullscreen(!isFullscreen)}
              aria-label={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
            >
              {isFullscreen ? (
                <Minimize className="w-4 h-4" />
              ) : (
                <Maximize className="w-4 h-4" />
              )}
            </Button>
            
            {/* Close */}
            <Button
              variant="outline"
              size="sm"
              onClick={onClose}
              aria-label="Close reader"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Page Content Area */}
        <div className="flex-1 flex items-center justify-center p-4 bg-gray-100 overflow-auto">
          <div className="flex items-center space-x-4">
            {/* Previous Page Button */}
            <Button
              variant="outline"
              size="lg"
              onClick={handlePrevPage}
              disabled={currentPage <= 1}
              className="h-16"
              aria-label="Previous page"
            >
              <ChevronLeft className="w-6 h-6" />
            </Button>

            {/* Page Display */}
            <div className="flex space-x-4">
              {viewMode === 'double' ? (
                <>
                  {renderPage(currentPage)}
                  {currentPage < totalPages && renderPage(currentPage + 1)}
                </>
              ) : (
                renderPage(currentPage)
              )}
            </div>

            {/* Next Page Button */}
            <Button
              variant="outline"
              size="lg"
              onClick={handleNextPage}
              disabled={currentPage >= totalPages}
              className="h-16"
              aria-label="Next page"
            >
              <ChevronRight className="w-6 h-6" />
            </Button>
          </div>
        </div>

        {/* Bottom Navigation */}
        <div className="bg-white border-t px-4 py-3 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <span className="text-sm">
              Page {currentPage} of {totalPages}
            </span>
            <div className="flex items-center space-x-2">
              <input
                type="range"
                min="1"
                max={totalPages}
                value={currentPage}
                onChange={(e) => setCurrentPage(parseInt(e.target.value))}
                className="w-32"
              />
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm" onClick={handlePrevPage} disabled={currentPage <= 1}>
              Previous
            </Button>
            <Button variant="outline" size="sm" onClick={handleNextPage} disabled={currentPage >= totalPages}>
              Next
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default BookReader;
