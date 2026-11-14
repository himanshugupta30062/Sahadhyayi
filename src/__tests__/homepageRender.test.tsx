/** @vitest-environment jsdom */
import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import Index from '@/pages/Index';

// Mock matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock IntersectionObserver
global.IntersectionObserver = class IntersectionObserver {
  constructor() {}
  observe() {}
  unobserve() {}
  disconnect() {}
} as any;

// Mock AnimatedHero to avoid Three.js in tests
vi.mock('@/components/AnimatedHero', () => ({
  default: () => <div data-testid="animated-hero-mock">Hero Mock</div>,
}));

// Mock SahadhyayiJourney to avoid Three.js in tests
vi.mock('@/components/home/journey/SahadhyayiJourney', () => ({
  SahadhyayiJourney: () => <div data-testid="journey-mock">Journey Mock</div>,
}));

describe('Index Homepage Render', () => {
  it('renders homepage without throwing', async () => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });

    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <ErrorBoundary fallback={<div>Error fallback</div>}>
            <Index />
          </ErrorBoundary>
        </MemoryRouter>
      </QueryClientProvider>
    );

    expect(screen.queryByText(/Something went wrong/i)).toBeNull();
    expect(screen.queryByText(/Error fallback/i)).toBeNull();
  });
});