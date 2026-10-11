/** @vitest-environment jsdom */

import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import '@testing-library/jest-dom/vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import AdminRoute from '@/components/AdminRoute';
import * as authHelpers from '@/contexts/authHelpers';
import * as duplicateResolution from '@/utils/catalog/duplicateResolution';

describe('AdminRoute Security & Access Guard Tests', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    vi.clearAllMocks();
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
      },
    });
  });

  it('renders loading skeleton while checking user authentication or admin role', () => {
    vi.spyOn(authHelpers, 'useAuth').mockReturnValue({
      user: null,
      loading: true,
      error: null,
    } as any);

    const { container } = render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={['/admin/library-archive']}>
          <AdminRoute>
            <div>Protected Secret Content</div>
          </AdminRoute>
        </MemoryRouter>
      </QueryClientProvider>
    );

    expect(screen.queryByText('Protected Secret Content')).toBeNull();
    expect(container.getElementsByClassName('animate-pulse').length).toBeGreaterThan(0);
  });

  it('redirects unauthenticated users to /signin', () => {
    vi.spyOn(authHelpers, 'useAuth').mockReturnValue({
      user: null,
      loading: false,
      error: null,
    } as any);

    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={['/admin/library-archive']}>
          <Routes>
            <Route
              path="/admin/library-archive"
              element={
                <AdminRoute>
                  <div>Protected Secret Content</div>
                </AdminRoute>
              }
            />
            <Route path="/signin" element={<div>Sign In Page</div>} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>
    );

    expect(screen.queryByText('Protected Secret Content')).toBeNull();
    expect(screen.getByText('Sign In Page')).toBeDefined();
  });

  it('denies access to authenticated non-admin users with an explicit warning', async () => {
    vi.spyOn(authHelpers, 'useAuth').mockReturnValue({
      user: { id: 'regular-user-1', email: 'user@example.com' } as any,
      loading: false,
      error: null,
    } as any);

    vi.spyOn(duplicateResolution, 'verifyAdminStatus').mockResolvedValue(false);

    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={['/admin/library-archive']}>
          <AdminRoute>
            <div>Protected Secret Content</div>
          </AdminRoute>
        </MemoryRouter>
      </QueryClientProvider>
    );

    expect(await screen.findByText('Administrator Access Required')).toBeDefined();
    expect(screen.queryByText('Protected Secret Content')).toBeNull();
  });

  it('grants access and renders protected content for authorized admin users', async () => {
    vi.spyOn(authHelpers, 'useAuth').mockReturnValue({
      user: { id: 'admin-user-1', email: 'admin@sahadhyayi.com' } as any,
      loading: false,
      error: null,
    } as any);

    vi.spyOn(duplicateResolution, 'verifyAdminStatus').mockResolvedValue(true);

    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={['/admin/library-archive']}>
          <AdminRoute>
            <div>Protected Secret Content</div>
          </AdminRoute>
        </MemoryRouter>
      </QueryClientProvider>
    );

    expect(await screen.findByText('Protected Secret Content')).toBeDefined();
  });
});
