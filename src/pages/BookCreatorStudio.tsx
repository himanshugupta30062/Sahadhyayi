import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/authHelpers';
import { useBookById } from '@/hooks/useBookById';
import { type BookSearchResult } from '@/hooks/useBookSearch';
import SEO from '@/components/SEO';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import {
  Sparkles,
  BookOpen,
  Layers,
  Palette,
  Edit3,
  Share2,
  Copy,
  ChevronLeft,
  ChevronRight,
  Plus,
  Trash2,
  Download,
  Check,
  Smartphone,
  Square,
  Monitor,
} from 'lucide-react';
import { toast } from 'sonner';

import {
  AspectRatio,
  TemplateStyle,
  PostType,
  CreatorPostState,
  SlideData,
  ASPECT_RATIO_CONFIG,
} from '@/types/creatorStudio';
import { StudioCanvas } from '@/components/creator/StudioCanvas';
import { CreatorBookPicker } from '@/components/creator/CreatorBookPicker';
import { TemplateSelector } from '@/components/creator/TemplateSelector';
import { SlideEditorControls } from '@/components/creator/SlideEditorControls';

const INITIAL_SLIDE: SlideData = {
  id: 'slide-1',
  slideNumber: 1,
  rating: 5,
  hookLine: 'A mesmerizing literary journey that captivated me completely.',
  reviewBody: 'The prose is evocative, the character dynamics are rich, and the emotional payoff is profound. A standout read this year.',
  tags: ['5 Stars', 'Must Read', 'Book Club Pick'],
};

