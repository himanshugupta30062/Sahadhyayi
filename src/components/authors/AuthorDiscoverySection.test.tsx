import { cleanup, render, screen } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { afterEach, describe, expect, it } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import AuthorDiscoverySection from '@/components/authors/AuthorDiscoverySection';

describe('AuthorDiscoverySection', () => {
  afterEach(() => cleanup());

  it('renders nothing when author list is empty or authors have 0 books', () => {
    const { container } = render(
      <MemoryRouter>
        <AuthorDiscoverySection authors={[{ id: '1', name: 'Zero Books', books_count: 0 } as any]} />
      </MemoryRouter>
    );

    expect(container).toBeEmptyDOMElement();
  });

  it('renders authors sorted by book count and displays custom title/description', () => {
    const authors = [
      { id: '1', name: 'George Orwell', books_count: 5, profile_image_url: '/orwell.jpg' },
      { id: '2', name: 'Jane Austen', books_count: 10, profile_image_url: null },
    ];

    render(
      <MemoryRouter>
        <AuthorDiscoverySection
          authors={authors as any}
          title="Featured Authors"
          description="Read from the best"
          limit={6}
        />
      </MemoryRouter>
    );

    expect(screen.getByText('Featured Authors')).toBeInTheDocument();
    expect(screen.getByText('Read from the best')).toBeInTheDocument();
    expect(screen.getByText('Jane Austen')).toBeInTheDocument();
    expect(screen.getByText('George Orwell')).toBeInTheDocument();
    expect(screen.getByText('10 books in catalogue')).toBeInTheDocument();
    expect(screen.getByText('5 books in catalogue')).toBeInTheDocument();
    expect(screen.getByText('All authors →')).toBeInTheDocument();
  });
});
