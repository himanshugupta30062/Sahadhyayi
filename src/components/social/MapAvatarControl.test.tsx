import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { MapAvatarControl } from './MapAvatarControl';

const avatarMocks = vi.hoisted(() => ({
  data: null as null | { avatar_img_url?: string; avatar_json?: Record<string, unknown> },
}));

vi.mock('@/hooks/useUserAvatar', () => ({
  useUserAvatar: () => ({ data: avatarMocks.data, isLoading: false }),
}));

vi.mock('@/components/social/BitmojiCreator', () => ({
  BitmojiCreator: ({ isOpen, initialFeatures, onClose }: {
    isOpen: boolean;
    initialFeatures?: Record<string, unknown> | null;
    onClose: () => void;
  }) => isOpen ? (
    <div role="dialog" aria-label="Bitmoji editor">
      <span data-testid="initial-features">{JSON.stringify(initialFeatures ?? null)}</span>
      <button type="button" onClick={onClose}>Close editor</button>
    </div>
  ) : null,
}));

describe('MapAvatarControl', () => {
  afterEach(() => {
    cleanup();
    avatarMocks.data = null;
  });

  it('offers a create action when the reader has not saved a Bitmoji', () => {
    render(<MapAvatarControl />);

    expect(screen.getByText('Create your map Bitmoji')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Create' }));
    expect(screen.getByRole('dialog', { name: 'Bitmoji editor' })).toBeInTheDocument();
    expect(screen.getByTestId('initial-features')).toHaveTextContent('null');
  });

  it('shows the saved Bitmoji and reopens the editor with saved customizations', () => {
    avatarMocks.data = {
      avatar_img_url: 'data:image/svg+xml;base64,PHN2Zy8+',
      avatar_json: { hairStyle: 'curly', outfit: 'book-lover' },
    };

    render(<MapAvatarControl />);

    expect(screen.getByRole('img', { name: 'Your reading Bitmoji' })).toHaveAttribute(
      'src',
      'data:image/svg+xml;base64,PHN2Zy8+',
    );
    fireEvent.click(screen.getByRole('button', { name: 'Edit' }));
    expect(screen.getByTestId('initial-features')).toHaveTextContent('"hairStyle":"curly"');
    expect(screen.getByTestId('initial-features')).toHaveTextContent('"outfit":"book-lover"');
  });
});
