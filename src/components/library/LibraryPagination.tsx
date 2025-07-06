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

interface LibraryPaginationProps {
  totalCount: number;
  currentPage: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
}

const LibraryPagination: React.FC<LibraryPaginationProps> = ({
  totalCount,
  currentPage,
  pageSize,
  onPageChange,
  onPageSizeChange,
}) => {
  const totalPages = Math.ceil(totalCount / pageSize) || 1;
  const [goInput, setGoInput] = useState('');
  const [error, setError] = useState('');

  const start = totalCount === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const end = Math.min(currentPage * pageSize, totalCount);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [currentPage, pageSize]);

  const handlePageSizeChange = (value: string) => {
    const size = parseInt(value, 10);
    onPageSizeChange(size);
    onPageChange(1);
  };

  const handleGo = () => {
    const pageNum = parseInt(goInput, 10);
    if (!pageNum || pageNum < 1 || pageNum > totalPages) {
      setError('Invalid page number.');
      return;
    }
    setError('');
    onPageChange(pageNum);
    setGoInput('');
  };

  const pageNumbers: number[] = [];
  const startPage = Math.max(1, currentPage - 2);
  const endPage = Math.min(totalPages, currentPage + 2);
  for (let i = startPage; i <= endPage; i++) {
    pageNumbers.push(i);
  }

  const disabledStyle = 'pointer-events-none opacity-50';

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-2">
        <span className="text-sm">
          Showing {start}-{end} of {totalCount} books
        </span>
        <div className="flex items-center gap-2">
          <span className="text-sm">Books per page</span>
          <Select value={String(pageSize)} onValueChange={handlePageSizeChange}>
            <SelectTrigger className="w-24 h-8">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {[10, 20, 50, 100].map((size) => (
                <SelectItem key={size} value={size.toString()}>{size}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {totalPages > 1 && (
        <div className="flex flex-col items-center gap-2">
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationLink
                  href="#"
                  aria-label="First page"
                  className={currentPage === 1 ? disabledStyle : ''}
                  onClick={(e) => {
                    e.preventDefault();
                    if (currentPage !== 1) onPageChange(1);
                  }}
                >
                  ⏮️
                </PaginationLink>
              </PaginationItem>
              <PaginationItem>
                <PaginationLink
                  href="#"
                  aria-label="Previous page"
                  className={currentPage === 1 ? disabledStyle : ''}
                  onClick={(e) => {
                    e.preventDefault();
                    if (currentPage > 1) onPageChange(currentPage - 1);
                  }}
                >
                  ◀️
                </PaginationLink>
              </PaginationItem>
              {pageNumbers.map((page) => (
                <PaginationItem key={page}>
                  <PaginationLink
                    href="#"
                    isActive={page === currentPage}
                    onClick={(e) => {
                      e.preventDefault();
                      onPageChange(page);
                    }}
                  >
                    {page}
                  </PaginationLink>
                </PaginationItem>
              ))}
              {totalPages > endPage && (
                <PaginationItem>
                  <PaginationEllipsis />
                </PaginationItem>
              )}
              <PaginationItem>
                <PaginationLink
                  href="#"
                  aria-label="Next page"
                  className={currentPage === totalPages ? disabledStyle : ''}
                  onClick={(e) => {
                    e.preventDefault();
                    if (currentPage < totalPages) onPageChange(currentPage + 1);
                  }}
                >
                  ▶️
                </PaginationLink>
              </PaginationItem>
              <PaginationItem>
                <PaginationLink
                  href="#"
                  aria-label="Last page"
                  className={currentPage === totalPages ? disabledStyle : ''}
                  onClick={(e) => {
                    e.preventDefault();
                    if (currentPage !== totalPages) onPageChange(totalPages);
                  }}
                >
                  ⏭️
                </PaginationLink>
              </PaginationItem>
            </PaginationContent>
          </Pagination>

          {totalPages > 10 && (
            <div className="flex flex-col sm:flex-row items-center gap-2">
              <span className="text-sm">Go to page</span>
              <Input
                type="text"
                value={goInput}
                onChange={(e) => setGoInput(e.target.value)}
                className="w-20 h-8"
              />
              <Button size="sm" variant="outline" onClick={handleGo}>
                Go
              </Button>
              {error && <span className="text-red-500 text-xs">{error}</span>}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default LibraryPagination;
