import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { HeroContent } from './HeroContent';

const mockUseAuth = vi.fn();
vi.mock('@/contexts/authHelpers', () => ({
  useAuth: () => mockUseAuth(),
}));

describe('HeroContent', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders guest CTAs when the user is not authenticated', () => {
    mockUseAuth.mockReturnValue({ user: null });

    render(
      <MemoryRouter>
        <HeroContent />
      </MemoryRouter>
    );

    expect(screen.getByText(/A Reading Community/i)).toBeInTheDocument();
    expect(screen.getByText('Reading')).toBeInTheDocument();
    expect(screen.getByText('Journey.')).toBeInTheDocument();
    expect(screen.getByText(/Keep your books, reviews, and reading moments together/i)).toBeInTheDocument();

    const primaryLink = screen.getByRole('link', { name: /Explore Library/i });
    expect(primaryLink).toHaveAttribute('href', '/library');

    const secondaryLink = screen.getByRole('link', { name: /Join the community/i });
    expect(secondaryLink).toHaveAttribute('href', '/signup');

    expect(screen.getByText(/A community of readers, thinkers, and dreamers/i)).toBeInTheDocument();
  });

  it('renders authenticated dashboard and feed CTAs when a user is signed in', () => {
    mockUseAuth.mockReturnValue({
      user: { id: 'reader-123', email: 'reader@example.com' },
    });

    render(
      <MemoryRouter>
        <HeroContent />
      </MemoryRouter>
    );

    const primaryLink = screen.getByRole('link', { name: /Go to Dashboard/i });
    expect(primaryLink).toHaveAttribute('href', '/dashboard');

    const secondaryLink = screen.getByRole('link', { name: /Community Feed/i });
    expect(secondaryLink).toHaveAttribute('href', '/social');
  });
});
