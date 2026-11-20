import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { HTMLAttributes } from 'react';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import CatalogueSelector, { type CatalogueBook, type CatalogueSelectorProps } from './CatalogueSelector';

const mocks = vi.hoisted(() => {
  const builder = {
    select: vi.fn(),
    order: vi.fn(),
    eq: vi.fn(),
    or: vi.fn(),
    range: vi.fn(),
  };
  return {
    builder,
    from: vi.fn(),
    rpc: vi.fn(),
    toast: vi.fn(),
  };
});

vi.mock('@/integrations/supabase/client-universal', () => ({
  supabase: {
    from: mocks.from,
    rpc: mocks.rpc,
  },
}));

vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({ toast: mocks.toast }),
}));

vi.mock('@/components/ui/scroll-area', () => ({
  ScrollArea: ({ children, ...props }: HTMLAttributes<HTMLDivElement>) => (
    <div {...props}>{children}</div>
  ),
}));

const makeBook = (overrides: Partial<CatalogueBook> = {}): CatalogueBook => ({
  id: 'book-1',
  title: 'The First Book',
  author: 'A. Author',
  isbn: '9781234567890',
  publication_year: 2024,
  language: 'English',
  cover_image_url: 'https://example.com/cover.jpg',
  pdf_url: null,
  pdf_sha256: null,
  pdf_file_size: null,
  pdf_page_count: null,
  pdf_verification_status: null,
  genre: 'Fiction',
  description: null,
  status: 'active',
  catalog_status: 'active',
  is_archived: false,
  created_at: '2026-01-01T00:00:00Z',
  ...overrides,
});

function renderSelector(props: Partial<CatalogueSelectorProps> = {}) {
  const client = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0, staleTime: 0 },
    },
  });
  const onSelectionChange = props.onSelectionChange ?? vi.fn();
  const view = render(
    <QueryClientProvider client={client}>
      <CatalogueSelector
        {...props}
        onSelectionChange={onSelectionChange}
        debounceMs={props.debounceMs ?? 0}
      />
    </QueryClientProvider>,
  );
  return { ...view, client, onSelectionChange };
}

function openSearch() {
  fireEvent.focus(screen.getByRole('textbox', { name: 'Catalogue Book' }));
}

function searchFor(value: string) {
  const input = screen.getByRole('textbox', { name: 'Catalogue Book' });
  fireEvent.focus(input);
  fireEvent.change(input, { target: { value } });
}

