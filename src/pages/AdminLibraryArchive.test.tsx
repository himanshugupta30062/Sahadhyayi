// @vitest-environment jsdom

import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
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
  archiveLibraryBook: vi.fn(),
  restoreArchivedBook: vi.fn(),
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
  applyDuplicateResolution: vi.fn(),
}));

import AdminLibraryArchive from './AdminLibraryArchive';

const LocationDisplay = () => {
  const location = useLocation();
  return <output aria-label="current route">{location.pathname}</output>;
};

const renderPage = (defaultTab: 'active' | 'archived' | 'duplicate' | 'history' | 'visitors' = 'archived') => render(
  <MemoryRouter initialEntries={['/admin/library-archive']}>
    <AdminLibraryArchive defaultTab={defaultTab} />
    <LocationDisplay />
  </MemoryRouter>,
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
    ]) fn.mockReset();
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

  it('switches to active catalog and exposes the search and refresh controls', () => {
    renderPage();
    fireEvent.click(screen.getByRole('button', { name: /Active Catalog/ }));

    expect(screen.getByPlaceholderText('Search active books to review...')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /Refresh/ }));
    expect(mocks.refetchActive).toHaveBeenCalledOnce();
  });

  it('switches to duplicate review and supports rerunning the scan', () => {
    renderPage();
    fireEvent.click(screen.getByRole('button', { name: /Duplicate Review/ }));

    expect(screen.getByText('Multi-Signal Duplicate Clustering')).toBeInTheDocument();
    expect(screen.getByText('No duplicate candidate groups detected in the catalog.')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /Run Duplicate Scan/ }));
    expect(mocks.refetchAudit).toHaveBeenCalledOnce();
  });

  it('switches to archive history and visitor intelligence empty states', () => {
    renderPage();
    fireEvent.click(screen.getByRole('button', { name: /Archive History/ }));
    expect(screen.getByText('Archive & Resolution Audit Trail')).toBeInTheDocument();
    expect(screen.getByText('No archive or restore actions recorded yet.')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Visitor Intelligence/ }));
    expect(screen.getByPlaceholderText('Search by IP, city, country, or route...')).toBeInTheDocument();
    expect(screen.getByText('No visitor records found')).toBeInTheDocument();
  });
});
