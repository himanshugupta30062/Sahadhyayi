import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { StudioCanvas } from '@/components/creator/StudioCanvas';
import { TemplateSelector } from '@/components/creator/TemplateSelector';
import { SlideEditorControls } from '@/components/creator/SlideEditorControls';
import { CreatorBookPicker } from '@/components/creator/CreatorBookPicker';
import { BookCreatorStudio } from '@/pages/BookCreatorStudio';
import {
  CreatorPostState,
  SlideData,
  TEMPLATE_DEFINITIONS,
} from '@/types/creatorStudio';

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

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false } },
});

const renderWithProviders = (ui: React.ReactElement) => {
  return render(
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>{ui}</BrowserRouter>
    </QueryClientProvider>
  );
};

describe('Book Creator Studio - Phase 1 Components', () => {
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
    slides: [sampleSlide],
    activeSlideIndex: 0,
    brandWatermarkEnabled: true,
    brandWatermarkText: '@testcreator',
    caption: 'My review of To Kill a Mockingbird',
    hashtags: ['#Bookstagram', '#ClassicLiterature'],
  };

  describe('StudioCanvas', () => {
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

    it('renders the correct template styling container', () => {
      const darkState: CreatorPostState = {
        ...sampleState,
        templateId: 'dark_academia',
      };

      const { container } = render(<StudioCanvas state={darkState} activeSlide={sampleSlide} />);
      const canvas = container.querySelector('[data-testid="studio-canvas"]');
      expect(canvas).toHaveClass('bg-[#181513]');
    });
  });

  describe('TemplateSelector', () => {
    it('renders all template presets and allows selection', () => {
      const onSelect = vi.fn();
      render(
        <TemplateSelector
          selectedTemplate="minimalist_editorial"
          onSelectTemplate={onSelect}
        />
      );

      expect(screen.getByText('Dark Academia')).toBeInTheDocument();
      expect(screen.getByText('Pastel Aesthetic')).toBeInTheDocument();
      expect(screen.getByText('Vintage Library')).toBeInTheDocument();
      expect(screen.getByText('Indian Heritage')).toBeInTheDocument();
      expect(screen.getByText('Bold Pop')).toBeInTheDocument();

      fireEvent.click(screen.getByText('Dark Academia'));
      expect(onSelect).toHaveBeenCalledWith('dark_academia');
    });
  });

  describe('SlideEditorControls', () => {
    it('triggers rating updates when stars are clicked', () => {
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
    });

    it('allows editing hook line and review text', () => {
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

      const hookInput = screen.getByPlaceholderText(/A haunting masterpiece/);
      fireEvent.change(hookInput, { target: { value: 'New Amazing Hook' } });
      expect(onUpdateSlide).toHaveBeenCalledWith({ hookLine: 'New Amazing Hook' });
    });
  });

  describe('CreatorBookPicker', () => {
    it('renders search input and allows selecting a book', () => {
      const onSelectBook = vi.fn();
      const onOpenChange = vi.fn();

      render(
        <CreatorBookPicker
          open={true}
          onOpenChange={onOpenChange}
          onSelectBook={onSelectBook}
        />
      );

      expect(screen.getByText('Select Book for Your Post')).toBeInTheDocument();
      const searchInput = screen.getByPlaceholderText(/Search book title or author/);
      expect(searchInput).toBeInTheDocument();

      // Trigger search
      fireEvent.change(searchInput, { target: { value: 'Gatsby' } });

      const bookItem = screen.getByText('The Great Gatsby');
      expect(bookItem).toBeInTheDocument();

      fireEvent.click(bookItem);
      expect(onSelectBook).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'book-123',
          title: 'The Great Gatsby',
        })
      );
      expect(onOpenChange).toHaveBeenCalledWith(false);
    });
  });

  describe('BookCreatorStudio Page Integration', () => {
    it('renders the studio workspace, header, and handles slide addition', async () => {
      renderWithProviders(<BookCreatorStudio />);

      expect(screen.getAllByText('Book Creator Studio')[0]).toBeInTheDocument();
      expect(screen.getByText(/Your reading journey. Your creative space/)).toBeInTheDocument();

      // Check aspect ratio buttons
      expect(screen.getByText('1:1')).toBeInTheDocument();
      expect(screen.getByText('4:5')).toBeInTheDocument();
      expect(screen.getByText('9:16')).toBeInTheDocument();

      // Add a slide
      const addSlideButton = screen.getByTitle('Add new slide to carousel');
      fireEvent.click(addSlideButton);

      // Should now show button '2' for slide 2
      expect(screen.getByRole('button', { name: '2' })).toBeInTheDocument();
    });
  });
});
