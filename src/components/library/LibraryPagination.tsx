
import React, { useEffect, useState } from 'react';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationEllipsis,
} from '@/components/ui/pagination';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';

interface LibraryPaginationProps {
  totalCount: number;
  currentPage: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
  scrollTargetRef?: React.RefObject<HTMLElement>;
}

const LibraryPagination: React.FC<LibraryPaginationProps> = ({
  totalCount,
  currentPage,
  pageSize,
  onPageChange,
  onPageSizeChange,
  scrollTargetRef,
}) => {
  const totalPages = Math.ceil(totalCount / pageSize) || 1;
  const [goInput, setGoInput] = useState('');
  const [error, setError] = useState('');

  const start = totalCount === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const end = Math.min(currentPage * pageSize, totalCount);

  useEffect(() => {
    if (scrollTargetRef?.current) {
      scrollTargetRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [currentPage, pageSize, scrollTargetRef]);

  const handlePageSizeChange = (value: string) => {
    const size = parseInt(value, 10);
    onPageSizeChange(size);
    onPageChange(1);
  };

  const handleGo = () => {
    const pageNum = parseInt(goInput, 10);
    if (!pageNum || pageNum < 1 || pageNum > totalPages) {
      setError(`Please enter a valid page number (1-${totalPages})`);
      return;
    }
    setError('');
    onPageChange(pageNum);
    setGoInput('');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleGo();
    }
  };

  // Generate page numbers for display with mobile responsiveness
  const getVisiblePages = (isMobile = false) => {
    const pages: (number | 'ellipsis')[] = [];
    const maxPages = isMobile ? 3 : 7; // Show fewer pages on mobile
    
    if (totalPages <= maxPages) {
      // Show all pages if within limit
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (isMobile) {
        // Mobile: show current page and maybe one on each side
        if (currentPage <= 2) {
          pages.push(1, 2, 3, 'ellipsis', totalPages);
        } else if (currentPage >= totalPages - 1) {
          pages.push(1, 'ellipsis', totalPages - 2, totalPages - 1, totalPages);
        } else {
          pages.push(1, 'ellipsis', currentPage, 'ellipsis', totalPages);
        }
      } else {
        // Desktop: original logic
        pages.push(1);
        
        if (currentPage <= 4) {
          for (let i = 2; i <= 5; i++) {
            pages.push(i);
          }
          pages.push('ellipsis');
          pages.push(totalPages);
        } else if (currentPage >= totalPages - 3) {
          pages.push('ellipsis');
          for (let i = totalPages - 4; i <= totalPages; i++) {
            pages.push(i);
          }
        } else {
          pages.push('ellipsis');
          for (let i = currentPage - 1; i <= currentPage + 1; i++) {
            pages.push(i);
          }
          pages.push('ellipsis');
          pages.push(totalPages);
        }
      }
    }
    
    return pages;
  };

  // Detect mobile screen size
  const [isMobile, setIsMobile] = useState(false);
  
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 640); // sm breakpoint
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const visiblePages = getVisiblePages(isMobile);

  if (totalCount === 0) {
    return null;
  }

  return (
    <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-gray-200 p-6 shadow-sm space-y-6">
      {/* Summary and Page Size Selector */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="text-sm font-medium text-gray-700 bg-blue-50 px-4 py-2 rounded-lg border border-blue-200">
          Showing <span className="font-bold text-blue-600">{start}-{end}</span> of{' '}
          <span className="font-bold text-blue-600">{totalCount}</span> books
        </div>
        
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium text-gray-700">Items per page:</span>
          <Select value={String(pageSize)} onValueChange={handlePageSizeChange}>
            <SelectTrigger className="w-24 h-9 border-2 border-gray-200 hover:border-blue-300 transition-colors font-medium">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {[10, 20, 30, 50].map((size) => (
                <SelectItem key={size} value={size.toString()} className="font-medium">
                  {size}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {totalPages > 1 && (
        <>
          {/* Main Pagination */}
          <div className="flex flex-col items-center gap-4">
            <Pagination>
              <PaginationContent className={`gap-1 ${isMobile ? 'flex-wrap justify-center' : 'gap-2'}`}>
                {/* First/Previous - Show only if not mobile or show compact version */}
                {!isMobile && (
                  <PaginationItem>
                    <Button
                      variant={currentPage === 1 ? "ghost" : "outline"}
                      size="sm"
                      disabled={currentPage === 1}
                      onClick={() => onPageChange(1)}
                      className="h-10 px-3 border-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <ChevronsLeft className="h-4 w-4" />
                      <span className="hidden sm:inline ml-1">First</span>
                    </Button>
                  </PaginationItem>
                )}

                {/* Previous Page */}
                <PaginationItem>
                  <Button
                    variant={currentPage === 1 ? "ghost" : "outline"}
                    size="sm"
                    disabled={currentPage === 1}
                    onClick={() => onPageChange(currentPage - 1)}
                    className={`border-2 disabled:opacity-50 disabled:cursor-not-allowed ${
                      isMobile ? 'h-9 w-9 px-0' : 'h-10 px-3'
                    }`}
                  >
                    <ChevronLeft className="h-4 w-4" />
                    {!isMobile && <span className="hidden sm:inline ml-1">Prev</span>}
                  </Button>
                </PaginationItem>

                {/* Page Numbers */}
                {visiblePages.map((page, index) => (
                  <PaginationItem key={index}>
                    {page === 'ellipsis' ? (
                      <PaginationEllipsis className={isMobile ? 'h-9 w-6' : ''} />
                    ) : (
                      <PaginationLink
                        href="#"
                        isActive={page === currentPage}
                        onClick={(e) => {
                          e.preventDefault();
                          onPageChange(page);
                        }}
                        className={`border-2 font-medium transition-all ${
                          isMobile ? 'h-9 w-9 text-sm' : 'h-10 w-10'
                        } ${
                          page === currentPage
                            ? 'bg-blue-600 text-white border-blue-600 shadow-lg'
                            : 'border-gray-200 hover:border-blue-300 hover:bg-blue-50'
                        }`}
                      >
                        {page}
                      </PaginationLink>
                    )}
                  </PaginationItem>
                ))}

                {/* Next Page */}
                <PaginationItem>
                  <Button
                    variant={currentPage === totalPages ? "ghost" : "outline"}
                    size="sm"
                    disabled={currentPage === totalPages}
                    onClick={() => onPageChange(currentPage + 1)}
                    className={`border-2 disabled:opacity-50 disabled:cursor-not-allowed ${
                      isMobile ? 'h-9 w-9 px-0' : 'h-10 px-3'
                    }`}
                  >
                    {!isMobile && <span className="hidden sm:inline mr-1">Next</span>}
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </PaginationItem>

                {/* Last Page - Hide on mobile */}
                {!isMobile && (
                  <PaginationItem>
                    <Button
                      variant={currentPage === totalPages ? "ghost" : "outline"}
                      size="sm"
                      disabled={currentPage === totalPages}
                      onClick={() => onPageChange(totalPages)}
                      className="h-10 px-3 border-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <span className="hidden sm:inline mr-1">Last</span>
                      <ChevronsRight className="h-4 w-4" />
                    </Button>
                  </PaginationItem>
                )}
              </PaginationContent>
            </Pagination>

            {/* Jump to Page (only show if more than 10 pages) */}
            {totalPages > 10 && (
              <div className="flex flex-col sm:flex-row items-center gap-3 bg-gray-50 p-4 rounded-lg border border-gray-200">
                <span className="text-sm font-medium text-gray-700">Jump to page:</span>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    value={goInput}
                    onChange={(e) => setGoInput(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder={`1-${totalPages}`}
                    className="w-20 h-9 text-center border-2 border-gray-200 focus:border-blue-400"
                    min={1}
                    max={totalPages}
                  />
                  <Button 
                    size="sm" 
                    onClick={handleGo}
                    className="h-9 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium"
                  >
                    Go
                  </Button>
                </div>
                {error && (
                  <span className="text-red-500 text-sm font-medium bg-red-50 px-3 py-1 rounded border border-red-200">
                    {error}
                  </span>
                )}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default LibraryPagination;
