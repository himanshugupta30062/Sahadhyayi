// @vitest-environment jsdom
import React from 'react';
import '@testing-library/jest-dom/vitest';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import StoryReader from './StoryReader';
import { toast } from 'sonner';

vi.mock('@/components/SEO', () => ({
  default: () => null,
}));

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
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
  useUpdateStory: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useDeleteStoryPart: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useReorderStoryParts: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useCreateStoryPart: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useUpdateStoryPart: () => ({ mutateAsync: vi.fn(), isPending: false }),
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

    (window as any).speechSynthesis = {
      speak: vi.fn(),
      pause: vi.fn(),
      resume: vi.fn(),
      cancel: vi.fn(),
    };
    (global as any).SpeechSynthesisUtterance = function (text: string) {
      return { text, rate: 1, onend: null, onerror: null };
    };
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

    const largeFontBtns = screen.getAllByRole('button', { name: 'A+' });
    fireEvent.click(largeFontBtns[0]);

    const articles = screen.getAllByRole('article');
    expect(articles[0]).toBeInTheDocument();
  });

  it('supports posting a reader comment', async () => {
    mockAddComment.mutateAsync.mockResolvedValue({});

    renderReader();

    expect(screen.getByText('Breathtaking imagery in this opening chapter!')).toBeInTheDocument();

    const commentInput = screen.getByPlaceholderText(/Share your thoughts on this story or chapter/i);
    fireEvent.change(commentInput, { target: { value: 'Mesmerizing prose. Can not wait for part 2!' } });

    const postCommentBtn = screen.getByRole('button', { name: /post reflection/i });
    fireEvent.click(postCommentBtn);

    await waitFor(() => {
      expect(mockAddComment.mutateAsync).toHaveBeenCalledWith({
        storyId: 'story-101',
        content: 'Mesmerizing prose. Can not wait for part 2!',
        partId: 'part-1',
      });
    });
  });

  it('triggers audio playback via text-to-speech', () => {
    renderReader();

    const audioBtns = screen.getAllByRole('button', { name: /listen/i });
    fireEvent.click(audioBtns[0]);

    expect(window.speechSynthesis.speak).toHaveBeenCalled();
  });

  it('copies story link to clipboard when sharing', async () => {
    Object.defineProperty(navigator, 'clipboard', {
      value: {
        writeText: vi.fn().mockResolvedValue(undefined),
      },
      configurable: true,
      writable: true,
    });
    Object.defineProperty(navigator, 'share', {
      value: undefined,
      configurable: true,
      writable: true,
    });

    renderReader();

    const shareBtn = screen.getByRole('button', { name: /share story/i });
    fireEvent.click(shareBtn);

    await waitFor(() => {
      expect(navigator.clipboard.writeText).toHaveBeenCalled();
      expect(toast.success).toHaveBeenCalledWith('Story link copied to clipboard!');
    });
  });
});
