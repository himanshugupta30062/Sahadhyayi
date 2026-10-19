/** @vitest-environment jsdom */

import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import '@testing-library/jest-dom/vitest';
import { cleanup, fireEvent, render, screen, act, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Navigation from '@/components/Navigation';
import { EnhancedGlobalSearch } from '@/components/EnhancedGlobalSearch';
import {
  isApplePlatform,
  getSearchShortcutLabel,
  useGlobalSearchShortcut,
} from '@/hooks/useKeyboardShortcuts';

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe('Universal Search & Cmd+K Shortcut Architecture', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();

    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn().mockImplementation((query) => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    });
  });

  afterEach(() => {
    cleanup();
  });

  describe('OS Platform Detection & Shortcut Labeling', () => {
    it('returns ⌘K on macOS platforms and Ctrl+K on others', () => {
      const label = getSearchShortcutLabel();
      expect(['⌘K', 'Ctrl+K']).toContain(label.display);
      expect(['⌘', 'Ctrl']).toContain(label.key);
      expect(label.symbol).toBe('K');
    });

    it('correctly reports platform boolean', () => {
      expect(typeof isApplePlatform()).toBe('boolean');
    });
  });

  describe('useGlobalSearchShortcut Hook Behavior', () => {
    function TestShortcutComponent({ onToggle }: { onToggle: () => void }) {
      useGlobalSearchShortcut(onToggle);
      return (
        <div>
          <input data-testid="test-input" placeholder="Sample input" />
          <textarea data-testid="test-textarea" placeholder="Sample textarea" />
        </div>
      );
    }

    it('triggers onToggle on Meta+K (Mac) even when focused inside an input', () => {
      const onToggle = vi.fn();
      render(<TestShortcutComponent onToggle={onToggle} />);

      const input = screen.getByTestId('test-input');
      input.focus();

      fireEvent.keyDown(input, {
        key: 'k',
        code: 'KeyK',
        metaKey: true,
      });

      expect(onToggle).toHaveBeenCalledTimes(1);
    });

    it('triggers onToggle on Ctrl+K (Windows/Linux) even when focused in a textarea', () => {
      const onToggle = vi.fn();
      render(<TestShortcutComponent onToggle={onToggle} />);

      const textarea = screen.getByTestId('test-textarea');
      textarea.focus();

      fireEvent.keyDown(textarea, {
        key: 'k',
        code: 'KeyK',
        ctrlKey: true,
      });

      expect(onToggle).toHaveBeenCalledTimes(1);
    });

    it('does NOT trigger slash (/) shortcut when typing in an input field', () => {
      const onToggle = vi.fn();
      render(<TestShortcutComponent onToggle={onToggle} />);

      const input = screen.getByTestId('test-input');
      input.focus();

      fireEvent.keyDown(input, {
        key: '/',
        code: 'Slash',
      });

      expect(onToggle).not.toHaveBeenCalled();
    });

    it('triggers slash (/) shortcut when outside any input field', () => {
      const onToggle = vi.fn();
      render(<TestShortcutComponent onToggle={onToggle} />);

      fireEvent.keyDown(window, {
        key: '/',
        code: 'Slash',
      });

      expect(onToggle).toHaveBeenCalledTimes(1);
    });
  });

  describe('Navigation Desktop and Mobile Search Triggers', () => {
    it('renders a clean search trigger without any shortcut or K badge', () => {
      render(
        <MemoryRouter initialEntries={['/']}>
          <Navigation />
        </MemoryRouter>
      );

      const searchBtn = screen.getByRole('button', { name: /^search library, authors, and books$/i });
      expect(searchBtn).toBeInTheDocument();
      expect(searchBtn).toHaveAttribute('type', 'button');

      // Verify no 'K' or 'Cmd+K' or '<kbd>' inside search button
      expect(searchBtn.querySelector('kbd')).toBeNull();
      expect(searchBtn.textContent).not.toMatch(/Cmd\+K|Ctrl\+K|⌘K|\bK\b/);

      // Click to open search
      fireEvent.click(searchBtn);

      // Search dialog should open cleanly without any shortcut badges
      expect(screen.getByPlaceholderText(/search books, authors, or articles/i)).toBeInTheDocument();
    });
  });

  describe('EnhancedGlobalSearch Command Palette & Quick Navigation', () => {
    it('displays Quick Navigation & Actions immediately when opened without query', () => {
      const onClose = vi.fn();
      render(
        <MemoryRouter>
          <EnhancedGlobalSearch isOpen={true} onClose={onClose} />
        </MemoryRouter>
      );

      expect(screen.getByText('Quick Navigation & Actions')).toBeInTheDocument();
      expect(screen.getByText('Browse Library')).toBeInTheDocument();
      expect(screen.getByText('Explore Authors')).toBeInTheDocument();
      expect(screen.getByText('Read Articles')).toBeInTheDocument();
      expect(screen.getByText('My Bookshelf')).toBeInTheDocument();
      expect(screen.getByText('Live Website Stats')).toBeInTheDocument();
      expect(screen.getByText('Ask Book Expert AI')).toBeInTheDocument();
    });

    it('navigates to library when Browse Library quick command is clicked', () => {
      const onClose = vi.fn();
      render(
        <MemoryRouter>
          <EnhancedGlobalSearch isOpen={true} onClose={onClose} />
        </MemoryRouter>
      );

      const libraryCmd = screen.getByText('Browse Library');
      fireEvent.click(libraryCmd);

      expect(mockNavigate).toHaveBeenCalledWith('/library');
      expect(onClose).toHaveBeenCalled();
    });

    it('closes the dialog when Cmd+K or Ctrl+K is pressed while inside the search input', () => {
      const onClose = vi.fn();
      render(
        <MemoryRouter>
          <EnhancedGlobalSearch isOpen={true} onClose={onClose} />
        </MemoryRouter>
      );

      const input = screen.getByPlaceholderText(/search books, authors, or articles/i);

      // Press Meta+K inside input
      fireEvent.keyDown(input, {
        key: 'k',
        code: 'KeyK',
        metaKey: true,
      });

      expect(onClose).toHaveBeenCalled();
    });

    it('dispatches open-community-pulse event when Live Website Stats command is chosen', () => {
      const onClose = vi.fn();
      const pulseListener = vi.fn();
      window.addEventListener('open-community-pulse', pulseListener);

      render(
        <MemoryRouter>
          <EnhancedGlobalSearch isOpen={true} onClose={onClose} />
        </MemoryRouter>
      );

      const statsCmd = screen.getByText('Live Website Stats');
      fireEvent.click(statsCmd);

      expect(pulseListener).toHaveBeenCalled();
      expect(onClose).toHaveBeenCalled();

      window.removeEventListener('open-community-pulse', pulseListener);
    });

    it('matches quick commands by query terms like "theme" or "dark mode"', async () => {
      const onClose = vi.fn();
      render(
        <MemoryRouter>
          <EnhancedGlobalSearch isOpen={true} onClose={onClose} />
        </MemoryRouter>
      );

      const input = screen.getByPlaceholderText(/search books, authors, or articles/i);

      await act(async () => {
        fireEvent.change(input, { target: { value: 'theme' } });
        await new Promise((r) => setTimeout(r, 350));
      });

      await waitFor(() => {
        expect(screen.getByText(/switch to/i)).toBeInTheDocument();
      });
    });
  });
});
