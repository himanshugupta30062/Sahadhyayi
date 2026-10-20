/** @vitest-environment jsdom */
import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import '@testing-library/jest-dom/vitest';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import Auth from '@/pages/Auth';
import SignUp from '@/pages/SignUp';
import ResetPassword from '@/pages/ResetPassword';
import ConfirmEmail from '@/pages/ConfirmEmail';
import { ForgotPasswordDialog } from '@/components/auth/ForgotPasswordDialog';
import ProtectedRoute from '@/components/ProtectedRoute';
import { getSafeRedirectUrl } from '@/utils/security';

// Mocks
const mockSignIn = vi.fn();
const mockSignUp = vi.fn();
const mockSignInWithOAuth = vi.fn();
let mockUser: any = null;
let mockLoading = false;

vi.mock('@/contexts/authHelpers', () => ({
  normalizeAuthEmail: (email: string) => email.trim().toLowerCase(),
  normalizeAuthName: (name: string) => name.trim().replace(/\s+/g, ' ').slice(0, 100),
  useAuth: () => ({
    user: mockUser,
    loading: mockLoading,
    signIn: mockSignIn,
    signUp: mockSignUp,
    signInWithOAuth: mockSignInWithOAuth,
  }),
}));

vi.mock('@/components/auth/TurnstileCaptcha', () => ({
  TurnstileCaptcha: ({ onTokenChange }: { onTokenChange: (token: string | null) => void }) => {
    React.useEffect(() => {
      onTokenChange('test-turnstile-token');
    }, [onTokenChange]);
    return null;
  },
}));

const mockResetPasswordForEmail = vi.fn();
const mockUpdateUser = vi.fn();
const mockGetSession = vi.fn();
const mockVerifyOtp = vi.fn();
const mockExchangeCodeForSession = vi.fn();
const mockResend = vi.fn();
const mockOnAuthStateChange = vi.fn(() => ({
  data: { subscription: { unsubscribe: vi.fn() } },
}));

vi.mock('@/integrations/supabase/client-universal', () => ({
  supabase: {
    auth: {
      resetPasswordForEmail: (...args: any[]) => mockResetPasswordForEmail(...args),
      updateUser: (...args: any[]) => mockUpdateUser(...args),
      getSession: (...args: any[]) => mockGetSession(...args),
      verifyOtp: (...args: any[]) => mockVerifyOtp(...args),
      exchangeCodeForSession: (...args: any[]) => mockExchangeCodeForSession(...args),
      resend: (...args: any[]) => mockResend(...args),
      onAuthStateChange: (...args: any[]) => mockOnAuthStateChange(...args),
      getUser: vi.fn().mockResolvedValue({ data: { user: { email: 'reader@example.com' } } }),
    },
    from: vi.fn(() => ({
      insert: vi.fn().mockResolvedValue({ error: null }),
    })),
  },
}));

vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({ toast: vi.fn() }),
}));

beforeEach(() => {
  mockUser = null;
  mockLoading = false;
  mockSignIn.mockReset();
  mockSignUp.mockReset();
  mockResetPasswordForEmail.mockReset();
  mockUpdateUser.mockReset();
  mockGetSession.mockResolvedValue({ data: { session: null } });
  mockVerifyOtp.mockReset();
  mockExchangeCodeForSession.mockReset();
});

afterEach(() => {
  cleanup();
});

