// @vitest-environment jsdom

import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { MemoryRouter, useLocation } from 'react-router-dom';

const mocks = vi.hoisted(() => ({
  user: null as null | { id: string },
  archivedBooks: [] as any[],
  activeBooks: [] as any[],
  auditData: null as any,
  historyLogs: [] as any[],
  recentVisits: [] as any[],
  queryLoading: false,
  refetchArchived: vi.fn(),
  refetchActive: vi.fn(),
  refetchAudit: vi.fn(),
  refetchHistory: vi.fn(),
  refetchVisits: vi.fn(),
  toast: vi.fn(),
  mutate: vi.fn(),
  mutateAsync: vi.fn(),
  invalidateQueries: vi.fn(),
  archiveLibraryBook: vi.fn(),
  restoreArchivedBook: vi.fn(),
  applyDuplicateResolution: vi.fn(),
}));

vi.mock('@/contexts/authHelpers', () => ({
  useAuth: () => ({ user: mocks.user }),
}));

vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({ toast: mocks.toast }),
}));

vi.mock('@tanstack/react-query', () => ({
  useQuery: (options: { queryKey: unknown[] }) => {
    switch (options.queryKey[0]) {
      case 'admin-archived-books':
        return { data: mocks.archivedBooks, isLoading: mocks.queryLoading, refetch: mocks.refetchArchived };
      case 'admin-active-catalog-sample':
        return { data: mocks.activeBooks, isLoading: mocks.queryLoading, refetch: mocks.refetchActive };
      case 'library-duplicate-audit':
        return { data: mocks.auditData, isLoading: mocks.queryLoading, isFetching: false, refetch: mocks.refetchAudit };
      case 'admin-archive-history-logs':
        return { data: mocks.historyLogs, isLoading: mocks.queryLoading, refetch: mocks.refetchHistory };
      case 'admin-visitor-intelligence':
        return { data: mocks.recentVisits, isLoading: mocks.queryLoading, isFetching: false, refetch: mocks.refetchVisits };
      default:
        return {};
    }
  },
  useMutation: () => ({ mutate: mocks.mutate, mutateAsync: mocks.mutateAsync }),
  useQueryClient: () => ({ invalidateQueries: mocks.invalidateQueries }),
}));

vi.mock('@/integrations/supabase/client-universal', () => ({
  supabase: { from: vi.fn(), rpc: vi.fn() },
}));

vi.mock('@/utils/catalog/bookArchiveVault', () => ({
  archiveLibraryBook: (...args: any[]) => mocks.archiveLibraryBook(...args),
  restoreArchivedBook: (...args: any[]) => mocks.restoreArchivedBook(...args),
  getAdminArchivedBooks: vi.fn(),
}));

vi.mock('@/utils/catalog/bookVisibility', () => ({
  detectBookSchemaCapabilities: vi.fn(),
  applyPublicBookFilter: vi.fn(),
  filterPublicBooks: vi.fn(),
}));

vi.mock('@/utils/catalog/duplicateAudit', () => ({
  generateLibraryDuplicateAudit: vi.fn(),
}));

vi.mock('@/utils/catalog/duplicateResolution', () => ({
  applyDuplicateResolution: (...args: any[]) => mocks.applyDuplicateResolution(...args),
}));

import AdminLibraryArchive from './AdminLibraryArchive';

const LocationDisplay = () => {
  const location = useLocation();
  return <output aria-label="current route">{location.pathname}</output>;
};

const renderPage = (defaultTab: 'active' | 'archived' | 'duplicate' | 'history' | 'visitors' = 'archived') =>
  render(
    <MemoryRouter initialEntries={['/admin/library-archive']}>
      <AdminLibraryArchive defaultTab={defaultTab} />
      <LocationDisplay />
    </MemoryRouter>
  );

