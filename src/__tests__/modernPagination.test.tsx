/** @vitest-environment jsdom */

import React from 'react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import '@testing-library/jest-dom/vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import LibraryPagination from '@/components/library/LibraryPagination';

afterEach(() => {
  cleanup();
});

describe('LibraryPagination component', () => {
  it('renders modern summary pill with total count and current range', () => {
    render(
      <LibraryPagination
        totalCount={1027}
        currentPage={1}
        pageSize={24}
        onPageChange={() => {}}
        onPageSizeChange={() => {}}
        itemLabel="books"
      />
    );

    expect(screen.getByText(/Showing/i)).toBeInTheDocument();
    expect(screen.getByText('1–24')).toBeInTheDocument();
    expect(screen.getByText('1,027')).toBeInTheDocument();
    expect(screen.getByText(/books/i)).toBeInTheDocument();
  });

  it('renders navigation buttons and triggers onPageChange on page click', () => {
    const handlePageChange = vi.fn();
    render(
      <LibraryPagination
        totalCount={100}
        currentPage={2}
        pageSize={10}
        onPageChange={handlePageChange}
        onPageSizeChange={() => {}}
      />
    );

    const page3Btn = screen.getByRole('button', { name: 'Page 3' });
    fireEvent.click(page3Btn);
    expect(handlePageChange).toHaveBeenCalledWith(3);
  });

  it('navigates next and previous properly', () => {
    const handlePageChange = vi.fn();
    render(
      <LibraryPagination
        totalCount={100}
        currentPage={5}
        pageSize={10}
        onPageChange={handlePageChange}
        onPageSizeChange={() => {}}
      />
    );

    const prevBtn = screen.getByRole('button', { name: 'Previous page' });
    const nextBtn = screen.getByRole('button', { name: 'Next page' });

    fireEvent.click(prevBtn);
    expect(handlePageChange).toHaveBeenCalledWith(4);

    fireEvent.click(nextBtn);
    expect(handlePageChange).toHaveBeenCalledWith(6);
  });

  it('disables previous and first buttons when on first page', () => {
    render(
      <LibraryPagination
        totalCount={50}
        currentPage={1}
        pageSize={10}
        onPageChange={() => {}}
        onPageSizeChange={() => {}}
      />
    );

    expect(screen.getByRole('button', { name: 'Previous page' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'First page' })).toBeDisabled();
  });

  it('disables next and last buttons when on last page', () => {
    render(
      <LibraryPagination
        totalCount={50}
        currentPage={5}
        pageSize={10}
        onPageChange={() => {}}
        onPageSizeChange={() => {}}
      />
    );

    expect(screen.getByRole('button', { name: 'Next page' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Last page' })).toBeDisabled();
  });

  it('supports direct page jump via form submission', () => {
    const handlePageChange = vi.fn();
    render(
      <LibraryPagination
        totalCount={200}
        currentPage={1}
        pageSize={10}
        onPageChange={handlePageChange}
        onPageSizeChange={() => {}}
      />
    );

    const jumpInput = screen.getByLabelText('Page number to jump to');
    fireEvent.change(jumpInput, { target: { value: '15' } });

    const goBtn = screen.getByRole('button', { name: 'Go' });
    fireEvent.click(goBtn);

    expect(handlePageChange).toHaveBeenCalledWith(15);
  });

  it('returns null when totalCount is 0', () => {
    const { container } = render(
      <LibraryPagination
        totalCount={0}
        currentPage={1}
        pageSize={10}
        onPageChange={() => {}}
        onPageSizeChange={() => {}}
      />
    );

    expect(container.firstChild).toBeNull();
  });
});
