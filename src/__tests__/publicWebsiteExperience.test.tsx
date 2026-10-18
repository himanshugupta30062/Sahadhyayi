/** @vitest-environment jsdom */
import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import '@testing-library/jest-dom/vitest';
import { render, screen, cleanup } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { HeroContent } from '@/components/hero/HeroContent';
import StructuredFooter from '@/components/footer/StructuredFooter';
import About from '@/pages/About';

// Mock auth helpers
let mockUser: any = null;
vi.mock('@/contexts/authHelpers', () => ({
  useAuth: () => ({
    user: mockUser,
    loading: false,
  }),
}));

// Mock toast
vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({ toast: vi.fn() }),
}));

// Mock Supabase
vi.mock('@/integrations/supabase/client-universal', () => ({
  supabase: {
    from: vi.fn(() => ({
      insert: vi.fn().mockResolvedValue({ error: null }),
    })),
    functions: {
      invoke: vi.fn().mockResolvedValue({ data: { success: true }, error: null }),
    },
  },
}));

beforeEach(() => {
  mockUser = null;
});

afterEach(() => {
  cleanup();
});

describe('Phase 2 — Public Website Experience', () => {
  describe('Hero Section Value Communication & CTAs', () => {
    it('renders the core headline and brand pill for guest users', () => {
      render(
        <MemoryRouter>
          <HeroContent />
        </MemoryRouter>
      );

      expect(screen.getByText(/A Reading Community/i)).toBeInTheDocument();
      expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(/Read deeper\.\s*Connect meaningfully\./i);
      expect(
        screen.getByText(/Discover books, exchange ideas, join reading groups/i)
      ).toBeInTheDocument();
    });

    it('displays Explore Library as primary CTA and Join community as secondary CTA for guests', () => {
      render(
        <MemoryRouter>
          <HeroContent />
        </MemoryRouter>
      );

      const exploreLink = screen.getByRole('link', { name: /explore library/i });
      expect(exploreLink).toHaveAttribute('href', '/library');

      const joinLink = screen.getByRole('link', { name: /join the community/i });
      expect(joinLink).toHaveAttribute('href', '/signup');
    });

    it('displays Go to Dashboard for authenticated users', () => {
      mockUser = { id: 'usr-123', email: 'reader@example.com' };

      render(
        <MemoryRouter>
          <HeroContent />
        </MemoryRouter>
      );

      const dashboardLink = screen.getByRole('link', { name: /go to dashboard/i });
      expect(dashboardLink).toHaveAttribute('href', '/dashboard');

      const communityLink = screen.getByRole('link', { name: /community feed/i });
      expect(communityLink).toHaveAttribute('href', '/social');
    });
  });

  describe('StructuredFooter Information Architecture & Discoverability', () => {
    it('renders all four semantic categories with required public routes', () => {
      render(
        <MemoryRouter>
          <StructuredFooter />
        </MemoryRouter>
      );

      // Section titles
      expect(screen.getByRole('heading', { name: /^Explore$/i })).toBeInTheDocument();
      expect(screen.getByRole('heading', { name: /^Community$/i })).toBeInTheDocument();
      expect(screen.getByRole('heading', { name: /^Support & About$/i })).toBeInTheDocument();
      expect(screen.getByRole('heading', { name: /^Legal & Policies$/i })).toBeInTheDocument();

      // Explore links
      const libraryLink = screen.getByRole('link', { name: /^Digital Library$/i });
      expect(libraryLink).toHaveAttribute('href', '/library');

      const articlesLink = screen.getByRole('link', { name: /^Articles & Stories$/i });
      expect(articlesLink).toHaveAttribute('href', '/articles');

      // Community links
      const feedLink = screen.getByRole('link', { name: /^Reading Feed$/i });
      expect(feedLink).toHaveAttribute('href', '/social');

      const liveRoomsLink = screen.getByRole('link', { name: /^Live Reading Rooms$/i });
      expect(liveRoomsLink).toHaveAttribute('href', '/social?tab=rooms');

      // Support & About links
      const aboutLink = screen.getByRole('link', { name: /^About Sahadhyayi$/i });
      expect(aboutLink).toHaveAttribute('href', '/about');

      const helpLink = screen.getByRole('link', { name: /^Help Center$/i });
      expect(helpLink).toHaveAttribute('href', '/help-center');

      // Legal links
      const privacyLink = screen.getByRole('link', { name: /^Privacy Policy$/i });
      expect(privacyLink).toHaveAttribute('href', '/privacy-policy');
    });

    it('renders the interactive Community Pulse trigger button', () => {
      render(
        <MemoryRouter>
          <StructuredFooter />
        </MemoryRouter>
      );

      const pulseButton = screen.getByRole('button', { name: /open live website stats/i });
      expect(pulseButton).toBeInTheDocument();
      expect(screen.getByText(/Live Website Stats/i)).toBeInTheDocument();
    });
  });

  describe('About Page Grounded Content & Contact Form Accessibility', () => {
    it('presents authentic platform capabilities rather than fabricated user numbers', () => {
      render(
        <MemoryRouter>
          <About />
        </MemoryRouter>
      );

      // Verified platform metric
      expect(screen.getByText('12,500+')).toBeInTheDocument();
      expect(screen.getByText('Curated Books')).toBeInTheDocument();

      // Sanskrit heritage
      expect(screen.getByText('Sanskrit Roots')).toBeInTheDocument();
      expect(screen.getByText('Silent Sprints')).toBeInTheDocument();
      expect(screen.getByText('Shared Notes')).toBeInTheDocument();

      // Fabricated claims should NOT be present
      expect(screen.queryByText('50K+')).not.toBeInTheDocument();
      expect(screen.queryByText('95%')).not.toBeInTheDocument();
    });

    it('ensures contact form has explicit required indicators and aria attributes', () => {
      render(
        <MemoryRouter>
          <About />
        </MemoryRouter>
      );

      const nameInput = screen.getByLabelText(/your name/i);
      expect(nameInput).toHaveAttribute('aria-required', 'true');

      const emailInput = screen.getByLabelText(/your email/i);
      expect(emailInput).toHaveAttribute('aria-required', 'true');

      const messageInput = screen.getByLabelText(/your note or feedback/i);
      expect(messageInput).toHaveAttribute('aria-required', 'true');

      const submitButton = screen.getByRole('button', { name: /send message/i });
      expect(submitButton).toBeInTheDocument();
    });
  });
});

