// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import '@testing-library/jest-dom/vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import ConfirmEmail from '@/pages/ConfirmEmail';

const mocks = vi.hoisted(() => ({
  verifyOtp: vi.fn(),
  resend: vi.fn(),
  exchangeCodeForSession: vi.fn(),
  getSession: vi.fn(),
  toast: vi.fn(),
}));

vi.mock('@/integrations/supabase/client-universal', () => ({
  supabase: {
    auth: {
      verifyOtp: mocks.verifyOtp,
      resend: mocks.resend,
      exchangeCodeForSession: mocks.exchangeCodeForSession,
      getSession: mocks.getSession,
    },
  },
}));
vi.mock('@/components/SEO', () => ({ default: () => null }));
vi.mock('@/components/auth/TurnstileCaptcha', () => ({
  TurnstileCaptcha: ({ onTokenChange }: { onTokenChange: (token: string) => void }) => (
    <button type="button" onClick={() => onTokenChange('test-captcha-token')}>Complete human verification</button>
  ),
}));
vi.mock('@/hooks/use-toast', () => ({ useToast: () => ({ toast: mocks.toast }) }));

const renderConfirmEmail = (path = '/confirm-email?email=reader%40example.com') =>
  render(
    <MemoryRouter initialEntries={[path]}>
      <ConfirmEmail />
    </MemoryRouter>,
  );

