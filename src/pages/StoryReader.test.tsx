// @vitest-environment jsdom
import React from 'react';
import '@testing-library/jest-dom/vitest';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import StoryReader from './StoryReader';

vi.mock('@/components/SEO', () => ({
  default: () => null,
}));

vi.mock('@/contexts/authHelpers', () => ({
  useAuth: () => ({
    user: { id: 'reader-1', email: 'reader@example.com' },
  }),
}));

const mockStory = {
  id: 'story-101',
  title: 'Whispers of the Ganga',
  description: 'A multi-part serialized story following the ghats of Varanasi.',
  author_id: 'author-101',
  author_name: 'Premchand Roy',
  genre: 'Literary Fiction',
  is_series: true,
  status: 'ongoing',
  total_parts: 3,
  likes_count: 24,
  bookmarks_count: 8,
  created_at: '2026-11-01T00:00:00Z',
  updated_at: '2026-11-06T00:00:00Z',
  profiles: {
    id: 'author-101',
    full_name: 'Premchand Roy',
    username: 'premchand',
    avatar_url: '',
    bio: 'Storyteller exploring human resilience.',
  },
  is_liked: false,
  is_bookmarked: false,
  is_following: false,
};

const mockPart1 = {
  id: 'part-1',
  story_id: 'story-101',
  part_number: 1,
  title: 'Dawn over Dashashwamedh',
  content: 'The temple bells rang across the calm morning fog. A boatman pushed away from the stone ghat into the gentle river currents.\n\nEvery morning brought new faces, but the river remained eternal, carrying tales of countless lifetimes.',
  reading_time_minutes: 3,
  status: 'published',
  created_at: '2026-11-01T00:00:00Z',
};

const mockToggleLike = vi.fn();
const mockToggleBookmark = vi.fn();
const mockToggleFollow = vi.fn();
const mockSaveProgress = { mutate: vi.fn() };
const mockAddComment = { mutateAsync: vi.fn() };

vi.mock('@/hooks/useStories', () => ({
  useStoryPart: (storyId?: string, partNum?: number) => ({
    data: {
      story: mockStory,
      part: mockPart1,
      allParts: [
        { id: 'part-1', part_number: 1, title: 'Dawn over Dashashwamedh' },
        { id: 'part-2', part_number: 2, title: 'Shadows at Manikarnika' },
        { id: 'part-3', part_number: 3, title: 'Evening Aarti' },
      ],
      isAuthor: false,
    },
    isLoading: false,
    isError: false,
  }),
  useToggleStoryLike: () => ({ mutate: mockToggleLike, isPending: false }),
  useToggleStoryBookmark: () => ({ mutate: mockToggleBookmark, isPending: false }),
  useToggleStoryFollow: () => ({ mutate: mockToggleFollow, isPending: false }),
  useSaveStoryProgress: () => mockSaveProgress,
  useStoryComments: () => ({
    data: [
      {
        id: 'comment-1',
        story_id: 'story-101',
        user_id: 'user-2',
        content: 'Breathtaking imagery in this opening chapter!',
        created_at: '2026-11-05T00:00:00Z',
        author: {
          id: 'user-2',
          full_name: 'Ananya Sharma',
          username: 'ananya',
          avatar_url: '',
        },
      },
    ],
    isLoading: false,
  }),
  useAddStoryComment: () => mockAddComment,
}));

describe('StoryReader Page', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    vi.clearAllMocks();
  });

  const renderReader = (initialEntry = '/stories/story-101/part/1') => {
    return render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={[initialEntry]}>
          <Routes>
            <Route path="/stories/:storyId/part/:partNumber" element={<StoryReader />} />
            <Route path="/stories/:storyId" element={<StoryReader />} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>
    );
  };

  it('renders story title, author, part header and content', () => {
    renderReader();

    expect(screen.getAllByText('Whispers of the Ganga').length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Premchand Roy/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText('Dawn over Dashashwamedh').length).toBeGreaterThan(0);
    expect(
      screen.getByText(/The temple bells rang across the calm morning fog/i)
    ).toBeInTheDocument();
  });

  it('saves reading progress upon opening the chapter', () => {
    renderReader();

    expect(mockSaveProgress.mutate).toHaveBeenCalledWith(
      expect.objectContaining({
        storyId: 'story-101',
        partNumber: 1,
      })
    );
  });

  it('triggers like and bookmark callbacks on user interaction', () => {
    renderReader();

    const likeButtons = screen.getAllByRole('button', { name: /like/i });
    fireEvent.click(likeButtons[0]);
    expect(mockToggleLike).toHaveBeenCalledWith(
      expect.objectContaining({
        storyId: 'story-101',
      })
    );

    const bookmarkButtons = screen.getAllByRole('button', { name: /bookmark/i });
    fireEvent.click(bookmarkButtons[0]);
    expect(mockToggleBookmark).toHaveBeenCalledWith(
      expect.objectContaining({
        storyId: 'story-101',
      })
    );
  });

  it('allows reader to switch font sizes', () => {
    renderReader();

    // Font size controls
    const largeFontBtns = screen.getAllByRole('button', { name: 'A+' });
    fireEvent.click(largeFontBtns[0]);

    // Verify prose container is present
    const articles = screen.getAllByRole('article');
    expect(articles[0]).toBeInTheDocument();
  });
});
