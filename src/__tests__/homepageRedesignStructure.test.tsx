/** @vitest-environment jsdom */

import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import '@testing-library/jest-dom/vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

import HomeExploreCategories from '@/components/home/HomeExploreCategories';
import HomeSocialFeedPreview from '@/components/home/HomeSocialFeedPreview';
import HomeBookExpertShowcase from '@/components/home/HomeBookExpertShowcase';
import HomeReadAndWriteSection from '@/components/home/HomeReadAndWriteSection';
import HomeReadingPeopleSection from '@/components/home/HomeReadingPeopleSection';
import HomeAuthorsShowcase from '@/components/home/HomeAuthorsShowcase';
import HomeActivityHubSection from '@/components/home/HomeActivityHubSection';
import HomeResearchKnowledgeSection from '@/components/home/HomeResearchKnowledgeSection';
import HomeFinalCtaSection from '@/components/home/HomeFinalCtaSection';

// Mocks for hooks used across sections
const mockUseSocialPosts = vi.fn();
vi.mock('@/hooks/useSocialPosts', () => ({
  useSocialPosts: (filter: string) => mockUseSocialPosts(filter),
}));

const mockUsePublishedArticles = vi.fn();
vi.mock('@/hooks/useArticles', () => ({
  usePublishedArticles: () => mockUsePublishedArticles(),
}));

const mockUseStories = vi.fn();
vi.mock('@/hooks/useStories', () => ({
  useStories: () => mockUseStories(),
}));

const mockUseMarginNotes = vi.fn();
vi.mock('@/hooks/useMarginNotes', () => ({
  useMarginNotes: () => mockUseMarginNotes(),
}));

const mockUseAuthors = vi.fn();
vi.mock('@/hooks/useAuthors', () => ({
  useAuthors: () => mockUseAuthors(),
}));

const mockUseGroups = vi.fn();
vi.mock('@/hooks/useGroupManagement', () => ({
  useGroups: () => mockUseGroups(),
}));

const mockUseAuth = vi.fn();
vi.mock('@/contexts/authHelpers', () => ({
  useAuth: () => mockUseAuth(),
}));

afterEach(() => {
  cleanup();
});

