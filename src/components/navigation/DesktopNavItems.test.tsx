import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import DesktopNavItems from './DesktopNavItems';

const locationState = { pathname: '/library' };
const navigate = vi.fn();

vi.mock('react-router-dom', () => ({
  Link: ({ to, children, className }: { to: string; children: React.ReactNode; className?: string }) => (
    <a href={to} className={className}>{children}</a>
  ),
  useLocation: () => locationState,
  useNavigate: () => navigate,
}));

vi.mock('@/components/ui/dropdown-menu', () => ({
  DropdownMenu: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DropdownMenuTrigger: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DropdownMenuContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DropdownMenuItem: ({ children, onClick }: { children: React.ReactNode; onClick?: () => void }) => (
    <button type="button" onClick={onClick}>{children}</button>
  ),
}));

describe('DesktopNavItems', () => {
  it('renders primary navigation links and highlights the active route', () => {
    locationState.pathname = '/library';
    render(<DesktopNavItems />);

    expect(screen.getByRole('link', { name: 'Library' })).toHaveAttribute('href', '/library');
    expect(screen.getByRole('link', { name: 'My Shelf' })).toHaveAttribute('href', '/bookshelf');
    expect(screen.getByRole('link', { name: 'Library' }).className).toContain('text-brand-primary');
    expect(screen.getByRole('link', { name: 'My Shelf' }).className).toContain('text-muted-foreground');
  });

  it('highlights More when a secondary route is active and navigates menu items', () => {
    locationState.pathname = '/social';
    render(<DesktopNavItems />);

    expect(screen.getByRole('button', { name: /More/i }).className).toContain('text-brand-primary');
    fireEvent.click(screen.getByRole('button', { name: 'Authors' }));
    expect(navigate).toHaveBeenCalledWith('/authors');
  });

  it('does not highlight More for unrelated routes', () => {
    locationState.pathname = '/about';
    render(<DesktopNavItems />);

    expect(screen.getByRole('button', { name: /More/i }).className).toContain('text-muted-foreground');
  });
});
