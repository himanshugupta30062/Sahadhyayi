import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationPrevious,
  PaginationNext,
  PaginationEllipsis,
} from './pagination';

describe('Pagination UI', () => {
  it('renders navigation list with previous, next, page numbers, and ellipsis', () => {
    render(
      <Pagination>
        <PaginationContent>
          <PaginationItem>
            <PaginationPrevious href="#prev" />
          </PaginationItem>
          <PaginationItem>
            <PaginationLink href="#1" isActive>1</PaginationLink>
          </PaginationItem>
          <PaginationItem>
            <PaginationLink href="#2">2</PaginationLink>
          </PaginationItem>
          <PaginationItem>
            <PaginationEllipsis />
          </PaginationItem>
          <PaginationItem>
            <PaginationNext href="#next" />
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    );

    const nav = screen.getByRole('navigation', { name: /pagination/i });
    expect(nav).toBeInTheDocument();
    expect(screen.getByText('1')).toHaveAttribute('aria-current', 'page');
    expect(screen.getByText('2')).not.toHaveAttribute('aria-current');
    expect(screen.getByText(/previous/i)).toBeInTheDocument();
    expect(screen.getByText(/next/i)).toBeInTheDocument();
    expect(screen.getByText(/more pages/i)).toBeInTheDocument();
  });
});
