// @vitest-environment jsdom
import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import App from './App';

const mocks = vi.hoisted(() => ({
  configured: true,
  user: null as null | { id: string },
  loading: false,
  initializeSecurity: vi.fn(),
  initializeSecureSession: vi.fn(),
  setCSRFToken: vi.fn(),
  generateCSRFToken: vi.fn(() => 'test-csrf-token'),
}));

vi.mock('@/integrations/supabase/client-universal', () => ({
  get isSupabaseConfigured() {
    return mocks.configured;
  },
}));

vi.mock('@/utils/security.ts', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/utils/security.ts')>()),
  initializeSecurity: mocks.initializeSecurity,
  initializeSecureSession: mocks.initializeSecureSession,
  setCSRFToken: mocks.setCSRFToken,
  generateCSRFToken: mocks.generateCSRFToken,
}));

vi.mock('@/contexts/authHelpers', () => ({
  useAuth: () => ({ user: mocks.user, loading: mocks.loading }),
}));

vi.mock('@/hooks/use-toast', () => ({ toast: vi.fn() }));
vi.mock('@/utils/errorHandler', () => ({ errorHandler: { reportCustomError: vi.fn() } }));
vi.mock('@/hooks/usePageVisitTracker', () => ({ default: vi.fn() }));
vi.mock('@/sentry', () => ({}));

vi.mock('@/components/ErrorBoundary', () => ({
  ErrorBoundary: ({ children }: React.PropsWithChildren) => <>{children}</>,
}));
vi.mock('./contexts/AuthContext', () => ({
  AuthProvider: ({ children }: React.PropsWithChildren) => <>{children}</>,
}));
vi.mock('./contexts/QuotesContext', () => ({
  default: ({ children }: React.PropsWithChildren) => <>{children}</>,
}));
vi.mock('./contexts/BookExpertContext', () => ({
  default: ({ children }: React.PropsWithChildren) => <>{children}</>,
}));
vi.mock('./contexts/ThemeContext', () => ({
  ThemeProvider: ({ children }: React.PropsWithChildren) => <>{children}</>,
}));
vi.mock('./components/ui/tooltip', () => ({
  TooltipProvider: ({ children }: React.PropsWithChildren) => <>{children}</>,
}));
vi.mock('./components/ui/toaster', () => ({ Toaster: () => null }));
vi.mock('./components/Navigation', () => ({ default: () => <nav>Test navigation</nav> }));
vi.mock('./components/ProtectedRoute', () => ({
  default: ({ children }: React.PropsWithChildren) => <>{children}</>,
}));
vi.mock('./components/AdminRoute', () => ({
  default: ({ children }: React.PropsWithChildren) => <>{children}</>,
}));
vi.mock('./components/DeferredSection', () => ({
  default: ({ children }: React.PropsWithChildren) => <>{children}</>,
}));
vi.mock('./components/ScrollToTop', () => ({ default: () => null }));
vi.mock('./components/ui/BookFlipLoader', () => ({
  default: ({ text }: { text?: string }) => <div role="status">{text ?? 'Loading...'}</div>,
}));
vi.mock('./pages/NotFound', () => ({ default: () => <div>Not found page</div> }));
vi.mock('./pages/Index', () => ({ default: () => <div>Public marketing homepage</div> }));
vi.mock('./pages/Dashboard', () => ({ default: () => <div>Reader dashboard</div> }));
vi.mock('./pages/SignIn', () => ({ default: () => <div>Sign-in page rendered</div> }));
vi.mock('./pages/SignUp', () => ({ default: () => <div>Sign-up page rendered</div> }));
vi.mock('./components/book-expert/BookExpert', () => ({ default: () => null }));

describe('App root routing and configuration', () => {
  beforeEach(() => {
    mocks.configured = true;
    mocks.user = null;
    mocks.loading = false;
    mocks.initializeSecurity.mockClear();
    mocks.initializeSecureSession.mockClear();
    mocks.setCSRFToken.mockClear();
    mocks.generateCSRFToken.mockClear();
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('shows a clear configuration error when public Supabase settings are missing', () => {
    mocks.configured = false;

    render(<App />);

    expect(screen.getByRole('alert')).toBeTruthy();
    expect(screen.getByRole('heading', { name: 'Sahadhyayi is temporarily unavailable' })).toBeTruthy();
    expect(screen.getByText(/VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY/i)).toBeTruthy();
    expect(screen.queryByText('Test navigation')).toBeNull();
  });

  it('waits for auth restoration before choosing the homepage', () => {
    mocks.loading = true;

    render(<App />);

    expect(screen.getByRole('status').textContent).toContain('Loading your Sahadhyayi home...');
    expect(screen.queryByText('Public marketing homepage')).toBeNull();
    expect(screen.queryByText('Reader dashboard')).toBeNull();
  });

  it('shows the public marketing homepage for a signed-out visitor', async () => {
    render(<App />);

    expect(await screen.findByText('Public marketing homepage')).toBeTruthy();
    expect(screen.queryByText('Reader dashboard')).toBeNull();
  });

  it('redirects an authenticated visitor from the root to the reader dashboard', async () => {
    mocks.user = { id: 'reader-1' };

    render(<App />);

    expect(await screen.findByText('Reader dashboard')).toBeTruthy();
    expect(screen.queryByText('Public marketing homepage')).toBeNull();
  });

  it('initializes security protections when the app mounts', async () => {
    render(<App />);

    await waitFor(() => {
      expect(mocks.initializeSecurity).toHaveBeenCalledTimes(1);
      expect(mocks.initializeSecureSession).toHaveBeenCalledTimes(1);
    });
  });

  it('redirects legacy /auth links to sign-in and preserves query parameters', async () => {
    window.history.replaceState({}, '', '/auth?intent=add_shelf&book_id=book-1&redirect=%2Flibrary');
    render(<App />);

    expect(await screen.findByText('Sign-in page rendered')).toBeTruthy();
    expect(window.location.pathname).toBe('/signin');
    expect(window.location.search).toContain('intent=add_shelf');
    expect(window.location.search).toContain('book_id=book-1');
    expect(window.location.search).toContain('redirect=%2Flibrary');
  });

  it('redirects legacy /auth?tab=signup links to sign-up', async () => {
    window.history.replaceState({}, '', '/auth?tab=signup');
    render(<App />);

    expect(await screen.findByText('Sign-up page rendered')).toBeTruthy();
    expect(window.location.pathname).toBe('/signup');
    expect(window.location.search).toContain('tab=signup');
  });
});
