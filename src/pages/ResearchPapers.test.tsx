import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';

vi.mock('@/components/SEO', () => ({ default: () => null }));
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    auth: { getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: null }) },
    functions: { invoke: vi.fn() },
    from: vi.fn(),
  },
}));
import { supabase } from '@/integrations/supabase/client';
import ResearchPapers from '@/pages/ResearchPapers';

const paper = {
  id: 'https://openalex.org/W123',
  display_name: 'A Test Research Paper',
  publication_year: 2025,
  cited_by_count: 42,
  type: 'journal-article',
  authorships: [
    { author: { display_name: 'Ada Lovelace' } },
    { author: { display_name: 'Alan Turing' } },
    { author: { display_name: 'Grace Hopper' } },
    { author: { display_name: 'Katherine Johnson' } },
  ],
  primary_location: {
    landing_page_url: 'https://publisher.example/paper',
    pdf_url: 'https://publisher.example/paper.pdf',
    source: { display_name: 'Example Journal' },
  },
  open_access: { is_oa: true },
  abstract_inverted_index: { Evidence: [0], matters: [1], greatly: [2] },
};

const renderPage = (initialEntry = '/research-papers') =>
  render(<MemoryRouter initialEntries={[initialEntry]}><ResearchPapers /></MemoryRouter>);

const searchResult = (results = [paper], count = results.length) => ({
  data: { meta: { count }, results },
  error: null,
});

