import React from 'react';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import SocialMedia from './SocialMedia';
import { useAuth } from '@/contexts/authHelpers';

vi.mock('@/contexts/authHelpers', () => ({
  useAuth: vi.fn(),
}));

vi.mock('@/components/SEO', () => ({
  default: () => <div data-testid="seo-tag" />,
}));

vi.mock('@/components/social/BookPulseBar', () => ({
  BookPulseBar: () => <div data-testid="book-pulse-bar">Book Pulse</div>,
}));

vi.mock('@/components/social/BookReelsStrip', () => ({
  BookReelsStrip: () => <div data-testid="book-reels-strip">Book Reels</div>,
}));

vi.mock('@/components/social/SampleReaderFeedCards', () => ({
  SampleReaderFeedCards: () => <div data-testid="sample-feed-cards">Sample Cards</div>,
}));

vi.mock('@/components/social/SocialSurface', () => ({
  SocialSurface: () => <div data-testid="social-surface">Social Surface</div>,
}));

vi.mock('@/components/social/ReadingPassportCard', () => ({
  ReadingPassportCard: () => <div data-testid="passport-card">Passport</div>,
}));

vi.mock('@/hooks/useReadingRoom', () => ({
  useReadingRooms: () => ({ rooms: [], isLoading: false }),
}));

vi.mock('@/hooks/useGroupManagement', () => ({
  useGroups: () => ({ groups: [], isLoading: false }),
}));

vi.mock('@/hooks/useUserSearch', () => ({
  useAllUsers: () => ({ users: [], isLoading: false }),
}));

vi.mock('@/hooks/useFriends', () => ({
  useSendFriendRequest: () => ({ mutate: vi.fn(), isPending: false }),
}));

vi.mock('@/hooks/useReadingProgress', () => ({
  useReadingProgress: () => ({ progress: [], isLoading: false }),
}));

// Mock lazy-loaded panels
vi.mock('@/components/social/EnhancedSocialFeed', () => ({
  EnhancedSocialFeed: () => <div data-testid="enhanced-social-feed">Feed Content</div>,
}));

vi.mock('@/components/social/margins/MarginNotesFeed', () => ({
  default: () => <div data-testid="margins-feed">Margins Content</div>,
}));

vi.mock('@/components/social/threads/SpoilerThreadsFeed', () => ({
  default: () => <div data-testid="threads-feed">Threads Content</div>,
}));

vi.mock('@/components/social/rooms/ReadingRoomsPanel', () => ({
  default: () => <div data-testid="rooms-panel">Rooms Content</div>,
}));

vi.mock('@/components/social/dna/ReadingDnaPanel', () => ({
  default: () => <div data-testid="dna-panel">DNA Content</div>,
}));

vi.mock('@/components/social/BookReviewsFeed', () => ({
  default: () => <div data-testid="reviews-feed">Reviews Content</div>,
}));

vi.mock('@/components/social/EnhancedReadingMap', () => ({
  EnhancedReadingMap: () => <div data-testid="reading-map">Reading Map Content</div>,
}));

vi.mock('@/components/social/FriendsLocationMap', () => ({
  FriendsLocationMap: () => <div data-testid="friends-map">Friends Map Content</div>,
}));

vi.mock('@/components/social/ReadingGroups', () => ({
  ReadingGroups: () => <div data-testid="reading-groups">Groups Content</div>,
}));

vi.mock('@/components/social/EnhancedFriendsManager', () => ({
  EnhancedFriendsManager: () => <div data-testid="friends-manager">Friends Content</div>,
}));

describe('SocialMedia Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders guest landing with hero, pillars, and reels when user is not signed in', () => {
    (useAuth as any).mockReturnValue({ user: null });

    render(
      <MemoryRouter initialEntries={['/social']}>
        <SocialMedia />
      </MemoryRouter>
    );

    expect(screen.getByText('The Bookish Corner of the Internet')).toBeInTheDocument();
    expect(screen.getByText(/Where readers connect/i)).toBeInTheDocument();
    expect(screen.getByText('Create an account')).toBeInTheDocument();
    expect(screen.getByText('Sign in')).toBeInTheDocument();

    // Verify feature pillar cards
    expect(screen.getByText('Live Reading Rooms')).toBeInTheDocument();
    expect(screen.getByText('Public Marginalia')).toBeInTheDocument();
    expect(screen.getByText('Spoiler-Safe Threads')).toBeInTheDocument();
    expect(screen.getByText('Reading DNA Match')).toBeInTheDocument();
  });

  it('renders community feed and social tabs when user is signed in', async () => {
    (useAuth as any).mockReturnValue({
      user: { id: 'reader-123', email: 'reader@example.com' },
    });

    render(
      <MemoryRouter initialEntries={['/social?tab=feed']}>
        <SocialMedia />
      </MemoryRouter>
    );

    expect(screen.getAllByTestId('social-surface').length).toBeGreaterThan(0);
    const nav = screen.getByRole('navigation', { name: /social navigation/i });
    expect(within(nav).getByRole('button', { name: /^home$/i })).toBeInTheDocument();
    expect(within(nav).getByRole('button', { name: /book reviews/i })).toBeInTheDocument();
    expect(within(nav).getByRole('button', { name: /reading rooms/i })).toBeInTheDocument();
    expect(within(nav).getByRole('button', { name: /margin notes/i })).toBeInTheDocument();

    expect(await screen.findByTestId('enhanced-social-feed')).toBeInTheDocument();
  });

  it('switches to Marginalia tab when clicked', async () => {
    (useAuth as any).mockReturnValue({
      user: { id: 'reader-123', email: 'reader@example.com' },
    });

    render(
      <MemoryRouter initialEntries={['/social?tab=feed']}>
        <SocialMedia />
      </MemoryRouter>
    );

    const nav = screen.getByRole('navigation', { name: /social navigation/i });
    const marginsTab = within(nav).getByRole('button', { name: /margin notes/i });
    fireEvent.click(marginsTab);

    expect(await screen.findByTestId('margins-feed')).toBeInTheDocument();
  });

  it('switches to reading rooms, discussions, reviews, and DNA tabs when clicked', async () => {
    (useAuth as any).mockReturnValue({
      user: { id: 'reader-123', email: 'reader@example.com' },
    });

    render(
      <MemoryRouter initialEntries={['/social?tab=feed']}>
        <SocialMedia />
      </MemoryRouter>
    );

    const nav = screen.getByRole('navigation', { name: /social navigation/i });

    // Rooms tab
    fireEvent.click(within(nav).getByRole('button', { name: /reading rooms/i }));
    expect(await screen.findByTestId('rooms-panel')).toBeInTheDocument();

    // Discussions / threads tab
    fireEvent.click(within(nav).getByRole('button', { name: /discussions/i }));
    expect(await screen.findByTestId('threads-feed')).toBeInTheDocument();

    // Reviews tab
    fireEvent.click(within(nav).getByRole('button', { name: /book reviews/i }));
    expect(await screen.findByTestId('reviews-feed')).toBeInTheDocument();

    // DNA tab
    fireEvent.click(within(nav).getByRole('button', { name: /reading dna/i }));
    expect(await screen.findByTestId('dna-panel')).toBeInTheDocument();

    // Reader Map tab
    fireEvent.click(within(nav).getByRole('button', { name: /reader map/i }));
    expect(await screen.findByTestId('reading-map')).toBeInTheDocument();

    // Groups tab
    fireEvent.click(within(nav).getByRole('button', { name: /groups/i }));
    expect(await screen.findByTestId('reading-groups')).toBeInTheDocument();
  });
});
