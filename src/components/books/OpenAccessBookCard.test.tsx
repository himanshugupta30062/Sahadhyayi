import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import OpenAccessBookCard from './OpenAccessBookCard';
import { ExternalBook } from '@/utils/searchExternalSources';

describe('OpenAccessBookCard', () => {
  it('renders book metadata and download button', () => {
    const book: ExternalBook = {
      id: 'ext-1',
      md5: 'md5-principia-123',
      title: 'Principia Mathematica',
      author: 'Isaac Newton',
      year: '1687',
      language: 'Latin',
      extension: 'pdf',
      size: '14 MB',
      downloadUrl: 'https://archive.org/details/principia',
      source: 'open_access',
    };

    render(<OpenAccessBookCard book={book} />);

    expect(screen.getByText('Principia Mathematica')).toBeInTheDocument();
    expect(screen.getByText('Isaac Newton')).toBeInTheDocument();
    expect(screen.getByText('1687')).toBeInTheDocument();
    expect(screen.getByText('Latin')).toBeInTheDocument();
    expect(screen.getByText('PDF')).toBeInTheDocument();
    expect(screen.getByText('14 MB')).toBeInTheDocument();

    const downloadLink = screen.getByRole('link', { name: /download/i });
    expect(downloadLink).toHaveAttribute('href', 'https://archive.org/details/principia');
  });
});
