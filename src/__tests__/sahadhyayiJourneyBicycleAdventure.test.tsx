/** @vitest-environment jsdom */

import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import '@testing-library/jest-dom/vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

import { SahadhyayiJourney } from '@/components/home/journey/SahadhyayiJourney';
import { StudentCyclist } from '@/components/home/journey/StudentCyclist';
import { JourneyLandmarkArt } from '@/components/home/journey/JourneyLandmarkArt';
import { JourneyAiStation } from '@/components/home/journey/JourneyAiStation';
import { JOURNEY_DESTINATIONS } from '@/components/home/journey/journeyData';
import { BookExpertContext } from '@/contexts/book-expert.utils';

window.HTMLElement.prototype.scrollIntoView = vi.fn();

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
    it('contains all 8 distinct literary destinations with valid routes and feature descriptions', () => {
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

      expectedDestinations.forEach((expected, index) => {
        const destination = JOURNEY_DESTINATIONS[index];
        expect(destination.index).toBe(expected.index);
        expect(destination.id).toBe(expected.id);
        expect(destination.route).toBe(expected.route);
        expect(destination.distanceKm).toBeGreaterThanOrEqual(0);
        expect(destination.stats.length).toBeGreaterThan(0);
        expect(destination.features.length).toBeGreaterThan(0);
        destination.features.forEach((feature) => {
          expect(feature.label.trim().length).toBeGreaterThan(0);
          expect(feature.description.trim().length).toBeGreaterThan(0);
        });
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

      const defs = container.querySelector('defs');
      expect(defs).toBeInTheDocument();
      expect(defs?.innerHTML).toContain('lampGlow');
      expect(defs?.innerHTML).toContain('cyclistBob');

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
        expect(container.querySelector('svg')).toBeInTheDocument();
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

      fireEvent.click(screen.getByRole('button', { name: /dystopia/i }));
      expect(screen.getByText(/Compare 1984 vs Brave New World/i)).toBeInTheDocument();

      fireEvent.click(screen.getByRole('button', { name: /ask ai live now/i }));
      expect(mockToggleChat).toHaveBeenCalledTimes(1);
      expect(mockSendMessage).toHaveBeenCalledWith('Compare 1984 vs Brave New World.');
    });
  });

  describe('Interactive Scenic Cycling Journey', () => {
    it('renders the winding trail, moving cyclist, and all eight interactive landmarks', () => {
      const { container } = render(
        <MemoryRouter>
          <SahadhyayiJourney />
        </MemoryRouter>
      );

      expect(screen.getByText('Explore Sahadhyayi as You Ride')).toBeInTheDocument();
      expect(screen.getByText('A Journey Through Sahadhyayi')).toBeInTheDocument();
      expect(container.querySelector('[data-testid="journey-scenic-trail"]')).toBeInTheDocument();
      expect(container.querySelector('.journey-scenic-trail__path-measure')).toHaveAttribute('d');
      expect(container.querySelector('.journey-scenic-trail__cyclist svg')).toBeInTheDocument();

      for (let index = 1; index <= 8; index += 1) {
        expect(screen.getByTestId('journey-landmark-' + index)).toBeInTheDocument();
      }

      expect(screen.getByRole('button', { name: /jump to library city/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /pedal to previous stop/i })).toBeDisabled();
      expect(screen.getByRole('button', { name: /pedal to next stop/i })).toBeInTheDocument();
    });

    it('reveals destination features on hover and navigates to the selected stop on tap/click', () => {
      render(
        <MemoryRouter>
          <SahadhyayiJourney />
        </MemoryRouter>
      );

      const libraryLandmark = screen.getByTestId('journey-landmark-1');
      fireEvent.mouseEnter(libraryLandmark);
      expect(screen.getAllByText('Public Domain Classics').length).toBeGreaterThan(0);
      expect(screen.getAllByText('Instant In-Browser Reader').length).toBeGreaterThan(0);

      fireEvent.click(screen.getByRole('button', { name: /explore Reading Valley/i }));
      expect(screen.getByText(/stop 2 of 8/i)).toBeInTheDocument();
      expect(screen.getAllByRole('heading', { name: 'Reading Valley', level: 3 }).length).toBeGreaterThan(0);
      expect(screen.getAllByRole('link', { name: /open your bookshelf/i }).some((link) => link.getAttribute('href') === '/bookshelf')).toBe(true);
    });

    it('keeps all existing destinations reachable from the interactive map', () => {
      render(
        <MemoryRouter>
          <SahadhyayiJourney />
        </MemoryRouter>
      );

      const destinations = [
        { button: /explore Library City/i, link: /explore digital library/i, route: '/library' },
        { button: /explore Reading Valley/i, link: /open your bookshelf/i, route: '/bookshelf' },
        { button: /explore Reader Village/i, link: /find readers near me/i, route: '/map' },
        { button: /explore Reading Together Bridge/i, link: /browse book clubs/i, route: '/groups' },
        { button: /explore Storytelling Forest/i, link: /read & write stories/i, route: '/stories' },
        { button: /explore Author Avenue/i, link: /meet renowned authors/i, route: '/authors' },
        { button: /explore Festival Hills/i, link: /explore literary events/i, route: '/events' },
        { button: /explore AI Knowledge Station/i, link: /open book expert ai/i, route: '/book-expert' },
      ];

      destinations.forEach((destination) => {
        fireEvent.click(screen.getByRole('button', { name: destination.button }));
        expect(screen.getAllByRole('link', { name: destination.link }).some((link) => link.getAttribute('href') === destination.route)).toBe(true);
      });
    });

    it('advances the active stop when Next Stop is clicked', () => {
      render(
        <MemoryRouter>
          <SahadhyayiJourney />
        </MemoryRouter>
      );

      fireEvent.click(screen.getByRole('button', { name: /pedal to next stop/i }));
      expect(screen.getByText(/stop 2 of 8/i)).toBeInTheDocument();
      expect(screen.getAllByText(/3.4 km/i).length).toBeGreaterThan(0);
    });

    it('toggles Auto Ride on and off', () => {
      render(
        <MemoryRouter>
          <SahadhyayiJourney />
        </MemoryRouter>
      );

      fireEvent.click(screen.getByRole('button', { name: /start auto tour/i }));
      expect(screen.getByText('Riding...')).toBeInTheDocument();

      fireEvent.click(screen.getByRole('button', { name: /pause bicycle tour/i }));
      expect(screen.getByText('Auto Ride')).toBeInTheDocument();
    });
  });
});