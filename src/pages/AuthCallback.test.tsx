// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import AuthCallback from './AuthCallback';

const mocks = vi.hoisted(() => ({
  navigate: vi.fn(),
  user: null as null | { id: string },
  loading: true,
  params: new URLSearchParams(),
}));

vi.mock('@/contexts/authHelpers', () => ({
  useAuth: () => ({ user: mocks.user, loading: mocks.loading }),
}));

vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router-dom')>();
  return {
    ...actual,
    useNavigate: () => mocks.navigate,
    useSearchParams: () => [mocks.params],
  };
});

vi.mock('@/components/SEO', () => ({ default: () => null }));
vi.mock('lucide-react', () => ({
  AlertCircle: () => <span aria-hidden="true" />,
  Loader2: () => <span aria-hidden="true" />,
  ShieldCheck: () => <span aria-hidden="true" />,
}));
vi.mock('@/components/ui/alert', () => ({
  Alert: ({ children, ...props }: React.PropsWithChildren<Record<string, unknown>>) => (
    <div {...props}>{children}</div>
  ),
  AlertDescription: ({ children }: React.PropsWithChildren) => <div>{children}</div>,
}));
vi.mock('@/components/ui/button', () => ({
  Button: ({ children }: React.PropsWithChildren) => <div>{children}</div>,
}));
vi.mock('@/components/ui/card', () => ({
  Card: ({ children }: React.PropsWithChildren) => <div>{children}</div>,
  CardContent: ({ children }: React.PropsWithChildren) => <div>{children}</div>,
}));

const renderCallback = () =>
  render(
    <MemoryRouter initialEntries={['/auth/callback']}>
      <AuthCallback />
    </MemoryRouter>,
  );

describe('AuthCallback', () => {
  beforeEach(() => {
    mocks.navigate.mockReset();
    mocks.user = null;
    mocks.loading = true;
    mocks.params = new URLSearchParams();
  });

  afterEach(() => cleanup());

  it('shows a progress message while the session is being restored', () => {
    renderCallback();

    expect(screen.getByRole('heading', { name: 'Completing your sign-in' })).toBeTruthy();
    expect(screen.getByText(/verifying your session/i)).toBeTruthy();
    expect(mocks.navigate).not.toHaveBeenCalled();
  });

  it('redirects an authenticated user to the safe requested path', () => {
    mocks.loading = false;
    mocks.user = { id: 'reader-1' };
    mocks.params = new URLSearchParams('next=%2Flibrary');

    renderCallback();

    expect(mocks.navigate).toHaveBeenCalledWith('/library', { replace: true });
    expect(screen.getByText(/redirecting you to Sahadhyayi/i)).toBeTruthy();
  });

  it('uses the dashboard when the requested redirect is an external URL', () => {
    mocks.loading = false;
    mocks.user = { id: 'reader-1' };
    mocks.params = new URLSearchParams('next=https%3A%2F%2Fevil.example');

    renderCallback();

    expect(mocks.navigate).toHaveBeenCalledWith('/dashboard', { replace: true });
  });

  it('shows the provider error and does not redirect when the callback contains an error', () => {
    mocks.loading = false;
    mocks.user = { id: 'reader-1' };
    mocks.params = new URLSearchParams('error=access_denied');

    renderCallback();

    expect(screen.getByRole('heading', { name: 'Sign-in could not be completed' })).toBeTruthy();
    expect(screen.getByRole('alert')).toBeTruthy();
    expect(screen.getByText(/identity provider could not complete authorization/i)).toBeTruthy();
    expect(mocks.navigate).not.toHaveBeenCalled();
  });

  it('shows a recovery message when loading ends without an authenticated session', () => {
    mocks.loading = false;

    renderCallback();

    expect(screen.getByRole('heading', { name: 'Sign-in could not be completed' })).toBeTruthy();
    expect(screen.getByText(/no authenticated session was established/i)).toBeTruthy();
    expect(mocks.navigate).not.toHaveBeenCalled();
  });

  it('prefers error_description when both callback error parameters are present', () => {
    mocks.loading = false;
    mocks.params = new URLSearchParams(
      'error=access_denied&error_description=Provider%20rejected%20the%20request',
    );

    renderCallback();

    expect(screen.getByRole('heading', { name: 'Sign-in could not be completed' })).toBeTruthy();
    expect(mocks.navigate).not.toHaveBeenCalled();
  });
});
