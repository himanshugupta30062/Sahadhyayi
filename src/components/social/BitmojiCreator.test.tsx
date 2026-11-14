import React from 'react';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { BitmojiCreator } from './BitmojiCreator';

const mocks = vi.hoisted(() => {
  const LucideIcon = ({ children, ...props }: any) => <span data-testid="lucide-icon" {...props}>{children}</span>;
  return {
    avatar: {
      mutateAsync: vi.fn(),
      success: vi.fn(),
      error: vi.fn(),
    },
    lucide: {
      Palette: LucideIcon,
      Save: LucideIcon,
      RotateCcw: LucideIcon,
      Shirt: LucideIcon,
      Glasses: LucideIcon,
      HardHat: LucideIcon,
      Headphones: LucideIcon,
      BookOpen: LucideIcon,
      Bookmark: LucideIcon,
    },
  };
});

vi.mock('lucide-react', () => mocks.lucide);

vi.mock('@/components/ui/card', () => ({
  Card: ({ children }: any) => <div>{children}</div>,
  CardContent: ({ children }: any) => <div>{children}</div>,
  CardHeader: ({ children }: any) => <div>{children}</div>,
  CardTitle: ({ children }: any) => <h2>{children}</h2>,
}));

vi.mock('@/components/ui/button', () => ({
  Button: ({ children, variant, ...props }: any) => (
    <button data-variant={variant} {...props}>{children}</button>
  ),
}));

vi.mock('@/components/ui/dialog', () => ({
  Dialog: ({ open, children }: any) => open ? <div>{children}</div> : null,
  DialogContent: ({ children }: any) => <div>{children}</div>,
  DialogHeader: ({ children }: any) => <div>{children}</div>,
  DialogTitle: ({ children }: any) => <h2>{children}</h2>,
}));

vi.mock('@/hooks/useUserAvatar', () => ({
  useUpdateUserAvatar: () => ({
    mutateAsync: mocks.avatar.mutateAsync,
    isPending: false,
  }),
}));

vi.mock('sonner', () => ({
  toast: { success: mocks.avatar.success, error: mocks.avatar.error },
}));

