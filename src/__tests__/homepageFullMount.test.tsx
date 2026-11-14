/** @vitest-environment jsdom */
import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import Index from '@/pages/Index';

describe('Homepage Full Mount Deep Test', () => {
  beforeEach(() => {
    // Proper IntersectionObserver mock class
    class MockIntersectionObserver {
      observe = vi.fn((target: Element) => {
        this.callback([{ isIntersecting: true, target } as IntersectionObserverEntry], this as unknown as IntersectionObserver);
      });
      unobserve = vi.fn();
      disconnect = vi.fn();
      callback: IntersectionObserverCallback;
      constructor(callback: IntersectionObserverCallback) {
        this.callback = callback;
      }
    }
    window.IntersectionObserver = MockIntersectionObserver as unknown as typeof IntersectionObserver;
  });

  it('renders every section of the homepage without any ErrorBoundary crash', async () => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });

    const onError = vi.fn();

    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <ErrorBoundary onError={onError}>
            <Index />
          </ErrorBoundary>
        </MemoryRouter>
      </QueryClientProvider>
    );

    // Wait for all lazy sections to load and render
    await waitFor(() => {
      expect(screen.queryByText(/Something went wrong/i)).toBeNull();
    }, { timeout: 3000 });

    expect(onError).not.toHaveBeenCalled();
  });
});