export const BookCreatorStudio: React.FC = () => {
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const urlBookId = searchParams.get('bookId') || undefined;
  const urlPostType = (searchParams.get('type') as PostType) || 'review';

  // Book fetching if bookId is present in URL
  const { data: initialBookData } = useBookById(urlBookId);

  // Studio State
  const [state, setState] = useState<CreatorPostState>({
    postType: urlPostType,
    aspectRatio: 'portrait',
    templateId: 'minimalist_editorial',
    slides: [INITIAL_SLIDE],
    activeSlideIndex: 0,
    brandWatermarkEnabled: true,
    brandWatermarkText: user?.user_metadata?.username
      ? `@${user.user_metadata.username}`
      : '@sahadhyayi_reader',
    caption: '',
    hashtags: ['#Bookstagram', '#BookReview', '#ReadingCommunity', '#Sahadhyayi'],
  });

  const [isBookPickerOpen, setIsBookPickerOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'edit' | 'templates' | 'export'>('edit');
  const [copiedCaption, setCopiedCaption] = useState(false);
  const canvasRef = useRef<HTMLDivElement>(null);

  // Sync initial book data if fetched via URL
  useEffect(() => {
    if (initialBookData) {
      setState((prev) => {
        const updatedSlides = [...prev.slides];
        updatedSlides[0] = {
          ...updatedSlides[0],
          bookId: initialBookData.id,
          bookTitle: initialBookData.title,
          author: initialBookData.author,
          coverImageUrl: initialBookData.cover_image_url,
          genre: initialBookData.genre,
        };
        return {
          ...prev,
          slides: updatedSlides,
          caption: `Reviewing "${initialBookData.title}" by ${initialBookData.author}.\n\nWhat are your thoughts on this one? Let me know in the comments! 📖✨`,
        };
      });
    }
  }, [initialBookData]);

  const activeSlide = state.slides[state.activeSlideIndex] || state.slides[0];

  // Handlers
  const handleSelectBook = (book: BookSearchResult) => {
    setState((prev) => {
      const updatedSlides = [...prev.slides];
      updatedSlides[prev.activeSlideIndex] = {
        ...updatedSlides[prev.activeSlideIndex],
        bookId: book.id,
        bookTitle: book.title,
        author: book.author,
        coverImageUrl: book.cover_image_url,
        genre: book.genre,
        publicationYear: book.publication_year,
      };
      return {
        ...prev,
        slides: updatedSlides,
        caption: `My review of "${book.title}" by ${book.author || 'Unknown'}.\n\nRating: ${'★'.repeat(
          updatedSlides[prev.activeSlideIndex].rating || 5
        )}\n\nHave you read this book? Drop your review below! 📚`,
      };
    });
    toast.success(`Loaded "${book.title}" into your design`);
  };

  const handleUpdateActiveSlide = (updated: Partial<SlideData>) => {
    setState((prev) => {
      const updatedSlides = [...prev.slides];
      updatedSlides[prev.activeSlideIndex] = {
        ...updatedSlides[prev.activeSlideIndex],
        ...updated,
      };
      return { ...prev, slides: updatedSlides };
    });
  };

  const handleAddSlide = () => {
    if (state.slides.length >= 10) {
      toast.error('Instagram carousels support up to 10 slides');
      return;
    }
    const newSlide: SlideData = {
      id: `slide-${Date.now()}`,
      slideNumber: state.slides.length + 1,
      bookId: activeSlide.bookId,
      bookTitle: activeSlide.bookTitle,
      author: activeSlide.author,
      coverImageUrl: activeSlide.coverImageUrl,
      rating: activeSlide.rating,
      hookLine: '',
      reviewBody: '',
      tags: [],
    };
    setState((prev) => ({
      ...prev,
      slides: [...prev.slides, newSlide],
      activeSlideIndex: prev.slides.length,
    }));
    toast.success(`Slide ${state.slides.length + 1} added`);
  };

  const handleDeleteSlide = (indexToDelete: number) => {
    if (state.slides.length <= 1) {
      toast.error('You need at least one slide in your post');
      return;
    }
    setState((prev) => {
      const filtered = prev.slides.filter((_, i) => i !== indexToDelete);
      const renumbered = filtered.map((s, idx) => ({ ...s, slideNumber: idx + 1 }));
      const nextIndex = Math.min(prev.activeSlideIndex, renumbered.length - 1);
      return {
        ...prev,
        slides: renumbered,
        activeSlideIndex: nextIndex,
      };
    });
    toast.info('Slide removed');
  };

  const handleCopyCaption = () => {
    const fullCaption = `${state.caption}\n\n${state.hashtags.join(' ')}`;
    navigator.clipboard.writeText(fullCaption);
    setCopiedCaption(true);
    toast.success('Caption & hashtags copied to clipboard!');
    setTimeout(() => setCopiedCaption(false), 2500);
  };

  return (
    <div className="min-h-screen bg-background text-foreground pb-16">
      <SEO
        title="Book Creator Studio | Sahadhyayi"
        description="Design high-converting Instagram reviews, quotes, TBR lists and carousels directly from your Sahadhyayi reading journey."
      />

      {/* Studio Header Bar */}
      <header className="border-b bg-card/60 backdrop-blur sticky top-0 z-30 px-4 sm:px-8 py-3">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Link
              to="/social?tab=creator-studio"
              className="p-1.5 rounded-lg border hover:bg-accent/50 text-muted-foreground transition-colors"
              title="Back to Social"
            >
              <ChevronLeft className="w-4 h-4" />
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm sm:text-base tracking-tight flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  Book Creator Studio
                </span>
                <span className="text-[10px] font-semibold bg-amber-500/10 text-amber-700 dark:text-amber-300 px-2 py-0.5 rounded-full border border-amber-500/20">
                  Creator Space
                </span>
              </div>
              <p className="text-[11px] text-muted-foreground hidden sm:block">
                Your reading journey. Your creative space.
              </p>
            </div>
          </div>

          {/* Quick Toolbar: Aspect Ratio & Book Selection */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Aspect Ratio Selector */}
            <div className="flex items-center bg-muted/60 p-1 rounded-lg border">
              {(['square', 'portrait', 'story'] as AspectRatio[]).map((ratio) => {
                const config = ASPECT_RATIO_CONFIG[ratio];
                const isActive = state.aspectRatio === ratio;
                return (
                  <button
                    key={ratio}
                    type="button"
                    onClick={() => setState((prev) => ({ ...prev, aspectRatio: ratio }))}
                    className={`flex items-center gap-1 px-2.5 py-1 text-xs rounded-md font-medium transition-all ${
                      isActive
                        ? 'bg-background text-foreground shadow-sm'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {ratio === 'square' && <Square className="w-3 h-3" />}
                    {ratio === 'portrait' && <Smartphone className="w-3 h-3" />}
                    {ratio === 'story' && <Monitor className="w-3 h-3" />}
                    <span>{config.ratio}</span>
                  </button>
                );
              })}
            </div>

            {/* Select Book Button */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsBookPickerOpen(true)}
              className="h-8 text-xs flex items-center gap-1.5"
            >
              <BookOpen className="w-3.5 h-3.5 text-amber-500" />
              <span className="truncate max-w-[120px]">
                {activeSlide.bookTitle || 'Select Book'}
              </span>
            </Button>
          </div>
        </div>
      </header>

      {/* Main Studio Body */}
      <main className="max-w-7xl mx-auto px-4 sm:px-8 pt-6">
        {/* Post Type Selector Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-4 scrollbar-none">
          {[
            { id: 'review', label: 'Book Review' },
            { id: 'quote', label: 'Quote Card' },
            { id: 'wrapup', label: 'Monthly Wrap-Up' },
            { id: 'tbr', label: 'TBR Stack' },
            { id: 'custom', label: 'Custom Note' },
          ].map((type) => {
            const isActive = state.postType === type.id;
            return (
              <button
                key={type.id}
                type="button"
                onClick={() => setState((prev) => ({ ...prev, postType: type.id as PostType }))}
                className={`text-xs px-3 py-1.5 rounded-full font-semibold whitespace-nowrap transition-all border ${
                  isActive
                    ? 'bg-primary text-primary-foreground border-primary shadow-sm'
                    : 'bg-card text-muted-foreground border-border hover:bg-accent/40 hover:text-foreground'
                }`}
              >
                {type.label}
              </button>
            );
          })}
        </div>

        {/* 2-Column Responsive Workspace */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start mt-2">
          {/* Left Column: Live Canvas Preview & Slide Carousel controls */}
          <div className="lg:col-span-7 flex flex-col items-center">
            {/* The Visual Canvas */}
            <StudioCanvas
              state={state}
              activeSlide={activeSlide}
              canvasRef={canvasRef}
            />

            {/* Slide Navigation & Carousel Management */}
            <div className="w-full max-w-[420px] sm:max-w-[460px] flex items-center justify-between mt-3 px-2">
              <div className="flex items-center gap-1.5 overflow-x-auto py-1 scrollbar-none">
                {state.slides.map((slide, idx) => (
                  <button
                    key={slide.id}
                    type="button"
                    onClick={() => setState((prev) => ({ ...prev, activeSlideIndex: idx }))}
                    className={`w-7 h-7 rounded-lg text-xs font-semibold flex items-center justify-center transition-all ${
                      state.activeSlideIndex === idx
                        ? 'bg-amber-500 text-white shadow-sm ring-2 ring-amber-500/20'
                        : 'bg-muted/80 text-muted-foreground hover:bg-muted hover:text-foreground'
                    }`}
                  >
                    {idx + 1}
                  </button>
                ))}

                <button
                  type="button"
                  onClick={handleAddSlide}
                  className="w-7 h-7 rounded-lg text-xs font-semibold flex items-center justify-center border border-dashed border-border hover:border-amber-500 text-muted-foreground hover:text-amber-500 transition-colors"
                  title="Add new slide to carousel"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>

              {state.slides.length > 1 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDeleteSlide(state.activeSlideIndex)}
                  className="h-7 text-xs text-destructive hover:bg-destructive/10 px-2"
                >
                  <Trash2 className="w-3.5 h-3.5 mr-1" />
                  Remove
                </Button>
              )}
            </div>
          </div>

          {/* Right Column: Customization Controls & Export Panel */}
          <div className="lg:col-span-5">
            <Card className="shadow-sm border-border/80">
              <CardContent className="p-4 sm:p-5">
                <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="w-full">
                  <TabsList className="grid grid-cols-3 mb-4 w-full">
                    <TabsTrigger value="edit" className="text-xs flex items-center gap-1.5">
                      <Edit3 className="w-3.5 h-3.5" />
                      Content
                    </TabsTrigger>
                    <TabsTrigger value="templates" className="text-xs flex items-center gap-1.5">
                      <Palette className="w-3.5 h-3.5" />
                      Styles
                    </TabsTrigger>
                    <TabsTrigger value="export" className="text-xs flex items-center gap-1.5">
                      <Share2 className="w-3.5 h-3.5" />
                      Export
                    </TabsTrigger>
                  </TabsList>

                  {/* Tab 1: Content Editor */}
                  <TabsContent value="edit" className="mt-0">
                    <SlideEditorControls
                      activeSlide={activeSlide}
                      postType={state.postType}
                      brandWatermarkEnabled={state.brandWatermarkEnabled}
                      brandWatermarkText={state.brandWatermarkText}
                      onUpdateSlide={handleUpdateActiveSlide}
                      onUpdateWatermark={(enabled, text) =>
                        setState((prev) => ({
                          ...prev,
                          brandWatermarkEnabled: enabled,
                          brandWatermarkText: text,
                        }))
                      }
                    />
                  </TabsContent>

                  {/* Tab 2: Aesthetic Template Selection */}
                  <TabsContent value="templates" className="mt-0">
                    <TemplateSelector
                      selectedTemplate={state.templateId}
                      onSelectTemplate={(tpl) =>
                        setState((prev) => ({ ...prev, templateId: tpl }))
                      }
                    />
                  </TabsContent>

                  {/* Tab 3: Export & Caption */}
                  <TabsContent value="export" className="mt-0 space-y-4">
                    <div className="space-y-2">
                      <label className="text-xs font-semibold flex items-center justify-between">
                        <span>Generated Caption</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={handleCopyCaption}
                          className="h-6 text-[11px] px-2 text-amber-600 hover:text-amber-700"
                        >
                          {copiedCaption ? (
                            <>
                              <Check className="w-3 h-3 mr-1 text-emerald-500" />
                              Copied!
                            </>
                          ) : (
                            <>
                              <Copy className="w-3 h-3 mr-1" />
                              Copy Caption
                            </>
                          )}
                        </Button>
                      </label>
                      <textarea
                        value={state.caption}
                        onChange={(e) => setState((prev) => ({ ...prev, caption: e.target.value }))}
                        rows={4}
                        className="w-full text-xs p-2.5 rounded-lg border bg-background resize-none focus:outline-none focus:ring-1 focus:ring-primary"
                        placeholder="Your review caption for Instagram..."
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold">Hashtags</label>
                      <div className="flex flex-wrap gap-1">
                        {state.hashtags.map((ht) => (
                          <span
                            key={ht}
                            className="text-[11px] px-2 py-0.5 rounded-full bg-accent text-accent-foreground border"
                          >
                            {ht}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-800 dark:text-amber-200">
                      <div className="flex items-center gap-1.5 font-bold mb-1">
                        <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                        Export & Share
                      </div>
                      <p className="text-[11px] opacity-90 leading-relaxed">
                        Copy your caption above to pair with your post. High-resolution multi-slide PNG & ZIP export is enabled for direct sharing to Instagram.
                      </p>
                      <Button
                        size="sm"
                        onClick={handleCopyCaption}
                        className="w-full mt-3 h-8 text-xs bg-amber-500 hover:bg-amber-600 text-white font-semibold"
                      >
                        <Copy className="w-3.5 h-3.5 mr-1.5" />
                        Copy Caption & Hashtags
                      </Button>
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      {/* Book Picker Modal */}
      <CreatorBookPicker
        open={isBookPickerOpen}
        onOpenChange={setIsBookPickerOpen}
        onSelectBook={handleSelectBook}
        currentBookId={activeSlide.bookId}
      />
    </div>
  );
};

export default BookCreatorStudio;
