import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import AuthSection from './AuthSection';

const navigate = vi.fn();
const authState = { user: null as { id: string } | null };
const locationState = { pathname: '/library', search: '?q=poetry', hash: '#results' };

vi.mock('react-router-dom', () => ({
  useNavigate: () => navigate,
  useLocation: () => locationState,
}));

vi.mock('@/contexts/authHelpers', () => ({
  useAuth: () => authState,
}));

vi.mock('./UserDropdownMenu', () => ({ default: () => <div>User menu</div> }));
vi.mock('@/components/notifications/NotificationDropdown', () => ({
  NotificationDropdown: () => <div>Notifications</div>,
}));
vi.mock('@/components/messages/MessageDropdown', () => ({
  MessageDropdown: () => <div>Messages</div>,
}));

describe('AuthSection', () => {
  beforeEach(() => {
    navigate.mockReset();
    authState.user = null;
    sessionStorage.clear();
    Object.assign(locationState, { pathname: '/library', search: '?q=poetry', hash: '#results' });
  });

  it('preserves the current route when signing in', () => {
    Object.defineProperty(window, 'scrollY', { configurable: true, value: 240 });
    render(<AuthSection />);

    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));

    const redirect = '/library?q=poetry#results';
    expect(sessionStorage.getItem('redirectScrollY')).toBe('240');
    expect(navigate).toHaveBeenCalledWith(
      `/signin?redirect=${encodeURIComponent(redirect)}`,
      { state: { from: redirect } },
    );
  });

  it('navigates directly to sign up', () => {
    render(<AuthSection />);

    fireEvent.click(screen.getByRole('button', { name: /sign up/i }));

    expect(navigate).toHaveBeenCalledWith('/signup');
  });

  it('renders authenticated messaging, notifications and user menu', () => {
    authState.user = { id: 'user-1' };
    render(<AuthSection />);

    expect(screen.getByText('Messages')).toBeInTheDocument();
    expect(screen.getByText('Notifications')).toBeInTheDocument();
    expect(screen.getByText('User menu')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /sign in/i })).not.toBeInTheDocument();
  });
});
