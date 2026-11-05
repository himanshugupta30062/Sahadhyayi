// @vitest-environment jsdom

import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
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
  useMutation: (options?: any) => ({
    mutate: (vars: any) => {
      mocks.mutate(vars);
      if (options?.onSuccess) {
        options.onSuccess(
          {
            success: true,
            action: vars.action,
            primaryId: 'primary-1',
            archivedBookIds: ['secondary-1'],
            mergedFields: ['isbn', 'description'],
            message: 'Resolution applied successfully',
          },
          vars
        );
      }
    },
    mutateAsync: async (vars: any) => {
      mocks.mutateAsync(vars);
      if (options?.onSuccess) {
        options.onSuccess(
          {
            success: true,
            action: vars.action,
            primaryId: 'primary-1',
            archivedBookIds: ['secondary-1'],
            mergedFields: ['isbn', 'description'],
            message: 'Resolution applied successfully',
          },
          vars
        );
      }
      return {
        success: true,
        action: vars.action,
        primaryId: 'primary-1',
        archivedBookIds: ['secondary-1'],
        mergedFields: ['isbn', 'description'],
        message: 'Resolution applied successfully',
      };
    },
  }),
  useQueryClient: () => ({ invalidateQueries: mocks.invalidateQueries }),
}));

vi.mock('@/integrations/supabase/client-universal', () => ({
  supabase: { from: vi.fn() },
}));

vi.mock('@/utils/catalog/duplicateAudit', () => ({
  generateLibraryDuplicateAudit: vi.fn(),
}));

vi.mock('@/utils/catalog/duplicateResolution', () => ({
  applyDuplicateResolution: vi.fn().mockResolvedValue({
    success: true,
    action: 'restore_archived_record',
    primaryId: 'primary-1',
    archivedBookIds: [],
    mergedFields: [],
    message: 'Record restored',
  }),
  verifyAdminStatus: vi.fn().mockResolvedValue(true),
}));

