/** @vitest-environment jsdom */

import React from 'react';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';
import '@testing-library/jest-dom/vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

import { SahadhyayiJourney } from '@/components/home/journey/SahadhyayiJourney';
import { StudentCyclist } from '@/components/home/journey/StudentCyclist';
import { JourneyLandmarkArt } from '@/components/home/journey/JourneyLandmarkArt';
import { JourneyAiStation } from '@/components/home/journey/JourneyAiStation';
import { JourneyDestinationNode } from '@/components/home/journey/JourneyDestinationNode';
import { JOURNEY_DESTINATIONS } from '@/components/home/journey/journeyData';
import { BookExpertContext } from '@/contexts/book-expert.utils';

window.HTMLElement.prototype.scrollIntoView = vi.fn();

class MockIntersectionObserver {
  observe = vi.fn();
  disconnect = vi.fn();
  unobserve = vi.fn();
}
window.IntersectionObserver = MockIntersectionObserver as unknown as typeof IntersectionObserver;

const registeredRoutes = new Set(
  [...readFileSync(resolve(process.cwd(), 'src/App.tsx'), 'utf8').matchAll(/<Route\s+path="([^"]+)"/g)]
    .map((match) => match[1])
);

const isRegisteredRoute = (route: string) =>
  registeredRoutes.has(route) ||
  [...registeredRoutes].some((registered) =>
    registered.startsWith(route + '/:') && registered.endsWith('?')
  );

