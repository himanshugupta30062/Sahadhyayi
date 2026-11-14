/** @vitest-environment jsdom */
import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import Index from '@/pages/Index';

describe('Index Homepage Render', () => {
  it('renders homepage without throwing', async () => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });

    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <ErrorBoundary fallback={<div>Caught in local ErrorBoundary</div>}>
            <Index />
          </ErrorBoundary>
        </MemoryRouter>
      </QueryClientProvider>
    );

    // Verify no ErrorBoundary triggered
    expect(screen.queryByText(/Something went wrong/i)).toBeNull();
    expect(screen.queryByText(/Caught in local ErrorBoundary/i)).toBeNull();

    // Verify key homepage elements render
    expect(screen.getByRole('group', {
      name: /Explore Sahadhyayi through the Library, Authors, Social Media, Articles, and Games orbits/i,
    })).toBeInTheDocument();
  });
});
