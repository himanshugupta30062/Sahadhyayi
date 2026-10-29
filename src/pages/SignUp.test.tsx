// @vitest-environment jsdom

import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { MemoryRouter, useLocation } from 'react-router-dom';

const mocks = vi.hoisted(() => ({
  user: null as null | { id: string },
  signUp: vi.fn(),
  toast: vi.fn(),
  rateLimited: false,
  passwordValid: true,
}));

vi.mock('@/contexts/authHelpers', () => ({
  useAuth: () => ({
    user: mocks.user,
    signUp: mocks.signUp,
    normalizeAuthEmail: (value: string) => value.trim().toLowerCase(),
    normalizeAuthName: (value: string) => value.trim().replace(/\s+/g, ' '),
  }),
}));
vi.mock('@/hooks/use-toast', () => ({ useToast: () => ({ toast: mocks.toast }) }));
vi.mock('@/components/SEO', () => ({ default: () => null }));
vi.mock('@/components/auth/TurnstileCaptcha', () => ({
  TurnstileCaptcha: ({ onTokenChange }: { onTokenChange: (token: string) => void }) => (
    <button type="button" onClick={() => onTokenChange('captcha-token')}>Complete CAPTCHA</button>
  ),
}));
vi.mock('@/components/ui/password-strength', () => ({ PasswordStrength: () => <div>Password strength</div> }));
vi.mock('@/utils/validation', () => ({
  validateEmail: (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value),
  validatePassword: () => mocks.passwordValid
    ? { isValid: true }
    : { isValid: false, message: 'Password must be stronger.' },
  isRateLimited: () => mocks.rateLimited,
}));

import SignUp from '@/pages/SignUp';

const Route = () => {
  const location = useLocation();
  return <output aria-label="current-route">{location.pathname + location.search}</output>;
};

const renderSignUp = () => render(
  <MemoryRouter initialEntries={['/signup']}>
    <SignUp />
    <Route />
  </MemoryRouter>,
);

const fillForm = (overrides: Record<string, string> = {}) => {
  const values = {
    'Full Name': '  Reader   One ',
    Email: 'Reader@Example.com',
    Password: 'StrongPass123!',
    'Confirm Password': 'StrongPass123!',
    ...overrides,
  };
  for (const [label, value] of Object.entries(values)) {
    fireEvent.change(screen.getByLabelText(label), { target: { value } });
  }
};

describe('SignUp', () => {
  beforeEach(() => {
    mocks.user = null;
    mocks.signUp.mockReset().mockResolvedValue({ error: null, requiresEmailVerification: true, emailMayAlreadyExist: false });
    mocks.toast.mockReset();
    mocks.rateLimited = false;
    mocks.passwordValid = true;
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('validates required fields, short names and password mismatch', () => {
    renderSignUp();
    fireEvent.click(screen.getByRole('button', { name: 'Create Account' }));
    expect(screen.getByText('Please fill in all fields.')).toBeInTheDocument();

    fillForm({ 'Full Name': 'R' });
    fireEvent.click(screen.getByRole('button', { name: 'Create Account' }));
    expect(screen.getByText('Name must be at least 2 characters long.')).toBeInTheDocument();

    fillForm({ 'Confirm Password': 'different-password' });
    fireEvent.click(screen.getByRole('button', { name: 'Create Account' }));
    expect(screen.getByText('Passwords do not match.')).toBeInTheDocument();
  });

  it('rejects weak passwords and requires captcha before signup', () => {
    mocks.passwordValid = false;
    renderSignUp();
    fillForm();
    fireEvent.click(screen.getByRole('button', { name: 'Create Account' }));
    expect(screen.getByText('Password must be stronger.')).toBeInTheDocument();

    mocks.passwordValid = true;
    fillForm();
    fireEvent.click(screen.getByRole('button', { name: 'Create Account' }));
    expect(screen.getByText('Please complete the anti-bot verification before creating your account.')).toBeInTheDocument();
    expect(mocks.signUp).not.toHaveBeenCalled();
  });

  it('normalizes name and email then navigates to OTP verification', async () => {
    renderSignUp();
    fillForm();
    fireEvent.click(screen.getByRole('button', { name: 'Complete CAPTCHA' }));
    fireEvent.click(screen.getByRole('button', { name: 'Create Account' }));

    await waitFor(() => expect(mocks.signUp).toHaveBeenCalledWith(
      'reader@example.com',
      'StrongPass123!',
      'Reader One',
      'captcha-token',
    ));
    await waitFor(() => expect(screen.getByLabelText('current-route')).toHaveTextContent('/confirm-email?email=reader%40example.com'));
  });

  it('shows a duplicate-account warning without continuing signup', async () => {
    mocks.signUp.mockResolvedValueOnce({ error: null, requiresEmailVerification: false, emailMayAlreadyExist: true });
    renderSignUp();
    fillForm();
    fireEvent.click(screen.getByRole('button', { name: 'Complete CAPTCHA' }));
    fireEvent.click(screen.getByRole('button', { name: 'Create Account' }));

    expect(await screen.findByText(/An account may already exist with this email/i)).toBeInTheDocument();
    expect(mocks.signUp).toHaveBeenCalledTimes(1);
    expect(screen.getByLabelText('current-route')).toHaveTextContent('/signup');
  });

  it('maps database signup errors to a safe support message', async () => {
    mocks.signUp.mockResolvedValueOnce({
      error: new Error('Database error saving new user'),
      requiresEmailVerification: false,
      emailMayAlreadyExist: false,
    });
    renderSignUp();
    fillForm();
    fireEvent.click(screen.getByRole('button', { name: 'Complete CAPTCHA' }));
    fireEvent.click(screen.getByRole('button', { name: 'Create Account' }));

    expect(await screen.findByText(/temporary setup issue/i)).toBeInTheDocument();
    expect(screen.getByLabelText('current-route')).toHaveTextContent('/signup');
  });

  it('handles rate limiting and navigates directly to dashboard without email verification', async () => {
    mocks.rateLimited = true;
    renderSignUp();
    fillForm();
    fireEvent.click(screen.getByRole('button', { name: 'Complete CAPTCHA' }));
    fireEvent.click(screen.getByRole('button', { name: 'Create Account' }));
    expect(mocks.toast).toHaveBeenCalledWith(expect.objectContaining({ title: 'Too Many Attempts' }));
    expect(mocks.signUp).not.toHaveBeenCalled();

    mocks.rateLimited = false;
    mocks.signUp.mockResolvedValueOnce({ error: null, requiresEmailVerification: false, emailMayAlreadyExist: false });
    fireEvent.click(screen.getByRole('button', { name: 'Create Account' }));
    await waitFor(() => expect(screen.getByLabelText('current-route')).toHaveTextContent('/dashboard'));
  });
});
