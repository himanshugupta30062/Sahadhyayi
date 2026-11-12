import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import MobileNavMenu from './MobileNavMenu';

const navigate = vi.fn();
const onClose = vi.fn();
const auth = { user: null as any, signOut: vi.fn() };
const location = { pathname: '/library' };

vi.mock('react-router-dom', () => ({
  Link: ({ to, children, onClick, className }: any) => <a href={to} onClick={onClick} className={className}>{children}</a>,
  useNavigate: () => navigate,
  useLocation: () => location,
}));
vi.mock('@/contexts/authHelpers', () => ({ useAuth: () => auth }));
vi.mock('@/components/SignInLink', () => ({ default: ({ children, onClick, className }: any) => <a href="/signin" onClick={onClick} className={className}>{children}</a> }));
vi.mock('@/components/ui/sheet', () => ({
  Sheet: ({ children, open }: any) => open ? <div>{children}</div> : null,
  SheetContent: ({ children }: any) => <div>{children}</div>,
  SheetHeader: ({ children }: any) => <header>{children}</header>,
  SheetTitle: ({ children }: any) => <h2>{children}</h2>,
  SheetDescription: ({ children }: any) => <p>{children}</p>,
}));
vi.mock('@/components/ui/avatar', () => ({
  Avatar: ({ children }: any) => <div>{children}</div>,
  AvatarImage: () => null,
  AvatarFallback: ({ children }: any) => <span>{children}</span>,
}));
vi.mock('@/components/ui/button', () => ({ Button: ({ children, onClick }: any) => <button onClick={onClick}>{children}</button> }));

describe('MobileNavMenu', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    auth.user = null;
    location.pathname = '/library';
  });

  it('renders public navigation and closes after a route selection', () => {
    render(<MobileNavMenu isOpen onClose={onClose} />);
    expect(screen.getByRole('heading', { name: 'Menu' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Sign In' })).toHaveAttribute('href', '/signin');
    expect(screen.getByRole('link', { name: 'Sign Up' })).toHaveAttribute('href', '/signup');
    expect(screen.getByRole('link', { name: 'Library' }).className).toContain('text-brand-primary');
    fireEvent.click(screen.getByRole('link', { name: 'Authors' }));
    expect(onClose).toHaveBeenCalled();
  });

  it('renders profile and account details for authenticated users', () => {
    auth.user = { email: 'reader@example.com', user_metadata: { full_name: 'Reader Name' } };
    render(<MobileNavMenu isOpen onClose={onClose} />);
    expect(screen.getByText('Reader Name')).toBeInTheDocument();
    expect(screen.getByText('reader@example.com')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Profile' })).toHaveAttribute('href', '/profile');
    expect(screen.getByRole('link', { name: 'Home' })).toHaveAttribute('href', '/dashboard');
  });

  it('signs out and redirects even if signOut rejects', async () => {
    auth.user = { email: 'reader@example.com', user_metadata: {} };
    auth.signOut.mockRejectedValueOnce(new Error('network'));
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    render(<MobileNavMenu isOpen onClose={onClose} />);
    fireEvent.click(screen.getByRole('button', { name: /Sign Out/i }));
    await waitFor(() => expect(navigate).toHaveBeenCalledWith('/signin'));
    expect(auth.signOut).toHaveBeenCalled();
    expect(onClose).toHaveBeenCalled();
    warn.mockRestore();
  });
});
