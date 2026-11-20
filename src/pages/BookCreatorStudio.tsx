import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/authHelpers';
import { useBookById } from '@/hooks/useBookById';
import { useUserBookshelf } from '@/hooks/useUserBookshelf';
import { type BookSearchResult } from '@/hooks/useBookSearch';
import SEO from '@/components/SEO';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import {
  Sparkles,
  BookOpen,
  Palette,
  Edit3,
  Share2,
  Copy,
  ChevronLeft,
  Plus,
  Trash2,
  Download,
  Check,
  Smartphone,
  Square,
  Monitor,
  Archive,
  Share,
  Clipboard,
  Loader2,
  Wand2,
} from 'lucide-react';
import { toast } from 'sonner';

import {
  AspectRatio,
  TemplateStyle,
  PostType,
  CreatorPostState,
  SlideData,
  CaptionTone,
  ASPECT_RATIO_CONFIG,
} from '@/types/creatorStudio';
import { StudioCanvas } from '@/components/creator/StudioCanvas';
import { CreatorBookPicker } from '@/components/creator/CreatorBookPicker';
import { TemplateSelector } from '@/components/creator/TemplateSelector';
import { SlideEditorControls } from '@/components/creator/SlideEditorControls';
import {
  exportSlideToPng,
  exportCarouselToZip,
  copySlideToClipboard,
  shareSlideViaWebShare,
} from '@/utils/creatorExportHelper';
import {
  generateGroundedCaption,
  generateSmartHashtags,
} from '@/utils/creatorCaptionHelper';
import {
  saveAutoDraft,
  loadAutoDraft,
  clearAutoDraft,
} from '@/utils/creatorDraftStorage';
import { generateContextualAiCaption } from '@/utils/creatorAiHelper';

const INITIAL_SLIDE: SlideData = {
  id: 'slide-1',
  slideNumber: 1,
  rating: 5,
  hookLine: 'A mesmerizing literary journey that captivated me completely.',
  reviewBody: 'The prose is evocative, the character dynamics are rich, and the emotional payoff is profound. A standout read this year.',
  tags: ['5 Stars', 'Must Read', 'Book Club Pick'],
  carouselStage: 'hook',
};