describe('CatalogueSelector', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.from.mockReturnValue(mocks.builder);
    mocks.builder.select.mockReturnValue(mocks.builder);
    mocks.builder.order.mockReturnValue(mocks.builder);
    mocks.builder.eq.mockReturnValue(mocks.builder);
    mocks.builder.or.mockReturnValue(mocks.builder);
    mocks.builder.range.mockResolvedValue({ data: [], error: null });
    mocks.rpc.mockResolvedValue({ data: [], error: null });
  });

  it('loads recent catalogue books and displays cover, ISBN, PDF status, and file metadata', async () => {
    const verified = makeBook({
      id: 'verified-book',
      title: 'Verified Edition',
      pdf_url: 'https://example.com/verified.pdf',
      pdf_verification_status: 'verified',
      pdf_file_size: 2 * 1024 * 1024,
      pdf_page_count: 240,
    });
    const missing = makeBook({
      id: 'missing-book',
      title: 'Book Without PDF',
      cover_image_url: null,
      pdf_url: null,
      pdf_file_size: 512 * 1024,
      pdf_page_count: null,
    });
    mocks.builder.range.mockResolvedValue({ data: [verified, missing], error: null });

    const { container } = renderSelector();
    openSearch();

    expect(await screen.findByRole('option', { name: /Verified Edition by A\. Author, PDF available/ })).toBeInTheDocument();
    expect(screen.getByText('Verified PDF')).toBeInTheDocument();
    expect(screen.getByText('No PDF')).toBeInTheDocument();
    expect(within(screen.getByRole('option', { name: /Verified Edition/ })).getByText('ISBN 9781234567890')).toBeInTheDocument();
    expect(screen.getByText(/240 pages/)).toBeInTheDocument();
    expect(screen.getByText(/2\.0 MB/)).toBeInTheDocument();
    expect(screen.getByText(/512 KB/)).toBeInTheDocument();
    expect(container.querySelector('img')).toHaveAttribute('src', 'https://example.com/cover.jpg');
    expect(mocks.from).toHaveBeenCalledWith('books_library');
    expect(mocks.builder.eq).toHaveBeenCalledWith('is_archived', false);
  });

  it('shows the empty-catalogue state when there are no recent books', async () => {
    renderSelector();
    openSearch();

    expect(await screen.findByText('No books in catalogue yet.')).toBeInTheDocument();
  });

  it('normalizes title-by-author searches before calling the catalogue RPC', async () => {
    mocks.rpc.mockResolvedValue({ data: [makeBook({ title: 'The Gita' })], error: null });
    renderSelector();
    searchFor('  The Gita by Vyasa,  ');

    expect(await screen.findByRole('option', { name: /The Gita by A\. Author/ })).toBeInTheDocument();
    await waitFor(() => {
      expect(mocks.rpc).toHaveBeenCalledWith('match_catalogue_book', {
        p_title: 'The Gita',
        p_author: 'Vyasa',
        p_isbn: null,
        p_limit: 21,
      });
    });
  });

  it('extracts a 13-digit ISBN from the search term', async () => {
    renderSelector();
    searchFor('9781234567890');

    await waitFor(() => {
      expect(mocks.rpc).toHaveBeenCalledWith('match_catalogue_book', {
        p_title: '9781234567890',
        p_author: '9781234567890',
        p_isbn: '9781234567890',
        p_limit: 21,
      });
    });
  });

  it('falls back to a direct title/author/ISBN query when the matching RPC fails', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    mocks.rpc.mockResolvedValue({ data: null, error: new Error('RPC unavailable') });
    mocks.builder.range.mockResolvedValue({ data: [makeBook({ title: 'Fallback Result' })], error: null });
    renderSelector();
    searchFor('Fallback Result');

    expect(await screen.findByRole('option', { name: /Fallback Result/ })).toBeInTheDocument();
    expect(mocks.builder.or).toHaveBeenCalledWith(
      'title.ilike.%Fallback Result%,author.ilike.%Fallback Result%,isbn.ilike.%Fallback Result%',
    );
    expect(warn).toHaveBeenCalledWith(
      'Catalogue search RPC failed, falling back to direct query:',
      'RPC unavailable',
    );
    warn.mockRestore();
  });

  it('shows an error with a retry action when a direct catalogue query fails', async () => {
    mocks.builder.range
      .mockResolvedValueOnce({ data: null, error: new Error('catalogue offline') })
      .mockResolvedValueOnce({ data: [makeBook()], error: null });
    renderSelector();
    openSearch();

    expect(await screen.findByRole('alert')).toHaveTextContent('catalogue offline');
    fireEvent.click(screen.getByRole('button', { name: 'Retry' }));

    expect(await screen.findByRole('option', { name: /The First Book/ })).toBeInTheDocument();
  });

  it('shows a no-match message for a search with no RPC results', async () => {
    renderSelector();
    searchFor('No such title');

    expect(await screen.findByText(/No books found matching/)).toBeInTheDocument();
  });

  it('filters archived and PDF-linked RPC matches when only missing PDFs are requested', async () => {
    mocks.rpc.mockResolvedValue({
      data: [
        makeBook({ id: 'archived', title: 'Archived Missing PDF', is_archived: true, pdf_url: null }),
        makeBook({ id: 'linked', title: 'Already Linked', pdf_url: 'https://example.com/book.pdf' }),
        makeBook({ id: 'missing', title: 'Needs PDF', pdf_url: null }),
      ],
      error: null,
    });
    renderSelector({ onlyMissingPDF: true });
    searchFor('book');

    expect(await screen.findByRole('option', { name: /Needs PDF/ })).toBeInTheDocument();
    expect(screen.queryByRole('option', { name: /Archived Missing PDF/ })).not.toBeInTheDocument();
    expect(screen.queryByRole('option', { name: /Already Linked/ })).not.toBeInTheDocument();
  });

  it('includes archived RPC matches when includeArchived is enabled', async () => {
    mocks.rpc.mockResolvedValue({
      data: [
        makeBook({ id: 'archived', title: 'Archived Edition', is_archived: true }),
        makeBook({ id: 'active', title: 'Active Edition', is_archived: false }),
      ],
      error: null,
    });
    renderSelector({ includeArchived: true });
    searchFor('Edition');

    expect(await screen.findByRole('option', { name: /Archived Edition/ })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: /Active Edition/ })).toBeInTheDocument();
  });

  it('uses the PDF-status filter to request only records without a PDF', async () => {
    mocks.builder.range.mockResolvedValue({ data: [makeBook({ pdf_url: null })], error: null });
    renderSelector();
    openSearch();
    await screen.findByText('No PDF');

    fireEvent.click(screen.getByRole('button', { name: 'Missing PDF' }));

    await waitFor(() => {
      expect(mocks.builder.or).toHaveBeenCalledWith('pdf_url.is.null,pdf_url.eq.');
    });
  });

  it('renders PDF verification states for verified, unsafe, linked, and missing files', async () => {
    mocks.builder.range.mockResolvedValue({
      data: [
        makeBook({ id: 'verified', title: 'Verified', pdf_url: '/verified.pdf', pdf_verification_status: 'verified' }),
        makeBook({ id: 'unsafe', title: 'Unsafe', pdf_url: '/unsafe.pdf', pdf_verification_status: 'malware_detected' }),
        makeBook({ id: 'linked', title: 'Linked', pdf_url: '/linked.pdf', pdf_verification_status: 'pending' }),
        makeBook({ id: 'missing', title: 'Missing', pdf_url: null }),
      ],
      error: null,
    });
    renderSelector();
    openSearch();

    expect(await screen.findByText('Verified PDF')).toBeInTheDocument();
    expect(screen.getByText('Malware Detected')).toBeInTheDocument();
    expect(screen.getByText('PDF Linked')).toBeInTheDocument();
    expect(screen.getByText('No PDF')).toBeInTheDocument();
  });

  it('supports multiple selection, deselection, and clearing all selected books', async () => {
    mocks.builder.range.mockResolvedValue({
      data: [
        makeBook({ id: 'book-a', title: 'Book A' }),
        makeBook({ id: 'book-b', title: 'Book B' }),
      ],
      error: null,
    });
    const onSelectionChange = vi.fn();
    renderSelector({ multiple: true, onSelectionChange });
    openSearch();

    fireEvent.click(await screen.findByRole('option', { name: /Book A/ }));
    fireEvent.click(screen.getByRole('option', { name: /Book B/ }));

    expect(onSelectionChange).toHaveBeenLastCalledWith(['book-a', 'book-b']);
    expect(screen.getByRole('textbox', { name: 'Catalogue Book' })).toHaveValue('');
    expect(screen.getByRole('textbox', { name: 'Catalogue Book' })).toBeEnabled();
    expect(containerHiddenValue()).toBe('book-a,book-b');

    fireEvent.click(screen.getByRole('button', { name: 'Remove Book A' }));
    expect(onSelectionChange).toHaveBeenLastCalledWith(['book-b']);
    fireEvent.click(screen.getByRole('button', { name: 'Clear selection' }));
    expect(onSelectionChange).toHaveBeenLastCalledWith([]);
  });

  it('replaces the selected ID and closes the dropdown in single-select mode', async () => {
    mocks.builder.range.mockResolvedValue({
      data: [
        makeBook({ id: 'book-a', title: 'Book A' }),
        makeBook({ id: 'book-b', title: 'Book B' }),
      ],
      error: null,
    });
    const onSelectionChange = vi.fn();
    renderSelector({ selectedIds: ['book-a'], onSelectionChange });
    openSearch();

    fireEvent.click(await screen.findByRole('option', { name: /Book B/ }));

    expect(onSelectionChange).toHaveBeenCalledWith(['book-b']);
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
  });

  it('syncs the selected chips when selectedIds changes from the parent', async () => {
    mocks.builder.range.mockResolvedValue({
      data: [
        makeBook({ id: 'book-a', title: 'Book A' }),
        makeBook({ id: 'book-b', title: 'Book B' }),
      ],
      error: null,
    });
    const onSelectionChange = vi.fn();
    const { rerender, client } = renderSelector({
      multiple: true,
      selectedIds: ['book-a'],
      onSelectionChange,
    });

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Remove Book A' })).toBeInTheDocument();
    });

    rerender(
      <QueryClientProvider client={client}>
        <CatalogueSelector
          multiple
          selectedIds={['book-b']}
          onSelectionChange={onSelectionChange}
          debounceMs={0}
        />
      </QueryClientProvider>,
    );

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Remove Book B' })).toBeInTheDocument();
    });
    expect(screen.queryByRole('button', { name: 'Remove Book A' })).not.toBeInTheDocument();
    expect(containerHiddenValue()).toBe('book-b');
  });

  it('hides covers, ISBN and PDF badges when their display options are disabled', async () => {
    mocks.builder.range.mockResolvedValue({ data: [makeBook()], error: null });
    const { container } = renderSelector({
      showCovers: false,
      showISBN: false,
      showPDFAvailability: false,
      showPDFFilter: false,
    });
    openSearch();

    expect(await screen.findByRole('option', { name: /The First Book/ })).toBeInTheDocument();
    expect(container.querySelector('img')).not.toBeInTheDocument();
    expect(screen.queryByText(/ISBN 9781234567890/)).not.toBeInTheDocument();
    expect(screen.queryByText('No PDF')).not.toBeInTheDocument();
    expect(screen.queryByRole('group', { name: 'PDF status filter' })).not.toBeInTheDocument();
  });

  it('closes the dropdown when the user clicks outside the selector', async () => {
    mocks.builder.range.mockResolvedValue({ data: [makeBook()], error: null });
    renderSelector();
    openSearch();

    expect(await screen.findByRole('listbox')).toBeInTheDocument();
    fireEvent.mouseDown(document.body);

    await waitFor(() => expect(screen.queryByRole('listbox')).not.toBeInTheDocument());
  });
});

function containerHiddenValue(): string | undefined {
  return (document.querySelector('input[name="catalogue_book_ids"]') as HTMLInputElement | null)?.value;
}
