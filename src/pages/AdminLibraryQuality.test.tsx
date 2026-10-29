// @vitest-environment jsdom

import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { MemoryRouter, useLocation } from 'react-router-dom';

const mocks = vi.hoisted(() => ({
  user: null as null | { id: string },
  authLoading: false,
  isAdmin: true as boolean | undefined,
  roleLoading: false,
  auditLoading: false,
  auditFetching: false,
  auditData: null as any,
  archivedBooks: [] as any[],
  auditLogs: [] as any[],
  runAudit: vi.fn(),
  refetchLogs: vi.fn(),
  refetchVault: vi.fn(),
  toast: vi.fn(),
  mutate: vi.fn(),
  mutateAsync: vi.fn(),
  invalidateQueries: vi.fn(),
}));

vi.mock('@/contexts/authHelpers', () => ({
  useAuth: () => ({ user: mocks.user, loading: mocks.authLoading }),
}));

vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({ toast: mocks.toast }),
}));

vi.mock('@tanstack/react-query', () => ({
  useQuery: (options: { queryKey: unknown[] }) => {
    switch (options.queryKey[0]) {
      case 'is-admin':
        return { data: mocks.isAdmin, isLoading: mocks.roleLoading };
      case 'library-duplicate-audit':
        return {
          data: mocks.auditData,
          isLoading: mocks.auditLoading,
          isFetching: mocks.auditFetching,
          refetch: mocks.runAudit,
        };
      case 'duplicate-audit-logs':
        return { data: mocks.auditLogs, refetch: mocks.refetchLogs };
      case 'archived-books-vault':
        return { data: mocks.archivedBooks, isLoading: false, refetch: mocks.refetchVault };
      default:
        return {};
    }
  },
  useMutation: () => ({ mutate: mocks.mutate, mutateAsync: mocks.mutateAsync }),
  useQueryClient: () => ({ invalidateQueries: mocks.invalidateQueries }),
}));

vi.mock('@/integrations/supabase/client-universal', () => ({
  supabase: { from: vi.fn() },
}));

vi.mock('@/utils/catalog/duplicateAudit', () => ({
  generateLibraryDuplicateAudit: vi.fn(),
}));

vi.mock('@/utils/catalog/duplicateResolution', () => ({
  applyDuplicateResolution: vi.fn(),
  verifyAdminStatus: vi.fn(),
}));

vi.mock('@/utils/catalog/bookArchiveVault', () => ({
  archiveUnwantedBook: vi.fn(),
  restoreBookFromArchive: vi.fn(),
  getArchivedBooks: vi.fn(),
  runSafeCleanupUnusedBooks: vi.fn(),
}));

import AdminLibraryQuality from './AdminLibraryQuality';

const LocationDisplay = () => {
  const location = useLocation();
  return <output aria-label="current route">{location.pathname}</output>;
};

const renderPage = () => render(
  <MemoryRouter initialEntries={['/admin/library-quality']}>
    <AdminLibraryQuality />
    <LocationDisplay />
  </MemoryRouter>,
);

const makeGroup = (overrides: Record<string, any> = {}) => ({
  groupId: 'duplicate-group-1',
  clusterTitle: 'The Dispossessed',
  author: 'Ursula K. Le Guin',
  count: 2,
  classification: 'exact_duplicate_edition',
  confidence: 'high',
  recommendedPrimary: {
    id: 'book-1',
    title: 'The Dispossessed',
    author: 'Ursula K. Le Guin',
    qualityScore: 95,
    accessStatus: 'verified_full_text',
    reason: 'Best verified edition',
  },
  recommendedSecondary: {
    id: 'book-2',
    title: 'The Dispossessed (Illustrated)',
    author: 'Ursula K. Le Guin',
    qualityScore: 80,
    accessStatus: 'public_domain',
    reason: 'Distinct edition',
  },
  candidateRecords: [
    {
      id: 'book-1',
      title: 'The Dispossessed',
      author: 'Ursula K. Le Guin',
      isbn: null,
      publication_year: 1974,
      cover_image_url: null,
      pdf_url: null,
      qualityScore: 95,
      accessStatus: 'verified_full_text',
      isPrimary: true,
      isSecondary: false,
      isArchiveCandidate: false,
      userReferences: { bookshelf: 1, personalLibrary: 0, readingProgress: 1, rooms: 0, marginNotes: 0, posts: 0, total: 2 },
      proposedAction: 'Keep as primary',
    },
    {
      id: 'book-2',
      title: 'The Dispossessed (Illustrated)',
      author: 'Ursula K. Le Guin',
      isbn: null,
      publication_year: 2019,
      cover_image_url: null,
      pdf_url: null,
      qualityScore: 80,
      accessStatus: 'public_domain',
      isPrimary: false,
      isSecondary: true,
      isArchiveCandidate: false,
      userReferences: { bookshelf: 0, personalLibrary: 0, readingProgress: 0, rooms: 0, marginNotes: 0, posts: 0, total: 0 },
      proposedAction: 'Preserve as alternative edition',
    },
  ],
  archiveCandidatesCount: 0,
  totalUserReferences: 2,
  proposedAction: 'keep_top_editions',
  requiresManualReview: false,
  warnings: [],
  ...overrides,
});

