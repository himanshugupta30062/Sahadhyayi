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
  type: 'article',
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
            { slug: 'article', name: 'Research article', description: 'Original scholarly research', display_order: 1, openalex_types: ['article'] },
            { slug: 'review', name: 'Review paper', description: 'Synthesis of existing research', display_order: 2, openalex_types: ['review'] },
            { slug: 'preprint', name: 'Preprint', description: 'Before peer review', display_order: 3, openalex_types: ['preprint'] },
            { slug: 'conference-paper', name: 'Conference paper', description: 'Conference proceedings', display_order: 4, openalex_types: ['conference-paper'] },
            { slug: 'book-chapter', name: 'Book chapter', description: 'Edited volume chapter', display_order: 5, openalex_types: ['book-chapter'] },
            { slug: 'other', name: 'Other research', description: 'Other scholarly work', display_order: 6, openalex_types: ['other','dataset','book','book-review','conference-abstract','data-paper','dissertation','editorial','erratum','letter','libguides','paratext','peer-review','reference-entry','report','retraction','software','software-paper','standard','supplementary-materials'] },
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
      { body: { query: 'artificial intelligence', year: 'all', category: 'all', sort: 'cited_by_count', page: 1, perPage: 12 } },
    ));
  });

  it('filters results by database-backed research category', async () => {
    renderPage();
    await screen.findByRole('heading', { name: 'A Test Research Paper' });
    fireEvent.change(screen.getByRole('combobox', { name: 'Filter by research category' }), {
      target: { value: 'review' },
    });
    await waitFor(() => expect(supabase.functions.invoke).toHaveBeenLastCalledWith(
      'search-research-papers',
      { body: { query: '', year: 'all', category: 'review', sort: 'cited_by_count', page: 1, perPage: 12 } },
    ));
  });

  it('renders metadata, abstract, author summary and paper links', async () => {
    renderPage();
    expect(await screen.findByRole('heading', { name: 'A Test Research Paper' })).toBeInTheDocument();
    expect(screen.getByText(/Ada Lovelace/)).toBeInTheDocument();
    expect(screen.getByText(/Alan Turing/)).toBeInTheDocument();
    expect(screen.getByText(/Grace Hopper/)).toBeInTheDocument();
    expect(screen.getByText(/and 1 more/)).toBeInTheDocument();
    expect(screen.getByText('Evidence matters greatly')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Read paper/ })).toHaveAttribute('href', 'https://publisher.example/paper.pdf');
    expect(screen.getByText('Research article', { selector: 'span' })).toBeInTheDocument();
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
    ] as any, 2) as never);
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
      { body: { query: 'quantum computing', year: 'all', category: 'all', sort: 'cited_by_count', page: 1, perPage: 12 } },
    ));
    fireEvent.change(screen.getByRole('combobox', { name: 'Filter by publication year' }), {
      target: { value: '2024' },
    });
    await waitFor(() => expect(supabase.functions.invoke).toHaveBeenLastCalledWith(
      'search-research-papers',
      { body: { query: 'quantum computing', year: '2024', category: 'all', sort: 'cited_by_count', page: 1, perPage: 12 } },
    ));
  });

  it('supports subject selection and pagination', async () => {
    vi.mocked(supabase.functions.invoke).mockResolvedValue(searchResult([paper], 24) as never);
    renderPage();
    await screen.findByRole('heading', { name: 'A Test Research Paper' });
    fireEvent.click(screen.getByRole('button', { name: 'Artificial intelligence' }));
    await waitFor(() => expect(supabase.functions.invoke).toHaveBeenLastCalledWith(
      'search-research-papers',
      { body: { query: 'artificial intelligence', year: 'all', category: 'all', sort: 'cited_by_count', page: 1, perPage: 12 } },
    ));
    fireEvent.click(screen.getByRole('button', { name: /^Next/ }));
    expect(await screen.findByText('Page 2 of 2')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Page 2' })).toHaveAttribute('aria-current', 'page');
    expect(screen.getByText(/Showing 13–24 of 24 papers/)).toBeInTheDocument();
    await waitFor(() => expect(supabase.functions.invoke).toHaveBeenLastCalledWith(
      'search-research-papers',
      { body: { query: 'artificial intelligence', year: 'all', category: 'all', sort: 'cited_by_count', page: 2, perPage: 12 } },
    ));
  });
});


describe('ResearchPapers URL pagination', () => {
  beforeEach(() => {
    vi.mocked(supabase.functions.invoke).mockResolvedValue(searchResult([paper], 36) as never);
    vi.mocked(supabase.from).mockReturnValue({
      select: vi.fn().mockReturnValue({
        order: vi.fn().mockResolvedValue({ data: [], error: null }),
      }),
    } as never);
    vi.spyOn(window, 'scrollTo').mockImplementation(() => undefined);
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('loads the requested page from the URL', async () => {
    renderPage('/research-papers?page=2&category=review&year=2024');
    await waitFor(() => expect(supabase.functions.invoke).toHaveBeenCalledWith(
      'search-research-papers',
      { body: { query: '', year: '2024', category: 'review', sort: 'cited_by_count', page: 2, perPage: 12 } },
    ));
    expect(await screen.findByRole('button', { name: 'Page 2' })).toHaveAttribute('aria-current', 'page');
  });

  it('caps numbered navigation at the OpenAlex 10000-result limit', async () => {
    vi.mocked(supabase.functions.invoke).mockResolvedValue(searchResult([paper], 250000) as never);
    renderPage('/research-papers?page=10001');
    await waitFor(() => expect(supabase.functions.invoke).toHaveBeenCalledWith(
      'search-research-papers',
      { body: { query: '', year: 'all', category: 'all', sort: 'cited_by_count', page: 833, perPage: 12 } },
    ));
    expect(await screen.findByText(/first 10,000 results/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Next' })).toBeDisabled();
    expect(await screen.findByText('Page 833 of 833')).toBeInTheDocument();
  });
});
