// @vitest-environment jsdom
import React from 'react';
import '@testing-library/jest-dom/vitest';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import BookInfo from './BookInfo';

describe('BookInfo', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  it('renders author and metadata fields properly', () => {
    const onAuthorClick = vi.fn();
    render(
      <BookInfo
        author="Leo Tolstoy"
        rating={4.7}
        genre="Classic"
        publicationYear={1869}
        pages={1225}
        language="Russian"
        isbn="978-0199232765"
        onAuthorClick={onAuthorClick}
      />
    );

    expect(screen.getByRole('heading', { level: 2, name: 'by Leo Tolstoy' })).toBeInTheDocument();
    expect(screen.getByText('4.7')).toBeInTheDocument();
    expect(screen.getByText('Classic')).toBeInTheDocument();
    expect(screen.getByText('Published 1869')).toBeInTheDocument();
    expect(screen.getByText('1225 pages')).toBeInTheDocument();
    expect(screen.getByText('Russian')).toBeInTheDocument();
    expect(screen.getByText('978-0199232765')).toBeInTheDocument();

    const infoBtn = screen.getByTitle('Learn more about the author');
    fireEvent.click(infoBtn);
    expect(onAuthorClick).toHaveBeenCalled();
  });

  it('handles zero or missing values gracefully', () => {
    const onAuthorClick = vi.fn();
    render(
      <BookInfo
        author="Anonymous"
        onAuthorClick={onAuthorClick}
      />
    );

    expect(screen.getByRole('heading', { level: 2, name: 'by Anonymous' })).toBeInTheDocument();
    expect(screen.getByText('0.0')).toBeInTheDocument();
    expect(screen.queryByText(/Published/i)).not.toBeInTheDocument();
  });
});

