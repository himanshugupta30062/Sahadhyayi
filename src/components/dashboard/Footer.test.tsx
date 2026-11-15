import { cleanup, render, screen } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import Footer from '@/components/dashboard/Footer';
import * as authHelpers from '@/contexts/authHelpers';

describe('Footer', () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('renders guest state when user is not logged in', () => {
    vi.spyOn(authHelpers, 'useAuth').mockReturnValue({
      user: null,
      session: null,
      profile: null,
      loading: false,
      signOut: async () => {},
    } as any);

    render(
      <MemoryRouter>
        <Footer />
      </MemoryRouter>
    );

    expect(screen.getByText('Welcome to Sahadhyayi')).toBeInTheDocument();
    expect(screen.getByText('About Us')).toBeInTheDocument();
    expect(screen.getByText('Contact')).toBeInTheDocument();
    expect(screen.getByText('Terms')).toBeInTheDocument();
    expect(screen.getByText('Privacy')).toBeInTheDocument();
    expect(screen.getByText('Help')).toBeInTheDocument();
  });

  it('renders logged in user email when user is present', () => {
    vi.spyOn(authHelpers, 'useAuth').mockReturnValue({
      user: { email: 'user@example.com' } as any,
      session: null,
      profile: null,
      loading: false,
      signOut: async () => {},
    } as any);

    render(
      <MemoryRouter>
        <Footer />
      </MemoryRouter>
    );

    expect(screen.getByText('user@example.com')).toBeInTheDocument();
  });
});