describe('AdminLibraryArchive', () => {
  beforeEach(() => {
    mocks.user = { id: 'admin-1' };
    mocks.archivedBooks = [];
    mocks.activeBooks = [];
    mocks.auditData = { groups: [] };
    mocks.historyLogs = [];
    mocks.recentVisits = [];
    mocks.queryLoading = false;
    for (const fn of [
      mocks.refetchArchived,
      mocks.refetchActive,
      mocks.refetchAudit,
      mocks.refetchHistory,
      mocks.refetchVisits,
      mocks.toast,
      mocks.mutate,
      mocks.mutateAsync,
      mocks.invalidateQueries,
      mocks.archiveLibraryBook,
      mocks.restoreArchivedBook,
      mocks.applyDuplicateResolution,
    ])
      fn.mockReset();
    mocks.mutateAsync.mockResolvedValue({ message: 'Completed' });
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('shows the archived-books empty state by default', () => {
    renderPage();

    expect(screen.getByRole('heading', { name: 'Library Archive & Recovery Vault' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Archived Books/ })).toBeInTheDocument();
    expect(screen.getByText('No archived books found')).toBeInTheDocument();
    expect(screen.getByText('Page 1')).toBeInTheDocument();
  });

  it('renders archived books list and allows restoring a book', async () => {
    mocks.archivedBooks = [
      {
        id: 'archived-1',
        book_id: 'archived-12345678',
        title: 'Old Archived Manuscript',
        author: 'Ancient Writer',
        genre: 'History',
        archive_status: 'archived',
        archive_reason: 'Duplicate edition',
        archive_classification: 'duplicate_copy',
        archived_at: '2026-01-01T00:00:00Z',
      },
    ];
    mocks.restoreArchivedBook.mockResolvedValue({ message: 'Manuscript restored' });

    renderPage('archived');

    expect(screen.getByText('Old Archived Manuscript')).toBeInTheDocument();
    expect(screen.getByText('Ancient Writer')).toBeInTheDocument();
    expect(screen.getAllByText(/Duplicate edition/i).length).toBeGreaterThan(0);

    const restoreBtn = screen.getByRole('button', { name: /restore/i });
    fireEvent.click(restoreBtn);

    await waitFor(() => {
      expect(mocks.restoreArchivedBook).toHaveBeenCalledWith(
        'archived-12345678',
        expect.any(String),
        'active'
      );
      expect(mocks.toast).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Book Restored to Public Library',
        })
      );
    });
  });

  it('switches to active catalog, renders active books and triggers archive modal flow', async () => {
    mocks.activeBooks = [
      {
        id: 'active-1',
        title: 'Premchand Kahaniyan',
        author: 'Munshi Premchand',
        genre: 'Fiction',
        created_at: '2026-01-01T00:00:00Z',
      },
    ];
    mocks.archiveLibraryBook.mockResolvedValue({ message: 'Archived successfully' });

    renderPage('active');

    expect(screen.getByText('Premchand Kahaniyan')).toBeInTheDocument();
    expect(screen.getByText('Munshi Premchand')).toBeInTheDocument();

    const archiveBtn = screen.getByRole('button', { name: /archive from library/i });
    fireEvent.click(archiveBtn);

    expect(screen.getByText('Archive Book from Public Library')).toBeInTheDocument();

    const reasonInput = screen.getByPlaceholderText(/Low scan quality/i);
    fireEvent.change(reasonInput, { target: { value: 'Superseded by annotated volume' } });

    const confirmBtn = screen.getByRole('button', { name: /confirm & archive book/i });
    fireEvent.click(confirmBtn);

    await waitFor(() => {
      expect(mocks.archiveLibraryBook).toHaveBeenCalledWith(
        'active-1',
        'Superseded by annotated volume',
        expect.objectContaining({ classification: 'unwanted' })
      );
      expect(mocks.toast).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Book Safely Archived',
        })
      );
    });
  });

  it('switches to duplicate review and supports previewing resolution', async () => {
    mocks.auditData = {
      groups: [
        {
          groupId: 'grp-1',
          groupKey: 'premchand-godaan',
          clusterTitle: 'Godaan Duplicate Cluster',
          classification: 'exact_duplicate',
          confidence: 'high',
          author: 'Premchand',
          candidateRecords: [
            { id: 'b1-12345678', title: 'Godaan', author: 'Premchand', qualityScore: 90, isPrimary: true },
            { id: 'b2-12345678', title: 'Godaan (Copy)', author: 'Premchand', qualityScore: 50, isPrimary: false },
          ],
          canonicalTitle: 'Godaan',
          canonicalAuthor: 'Premchand',
          books: [
            { id: 'b1', title: 'Godaan', author: 'Premchand', completeness_score: 90 },
            { id: 'b2', title: 'Godaan (Copy)', author: 'Premchand', completeness_score: 50 },
          ],
          primaryBookId: 'b1',
          duplicateCount: 1,
          avgCompletenessScore: 70,
        },
      ],
    };

    mocks.applyDuplicateResolution.mockResolvedValue({
      message: 'Resolution preview generated',
      primaryId: 'b1-12345678',
      archivedBookIds: ['b2-12345678'],
      mergedFields: ['description'],
      actions: [{ bookId: 'b2-12345678', action: 'archive' }],
    });

    renderPage('duplicate');

    expect(screen.getByText('Godaan Duplicate Cluster')).toBeInTheDocument();
    expect(screen.getByText(/2 records in cluster/i)).toBeInTheDocument();

    const resolveBtn = screen.getByRole('button', { name: /resolve & archive duplicates/i });
    fireEvent.click(resolveBtn);

    await waitFor(() => {
      expect(mocks.applyDuplicateResolution).toHaveBeenCalledWith(
        'grp-1',
        'merge_and_archive_duplicates',
        { dryRun: true }
      );
      expect(screen.getByText('Preview Changes Before Approval')).toBeInTheDocument();
    });
  });

  it('handles visitor intelligence tab and copies IP to clipboard', async () => {
    mocks.recentVisits = [
      {
        id: 'visit-1',
        ip_address: '192.168.1.100',
        city: 'New Delhi',
        region: 'Delhi',
        country_code: 'IN',
        page_url: '/library',
        visited_at: '2026-01-01T12:00:00Z',
      },
    ];

    Object.assign(navigator, {
      clipboard: {
        writeText: vi.fn().mockResolvedValue(undefined),
      },
    });

    renderPage('visitors');

    expect(screen.getByText('192.168.1.100')).toBeInTheDocument();
    expect(screen.getByText('New Delhi')).toBeInTheDocument();

    const copyBtn = screen.getByTitle('Copy IP address');
    fireEvent.click(copyBtn);

    expect(navigator.clipboard.writeText).toHaveBeenCalledWith('192.168.1.100');
    expect(mocks.toast).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'IP Copied',
      })
    );
  });
});
