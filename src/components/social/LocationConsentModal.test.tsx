import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { LocationConsentModal } from './LocationConsentModal';
import { supabase } from '@/integrations/supabase/client-universal';

const mockToast = vi.fn();
vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({ toast: mockToast }),
}));

vi.mock('@/integrations/supabase/client-universal', () => ({
  supabase: {
    rpc: vi.fn(),
  },
}));

describe('LocationConsentModal', () => {
  it('records consent via record_location_consent RPC and notifies callback', async () => {
    vi.mocked(supabase.rpc).mockResolvedValueOnce({ data: true, error: null } as any);
    const onClose = vi.fn();
    const onConsentGiven = vi.fn();

    render(
      <LocationConsentModal
        isOpen={true}
        onClose={onClose}
        onConsentGiven={onConsentGiven}
      />
    );

    expect(screen.getByText(/Location Sharing Consent/i)).toBeInTheDocument();

    const giveConsentBtn = screen.getByRole('button', { name: /continue/i });
    fireEvent.click(giveConsentBtn);

    await waitFor(() => {
      expect(supabase.rpc).toHaveBeenCalledWith(
        'record_location_consent',
        expect.objectContaining({ user_agent_string: expect.any(String) })
      );
      expect(onConsentGiven).toHaveBeenCalled();
      expect(onClose).toHaveBeenCalled();
      expect(mockToast).toHaveBeenCalledWith(
        expect.objectContaining({ title: 'Consent Recorded' })
      );
    });
  });
});