const makeBookExpertContext = (overrides: Record<string, unknown> = {}) => ({
  isOpen: false,
  loading: false,
  messages: [],
  toggleChat: vi.fn(),
  closeChat: vi.fn(),
  clearConversation: vi.fn(),
  sendMessage: vi.fn().mockResolvedValue(undefined),
  sendFeedback: vi.fn().mockResolvedValue(undefined),
  ...overrides,
});

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe('Sahadhyayi Bicycle Adventure Journey', () => {
  describe('Destination menu integrity', () => {
    it('contains eight destinations and gives every stop a visible, useful menu preview', () => {
      expect(JOURNEY_DESTINATIONS).toHaveLength(8);

      JOURNEY_DESTINATIONS.forEach((destination, index) => {
        expect(destination.index).toBe(index + 1);
        expect(destination.title.trim()).not.toBe('');
        expect(destination.menuPreview.trim()).not.toBe('');
        expect(destination.menuItems.length).toBeGreaterThan(0);
        destination.menuItems.forEach((item) => {
          expect(item.label.trim()).not.toBe('');
          expect(item.description.trim()).not.toBe('');
          expect(item.route || item.action).toBeTruthy();
        });
      });
    });

    it('points every menu link to an actual App route and removes the broken destinations', () => {
      const menuRoutes = JOURNEY_DESTINATIONS.flatMap((destination) =>
        destination.menuItems.flatMap((item) => item.route ? [item.route] : [])
      );

      menuRoutes.forEach((route) => {
        expect(isRegisteredRoute(route), `Expected ${route} to exist in App.tsx`).toBe(true);
      });

      expect(menuRoutes).not.toContain('/book-expert');
      expect(menuRoutes).not.toContain('/author-interviews');
      expect(JOURNEY_DESTINATIONS[5].menuItems.map((item) => item.route)).toContain('/author-connect');
      expect(JOURNEY_DESTINATIONS[7].menuItems[0].action).toBe('open-book-expert');
    });

    it('marks all destinations that require authentication for visitors', () => {
      const protectedMenuItems = JOURNEY_DESTINATIONS.flatMap((destination) => destination.menuItems)
        .filter((item) => item.requiresAuth);

      expect(protectedMenuItems.map((item) => item.route)).toEqual(
        expect.arrayContaining(['/dashboard', '/map', '/reader-map', '/groups'])
      );
    });
  });

  describe('Student cyclist and landmark artwork', () => {
    it('renders the student cyclist SVG with wheels and rider details', () => {
      const { container } = render(
        <StudentCyclist size={140} isPedaling={true} facing="right" tiltAngle={5} />
      );

      const svg = container.querySelector('svg');
      expect(svg).toBeInTheDocument();
      expect(svg).toHaveAttribute('viewBox', '0 0 160 120');
      expect(container.querySelector('defs')).toBeInTheDocument();
      expect(container.querySelectorAll('circle').length).toBeGreaterThan(5);
    });

    it('renders custom landmark artwork for all eight destinations', () => {
      JOURNEY_DESTINATIONS.forEach((destination) => {
        const { container } = render(<JourneyLandmarkArt id={destination.id} isCurrent />);
        expect(container.querySelector('svg')).toBeInTheDocument();
        cleanup();
      });
    });
  });

  describe('Book Expert AI entry point', () => {
    it('opens the existing assistant and sends the selected prompt without navigating to a missing page', async () => {
      const context = makeBookExpertContext();
      const aiPrompts = [
        {
          id: 'prompt-1',
          label: 'Philosophy',
          question: 'Recommend 3 books similar to Siddhartha.',
          previewReply: 'The Prophet and The Razor’s Edge',
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
          <BookExpertContext.Provider value={context as never}>
            <JourneyAiStation prompts={aiPrompts} />
          </BookExpertContext.Provider>
        </MemoryRouter>
      );

      expect(screen.getByText('Meet Book Expert AI')).toBeInTheDocument();
      fireEvent.click(screen.getByRole('button', { name: /dystopia/i }));
      fireEvent.click(screen.getByRole('button', { name: /ask ai live now/i }));

      await waitFor(() => {
        expect(context.toggleChat).toHaveBeenCalledTimes(1);
        expect(context.sendMessage).toHaveBeenCalledWith('Compare 1984 vs Brave New World.');
      });
      expect(screen.queryByRole('link', { name: /full screen/i })).not.toBeInTheDocument();
    });

    it('opens Book Expert from the destination menu action', () => {
      const context = makeBookExpertContext();
      const destination = JOURNEY_DESTINATIONS[7];

      render(
        <MemoryRouter>
          <BookExpertContext.Provider value={context as never}>
            <JourneyDestinationNode destination={destination} isActive isPassed={false} onSelect={vi.fn()} />
          </BookExpertContext.Provider>
        </MemoryRouter>
      );

      fireEvent.click(screen.getByRole('button', { name: /open book expert ai/i }));
      expect(context.toggleChat).toHaveBeenCalledTimes(1);
    });
  });

  describe('Visible journey menus', () => {
    it('renders the winding trail, cyclist and all eight destinations with menu cues visible', () => {
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
      expect(container.querySelectorAll('.journey-scenic-stop__menu-cue')).toHaveLength(8);

      expect(screen.getByText(/Choose a place/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /jump to library city/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /pedal to previous stop/i })).toBeDisabled();
      expect(screen.getByRole('button', { name: /pedal to next stop/i })).toBeInTheDocument();
    });

    it('shows a destination menu after selecting a landmark without requiring hover', () => {
      render(
        <MemoryRouter>
          <SahadhyayiJourney />
        </MemoryRouter>
      );

      fireEvent.click(screen.getByRole('button', { name: /explore Reading Valley/i }));

      expect(screen.getByText('Choose where to go')).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /my bookshelf/i })).toHaveAttribute('href', '/bookshelf');
      expect(screen.getByRole('link', { name: /reading dashboard/i })).toHaveAttribute('href', '/dashboard');
      expect(screen.getByText('Sign in', { selector: 'span' })).toBeInTheDocument();
      expect(screen.getByText(/stop 2 of 8/i)).toBeInTheDocument();
    });

    it('keeps the menu links visible for every selected destination', () => {
      render(
        <MemoryRouter>
          <SahadhyayiJourney />
        </MemoryRouter>
      );

      JOURNEY_DESTINATIONS.forEach((destination) => {
        fireEvent.click(screen.getByRole('button', { name: new RegExp('explore ' + destination.title, 'i') }));
        expect(screen.getByRole('heading', { name: 'Choose where to go' })).toBeInTheDocument();

        destination.menuItems.forEach((item) => {
          if (item.route) {
            expect(screen.getByRole('link', { name: new RegExp(item.label, 'i') })).toHaveAttribute('href', item.route);
          } else {
            expect(screen.getByRole('button', { name: new RegExp(item.label, 'i') })).toBeInTheDocument();
          }
        });
      });
    });

    it('advances the active stop when Next Stop is clicked and updates progress', () => {
      render(
        <MemoryRouter>
          <SahadhyayiJourney />
        </MemoryRouter>
      );

      fireEvent.click(screen.getByRole('button', { name: /pedal to next stop/i }));
      expect(screen.getByText(/stop 2 of 8/i)).toBeInTheDocument();
      expect(screen.getByText('14% of the journey explored')).toBeInTheDocument();
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
