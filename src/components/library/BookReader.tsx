
import React, { useState, useEffect, useCallback } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  RotateCw,
  BookOpen,
  X,
  Maximize,
  Minimize,
  Moon,
  Sun,
} from 'lucide-react';
import { motion } from 'framer-motion';
import type { Book } from '@/hooks/useLibraryBooks';

interface BookReaderProps {
  book: Book | null;
  isOpen: boolean;
  onClose: () => void;
}

const BookReader = ({ book, isOpen, onClose }: BookReaderProps) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(200);
  const [zoom, setZoom] = useState(100);
  const [rotation, setRotation] = useState(0);
  const [viewMode, setViewMode] = useState<'single' | 'double'>('double');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [darkMode, setDarkMode] = useState(false);

  // Load book data + last page
  useEffect(() => {
    if (book) {
      const savedPage = localStorage.getItem(`book-${book.id}-page`);
      setTotalPages(book.pages || 200);
      setCurrentPage(savedPage ? parseInt(savedPage) : 1);
    }
  }, [book]);

  // Save last page
  useEffect(() => {
    if (book) {
      localStorage.setItem(`book-${book.id}-page`, String(currentPage));
    }
  }, [book, currentPage]);

  // Navigation helpers
  const handlePrevPage = useCallback(() => {
    setCurrentPage((prev) =>
      viewMode === 'double' ? Math.max(1, prev - 2) : Math.max(1, prev - 1)
    );
  }, [viewMode]);

  const handleNextPage = useCallback(() => {
    setCurrentPage((prev) =>
      viewMode === 'double'
        ? Math.min(totalPages - 1, prev + 2)
        : Math.min(totalPages, prev + 1)
    );
  }, [viewMode, totalPages]);

  const handleZoomIn = () => setZoom((z) => Math.min(200, z + 25));
  const handleZoomOut = () => setZoom((z) => Math.max(50, z - 25));
  const handleRotate = () => setRotation((r) => (r + 90) % 360);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (!isOpen) return;
      switch (e.key) {
        case 'ArrowLeft':
          handlePrevPage();
          break;
        case 'ArrowRight':
          handleNextPage();
          break;
        case '+':
          handleZoomIn();
          break;
        case '-':
          handleZoomOut();
          break;
        case 'r':
        case 'R':
          handleRotate();
          break;
        case 'd':
        case 'D':
          setDarkMode((d) => !d);
          break;
        case 'Escape':
          if (isFullscreen) setIsFullscreen(false);
          else onClose();
          break;
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isOpen, handlePrevPage, handleNextPage, isFullscreen, onClose]);

  // Page rendering
  const renderPage = (pageNumber: number) => (
    <motion.div
      key={pageNumber}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className={`shadow-lg border rounded-lg flex items-center justify-center transition-colors duration-300
        ${darkMode ? 'bg-gray-900 text-gray-100 border-gray-700' : 'bg-white text-black border-gray-200'}
      `}
      style={{
        transform: `scale(${zoom / 100}) rotate(${rotation}deg)`,
        transformOrigin: 'center',
        width: '100%',
        height: '600px',
        minWidth: '400px',
      }}
    >
      <div className="p-8 w-full h-full flex flex-col">
        <div className="text-2xl font-bold mb-4 text-center">{book?.title}</div>
        <div className="text-lg mb-2 text-center">by {book?.author}</div>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <BookOpen className="w-24 h-24 mx-auto mb-4 opacity-60" />
            <div className="text-lg font-semibold mb-2">Page {pageNumber}</div>
            <div className="text-sm max-w-md">
              {pageNumber === 1
                ? book?.description
                : `This would show the actual content of page ${pageNumber}.`}
            </div>
          </div>
        </div>
        <div className="text-center text-sm mt-4">
          Page {pageNumber} of {totalPages}
        </div>
      </div>
    </motion.div>
  );

  if (!book) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        className={`max-w-full ${
          isFullscreen ? 'h-screen' : 'max-h-[90vh]'
        } p-0 transition-colors duration-300 ${
          darkMode ? 'bg-gray-950 text-gray-100' : 'bg-gray-100 text-gray-900'
        }`}
      >
        {/* Top Toolbar */}
        <div
          className={`border-b px-4 py-3 flex items-center justify-between transition-colors duration-300 ${
            darkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'
          }`}
        >
          <div className="flex items-center space-x-4">
            <h2 className="text-lg font-semibold truncate">{book.title}</h2>
            <span className="text-sm opacity-75">by {book.author}</span>
          </div>

          <div className="flex items-center space-x-2">
            {/* Dark Mode Toggle */}
            <Button variant="outline" size="sm" onClick={() => setDarkMode(!darkMode)}>
              {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                setViewMode(viewMode === 'single' ? 'double' : 'single')
              }
            >
              {viewMode === 'single' ? 'Single Page' : 'Double Page'}
            </Button>

            <Button variant="outline" size="sm" onClick={handleZoomOut}>
              <ZoomOut className="w-4 h-4" />
            </Button>
            <span className="text-sm min-w-[50px] text-center">{zoom}%</span>
            <Button variant="outline" size="sm" onClick={handleZoomIn}>
              <ZoomIn className="w-4 h-4" />
            </Button>

            <Button variant="outline" size="sm" onClick={handleRotate}>
              <RotateCw className="w-4 h-4" />
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsFullscreen(!isFullscreen)}
            >
              {isFullscreen ? (
                <Minimize className="w-4 h-4" />
              ) : (
                <Maximize className="w-4 h-4" />
              )}
            </Button>

            <Button variant="outline" size="sm" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Page Content */}
        <div
          className={`flex-1 flex items-center justify-center p-4 overflow-auto transition-colors duration-300 ${
            darkMode ? 'bg-gray-950' : 'bg-gray-100'
          }`}
        >
          <div className="flex items-center space-x-4">
            <Button
              variant="outline"
              size="lg"
              onClick={handlePrevPage}
              disabled={currentPage <= 1}
              className="h-16"
            >
              <ChevronLeft className="w-6 h-6" />
            </Button>

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
        </div>

        {/* Bottom Navigation */}
        <div
          className={`border-t px-4 py-3 flex items-center justify-between transition-colors duration-300 ${
            darkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'
          }`}
        >
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
                onChange={(e) => setCurrentPage(Number(e.target.value))}
                className="w-32"
              />
              <input
                type="number"
                min={1}
                max={totalPages}
                value={currentPage}
                onChange={(e) =>
                  setCurrentPage(
                    Math.min(totalPages, Math.max(1, Number(e.target.value)))
                  )
                }
                className={`w-16 border rounded text-center ${
                  darkMode ? 'bg-gray-800 border-gray-700 text-gray-100' : ''
                }`}
              />
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handlePrevPage}
              disabled={currentPage <= 1}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleNextPage}
              disabled={currentPage >= totalPages}
            >
              Next
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default BookReader;
