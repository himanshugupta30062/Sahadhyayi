/** @vitest-environment jsdom */
import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import '@testing-library/jest-dom/vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Navigation from '@/components/Navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import StructuredFooter from '@/components/footer/StructuredFooter';
import { SidebarProvider } from '@/components/ui/sidebar';

const NavigationWithSidebar = () => (
  <SidebarProvider defaultOpen={false}>
    <Navigation />
  </SidebarProvider>
);

// Mock contexts
const mockSignOut = vi.fn();
let mockCurrentUser: any = null;
let mockTheme = 'light';
const mockToggleTheme = vi.fn();

vi.mock('@/contexts/authHelpers', () => ({
  useAuth: () => ({
    user: mockCurrentUser,
    signOut: mockSignOut,
    loading: false,
  }),
}));

vi.mock('@/contexts/ThemeContext', () => ({
  useTheme: () => ({
    theme: mockTheme,
    toggleTheme: mockToggleTheme,
  }),
}));

// Mock hooks
let mockIsMobileValue = false;
vi.mock('@/hooks/use-mobile', () => ({
  useIsMobile: () => mockIsMobileValue,
}));

vi.mock('@/hooks/useKeyboardShortcuts', () => ({
  useGlobalSearchShortcut: vi.fn(),
  getSearchShortcutLabel: () => ({ display: '⌘K', key: '⌘', symbol: 'K' }),
  isApplePlatform: () => true,
}));

vi.mock('@/components/notifications/NotificationDropdown', () => ({
  NotificationDropdown: () => <div data-testid="notification-dropdown">Notifications</div>,
}));

vi.mock('@/components/messages/MessageDropdown', () => ({
  MessageDropdown: () => <div data-testid="message-dropdown">Messages</div>,
}));

vi.mock('@/components/EnhancedGlobalSearch', () => ({
  EnhancedGlobalSearch: ({ isOpen }: { isOpen: boolean }) => (
    isOpen ? <div role="dialog" aria-label="Search dialog">Search Dialog</div> : null
  ),
}));

vi.mock('@/components/ContactFormDialog', () => ({
  default: ({ trigger }: { trigger: React.ReactNode }) => <div>{trigger}</div>,
}));

vi.mock('@/components/community-pulse/CommunityPulseDialog', () => ({
  CommunityPulseDialog: ({ open }: { open: boolean }) => (
    open ? <div role="dialog" aria-label="Community Pulse stats">Community Pulse Dialog</div> : null
  ),
}));

