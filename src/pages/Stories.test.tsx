// @vitest-environment jsdom
import React from 'react';
import '@testing-library/jest-dom/vitest';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Stories from './Stories';

describe('Stories Page', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    vi.restoreAllMocks();
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
      },
    });
  });

  afterEach(() => {
    cleanup();
  });

  it('renders the standalone stories page with hero and feed', () => {
    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <Stories />
        </MemoryRouter>
      </QueryClientProvider>
    );

    expect(screen.getByText(/Community Short Stories & Serials/i)).toBeInTheDocument();
    expect(screen.getByText(/Stories from Readers/i)).toBeInTheDocument();
  });
});