vi.mock('@/utils/catalog/bookArchiveVault', () => ({
  archiveUnwantedBook: vi.fn().mockResolvedValue({ message: 'Book safely archived' }),
  restoreBookFromArchive: vi.fn().mockResolvedValue({ message: 'Book safely restored' }),
  getArchivedBooks: vi.fn().mockResolvedValue([]),
  runSafeCleanupUnusedBooks: vi.fn().mockResolvedValue(5),
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
  recommendedAction: 'merge_into_primary',
  recommendedPrimary: {
    id: 'primary-1',
    title: 'The Dispossessed',
    author: 'Ursula K. Le Guin',
    qualityScore: 95,
    accessStatus: 'open_access',
    reason: 'Has cover, PDF, and high resolution metadata',
  },
  recommendedSecondary: {
    id: 'secondary-1',
    title: 'The Dispossessed (Illustrated)',
    author: 'Ursula K. Le Guin',
    qualityScore: 80,
    accessStatus: 'open_access',
  },
  candidateRecords: [
    {
      id: 'primary-1',
      title: 'The Dispossessed',
      author: 'Ursula K. Le Guin',
      isbn: '9780060512750',
      publication_year: 1974,
      cover_image_url: 'https://example.com/cover1.jpg',
      pdf_url: 'https://example.com/book1.pdf',
      qualityScore: 95,
      accessStatus: 'open_access',
      isPrimary: true,
      isSecondary: false,
      isArchiveCandidate: false,
      userReferences: {
        bookshelf: 1,
        personalLibrary: 1,
        readingProgress: 0,
        rooms: 0,
        marginNotes: 0,
        posts: 0,
        total: 2,
      },
      proposedAction: 'Keep as canonical edition',
    },
    {
      id: 'secondary-1',
      title: 'The Dispossessed (Illustrated)',
      author: 'Ursula K. Le Guin',
      isbn: null,
      publication_year: 1975,
      cover_image_url: null,
      pdf_url: null,
      qualityScore: 80,
      accessStatus: 'open_access',
      isPrimary: false,
      isSecondary: true,
      isArchiveCandidate: true,
      userReferences: {
        bookshelf: 0,
        personalLibrary: 0,
        readingProgress: 0,
        rooms: 0,
        marginNotes: 0,
        posts: 0,
        total: 0,
      },
      proposedAction: 'Archive after migrating metadata',
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

    expect(screen.getByRole('heading', { name: 'The Dispossessed' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'The Hobbit' })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /High Confidence/ }));
    expect(screen.getByRole('heading', { name: 'The Dispossessed' })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'The Hobbit' })).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /All Groups/ }));
    fireEvent.change(screen.getByPlaceholderText('Search by title or author...'), {
      target: { value: 'tolkien' },
    });
    expect(screen.getByRole('heading', { name: 'The Hobbit' })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'The Dispossessed' })).not.toBeInTheDocument();
  });

  it('expands candidate records for a duplicate group', () => {
    mocks.auditData = makeAudit([makeGroup()]);
    renderPage();

    fireEvent.click(screen.getByRole('button', { name: /Inspect All \(2\)/ }));
    expect(screen.getByText('Candidate Records in this Cluster (2)')).toBeInTheDocument();
    expect(screen.getAllByText('The Dispossessed (Illustrated)').length).toBeGreaterThan(1);
  });

  it('triggers safe automated cleanup and displays toast notification', async () => {
    const { runSafeCleanupUnusedBooks } = await import('@/utils/catalog/bookArchiveVault');
    vi.mocked(runSafeCleanupUnusedBooks).mockResolvedValue(5);
    window.confirm = vi.fn().mockReturnValue(true);

    mocks.auditData = makeAudit([makeGroup()]);
    renderPage();

    fireEvent.click(screen.getByRole('button', { name: /Archive Vault/i }));
    const cleanupButton = screen.getByRole('button', { name: /Safe Automated Cleanup/i });
    fireEvent.click(cleanupButton);

    await waitFor(() => {
      expect(runSafeCleanupUnusedBooks).toHaveBeenCalled();
      expect(mocks.toast).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Safe Cleanup Completed',
        })
      );
    });
  });

  it('opens preview dialog when clicking Keep Best & Archive and approves resolution', async () => {
    mocks.auditData = makeAudit([makeGroup()]);
    renderPage();

    const mergeBtn = screen.getByRole('button', { name: /Keep Best & Archive/i });
    fireEvent.click(mergeBtn);

    expect(screen.getByText('Preview Changes Before Approval')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Approve & Execute Resolution/i })).toBeInTheDocument();

    const approveBtn = screen.getByRole('button', { name: /Approve & Execute Resolution/i });
    fireEvent.click(approveBtn);

    await waitFor(() => {
      expect(mocks.mutateAsync).toHaveBeenCalled();
    });
  });

  it('handles mark as false positive action', () => {
    mocks.auditData = makeAudit([makeGroup()]);
    renderPage();

    fireEvent.click(screen.getByRole('button', { name: /Inspect All \(2\)/ }));

    const falsePositiveBtn = screen.getByRole('button', { name: /Mark as False Positive/i });
    fireEvent.click(falsePositiveBtn);
    expect(mocks.mutate).toHaveBeenCalledWith(expect.objectContaining({ action: 'keep_separate' }));
  });

  it('handles mark junk action', () => {
    mocks.auditData = makeAudit([makeGroup()]);
    renderPage();

    fireEvent.click(screen.getByRole('button', { name: /Inspect All \(2\)/ }));

    const junkBtn = screen.getByRole('button', { name: /Mark Junk/i });
    fireEvent.click(junkBtn);
    expect(mocks.mutate).toHaveBeenCalledWith(expect.objectContaining({ action: 'archive_junk' }));
  });

  it('renders and interacts with the Audit Logs tab', async () => {
    mocks.auditLogs = [
      {
        id: 'log-1',
        action: 'merge_into_primary',
        primary_book_id: 'book-12345678',
        affected_book_ids: ['book-87654321'],
        reason: 'Identical editions merged',
        created_at: '2026-11-05T12:00:00Z',
      },
    ];

    renderPage();

    fireEvent.click(screen.getByRole('button', { name: /Audit Logs/i }));
    expect(screen.getByText('Duplicate Resolution Audit Logs')).toBeInTheDocument();
    expect(screen.getByText('merge_into_primary')).toBeInTheDocument();
    expect(screen.getByText('Identical editions merged')).toBeInTheDocument();

    const restoreBtn = screen.getByRole('button', { name: /Restore/i });
    fireEvent.click(restoreBtn);

    await waitFor(() => {
      expect(mocks.toast).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Record Restored',
        })
      );
    });

    const refreshBtn = screen.getByRole('button', { name: /Refresh/i });
    fireEvent.click(refreshBtn);
    expect(mocks.refetchLogs).toHaveBeenCalled();
  });

  it('renders and interacts with Archive Vault tab including search, restore and manual archive modal', async () => {
    mocks.archivedBooks = [
      {
        id: 'vault-1',
        title: 'Archived Duplicate Title',
        author: 'Ursula K. Le Guin',
        archived_at: '2026-11-05T12:00:00Z',
        archive_reason: 'Duplicate edition',
        publication_year: 2020,
        language: 'en',
        cover_image_url: 'https://example.com/cover.jpg',
      },
    ];

    renderPage();

    fireEvent.click(screen.getByRole('button', { name: /Archive Vault/i }));
    expect(screen.getByText('Non-Destructive Book Vault (Hidden from Users)')).toBeInTheDocument();
    expect(screen.getByText('Archived Duplicate Title')).toBeInTheDocument();

    const vaultSearch = screen.getByPlaceholderText('Search vault by title, author, or reason...');
    fireEvent.change(vaultSearch, { target: { value: 'Nonexistent Book' } });
    expect(screen.queryByText('Archived Duplicate Title')).not.toBeInTheDocument();

    fireEvent.change(vaultSearch, { target: { value: 'Archived Duplicate' } });
    expect(screen.getByText('Archived Duplicate Title')).toBeInTheDocument();

    const bringBackBtn = screen.getByRole('button', { name: /Bring Back to Library/i });
    fireEvent.click(bringBackBtn);

    await waitFor(() => {
      expect(mocks.toast).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Book Restored to Active Library',
        })
      );
    });

    const archiveByIdBtn = screen.getByRole('button', { name: /Archive Book by ID/i });
    fireEvent.click(archiveByIdBtn);

    expect(screen.getByText('Archive Unwanted Book')).toBeInTheDocument();
    fireEvent.change(screen.getByPlaceholderText(/550e8400-e29b/i), {
      target: { value: '550e8400-e29b-41d4-a716-446655440000' },
    });
    fireEvent.change(screen.getByPlaceholderText(/Poor scan quality/i), {
      target: { value: 'Corrupt file' },
    });

    fireEvent.click(screen.getByRole('button', { name: /Move to Archive Vault/i }));

    await waitFor(() => {
      expect(mocks.toast).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Book Safely Archived',
        })
      );
    });
  });
});