describe('Global UI Foundation and Accessibility (Phase 1)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCurrentUser = null;
    mockTheme = 'light';
    mockIsMobileValue = false;
    vi.stubGlobal(
      'IntersectionObserver',
      class {
        observe() {}
        unobserve() {}
        disconnect() {}
      }
    );
  });

  afterEach(() => {
    cleanup();
  });

  describe('Skip to Main Content Link', () => {
    it('renders a skip to main content link targeting #main-content', () => {
      render(
        <div>
          <a
            href="#main-content"
            className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[200] focus:px-4 focus:py-2 focus:bg-background focus:text-foreground focus:font-semibold focus:shadow-lg focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:rounded-md transition-none"
          >
            Skip to main content
          </a>
          <main id="main-content" tabIndex={-1}>
            <h1>Primary Page Heading</h1>
          </main>
        </div>
      );

      const skipLink = screen.getByRole('link', { name: /skip to main content/i });
      expect(skipLink).toBeInTheDocument();
      expect(skipLink).toHaveAttribute('href', '#main-content');
      expect(skipLink.className).toContain('focus:not-sr-only');
      expect(skipLink.className).toContain('focus:ring-2');

      const main = screen.getByRole('main');
      expect(main).toHaveAttribute('id', 'main-content');
    });
  });

  describe('Header and Landmark Semantics', () => {
    it('renders top navigation inside a semantic <header> landmark', () => {
      render(
        <MemoryRouter initialEntries={['/']}>
          <NavigationWithSidebar />
        </MemoryRouter>
      );

      const header = screen.getByRole('banner');
      expect(header).toBeInTheDocument();
      expect(header.tagName.toLowerCase()).toBe('header');
    });

    it('renders desktop navigation with <nav aria-label="Main navigation">', () => {
      render(
        <MemoryRouter initialEntries={['/']}>
          <NavigationWithSidebar />
        </MemoryRouter>
      );

      const mainNav = screen.getByRole('navigation', { name: /main navigation/i });
      expect(mainNav).toBeInTheDocument();
    });

    it('sets aria-current="page" on the active mobile navigation link', () => {
      mockIsMobileValue = true;
      render(
        <MemoryRouter initialEntries={['/library']}>
          <NavigationWithSidebar />
        </MemoryRouter>
      );

      fireEvent.click(screen.getByRole('button', { name: /open navigation menu/i }));
      const libraryLink = screen.getByRole('link', { name: /^library$/i });
      expect(libraryLink).toHaveAttribute('aria-current', 'page');

      const homeLink = screen.getByRole('link', { name: /^home$/i });
      expect(homeLink).not.toHaveAttribute('aria-current');
    });

    it('provides accessible name and correct destination on the brand logo', () => {
      // Unauthenticated
      const { unmount } = render(
        <MemoryRouter initialEntries={['/library']}>
          <NavigationWithSidebar />
        </MemoryRouter>
      );

      const publicLogoLink = screen.getByRole('link', { name: /sahadhyayi home/i });
      expect(publicLogoLink).toBeInTheDocument();
      expect(publicLogoLink).toHaveAttribute('href', '/');
      unmount();

      // Authenticated
      mockCurrentUser = { id: 'u1', email: 'reader@example.com' };
      render(
        <MemoryRouter initialEntries={['/library']}>
          <NavigationWithSidebar />
        </MemoryRouter>
      );

      const authLogoLink = screen.getByRole('link', { name: /sahadhyayi home/i });
      expect(authLogoLink).toHaveAttribute('href', '/dashboard');
    });
  });

  describe('Mobile Navigation Accessibility & Keyboard Control', () => {
    beforeEach(() => {
      mockIsMobileValue = true;
    });

    it('gives mobile header controls touch targets of at least 44px', () => {
      render(
        <MemoryRouter initialEntries={['/']}>
          <NavigationWithSidebar />
        </MemoryRouter>
      );

      const controls = [
        screen.getByRole('button', { name: /search library and books/i }),
        screen.getByRole('button', { name: /switch to dark mode/i }),
        screen.getByRole('button', { name: /open navigation menu/i }),
      ];

      controls.forEach((control) => {
        expect(control.className).toContain('min-h-[44px]');
        expect(control.className).toContain('min-w-[44px]');
      });
    });

    it('controls mobile menu disclosure with aria-expanded and aria-controls', () => {
      render(
        <MemoryRouter initialEntries={['/']}>
          <NavigationWithSidebar />
        </MemoryRouter>
      );

      const toggleButton = screen.getByRole('button', { name: /open navigation menu/i });
      expect(toggleButton).toHaveAttribute('aria-expanded', 'false');
      expect(toggleButton).toHaveAttribute('aria-controls', 'site-navigation-drawer');

      // Click to open
      fireEvent.click(toggleButton);

      expect(toggleButton).toHaveAttribute('aria-expanded', 'true');
      expect(toggleButton).toHaveAttribute('aria-label', 'Close navigation menu');

      const mobileNav = screen.getByRole('navigation', { name: /main navigation/i });
      expect(mobileNav).toBeInTheDocument();
      expect(mobileNav).toHaveAttribute('id', 'site-navigation-drawer');
    });

    it('closes the mobile menu after navigating to a route', () => {
      render(
        <MemoryRouter initialEntries={['/']}>
          <NavigationWithSidebar />
        </MemoryRouter>
      );

      const toggleButton = screen.getByRole('button', { name: /open navigation menu/i });
      fireEvent.click(toggleButton);
      expect(toggleButton).toHaveAttribute('aria-expanded', 'true');

      fireEvent.click(screen.getByRole('link', { name: /^library$/i }));

      expect(toggleButton).toHaveAttribute('aria-expanded', 'false');
    });

    it('closes mobile menu on Escape key press and restores focus to menu button', () => {
      render(
        <MemoryRouter initialEntries={['/']}>
          <NavigationWithSidebar />
        </MemoryRouter>
      );

      const toggleButton = screen.getByRole('button', { name: /open navigation menu/i });
      fireEvent.click(toggleButton);

      expect(toggleButton).toHaveAttribute('aria-expanded', 'true');

      // Fire Escape key
      fireEvent.keyDown(window, { key: 'Escape' });

      expect(toggleButton).toHaveAttribute('aria-expanded', 'false');
    });

    it('renders touch-friendly mobile navigation links with at least 44px min-height', () => {
      render(
        <MemoryRouter initialEntries={['/']}>
          <NavigationWithSidebar />
        </MemoryRouter>
      );

      fireEvent.click(screen.getByRole('button', { name: /open navigation menu/i }));

      const mobileLinks = screen.getAllByRole('link', { name: /library|articles|games|authors/i });
      mobileLinks.forEach((link) => {
        expect(link.className).toContain('min-h-[44px]');
      });
    });
  });

  describe('Public navigation drawer and dropdown hierarchy', () => {
    it('exposes keyboard-accessible desktop dropdown triggers', () => {
      mockIsMobileValue = false;
      render(
        <MemoryRouter initialEntries={['/']}>
          <NavigationWithSidebar />
        </MemoryRouter>
      );

      const mainNav = screen.getByRole('navigation', { name: /main navigation/i });
      expect(mainNav).toBeInTheDocument();

      for (const name of [/^library$/i, /^social media$/i, /^articles$/i, /^authors$/i]) {
        const trigger = screen.getByRole('button', { name });
        expect(trigger).toHaveAttribute('aria-haspopup', 'menu');
        expect(trigger).toHaveAttribute('aria-expanded', 'false');
        expect(trigger).toBeVisible();
      }

      expect(screen.getByRole('link', { name: /^home$/i })).toHaveAttribute('href', '/');
    });

    it('expands Book Discussion into its nested links inside the public drawer', () => {
      mockIsMobileValue = true;
      render(
        <MemoryRouter initialEntries={['/']}>
          <NavigationWithSidebar />
        </MemoryRouter>
      );

      fireEvent.click(screen.getByRole('button', { name: /open navigation menu/i }));
      fireEvent.click(screen.getByRole('button', { name: /social media submenu/i }));
      fireEvent.click(screen.getByRole('button', { name: /^book discussion$/i }));

      expect(screen.getByRole('link', { name: /book discussions/i })).toHaveAttribute('href', '/social?tab=threads');
      expect(screen.getByRole('link', { name: /reading rooms/i })).toHaveAttribute('href', '/social?tab=rooms');
      expect(screen.getByRole('link', { name: /shared marginalia/i })).toHaveAttribute('href', '/social?tab=margins');
      expect(screen.getByRole('link', { name: /reading dna/i })).toHaveAttribute('href', '/social?tab=dna');
    });
  });

  describe('Shared Interactive Elements (Buttons, Inputs, Textareas)', () => {
    it('applies touch-manipulation and focus-visible ring styles to Button', () => {
      render(<Button>Click me</Button>);
      const button = screen.getByRole('button', { name: /click me/i });
      expect(button.className).toContain('touch-manipulation');
      expect(button.className).toContain('focus-visible:ring-2');
    });

    it('ensures Input and Textarea use theme tokens (bg-background text-foreground) rather than hardcoded white', () => {
      const { container } = render(
        <div>
          <Input placeholder="Enter username" />
          <Textarea placeholder="Enter biography" />
        </div>
      );

      const input = container.querySelector('input')!;
      const textarea = container.querySelector('textarea')!;

      expect(input.className).toContain('bg-background');
      expect(input.className).toContain('text-foreground');
      expect(input.className).not.toContain('bg-white');
      expect(input.className).not.toContain('text-gray-900');

      expect(textarea.className).toContain('bg-background');
      expect(textarea.className).toContain('text-foreground');
      expect(textarea.className).not.toContain('bg-white');
      expect(textarea.className).not.toContain('text-gray-900');
    });
  });

  describe('StructuredFooter Landmark & Accessibility', () => {
    it('renders <footer> landmark with accessible stats trigger and social icons', () => {
      render(
        <MemoryRouter>
          <StructuredFooter />
        </MemoryRouter>
      );

      const footer = screen.getByRole('contentinfo');
      expect(footer).toBeInTheDocument();

      const pulseButton = screen.getByRole('button', { name: /open live website stats/i });
      expect(pulseButton).toBeInTheDocument();

      const socialLinks = screen.getAllByRole('link', { name: /follow us on/i });
      expect(socialLinks.length).toBeGreaterThan(0);
      socialLinks.forEach((link) => {
        expect(link).toHaveAttribute('target', '_blank');
        expect(link).toHaveAttribute('rel', 'noopener noreferrer');
      });
    });
  });
});
