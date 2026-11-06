import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { useAutoLogout } from '@/hooks/useAutoLogout';

const auth = vi.hoisted(() => ({ user: null as null | { id: string }, signOut: vi.fn() }));
const nav = vi.hoisted(() => ({ navigate: vi.fn(), location: { pathname: '/dashboard', search: '?tab=books', hash: '#top' } }));

vi.mock('@/contexts/authHelpers', () => ({ useAuth: () => ({ ...auth, signOut: auth.signOut }) }));
vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router-dom')>();
  return { ...actual, useNavigate: () => nav.navigate, useLocation: () => nav.location };
});
vi.mock('sonner', () => ({ toast: { error: vi.fn() } }));

const wrapper = ({ children }: { children: React.ReactNode }) => <MemoryRouter>{children}</MemoryRouter>;

describe('useAutoLogout', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    auth.user = null;
    auth.signOut.mockReset().mockResolvedValue(undefined);
    nav.navigate.mockReset();
    nav.location = { pathname: '/dashboard', search: '?tab=books', hash: '#top' };
    localStorage.clear();
    sessionStorage.clear();
  });

  it('clears stale session storage when signed out or outside a protected route', () => {
    localStorage.setItem('lastActivity', '123');
    localStorage.setItem('sessionStart', '123');
    localStorage.setItem('browserSession', 'old');
    sessionStorage.setItem('browserSession', 'old');
    renderHook(() => useAutoLogout(), { wrapper });
    expect(localStorage.getItem('lastActivity')).toBeNull();
    expect(localStorage.getItem('sessionStart')).toBeNull();
    expect(sessionStorage.getItem('browserSession')).toBeNull();
  });

  it('initializes browser and session identifiers for a protected authenticated route', () => {
    auth.user = { id: 'reader' };
    renderHook(() => useAutoLogout(), { wrapper });
    expect(localStorage.getItem('browserSession')).toMatch(/^session_/);
    expect(sessionStorage.getItem('browserSession')).toBe(localStorage.getItem('browserSession'));
    expect(localStorage.getItem('sessionStart')).not.toBeNull();
    expect(localStorage.getItem('lastActivity')).not.toBeNull();
  });

  it('force logout clears session data and redirects with the current location', async () => {
    auth.user = { id: 'reader' };
    const { result } = renderHook(() => useAutoLogout(), { wrapper });
    await act(async () => { await result.current.forceLogout(); });
    expect(auth.signOut).toHaveBeenCalledOnce();
    expect(localStorage.getItem('lastActivity')).toBeNull();
    expect(localStorage.getItem('browserSession')).toBeNull();
    expect(nav.navigate).toHaveBeenCalledWith(
      '/signin?redirect=%2Fdashboard%3Ftab%3Dbooks%23top',
      expect.objectContaining({ replace: true, state: { from: '/dashboard?tab=books#top' } }),
    );
  });

  it('does not sign out on a public route', async () => {
    auth.user = { id: 'reader' };
    nav.location = { pathname: '/library', search: '', hash: '' };
    const { result } = renderHook(() => useAutoLogout(), { wrapper });
    await act(async () => { await result.current.forceLogout(); });
    expect(auth.signOut).not.toHaveBeenCalled();
  });
});