describe('ResearchPapers', () => {
  beforeEach(() => {
    vi.mocked(supabase.functions.invoke).mockResolvedValue(searchResult() as never);
    vi.mocked(supabase.from).mockReturnValue({
      select: vi.fn().mockReturnValue({
        order: vi.fn().mockResolvedValue({
          data: [
            { slug: 'article', name: 'Research article', description: 'Original scholarly research', display_order: 1 },
            { slug: 'review', name: 'Review paper', description: 'Synthesis of existing research', display_order: 2 },
            { slug: 'preprint', name: 'Preprint', description: 'Before peer review', display_order: 3 },
            { slug: 'conference-paper', name: 'Conference paper', description: 'Conference proceedings', display_order: 4 },
            { slug: 'book-chapter', name: 'Book chapter', description: 'Edited volume chapter', display_order: 5 },
            { slug: 'other', name: 'Other research', description: 'Other scholarly work', display_order: 6 },
          ],
          error: null,
        }),
      }),
    } as never);
    vi.mocked(supabase.auth.getUser).mockResolvedValue({ data: { user: null }, error: null } as never);
    vi.spyOn(window, 'scrollTo').mockImplementation(() => undefined);
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('shows a search-first catalogue with subject shortcuts', async () => {
    renderPage();
    expect(screen.getByRole('heading', { name: 'Research Papers' })).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: 'Search research papers' })).toBeInTheDocument();
    expect(screen.getByRole('combobox', { name: 'Filter by research category' })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Artificial intelligence' }));
    await waitFor(() => expect(supabase.functions.invoke).toHaveBeenLastCalledWith(
      'search-research-papers',
      { body: { query: 'artificial intelligence', year: 'all', category: 'all', page: 1, perPage: 12 } },
    ));
  });

  it('filters results by research paper type', async () => {
    renderPage();
    await screen.findByRole('heading', { name: 'A Test Research Paper' });
    fireEvent.change(screen.getByRole('combobox', { name: 'Filter by paper type' }), {
      target: { value: 'review' },
    });
    await waitFor(() => expect(supabase.functions.invoke).toHaveBeenLastCalledWith(
      'search-research-papers',
      { body: { query: '', year: 'all', category: 'review', page: 1, perPage: 12 } },
    ));
  });

  it('renders metadata, abstract, author summary and paper links', async () => {
    renderPage();
    expect(await screen.findByRole('heading', { name: 'A Test Research Paper' })).toBeInTheDocument();
    expect(screen.getByText('Ada Lovelace, Alan Turing, Grace Hopper and 1 more')).toBeInTheDocument();
    expect(screen.getByText('Evidence matters greatly')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Read paper/ })).toHaveAttribute('href', 'https://publisher.example/paper');
    expect(screen.getByRole('link', { name: 'PDF' })).toHaveAttribute('href', 'https://publisher.example/paper.pdf');
    expect(screen.getByText('42 citations')).toBeInTheDocument();
  });

  it('renders an empty state and supports clearing filters', async () => {
    vi.mocked(supabase.functions.invoke).mockResolvedValueOnce(searchResult([], 0) as never);
    renderPage();
    expect(await screen.findByRole('heading', { name: 'No matching papers found' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Clear filters' }));
    expect(screen.getByRole('textbox', { name: 'Search research papers' })).toHaveValue('');
  });

  it('shows a provider error and retries successfully', async () => {
    vi.mocked(supabase.functions.invoke)
      .mockResolvedValueOnce({ data: null, error: new Error('The research catalogue is busy. Please wait a moment and try again.') } as never)
      .mockResolvedValueOnce(searchResult() as never);
    renderPage();
    expect(await screen.findByRole('alert')).toHaveTextContent('research catalogue is busy');
    fireEvent.click(screen.getByRole('button', { name: /Try again/i }));
    expect(await screen.findByRole('heading', { name: 'A Test Research Paper' })).toBeInTheDocument();
    expect(supabase.functions.invoke).toHaveBeenCalledTimes(2);
  });

  it('ignores malformed work records and uses the title fallback', async () => {
    vi.mocked(supabase.functions.invoke).mockResolvedValueOnce(searchResult([
      { id: 'not-an-openalex-id', display_name: 'Invalid record' },
      { id: 'https://openalex.org/W124', title: 'Valid fallback title' },
    ], 2) as never);
    renderPage();
    expect(await screen.findByRole('heading', { name: 'Valid fallback title' })).toBeInTheDocument();
    expect(screen.queryByText('Invalid record')).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Read paper/ })).toHaveAttribute('href', 'https://openalex.org/W124');
  });

  it('sends search query and publication year to the Edge Function', async () => {
    renderPage();
    await screen.findByRole('heading', { name: 'A Test Research Paper' });
    fireEvent.change(screen.getByRole('textbox', { name: 'Search research papers' }), {
      target: { value: 'quantum computing' },
    });
    await waitFor(() => expect(supabase.functions.invoke).toHaveBeenCalledWith(
      'search-research-papers',
      { body: { query: 'quantum computing', year: 'all', category: 'all', page: 1, perPage: 12 } },
    ));
    fireEvent.change(screen.getByRole('combobox', { name: 'Filter by publication year' }), {
      target: { value: '2024' },
    });
    await waitFor(() => expect(supabase.functions.invoke).toHaveBeenLastCalledWith(
      'search-research-papers',
      { body: { query: 'quantum computing', year: '2024', category: 'all', page: 1, perPage: 12 } },
    ));
  });

  it('supports subject selection and pagination', async () => {
    vi.mocked(supabase.functions.invoke).mockResolvedValue(searchResult([paper], 24) as never);
    renderPage();
    await screen.findByRole('heading', { name: 'A Test Research Paper' });
    fireEvent.click(screen.getByRole('button', { name: 'Artificial intelligence' }));
    await waitFor(() => expect(supabase.functions.invoke).toHaveBeenLastCalledWith(
      'search-research-papers',
      { body: { query: 'artificial intelligence', year: 'all', category: 'all', page: 1, perPage: 12 } },
    ));
    fireEvent.click(screen.getByRole('button', { name: /^Next/ }));
    expect(await screen.findByText('Page 2 of 2')).toBeInTheDocument();
    await waitFor(() => expect(supabase.functions.invoke).toHaveBeenLastCalledWith(
      'search-research-papers',
      { body: { query: 'artificial intelligence', year: 'all', category: 'all', page: 2, perPage: 12 } },
    ));
  });
});
