/** @vitest-environment jsdom */
import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import '@testing-library/jest-dom/vitest';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import ContactFormDialog from '@/components/ContactFormDialog';

// Mocks
const mockInsert = vi.fn();
const mockFunctionsInvoke = vi.fn();
const mockToast = {
  success: vi.fn(),
  error: vi.fn(),
  warning: vi.fn(),
  info: vi.fn(),
};

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: (table: string) => ({
      insert: (...args: any[]) => mockInsert(table, ...args),
    }),
    functions: {
      invoke: (...args: any[]) => mockFunctionsInvoke(...args),
    },
  },
}));

vi.mock('sonner', () => ({
  toast: {
    success: (...args: any[]) => mockToast.success(...args),
    error: (...args: any[]) => mockToast.error(...args),
    warning: (...args: any[]) => mockToast.warning(...args),
    info: (...args: any[]) => mockToast.info(...args),
  },
}));

describe('ContactFormDialog Email Delivery & Reliability', () => {
  const originalLocation = window.location;

  beforeEach(() => {
    vi.clearAllMocks();
    // Mock window.location.href without triggering actual navigation
    delete (window as any).location;
    window.location = { ...originalLocation, href: '' } as any;
  });

  afterEach(() => {
    cleanup();
    document.body.innerHTML = '';
    window.location = originalLocation as any;
  });

  it('1. Successful sending: clears form, closes dialog, shows success toast, and does NOT trigger mailto redirect', async () => {
    mockInsert.mockResolvedValue({ data: null, error: null });
    mockFunctionsInvoke.mockResolvedValue({
      data: { success: true, id: 'email_msg_123' },
      error: null,
    });

    render(<ContactFormDialog />);

    // Open dialog
    const openBtn = screen.getByRole('button', { name: /contact us/i });
    fireEvent.click(openBtn);

    // Fill form
    const nameInput = screen.getByPlaceholderText(/your name/i);
    const emailInput = screen.getByPlaceholderText(/you@example\.com/i);
    const messageInput = screen.getByPlaceholderText(/tell us what's on your mind/i);

    fireEvent.change(nameInput, { target: { value: 'Alice Reader' } });
    fireEvent.change(emailInput, { target: { value: 'alice@example.com' } });
    fireEvent.change(messageInput, { target: { value: 'I love this literary reading community!' } });

    // Submit
    const sendBtn = screen.getByRole('button', { name: /send message/i });
    fireEvent.click(sendBtn);

    await waitFor(() => {
      expect(mockInsert).toHaveBeenCalledWith('contact_messages', {
        name: 'Alice Reader',
        email: 'alice@example.com',
        message: 'I love this literary reading community!',
      });
      expect(mockFunctionsInvoke).toHaveBeenCalledWith('send-contact-email', {
        body: {
          name: 'Alice Reader',
          email: 'alice@example.com',
          message: 'I love this literary reading community!',
        },
      });
    });

    // Success toast shown
    await waitFor(() => {
      expect(mockToast.success).toHaveBeenCalledWith(
        expect.stringMatching(/message sent.*delivered to gyan@sahadhyayi\.com/i)
      );
    });

    // Crucial: No mailto redirect must have occurred!
    expect(window.location.href).toBe('');

    // Dialog closes
    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
  });

  it('2. Resend API failure (e.g. unverified domain or sandbox 403): preserves form contents, keeps dialog open, does NOT trigger mailto, and alerts user', async () => {
    mockInsert.mockResolvedValue({ data: null, error: null });
    mockFunctionsInvoke.mockResolvedValue({
      data: null,
      error: {
        message: 'Resend API error [403]: You can only send testing emails to your own email address',
        context: {
          json: async () => ({
            error: 'Resend API error [403]: You can only send testing emails to your own email address',
          }),
        },
      },
    });

    render(<ContactFormDialog />);

    fireEvent.click(screen.getByRole('button', { name: /contact us/i }));

    const nameInput = screen.getByPlaceholderText(/your name/i) as HTMLInputElement;
    const emailInput = screen.getByPlaceholderText(/you@example\.com/i) as HTMLInputElement;
    const messageInput = screen.getByPlaceholderText(/tell us what's on your mind/i) as HTMLTextAreaElement;

    fireEvent.change(nameInput, { target: { value: 'Bob Reader' } });
    fireEvent.change(emailInput, { target: { value: 'bob@example.com' } });
    fireEvent.change(messageInput, { target: { value: 'Important book feedback' } });

    fireEvent.click(screen.getByRole('button', { name: /send message/i }));

    await waitFor(() => {
      expect(mockToast.error).toHaveBeenCalledWith(
        expect.stringMatching(/message saved to our inbox, but email delivery to gyan@sahadhyayi\.com failed/i)
      );
    });

    // Form inputs must remain preserved so user does not lose their text
    expect(nameInput.value).toBe('Bob Reader');
    expect(emailInput.value).toBe('bob@example.com');
    expect(messageInput.value).toBe('Important book feedback');

    // Dialog stays open
    expect(screen.getByRole('dialog')).toBeInTheDocument();

    // No automatic mailto redirect
    expect(window.location.href).toBe('');
  });

  it('3. Missing API key / server configuration error: preserves form and shows clear error toast', async () => {
    mockInsert.mockResolvedValue({ data: null, error: null });
    mockFunctionsInvoke.mockResolvedValue({
      data: { success: false, error: 'RESEND_API_KEY is not configured on the server', code: 'MISSING_API_KEY' },
      error: null,
    });

    render(<ContactFormDialog />);

    fireEvent.click(screen.getByRole('button', { name: /contact us/i }));

    fireEvent.change(screen.getByPlaceholderText(/your name/i), { target: { value: 'Carol' } });
    fireEvent.change(screen.getByPlaceholderText(/you@example\.com/i), { target: { value: 'carol@example.com' } });
    fireEvent.change(screen.getByPlaceholderText(/tell us what's on your mind/i), { target: { value: 'Hello test' } });

    fireEvent.click(screen.getByRole('button', { name: /send message/i }));

    await waitFor(() => {
      expect(mockToast.error).toHaveBeenCalledWith(
        expect.stringMatching(/message saved to our inbox, but email delivery.*failed/i)
      );
    });

    // No mailto redirect
    expect(window.location.href).toBe('');
    // Dialog remains open
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('4. Database failure + Email failure: does not silently swallow database errors and preserves input', async () => {
    mockInsert.mockResolvedValue({
      data: null,
      error: { message: 'Network connection lost to Supabase database', code: 'PGRST000' },
    });
    mockFunctionsInvoke.mockResolvedValue({
      data: null,
      error: { message: 'Failed to fetch Edge Function' },
    });

    render(<ContactFormDialog />);

    fireEvent.click(screen.getByRole('button', { name: /contact us/i }));

    fireEvent.change(screen.getByPlaceholderText(/your name/i), { target: { value: 'Dan' } });
    fireEvent.change(screen.getByPlaceholderText(/you@example\.com/i), { target: { value: 'dan@example.com' } });
    fireEvent.change(screen.getByPlaceholderText(/tell us what's on your mind/i), { target: { value: 'Database error test' } });

    fireEvent.click(screen.getByRole('button', { name: /send message/i }));

    await waitFor(() => {
      expect(mockToast.error).toHaveBeenCalledWith(
        expect.stringMatching(/failed to send message/i)
      );
    });

    expect(window.location.href).toBe('');
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('5. Database failure but Email success: distinguishes outcomes with a warning', async () => {
    mockInsert.mockResolvedValue({
      data: null,
      error: { message: 'Unique constraint error on inbox table' },
    });
    mockFunctionsInvoke.mockResolvedValue({
      data: { success: true, id: 'email_456' },
      error: null,
    });

    render(<ContactFormDialog />);

    fireEvent.click(screen.getByRole('button', { name: /contact us/i }));

    fireEvent.change(screen.getByPlaceholderText(/your name/i), { target: { value: 'Eve' } });
    fireEvent.change(screen.getByPlaceholderText(/you@example\.com/i), { target: { value: 'eve@example.com' } });
    fireEvent.change(screen.getByPlaceholderText(/tell us what's on your mind/i), { target: { value: 'Testing db warning' } });

    fireEvent.click(screen.getByRole('button', { name: /send message/i }));

    await waitFor(() => {
      expect(mockToast.warning).toHaveBeenCalledWith(
        expect.stringMatching(/message delivered to gyan@sahadhyayi\.com.*saving backup copy.*issue/i)
      );
    });

    // Successful email delivery closes dialog and clears inputs
    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
  });

  it('6. Manual "Email App" button triggers mailto client explicitly as a separate user action', async () => {
    render(<ContactFormDialog />);

    fireEvent.click(screen.getByRole('button', { name: /contact us/i }));

    fireEvent.change(screen.getByPlaceholderText(/your name/i), { target: { value: 'Frank' } });
    fireEvent.change(screen.getByPlaceholderText(/you@example\.com/i), { target: { value: 'frank@example.com' } });
    fireEvent.change(screen.getByPlaceholderText(/tell us what's on your mind/i), { target: { value: 'Direct email text' } });

    // Click the manual "Email App" button
    const emailAppBtn = screen.getByRole('button', { name: /email app/i });
    fireEvent.click(emailAppBtn);

    // Verify it set window.location.href to mailto with proper parameters
    expect(window.location.href).toContain('mailto:gyan@sahadhyayi.com');
    expect(window.location.href).toContain('Frank');
    expect(window.location.href).toContain('Direct%20email%20text');
  });
});
