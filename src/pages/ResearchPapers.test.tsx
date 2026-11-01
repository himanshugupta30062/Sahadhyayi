import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';

vi.mock('@/components/SEO', () => ({ default: () => null }));
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

const jsonResponse = (body: unknown, status = 200) =>
  Promise.resolve(new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  }));

describe('ResearchPapers', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn().mockImplementation(() => jsonResponse({
      meta: { count: 1 }, results: [paper],
    })));
    vi.spyOn(window, 'scrollTo').mockImplementation(() => undefined);
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
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
    vi.mocked(fetch).mockImplementationOnce(() => jsonResponse({ meta: { count: 0 }, results: [] }));
    renderPage();
    expect(await screen.findByRole('heading', { name: 'No matching papers found' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Clear filters' }));
    expect(screen.getByRole('textbox', { name: 'Search research papers' })).toHaveValue('');
  });

  it('shows a rate-limit error and retries successfully', async () => {
    vi.mocked(fetch)
      .mockImplementationOnce(() => jsonResponse({}, 429))
      .mockImplementationOnce(() => jsonResponse({ meta: { count: 1 }, results: [paper] }));
    renderPage();
    expect(await screen.findByRole('alert')).toHaveTextContent('receiving many requests');
    fireEvent.click(screen.getByRole('button', { name: /Try again/i }));
    expect(await screen.findByRole('heading', { name: 'A Test Research Paper' })).toBeInTheDocument();
    expect(fetch).toHaveBeenCalledTimes(2);
  });

  it('ignores malformed work records and uses the title fallback', async () => {
    vi.mocked(fetch).mockImplementationOnce(() => jsonResponse({
      meta: { count: 2 },
      results: [
        { id: 'not-an-openalex-id', display_name: 'Invalid record' },
        { id: 'https://openalex.org/W124', title: 'Valid fallback title' },
      ],
    }));
    renderPage();
    expect(await screen.findByRole('heading', { name: 'Valid fallback title' })).toBeInTheDocument();
    expect(screen.queryByText('Invalid record')).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Read paper/ })).toHaveAttribute('href', 'https://openalex.org/W124');
  });

  it('updates the search query and publication year sent to OpenAlex', async () => {
    renderPage();
    await screen.findByRole('heading', { name: 'A Test Research Paper' });
    fireEvent.change(screen.getByRole('textbox', { name: 'Search research papers' }), {
      target: { value: 'quantum computing' },
    });
    await waitFor(() => expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('search=quantum+computing'), expect.anything(),
    ), { timeout: 2000 });
    fireEvent.change(screen.getByRole('combobox', { name: 'Filter by publication year' }), {
      target: { value: '2024' },
    });
    await waitFor(() => expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('publication_year%3A2024'), expect.anything(),
    ));
  });

  it('supports subject selection and pagination', async () => {
    vi.mocked(fetch).mockImplementation(() => jsonResponse({ meta: { count: 24 }, results: [paper] }));
    renderPage();
    await screen.findByRole('heading', { name: 'A Test Research Paper' });
    fireEvent.click(screen.getByRole('button', { name: 'Artificial intelligence' }));
    await waitFor(() => expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('search=artificial+intelligence'), expect.anything(),
    ));
    fireEvent.click(screen.getByRole('button', { name: /^Next/ }));
    expect(await screen.findByText('Page 2 of 2')).toBeInTheDocument();
  });
});
