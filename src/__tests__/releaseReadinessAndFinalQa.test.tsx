/** @vitest-environment jsdom */

import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import '@testing-library/jest-dom/vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route, Link } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import App from '@/App';
import NotFound from '@/pages/NotFound';
import ProtectedRoute from '@/components/ProtectedRoute';
import BookCard from '@/components/library/BookCard';
import { FollowButton } from '@/components/authors/FollowButton';
import UserProfileModal from '@/components/profile/UserProfileModal';

// Mock contexts
const mockUser = {
  id: 'qa-user-101',
  email: 'qa.tester@sahadhyayi.com',
  user_metadata: { full_name: 'QA Tester', name: 'QA Tester' },
};
let activeUser: typeof mockUser | null = null;

vi.mock('@/contexts/authHelpers', () => ({
  useAuth: () => ({
    user: activeUser,
    session: activeUser ? { user: activeUser } : null,
    loading: false,
    signOut: vi.fn(),
  }),
}));

// Mock universal supabase client
vi.mock('@/integrations/supabase/client-universal', () => ({
  supabase: {
    from: () => ({
      select: () => ({
        eq: () => ({
          maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
          single: vi.fn().mockResolvedValue({ data: null, error: null }),
        }),
        order: () => ({
          limit: vi.fn().mockResolvedValue({ data: [], error: null }),
        }),
      }),
      insert: vi.fn().mockResolvedValue({ error: null }),
      update: vi.fn().mockResolvedValue({ error: null }),
      delete: vi.fn().mockResolvedValue({ error: null }),
    }),
    rpc: vi.fn().mockResolvedValue({ data: null, error: null }),
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: null }),
      getSession: vi.fn().mockResolvedValue({ data: { session: null }, error: null }),
      onAuthStateChange: vi.fn(() => ({ data: { subscription: { unsubscribe: vi.fn() } } })),
    },
  },
}));

vi.mock('@/hooks/useAuthorFollow', () => ({
  useAuthorFollow: () => ({
    isFollowing: false,
    isLoading: false,
    toggleFollow: vi.fn(),
  }),
}));

vi.mock('@/hooks/useFriends', () => ({
  useFriends: () => ({ data: [], isLoading: false }),
  useFriendRequests: () => ({ data: [], isLoading: false }),
  useSendFriendRequest: () => ({ mutateAsync: vi.fn(), isPending: false }),
}));

const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