describe('ConfirmEmail verification flow', () => {
  beforeEach(() => {
    mocks.verifyOtp.mockReset();
    mocks.resend.mockReset();
    mocks.exchangeCodeForSession.mockReset();
    mocks.getSession.mockReset();
    mocks.toast.mockReset();
    mocks.getSession.mockResolvedValue({ data: { session: null } });
  });

  afterEach(() => cleanup());

  it('recommends the newest email code instead of relying on single-use links', () => {
    renderConfirmEmail();

    expect(screen.getByText(/For the most reliable verification, enter the code from your newest email below/i)).toBeInTheDocument();
    expect(screen.queryByText(/or open the confirmation link in the email/i)).not.toBeInTheDocument();
  });

  it('rejects email addresses containing internal whitespace before verification', async () => {
    renderConfirmEmail();

    // The component synchronizes the query-string email after mount; wait for
    // that initial effect before replacing it with the invalid value.
    await waitFor(() => expect(screen.getByLabelText(/Email address/i)).toHaveValue('reader@example.com'));
    fireEvent.change(screen.getByLabelText(/Email address/i), { target: { value: 'reader @example.com' } });
    fireEvent.change(screen.getByLabelText(/Verification code/i), { target: { value: '123456' } });
    fireEvent.submit(screen.getByRole('button', { name: /^Verify email$/i }).closest('form')!);

    expect(await screen.findByText(/Enter a valid email address/i)).toBeInTheDocument();
    expect(mocks.verifyOtp).not.toHaveBeenCalled();
  });

  it('validates the email code before calling Supabase', async () => {
    renderConfirmEmail();

    fireEvent.change(screen.getByLabelText(/Verification code/i), { target: { value: '123' } });
    fireEvent.submit(screen.getByRole('button', { name: /^Verify email$/i }).closest('form')!);

    expect(await screen.findByText(/6–8 digits/i)).toBeInTheDocument();
    expect(mocks.verifyOtp).not.toHaveBeenCalled();
  });

  it('verifies a valid signup code and displays success feedback', async () => {
    mocks.verifyOtp.mockResolvedValueOnce({
      data: { session: { access_token: 'test-session' }, user: { id: 'reader-1' } },
      error: null,
    });

    renderConfirmEmail();

    fireEvent.change(screen.getByLabelText(/Verification code/i), { target: { value: '123456' } });
    fireEvent.click(screen.getByRole('button', { name: /^Verify email$/i }));

    await waitFor(() => expect(mocks.verifyOtp).toHaveBeenCalledWith({
      email: 'reader@example.com',
      token: '123456',
      type: 'signup',
    }));
    expect(await screen.findByText(/Email Verified!/i)).toBeInTheDocument();
    expect(mocks.toast).toHaveBeenCalledWith(expect.objectContaining({ title: 'Email verified' }));
  });

  it('shows a sign-in action when OTP verification succeeded without a session', async () => {
    mocks.verifyOtp.mockResolvedValueOnce({
      data: { session: null, user: { id: 'reader-1', email_confirmed_at: '2026-10-26T10:00:00Z' } },
      error: null,
    });

    renderConfirmEmail();

    fireEvent.change(screen.getByLabelText(/Verification code/i), { target: { value: '123456' } });
    fireEvent.click(screen.getByRole('button', { name: /^Verify email$/i }));

    expect(await screen.findByText(/Email Verified — Sign In/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Continue to Sign In/i })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /^Verify email$/i })).not.toBeInTheDocument();
  });

  it('shows sign-in when a PKCE confirmation link verifies without a session', async () => {
    mocks.exchangeCodeForSession.mockResolvedValueOnce({
      data: { session: null, user: { id: 'reader-1', email_confirmed_at: '2026-10-26T10:00:00Z' } },
      error: null,
    });

    renderConfirmEmail('/confirm-email?code=consumed-code');

    expect(await screen.findByText(/Email Verified — Sign In/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Continue to Sign In/i })).toBeInTheDocument();
    expect(mocks.verifyOtp).not.toHaveBeenCalled();
  });

  it('shows sign-in when a token-hash confirmation verifies without a session', async () => {
    mocks.verifyOtp.mockResolvedValueOnce({
      data: { session: null, user: { id: 'reader-1', email_confirmed_at: '2026-10-26T10:00:00Z' } },
      error: null,
    });

    renderConfirmEmail('/confirm-email?token_hash=consumed-hash&type=signup');

    expect(await screen.findByText(/Email Verified — Sign In/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Continue to Sign In/i })).toBeInTheDocument();
    expect(mocks.verifyOtp).toHaveBeenCalledWith({ token_hash: 'consumed-hash', type: 'signup' });
  });

  it('resends a signup code to the normalized email address', async () => {
    mocks.resend.mockResolvedValueOnce({ error: null });

    renderConfirmEmail();

    fireEvent.click(screen.getByRole('button', { name: /Complete human verification/i }));
    fireEvent.click(screen.getByRole('button', { name: /Resend verification code/i }));

    await waitFor(() => expect(mocks.resend).toHaveBeenCalledWith({
      type: 'signup',
      email: 'reader@example.com',
      options: { captchaToken: 'test-captcha-token' },
    }));
    expect(mocks.toast).toHaveBeenCalledWith(expect.objectContaining({ title: 'New code sent' }));
  });

  it('requires a fresh human challenge after a CAPTCHA resend rejection', async () => {
    mocks.resend.mockResolvedValueOnce({
      error: new Error('captcha protection: request disallowed (no captcha_token found)'),
    });

    renderConfirmEmail();

    fireEvent.click(screen.getByRole('button', { name: /Complete human verification/i }));
    fireEvent.click(screen.getByRole('button', { name: /Resend verification code/i }));

    expect(await screen.findByText(/Human verification expired or was rejected/i)).toBeInTheDocument();
    expect(mocks.resend).toHaveBeenCalledTimes(1);
  });

  it('checks for an already-confirmed session before reporting a stale URL token', async () => {
    mocks.getSession.mockResolvedValueOnce({
      data: { session: { user: { email_confirmed_at: '2026-10-25T15:31:18Z' } } },
    });

    renderConfirmEmail('/confirm-email?error=access_denied&error_code=otp_expired&error_description=Email+link+is+invalid+or+has+expired');

    expect(await screen.findByText(/Already Verified/i)).toBeInTheDocument();
    expect(screen.queryByText(/This link has already been used or expired/i)).not.toBeInTheDocument();
  });

  it('shows a recoverable message when resending fails for a non-CAPTCHA reason', async () => {
    mocks.resend.mockResolvedValueOnce({ error: new Error('network unavailable') });

    renderConfirmEmail();

    fireEvent.click(screen.getByRole('button', { name: /Complete human verification/i }));
    fireEvent.click(screen.getByRole('button', { name: /Resend verification code/i }));

    expect(await screen.findByText(/Could not resend the code\. Check the email address and connection/i)).toBeInTheDocument();
  });

  it('shows a recoverable message when resending is rate limited', async () => {
    mocks.resend.mockResolvedValueOnce({ error: new Error('rate limit exceeded') });

    renderConfirmEmail();

    fireEvent.click(screen.getByRole('button', { name: /Complete human verification/i }));
    fireEvent.click(screen.getByRole('button', { name: /Resend verification code/i }));

    expect(await screen.findByText(/wait a little/i)).toBeInTheDocument();
  });
});
