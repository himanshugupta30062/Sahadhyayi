/** @vitest-environment jsdom */

import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import '@testing-library/jest-dom/vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

import { SahadhyayiJourney } from '@/components/home/journey/SahadhyayiJourney';
import { StudentCyclist } from '@/components/home/journey/StudentCyclist';
import { JourneyLandmarkArt } from '@/components/home/journey/JourneyLandmarkArt';
import { JourneyAiStation } from '@/components/home/journey/JourneyAiStation';
import { JOURNEY_DESTINATIONS } from '@/components/home/journey/journeyData';
import { BookExpertContext } from '@/contexts/book-expert.utils';

// Mock scrollIntoView
window.HTMLElement.prototype.scrollIntoView = vi.fn();

// Mock IntersectionObserver
class MockIntersectionObserver {
  observe = vi.fn();
  disconnect = vi.fn();
  unobserve = vi.fn();
}
window.IntersectionObserver = MockIntersectionObserver as unknown as typeof IntersectionObserver;

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe('Sahadhyayi Bicycle Adventure Journey Suite', () => {
  describe('Data Integrity & Architecture', () => {
    it('contains all 8 distinct literary destinations with valid routes', () => {
      expect(JOURNEY_DESTINATIONS).toHaveLength(8);

      const expectedDestinations = [
        { index: 1, id: 'library-city', route: '/library' },
        { index: 2, id: 'reading-valley', route: '/bookshelf' },
        { index: 3, id: 'reader-village', route: '/map' },
        { index: 4, id: 'reading-bridge', route: '/groups' },
        { index: 5, id: 'storytelling-forest', route: '/stories' },
        { index: 6, id: 'author-avenue', route: '/authors' },
        { index: 7, id: 'festival-hills', route: '/events' },
        { index: 8, id: 'ai-knowledge-station', route: '/book-expert' },
      ];

      expectedDestinations.forEach((exp, idx) => {
        const dest = JOURNEY_DESTINATIONS[idx];
        expect(dest.index).toBe(exp.index);
        expect(dest.id).toBe(exp.id);
        expect(dest.route).toBe(exp.route);
        expect(dest.distanceKm).toBeGreaterThanOrEqual(0);
        expect(dest.stats.length).toBeGreaterThan(0);
        expect(dest.features.length).toBeGreaterThan(0);
      });
    });
  });

  describe('StudentCyclist Vector Component', () => {
    it('renders student cyclist SVG with wheels, backpack, and rider details', () => {
      const { container } = render(
        <StudentCyclist size={140} isPedaling={true} facing="right" tiltAngle={5} />
      );

      const svg = container.querySelector('svg');
      expect(svg).toBeInTheDocument();
      expect(svg).toHaveAttribute('viewBox', '0 0 160 120');

      // Check headlamp glow gradient definition
      const defs = container.querySelector('defs');
      expect(defs).toBeInTheDocument();
      expect(defs?.innerHTML).toContain('lampGlow');
      expect(defs?.innerHTML).toContain('cyclistBob');

      // Check shadow and wheels
      const circles = container.querySelectorAll('circle');
      expect(circles.length).toBeGreaterThan(5);
    });

    it('flips direction when facing="left"', () => {
      const { container } = render(
        <StudentCyclist size={140} isPedaling={true} facing="left" />
      );

      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper.style.transform).toContain('scaleX(-1)');
    });
  });

  describe('JourneyLandmarkArt Component', () => {
    it('renders custom landmark artwork for all 8 destinations', () => {
      const ids = [
        'library-city',
        'reading-valley',
        'reader-village',
        'reading-bridge',
        'storytelling-forest',
        'author-avenue',
        'festival-hills',
        'ai-knowledge-station',
      ];

      ids.forEach((id) => {
        const { container } = render(<JourneyLandmarkArt id={id} isCurrent={true} />);
        const svg = container.querySelector('svg');
        expect(svg).toBeInTheDocument();
        cleanup();
      });
    });
  });

  describe('JourneyAiStation Component', () => {
    it('renders quick prompts and allows selecting and asking Book Expert AI', async () => {
      const mockSendMessage = vi.fn().mockResolvedValue(undefined);
      const mockToggleChat = vi.fn();

      const aiPrompts = [
        {
          id: 'prompt-1',
          label: 'Philosophy',
          question: 'Recommend 3 books similar to Siddhartha.',
          previewReply: '1. The Prophet\n2. The Razor’s Edge',
        },
        {
          id: 'prompt-2',
          label: 'Dystopia',
          question: 'Compare 1984 vs Brave New World.',
          previewReply: 'Surveillance vs Pleasure',
        },
      ];

      render(
        <MemoryRouter>
          <BookExpertContext.Provider
            value={{
              isOpen: false,
              toggleChat: mockToggleChat,
              sendMessage: mockSendMessage,
              messages: [],
              isLoading: false,
              clearMessages: vi.fn(),
            }}
          >
            <JourneyAiStation prompts={aiPrompts} />
          </BookExpertContext.Provider>
        </MemoryRouter>
      );

      expect(screen.getByText('Interactive Book Expert AI')).toBeInTheDocument();
      expect(screen.getByText(/Recommend 3 books similar to Siddhartha/i)).toBeInTheDocument();

      // Click second prompt
      const dystopiaBtn = screen.getByRole('button', { name: /dystopia/i });
      fireEvent.click(dystopiaBtn);
      expect(screen.getByText(/Compare 1984 vs Brave New World/i)).toBeInTheDocument();

      // Click "Ask AI Live Now"
      const askBtn = screen.getByRole('button', { name: /ask ai live now/i });
      fireEvent.click(askBtn);

      expect(mockToggleChat).toHaveBeenCalledTimes(1);
      expect(mockSendMessage).toHaveBeenCalledWith('Compare 1984 vs Brave New World.');
    });
  });

  describe('SahadhyayiJourney Main Scrollytelling Experience', () => {
    it('renders the complete journey experience with HUD, 8 destination nodes, and controls', () => {
      render(
        <MemoryRouter>
          <SahadhyayiJourney />
        </MemoryRouter>
      );

      // Section Header
      expect(screen.getByText('Interactive Literary Odyssey')).toBeInTheDocument();
      expect(screen.getByText('A Journey Through Sahadhyayi')).toBeInTheDocument();

      // HUD Waypoint Stepper: 8 stops
      const stop1Badge = screen.getByRole('button', { name: /jump to library city/i });
      expect(stop1Badge).toBeInTheDocument();

      // Check all 8 destinations are present
      expect(screen.getAllByRole('heading', { name: 'Library City', level: 3 }).length).toBeGreaterThan(0);
      expect(screen.getAllByRole('heading', { name: 'Reading Valley', level: 3 }).length).toBeGreaterThan(0);
      expect(screen.getAllByRole('heading', { name: 'Reader Village', level: 3 }).length).toBeGreaterThan(0);
      expect(screen.getAllByRole('heading', { name: 'Reading Together Bridge', level: 3 }).length).toBeGreaterThan(0);
      expect(screen.getAllByRole('heading', { name: 'Storytelling Forest', level: 3 }).length).toBeGreaterThan(0);
      expect(screen.getAllByRole('heading', { name: 'Author Avenue', level: 3 }).length).toBeGreaterThan(0);
      expect(screen.getAllByRole('heading', { name: 'Festival Hills', level: 3 }).length).toBeGreaterThan(0);
      expect(screen.getAllByRole('heading', { name: 'AI Knowledge Station', level: 3 }).length).toBeGreaterThan(0);

      // Key CTAs exist
      expect(screen.getByRole('link', { name: /explore digital library/i })).toHaveAttribute('href', '/library');
      expect(screen.getByRole('link', { name: /open your bookshelf/i })).toHaveAttribute('href', '/bookshelf');
      expect(screen.getByRole('link', { name: /find readers near me/i })).toHaveAttribute('href', '/map');
      expect(screen.getByRole('link', { name: /browse book clubs/i })).toHaveAttribute('href', '/groups');
      expect(screen.getByRole('link', { name: /read & write stories/i })).toHaveAttribute('href', '/stories');
      expect(screen.getByRole('link', { name: /meet renowned authors/i })).toHaveAttribute('href', '/authors');
      expect(screen.getByRole('link', { name: /explore literary events/i })).toHaveAttribute('href', '/events');
      expect(screen.getByRole('link', { name: /open book expert ai/i })).toHaveAttribute('href', '/book-expert');
    });

    it('advances destination when Next Stop button is clicked', () => {
      render(
        <MemoryRouter>
          <SahadhyayiJourney />
        </MemoryRouter>
      );

      const nextBtn = screen.getByRole('button', { name: /pedal to next stop/i });
      fireEvent.click(nextBtn);

      // Should now be on Stop 2 (Reading Valley)
      expect(screen.getByText(/stop 2 of 8/i)).toBeInTheDocument();
      expect(screen.getAllByText(/3.4 km/i).length).toBeGreaterThan(0);
    });

    it('toggles Auto Ride on and off', () => {
      render(
        <MemoryRouter>
          <SahadhyayiJourney />
        </MemoryRouter>
      );

      const autoRideBtn = screen.getByRole('button', { name: /start auto tour/i });
      fireEvent.click(autoRideBtn);

      expect(screen.getByText('Riding...')).toBeInTheDocument();

      const pauseBtn = screen.getByRole('button', { name: /pause bicycle tour/i });
      fireEvent.click(pauseBtn);

      expect(screen.getByText('Auto Ride')).toBeInTheDocument();
    });
  });
});
