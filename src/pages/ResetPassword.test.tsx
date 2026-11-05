/** @vitest-environment jsdom */
import React from 'react';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import ResetPassword from './ResetPassword';

const mockGetSession = vi.fn();
const mockOnAuthStateChange = vi.fn();
const mockUpdateUser = vi.fn();
const mockToast = vi.fn();

vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: mockToast,
  }),
}));

vi.mock('@/integrations/supabase/client-universal', () => ({
  supabase: {
    auth: {
      getSession: (...args: unknown[]) => mockGetSession(...args),
      onAuthStateChange: (...args: unknown[]) => mockOnAuthStateChange(...args),
      updateUser: (...args: unknown[]) => mockUpdateUser(...args),
    },
  },
}));

vi.mock('@/components/SEO', () => ({
  default: () => null,
}));

vi.mock('@/components/ui/password-strength', () => ({
  PasswordStrength: () => <div data-testid="password-strength" />,
}));

describe('ResetPassword Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetSession.mockResolvedValue({
      data: { session: { user: { id: 'u1' } } },
    });
    mockOnAuthStateChange.mockReturnValue({
      data: {
        subscription: {
          unsubscribe: vi.fn(),
        },
      },
    });
  });

  afterEach(() => {
    cleanup();
  });

  it('renders invalid session state when no recovery session is found', async () => {
    mockGetSession.mockResolvedValue({
      data: { session: null },
    });

    render(
      <MemoryRouter>
        <ResetPassword />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/Invalid or Expired Link/i)).toBeInTheDocument();
    });

    expect(screen.getByRole('button', { name: /Request New Reset Link/i })).toBeInTheDocument();
  });

  it('renders reset password form when an active session exists', async () => {
    render(
      <MemoryRouter>
        <ResetPassword />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /Choose a new password/i })).toBeInTheDocument();
    });

    expect(screen.getByLabelText(/^New password/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^Confirm new password/i)).toBeInTheDocument();
  });

  it('validates password requirements before submitting', async () => {
    render(
      <MemoryRouter>
        <ResetPassword />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /Choose a new password/i })).toBeInTheDocument();
    });

    const submitBtn = screen.getByRole('button', { name: /Update Password/i });
    const passwordInput = screen.getByLabelText(/^New password/i);
    const confirmInput = screen.getByLabelText(/^Confirm new password/i);

    // Short password
    fireEvent.change(passwordInput, { target: { value: 'Short1' } });
    fireEvent.change(confirmInput, { target: { value: 'Short1' } });
    fireEvent.click(submitBtn);

    expect(screen.getByText(/Password must be at least 8 characters long/i)).toBeInTheDocument();

    // Mismatched passwords
    fireEvent.change(passwordInput, { target: { value: 'ValidPass123' } });
    fireEvent.change(confirmInput, { target: { value: 'MismatchPass123' } });
    fireEvent.click(submitBtn);

    expect(screen.getByText(/Passwords do not match/i)).toBeInTheDocument();

    // Missing uppercase or number
    fireEvent.change(passwordInput, { target: { value: 'lowercase123' } });
    fireEvent.change(confirmInput, { target: { value: 'lowercase123' } });
    fireEvent.click(submitBtn);

    expect(screen.getByText(/Password must contain at least one uppercase letter/i)).toBeInTheDocument();
  });

  it('submits valid password and displays success message', async () => {
    mockUpdateUser.mockResolvedValueOnce({
      data: { user: { id: 'u1' } },
      error: null,
    });

    render(
      <MemoryRouter>
        <ResetPassword />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /Choose a new password/i })).toBeInTheDocument();
    });

    const passwordInput = screen.getByLabelText(/^New password/i);
    const confirmInput = screen.getByLabelText(/^Confirm new password/i);

    fireEvent.change(passwordInput, { target: { value: 'StrongPassword123' } });
    fireEvent.change(confirmInput, { target: { value: 'StrongPassword123' } });

    fireEvent.click(screen.getByRole('button', { name: /Update Password/i }));

    await waitFor(() => {
      expect(mockUpdateUser).toHaveBeenCalledWith({ password: 'StrongPassword123' });
      expect(screen.getByText(/Password Updated/i)).toBeInTheDocument();
    });

    expect(mockToast).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Password updated',
      })
    );
  });

  it('handles same_password error from Supabase gracefully', async () => {
    mockUpdateUser.mockResolvedValueOnce({
      data: null,
      error: new Error('same_password: New password should be different from old password'),
    });

    render(
      <MemoryRouter>
        <ResetPassword />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /Choose a new password/i })).toBeInTheDocument();
    });

    const passwordInput = screen.getByLabelText(/^New password/i);
    const confirmInput = screen.getByLabelText(/^Confirm new password/i);

    fireEvent.change(passwordInput, { target: { value: 'StrongPassword123' } });
    fireEvent.change(confirmInput, { target: { value: 'StrongPassword123' } });

    fireEvent.click(screen.getByRole('button', { name: /Update Password/i }));

    await waitFor(() => {
      expect(screen.getByText(/New password must be different from your old password/i)).toBeInTheDocument();
    });
  });

  it('toggles password visibility when eye button is clicked', async () => {
    render(
      <MemoryRouter>
        <ResetPassword />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /Choose a new password/i })).toBeInTheDocument();
    });

    const togglePasswordBtn = screen.getByRole('button', { name: /Show password/i });
    const passwordInput = screen.getByLabelText(/^New password/i);

    expect(passwordInput).toHaveAttribute('type', 'password');

    fireEvent.click(togglePasswordBtn);
    expect(passwordInput).toHaveAttribute('type', 'text');

    fireEvent.click(screen.getByRole('button', { name: /Hide password/i }));
    expect(passwordInput).toHaveAttribute('type', 'password');
  });
});