const makeAudit = (groups: any[]) => ({
  totalRecordsScanned: 42,
  candidateGroupsCount: groups.length,
  highConfidenceGroupsCount: groups.filter((g) => g.confidence === 'high').length,
  ambiguousGroupsCount: groups.filter((g) => g.requiresManualReview).length,
  possibleJunkCount: 0,
  groups,
  summary: {
    potentialRedundantRecords: 0,
    averageQualityScore: 87,
    executionImpact: {
      booksToArchive: 0,
      metadataFieldsToEnrich: 1,
      userReferencesToSafelyMigrate: 2,
    },
  },
  timestamp: '2026-10-29T00:00:00.000Z',
});

describe('AdminLibraryQuality', () => {
  beforeEach(() => {
    mocks.user = { id: 'admin-1' };
    mocks.authLoading = false;
    mocks.isAdmin = true;
    mocks.roleLoading = false;
    mocks.auditLoading = false;
    mocks.auditFetching = false;
    mocks.auditData = makeAudit([]);
    mocks.archivedBooks = [];
    mocks.auditLogs = [];
    mocks.runAudit.mockReset();
    mocks.refetchLogs.mockReset();
    mocks.refetchVault.mockReset();
    mocks.toast.mockReset();
    mocks.mutate.mockReset();
    mocks.mutateAsync.mockReset().mockResolvedValue({ message: 'Preview ready' });
    mocks.invalidateQueries.mockReset().mockResolvedValue(undefined);
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('shows loading placeholders while authentication is being restored', () => {
    mocks.authLoading = true;
    renderPage();

    expect(document.querySelectorAll('.animate-pulse').length).toBeGreaterThan(0);
    expect(screen.queryByText('Library Quality & Duplicate Review')).not.toBeInTheDocument();
  });

  it('redirects signed-out visitors away from the admin page', () => {
    mocks.user = null;
    renderPage();

    expect(screen.getByLabelText('current route')).toHaveTextContent('/');
    expect(screen.queryByText('Library Quality & Duplicate Review')).not.toBeInTheDocument();
  });

  it('redirects signed-in non-admin users away from the admin page', () => {
    mocks.isAdmin = false;
    renderPage();

    expect(screen.getByLabelText('current route')).toHaveTextContent('/');
  });

  it('renders the audit summary and the empty duplicate state', () => {
    renderPage();

    expect(screen.getByRole('heading', { name: 'Library Quality & Duplicate Review' })).toBeInTheDocument();
    expect(screen.getByText('42')).toBeInTheDocument();
    expect(screen.getByText('No Duplicates Found')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Run Audit/ })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Run Audit/ }));
    expect(mocks.runAudit).toHaveBeenCalledOnce();
  });

  it('filters duplicate groups by confidence and searches candidate titles', () => {
    mocks.auditData = makeAudit([
      makeGroup(),
      makeGroup({
        groupId: 'review-group',
        clusterTitle: 'The Hobbit',
        author: 'J. R. R. Tolkien',
        confidence: 'low',
        requiresManualReview: true,
        recommendedPrimary: {
          id: 'hobbit-1',
          title: 'The Hobbit',
          author: 'J. R. R. Tolkien',
          qualityScore: 72,
          accessStatus: 'metadata_only',
          reason: 'Needs manual review',
        },
        recommendedSecondary: undefined,
        candidateRecords: [
          {
            id: 'hobbit-1',
            title: 'The Hobbit',
            author: 'J. R. R. Tolkien',
            isbn: null,
            publication_year: 1937,
            cover_image_url: null,
            pdf_url: null,
            qualityScore: 72,
            accessStatus: 'metadata_only',
            isPrimary: true,
            isSecondary: false,
            isArchiveCandidate: false,
            userReferences: { bookshelf: 0, personalLibrary: 0, readingProgress: 0, rooms: 0, marginNotes: 0, posts: 0, total: 0 },
            proposedAction: 'Keep as primary',
          },
        ],
      }),
    ]);
    renderPage();

    expect(screen.getByText('The Dispossessed')).toBeInTheDocument();
    expect(screen.getByText('The Hobbit')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /High Confidence/ }));
    expect(screen.getByText('The Dispossessed')).toBeInTheDocument();
    expect(screen.queryByText('The Hobbit')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /All Groups/ }));
    fireEvent.change(screen.getByPlaceholderText('Search by title or author...'), {
      target: { value: 'tolkien' },
    });
    expect(screen.getByText('The Hobbit')).toBeInTheDocument();
    expect(screen.queryByText('The Dispossessed')).not.toBeInTheDocument();
  });

  it('expands candidate records for a duplicate group', () => {
    mocks.auditData = makeAudit([makeGroup()]);
    renderPage();

    fireEvent.click(screen.getByRole('button', { name: /Inspect All \(2\)/ }));
    expect(screen.getByText('Candidate Records in this Cluster (2)')).toBeInTheDocument();
    expect(screen.getByText('The Dispossessed (Illustrated)')).toBeInTheDocument();
  });
});
