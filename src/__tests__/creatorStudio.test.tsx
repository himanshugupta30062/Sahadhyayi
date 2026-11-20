import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter, MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { StudioCanvas } from '@/components/creator/StudioCanvas';
import { TemplateSelector } from '@/components/creator/TemplateSelector';
import { SlideEditorControls } from '@/components/creator/SlideEditorControls';
import { CreatorBookPicker } from '@/components/creator/CreatorBookPicker';
import { BookCreatorStudio } from '@/pages/BookCreatorStudio';
import {
  CreatorPostState,
  SlideData,
} from '@/types/creatorStudio';
import {
  generateGroundedCaption,
  generateSmartHashtags,
} from '@/utils/creatorCaptionHelper';

// Mock html-to-image
vi.mock('html-to-image', () => ({
  toPng: vi.fn().mockResolvedValue('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=='),
}));

// Mock auth hook
vi.mock('@/contexts/authHelpers', () => ({
  useAuth: () => ({
    user: { id: 'test-user', user_metadata: { username: 'testcreator' } },
  }),
}));

// Mock useBookSearch hook
const mockSearchBooks = vi.fn();
vi.mock('@/hooks/useBookSearch', () => ({
  useBookSearch: () => ({
    searchBooks: mockSearchBooks,
    loading: false,
    searchResults: [
      {
        id: 'book-123',
        title: 'The Great Gatsby',
        author: 'F. Scott Fitzgerald',
        genre: 'Classic',
        publication_year: 1925,
        cover_image_url: 'https://example.com/gatsby.jpg',
      },
    ],
  }),
}));

// Mock useBookById hook
vi.mock('@/hooks/useBookById', () => ({
  useBookById: (id?: string) => ({
    data: id
      ? {
          id,
          title: 'Mocked Book',
          author: 'Mocked Author',
          cover_image_url: 'https://example.com/mock.jpg',
          genre: 'Fiction',
        }
      : undefined,
    isLoading: false,
  }),
}));

const mockShelfData = [
  {
    id: 'shelf-1',
    user_id: 'test-user',
    book_id: 'book-1',
    status: 'completed',
    completed_at: new Date().toISOString(),
    rating: 5,
    books_library: {
      id: 'book-1',
      title: 'The Great Gatsby',
      author: 'F. Scott Fitzgerald',
      pages: 180,
      genre: 'Classic',
    },
  },
  {
    id: 'shelf-2',
    user_id: 'test-user',
    book_id: 'book-2',
    status: 'want_to_read',
    books_library: {
      id: 'book-2',
      title: 'Brave New World',
      author: 'Aldous Huxley',
      pages: 268,
    },
  },
];

// Mock useUserBookshelf hook
vi.mock('@/hooks/useUserBookshelf', () => ({
  useUserBookshelf: () => ({
    data: mockShelfData,
    isLoading: false,
  }),
}));

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false } },
});

const renderWithProviders = (ui: React.ReactElement, initialEntries = ['/']) => {
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={initialEntries}>{ui}</MemoryRouter>
    </QueryClientProvider>
  );
};

