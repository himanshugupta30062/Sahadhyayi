// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, renderHook, waitFor } from '@testing-library/react';

const mocks = vi.hoisted(() => ({
  user: null as null | { id: string },
  responses: {} as Record<string, Array<{ data?: any; error?: any }>>,
  from: vi.fn(),
}));

vi.mock('@/contexts/authHelpers', () => ({ useAuth: () => ({ user: mocks.user }) }));
vi.mock('@/integrations/supabase/client-universal', () => ({
  supabase: { from: (...args: unknown[]) => mocks.from(...args) },
}));

import { useWhatsAppContacts } from './useWhatsAppContacts';

const queue = (table: string, ...responses: Array<{ data?: any; error?: any }>) => {
  mocks.responses[table] = responses;
};

const contact = (overrides: Record<string, any> = {}) => ({
  id: 'contact-1',
  contact_phone: '+91 98765 43210',
  contact_name: 'A Reader',
  is_on_platform: false,
  platform_user_id: null,
  last_synced_at: '2026-11-01T00:00:00Z',
  ...overrides,
});

describe('useWhatsAppContacts', () => {
  beforeEach(() => {
    mocks.user = { id: 'reader-1' };
    mocks.responses = {};
    mocks.from.mockReset().mockImplementation((table: string) => {
      const response = mocks.responses[table]?.shift() ?? { data: [], error: null };
      const builder: any = {
        select: vi.fn(() => builder),
        eq: vi.fn(() => builder),
        in: vi.fn(() => builder),
        order: vi.fn(() => builder),
        upsert: vi.fn(() => builder),
        then: (resolve: (value: any) => unknown, reject?: (reason: unknown) => unknown) =>
          Promise.resolve(response).then(resolve, reject),
      };
      return builder;
    });
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('skips loading contacts when no reader is authenticated', async () => {
    mocks.user = null;
    const { result } = renderHook(() => useWhatsAppContacts());
    await act(async () => { await result.current.fetchContacts(); });
    expect(mocks.from).not.toHaveBeenCalled();
    expect(result.current.contacts).toEqual([]);
    expect(result.current.isLoading).toBe(false);
  });

  it('fetches contacts for the current user and clears loading state', async () => {
    queue('whatsapp_contacts', { data: [contact()], error: null });
    const { result } = renderHook(() => useWhatsAppContacts());
    await waitFor(() => expect(result.current.contacts).toHaveLength(1));
    expect(result.current.contacts[0].contact_name).toBe('A Reader');
    expect(result.current.error).toBeNull();
    expect(result.current.isLoading).toBe(false);
    expect(mocks.from).toHaveBeenCalledWith('whatsapp_contacts');
  });

  it('exposes fetch errors without leaving the loading flag set', async () => {
    queue('whatsapp_contacts', { data: null, error: new Error('contacts unavailable') });
    const { result } = renderHook(() => useWhatsAppContacts());
    await waitFor(() => expect(result.current.error).toBe('contacts unavailable'));
    expect(result.current.isLoading).toBe(false);
  });

  it('syncs verified platform matches and refreshes the contact list', async () => {
    queue('user_profile', { data: [{ id: 'platform-reader', phone_number: '9876543210' }], error: null });
    queue('whatsapp_contacts',
      { data: null, error: null },
      { data: [contact({ is_on_platform: true, platform_user_id: 'platform-reader' })], error: null },
    );
    const { result } = renderHook(() => useWhatsAppContacts());

    await act(async () => {
      await result.current.syncContacts([
        { phone: '9876543210', name: 'Matched reader' },
        { phone: '1234567890', name: 'Not on platform' },
      ]);
    });

    expect(mocks.from).toHaveBeenCalledWith('user_profile');
    expect(result.current.contacts).toHaveLength(1);
    expect(result.current.contacts[0].is_on_platform).toBe(true);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('records an invitation and opens WhatsApp with sanitized phone and encoded text', async () => {
    queue('whatsapp_contacts', { data: [contact()], error: null });
    queue('whatsapp_invitations', { data: null, error: null });
    const open = vi.spyOn(window, 'open').mockImplementation(() => null);
    const { result } = renderHook(() => useWhatsAppContacts());
    await waitFor(() => expect(result.current.contacts).toHaveLength(1));

    await expect(result.current.inviteContact('contact-1', 'Join Sahadhyayi & read!')).resolves.toBe(true);
    expect(mocks.from).toHaveBeenCalledWith('whatsapp_invitations');
    expect(open).toHaveBeenCalledWith(
      'https://wa.me/919876543210?text=Join%20Sahadhyayi%20%26%20read!',
      '_blank',
    );
  });

  it('returns false for missing contacts, unauthenticated readers, and invitation failures', async () => {
    queue('whatsapp_contacts', { data: [contact()], error: null });
    queue('whatsapp_invitations', { data: null, error: new Error('invite insert failed') });
    const { result, rerender } = renderHook(() => useWhatsAppContacts());
    await waitFor(() => expect(result.current.contacts).toHaveLength(1));

    await expect(result.current.inviteContact('missing', 'hello')).resolves.toBeUndefined();
    await expect(result.current.inviteContact('contact-1', 'hello')).resolves.toBe(false);
    expect(result.current.error).toBe('invite insert failed');

    mocks.user = null;
    rerender();
    await expect(result.current.inviteContact('contact-1', 'hello')).resolves.toBeUndefined();
  });

  it('reports contact-sync errors and resets loading state', async () => {
    queue('user_profile', { data: null, error: new Error('lookup failed') });
    const { result } = renderHook(() => useWhatsAppContacts());
    await act(async () => {
      await result.current.syncContacts([{ phone: '123', name: 'Reader' }]);
    });
    expect(result.current.error).toBeNull(); // lookup errors are tolerated; contacts still upsert
    expect(result.current.isLoading).toBe(false);

    queue('whatsapp_contacts', { data: null, error: new Error('upsert failed') });
    await act(async () => {
      await result.current.syncContacts([{ phone: '123', name: 'Reader' }]);
    });
    expect(result.current.error).toBe('upsert failed');
    expect(result.current.isLoading).toBe(false);
  });
});
