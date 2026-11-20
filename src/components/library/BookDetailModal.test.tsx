import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import BookDetailModal from './BookDetailModal';
import type { Book } from '@/hooks/useLibraryBooks';

const mocks = vi.hoisted(() => ({
  navigate: vi.fn(),
  mutate: vi.fn(),
  user: { id: 'reader-1' } as { id: string } | null,
  isPending: false,
}));


vi.mock('lucide-react', () => ({
  Star: () => <span data-icon="star" aria-hidden="true" />,
  BookOpen: () => <span data-icon="book-open" aria-hidden="true" />,
  Calendar: () => <span data-icon="calendar" aria-hidden="true" />,
  Globe: () => <span data-icon="globe" aria-hidden="true" />,
  Info: () => <span data-icon="info" aria-hidden="true" />,
  Download: () => <span data-icon="download" aria-hidden="true" />,
  Plus: () => <span data-icon="plus" aria-hidden="true" />,
}));

vi.mock('react-router-dom', () => ({
  Link: ({ to, children }: { to: string; children: any }) => <a href={to}>{children}</a>,
  useNavigate: () => mocks.navigate,
}));

vi.mock('@/contexts/authHelpers', () => ({
  useAuth: () => ({ user: mocks.user }),
}));

vi.mock('@/hooks/usePersonalLibrary', () => ({
  useAddToPersonalLibrary: () => ({
    mutate: mocks.mutate,
    isPending: mocks.isPending,
  }),
}));

vi.mock('@/components/ui/dialog', () => ({
  Dialog: ({ open, onOpenChange, children }: any) => open ? (
    <div data-testid="book-dialog">
      <button type="button" aria-label="Dismiss book dialog" onClick={() => onOpenChange(false)}>Dismiss</button>
      {children}
    </div>
  ) : null,
  DialogContent: ({ children }: any) => <section>{children}</section>,
  DialogHeader: ({ children }: any) => <header>{children}</header>,
  DialogTitle: ({ children }: any) => <h2>{children}</h2>,
}));

vi.mock('@/components/ui/button', () => ({
  Button: ({ children, ...props }: any) => <button {...props}>{children}</button>,
}));

vi.mock('@/components/ui/badge', () => ({
  Badge: ({ children }: any) => <span data-testid="book-genre">{children}</span>,
}));

vi.mock('@/components/books/AudioSummaryButton', () => ({
  default: ({ bookId, bookContent }: any) => (
    <div data-testid="audio-summary" data-book-id={bookId} data-book-content={bookContent} />
  ),
}));
vi.mock('@/components/books/PageSummarySection', () => ({
  default: ({ bookId }: any) => <div data-testid="page-summary" data-book-id={bookId} />,
}));
vi.mock('@/components/books/BookSummaryModal', () => ({
  default: ({ isOpen, onClose }: any) => isOpen ? (
    <div data-testid="summary-modal">
      <button type="button" onClick={onClose}>Close summary</button>
    </div>
  ) : null,
}));
vi.mock('@/components/books/ReadingStats', () => ({
  default: ({ bookId }: any) => <div data-testid="reading-stats" data-book-id={bookId} />,
}));
vi.mock('@/components/books/BookIdeasSection', () => ({
  default: ({ bookId }: any) => <div data-testid="book-ideas" data-book-id={bookId} />,
}));
vi.mock('@/components/books/BookContinuationSection', () => ({
  default: ({ bookId, genre }: any) => <div data-testid="book-continuation" data-book-id={bookId} data-genre={genre} />,
}));
vi.mock('@/components/books/CreateYourVersionSection', () => ({
  default: ({ bookId }: any) => <div data-testid="create-version" data-book-id={bookId} />,
}));

const completeBook = {
  id: 'book-42',
  title: 'The Art of Reading',
  author: 'A. Reader',
  cover_image_url: 'https://example.com/cover.jpg',
  price: 12,
  pdf_url: 'https://example.com/book.pdf',
  description: 'A practical guide to thoughtful reading.',
  rating: 4.5,
  genre: 'Literary Fiction',
  publication_year: 2020,
  pages: 320,
  language: 'English',
  isbn: '9780000000042',
  author_bio: 'A writer and lifelong reader.',
} as unknown as Book;

