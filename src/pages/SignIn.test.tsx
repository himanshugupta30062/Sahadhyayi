// @vitest-environment jsdom

import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { MemoryRouter, useLocation } from 'react-router-dom';

const mocks = vi.hoisted(() => ({
  user: null as null | { id: string },
  signIn: vi.fn(),
  signInWithOAuth: vi.fn(),
  toast: vi.fn(),
  rateLimited: false,
}));

vi.mock('@/contexts/authHelpers', () => ({
  useAuth: () => ({ user: mocks.user, signIn: mocks.signIn, signInWithOAuth: mocks.signInWithOAuth }),
}));
vi.mock('@/hooks/use-toast', () => ({ useToast: () => ({ toast: mocks.toast }) }));
vi.mock('@/components/SEO', () => ({ default: () => null }));
vi.mock('@/components/auth/ForgotPasswordDialog', () => ({ ForgotPasswordDialog: () => <button type="button">Forgot password?</button> }));
vi.mock('@/components/auth/TurnstileCaptcha', () => ({
  TurnstileCaptcha: ({ onTokenChange }: { onTokenChange: (token: string) => void }) => (
    <button type="button" onClick={() => onTokenChange('captcha-token')}>Complete CAPTCHA</button>
  ),
}));
vi.mock('@/utils/validation', () => ({
  validateEmail: (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value),
  sanitizeInput: (value: string) => value.trim().toLowerCase(),
  isRateLimited: () => mocks.rateLimited,
}));
vi.mock('@/utils/security', () => ({ getSafeRedirectUrl: (value: string | undefined, fallback: string) => value?.startsWith('/') ? value : fallback }));

import SignIn from '@/pages/SignIn';

const Route = () => {
  const location = useLocation();
  return <output aria-label="current-route">{location.pathname + location.search}</output>;
};

const renderSignIn = (initial = '/signin') => render(
  <MemoryRouter initialEntries={[initial]}>
    <SignIn />
    <Route />
  </MemoryRouter>,
);

const fillCredentials = (email = 'Reader@Example.com', password = 'correct-password') => {
  fireEvent.change(screen.getByLabelText('Email'), { target: { value: email } });
  fireEvent.change(screen.getByLabelText('Password'), { target: { value: password } });
};

describe('SignIn', () => {
  beforeEach(() => {
    mocks.user = null;
    mocks.signIn.mockReset().mockResolvedValue(undefined);
    mocks.signInWithOAuth.mockReset().mockResolvedValue(undefined);
    mocks.toast.mockReset();
    mocks.rateLimited = false;
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('renders the form and validates required fields before authentication', () => {
    renderSignIn();
    fireEvent.click(screen.getByRole('button', { name: 'Sign In' }));
    expect(screen.getByText('Please fill in all fields.')).toBeInTheDocument();
    expect(mocks.signIn).not.toHaveBeenCalled();
  });

  it('rejects invalid email and requires captcha for otherwise valid credentials', () => {
    renderSignIn();
    fillCredentials('invalid-email');
    fireEvent.click(screen.getByRole('button', { name: 'Sign In' }));
    expect(screen.getByText('Please enter a valid email address.')).toBeInTheDocument();

    fillCredentials('reader@example.com');
    fireEvent.click(screen.getByRole('button', { name: 'Sign In' }));
    expect(screen.getByText('Please complete the anti-bot verification before signing in.')).toBeInTheDocument();
    expect(mocks.signIn).not.toHaveBeenCalled();
  });

  it('normalizes email before sign-in and resets the captcha after the attempt', async () => {
    renderSignIn('/signin?redirect=%2Fgroups');
    fillCredentials();
    fireEvent.click(screen.getByRole('button', { name: 'Complete CAPTCHA' }));
    fireEvent.click(screen.getByRole('button', { name: 'Sign In' }));

    await waitFor(() => expect(mocks.signIn).toHaveBeenCalledWith('reader@example.com', 'correct-password', 'captcha-token'));
    expect(screen.getByLabelText('current-route')).toHaveTextContent('/signin?redirect=%2Fgroups');
  });

  it('shows a safe error for invalid credentials', async () => {
    mocks.signIn.mockRejectedValueOnce(new Error('Invalid login credentials'));
    renderSignIn();
    fillCredentials();
    fireEvent.click(screen.getByRole('button', { name: 'Complete CAPTCHA' }));
    fireEvent.click(screen.getByRole('button', { name: 'Sign In' }));
    expect(await screen.findByText('Invalid email or password. Please check your credentials and try again.')).toBeInTheDocument();
  });

  it('routes unverified accounts to the confirmation screen', async () => {
    mocks.signIn.mockRejectedValueOnce(new Error('Email not confirmed'));
    renderSignIn();
    fillCredentials();
    fireEvent.click(screen.getByRole('button', { name: 'Complete CAPTCHA' }));
    fireEvent.click(screen.getByRole('button', { name: 'Sign In' }));
    await waitFor(() => expect(screen.getByLabelText('current-route')).toHaveTextContent('/confirm-email?email=reader%40example.com'));
  });

  it('blocks rate-limited attempts and toggles password visibility', () => {
    mocks.rateLimited = true;
    renderSignIn();
    fillCredentials();
    fireEvent.click(screen.getByRole('button', { name: 'Complete CAPTCHA' }));
    fireEvent.click(screen.getByRole('button', { name: 'Sign In' }));
    expect(mocks.toast).toHaveBeenCalledWith(expect.objectContaining({ title: 'Too Many Attempts' }));
    expect(mocks.signIn).not.toHaveBeenCalled();

    mocks.rateLimited = false;
    fireEvent.click(screen.getByRole('button', { name: 'Show password' }));
    expect(screen.getByLabelText('Password')).toHaveAttribute('type', 'text');
  });
});
