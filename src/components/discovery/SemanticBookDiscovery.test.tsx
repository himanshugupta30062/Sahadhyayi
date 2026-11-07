// @vitest-environment jsdom
import React from 'react';
import '@testing-library/jest-dom/vitest';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import SemanticBookDiscovery from './SemanticBookDiscovery';

const mockInvoke = vi.fn();

vi.mock('@/integrations/supabase/client-universal', () => ({
  supabase: {
    functions: {
      invoke: (...args: any[]) => mockInvoke(...args),
    },
  },
}));

vi.mock('@/contexts/authHelpers', () => ({
  useAuth: () => ({ user: { id: 'u1' } }),
}));

vi.mock('@/hooks/useUserBookshelf', () => ({
  useAddToBookshelf: () => ({ mutate: vi.fn() }),
}));

vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({ toast: vi.fn() }),
}));

describe('SemanticBookDiscovery', () => {
  beforeEach(() => {
    mockInvoke.mockReset();
  });

  afterEach(() => {
    cleanup();
  });

  it('renders search input and popular mood chips', () => {
    render(
      <MemoryRouter>
        <SemanticBookDiscovery />
      </MemoryRouter>
    );

    expect(screen.getByText('AI Semantic Discovery & Mood Finder')).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Books about resilience/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Finding Purpose & Growth/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Hindi Classics & Realism/i })).toBeInTheDocument();
  });

  it('performs semantic search and displays matched titles and curator notes', async () => {
    mockInvoke.mockResolvedValueOnce({
      data: {
        reply: 'These books capture the struggle for dignity and purpose in rural India.',
        books: [
          {
            id: 'b1',
            title: 'Nirmala',
            author: 'Premchand',
            genre: 'Classic Fiction',
            description: 'A poignant story of social struggle and empathy.',
          },
        ],
      },
      error: null,
    });

    render(
      <MemoryRouter>
        <SemanticBookDiscovery />
      </MemoryRouter>
    );

    const input = screen.getByPlaceholderText(/Books about resilience/i);
    fireEvent.change(input, { target: { value: 'social justice and realism' } });

    const submitBtn = screen.getByRole('button', { name: /discover with ai/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByText(/These books capture the struggle for dignity/i)).toBeInTheDocument();
    });

    expect(screen.getByText('Nirmala')).toBeInTheDocument();
    expect(screen.getByText('Premchand')).toBeInTheDocument();
  });
});

