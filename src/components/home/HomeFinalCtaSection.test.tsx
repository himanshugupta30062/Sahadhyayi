import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import HomeFinalCtaSection from './HomeFinalCtaSection';

const mockUseAuth = vi.fn();

vi.mock('@/contexts/authHelpers', () => ({
  useAuth: () => mockUseAuth(),
}));

describe('HomeFinalCtaSection', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders guest view with browse engagement headline, CTAs, and social proof stats', () => {
    mockUseAuth.mockReturnValue({ user: null });

    render(
      <MemoryRouter>
        <HomeFinalCtaSection />
      </MemoryRouter>
    );

    expect(screen.getByText("Curious what's inside?")).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Explore the Library/i })).toHaveAttribute('href', '/library');
    expect(screen.getByRole('link', { name: /See the Reader Map/i })).toHaveAttribute('href', '/map');

    // Social proof stats
    expect(screen.getByText('50K+')).toBeInTheDocument();
    expect(screen.getByText('Readers joined')).toBeInTheDocument();
    expect(screen.getByText('12K+')).toBeInTheDocument();
    expect(screen.getByText('Books in library')).toBeInTheDocument();
    expect(screen.getByText('8K+')).toBeInTheDocument();
    expect(screen.getByText('Reading rooms hosted')).toBeInTheDocument();
    expect(screen.getByText('2M+')).toBeInTheDocument();
    expect(screen.getByText('Pages read this month')).toBeInTheDocument();
  });

  it('toggles testimonials display when clicking the button', () => {
    mockUseAuth.mockReturnValue({ user: null });

    render(
      <MemoryRouter>
        <HomeFinalCtaSection />
      </MemoryRouter>
    );

    const toggleBtn = screen.getByRole('button', { name: /See what readers say/i });
    expect(toggleBtn).toBeInTheDocument();

    // Initially testimonials are hidden
    expect(screen.queryByText(/Priya Sharma/i)).not.toBeInTheDocument();

    // Click to show testimonials
    fireEvent.click(toggleBtn);
    expect(screen.getByText(/Priya Sharma/i)).toBeInTheDocument();
    expect(screen.getByText(/Hide what readers say/i)).toBeInTheDocument();

    // Test clicking pagination dot for Marcus Chen
    const dot2 = screen.getByRole('button', { name: 'Go to testimonial 2' });
    fireEvent.click(dot2);
    expect(screen.getByText(/Marcus Chen/i)).toBeInTheDocument();

    // Click to hide testimonials
    fireEvent.click(screen.getByRole('button', { name: /Hide what readers say/i }));
    expect(screen.queryByText(/Marcus Chen/i)).not.toBeInTheDocument();
  });

  it('renders authenticated dashboard CTA for logged-in users', () => {
    mockUseAuth.mockReturnValue({ user: { id: 'u1', email: 'reader@example.com' } });

    render(
      <MemoryRouter>
        <HomeFinalCtaSection />
      </MemoryRouter>
    );

    expect(screen.getByText('Your reading journey continues')).toBeInTheDocument();
    expect(screen.getByText('Welcome back')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Open Your Dashboard/i })).toHaveAttribute('href', '/dashboard');
    expect(screen.getByRole('link', { name: /Join a Reading Room/i })).toHaveAttribute('href', '/social?tab=rooms');
  });
});
