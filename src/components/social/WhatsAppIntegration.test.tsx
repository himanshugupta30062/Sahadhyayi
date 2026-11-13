import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { WhatsAppIntegration } from './WhatsAppIntegration';
import { useAuth } from '@/contexts/authHelpers';
import { supabase } from '@/integrations/supabase/client-universal';
import { toast } from 'sonner';

vi.mock('@/contexts/authHelpers', () => ({
  useAuth: vi.fn(),
}));

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock('@/integrations/supabase/client-universal', () => ({
  supabase: {
    from: vi.fn(),
  },
}));

describe('WhatsAppIntegration', () => {
  const mockUser = { id: 'reader-user-1' };

  beforeEach(() => {
    vi.clearAllMocks();
    (useAuth as any).mockReturnValue({ user: mockUser });

    // Window open mock
    window.open = vi.fn();

    (supabase.from as any).mockImplementation((table: string) => {
      if (table === 'user_profile') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: {
                  phone_number: '',
                  phone_verified: false,
                  hide_phone_number: true,
                  allow_whatsapp_discovery: true,
                  whatsapp_invite_message: 'Join me on Sahadhyayi reading club!',
                },
                error: null,
              }),
            }),
          }),
          upsert: vi.fn().mockResolvedValue({ error: null }),
        };
      }

      if (table === 'whatsapp_contacts') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              order: vi.fn().mockResolvedValue({
                data: [
                  {
                    id: 'c1',
                    contact_name: 'Amit Kumar',
                    contact_phone: '+919999988888',
                    is_on_platform: false,
                    platform_user_id: null,
                  },
                  {
                    id: 'c2',
                    contact_name: 'Priya Singh',
                    contact_phone: '+919999977777',
                    is_on_platform: true,
                    platform_user_id: 'priya-123',
                  },
                ],
                error: null,
              }),
            }),
          }),
          upsert: vi.fn().mockResolvedValue({ error: null }),
        };
      }

      if (table === 'phone_verifications') {
        return {
          insert: vi.fn().mockResolvedValue({ error: null }),
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnThis(),
            gt: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: { id: 'pv-1' },
                error: null,
              }),
            }),
          }),
          update: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({ error: null }),
          }),
        };
      }

      if (table === 'whatsapp_invitations') {
        return {
          upsert: vi.fn().mockResolvedValue({ error: null }),
        };
      }

      return {
        select: vi.fn().mockReturnThis(),
      };
    });
  });

  it('renders phone verification initial state and sends verification code', async () => {
    render(<WhatsAppIntegration />);

    expect(screen.getByText('Phone Verification')).toBeInTheDocument();

    const phoneInput = screen.getByPlaceholderText('+1234567890');
    fireEvent.change(phoneInput, { target: { value: '+919876543210' } });

    const verifyBtn = screen.getByRole('button', { name: /^verify$/i });
    fireEvent.click(verifyBtn);

    await waitFor(() => {
      expect(supabase.from).toHaveBeenCalledWith('phone_verifications');
      expect(toast.success).toHaveBeenCalledWith(
        expect.stringContaining('Verification code sent')
      );
      expect(screen.getByPlaceholderText('123456')).toBeInTheDocument();
    });
  });

  it('verifies phone number with verification code and shows verified badge', async () => {
    render(<WhatsAppIntegration />);

    const phoneInput = screen.getByPlaceholderText('+1234567890');
    fireEvent.change(phoneInput, { target: { value: '+919876543210' } });

    const verifyBtn = screen.getByRole('button', { name: /^verify$/i });
    fireEvent.click(verifyBtn);

    const codeInput = await screen.findByPlaceholderText('123456');
    fireEvent.change(codeInput, { target: { value: '654321' } });

    const confirmBtn = screen.getByRole('button', { name: /^confirm$/i });
    fireEvent.click(confirmBtn);

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith('Phone number verified successfully!');
      expect(screen.getByText('✓ Verified')).toBeInTheDocument();
    });
  });

  it('renders privacy settings, contact list, and invite message when verified', async () => {
    (supabase.from as any).mockImplementation((table: string) => {
      if (table === 'user_profile') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: {
                  phone_number: '+919876543210',
                  phone_verified: true,
                  hide_phone_number: true,
                  allow_whatsapp_discovery: true,
                  whatsapp_invite_message: 'Join me on Sahadhyayi reading club!',
                },
                error: null,
              }),
            }),
          }),
          upsert: vi.fn().mockResolvedValue({ error: null }),
        };
      }

      if (table === 'whatsapp_contacts') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              order: vi.fn().mockResolvedValue({
                data: [
                  {
                    id: 'c1',
                    contact_name: 'Amit Kumar',
                    contact_phone: '+919999988888',
                    is_on_platform: false,
                    platform_user_id: null,
                  },
                  {
                    id: 'c2',
                    contact_name: 'Priya Singh',
                    contact_phone: '+919999977777',
                    is_on_platform: true,
                    platform_user_id: 'priya-123',
                  },
                ],
                error: null,
              }),
            }),
          }),
          upsert: vi.fn().mockResolvedValue({ error: null }),
        };
      }

      if (table === 'whatsapp_invitations') {
        return {
          upsert: vi.fn().mockResolvedValue({ error: null }),
        };
      }

      return { select: vi.fn().mockReturnThis() };
    });

    render(<WhatsAppIntegration />);

    await waitFor(() => {
      expect(screen.getByText('✓ Verified')).toBeInTheDocument();
      expect(screen.getByText('Privacy Settings')).toBeInTheDocument();
      expect(screen.getByText('WhatsApp Contacts')).toBeInTheDocument();
      expect(screen.getByText('Amit Kumar')).toBeInTheDocument();
      expect(screen.getByText('Priya Singh')).toBeInTheDocument();
      expect(screen.getByText('On Sahadhyayi')).toBeInTheDocument();
    });

    const inviteBtn = screen.getByRole('button', { name: /invite/i });
    fireEvent.click(inviteBtn);

    await waitFor(() => {
      expect(supabase.from).toHaveBeenCalledWith('whatsapp_invitations');
      expect(window.open).toHaveBeenCalledWith(
        expect.stringContaining('https://wa.me/919999988888'),
        '_blank'
      );
      expect(toast.success).toHaveBeenCalledWith(
        expect.stringContaining('Invitation sent to Amit Kumar')
      );
    });

    const messageInput = screen.getByDisplayValue('Join me on Sahadhyayi reading club!');
    fireEvent.change(messageInput, { target: { value: 'Join our weekly reading circle on Sahadhyayi!' } });

    const updateMsgBtn = screen.getByRole('button', { name: /update message/i });
    fireEvent.click(updateMsgBtn);

    await waitFor(() => {
      expect(supabase.from).toHaveBeenCalledWith('user_profile');
      expect(toast.success).toHaveBeenCalledWith('Invite message updated');
    });

    const switches = screen.getAllByRole('switch');
    fireEvent.click(switches[0]);

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith('Privacy settings updated');
    });
  });
});