describe('BookDetailModal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.user = { id: 'reader-1' };
    mocks.isPending = false;
  });

  it('renders nothing when no book is selected', () => {
    const { container } = render(
      <BookDetailModal book={null} isOpen onClose={vi.fn()} />,
    );

    expect(container).toBeEmptyDOMElement();
  });

  it('does not display the dialog while it is closed', () => {
    render(
      <BookDetailModal book={completeBook} isOpen={false} onClose={vi.fn()} />,
    );

    expect(screen.queryByTestId('book-dialog')).not.toBeInTheDocument();
  });

  it('renders the book cover, bibliographic details, genre, rating, and supporting sections', () => {
    render(
      <BookDetailModal book={completeBook} isOpen onClose={vi.fn()} />,
    );

    expect(screen.getByRole('heading', { name: 'The Art of Reading' })).toBeInTheDocument();
    expect(screen.getByAltText('The Art of Reading')).toHaveAttribute('src', completeBook.cover_image_url);
    expect(screen.getByRole('link', { name: 'by A. Reader' })).toHaveAttribute('href', '/authors/a-reader');
    expect(screen.getByText('Published 2020')).toBeInTheDocument();
    expect(screen.getByText('320 pages')).toBeInTheDocument();
    expect(screen.getByText('English')).toBeInTheDocument();
    expect(screen.getByText(/9780000000042/)).toBeInTheDocument();
    expect(screen.getByText('4.5')).toBeInTheDocument();
    expect(screen.getByTestId('book-genre')).toHaveTextContent('Literary Fiction');
    expect(screen.getByText('A practical guide to thoughtful reading.')).toBeInTheDocument();
    expect(screen.getByText('A writer and lifelong reader.')).toBeInTheDocument();
    expect(screen.getByTestId('page-summary')).toHaveAttribute('data-book-id', 'book-42');
    expect(screen.getByTestId('reading-stats')).toHaveAttribute('data-book-id', 'book-42');
    expect(screen.getByTestId('book-ideas')).toHaveAttribute('data-book-id', 'book-42');
    expect(screen.getByTestId('book-continuation')).toHaveAttribute('data-genre', 'Literary Fiction');
    expect(screen.getByTestId('create-version')).toHaveAttribute('data-book-id', 'book-42');
    expect(screen.getByTestId('audio-summary')).toHaveAttribute('data-book-content', completeBook.description);
    expect(document.querySelectorAll('[data-icon="star"]')).toHaveLength(5);
  });

  it('uses a text cover fallback and omits optional metadata when absent', () => {
    const book = {
      ...completeBook,
      cover_image_url: null,
      price: null,
      rating: 0,
      genre: null,
      publication_year: null,
      pages: null,
      language: null,
      isbn: null,
      description: null,
      author_bio: null,
    } as unknown as Book;

    render(<BookDetailModal book={book} isOpen onClose={vi.fn()} />);

    expect(screen.queryByRole('img', { name: 'The Art of Reading' })).not.toBeInTheDocument();
    expect(document.querySelector('[class*="text-white"]')).toHaveTextContent('The Art of Reading');
    expect(screen.queryByText(/Published/)).not.toBeInTheDocument();
    expect(screen.queryByText(/pages$/)).not.toBeInTheDocument();
    expect(screen.queryByTestId('book-genre')).not.toBeInTheDocument();
    expect(document.querySelectorAll('[data-icon="star"]')).toHaveLength(5);
  });

  it('allows an authenticated reader to add the book to their personal library', () => {
    render(<BookDetailModal book={completeBook} isOpen onClose={vi.fn()} />);

    fireEvent.click(screen.getByRole('button', { name: 'Add to Library' }));
    expect(mocks.mutate).toHaveBeenCalledWith('book-42');
  });

  it('disables the add action and shows its pending label while the mutation is running', () => {
    mocks.isPending = true;
    render(<BookDetailModal book={completeBook} isOpen onClose={vi.fn()} />);

    expect(screen.getByRole('button', { name: 'Adding...' })).toBeDisabled();
  });

  it('hides the personal-library action for signed-out visitors', () => {
    mocks.user = null;
    render(<BookDetailModal book={completeBook} isOpen onClose={vi.fn()} />);

    expect(screen.queryByRole('button', { name: 'Add to Library' })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Download PDF' })).toBeInTheDocument();
  });

  it('closes the modal and navigates to the author directory with the author search state', () => {
    const onClose = vi.fn();
    render(<BookDetailModal book={completeBook} isOpen onClose={onClose} />);

    fireEvent.click(screen.getAllByTitle('Learn more about the author')[0]);
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(mocks.navigate).toHaveBeenCalledWith('/authors', {
      state: { searchAuthor: 'A. Reader' },
    });
  });

  it('downloads the attached PDF using a generated filename', () => {
    const clickedAnchors: HTMLAnchorElement[] = [];
    const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function (this: HTMLAnchorElement) {
      clickedAnchors.push(this);
    });
    render(<BookDetailModal book={completeBook} isOpen onClose={vi.fn()} />);

    fireEvent.click(screen.getByRole('button', { name: 'Download PDF' }));

    expect(click).toHaveBeenCalledTimes(1);
    expect(clickedAnchors[0]).toHaveProperty('href', 'https://example.com/book.pdf');
    expect(clickedAnchors[0]).toHaveProperty('download', 'The Art of Reading.pdf');
    expect(document.querySelector('a[download="The Art of Reading.pdf"]')).not.toBeInTheDocument();
    click.mockRestore();
  });

  it('logs a request when no direct PDF URL is available', () => {
    const log = vi.spyOn(console, 'log').mockImplementation(() => undefined);
    const book = { ...completeBook, pdf_url: null } as unknown as Book;
    render(<BookDetailModal book={book} isOpen onClose={vi.fn()} />);

    fireEvent.click(screen.getByRole('button', { name: 'Download PDF' }));

    expect(log).toHaveBeenCalledWith('PDF download requested for:', 'The Art of Reading');
    log.mockRestore();
  });

  it('opens and closes the detailed summary modal', () => {
    render(<BookDetailModal book={completeBook} isOpen onClose={vi.fn()} />);

    expect(screen.queryByTestId('summary-modal')).not.toBeInTheDocument();
    fireEvent.click(screen.getByTitle('View detailed summary'));
    expect(screen.getByTestId('summary-modal')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Close summary' }));
    expect(screen.queryByTestId('summary-modal')).not.toBeInTheDocument();
  });

  it('calls onClose when the dialog requests dismissal', () => {
    const onClose = vi.fn();
    render(<BookDetailModal book={completeBook} isOpen onClose={onClose} />);

    fireEvent.click(screen.getByRole('button', { name: 'Dismiss book dialog' }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
