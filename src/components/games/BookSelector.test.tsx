import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import BookSelector from './BookSelector';

const mocks = vi.hoisted(() => {
  const query = {
    select: vi.fn(),
    or: vi.fn(),
    limit: vi.fn(),
  };
  return {
    query,
    from: vi.fn(),
    detectCapabilities: vi.fn(),
    applyFilter: vi.fn(),
    filterPublicBooks: vi.fn(),
  };
});

vi.mock('@/integrations/supabase/client', () => ({
  supabase: { from: mocks.from },
}));

vi.mock('@/utils/catalog/bookVisibility', () => ({
  detectBookSchemaCapabilities: mocks.detectCapabilities,
  applyPublicBookFilter: mocks.applyFilter,
  filterPublicBooks: mocks.filterPublicBooks,
}));

vi.mock('framer-motion', () => ({
  motion: { div: ({ children, ...props }: React.HTMLAttributes<HTMLDivElement>) => <div {...props}>{children}</div> },
}));

const books = [
  {
    id: 'book-1',
    title: 'The Discovery of India',
    author: 'Jawaharlal Nehru',
    cover_image_url: 'https://example.com/discovery.jpg',
    genre: 'History',
  },
  {
    id: 'book-2',
    title: 'Wings of Fire',
    author: null,
    cover_image_url: null,
    genre: null,
  },
];

describe('BookSelector', () => {
  let result: { data: typeof books; error: null | Error };

  beforeEach(() => {
    vi.clearAllMocks();
    result = { data: books, error: null };
    mocks.query.select.mockReturnValue(mocks.query);
    mocks.query.or.mockReturnValue(mocks.query);
    mocks.query.limit.mockImplementation(() => Promise.resolve(result));
    mocks.from.mockReturnValue(mocks.query);
    mocks.detectCapabilities.mockResolvedValue({
      hasStatus: false,
      hasCatalogStatus: false,
      checked: true,
    });
    mocks.applyFilter.mockImplementation((query) => query);
    mocks.filterPublicBooks.mockImplementation((rows) => rows);
  });

  it('shows the loading skeleton while the initial catalog request is pending', () => {
    mocks.query.limit.mockReturnValue(new Promise(() => undefined));
    render(<BookSelector onSelect={vi.fn()} onBack={vi.fn()} />);

    expect(screen.getByText('Choose a Book')).toBeInTheDocument();
    expect(document.querySelectorAll('.animate-pulse').length).toBeGreaterThan(0);
  });

  it('loads public books and displays cover, author, and genre metadata', async () => {
    render(<BookSelector onSelect={vi.fn()} onBack={vi.fn()} />);

    expect(await screen.findByText('The Discovery of India')).toBeInTheDocument();
    expect(screen.getByText('Jawaharlal Nehru')).toBeInTheDocument();
    expect(screen.getByText('History')).toBeInTheDocument();
    expect(screen.getByAltText('The Discovery of India')).toHaveAttribute(
      'src',
      'https://example.com/discovery.jpg',
    );
    expect(mocks.from).toHaveBeenCalledWith('books_library');
    expect(mocks.query.select).toHaveBeenCalledWith('id, title, author, cover_image_url, genre');
    expect(mocks.applyFilter).toHaveBeenCalled();
    expect(mocks.filterPublicBooks).toHaveBeenCalledWith(books);
  });

  it('renders fallback author and cover when optional metadata is missing', async () => {
    render(<BookSelector onSelect={vi.fn()} onBack={vi.fn()} />);

    expect(await screen.findByText('Wings of Fire')).toBeInTheDocument();
    expect(screen.getByText('Unknown Author')).toBeInTheDocument();
    expect(screen.queryByAltText('Wings of Fire')).not.toBeInTheDocument();
  });

  it('applies title and author search to the catalog query', async () => {
    render(<BookSelector onSelect={vi.fn()} onBack={vi.fn()} />);
    await screen.findByText('The Discovery of India');

    fireEvent.change(screen.getByPlaceholderText('Search by title or author...'), {
      target: { value: 'Nehru' },
    });

    await waitFor(() => {
      expect(mocks.query.or).toHaveBeenCalledWith(
        'title.ilike.%Nehru%,author.ilike.%Nehru%',
      );
    });
  });

  it('calls onSelect with the selected book id and highlights the selected card', async () => {
    const onSelect = vi.fn();
    render(<BookSelector onSelect={onSelect} onBack={vi.fn()} />);

    const title = await screen.findByText('The Discovery of India');
    fireEvent.click(title.closest('[class*="cursor-pointer"]') ?? title);

    expect(onSelect).toHaveBeenCalledWith('book-1');
  });

  it('calls onBack when the back control is activated', () => {
    const onBack = vi.fn();
    render(<BookSelector onSelect={vi.fn()} onBack={onBack} />);

    fireEvent.click(screen.getByRole('button'));
    expect(onBack).toHaveBeenCalledTimes(1);
  });

  it('shows the empty state when the catalog has no visible books', async () => {
    result = { data: [], error: null };
    render(<BookSelector onSelect={vi.fn()} onBack={vi.fn()} />);

    expect(await screen.findByText('No books found')).toBeInTheDocument();
  });

  it('stops loading and shows the empty state when Supabase returns an error', async () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    result = { data: books, error: new Error('catalog unavailable') };
    render(<BookSelector onSelect={vi.fn()} onBack={vi.fn()} />);

    await waitFor(() => {
      expect(consoleError).toHaveBeenCalledWith(
        'Error fetching books:',
        expect.objectContaining({ message: 'catalog unavailable' }),
      );
    });
    expect(await screen.findByText('No books found')).toBeInTheDocument();
    expect(document.querySelectorAll('.animate-pulse').length).toBe(0);
    consoleError.mockRestore();
  });

  it('shows the question-generation overlay when the parent is loading', () => {
    render(<BookSelector onSelect={vi.fn()} onBack={vi.fn()} loading />);

    expect(screen.getByText('Generating questions...')).toBeInTheDocument();
  });
});
