// @vitest-environment jsdom
import React from 'react';
import '@testing-library/jest-dom/vitest';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import LifeStories from '@/pages/LifeStories';

const mockCreateStory = vi.fn();
const mockCreateStoryPart = vi.fn();

vi.mock('@/contexts/authHelpers', () => ({
  useAuth: () => ({
    user: { id: 'user-1', user_metadata: { full_name: 'Shashi Tharoor' } },
  }),
}));

vi.mock('@/components/SEO', () => ({
  default: () => null,
}));

vi.mock('@/hooks/useStories', () => ({
  useStories: () => ({
    data: [
      {
        id: 'story-comm-1',
        title: 'Teaching 1,000 Village Girls to Read',
        author_name: 'Kamla Devi',
        description: 'How one bicycle and a bag of books sparked a rural library movement.',
        reading_time_minutes: 4,
      },
    ],
    refetch: vi.fn(),
  }),
  useCreateStory: () => ({
    mutateAsync: mockCreateStory,
    isPending: false,
  }),
  useCreateStoryPart: () => ({
    mutateAsync: mockCreateStoryPart,
    isPending: false,
  }),
}));

describe('LifeStories and Memoir Ecosystem', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    vi.restoreAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  it('renders both scopes: Historical Icons & Legends and Community Memoirs', async () => {
    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <LifeStories />
        </MemoryRouter>
      </QueryClientProvider>
    );

    // Verify Scope switcher buttons
    const legendsButton = screen.getByRole('button', { name: /Historical Icons & Legends/i });
    const communityButton = screen.getByRole('button', { name: /Everyday People Memoirs/i });
    expect(legendsButton).toBeInTheDocument();
    expect(communityButton).toBeInTheDocument();

    // Default scope: Legends
    expect(screen.getByText('Pioneers, Thinkers & Trailblazers')).toBeInTheDocument();
    expect(screen.getByText('Kalpana Chawla')).toBeInTheDocument();

    // Switch to Community Memoirs
    fireEvent.click(communityButton);

    expect(screen.getByText('Everyday Lives, Extraordinary Journeys')).toBeInTheDocument();
    expect(screen.getByText('Teaching 1,000 Village Girls to Read')).toBeInTheDocument();
    expect(screen.getByText('By Kamla Devi')).toBeInTheDocument();
  });

  it('opens Write Your Life Story modal and submits memoir narrative', async () => {
    mockCreateStory.mockResolvedValue({ id: 'new-story-id' });
    mockCreateStoryPart.mockResolvedValue({ id: 'new-part-id' });

    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <LifeStories />
        </MemoryRouter>
      </QueryClientProvider>
    );

    const writeButtons = screen.getAllByRole('button', { name: /Write Your Life Story/i });
    fireEvent.click(writeButtons[0]);

    // Modal is open
    expect(screen.getByRole('heading', { name: /Write Your Life Story & Memoir/i })).toBeInTheDocument();

    // Fill form
    fireEvent.change(screen.getByLabelText(/Story Title \/ Life Chapter/i), {
      target: { value: 'From Village Chalkboards to Robotics' },
    });
    fireEvent.change(screen.getByLabelText(/A Thought or Lesson to Carry Forward/i), {
      target: { value: 'Curiosity is an engine that turns small sparks into enduring light.' },
    });
    fireEvent.change(screen.getByLabelText(/Your Life Journey \/ Story Narrative/i), {
      target: {
        value:
          'I was born in a village where electricity arrived only when I was ten years old. My grandfather taught me mathematics using pebbles by the river...',
      },
    });

    // Submit
    fireEvent.click(screen.getByRole('button', { name: /Publish Life Story/i }));

    await waitFor(() => {
      expect(mockCreateStory).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'From Village Chalkboards to Robotics',
          genre: 'Biography & Memoir',
          author_name: 'Shashi Tharoor',
        })
      );
    });

    await waitFor(() => {
      expect(mockCreateStoryPart).toHaveBeenCalledWith(
        expect.objectContaining({
          storyId: 'new-story-id',
          partNumber: 1,
        })
      );
    });
  });
});

