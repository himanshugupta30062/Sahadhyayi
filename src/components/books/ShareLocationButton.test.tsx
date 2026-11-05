// @vitest-environment jsdom
import React from 'react';
import '@testing-library/jest-dom/vitest';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { ShareLocationButton } from './ShareLocationButton';
import { supabase } from '@/integrations/supabase/client-universal';
import { useAuth } from '@/contexts/authHelpers';
import * as locationHook from '@/hooks/useLocationSharing';

vi.mock('@/contexts/authHelpers', () => ({
  useAuth: vi.fn(),
}));

describe('ShareLocationButton', () => {
  const mockShare = vi.fn();
  const mockRemove = vi.fn();

  beforeEach(() => {
    vi.restoreAllMocks();
    vi.spyOn(locationHook, 'useLocationSharing').mockReturnValue({
      shareLocationForBook: mockShare,
      removeLocationForBook: mockRemove,
      isSharing: false,
    } as any);
  });

  afterEach(() => {
    cleanup();
  });

  it('renders nothing when user is not logged in', () => {
    vi.mocked(useAuth).mockReturnValue({ user: null } as any);

    const { container } = render(<ShareLocationButton bookId="book-123" />);
    expect(container.firstChild).toBeNull();
  });

  it('checks location sharing status and allows toggling on and off', async () => {
    vi.mocked(useAuth).mockReturnValue({ user: { id: 'user-123' } } as any);
    vi.spyOn(supabase, 'rpc').mockResolvedValue({ data: false, error: null } as any);
    mockShare.mockResolvedValue(true);
    mockRemove.mockResolvedValue(true);

    render(<ShareLocationButton bookId="book-123" />);

    // Initially checks status, then shows Share Location
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Share Location/i })).toBeInTheDocument();
    });

    // Click to share
    fireEvent.click(screen.getByRole('button', { name: /Share Location/i }));

    await waitFor(() => {
      expect(mockShare).toHaveBeenCalledWith('book-123');
      expect(screen.getByRole('button', { name: /Stop Sharing/i })).toBeInTheDocument();
    });

    // Click to remove
    fireEvent.click(screen.getByRole('button', { name: /Stop Sharing/i }));

    await waitFor(() => {
      expect(mockRemove).toHaveBeenCalledWith('book-123');
      expect(screen.getByRole('button', { name: /Share Location/i })).toBeInTheDocument();
    });
  });
});

