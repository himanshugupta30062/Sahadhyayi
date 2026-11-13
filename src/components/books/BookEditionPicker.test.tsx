// @vitest-environment jsdom
import React from 'react';
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BookEditionPicker } from './BookEditionPicker';

const mockEditionHookData = {
  currentEdition: {
    id: 'book-current',
    workId: 'dune::frank herbert',
    title: 'Dune',
    author: 'Frank Herbert',
    format: 'Paperback',
    publisher: 'Ace Books',
    publicationYear: 2019,
    language: 'English',
    isbn13: '9780306406157',
    pages: 688,
    accessStatus: 'open_access' as const,
    licenseEvidence: { type: 'public_domain' as const, confidence: 'high' as const },
    qualityScore: 92,
    qualityBreakdown: { metadataCompleteness: 10, editorialAssurance: 15, verifiedAccess: 15, licenseLegitimacy: 25, presentation: 5, readingUsability: 5, demotions: 0 },
    qualityReasons: ['Verified access'],
    isPreferredEdition: true,
    assets: [],
    sources: [],
  },
  alternativeEditions: [
    {
      id: 'book-hardcover',
      workId: 'dune::frank herbert',
      title: 'Dune: Deluxe Collector Edition',
      author: 'Frank Herbert',
      format: 'Hardcover',
      publisher: 'Penguin Classics',
      publicationYear: 2021,
      language: 'English',
      isbn13: '9780143111580',
      pages: 720,
      accessStatus: 'open_access' as const,
      licenseEvidence: { type: 'public_domain' as const, confidence: 'high' as const },
      qualityScore: 95,
      qualityBreakdown: { metadataCompleteness: 10, editorialAssurance: 15, verifiedAccess: 15, licenseLegitimacy: 25, presentation: 5, readingUsability: 5, demotions: 0 },
      qualityReasons: ['Deluxe hardcover'],
      isPreferredEdition: false,
      assets: [],
      sources: [],
    },
  ],
  allEditions: [],
  totalEditionsCount: 2,
  readingContext: {
    currentEditionId: 'book-current',
    isCurrentEditionShelved: false,
    currentShelfItem: null,
    hasOtherShelvedEdition: true,
    otherShelvedEdition: {
      id: 'book-hardcover',
      format: 'Hardcover',
      publicationYear: 2021,
    },
    noticeMessage: 'You have another edition of this work on your "reading" shelf (Hardcover, 2021). Your reading history is preserved per edition.',
  },
  isLoading: false,
};

let mockHookReturn: any = { ...mockEditionHookData };

vi.mock('@/hooks/useBookEditions', () => ({
  useBookEditions: () => mockHookReturn,
}));

describe('BookEditionPicker', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    mockHookReturn = { ...mockEditionHookData };
  });

  afterEach(() => {
    cleanup();
  });

  const renderComponent = (book: any) =>
    render(
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <BookEditionPicker book={book} />
        </BrowserRouter>
      </QueryClientProvider>,
    );

  it('renders trigger button showing total editions count', () => {
    renderComponent({ id: 'book-current', title: 'Dune' });
    expect(screen.getByRole('button', { name: /all 2 editions/i })).toBeInTheDocument();
  });

  it('opens dialog with active edition metadata and reading history preservation notice', () => {
    renderComponent({ id: 'book-current', title: 'Dune' });

    // Click to open dialog
    fireEvent.click(screen.getByRole('button', { name: /all 2 editions/i }));

    expect(screen.getByText(/Editions of Dune/i)).toBeInTheDocument();
    expect(screen.getByText(/Reading History Preserved/i)).toBeInTheDocument();
    expect(screen.getByText(/You have another edition of this work/i)).toBeInTheDocument();
    expect(screen.getByText(/Active Edition/i)).toBeInTheDocument();
    expect(screen.getByText('Ace Books')).toBeInTheDocument();
    expect(screen.getByText('978-0-306-40615-7')).toBeInTheDocument();
    expect(screen.getByText('Dune: Deluxe Collector Edition')).toBeInTheDocument();
    expect(screen.getByText('Switch')).toBeInTheDocument();
  });
});
