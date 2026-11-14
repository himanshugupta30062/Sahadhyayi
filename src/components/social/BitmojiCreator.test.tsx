import React from 'react';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { BitmojiCreator } from './BitmojiCreator';

const avatarMocks = vi.hoisted(() => ({
  mutateAsync: vi.fn(),
  success: vi.fn(),
  error: vi.fn(),
}));

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
    mutateAsync: avatarMocks.mutateAsync,
    isPending: false,
  }),
}));

vi.mock('sonner', () => ({
  toast: { success: avatarMocks.success, error: avatarMocks.error },
}));

describe('BitmojiCreator', () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it('loads saved avatar settings when the editor opens', () => {
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

    expect(screen.getByRole('button', { name: 'curly' })).toHaveAttribute('data-variant', 'default');
    expect(screen.getByRole('button', { name: /book lover/i })).toHaveAttribute('data-variant', 'default');
    const preview = container.querySelector('[class*="w-32 h-32"]');
    expect(preview?.innerHTML).toContain('circle cx="45" cy="35"');
    expect(preview?.innerHTML).toContain('fill="#000000"');
  });

  it('resets a saved avatar back to the standard defaults', () => {
    render(
      <BitmojiCreator
        isOpen
        onClose={vi.fn()}
        onSave={vi.fn()}
        initialFeatures={{ hairStyle: 'curly', outfit: 'book-lover' }}
      />,
    );

    expect(screen.getByRole('button', { name: 'curly' })).toHaveAttribute('data-variant', 'default');
    fireEvent.click(screen.getByRole('button', { name: 'Reset' }));
    expect(screen.getByRole('button', { name: 'short' })).toHaveAttribute('data-variant', 'default');
    expect(screen.getByRole('button', { name: 'curly' })).toHaveAttribute('data-variant', 'outline');
  });

  it('ignores invalid saved feature values instead of inserting them into the SVG', () => {
    const { container } = render(
      <BitmojiCreator
        isOpen
        onClose={vi.fn()}
        onSave={vi.fn()}
        initialFeatures={{ hairStyle: 'url(javascript:alert(1))', skinTone: 'red; background:url(x)' }}
      />,
    );

    expect(screen.getByRole('button', { name: 'short' })).toHaveAttribute('data-variant', 'default');
    const preview = container.querySelector('[class*="w-32 h-32"]');
    expect(preview?.innerHTML).not.toContain('javascript:');
    expect(preview?.innerHTML).not.toContain('background:url');
  });
});
