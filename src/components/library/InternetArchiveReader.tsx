
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut, RotateCw, BookOpen, X, Maximize, Minimize, Loader2 } from 'lucide-react';
import { useBookPages, useInternetArchiveBook } from '@/hooks/useInternetArchive';
import type { Book } from '@/hooks/useLibraryBooks';

interface InternetArchiveReaderProps {
  book: Book | null;
  isOpen: boolean;
  onClose: () => void;
}

const InternetArchiveReader = ({ book, isOpen, onClose }: InternetArchiveReaderProps) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [zoom, setZoom] = useState(100);
  const [rotation, setRotation] = useState(0);
  const [viewMode, setViewMode] = useState<'single' | 'double'>('single');
  const [isFullscreen, setIsFullscreen] = useState(false);
  
  // Extract Internet Archive identifier from the book's internet_archive_url
  const archiveId = book?.internet_archive_url ? 
    book.internet_archive_url.match(/archive\.org\/details\/([^\/\?]+)/)?.[1] : null;

  const { data: bookMetadata, isLoading: isMetadataLoading } = useInternetArchiveBook(archiveId || '');
  const { data: pages = [], isLoading: isPagesLoading } = useBookPages(archiveId || '');

  useEffect(() => {
    if (book) {
      setCurrentPage(1);
      setZoom(100);
      setRotation(0);
    }
  }, [book]);

  if (!book || !archiveId) return null;

  const isLoading = isMetadataLoading || isPagesLoading;
  const totalPages = pages.length;

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

  const renderPage = (pageNumber: number) => {
    const page = pages[pageNumber - 1];
    if (!page) return null;

    return (
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
        <img
          src={page.imageUrl}
          alt={`Page ${pageNumber}`}
          className="max-w-full max-h-full object-contain"
          onError={(e) => {
            // Fallback to placeholder if image fails to load
            const target = e.target as HTMLImageElement;
            target.src = `https://via.placeholder.com/600x800/f0f0f0/333333?text=Page+${pageNumber}`;
          }}
        />
      </div>
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className={`max-w-full ${isFullscreen ? 'h-screen' : 'max-h-[90vh]'} p-0 bg-gray-100`}>
        {/* Top Toolbar */}
        <div className="bg-white border-b px-4 py-3 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <h2 className="text-lg font-semibold truncate">
              {bookMetadata?.metadata.title || book.title}
            </h2>
            <span className="text-sm text-gray-500">
              by {bookMetadata?.metadata.creator || book.author}
            </span>
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
            <Button variant="outline" size="sm" onClick={handleZoomOut}>
              <ZoomOut className="w-4 h-4" />
            </Button>
            <span className="text-sm min-w-[50px] text-center">{zoom}%</span>
            <Button variant="outline" size="sm" onClick={handleZoomIn}>
              <ZoomIn className="w-4 h-4" />
            </Button>
            
            {/* Rotate */}
            <Button variant="outline" size="sm" onClick={handleRotate}>
              <RotateCw className="w-4 h-4" />
            </Button>
            
            {/* Fullscreen Toggle */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsFullscreen(!isFullscreen)}
            >
              {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
            </Button>
            
            {/* Close */}
            <Button variant="outline" size="sm" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Page Content Area */}
        <div className="flex-1 flex items-center justify-center p-4 bg-gray-100 overflow-auto">
          {isLoading ? (
            <div className="flex items-center space-x-2">
              <Loader2 className="w-6 h-6 animate-spin" />
              <span>Loading book pages...</span>
            </div>
          ) : (
            <div className="flex items-center space-x-4">
              {/* Previous Page Button */}
              <Button
                variant="outline"
                size="lg"
                onClick={handlePrevPage}
                disabled={currentPage <= 1}
                className="h-16"
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
              >
                <ChevronRight className="w-6 h-6" />
              </Button>
            </div>
          )}
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

export default InternetArchiveReader;
