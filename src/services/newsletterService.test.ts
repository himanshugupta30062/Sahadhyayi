import { describe, expect, it, vi, beforeEach } from 'vitest';
import { subscribeToNewsletter } from './newsletterService';
import { supabase } from '@/integrations/supabase/client';

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(),
  },
}));

describe('subscribeToNewsletter', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('validates empty email', async () => {
    const res = await subscribeToNewsletter('');
    expect(res.success).toBe(false);
    expect(res.message).toBe('Please enter your email address.');
  });

  it('validates invalid email syntax', async () => {
    const res = await subscribeToNewsletter('not-an-email');
    expect(res.success).toBe(false);
    expect(res.message).toBe('Please enter a valid email address.');
  });

  it('successfully subscribes a valid email', async () => {
    const insertMock = vi.fn().mockResolvedValue({ error: null });
    vi.mocked(supabase.from).mockReturnValue({
      insert: insertMock,
    } as any);

    const res = await subscribeToNewsletter('  Reader@Example.COM ');
    expect(insertMock).toHaveBeenCalledWith({
      email: 'reader@example.com',
      status: 'active',
    });
    expect(res.success).toBe(true);
    expect(res.message).toBe("You're subscribed! Look forward to discovering something wonderful.");
  });

  it('handles duplicate subscription with user-friendly message', async () => {
    const insertMock = vi.fn().mockResolvedValue({
      error: { code: '23505', message: 'duplicate key value violates unique constraint' },
    });
    vi.mocked(supabase.from).mockReturnValue({
      insert: insertMock,
    } as any);

    const res = await subscribeToNewsletter('reader@example.com');
    expect(res.success).toBe(false);
    expect(res.duplicate).toBe(true);
    expect(res.message).toBe('This email is already subscribed.');
  });

  it('handles unexpected database errors gracefully', async () => {
    const insertMock = vi.fn().mockResolvedValue({
      error: { code: '500', message: 'Internal Server Error' },
    });
    vi.mocked(supabase.from).mockReturnValue({
      insert: insertMock,
    } as any);

    const res = await subscribeToNewsletter('reader@example.com');
    expect(res.success).toBe(false);
    expect(res.message).toBe('Something went wrong. Please try again.');
  });
});