export const BookCreatorStudio: React.FC = () => {
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const urlBookId = searchParams.get('bookId') || undefined;
  const urlPostType = (searchParams.get('type') as PostType) || 'review';
  const urlQuote = searchParams.get('quote') || undefined;
  const urlQuoteAttr = searchParams.get('quoteAttr') || undefined;
  const urlMonth = searchParams.get('month') || undefined;
  const urlBooks = searchParams.get('books') ? parseInt(searchParams.get('books')!) : undefined;
  const urlPages = searchParams.get('pages') ? parseInt(searchParams.get('pages')!) : undefined;

  // Book fetching if bookId is present in URL
  const { data: initialBookData } = useBookById(urlBookId);
  const { data: bookshelfData } = useUserBookshelf();

  // Studio State
  const [state, setState] = useState<CreatorPostState>(() => {
    const initialSlide: SlideData = {
      ...INITIAL_SLIDE,
      quote: urlQuote || INITIAL_SLIDE.quote,
      quoteAttribution: urlQuoteAttr || INITIAL_SLIDE.quoteAttribution,
      wrapupMonth: urlMonth || new Date().toLocaleString('default', { month: 'long' }),
      wrapupBooksCount: urlBooks,
      wrapupPagesCount: urlPages,
    };
    return {
      postType: urlPostType,
      aspectRatio: 'portrait',
      templateId: 'minimalist_editorial',
      backgroundTexture: 'clean',
      fontPairing: 'editorial',
      slides: [initialSlide],
      activeSlideIndex: 0,
      brandWatermarkEnabled: true,
      brandWatermarkText: user?.user_metadata?.username
        ? `@${user.user_metadata.username}`
        : '@sahadhyayi_reader',
      caption: '',
      captionTone: 'thoughtful',
      hashtags: ['#Bookstagram', '#BookReview', '#ReadingCommunity', '#Sahadhyayi'],
    };
  });

  const hasAutoHydratedWrapupRef = useRef(false);
  const hasAutoHydratedTbrRef = useRef(false);

  // Automatically compute monthly wrap-up or TBR from bookshelf when available
  useEffect(() => {
    if (!bookshelfData || bookshelfData.length === 0) return;

    if (state.postType === 'wrapup' && !hasAutoHydratedWrapupRef.current) {
      hasAutoHydratedWrapupRef.current = true;
      const currentMonth = new Date().getMonth();
      const currentYear = new Date().getFullYear();
      const monthName = new Date().toLocaleString('default', { month: 'long' });

      const completedInMonth = bookshelfData.filter((item) => {
        if (item.status !== 'completed' || !item.completed_at) return false;
        const d = new Date(item.completed_at);
        return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
      });

      const totalBooks = completedInMonth.length || urlBooks || 3;
      const totalPages = completedInMonth.reduce(
        (sum, item) => sum + (item.books_library?.pages || 320),
        0
      ) || urlPages || 1150;

      // Find top rated book
      const topBookItem = completedInMonth.sort((a, b) => (b.rating || 0) - (a.rating || 0))[0];
      const topBook = topBookItem?.books_library;

      setState((prev) => {
        const updatedSlides = [...prev.slides];
        updatedSlides[0] = {
          ...updatedSlides[0],
          wrapupMonth: urlMonth || monthName,
          wrapupBooksCount: totalBooks,
          wrapupPagesCount: totalPages,
          bookId: topBook?.id || updatedSlides[0].bookId,
          bookTitle: topBook?.title || updatedSlides[0].bookTitle,
          author: topBook?.author || updatedSlides[0].author,
          coverImageUrl: topBook?.cover_image_url || updatedSlides[0].coverImageUrl,
        };
        const generatedCaption = generateGroundedCaption({
          postType: 'wrapup',
          tone: prev.captionTone,
          slide: updatedSlides[0],
          brandHandle: prev.brandWatermarkText,
        });
        return {
          ...prev,
          slides: updatedSlides,
          caption: generatedCaption,
        };
      });
    } else if (state.postType === 'tbr' && !hasAutoHydratedTbrRef.current) {
      hasAutoHydratedTbrRef.current = true;
      const wantToRead = bookshelfData.filter((item) => item.status === 'want_to_read');
      if (wantToRead.length > 0) {
        const firstTbr = wantToRead[0].books_library;
        if (firstTbr) {
          setState((prev) => {
            const updatedSlides = [...prev.slides];
            updatedSlides[0] = {
              ...updatedSlides[0],
              bookId: firstTbr.id,
              bookTitle: firstTbr.title,
              author: firstTbr.author,
              coverImageUrl: firstTbr.cover_image_url,
            };
            return {
              ...prev,
              slides: updatedSlides,
              caption: generateGroundedCaption({
                postType: 'tbr',
                tone: prev.captionTone,
                slide: updatedSlides[0],
                brandHandle: prev.brandWatermarkText,
              }),
            };
          });
        }
      }
    }
  }, [bookshelfData, state.postType, urlBooks, urlPages, urlMonth]);

  const [isBookPickerOpen, setIsBookPickerOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'edit' | 'templates' | 'export'>('edit');
  const [isExporting, setIsExporting] = useState(false);
  const [exportStatusText, setExportStatusText] = useState('');
  const [copiedCaption, setCopiedCaption] = useState(false);
  const [copiedImage, setCopiedImage] = useState(false);
  const [isAiGenerating, setIsAiGenerating] = useState(false);
  const [autoSavedTime, setAutoSavedTime] = useState<string | null>(null);
  const [hasPendingDraft, setHasPendingDraft] = useState(false);
  const canvasRef = useRef<HTMLDivElement>(null);

  // Check for existing auto-draft on mount if not opened with specific book / post params
  useEffect(() => {
    if (!urlBookId && !searchParams.get('type') && !searchParams.get('quote')) {
      const existing = loadAutoDraft();
      if (existing?.state && existing.state.slides?.length > 0) {
        setHasPendingDraft(true);
      }
    }
  }, [urlBookId, searchParams]);

  // Debounced auto-save draft to localStorage
  useEffect(() => {
    const timer = setTimeout(() => {
      saveAutoDraft(state);
      setAutoSavedTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    }, 1000);
    return () => clearTimeout(timer);
  }, [state]);

  const handleRestoreDraft = () => {
    const existing = loadAutoDraft();
    if (existing?.state) {
      setState(existing.state);
      setHasPendingDraft(false);
      toast.success('Restored your previous draft!');
    }
  };

  const handleDiscardPendingDraft = () => {
    clearAutoDraft();
    setHasPendingDraft(false);
  };

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
        const initialCaption = generateGroundedCaption({
          postType: prev.postType,
          tone: prev.captionTone,
          slide: updatedSlides[0],
          brandHandle: prev.brandWatermarkText,
        });
        const initialHashtags = generateSmartHashtags(updatedSlides[0]);
        return {
          ...prev,
          slides: updatedSlides,
          caption: initialCaption,
          hashtags: initialHashtags,
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
      const newCaption = generateGroundedCaption({
        postType: prev.postType,
        tone: prev.captionTone,
        slide: updatedSlides[prev.activeSlideIndex],
        brandHandle: prev.brandWatermarkText,
      });
      const newHashtags = generateSmartHashtags(updatedSlides[prev.activeSlideIndex]);
      return {
        ...prev,
        slides: updatedSlides,
        caption: newCaption,
        hashtags: newHashtags,
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

  const handleRegenerateCaption = async (tone: CaptionTone) => {
    setIsAiGenerating(true);
    try {
      const res = await generateContextualAiCaption({
        postType: state.postType,
        tone,
        slide: activeSlide,
        brandHandle: state.brandWatermarkText,
      });
      const freshHashtags = generateSmartHashtags(activeSlide);
      setState((prev) => ({
        ...prev,
        captionTone: tone,
        caption: res.caption,
        hashtags: freshHashtags,
      }));
      if (res.isAiGenerated) {
        toast.success('Generated contextual AI caption with Gemini!');
      } else {
        toast.success(`Generated ${tone} caption`);
      }
    } catch {
      toast.error('Could not generate caption');
    } finally {
      setIsAiGenerating(false);
    }
  };

  const handleAddSlide = () => {
    if (state.slides.length >= 10) {
      toast.error('Instagram carousels support up to 10 slides');
      return;
    }
    const nextIdx = state.slides.length + 1;
    const stages: Array<SlideData['carouselStage']> = ['hook', 'premise', 'quotes', 'breakdown', 'verdict'];
    const assignedStage = stages[Math.min(state.slides.length, stages.length - 1)];

    const newSlide: SlideData = {
      id: `slide-${Date.now()}`,
      slideNumber: nextIdx,
      bookId: activeSlide.bookId,
      bookTitle: activeSlide.bookTitle,
      author: activeSlide.author,
      coverImageUrl: activeSlide.coverImageUrl,
      rating: activeSlide.rating,
      hookLine: '',
      reviewBody: '',
      tags: [],
      carouselStage: assignedStage,
    };
    setState((prev) => ({
      ...prev,
      slides: [...prev.slides, newSlide],
      activeSlideIndex: prev.slides.length,
    }));
    toast.success(`Slide ${nextIdx} added`);
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

  // Export actions
  const handleExportSinglePng = async () => {
    if (!canvasRef.current) return;
    try {
      setIsExporting(true);
      setExportStatusText('Rendering 2x high-resolution PNG...');
      const fileName = `${(activeSlide.bookTitle || 'sahadhyayi-post').toLowerCase().replace(/[^a-z0-9]+/g, '-')}-slide-${state.activeSlideIndex + 1}.png`;
      await exportSlideToPng(canvasRef.current, fileName);
      toast.success('Downloaded high-res post image!');
    } catch (err) {
      console.error(err);
      toast.error('Could not export image. Please try again.');
    } finally {
      setIsExporting(false);
      setExportStatusText('');
    }
  };

  const handleExportZip = async () => {
    if (!canvasRef.current) return;
    try {
      setIsExporting(true);
      const fullCaptionText = `${state.caption}\n\n${state.hashtags.join(' ')}`;
      const baseName = (activeSlide.bookTitle || 'sahadhyayi-carousel').toLowerCase().replace(/[^a-z0-9]+/g, '-');

      // We render the slides sequentially
      const total = state.slides.length;
      await exportCarouselToZip(
        async (idx) => {
          setState((prev) => ({ ...prev, activeSlideIndex: idx }));
          await new Promise((r) => setTimeout(r, 120));
          return canvasRef.current;
        },
        total,
        fullCaptionText,
        baseName,
        (_curr, _tot, msg) => setExportStatusText(msg)
      );

      toast.success('Downloaded complete carousel ZIP bundle!');
    } catch (err) {
      console.error(err);
      toast.error('Could not bundle carousel ZIP.');
    } finally {
      setIsExporting(false);
      setExportStatusText('');
    }
  };

  const handleWebShare = async () => {
    if (!canvasRef.current) return;
    try {
      setIsExporting(true);
      const title = activeSlide.bookTitle || 'Book Review';
      const text = `${state.caption}\n\n${state.hashtags.join(' ')}`;
      const shared = await shareSlideViaWebShare(canvasRef.current, title, text);
      if (shared) {
        toast.success('Shared successfully!');
      } else {
        // Fallback to PNG download
        await handleExportSinglePng();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsExporting(false);
    }
  };

  const handleCopyImage = async () => {
    if (!canvasRef.current) return;
    try {
      const copied = await copySlideToClipboard(canvasRef.current);
      if (copied) {
        setCopiedImage(true);
        toast.success('Image copied to clipboard! You can paste it directly.');
        setTimeout(() => setCopiedImage(false), 2500);
      } else {
        await handleExportSinglePng();
      }
    } catch (err) {
      console.error(err);
    }
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
                {autoSavedTime && (
                  <span className="text-[10px] text-muted-foreground hidden md:inline-flex items-center gap-1 opacity-75">
                    <Check className="w-3 h-3 text-emerald-500" />
                    Auto-saved
                  </span>
                )}
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

      {/* Unsaved Draft Recovery Banner */}
      {hasPendingDraft && (
        <div className="bg-amber-500/10 border-b border-amber-500/20 px-4 py-2">
          <div className="max-w-7xl mx-auto text-xs flex flex-wrap items-center justify-between gap-2">
            <span className="flex items-center gap-1.5 text-amber-800 dark:text-amber-200">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              You have an auto-saved draft from a previous session.
            </span>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                className="h-7 text-xs border-amber-500/40 text-amber-800 dark:text-amber-200"
                onClick={handleRestoreDraft}
              >
                Resume Draft
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="h-7 text-xs text-muted-foreground"
                onClick={handleDiscardPendingDraft}
              >
                Dismiss
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Main Studio Body */}
      <main className="max-w-7xl mx-auto px-4 sm:px-8 pt-6">
        {/* Post Type Selector Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-4 scrollbar-none">
          {[
            { id: 'review', label: 'Book Review' },
            { id: 'quote', label: 'Quote Card' },
            { id: 'carousel', label: '5-Slide Carousel' },
            { id: 'recommendation', label: 'Recommendation' },
            { id: 'versus', label: 'Book Battle' },
            { id: 'tbr', label: 'TBR Stack' },
            { id: 'wrapup', label: 'Monthly Wrap-Up' },
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

            {/* Quick Export Action Bar beneath Canvas */}
            <div className="w-full max-w-[420px] sm:max-w-[460px] flex items-center gap-2 mt-4 px-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleExportSinglePng}
                disabled={isExporting}
                className="flex-1 h-9 text-xs font-semibold gap-1.5"
              >
                {isExporting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
                Download PNG
              </Button>
              {state.slides.length > 1 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleExportZip}
                  disabled={isExporting}
                  className="flex-1 h-9 text-xs font-semibold gap-1.5"
                >
                  <Archive className="w-3.5 h-3.5 text-amber-500" />
                  ZIP Carousel
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={handleWebShare}
                disabled={isExporting}
                className="h-9 px-3 text-xs"
                title="Share to Instagram or mobile apps"
              >
                <Share className="w-3.5 h-3.5" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopyImage}
                disabled={isExporting}
                className="h-9 px-3 text-xs"
                title="Copy image to clipboard"
              >
                {copiedImage ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Clipboard className="w-3.5 h-3.5" />}
              </Button>
            </div>
            {exportStatusText && (
              <p className="text-[11px] text-muted-foreground mt-2 animate-pulse">
                {exportStatusText}
              </p>
            )}
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
                      Captions & AI
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
                      selectedTexture={state.backgroundTexture}
                      selectedFont={state.fontPairing}
                      onSelectTemplate={(tpl) =>
                        setState((prev) => ({ ...prev, templateId: tpl }))
                      }
                      onSelectTexture={(tex) =>
                        setState((prev) => ({ ...prev, backgroundTexture: tex }))
                      }
                      onSelectFont={(f) =>
                        setState((prev) => ({ ...prev, fontPairing: f }))
                      }
                    />
                  </TabsContent>

                  {/* Tab 3: Caption & Grounded AI Assistant */}
                  <TabsContent value="export" className="mt-0 space-y-4">
                    {/* Tone Switcher */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold flex items-center justify-between">
                        <span className="flex items-center gap-1.5">
                          <Wand2 className="w-3.5 h-3.5 text-amber-500" />
                          Grounded Caption Tone
                        </span>
                      </label>
                      <div className="grid grid-cols-2 gap-1.5">
                        {[
                          { id: 'thoughtful', label: 'Thoughtful / Literary' },
                          { id: 'casual', label: 'Casual & Chatty' },
                          { id: 'poetic', label: 'Lyrical / Poetic' },
                          { id: 'bilingual', label: 'Bilingual (Hinglish)' },
                        ].map((t) => (
                          <button
                            key={t.id}
                            type="button"
                            onClick={() => handleRegenerateCaption(t.id as CaptionTone)}
                            className={`p-2 rounded-lg border text-xs text-left transition-all ${
                              state.captionTone === t.id
                                ? 'bg-amber-500/10 border-amber-500 text-amber-900 dark:text-amber-200 font-semibold'
                                : 'border-border/70 hover:bg-accent/20 text-muted-foreground'
                            }`}
                          >
                            {t.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Caption Field */}
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
                        className="w-full text-xs p-2.5 rounded-lg border bg-background resize-none focus:outline-none focus:ring-1 focus:ring-primary leading-relaxed"
                        placeholder="Your review caption for Instagram..."
                      />
                    </div>

                    {/* Hashtags */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold">Grounded Bookstagram Hashtags</label>
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

                    {/* Download & Share Actions */}
                    <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-800 dark:text-amber-200 space-y-2">
                      <div className="flex items-center gap-1.5 font-bold">
                        <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                        Ready to Publish
                      </div>
                      <p className="text-[11px] opacity-90 leading-relaxed">
                        Export your 1080p high-res slides and copy your caption to publish directly to Instagram, Threads, or WhatsApp.
                      </p>
                      <div className="grid grid-cols-2 gap-2 pt-1">
                        <Button
                          size="sm"
                          onClick={handleExportSinglePng}
                          disabled={isExporting}
                          className="h-8 text-xs bg-amber-500 hover:bg-amber-600 text-white font-semibold"
                        >
                          <Download className="w-3.5 h-3.5 mr-1" />
                          Download PNG
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={handleCopyCaption}
                          className="h-8 text-xs border-amber-500/40 font-semibold"
                        >
                          <Copy className="w-3.5 h-3.5 mr-1" />
                          Copy Caption
                        </Button>
                      </div>
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