describe('Phase 3: Authentication and Account Entry', () => {
  describe('Open Redirect Protection (getSafeRedirectUrl)', () => {
    it('accepts safe relative paths', () => {
      expect(getSafeRedirectUrl('/dashboard')).toBe('/dashboard');
      expect(getSafeRedirectUrl('/library?search=gita')).toBe('/library?search=gita');
      expect(getSafeRedirectUrl('/articles/123#notes')).toBe('/articles/123#notes');
    });

    it('rejects external open redirect attempts and falls back to default route', () => {
      expect(getSafeRedirectUrl('https://evil.com')).toBe('/dashboard');
      expect(getSafeRedirectUrl('http://evil.com/phish')).toBe('/dashboard');
      expect(getSafeRedirectUrl('//evil.com')).toBe('/dashboard');
      expect(getSafeRedirectUrl('/\\evil.com')).toBe('/dashboard');
      expect(getSafeRedirectUrl('javascript:alert(1)')).toBe('/dashboard');
      expect(getSafeRedirectUrl(null)).toBe('/dashboard');
      expect(getSafeRedirectUrl(undefined)).toBe('/dashboard');
      expect(getSafeRedirectUrl('')).toBe('/dashboard');
    });
  });

  describe('Sign In Flow (Auth.tsx)', () => {
    it('renders Welcome Back heading, persistent labels, and required markers', () => {
      render(
        <MemoryRouter initialEntries={['/signin']}>
          <Auth />
        </MemoryRouter>
      );

      expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(/Welcome back/i);
      expect(screen.getByLabelText(/Email address/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/^Password/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /^Sign In$/i })).toBeInTheDocument();
    });

    it('validates empty inputs without submitting', async () => {
      render(
        <MemoryRouter initialEntries={['/signin']}>
          <Auth />
        </MemoryRouter>
      );

      fireEvent.click(screen.getByRole('button', { name: /^Sign In$/i }));

      expect(await screen.findByRole('alert')).toHaveTextContent(/Please fill in both email and password/i);
      expect(mockSignIn).not.toHaveBeenCalled();
    });

    it('validates email format before submitting', async () => {
      render(
        <MemoryRouter initialEntries={['/signin']}>
          <Auth />
        </MemoryRouter>
      );

      fireEvent.change(screen.getByLabelText(/Email address/i), { target: { value: 'invalid-email' } });
      fireEvent.change(screen.getByLabelText(/^Password/i), { target: { value: 'Secret123!' } });
      fireEvent.click(screen.getByRole('button', { name: /^Sign In$/i }));

      expect(await screen.findByRole('alert')).toHaveTextContent(/Please enter a valid email address/i);
      expect(mockSignIn).not.toHaveBeenCalled();
    });

    it('submits valid credentials and preserves email upon rejection', async () => {
      mockSignIn.mockRejectedValueOnce(new Error('Invalid login credentials'));

      render(
        <MemoryRouter initialEntries={['/signin']}>
          <Auth />
        </MemoryRouter>
      );

      const emailInput = screen.getByLabelText(/Email address/i) as HTMLInputElement;
      const passwordInput = screen.getByLabelText(/^Password/i) as HTMLInputElement;

      fireEvent.change(emailInput, { target: { value: 'reader@example.com' } });
      fireEvent.change(passwordInput, { target: { value: 'wrongPassword1' } });
      fireEvent.click(screen.getByRole('button', { name: /^Sign In$/i }));

      expect(mockSignIn).toHaveBeenCalledWith('reader@example.com', 'wrongPassword1');
      expect(await screen.findByRole('alert')).toHaveTextContent(/Incorrect email or password/i);

      // Email field remains preserved for easy retry
      expect(emailInput.value).toBe('reader@example.com');
    });

    it('toggles password visibility with accessible button state', () => {
      render(
        <MemoryRouter initialEntries={['/signin']}>
          <Auth />
        </MemoryRouter>
      );

      const passwordInput = screen.getByLabelText(/^Password/i);
      expect(passwordInput).toHaveAttribute('type', 'password');

      const toggleButton = screen.getByRole('button', { name: /Show password/i });
      expect(toggleButton).toHaveAttribute('aria-pressed', 'false');

      fireEvent.click(toggleButton);

      expect(passwordInput).toHaveAttribute('type', 'text');
      expect(screen.getByRole('button', { name: /Hide password/i })).toHaveAttribute('aria-pressed', 'true');
    });
  });

  describe('Sign Up & Registration Flow (Auth.tsx)', () => {
    it('switches to Sign Up tab, displaying Create your account and new-password autocomplete', () => {
      render(
        <MemoryRouter initialEntries={['/signup']}>
          <Auth />
        </MemoryRouter>
      );

      expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(/Create your account/i);
      expect(screen.getByLabelText(/Full Name/i)).toHaveAttribute('autocomplete', 'name');
      expect(screen.getByLabelText(/^Password/i, { selector: 'input' })).toHaveAttribute('autocomplete', 'new-password');
      expect(screen.getByLabelText(/Confirm Password/i, { selector: 'input' })).toHaveAttribute('autocomplete', 'new-password');
    });

    it('validates password mismatch on signup', async () => {
      render(
        <MemoryRouter initialEntries={['/signup']}>
          <Auth />
        </MemoryRouter>
      );

      fireEvent.change(screen.getByLabelText(/Full Name/i), { target: { value: 'Aarav Sharma' } });
      fireEvent.change(screen.getByLabelText(/Email address/i), { target: { value: 'aarav+books&clubs@example.com' } });
      fireEvent.change(screen.getByLabelText(/^Password/i, { selector: 'input' }), { target: { value: 'ValidPass1' } });
      fireEvent.change(screen.getByLabelText(/Confirm Password/i, { selector: 'input' }), { target: { value: 'DifferentPass2' } });

      fireEvent.click(screen.getByRole('button', { name: /^Create Account$/i }));

      expect(await screen.findByRole('alert')).toHaveTextContent(/Passwords do not match/i);
      expect(mockSignUp).not.toHaveBeenCalled();
    });

    it('displays dedicated Check your email confirmation card upon successful signup', async () => {
      mockSignUp.mockResolvedValueOnce({ error: null });

      render(
        <MemoryRouter initialEntries={['/signup']}>
          <Auth />
        </MemoryRouter>
      );

      fireEvent.change(screen.getByLabelText(/Full Name/i), { target: { value: 'Aarav Sharma' } });
      fireEvent.change(screen.getByLabelText(/Email address/i), { target: { value: 'aarav+books&clubs@example.com' } });
      fireEvent.change(screen.getByLabelText(/^Password/i, { selector: 'input' }), { target: { value: 'ValidPass1' } });
      fireEvent.change(screen.getByLabelText(/Confirm Password/i, { selector: 'input' }), { target: { value: 'ValidPass1' } });

      fireEvent.click(screen.getByRole('button', { name: /^Create Account$/i }));

      await waitFor(() => {
        expect(mockSignUp).toHaveBeenCalledWith('aarav+books&clubs@example.com', 'ValidPass1', 'Aarav Sharma');
      });

      expect(await screen.findByText(/Check your email/i)).toBeInTheDocument();
      expect(screen.getByText(/aarav\+books&clubs@example\.com/)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Back to Sign In/i })).toBeInTheDocument();
    });

    it('displays clear error messages in standalone SignUp page when registration fails', async () => {
      mockSignUp.mockResolvedValueOnce({
        error: { message: 'Database error saving new user' } as any,
      });

      render(
        <MemoryRouter initialEntries={['/signup']}>
          <SignUp />
        </MemoryRouter>
      );

      fireEvent.change(screen.getByLabelText(/Full Name/i), { target: { value: 'Priya Patel' } });
      fireEvent.change(screen.getByLabelText(/^Email$/i), { target: { value: 'priya@example.com' } });
      fireEvent.change(screen.getByLabelText(/^Password/i, { selector: 'input' }), { target: { value: 'ValidPass1' } });
      fireEvent.change(screen.getByLabelText(/Confirm Password/i, { selector: 'input' }), { target: { value: 'ValidPass1' } });

      fireEvent.click(screen.getByRole('button', { name: /^Create Account$/i }));

      await waitFor(() => {
        expect(mockSignUp).toHaveBeenCalledWith('priya@example.com', 'ValidPass1', 'Priya Patel');
      });

      expect(await screen.findByRole('alert')).toHaveTextContent(/temporary setup issue/i);
    });
  });

  describe('Password Recovery (ForgotPasswordDialog)', () => {
    it('sends reset link and provides anti-enumeration success message', async () => {
      mockResetPasswordForEmail.mockResolvedValueOnce({ error: null });

      render(
        <MemoryRouter>
          <ForgotPasswordDialog />
        </MemoryRouter>
      );

      fireEvent.click(screen.getByRole('button', { name: /Forgot password\?/i }));

      expect(screen.getByRole('heading', { name: /Reset your password/i })).toBeInTheDocument();

      const emailInput = screen.getByLabelText(/Email address/i);
      fireEvent.change(emailInput, { target: { value: 'reader@example.com' } });
      fireEvent.click(screen.getByRole('button', { name: /Send Reset Link/i }));

      await waitFor(() => {
        expect(mockResetPasswordForEmail).toHaveBeenCalledWith(
          'reader@example.com',
          expect.objectContaining({ redirectTo: expect.stringContaining('/reset-password') })
        );
      });

      expect(await screen.findByText(/If an account exists for/i)).toBeInTheDocument();
    });
  });

  describe('Password Reset Page (ResetPassword.tsx)', () => {
    it('shows invalid/expired link card when no recovery session exists', async () => {
      mockGetSession.mockResolvedValueOnce({ data: { session: null } });

      render(
        <MemoryRouter initialEntries={['/reset-password']}>
          <ResetPassword />
        </MemoryRouter>
      );

      expect(await screen.findByText(/Invalid or Expired Link/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Request New Reset Link/i })).toBeInTheDocument();
    });

    it('permits password update when session is valid and passwords match', async () => {
      mockGetSession.mockResolvedValueOnce({
        data: { session: { user: { id: 'usr-123', email: 'reader@example.com' } } },
      });
      mockUpdateUser.mockResolvedValueOnce({ error: null });

      render(
        <MemoryRouter initialEntries={['/reset-password']}>
          <ResetPassword />
        </MemoryRouter>
      );

      expect(await screen.findByRole('heading', { name: /Choose a new password/i })).toBeInTheDocument();

      fireEvent.change(screen.getByLabelText(/^New password/i), { target: { value: 'NewSecurePass1' } });
      fireEvent.change(screen.getByLabelText(/Confirm new password/i), { target: { value: 'NewSecurePass1' } });
      fireEvent.click(screen.getByRole('button', { name: /Update Password/i }));

      await waitFor(() => {
        expect(mockUpdateUser).toHaveBeenCalledWith({ password: 'NewSecurePass1' });
      });

      expect(await screen.findByText(/Password Updated/i)).toBeInTheDocument();
    });
  });

  describe('Email Confirmation (ConfirmEmail.tsx)', () => {
    it('handles verification error gracefully with action buttons', async () => {
      mockVerifyOtp.mockResolvedValueOnce({ data: { session: null }, error: new Error('Token has expired') });

      render(
        <MemoryRouter initialEntries={['/confirm-email?token_hash=bad-token&type=email']}>
          <ConfirmEmail />
        </MemoryRouter>
      );

      expect(await screen.findByText(/Verification Failed/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Go to Sign In/i })).toBeInTheDocument();
    });
  });

  describe('Protected Route Navigation & Flash Prevention', () => {
    it('shows loading skeleton while resolving session and prevents content flash', () => {
      mockLoading = true;

      const { container } = render(
        <MemoryRouter initialEntries={['/dashboard']}>
          <ProtectedRoute>
            <div data-testid="secret-content">Secret Dashboard</div>
          </ProtectedRoute>
        </MemoryRouter>
      );

      expect(screen.queryByTestId('secret-content')).not.toBeInTheDocument();
      expect(container.querySelector('.animate-pulse')).toBeInTheDocument();
    });

    it('redirects unauthenticated users to /signin with sanitized redirect target', () => {
      mockLoading = false;
      mockUser = null;

      render(
        <MemoryRouter initialEntries={['/dashboard']}>
          <Routes>
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <div>Secret Dashboard</div>
                </ProtectedRoute>
              }
            />
            <Route path="/signin" element={<div data-testid="signin-page">Sign In Destination</div>} />
          </Routes>
        </MemoryRouter>
      );

      expect(screen.getByTestId('signin-page')).toBeInTheDocument();
      expect(screen.queryByText('Secret Dashboard')).not.toBeInTheDocument();
    });
  });
});
