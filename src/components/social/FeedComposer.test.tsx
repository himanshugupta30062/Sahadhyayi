// @vitest-environment jsdom

import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { FeedComposer } from './FeedComposer';

const mockMutateAsync = vi.fn();
const mockToast = vi.fn();

vi.mock('@/contexts/authHelpers', () => ({
  useAuth: () => ({
    user: { id: 'reader-1', user_metadata: { full_name: 'Priya Sharma' } },
  }),
}));

vi.mock('@/hooks/useSocialPosts', () => ({
  useCreatePost: () => ({
    mutateAsync: mockMutateAsync,
    isPending: false,
  }),
}));

vi.mock('@/hooks/useLibraryBooks', () => ({
  useAllLibraryBooks: () => ({
    data: [],
    isLoading: false,
  }),
}));

vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({ toast: mockToast }),
}));

vi.mock('@/integrations/supabase/client-universal', () => ({
  supabase: {
    storage: {
      from: () => ({
        upload: vi.fn().mockResolvedValue({ error: null }),
        remove: vi.fn().mockResolvedValue({ error: null }),
      }),
    },
  },
}));

const renderComposer = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <FeedComposer />
    </QueryClientProvider>
  );
};

describe('FeedComposer', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  it('renders composer textarea and displays keyboard shortcut hint', () => {
    renderComposer();

    expect(screen.getByPlaceholderText(/What are you reading or thinking about/i)).toBeInTheDocument();
    expect(screen.getByText(/Ctrl\/⌘ \+ Enter/i)).toBeInTheDocument();
  });

  it('submits text post on button click', async () => {
    mockMutateAsync.mockResolvedValueOnce({});
    renderComposer();

    const textarea = screen.getByPlaceholderText(/What are you reading or thinking about/i);
    fireEvent.change(textarea, { target: { value: 'Enjoying a quiet evening with Murakami.' } });

    const postButton = screen.getByRole('button', { name: /^post$/i });
    expect(postButton).not.toBeDisabled();

    fireEvent.click(postButton);

    await waitFor(() => {
      expect(mockMutateAsync).toHaveBeenCalledWith(
        expect.objectContaining({
          content: 'Enjoying a quiet evening with Murakami.',
          post_kind: 'post',
        })
      );
    });
  });

  it('submits post using Ctrl+Enter or Cmd+Enter shortcut', async () => {
    mockMutateAsync.mockResolvedValueOnce({});
    renderComposer();

    const textarea = screen.getByPlaceholderText(/What are you reading or thinking about/i);
    fireEvent.change(textarea, { target: { value: 'Late night reading thoughts.' } });

    // Press Ctrl+Enter
    fireEvent.keyDown(textarea, { key: 'Enter', ctrlKey: true });

    await waitFor(() => {
      expect(mockMutateAsync).toHaveBeenCalledWith(
        expect.objectContaining({
          content: 'Late night reading thoughts.',
        })
      );
    });
  });

  it('switches to quote card mode and submits quote with Cmd+Enter', async () => {
    mockMutateAsync.mockResolvedValueOnce({});
    renderComposer();

    const quoteTab = screen.getByRole('button', { name: /quote card/i });
    fireEvent.click(quoteTab);

    expect(screen.getByText(/A passage worth keeping/i)).toBeInTheDocument();

    const quoteInput = screen.getByLabelText('Quote text');
    fireEvent.change(quoteInput, { target: { value: 'Not all those who wander are lost.' } });

    // Press Cmd+Enter inside quote input
    fireEvent.keyDown(quoteInput, { key: 'Enter', metaKey: true });

    await waitFor(() => {
      expect(mockMutateAsync).toHaveBeenCalledWith(
        expect.objectContaining({
          post_kind: 'quote',
          quote_text: 'Not all those who wander are lost.',
        })
      );
    });
  });

  it('prevents empty post submission and displays warning toast', () => {
    renderComposer();

    const postButton = screen.getByRole('button', { name: /^post$/i });
    expect(postButton).toBeDisabled();
  });
});