describe('Phase 8: Final QA, Design Consistency, Performance and Release Readiness', () => {
  beforeEach(() => {
    activeUser = null;
    vi.clearAllMocks();
  });

  describe('Route Integrity & Navigation Guarding', () => {
    it('redirects unauthenticated users trying to access protected routes to /signin', () => {
      activeUser = null;
      render(
        <MemoryRouter initialEntries={['/dashboard']}>
          <Routes>
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <div>Secret Dashboard Content</div>
                </ProtectedRoute>
              }
            />
            <Route path="/signin" element={<div>Sign In Screen</div>} />
          </Routes>
        </MemoryRouter>
      );

      // Secret dashboard content must NOT render
      expect(screen.queryByText('Secret Dashboard Content')).not.toBeInTheDocument();
      // Should redirect to /signin
      expect(screen.getByText('Sign In Screen')).toBeInTheDocument();
    });

    it('renders 404 NotFound page with semantic brand tokens and recovery links for broken URLs', () => {
      render(
        <MemoryRouter initialEntries={['/nonexistent-route-xyz']}>
          <Routes>
            <Route path="/" element={<div>Home</div>} />
            <Route path="/library" element={<div>Library Catalog</div>} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </MemoryRouter>
      );

      expect(screen.getByText('404')).toBeInTheDocument();
      expect(screen.getByText('Page Not Found')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Return to Home/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Go Back/i })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: 'Library' })).toHaveAttribute('href', '/library');
    });
  });

  describe('Library Resource Integrity & Accurate Reader Actions', () => {
    it('accurately identifies Google Books preview and shows Read Online action, NEVER Download PDF', () => {
      const googleBooksPreviewBook = {
        id: 'book-durga-saptashati',
        title: 'Shri Durga Saptashati',
        author: 'Sage Markandeya',
        cover_image_url: 'https://books.google.com/covers/durga.jpg',
        description: 'Sacred Sanskrit recitation from the Markandeya Purana.',
        genre: 'Spiritual',
        language: 'Sanskrit',
        quality_score: 9500,
        completeness_score: 9500,
        pdf_url: null,
        google_books_id: 'durga-gbooks-id',
        external_url: 'https://books.google.com/books?id=durga-gbooks-id&printsec=frontcover',
        access_status: 'preview',
      };

      const queryClient = createTestQueryClient();
      render(
        <QueryClientProvider client={queryClient}>
          <MemoryRouter>
            <BookCard book={googleBooksPreviewBook as any} />
          </MemoryRouter>
        </QueryClientProvider>
      );

      // Must display title and author
      expect(screen.getByText('Shri Durga Saptashati')).toBeInTheDocument();
      expect(screen.getByText('Sage Markandeya')).toBeInTheDocument();

      // Must display Online Reader / Preview badge
      expect(screen.getByText(/Online Reader|Preview/i)).toBeInTheDocument();

      // Must have "Read Online" action
      expect(screen.getByRole('link', { name: /Read Online/i })).toBeInTheDocument();

      // MUST NEVER offer a fake Download PDF button for a preview/reader link
      expect(screen.queryByRole('button', { name: /Download PDF/i })).not.toBeInTheDocument();
    });

    it('displays verified direct PDF badge and Download action for confirmed direct PDF records', () => {
      const directPdfBook = {
        id: 'book-autobiography-yogi',
        title: 'Autobiography of a Yogi',
        author: 'Paramahansa Yogananda',
        cover_image_url: 'https://example.com/yogi.jpg',
        description: 'Complete spiritual classic with original full text.',
        genre: 'Biography',
        language: 'English',
        quality_score: 10500,
        completeness_score: 10500,
        pdf_url: 'https://example.com/books/autobiography-of-a-yogi.pdf',
        access_status: 'verified',
      };

      const queryClient = createTestQueryClient();
      render(
        <QueryClientProvider client={queryClient}>
          <MemoryRouter>
            <BookCard book={directPdfBook as any} />
          </MemoryRouter>
        </QueryClientProvider>
      );

      expect(screen.getByText('Autobiography of a Yogi')).toBeInTheDocument();
      expect(screen.getByText('PDF')).toBeInTheDocument();
      expect(screen.getAllByRole('button', { name: /Download PDF/i }).length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('User Privacy & Cross-Application WCAG Accessibility', () => {
    it('guarantees reader privacy in UserProfileModal (no email, no fabricated counters)', () => {
      const publicUser = {
        id: 'user-777',
        name: 'Meera Bai',
        username: 'meerabai',
        email: 'confidential_personal@domain.com', // MUST NEVER BE SHOWN
        profile_picture_url: '',
        bio: 'Devotional poet and mystic seeker.',
        stories_written_count: 12,
        stories_read_count: 45,
      };

      const queryClient = createTestQueryClient();
      render(
        <QueryClientProvider client={queryClient}>
          <UserProfileModal
            isOpen={true}
            onClose={vi.fn()}
            user={publicUser}
          />
        </QueryClientProvider>
      );

      expect(screen.getByText('Meera Bai')).toBeInTheDocument();
      expect(screen.getByText('@meerabai')).toBeInTheDocument();
      // Email is strictly forbidden from public DOM
      expect(screen.queryByText('confidential_personal@domain.com')).not.toBeInTheDocument();
      expect(screen.queryByText(/@domain\.com/i)).not.toBeInTheDocument();
      // No fabricated stats
      expect(screen.queryByText(/0 Followers/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/0 Following/i)).not.toBeInTheDocument();
    });

    it('provides accessible labels on FollowButton across authenticated and guest states', () => {
      const queryClient = createTestQueryClient();
      const { rerender } = render(
        <QueryClientProvider client={queryClient}>
          <FollowButton authorId="author-kalidasa" showText={false} />
        </QueryClientProvider>
      );

      // Authenticated state (activeUser is null in beforeEach)
      const guestButton = screen.getByRole('button', { name: /Follow author \(sign in required\)/i });
      expect(guestButton).toBeInTheDocument();

      // When authenticated
      activeUser = mockUser;
      rerender(
        <QueryClientProvider client={queryClient}>
          <FollowButton authorId="author-kalidasa" showText={false} />
        </QueryClientProvider>
      );

      const authButton = screen.getByRole('button', { name: /Follow author/i });
      expect(authButton).toBeInTheDocument();
    });
  });
});
