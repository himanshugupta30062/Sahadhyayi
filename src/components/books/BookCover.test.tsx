// @vitest-environment jsdom
import React from 'react';
import '@testing-library/jest-dom/vitest';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import BookCover from './BookCover';
import { toast } from '@/hooks/use-toast';

vi.mock('@/hooks/use-toast', () => ({
  toast: vi.fn(),
}));

vi.mock('./AudioSummaryButton', () => ({
  default: () => <button data-testid="audio-summary-btn">Audio Summary</button>,
}));

vi.mock('@/components/social/margins/AddMarginNoteDialog', () => ({
  AddMarginNoteDialog: ({ trigger }: any) => <>{trigger}</>,
}));

vi.mock('@/components/ui/LazyImage', () => ({
  LazyImage: ({ src, alt }: any) => <img src={src} alt={alt} />,
}));

vi.mock('@/utils/catalog/bookCoverResolver', () => ({
  useResolvedBookCover: () => ({ coverUrl: null }),
}));

describe('BookCover', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  it('renders title placeholder when no cover image is provided', () => {
    render(
      <BookCover
        title="War and Peace"
        bookId="book-1"
      />
    );

    expect(screen.getByText('War and Peace')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /PDF Not Available/i })).toBeDisabled();
  });

  it('renders lazy cover image when provided', () => {
    render(
      <BookCover
        title="War and Peace"
        coverImageUrl="https://example.com/cover.jpg"
        bookId="book-1"
      />
    );

    expect(screen.getByRole('img', { name: 'Cover of War and Peace' })).toHaveAttribute(
      'src',
      'https://example.com/cover.jpg'
    );
  });

  it('handles direct PDF downloads for archive and gutenberg links', () => {
    const onDownload = vi.fn();
    render(
      <BookCover
        title="War and Peace"
        pdfUrl="https://archive.org/download/warandpeace.pdf"
        bookId="book-1"
        onDownload={onDownload}
      />
    );

    const downloadBtn = screen.getByRole('button', { name: /Download PDF/i });
    expect(downloadBtn).not.toBeDisabled();

    fireEvent.click(downloadBtn);
    expect(onDownload).toHaveBeenCalled();
  });

  it('handles external preview links for google books etc', () => {
    const windowOpenSpy = vi.spyOn(window, 'open').mockImplementation(() => null);
    render(
      <BookCover
        title="War and Peace"
        pdfUrl="https://books.google.com/preview"
        bookId="book-1"
      />
    );

    const previewBtn = screen.getByRole('button', { name: /View Preview/i });
    fireEvent.click(previewBtn);

    expect(windowOpenSpy).toHaveBeenCalledWith('https://books.google.com/preview', '_blank', 'noopener,noreferrer');
  });
});

