import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { describe, expect, it, vi } from 'vitest';
import LibraryPagination from './LibraryPagination';

describe('LibraryPagination', () => {
  it('returns null when totalCount is 0', () => {
    const { container } = render(
      <LibraryPagination
        totalCount={0}
        currentPage={1}
        pageSize={12}
        onPageChange={vi.fn()}
        onPageSizeChange={vi.fn()}
      />
    );
    expect(container.firstChild).toBeNull();
  });

  it('renders summary information and page numbers for multiple pages', () => {
    const onPageChange = vi.fn();
    const onPageSizeChange = vi.fn();

    render(
      <LibraryPagination
        totalCount={120}
        currentPage={2}
        pageSize={12}
        onPageChange={onPageChange}
        onPageSizeChange={onPageSizeChange}
      />
    );

    expect(screen.getByText(/Showing/)).toBeInTheDocument();
    expect(screen.getByText('13–24')).toBeInTheDocument();
    expect(screen.getByText('120')).toBeInTheDocument();

    const page2Btn = screen.getByRole('button', { name: 'Page 2' });
    expect(page2Btn).toHaveAttribute('aria-current', 'page');

    // Click Next page
    const nextBtn = screen.getByRole('button', { name: /Next page/i });
    fireEvent.click(nextBtn);
    expect(onPageChange).toHaveBeenCalledWith(3);

    // Click Previous page
    const prevBtn = screen.getByRole('button', { name: /Previous page/i });
    fireEvent.click(prevBtn);
    expect(onPageChange).toHaveBeenCalledWith(1);

    // Click First page
    const firstBtn = screen.getByRole('button', { name: /First page/i });
    fireEvent.click(firstBtn);
    expect(onPageChange).toHaveBeenCalledWith(1);

    // Click Last page
    const lastBtn = screen.getByRole('button', { name: /Last page/i });
    fireEvent.click(lastBtn);
    expect(onPageChange).toHaveBeenCalledWith(10);
  });

  it('disables previous and first buttons on page 1', () => {
    render(
      <LibraryPagination
        totalCount={50}
        currentPage={1}
        pageSize={10}
        onPageChange={vi.fn()}
        onPageSizeChange={vi.fn()}
      />
    );

    expect(screen.getByRole('button', { name: /Previous page/i })).toBeDisabled();
    expect(screen.getByRole('button', { name: /First page/i })).toBeDisabled();
    expect(screen.getByRole('button', { name: /Next page/i })).not.toBeDisabled();
  });

  it('disables next and last buttons on the last page', () => {
    render(
      <LibraryPagination
        totalCount={50}
        currentPage={5}
        pageSize={10}
        onPageChange={vi.fn()}
        onPageSizeChange={vi.fn()}
      />
    );

    expect(screen.getByRole('button', { name: /Next page/i })).toBeDisabled();
    expect(screen.getByRole('button', { name: /Last page/i })).toBeDisabled();
    expect(screen.getByRole('button', { name: /Previous page/i })).not.toBeDisabled();
  });

  it('handles jump to page input and validation', () => {
    const onPageChange = vi.fn();

    render(
      <LibraryPagination
        totalCount={100}
        currentPage={1}
        pageSize={10}
        onPageChange={onPageChange}
        onPageSizeChange={vi.fn()}
      />
    );

    const input = screen.getByRole('spinbutton', { name: /Page number to jump to/i });
    const goBtn = screen.getByRole('button', { name: /Go/i });

    // Initially disabled when empty
    expect(goBtn).toBeDisabled();

    // Type page 7
    fireEvent.change(input, { target: { value: '7' } });
    expect(goBtn).not.toBeDisabled();
    fireEvent.click(goBtn);
    expect(onPageChange).toHaveBeenCalledWith(7);

    // Type invalid page (e.g. 99 when totalPages is 10)
    fireEvent.change(input, { target: { value: '99' } });
    fireEvent.click(goBtn);
    // onPageChange should not have been called with 99
    expect(onPageChange).not.toHaveBeenCalledWith(99);
  });

  it('scrolls into view when currentPage or pageSize changes if scrollTargetRef provided', () => {
    const scrollMock = vi.fn();
    const ref = { current: { scrollIntoView: scrollMock } as unknown as HTMLElement };

    const { rerender } = render(
      <LibraryPagination
        totalCount={100}
        currentPage={1}
        pageSize={10}
        onPageChange={vi.fn()}
        onPageSizeChange={vi.fn()}
        scrollTargetRef={ref}
      />
    );

    expect(scrollMock).toHaveBeenCalledTimes(1);

    rerender(
      <LibraryPagination
        totalCount={100}
        currentPage={2}
        pageSize={10}
        onPageChange={vi.fn()}
        onPageSizeChange={vi.fn()}
        scrollTargetRef={ref}
      />
    );

    expect(scrollMock).toHaveBeenCalledTimes(2);
  });
});