describe('BitmojiCreator', () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it('loads saved avatar settings when the editor opens', async () => {
    const { container } = render(
      <BitmojiCreator
        isOpen
        onClose={vi.fn()}
        onSave={vi.fn()}
        initialFeatures={{
          hairStyle: 'curly',
          hairColor: '#000000',
          eyeShape: 'round',
          outfit: 'book-lover',
        }}
      />,
    );

    // Initially on Appearance tab - should show nose/mouth/skin
    expect(screen.getByRole('button', { name: 'normal' })).toHaveAttribute('data-variant', 'default');

    // Switch to Hair & Eyes tab - use the visible one (not hidden on mobile)
    const hairTabs = screen.getAllByRole('tab', { name: 'Hair & Eyes' });
    fireEvent.click(hairTabs[hairTabs.length - 1]); // Last one is the visible one
    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'curly' })).toHaveAttribute('data-variant', 'default');
    });
    expect(screen.getByRole('button', { name: 'round' })).toHaveAttribute('data-variant', 'default');

    // Switch to Reading tab for outfit
    const readingTabs = screen.getAllByRole('tab', { name: 'Reading' });
    fireEvent.click(readingTabs[readingTabs.length - 1]);
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /book lover/i })).toHaveAttribute('data-variant', 'default');
    });

    const preview = container.querySelector('[class*="rounded-2xl"]');
    expect(preview?.innerHTML).toContain('circle cx="65" cy="55"');
    expect(preview?.innerHTML).toContain('fill="#000000"');
  });

  it('resets a saved avatar back to the standard defaults', async () => {
    render(
      <BitmojiCreator
        isOpen
        onClose={vi.fn()}
        onSave={vi.fn()}
        initialFeatures={{ hairStyle: 'curly', outfit: 'book-lover' }}
      />,
    );

    // Switch to Hair & Eyes tab to verify curly is selected
    const hairTabs = screen.getAllByRole('tab', { name: 'Hair & Eyes' });
    fireEvent.click(hairTabs[hairTabs.length - 1]);
    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'curly' })).toHaveAttribute('data-variant', 'default');
    });

    // Click reset - this switches back to Appearance tab
    fireEvent.click(screen.getByRole('button', { name: 'Reset to Default' }));

    // Switch back to Hair & Eyes tab to verify reset
    const hairTabs2 = screen.getAllByRole('tab', { name: 'Hair & Eyes' });
    fireEvent.click(hairTabs2[hairTabs2.length - 1]);
    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'short' })).toHaveAttribute('data-variant', 'default');
      expect(screen.getByRole('button', { name: 'curly' })).toHaveAttribute('data-variant', 'outline');
    });

    // Check outfit reset on Reading tab
    const readingTabs = screen.getAllByRole('tab', { name: 'Reading' });
    fireEvent.click(readingTabs[readingTabs.length - 1]);
    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'casual' })).toHaveAttribute('data-variant', 'default');
      expect(screen.getByRole('button', { name: /book lover/i })).toHaveAttribute('data-variant', 'outline');
    });
  });

  it('ignores invalid saved feature values instead of inserting them into the SVG', async () => {
    const { container } = render(
      <BitmojiCreator
        isOpen
        onClose={vi.fn()}
        onSave={vi.fn()}
        initialFeatures={{ hairStyle: 'url(javascript:alert(1))', skinTone: 'red; background:url(x)' }}
      />,
    );

    // Should fall back to default 'short' hair style
    const hairTabs = screen.getAllByRole('tab', { name: 'Hair & Eyes' });
    fireEvent.click(hairTabs[hairTabs.length - 1]);
    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'short' })).toHaveAttribute('data-variant', 'default');
    });

    const preview = container.querySelector('[class*="rounded-2xl"]');
    expect(preview?.innerHTML).not.toContain('javascript:');
    expect(preview?.innerHTML).not.toContain('background:url');
  });

  it('allows selecting accessories and reading accessories', async () => {
    const { container } = render(
      <BitmojiCreator
        isOpen
        onClose={vi.fn()}
        onSave={vi.fn()}
      />,
    );

    // Select glasses from Accessories tab
    const accessoryTabs = screen.getAllByRole('tab', { name: 'Accessories' });
    fireEvent.click(accessoryTabs[accessoryTabs.length - 1]);
    fireEvent.click(screen.getByRole('button', { name: 'glasses' }));
    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'glasses' })).toHaveAttribute('data-variant', 'default');
    });

    // Select book from Reading tab
    const readingTabs = screen.getAllByRole('tab', { name: 'Reading' });
    fireEvent.click(readingTabs[readingTabs.length - 1]);
    fireEvent.click(screen.getByRole('button', { name: 'book' }));
    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'book' })).toHaveAttribute('data-variant', 'default');
    });

    // Preview should contain accessory and reading accessory SVG elements
    const preview = container.querySelector('[class*="rounded-2xl"]');
    // Glasses are rendered as rect elements with specific dimensions
    expect(preview?.innerHTML).toContain('x="70" y="90" width="28" height="22"');
    // Book is rendered as a group with transform translate(145, 100)
    expect(preview?.innerHTML).toContain('translate(145, 100)');
  });

  it('has larger preview size than before', () => {
    const { container } = render(
      <BitmojiCreator
        isOpen
        onClose={vi.fn()}
        onSave={vi.fn()}
      />,
    );

    const preview = container.querySelector('[class*="rounded-2xl"]');
    // Check for the larger preview dimensions (w-40 h-48 md:w-48 md:h-56)
    expect(preview).toHaveClass('w-40');
    expect(preview).toHaveClass('h-48');
  });
});