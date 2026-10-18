import React, { useEffect, useState } from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  MoreHorizontal,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export interface LibraryPaginationProps {
  totalCount: number;
  currentPage: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
  scrollTargetRef?: React.RefObject<HTMLElement>;
  itemLabel?: string;
  className?: string;
  pageSizeOptions?: number[];
}

export const LibraryPagination: React.FC<LibraryPaginationProps> = ({
  totalCount,
  currentPage,
  pageSize,
  onPageChange,
  onPageSizeChange,
  scrollTargetRef,
  itemLabel = 'books',
  className,
  pageSizeOptions = [12, 24, 48, 96],
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
    if (!isNaN(size) && size > 0) {
      onPageSizeChange(size);
      onPageChange(1);
    }
  };

  const handleGo = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const pageNum = parseInt(goInput, 10);
    if (!pageNum || pageNum < 1 || pageNum > totalPages) {
      setError(`1–${totalPages}`);
      return;
    }
    setError('');
    onPageChange(pageNum);
    setGoInput('');
  };

  // Modern, clean visible page numbers calculation
  const getVisiblePages = (): (number | 'ellipsis')[] => {
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    if (currentPage <= 4) {
      return [1, 2, 3, 4, 5, 'ellipsis', totalPages];
    }

    if (currentPage >= totalPages - 3) {
      return [1, 'ellipsis', totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
    }

    return [1, 'ellipsis', currentPage - 1, currentPage, currentPage + 1, 'ellipsis', totalPages];
  };

  const visiblePages = getVisiblePages();

  if (totalCount === 0) {
    return null;
  }

  return (
    <nav
      role="navigation"
      aria-label="Pagination"
      className={cn(
        'flex flex-col lg:flex-row items-center justify-between gap-4 p-3 sm:p-4 rounded-2xl bg-white/80 dark:bg-[#121614]/80 backdrop-blur-md border border-[#E8E2D9] dark:border-[#26302A] shadow-xs text-[#1C201D] dark:text-[#F3F0E7]',
        className
      )}
    >
      {/* Left: Summary & Page Size Selector */}
      <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 w-full lg:w-auto text-xs sm:text-sm text-[#636B65] dark:text-[#A5ADA6]">
        <span>
          Showing{' '}
          <strong className="font-semibold text-[#1C201D] dark:text-[#F3F0E7]">
            {start.toLocaleString()}–{end.toLocaleString()}
          </strong>{' '}
          of{' '}
          <strong className="font-semibold text-[#1C201D] dark:text-[#F3F0E7]">
            {totalCount.toLocaleString()}
          </strong>{' '}
          {itemLabel}
        </span>

        <span className="hidden sm:inline text-[#E8E2D9] dark:text-[#26302A]">•</span>

        <div className="flex items-center gap-1.5">
          <span className="text-xs">Per page:</span>
          <Select value={String(pageSize)} onValueChange={handlePageSizeChange}>
            <SelectTrigger
              aria-label="Items per page"
              className="h-7 w-[68px] text-xs font-medium rounded-lg border-[#E8E2D9] dark:border-[#26302A] bg-white dark:bg-[#181F1B] text-[#1C201D] dark:text-[#F3F0E7] focus:ring-1 focus:ring-[#1C442D] dark:focus:ring-[#D5B16D]"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-white dark:bg-[#181F1B] border-[#E8E2D9] dark:border-[#26302A] text-xs">
              {Array.from(new Set([...pageSizeOptions, pageSize]))
                .sort((a, b) => a - b)
                .map((size) => (
                  <SelectItem key={size} value={size.toString()} className="text-xs cursor-pointer">
                    {size}
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Center: Pagination Controls */}
      {totalPages > 1 && (
        <div className="inline-flex items-center gap-1 p-1 rounded-xl bg-[#F4EFEA]/80 dark:bg-[#181F1B]/90 border border-[#E8E2D9]/70 dark:border-[#26302A] shadow-2xs">
          {/* First Page */}
          <button
            type="button"
            onClick={() => onPageChange(1)}
            disabled={currentPage === 1}
            aria-label="First page"
            className="hidden sm:flex h-8 w-8 items-center justify-center rounded-lg text-[#636B65] dark:text-[#A5ADA6] hover:text-[#1C201D] dark:hover:text-[#F3F0E7] hover:bg-white dark:hover:bg-[#202823] disabled:opacity-30 disabled:pointer-events-none transition-all cursor-pointer"
          >
            <ChevronsLeft className="w-4 h-4" />
          </button>

          {/* Previous Page */}
          <button
            type="button"
            onClick={() => onPageChange(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1}
            aria-label="Previous page"
            className="h-8 px-2 sm:px-2.5 flex items-center justify-center gap-1 rounded-lg text-xs font-medium text-[#636B65] dark:text-[#A5ADA6] hover:text-[#1C201D] dark:hover:text-[#F3F0E7] hover:bg-white dark:hover:bg-[#202823] disabled:opacity-30 disabled:pointer-events-none transition-all cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" />
            <span className="hidden md:inline">Prev</span>
          </button>

          {/* Page Numbers */}
          <div className="flex items-center gap-1">
            {visiblePages.map((page, idx) =>
              page === 'ellipsis' ? (
                <span
                  key={`ellipsis-${idx}`}
                  className="h-8 w-6 flex items-center justify-center text-[#9CA3AF] dark:text-[#6B7280]"
                  aria-hidden="true"
                >
                  <MoreHorizontal className="w-3.5 h-3.5" />
                </span>
              ) : (
                <button
                  key={page}
                  type="button"
                  onClick={() => onPageChange(page)}
                  aria-current={page === currentPage ? 'page' : undefined}
                  aria-label={`Page ${page}`}
                  className={cn(
                    'h-8 min-w-8 px-2 flex items-center justify-center rounded-lg text-xs font-medium transition-all cursor-pointer',
                    page === currentPage
                      ? 'bg-[#1C442D] text-white dark:bg-[#D5B16D] dark:text-[#0B0D0C] font-semibold shadow-xs'
                      : 'text-[#636B65] dark:text-[#A5ADA6] hover:text-[#1C201D] dark:hover:text-[#F3F0E7] hover:bg-white dark:hover:bg-[#202823]'
                  )}
                >
                  {page}
                </button>
              )
            )}
          </div>

          {/* Next Page */}
          <button
            type="button"
            onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage === totalPages}
            aria-label="Next page"
            className="h-8 px-2 sm:px-2.5 flex items-center justify-center gap-1 rounded-lg text-xs font-medium text-[#636B65] dark:text-[#A5ADA6] hover:text-[#1C201D] dark:hover:text-[#F3F0E7] hover:bg-white dark:hover:bg-[#202823] disabled:opacity-30 disabled:pointer-events-none transition-all cursor-pointer"
          >
            <span className="hidden md:inline">Next</span>
            <ChevronRight className="w-4 h-4" />
          </button>

          {/* Last Page */}
          <button
            type="button"
            onClick={() => onPageChange(totalPages)}
            disabled={currentPage === totalPages}
            aria-label="Last page"
            className="hidden sm:flex h-8 w-8 items-center justify-center rounded-lg text-[#636B65] dark:text-[#A5ADA6] hover:text-[#1C201D] dark:hover:text-[#F3F0E7] hover:bg-white dark:hover:bg-[#202823] disabled:opacity-30 disabled:pointer-events-none transition-all cursor-pointer"
          >
            <ChevronsRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Right: Quick Jump to Page (when > 4 pages) */}
      {totalPages > 4 && (
        <form
          onSubmit={handleGo}
          className="flex items-center gap-1.5 text-xs text-[#636B65] dark:text-[#A5ADA6] w-full lg:w-auto justify-center lg:justify-end"
        >
          <span>Page</span>
          <Input
            type="number"
            value={goInput}
            onChange={(e) => {
              setGoInput(e.target.value);
              if (error) setError('');
            }}
            placeholder={String(currentPage)}
            aria-label="Page number to jump to"
            className={cn(
              'w-12 h-7 px-1 text-center text-xs font-medium rounded-lg border-[#E8E2D9] dark:border-[#26302A] bg-white dark:bg-[#181F1B] text-[#1C201D] dark:text-[#F3F0E7] focus:ring-1 focus:ring-[#1C442D] dark:focus:ring-[#D5B16D]',
              error && 'border-red-500 focus:ring-red-500'
            )}
            min={1}
            max={totalPages}
          />
          <span>of {totalPages.toLocaleString()}</span>
          <Button
            type="submit"
            variant="ghost"
            size="sm"
            disabled={!goInput.trim()}
            className="h-7 px-2 text-xs font-medium text-[#1C442D] dark:text-[#D5B16D] hover:bg-[#1C442D]/10 dark:hover:bg-[#D5B16D]/10 disabled:opacity-30"
          >
            Go
          </Button>
        </form>
      )}
    </nav>
  );
};

export default LibraryPagination;