describe('Book Creator Studio - Phase 1 Full Implementation', () => {
  const sampleSlide: SlideData = {
    id: 'slide-1',
    slideNumber: 1,
    bookTitle: 'To Kill a Mockingbird',
    author: 'Harper Lee',
    coverImageUrl: 'https://example.com/cover.jpg',
    rating: 5,
    hookLine: 'A powerful exploration of justice and empathy.',
    reviewBody: 'Timeless themes with unforgettable character journeys.',
    tags: ['Classic', 'Must Read'],
  };

  const sampleState: CreatorPostState = {
    postType: 'review',
    aspectRatio: 'portrait',
    templateId: 'minimalist_editorial',
    backgroundTexture: 'clean',
    fontPairing: 'editorial',
    slides: [sampleSlide],
    activeSlideIndex: 0,
    brandWatermarkEnabled: true,
    brandWatermarkText: '@testcreator',
    caption: 'My review of To Kill a Mockingbird',
    captionTone: 'thoughtful',
    hashtags: ['#Bookstagram', '#ClassicLiterature'],
  };

  describe('StudioCanvas Post Layouts', () => {
    it('renders the book title, author, and review elements correctly', () => {
      render(<StudioCanvas state={sampleState} activeSlide={sampleSlide} />);

      expect(screen.getByText('To Kill a Mockingbird')).toBeInTheDocument();
      expect(screen.getByText('by Harper Lee')).toBeInTheDocument();
      expect(screen.getByText(/A powerful exploration of justice and empathy/)).toBeInTheDocument();
      expect(screen.getByText(/Timeless themes with unforgettable/)).toBeInTheDocument();
      expect(screen.getByText('Classic')).toBeInTheDocument();
      expect(screen.getByText('Must Read')).toBeInTheDocument();
      expect(screen.getByText('@testcreator')).toBeInTheDocument();
    });

    it('adapts to quote card format', () => {
      const quoteSlide: SlideData = {
        ...sampleSlide,
        quote: 'Until I feared I would lose it, I never loved to read.',
        quoteAttribution: 'Scout, Chapter 3',
      };
      const quoteState: CreatorPostState = {
        ...sampleState,
        postType: 'quote',
        slides: [quoteSlide],
      };

      render(<StudioCanvas state={quoteState} activeSlide={quoteSlide} />);
      expect(screen.getByText(/Until I feared I would lose it/)).toBeInTheDocument();
      expect(screen.getByText(/Scout, Chapter 3/)).toBeInTheDocument();
    });

    it('renders book recommendation format', () => {
      const recSlide: SlideData = {
        ...sampleSlide,
        recommendedBooks: [
          { title: 'Go Set a Watchman', author: 'Harper Lee' },
          { title: 'In Cold Blood', author: 'Truman Capote' },
        ],
      };
      const recState: CreatorPostState = {
        ...sampleState,
        postType: 'recommendation',
        slides: [recSlide],
      };
      render(<StudioCanvas state={recState} activeSlide={recSlide} />);
      expect(screen.getByText(/If you loved "To Kill a Mockingbird"/)).toBeInTheDocument();
      expect(screen.getByText(/Go Set a Watchman/)).toBeInTheDocument();
      expect(screen.getByText(/In Cold Blood/)).toBeInTheDocument();
    });

    it('renders book versus format', () => {
      const vsState: CreatorPostState = {
        ...sampleState,
        postType: 'versus',
      };
      render(<StudioCanvas state={vsState} activeSlide={sampleSlide} />);
      expect(screen.getByText(/Book Battle \/ Versus/)).toBeInTheDocument();
      expect(screen.getByText('Book A')).toBeInTheDocument();
      expect(screen.getByText('Book B')).toBeInTheDocument();
    });

    it('renders structured carousel stage format', () => {
      const carouselSlide: SlideData = {
        ...sampleSlide,
        carouselStage: 'breakdown',
      };
      const carouselState: CreatorPostState = {
        ...sampleState,
        postType: 'carousel',
        slides: [carouselSlide],
      };
      render(<StudioCanvas state={carouselState} activeSlide={carouselSlide} />);
      expect(screen.getByText(/Pillars of the Story/)).toBeInTheDocument();
      expect(screen.getByText(/Character Depth/)).toBeInTheDocument();
    });
  });

  describe('TemplateSelector and Aesthetics', () => {
    it('renders all template presets, textures, and font pairings', () => {
      const onSelect = vi.fn();
      const onTexture = vi.fn();
      const onFont = vi.fn();

      render(
        <TemplateSelector
          selectedTemplate="minimalist_editorial"
          selectedTexture="clean"
          selectedFont="editorial"
          onSelectTemplate={onSelect}
          onSelectTexture={onTexture}
          onSelectFont={onFont}
        />
      );

      expect(screen.getByText('Dark Academia')).toBeInTheDocument();
      expect(screen.getByText('Pastel Aesthetic')).toBeInTheDocument();
      expect(screen.getByText('Indian Heritage')).toBeInTheDocument();

      fireEvent.click(screen.getByText('Dark Academia'));
      expect(onSelect).toHaveBeenCalledWith('dark_academia');

      // Texture switch
      fireEvent.click(screen.getByText('Aged Parchment'));
      expect(onTexture).toHaveBeenCalledWith('parchment');

      // Font switch
      fireEvent.click(screen.getByText('Literary Classic'));
      expect(onFont).toHaveBeenCalledWith('literary');
    });
  });

  describe('SlideEditorControls', () => {
    it('triggers rating and hook updates', () => {
      const onUpdateSlide = vi.fn();
      const onUpdateWatermark = vi.fn();

      render(
        <SlideEditorControls
          activeSlide={sampleSlide}
          postType="review"
          brandWatermarkEnabled={true}
          brandWatermarkText="@testcreator"
          onUpdateSlide={onUpdateSlide}
          onUpdateWatermark={onUpdateWatermark}
        />
      );

      const fourStarButton = screen.getByTitle('4 Stars');
      fireEvent.click(fourStarButton);
      expect(onUpdateSlide).toHaveBeenCalledWith({ rating: 4 });

      const hookInput = screen.getByPlaceholderText(/A haunting masterpiece/);
      fireEvent.change(hookInput, { target: { value: 'New Amazing Hook' } });
      expect(onUpdateSlide).toHaveBeenCalledWith({ hookLine: 'New Amazing Hook' });
    });
  });

  describe('Grounded AI Caption & Hashtags Helper', () => {
    it('generates grounded thoughtful review captions with author and stars', () => {
      const caption = generateGroundedCaption({
        postType: 'review',
        tone: 'thoughtful',
        slide: sampleSlide,
        brandHandle: '@testcreator',
      });
      expect(caption).toContain('To Kill a Mockingbird');
      expect(caption).toContain('Harper Lee');
      expect(caption).toContain('★★★★★');
      expect(caption).toContain('@testcreator');
    });

    it('generates bilingual Hinglish captions', () => {
      const caption = generateGroundedCaption({
        postType: 'review',
        tone: 'bilingual',
        slide: sampleSlide,
      });
      expect(caption).toContain('baat karte hain');
      expect(caption).toContain('To Kill a Mockingbird');
    });

    it('generates smart genre and rating hashtags', () => {
      const tags = generateSmartHashtags({
        ...sampleSlide,
        genre: 'Classic Literature',
      });
      expect(tags).toContain('#Bookstagram');
      expect(tags).toContain('#5StarRead');
      expect(tags).toContain('#ClassicLiterature');
    });
  });

  describe('BookCreatorStudio Page & Export Workflow', () => {
    it('renders the complete studio workspace, headers, and quick-export controls', async () => {
      renderWithProviders(<BookCreatorStudio />);

      expect(screen.getAllByText('Book Creator Studio')[0]).toBeInTheDocument();
      expect(screen.getByText(/Your reading journey. Your creative space/)).toBeInTheDocument();

      // Check export buttons
      expect(screen.getByText('Download PNG')).toBeInTheDocument();

      // Check aspect ratio buttons
      expect(screen.getByText('1:1')).toBeInTheDocument();
      expect(screen.getByText('4:5')).toBeInTheDocument();
      expect(screen.getByText('9:16')).toBeInTheDocument();

      // Add a slide to carousel
      const addSlideButton = screen.getByTitle('Add new slide to carousel');
      fireEvent.click(addSlideButton);

      // Now shows slide button 2 and ZIP Carousel export button
      expect(screen.getByRole('button', { name: '2' })).toBeInTheDocument();
      expect(screen.getByText('ZIP Carousel')).toBeInTheDocument();
    });

    it('auto-hydrates wrap-up data from personal reading journal and bookshelf', async () => {
      renderWithProviders(<BookCreatorStudio />, ['/creator-studio?type=wrapup']);

      // Check that it switches to wrap-up mode and populates books count
      expect(screen.getByText(/Reading Wrap-Up/)).toBeInTheDocument();
      expect(screen.getAllByText(/Books Read/)[0]).toBeInTheDocument();
    });

    it('populates quote card from journal URL parameters', async () => {
      renderWithProviders(<BookCreatorStudio />, [
        '/creator-studio?type=quote&quote=A%20room%20without%20books%20is%20like%20a%20body%20without%20a%20soul.&quoteAttr=Cicero',
      ]);

      expect(
        screen.getAllByText(/A room without books is like a body without a soul/)[0]
      ).toBeInTheDocument();
      expect(screen.getAllByText(/Cicero/)[0]).toBeInTheDocument();
    });
  });
});