describe('Homepage Redesign: Sections 03 to 11', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseAuth.mockReturnValue({ user: null });
    mockUseSocialPosts.mockReturnValue({ posts: [], isLoading: false });
    mockUsePublishedArticles.mockReturnValue({ data: [], isLoading: false });
    mockUseStories.mockReturnValue({ data: [], isLoading: false });
    mockUseMarginNotes.mockReturnValue({ data: [], isLoading: false });
    mockUseAuthors.mockReturnValue({ data: [], isLoading: false });
    mockUseGroups.mockReturnValue({ data: [], isLoading: false });
  });

  describe('Section 03: HomeExploreCategories', () => {
    it('renders all 6 major feature categories with accurate destination links', () => {
      render(
        <MemoryRouter>
          <HomeExploreCategories />
        </MemoryRouter>
      );

      expect(screen.getByText('Everything built for the deep reader')).toBeInTheDocument();
      expect(screen.getByText(/Six interconnected spaces designed to discover books/i)).toBeInTheDocument();

      // Check all 6 category titles
      expect(screen.getByText('Discover & Read')).toBeInTheDocument();
      expect(screen.getByText('The Social Feed')).toBeInTheDocument();
      expect(screen.getByText('Read & Write')).toBeInTheDocument();
      expect(screen.getByText('Authors & Experts')).toBeInTheDocument();
      expect(screen.getByText('Book Expert AI')).toBeInTheDocument();
      expect(screen.getByText('Activity Hub')).toBeInTheDocument();

      // Check key links
      const libraryLinks = screen.getAllByRole('link', { name: /discover & read/i });
      expect(libraryLinks.length).toBeGreaterThan(0);
      expect(libraryLinks[0]).toHaveAttribute('href', '/library');

      const socialLinks = screen.getAllByRole('link', { name: /the social feed/i });
      expect(socialLinks[0]).toHaveAttribute('href', '/social');

      const editorialLinks = screen.getAllByRole('link', { name: /read & write/i });
      expect(editorialLinks[0]).toHaveAttribute('href', '/articles');

      const authorsLinks = screen.getAllByRole('link', { name: /authors & experts/i });
      expect(authorsLinks[0]).toHaveAttribute('href', '/authors');

      const aiLinks = screen.getAllByRole('link', { name: /book expert ai/i });
      expect(aiLinks[0]).toHaveAttribute('href', '/book-expert');

      const activityLinks = screen.getAllByRole('link', { name: /activity hub/i });
      expect(activityLinks[0]).toHaveAttribute('href', '/activity');
    });
  });

  describe('Section 04: HomeSocialFeedPreview', () => {
    it('renders social reading section with trending discussion and feed link', () => {
      render(
        <MemoryRouter>
          <HomeSocialFeedPreview />
        </MemoryRouter>
      );

      expect(screen.getByText('The social reading experience')).toBeInTheDocument();
      expect(screen.getByText(/Real posts from fellow readers/i)).toBeInTheDocument();

      const feedLink = screen.getByRole('link', { name: /explore full community feed/i });
      expect(feedLink).toHaveAttribute('href', '/social');

      // Check trending discussion banner
      expect(screen.getByText(/Trending Discussion:/i)).toBeInTheDocument();
      const discussionLink = screen.getByRole('link', { name: /join discussion/i });
      expect(discussionLink).toHaveAttribute('href', '/social?tab=threads');
    });

    it('displays fallback community discussions when no remote posts are returned', () => {
      render(
        <MemoryRouter>
          <HomeSocialFeedPreview />
        </MemoryRouter>
      );

      expect(screen.getByText('Ananya Sharma')).toBeInTheDocument();
      expect(screen.getByText('Gitanjali: Song Offerings')).toBeInTheDocument();
      expect(screen.getByText('Vikramaditya Roy')).toBeInTheDocument();
      expect(screen.getByText('Godaan (The Gift of a Cow)')).toBeInTheDocument();
    });
  });

  describe('Section 05: HomeBookExpertShowcase', () => {
    it('renders Gemini-powered AI showcase with interactive inquiry selector', () => {
      render(
        <MemoryRouter>
          <HomeBookExpertShowcase />
        </MemoryRouter>
      );

      expect(screen.getByText('Meet Your Book Expert AI')).toBeInTheDocument();
      expect(screen.getByText(/Your personal AI companion for everything books/i)).toBeInTheDocument();
      expect(screen.getByText(/Discover books, understand complex ideas/i)).toBeInTheDocument();

      // Click inquiry prompt
      const critiquePill = screen.getByText('Literary Critique');
      fireEvent.click(critiquePill);

      // Verify prompt text update
      const matchedPrompts = screen.getAllByText(/Compare the critique of state control in 1984 vs Brave New World/i);
      expect(matchedPrompts.length).toBeGreaterThanOrEqual(1);

      // Launch CTA buttons
      expect(screen.getByRole('button', { name: /ask book expert ai/i })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /explore books/i })).toHaveAttribute('href', '/library');
    });
  });

  describe('Section 06: HomeReadAndWriteSection', () => {
    it('supports tab switching between Articles and Stories with respective action links', () => {
      render(
        <MemoryRouter>
          <HomeReadAndWriteSection />
        </MemoryRouter>
      );

      expect(screen.getByText('Two distinct reading and publishing experiences')).toBeInTheDocument();
      expect(screen.getByText(/Explore long-form essays, literary critiques/i)).toBeInTheDocument();

      // Default tab: Articles
      const writeArticleLink = screen.getByRole('link', { name: /write an article/i });
      expect(writeArticleLink).toHaveAttribute('href', '/articles/write');

      // Switch to Stories tab
      const storiesBtn = screen.getByRole('button', { name: /short stories & serials/i });
      fireEvent.click(storiesBtn);

      // Verify stories CTA appears
      const publishStoryLink = screen.getByRole('link', { name: /publish story/i });
      expect(publishStoryLink).toHaveAttribute('href', '/social?tab=stories');

      const exploreStoriesLink = screen.getByRole('link', { name: /explore all stories/i });
      expect(exploreStoriesLink).toHaveAttribute('href', '/stories');
    });
  });

  describe('Section 07: HomeReadingPeopleSection', () => {
    it('renders reader map, Reading DNA, rooms, and marginalia connections', () => {
      render(
        <MemoryRouter>
          <HomeReadingPeopleSection />
        </MemoryRouter>
      );

      expect(screen.getByText('Find your reading people')).toBeInTheDocument();
      expect(screen.getByText('Local Reader Map')).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /local reader map/i })).toHaveAttribute('href', '/map');

      expect(screen.getByText('Reader Map by Book')).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /reader map by book/i })).toHaveAttribute('href', '/reader-map');

      expect(screen.getByText('Reading DNA')).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /reading dna/i })).toHaveAttribute('href', '/social?tab=dna');

      expect(screen.getByText('Reading Rooms')).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /reading rooms/i })).toHaveAttribute('href', '/social?tab=rooms');
    });
  });

  describe('Section 08: HomeAuthorsShowcase', () => {
    it('renders author connect and directory links for critics and scientists', () => {
      render(
        <MemoryRouter>
          <HomeAuthorsShowcase />
        </MemoryRouter>
      );

      expect(screen.getByText('Discover authors & literary minds')).toBeInTheDocument();

      const authorsDirectoryLink = screen.getByRole('link', { name: /browse all authors & experts/i });
      expect(authorsDirectoryLink).toHaveAttribute('href', '/authors');

      const criticsLink = screen.getByRole('link', { name: /reviewers & critics/i });
      expect(criticsLink).toHaveAttribute('href', '/reviewers-critics');

      const scientistsLink = screen.getByRole('link', { name: /scientists & thinkers/i });
      expect(scientistsLink).toHaveAttribute('href', '/scientists');

      const connectLinks = screen.getAllByRole('link', { name: /author connect/i });
      expect(connectLinks.length).toBeGreaterThan(0);
      expect(connectLinks[0]).toHaveAttribute('href', '/author-connect');
    });
  });

  describe('Section 09: HomeActivityHubSection', () => {
    it('renders 4 activity categories linking to games, challenges, groups, and events', () => {
      render(
        <MemoryRouter>
          <HomeActivityHubSection />
        </MemoryRouter>
      );

      expect(screen.getByText('Activity Hub: Games, challenges & meetups')).toBeInTheDocument();
      expect(screen.getByText(/Reading comes alive through interactive challenges/i)).toBeInTheDocument();

      const gamesLink = screen.getByRole('link', { name: /book games & trivia/i });
      expect(gamesLink).toHaveAttribute('href', '/games');

      const challengesLink = screen.getByRole('link', { name: /reading challenges/i });
      expect(challengesLink).toHaveAttribute('href', '/activity?tab=challenges');

      const groupsLink = screen.getByRole('link', { name: /^reading groups\b/i });
      expect(groupsLink).toHaveAttribute('href', '/social?tab=groups');

      const eventsLink = screen.getByRole('link', { name: /events & festivals/i });
      expect(eventsLink).toHaveAttribute('href', '/events');
    });
  });

  describe('Section 10: HomeResearchKnowledgeSection', () => {
    it('renders scholarly research papers hub with paper discovery and submission links', () => {
      render(
        <MemoryRouter>
          <HomeResearchKnowledgeSection />
        </MemoryRouter>
      );

      expect(screen.getByText('Research & scholarly knowledge')).toBeInTheDocument();
      expect(screen.getByText(/Beyond popular fiction and casual reading/i)).toBeInTheDocument();

      const researchCatalogLink = screen.getByRole('link', { name: /explore research catalogue/i });
      expect(researchCatalogLink).toHaveAttribute('href', '/research-papers');

      const submitPaperLink = screen.getByRole('link', { name: /submit a paper/i });
      expect(submitPaperLink.getAttribute('href')).toContain('/research-papers/submit');

      const savedResearchLink = screen.getByRole('link', { name: /my saved research/i });
      expect(savedResearchLink).toHaveAttribute('href', '/my-saved-research');
    });
  });

  describe('Section 11: HomeFinalCtaSection', () => {
    it('renders warm closing CTA with Sanskrit origin badge and dynamic auth-aware buttons', () => {
      const { rerender } = render(
        <MemoryRouter>
          <HomeFinalCtaSection />
        </MemoryRouter>
      );

      expect(screen.getByText('सहाध्यायी')).toBeInTheDocument();
      expect(screen.getByText('Fellow Reader')).toBeInTheDocument();
      expect(screen.getByText(/Ready to make reading a richer, deeper journey\?/i)).toBeInTheDocument();

      // Guest state
      const joinLink = screen.getByRole('link', { name: /join the community — it’s free/i });
      expect(joinLink).toHaveAttribute('href', '/signup');

      const libraryLink = screen.getByRole('link', { name: /explore the digital library/i });
      expect(libraryLink).toHaveAttribute('href', '/library');

      // Authenticated state
      mockUseAuth.mockReturnValue({ user: { id: 'usr-123', email: 'reader@example.com' } });
      rerender(
        <MemoryRouter>
          <HomeFinalCtaSection />
        </MemoryRouter>
      );

      const dashboardLink = screen.getByRole('link', { name: /open your dashboard/i });
      expect(dashboardLink).toHaveAttribute('href', '/dashboard');
    });
  });
});
