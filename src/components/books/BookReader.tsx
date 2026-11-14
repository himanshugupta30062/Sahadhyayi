
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useQuotes } from '@/contexts/quotesHelpers';
import { 
  BookOpen, 
  ChevronLeft, 
  ChevronRight, 
  Settings, 
  Search, 
  List,
  Sun,
  Moon,
  Minus,
  Plus,
  Menu,
  Maximize,
  Minimize,
  Volume2,
  Bookmark,
  Clock,
  Eye,
  Download,
  Share2,
  Quote,
  AlertTriangle,
  ExternalLink,
  FileText,
  RefreshCw,
  ShieldAlert
} from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { AddMarginNoteDialog } from '@/components/social/margins/AddMarginNoteDialog';
import { ReaderMarginDrawer } from './ReaderMarginDrawer';
import { useAuth } from '@/contexts/authHelpers';
import { useReadingProgress, useSaveReadingProgress } from '@/hooks/useReadingProgress';
import { useAudioSummary } from '@/hooks/useAudioSummaries';
import { useChapterProgress, useMarkChapterAsRead } from '@/hooks/useChapterProgress';
import { searchExternalSources } from '@/utils/searchExternalSources';
import { loadProgressLocally, saveProgressLocally } from '@/utils/readingProgressStorage';
import { useReaderBookmarks, useAddReaderBookmark } from '@/hooks/useReaderBookmarks';
import { useAddReaderHighlight } from '@/hooks/useReaderHighlights';
import {
  extractGoogleBooksId,
  validateReaderUrl,
  buildSafePdfEmbedUrl,
  buildSafeGoogleBooksEmbedUrl,
  checkGoogleBooksEmbeddability,
  GoogleBooksVolumeDetails,
} from '@/utils/bookReaderPreview';

interface BookReaderProps {
  bookId: string;
  bookTitle: string;
  pdfUrl?: string;
  epubUrl?: string;
}

const BookReader = ({ bookId, bookTitle, pdfUrl, epubUrl }: BookReaderProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { addQuote } = useQuotes();
  const [searchParams] = useSearchParams();
  const pageParam = searchParams.get('page');
  const [readerTheme, setReaderTheme] = useState<'light' | 'sepia' | 'dark'>('light');
  const isDarkMode = readerTheme === 'dark';
  const [fontSize, setFontSize] = useState(16);
  const [showToc, setShowToc] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [currentPage, setCurrentPage] = useState(pageParam ? Number.parseInt(pageParam, 10) || 1 : 1);
  const [totalPages, setTotalPages] = useState(0);
  const [readingTime, setReadingTime] = useState(0);
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [tocItems, setTocItems] = useState<any[]>([]);
  const [currentLocation, setCurrentLocation] = useState('');
  const [bookmarks, setBookmarks] = useState<string[]>([]);
  const [selectedText, setSelectedText] = useState('');
  const [showSaveQuote, setShowSaveQuote] = useState(false);
  const viewerRef = useRef<HTMLDivElement>(null);
  const renditionRef = useRef<any>(null);
  const bookRef = useRef<any>(null);
  const readingTimerRef = useRef<NodeJS.Timeout | null>(null);
  const [completedChapters, setCompletedChapters] = useState<number[]>([]);

  // Hooks for data management
  const { data: readingProgress } = useReadingProgress();
  const saveProgress = useSaveReadingProgress();
  const { data: cloudBookmarks = [] } = useReaderBookmarks(bookId);
  const addCloudBookmark = useAddReaderBookmark();
  const addReaderHighlight = useAddReaderHighlight();
  const { data: audioSummary } = useAudioSummary(bookId);
  const { data: chapterProgress = [] } = useChapterProgress(bookId);
  const markChapterRead = useMarkChapterAsRead(bookId);
  const [isResolvingSources, setIsResolvingSources] = useState(false);
  const [sourceSearchDone, setSourceSearchDone] = useState(false);
  const [readUrls, setReadUrls] = useState<string[]>(pdfUrl ? [pdfUrl] : []);
  const [activeReadUrlIndex, setActiveReadUrlIndex] = useState(0);

  useEffect(() => {
    setReadUrls(pdfUrl ? [pdfUrl] : []);
    setActiveReadUrlIndex(0);
    setSourceSearchDone(false);
  }, [bookId, pdfUrl]);

  useEffect(() => {
    let cancelled = false;

    const loadReadSources = async () => {
      setIsResolvingSources(true);
      try {
        const externalBooks = await searchExternalSources(bookTitle);
        if (cancelled || !externalBooks.length) return;

        const externalUrls = externalBooks
          .map((book) => book.downloadUrl)
          .filter((url): url is string => Boolean(url));

        if (!externalUrls.length) return;

        setReadUrls((prev) => {
          const merged = [...prev, ...externalUrls];
          return [...new Set(merged)];
        });
      } catch (error) {
        console.error('Failed to resolve external reading sources:', { name: error instanceof Error ? error.name : 'UnknownError' });
      } finally {
        if (!cancelled) {
          setSourceSearchDone(true);
          setIsResolvingSources(false);
        }
      }
    };

    void loadReadSources();

    return () => {
      cancelled = true;
    };
  }, [bookTitle]);

  // Google Books & PDF Preview State
  const [gbooksStatus, setGbooksStatus] = useState<'loading' | 'available' | 'restricted' | 'error' | 'idle'>('idle');
  const [gbooksDetails, setGbooksDetails] = useState<GoogleBooksVolumeDetails | null>(null);
  const [gbooksIframeLoaded, setGbooksIframeLoaded] = useState(false);
  const [gbooksFallbackActive, setGbooksFallbackActive] = useState(false);
  const [gbooksRetryCount, setGbooksRetryCount] = useState(0);

  const [pdfStatus, setPdfStatus] = useState<'loading' | 'loaded' | 'blocked' | 'error'>('loading');
  const [pdfIframeLoaded, setPdfIframeLoaded] = useState(false);
  const [pdfManualFallback, setPdfManualFallback] = useState(false);
  const [pdfRetryCount, setPdfRetryCount] = useState(0);

  const activeReadUrl = readUrls[activeReadUrlIndex];

  useEffect(() => {
    // An explicit page in the URL is intentional (shared link, chapter link,
    // or reader navigation). It must win over the user's last saved position.
    const requestedPage = Number.parseInt(pageParam ?? '', 10);
    if (pageParam !== null && Number.isFinite(requestedPage) && requestedPage > 0) {
      setCurrentPage(requestedPage);
      return;
    }

    const saved = readingProgress?.find((item) => item.book_id === bookId);
    const local = loadProgressLocally(bookId, user?.id);
    const resumePage = saved?.current_page || local?.currentPage || 1;
    if (resumePage > 1) setCurrentPage(resumePage);
  }, [bookId, readingProgress, user?.id, pageParam]);

  const urlAnalysis = React.useMemo(() => {
    return validateReaderUrl(activeReadUrl);
  }, [activeReadUrl]);

  // Determine book type and URLs
  // Check both the explicit epubUrl prop and the URL analysis for EPUB detection
  const isEpub = Boolean(epubUrl && epubUrl.length > 0) || urlAnalysis.isEpub;
  const isGoogleBooks = urlAnalysis.isGoogleBooks;
  const googleBooksId = urlAnalysis.googleBooksId;
  const isArchive = Boolean(activeReadUrl && /archive\.org/i.test(activeReadUrl));
  const isExplicitPdf = urlAnalysis.isPdf;
  // Treat any non-Google reading URL as a PDF/embed candidate so books with
  // unusual extensions still get a viewer instead of "Unsupported format".
  const isPdf = !isEpub && !isGoogleBooks && Boolean(activeReadUrl && (isExplicitPdf || isArchive || !!pdfUrl));

  const bookUrl = isEpub ? (epubUrl || activeReadUrl) : activeReadUrl;

  // Probe Google Books API for embed restrictions
  useEffect(() => {
    if (!isGoogleBooks || !googleBooksId) {
      setGbooksStatus('idle');
      setGbooksDetails(null);
      return;
    }

    let isCancelled = false;
    setGbooksStatus('loading');
    setGbooksIframeLoaded(false);
    setGbooksFallbackActive(false);

    checkGoogleBooksEmbeddability(googleBooksId)
      .then((details) => {
        if (isCancelled) return;
        setGbooksDetails(details);
        if (details.status === 'restricted' || details.status === 'invalid_id') {
          setGbooksStatus('restricted');
        } else {
          setGbooksStatus('available');
        }
      })
      .catch(() => {
        if (isCancelled) return;
        setGbooksStatus('available');
      });

    return () => {
      isCancelled = true;
    };
  }, [isGoogleBooks, googleBooksId, gbooksRetryCount]);

  // Handle PDF embed timeout detection
  useEffect(() => {
    if (!isPdf || !activeReadUrl) {
      setPdfStatus('loading');
      setPdfIframeLoaded(false);
      return;
    }

    let isCancelled = false;
    setPdfStatus('loading');
    setPdfIframeLoaded(false);
    setPdfManualFallback(false);

    const timer = setTimeout(() => {
      if (!isCancelled) {
        setPdfStatus((prev) => (prev === 'loaded' ? 'loaded' : 'blocked'));
      }
    }, 6500);

    return () => {
      isCancelled = true;
      clearTimeout(timer);
    };
  }, [isPdf, activeReadUrl, currentPage, pdfRetryCount]);

  const handleReaderLoadError = () => {
    if (activeReadUrlIndex >= readUrls.length - 1) return;
    const nextIndex = activeReadUrlIndex + 1;
    setActiveReadUrlIndex(nextIndex);
    toast({
      title: 'Trying another source',
      description: `This link is restricted. Switching to source ${nextIndex + 1} of ${readUrls.length}.`,
    });
  };

  // Calculate reading progress percentage
  const progressPercentage = totalPages > 0 ? (currentPage / totalPages) * 100 : 0;
  const chapterProgressPercent =
    tocItems.length > 0 ? (completedChapters.length / tocItems.length) * 100 : 0;

  // Prefer cloud bookmarks for signed-in readers; local bookmarks remain a migration fallback.
  useEffect(() => {
    if (!user || !cloudBookmarks.length) return;
    setBookmarks(cloudBookmarks.map((bookmark) => bookmark.location));
  }, [user, cloudBookmarks]);

  // Initialize reading session
  useEffect(() => {
    if (bookUrl && user) {
      setStartTime(new Date());
      startReadingTimer();
      
      // Load saved bookmarks
      const local = loadProgressLocally(bookId, user?.id);
      if (local?.bookmarks && local.bookmarks.length > 0) {
        setBookmarks(local.bookmarks);
      }
    }

    return () => {
      if (readingTimerRef.current) {
        clearInterval(readingTimerRef.current);
      }
    };
  }, [bookUrl, user, bookId]);

  const loadEpubBookRef = useRef<() => Promise<void>>(() => Promise.resolve());

  useEffect(() => {
    if (isEpub && bookUrl && viewerRef.current) {
      void loadEpubBookRef.current();
    }
  }, [isEpub, bookUrl]);

  // Load PDF.js when reading PDFs to determine total pages
  useEffect(() => {
    if (isPdf && bookUrl) {
      const loadPdfjs = () => {
        const fetchPages = () => {
          try {
            const pdfjsLib = (window as any).pdfjsLib;
            pdfjsLib.GlobalWorkerOptions.workerSrc =
              'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
            pdfjsLib
              .getDocument(bookUrl)
              .promise.then((pdf: any) => setTotalPages(pdf.numPages))
              .catch((err: any) => console.error('Error loading PDF:', { name: err instanceof Error ? err.name : 'UnknownError' }));
          } catch (err) {
            console.error('PDF.js not available', { name: err instanceof Error ? err.name : 'UnknownError' });
          }
        };

        if (!(window as any).pdfjsLib) {
          const script = document.createElement('script');
          script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
          script.integrity = 'sha512-q+4liFwdPC/bNdhUpZx6aXDx/h77yEQtn4I1slHydcbZK34nLaR3cAeYSJshoxIOq3mjEf7xJE8YWIUHMn+oCQ==';
          script.crossOrigin = 'anonymous';
          script.referrerPolicy = 'no-referrer';
          script.onload = fetchPages;
          document.head.appendChild(script);
        } else {
          fetchPages();
        }
      };

      loadPdfjs();
    }
  }, [isPdf, bookUrl]);

  useEffect(() => {
    const viewer = viewerRef.current;
    if (!viewer) return;
    viewer.addEventListener('mouseup', handleSelection);
    return () => {
      viewer.removeEventListener('mouseup', handleSelection);
    };
  }, [bookUrl]);

  useEffect(() => {
    if (chapterProgress && chapterProgress.length > 0) {
      setCompletedChapters(chapterProgress.map(cp => cp.chapter_number));
    }
  }, [chapterProgress]);

  const startReadingTimer = () => {
    if (readingTimerRef.current) {
      clearInterval(readingTimerRef.current);
    }
    
    readingTimerRef.current = setInterval(() => {
      setReadingTime(prev => prev + 1);
    }, 60000); // Update every minute
  };

  const loadEpubBook = async () => {
    // Load EPUB.js dynamically
    if (!(window as any).ePub) {
      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/epubjs@0.3.93/dist/epub.min.js';
      script.integrity = 'sha384-ZqmkDa/1AGF4SKdSmXgEG+3G+Gsb6yNqUSq2Mqp0jDf1GWk+UY5eNbEd7hgwiywI';
      script.crossOrigin = 'anonymous';
      script.referrerPolicy = 'no-referrer';
      script.onload = () => initializeEpub();
      document.head.appendChild(script);
    } else {
      initializeEpub();
    }
  };
  loadEpubBookRef.current = loadEpubBook;

  const initializeEpub = () => {
    if (!bookUrl || !viewerRef.current) return;

    try {
      const ePub = (window as any).ePub;
      bookRef.current = ePub(bookUrl);
      
      renditionRef.current = bookRef.current.renderTo(viewerRef.current, {
        width: "100%",
        height: "100%",
        spread: "none"
      });

      renditionRef.current.display();

      // Load Table of Contents
      bookRef.current.loaded.navigation.then((nav: any) => {
        setTocItems(nav.toc || []);
      });

      // Generate EPUB locations so page links can resolve to a stable CFI.
      bookRef.current.ready.then(() => {
        bookRef.current.locations.generate(1024).then(() => {
          const pageCount = bookRef.current.locations.total;
          setTotalPages(pageCount);

          const requestedPage = Number.parseInt(pageParam ?? '', 10);
          if (Number.isInteger(requestedPage) && requestedPage > 0) {
            const targetPage = Math.min(pageCount, requestedPage);
            const targetCfi = bookRef.current.locations.cfiFromLocation(targetPage - 1);
            if (targetCfi) renditionRef.current.display(targetCfi);
          }
        });
      });

      // Handle location changes
      renditionRef.current.on("relocated", (location: any) => {
        setCurrentLocation(location.start.cfi);
        
        // Update current page
        const currentPageNum = bookRef.current.locations.locationFromCfi(location.start.cfi);
        setCurrentPage(currentPageNum);
        
        // Save reading position and progress immediately
        saveProgressLocally(
          {
            bookId,
            currentPage: currentPageNum,
            position: location.start.cfi,
            totalPages: totalPages > 0 ? totalPages : 1,
          },
          user?.id
        );
      });

      // Load previous reading position
      const explicitPage = Number.parseInt(pageParam ?? '', 10);
      const hasExplicitPage = Number.isInteger(explicitPage) && explicitPage > 0;
      const local = loadProgressLocally(bookId, user?.id);
      if (!hasExplicitPage && local?.position) {
        renditionRef.current.display(local.position);
      }

      // Apply initial theme and font
      applyTheme();
      applyFontSize();

    } catch (error) {
      console.error('Error loading EPUB:', { name: error instanceof Error ? error.name : 'UnknownError' });
      toast({
        title: "Error",
        description: "Failed to load the book. Please try again.",
        variant: "destructive"
      });
    }
  };

  const applyTheme = useCallback((theme: 'light' | 'sepia' | 'dark' = readerTheme) => {
    if (!renditionRef.current) return;

    if (theme === 'dark') {
      renditionRef.current.themes.default({
        "body": {
          "background": "#1a1a1a !important",
          "color": "#e5e5e5 !important"
        },
        "p": {
          "color": "#e5e5e5 !important"
        },
        "h1, h2, h3, h4, h5, h6": {
          "color": "#ffffff !important"
        }
      });
    } else if (theme === 'sepia') {
      renditionRef.current.themes.default({
        "body": {
          "background": "#fbf0d9 !important",
          "color": "#4a3c28 !important"
        },
        "p": {
          "color": "#4a3c28 !important"
        },
        "h1, h2, h3, h4, h5, h6": {
          "color": "#2c2214 !important"
        }
      });
    } else {
      renditionRef.current.themes.default({
        "body": {
          "background": "#ffffff !important",
          "color": "#1a1a1a !important"
        },
        "p": {
          "color": "#1a1a1a !important"
        },
        "h1, h2, h3, h4, h5, h6": {
          "color": "#111111 !important"
        }
      });
    }
  }, [readerTheme]);

  const applyFontSize = () => {
    if (!renditionRef.current) return;

    renditionRef.current.themes.fontSize(`${fontSize}px`);
  };

  const saveReadingProgress = useCallback(async (page: number) => {
    if (!user || totalPages <= 0) return;

    try {
      saveProgressLocally(
        { bookId, currentPage: page, totalPages, position: currentLocation },
        user.id
      );
      await saveProgress.mutateAsync({
        bookId,
        bookTitle,
        currentPage: page,
        totalPages,
      });
    } catch (error) {
      console.error('Error saving reading progress:', { name: error instanceof Error ? error.name : 'UnknownError' });
    }
  }, [bookId, bookTitle, currentLocation, saveProgress, totalPages, user]);

  useEffect(() => {
    if (totalPages <= 0 || currentPage <= 0) return;
    saveProgressLocally(
      { bookId, currentPage, totalPages, position: currentLocation },
      user?.id
    );

    if (!user?.id) return;
    const timer = window.setTimeout(() => {
      void saveReadingProgress(currentPage);
    }, 800);
    return () => window.clearTimeout(timer);
  }, [bookId, currentPage, totalPages, currentLocation, user?.id, saveReadingProgress]);

  // Flush reading progress when tab closes or user navigates away
  useEffect(() => {
    const handleUnload = () => {
      if (currentPage > 0) {
        saveProgressLocally(
          { bookId, currentPage, totalPages, position: currentLocation, bookmarks },
          user?.id
        );
      }
    };

    window.addEventListener('beforeunload', handleUnload);
    window.addEventListener('pagehide', handleUnload);
    return () => {
      window.removeEventListener('beforeunload', handleUnload);
      window.removeEventListener('pagehide', handleUnload);
    };
  }, [bookId, currentPage, totalPages, currentLocation, bookmarks, user?.id]);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      void viewerRef.current?.requestFullscreen?.();
      setIsFullscreen(true);
    } else {
      void document.exitFullscreen?.();
      setIsFullscreen(false);
    }
  };

  const addBookmark = () => {
    if (!currentLocation) return;
    
    const newBookmarks = [...bookmarks, currentLocation];
    setBookmarks(newBookmarks);
    saveProgressLocally(
      { bookId, bookmarks: newBookmarks, currentPage, totalPages, position: currentLocation },
      user?.id
    );
    if (user?.id) {
      void addCloudBookmark.mutateAsync({ bookId, location: currentLocation, page: currentPage })
        .then(() => toast({ title: "Bookmark synced", description: "Available across your devices." }))
        .catch((error) => toast({ title: "Bookmark saved locally", description: error.message || "Cloud sync failed; it will remain on this device.", variant: "destructive" }));
    } else {
      toast({ title: "Bookmark Added", description: "Sign in to sync it across devices." });
    }
  };

  const handleSelection = () => {
    const sel = window.getSelection();
    const text = sel ? sel.toString().trim() : '';
    if (text) {
      setSelectedText(text);
      setShowSaveQuote(true);
    } else {
      setShowSaveQuote(false);
    }
  };

  const saveSelectedHighlight = async () => {
    if (!selectedText || !user?.id) {
      toast({ title: 'Sign in required', description: 'Highlights sync privately across your devices.' });
      return;
    }
    try {
      await addReaderHighlight.mutateAsync({ bookId, text: selectedText, page: currentPage, location: currentLocation || undefined });
      toast({ title: 'Highlight saved', description: `Saved on page ${currentPage}.` });
      setSelectedText('');
      setShowSaveQuote(false);
    } catch (error) {
      toast({ title: 'Could not save highlight', description: error instanceof Error ? error.message : 'Please try again.', variant: 'destructive' });
    }
  };

  const saveSelectedQuote = () => {
    if (!selectedText) return;
    addQuote(selectedText, bookTitle, undefined, { bookId, page: currentPage, location: currentLocation || undefined });
    toast({ title: 'Quote Saved', description: 'Highlight added to your quotes.' });
    setSelectedText('');
    setShowSaveQuote(false);
  };

  const goToBookmark = (bookmark: string) => {
    if (renditionRef.current) {
      renditionRef.current.display(bookmark);
    }
  };

  const shareBook = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: bookTitle,
          text: `Check out "${bookTitle}" on Sahadhyayi`,
          url: window.location.href,
        });
      } catch (error) {
        console.error('Error sharing:', { name: error instanceof Error ? error.name : 'UnknownError' });
      }
    } else {
      // Fallback: copy to clipboard
      void navigator.clipboard.writeText(window.location.href);
      toast({
        title: "Link Copied",
        description: "Book link copied to clipboard!",
      });
    }
  };

  const navigateNext = () => {
    if (renditionRef.current) {
      renditionRef.current.next();
    }
  };

  const navigatePrevious = () => {
    if (renditionRef.current) {
      renditionRef.current.prev();
    }
  };

  const navigatePdfNext = () => {
    setCurrentPage(prev => (totalPages ? Math.min(totalPages, prev + 1) : prev + 1));
  };

  const navigatePdfPrevious = () => {
    setCurrentPage(prev => Math.max(1, prev - 1));
  };

  const goToChapter = (href: string) => {
    if (renditionRef.current) {
      renditionRef.current.display(href);
      setShowToc(false);
    }
  };

  const handleMarkChapterRead = async (chapterNumber: number) => {
    if (completedChapters.includes(chapterNumber)) return;
    const previous = completedChapters;
    setCompletedChapters(prev => [...prev, chapterNumber]);
    try {
      await markChapterRead.mutateAsync(chapterNumber);
    } catch (error) {
      console.error('Error marking chapter as read:', { name: error instanceof Error ? error.name : 'UnknownError' });
      setCompletedChapters(previous);
    }
  };

  const increaseFontSize = () => {
    if (fontSize < 24) {
      const newSize = fontSize + 2;
      setFontSize(newSize);
      if (isEpub) {
        setTimeout(applyFontSize, 100);
      }
    }
  };

  const decreaseFontSize = () => {
    if (fontSize > 12) {
      const newSize = fontSize - 2;
      setFontSize(newSize);
      if (isEpub) {
        setTimeout(applyFontSize, 100);
      }
    }
  };

  const handleThemeChange = (theme: 'light' | 'sepia' | 'dark') => {
    setReaderTheme(theme);
    if (isEpub) {
      setTimeout(() => applyTheme(theme), 50);
    }
  };

  useEffect(() => {
    if (isEpub) {
      applyTheme(readerTheme);
    }
  }, [applyTheme, isEpub, readerTheme]);

  const formatReadingTime = (minutes: number) => {
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  if (!bookUrl && !isGoogleBooks && sourceSearchDone) {
    return (
      <div className="text-center py-12">
        <BookOpen className="w-16 h-16 mx-auto mb-4 text-gray-400" />
        <h3 className="text-xl font-semibold text-gray-700 mb-2">No reading link available yet</h3>
        <p className="text-gray-500 mb-2">We couldn't find an open-access copy of this book online.</p>
        <p className="text-xs text-muted-foreground max-w-md mx-auto mb-4">
          This title may be under active copyright protection and unavailable in the public domain. You can check for a preview or borrow an edition below.
        </p>
        <div className="flex flex-wrap gap-2 justify-center mt-6">
          <Button variant="outline" onClick={() => window.open(`https://www.google.com/search?q=${encodeURIComponent(bookTitle + ' read online')}`, '_blank', 'noopener,noreferrer')}>
            Search Google
          </Button>
          <Button variant="outline" onClick={() => window.open(`https://archive.org/search.php?query=${encodeURIComponent(bookTitle)}`, '_blank', 'noopener,noreferrer')}>
            Search Internet Archive
          </Button>
          <Button variant="outline" onClick={() => window.open(`https://openlibrary.org/search?q=${encodeURIComponent(bookTitle)}`, '_blank', 'noopener,noreferrer')}>
            Check Open Library
          </Button>
          {audioSummary && (
            <Button variant="outline" className="flex items-center gap-2">
              <Volume2 className="w-4 h-4" />
              Listen to Audio Summary
            </Button>
          )}
        </div>
      </div>
    );
  }

  if (!bookUrl && isResolvingSources) {
    return (
      <div className="text-center py-12">
        <BookOpen className="w-16 h-16 mx-auto mb-4 text-gray-400 animate-pulse" />
        <h3 className="text-xl font-semibold text-gray-700 mb-2">Finding available reading sources...</h3>
        <p className="text-gray-500">Checking Open Library, Google Books, Project Gutenberg, and Internet Archive.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Enhanced Header with Progress */}
      <div className="text-center mb-6">
        <div className="flex items-center justify-center gap-2 mb-2">
          <BookOpen className="w-6 h-6 text-orange-600" />
          <h3 className="text-2xl font-bold text-orange-900">Read Book</h3>
        </div>
        <p className="text-orange-700 mb-4">Enjoy reading "{bookTitle}" online</p>
        
        {/* Reading Progress Bar */}
        {totalPages > 0 && (
          <div className="max-w-md mx-auto space-y-2">
            <Progress value={progressPercentage} className="h-2" />
            <div className="flex justify-between text-sm text-gray-600">
              <span>Page {currentPage} of {totalPages}</span>
              <span>{Math.round(progressPercentage)}% Complete</span>
            </div>
          </div>
        )}

        {/* Reading Session Info */}
        {user && (
          <div className="flex justify-center gap-4 mt-4 text-sm text-gray-600">
            <div className="flex items-center gap-1">
              <Clock className="w-4 h-4" />
              <span>Session: {formatReadingTime(readingTime)}</span>
            </div>
            <div className="flex items-center gap-1">
              <Eye className="w-4 h-4" />
              <span>{bookmarks.length} Bookmarks</span>
            </div>
          </div>
        )}
      </div>

      {/* Enhanced Reader Controls */}
      <Card className="bg-white/80 backdrop-blur-sm border-orange-200 shadow-sm">
        <CardHeader className="pb-3 px-3 sm:px-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <CardTitle className="text-base sm:text-lg text-orange-900 flex items-center gap-2 min-w-0">
              <BookOpen className="w-5 h-5 shrink-0" />
              <span className="truncate">{bookTitle}</span>
            </CardTitle>
            <div className="flex items-center gap-2 flex-wrap">
              {/* Audio Summary Button */}
              {audioSummary && (
                <Button
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-1"
                >
                  <Volume2 className="w-4 h-4" />
                  <span className="hidden sm:inline">Audio</span>
                </Button>
              )}

              {/* Bookmark Button */}
              {user && isEpub && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={addBookmark}
                  className="flex items-center gap-1"
                >
                  <Bookmark className="w-4 h-4" />
                  <span className="hidden sm:inline">Save</span>
                </Button>
              )}

              {/* Community Margins Drawer & Add Note */}
              <ReaderMarginDrawer
                bookId={bookId}
                bookTitle={bookTitle}
                currentPage={currentPage || 1}
                selectedText={selectedText || ""}
              />

              {/* Table of Contents */}
              {isEpub && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowToc(!showToc)}
                  className="flex items-center gap-1"
                >
                  <List className="w-4 h-4" />
                  <span className="hidden sm:inline">TOC</span>
                </Button>
              )}

              {/* Open PDF in new tab */}
              {isPdf && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => activeReadUrl && window.open(activeReadUrl, '_blank', 'noopener,noreferrer')}
                  className="flex items-center gap-1"
                >
                  <Download className="w-4 h-4" />
                  <span className="hidden sm:inline">Open</span>
                </Button>
              )}

              {/* Settings */}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowSettings(!showSettings)}
                className="flex items-center gap-1"
              >
                <Settings className="w-4 h-4" />
                <span className="hidden sm:inline">Settings</span>
              </Button>

              {/* Share Button */}
              <Button
                variant="outline"
                size="sm"
                onClick={shareBook}
                className="flex items-center gap-1"
              >
                <Share2 className="w-4 h-4" />
                <span className="hidden sm:inline">Share</span>
              </Button>

              {/* Fullscreen Toggle */}
              <Button
                variant="outline"
                size="sm"
                onClick={toggleFullscreen}
                className="flex items-center gap-1"
              >
                {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4 px-3 sm:px-6">
          {/* Settings Panel */}
          {showSettings && (
            <Card className="bg-gray-50 border-gray-200">
              <CardContent className="p-4 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Reading Theme Selector */}
                  <div className="flex flex-col gap-1.5 justify-center">
                    <Label className="text-xs text-muted-foreground">Reading Theme</Label>
                    <div className="flex items-center gap-1.5">
                      <Button
                        type="button"
                        size="sm"
                        variant={readerTheme === 'light' ? 'default' : 'outline'}
                        onClick={() => handleThemeChange('light')}
                        className={`h-7 px-2.5 text-xs ${readerTheme === 'light' ? 'bg-white text-black border border-gray-300 shadow-xs' : ''}`}
                      >
                        <Sun className="w-3 h-3 mr-1" /> Light
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant={readerTheme === 'sepia' ? 'default' : 'outline'}
                        onClick={() => handleThemeChange('sepia')}
                        className={`h-7 px-2.5 text-xs ${readerTheme === 'sepia' ? 'bg-[#fbf0d9] text-[#4a3c28] border border-amber-300 shadow-xs' : 'text-amber-800'}`}
                      >
                        Sepia (Warm)
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant={readerTheme === 'dark' ? 'default' : 'outline'}
                        onClick={() => handleThemeChange('dark')}
                        className={`h-7 px-2.5 text-xs ${readerTheme === 'dark' ? 'bg-gray-900 text-white shadow-xs' : ''}`}
                      >
                        <Moon className="w-3 h-3 mr-1" /> Dark
                      </Button>
                    </div>
                  </div>

                  {/* Font Size Controls */}
                  <div className="flex items-center justify-between">
                    <Label>Font Size</Label>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={decreaseFontSize}
                        disabled={fontSize <= 12}
                      >
                        <Minus className="w-3 h-3" />
                      </Button>
                      <span className="text-sm w-8 text-center">{fontSize}</span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={increaseFontSize}
                        disabled={fontSize >= 24}
                      >
                        <Plus className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>

                  {/* Reading Statistics */}
                  <div className="flex items-center justify-between">
                    <Label>Reading Stats</Label>
                    <div className="text-sm text-gray-600">
                      {user ? (
                        <div className="space-y-1">
                          <div>Session: {formatReadingTime(readingTime)}</div>
                          <div>{Math.round(progressPercentage)}% Complete</div>
                        </div>
                      ) : (
                        'Sign in to track progress'
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Bookmarks Panel */}
          {user && bookmarks.length > 0 && (
            <Card className="bg-gray-50 border-gray-200 max-h-32 overflow-y-auto">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Bookmarks ({bookmarks.length})</CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-1">
                  {bookmarks.map((bookmark, index) => (
                    <button
                      key={index}
                      className="w-full text-left p-2 text-sm hover:bg-white rounded transition-colors flex items-center gap-2"
                      onClick={() => goToBookmark(bookmark)}
                    >
                      <Bookmark className="w-3 h-3" />
                      Bookmark {index + 1}
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Table of Contents */}
          {showToc && isEpub && tocItems.length > 0 && (
            <Card className="bg-gray-50 border-gray-200 max-h-64 overflow-y-auto">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Table of Contents</CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="mb-3">
                  <Progress value={chapterProgressPercent} className="h-2" />
                  <div className="text-xs text-gray-600 text-center mt-1">
                    {completedChapters.length}/{tocItems.length} chapters read
                  </div>
                </div>
                <div className="space-y-1">
                  {tocItems.map((item, index) => {
                    const chapterNumber = index + 1;
                    const isDone = completedChapters.includes(chapterNumber);
                    return (
                      <div
                        key={index}
                        className="flex items-center justify-between"
                      >
                        <button
                          className="flex-1 text-left p-2 text-sm hover:bg-white rounded transition-colors"
                          onClick={() => goToChapter(item.href)}
                        >
                          {item.label}
                        </button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleMarkChapterRead(chapterNumber)}
                          disabled={isDone}
                        >
                          {isDone ? 'Read' : 'Mark as Read'}
                        </Button>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Enhanced Reader Area */}
          <div className="relative">
            {isEpub ? (
              <>
                <div
                  ref={viewerRef}
                  className={`w-full border rounded-lg overflow-hidden transition-colors ${
                    readerTheme === 'dark'
                      ? 'bg-gray-900 border-gray-700'
                      : readerTheme === 'sepia'
                      ? 'bg-[#fbf0d9] border-amber-200'
                      : 'bg-white border-gray-300'
                  } ${isFullscreen ? 'h-screen' : 'h-[600px]'}`}
                  style={{ fontSize: `${fontSize}px` }}
                />
                {showSaveQuote && (
                  <div className="absolute bottom-4 right-4 bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm p-2 rounded-xl shadow-lg border border-border flex items-center gap-2 z-20">
                    <Button size="sm" onClick={saveSelectedQuote}>Save Quote</Button>
                    {user && (
                      <Button size="sm" variant="outline" onClick={() => void saveSelectedHighlight()} disabled={addReaderHighlight.isPending}>
                        Save Highlight
                      </Button>
                    )}
                    {user && (
                      <AddMarginNoteDialog
                        initialBookId={bookId}
                        initialBookTitle={bookTitle}
                        initialPage={currentPage || 1}
                        initialQuote={selectedText}
                        onDone={() => {
                          setSelectedText('');
                          setShowSaveQuote(false);
                        }}
                        trigger={
                          <Button size="sm" variant="outline" className="text-amber-700 dark:text-amber-300 border-amber-300 gap-1">
                            <Quote className="w-3.5 h-3.5" /> Margin Note
                          </Button>
                        }
                      />
                    )}
                    <Button size="sm" variant="ghost" onClick={() => setShowSaveQuote(false)}>Cancel</Button>
                  </div>
                )}
              </>
            ) : isGoogleBooks && googleBooksId ? (
              <div className="relative space-y-4">
                {/* Google Books Online Preview Banner */}
                <div className="bg-accent/40 border border-border/70 rounded-xl p-3 sm:p-4 text-center">
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-2">
                    <div className="text-left">
                      <p className="text-xs sm:text-sm font-medium text-foreground flex items-center gap-1.5">
                        <BookOpen className="w-4 h-4 text-primary shrink-0" />
                        Google Books Online Preview
                      </p>
                      <p className="text-[11px] sm:text-xs text-muted-foreground mt-0.5">
                        Publisher preview terms apply. If your browser blocks embedded frames, use the direct buttons below.
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setGbooksFallbackActive(!gbooksFallbackActive)}
                        className="text-xs h-7 gap-1"
                      >
                        {gbooksFallbackActive ? 'Show Preview Frame' : 'Preview Blocked?'}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setGbooksRetryCount((c) => c + 1)}
                        className="text-xs h-7 gap-1"
                        title="Retry loading preview"
                      >
                        <RefreshCw className="w-3 h-3" /> Retry
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Restricted View (e.g. publisher restricted or user/browser blocked) */}
                {gbooksStatus === 'restricted' || gbooksFallbackActive ? (
                  <div className={`w-full rounded-2xl border border-border p-8 sm:p-12 text-center flex flex-col items-center justify-center space-y-4 shadow-sm transition-colors ${
                    readerTheme === 'dark' ? 'bg-gray-900 text-gray-100' : readerTheme === 'sepia' ? 'bg-[#fbf0d9] text-[#4a3c28]' : 'bg-white text-gray-900'
                  } ${isFullscreen ? 'min-h-[70vh]' : 'min-h-[480px]'}`}>
                    <div className="w-14 h-14 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                      <ShieldAlert className="w-7 h-7" />
                    </div>
                    <div className="max-w-md space-y-1.5">
                      <h4 className="text-lg font-serif font-bold">
                        {gbooksStatus === 'restricted'
                          ? 'Publisher Preview Restricted'
                          : 'Embedded Preview Blocked by Browser'}
                      </h4>
                      <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                        {gbooksStatus === 'restricted'
                          ? 'The publisher or copyright holder has restricted direct in-browser iframe embedding for this volume on Google Books. You can read available preview pages directly on Google Books.'
                          : 'Your browser or publisher security headers prevented embedding this book inline. You can open and read the book directly on Google Books in a new window.'}
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-2.5 justify-center pt-2">
                      <Button
                        variant="default"
                        size="sm"
                        onClick={() => {
                          const target = gbooksDetails?.webReaderLink || gbooksDetails?.previewLink || `https://books.google.com/books?id=${googleBooksId}`;
                          window.open(target, '_blank', 'noopener,noreferrer');
                        }}
                        className="gap-2 text-xs font-semibold bg-primary text-primary-foreground hover:bg-primary/90"
                      >
                        <BookOpen className="w-4 h-4" />
                        Read on Google Books ↗
                      </Button>

                      {activeReadUrl && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => window.open(activeReadUrl, '_blank', 'noopener,noreferrer')}
                          className="gap-2 text-xs"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                          Open Original Link ↗
                        </Button>
                      )}

                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setGbooksFallbackActive(false);
                          setGbooksRetryCount((c) => c + 1);
                        }}
                        className="gap-1.5 text-xs text-muted-foreground hover:text-foreground"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                        Retry Preview
                      </Button>

                      {readUrls.length > 1 && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleReaderLoadError}
                          className="gap-1.5 text-xs text-amber-600 border-amber-300 dark:text-amber-400"
                        >
                          Try Alternate Source ({activeReadUrlIndex + 1}/{readUrls.length})
                        </Button>
                      )}
                    </div>
                  </div>
                ) : (
                  /* Available Preview Iframe */
                  <div className="relative rounded-2xl overflow-hidden border border-border shadow-sm">
                    {gbooksStatus === 'loading' && !gbooksIframeLoaded && (
                      <div className={`absolute inset-0 z-10 flex flex-col items-center justify-center p-8 transition-colors ${
                        readerTheme === 'dark' ? 'bg-gray-900' : readerTheme === 'sepia' ? 'bg-[#fbf0d9]' : 'bg-white'
                      }`}>
                        <BookOpen className="w-10 h-10 text-primary/40 animate-pulse mb-3" />
                        <p className="text-sm font-medium text-foreground">Loading Google Books preview...</p>
                        <p className="text-xs text-muted-foreground mt-1">Connecting to book volume...</p>
                      </div>
                    )}
                    <iframe
                      key={`${googleBooksId}-${gbooksRetryCount}`}
                      src={buildSafeGoogleBooksEmbedUrl(googleBooksId)}
                      className={`w-full border-0 bg-white ${isFullscreen ? 'h-screen' : 'h-[720px]'}`}
                      style={{ width: '100%' }}
                      title={bookTitle}
                      allowFullScreen
                      onLoad={() => {
                        setGbooksIframeLoaded(true);
                        setGbooksStatus('available');
                      }}
                      onError={() => {
                        setGbooksStatus('restricted');
                        setGbooksFallbackActive(true);
                      }}
                    />

                    <div className="p-3 bg-card border-t border-border flex flex-wrap items-center justify-between gap-2 text-xs">
                      <span className="text-muted-foreground text-[11px]">
                        Reading "{bookTitle}" via Google Books
                      </span>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => window.open(`https://books.google.com/books?id=${googleBooksId}`, '_blank', 'noopener,noreferrer')}
                          className="h-7 text-xs gap-1 text-primary"
                        >
                          <ExternalLink className="w-3 h-3" /> Open in new tab
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setGbooksFallbackActive(true)}
                          className="h-7 text-xs"
                        >
                          Having issues?
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : isPdf ? (
              <div className="relative space-y-4">
                {pdfStatus === 'blocked' || pdfManualFallback ? (
                  /* Fallback state when PDF cannot be embedded or user toggles */
                  <div className={`w-full rounded-2xl border border-border p-8 sm:p-12 text-center flex flex-col items-center justify-center space-y-4 shadow-sm transition-colors ${
                    readerTheme === 'dark' ? 'bg-gray-900 text-gray-100' : readerTheme === 'sepia' ? 'bg-[#fbf0d9] text-[#4a3c28]' : 'bg-white text-gray-900'
                  } ${isFullscreen ? 'min-h-[70vh]' : 'min-h-[480px]'}`}>
                    <div className="w-14 h-14 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                      <FileText className="w-7 h-7" />
                    </div>
                    <div className="max-w-md space-y-1.5">
                      <h4 className="text-lg font-serif font-bold">
                        Inline PDF Preview Restricted
                      </h4>
                      <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                        This document host server blocks in-browser iframe embedding (via security headers) or requires direct browser access. You can open or download the complete PDF directly.
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-2.5 justify-center pt-2">
                      {activeReadUrl && (
                        <Button
                          variant="default"
                          size="sm"
                          onClick={() => window.open(activeReadUrl, '_blank', 'noopener,noreferrer')}
                          className="gap-2 text-xs font-semibold bg-primary text-primary-foreground hover:bg-primary/90"
                        >
                          <ExternalLink className="w-4 h-4" />
                          Open PDF in New Window ↗
                        </Button>
                      )}

                      {activeReadUrl && (
                        <a
                          href={activeReadUrl}
                          download={`${bookTitle.replace(/[^a-zA-Z0-9_-]/g, '_')}.pdf`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex"
                        >
                          <Button variant="outline" size="sm" className="gap-2 text-xs">
                            <Download className="w-3.5 h-3.5" />
                            Download PDF
                          </Button>
                        </a>
                      )}

                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setPdfManualFallback(false);
                          setPdfStatus('loading');
                          setPdfRetryCount((c) => c + 1);
                        }}
                        className="gap-1.5 text-xs text-muted-foreground hover:text-foreground"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                        Retry Preview
                      </Button>

                      {readUrls.length > 1 && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleReaderLoadError}
                          className="gap-1.5 text-xs text-amber-600 border-amber-300 dark:text-amber-400"
                        >
                          Try Alternate Source ({activeReadUrlIndex + 1}/{readUrls.length})
                        </Button>
                      )}
                    </div>
                  </div>
                ) : (
                  /* PDF Iframe View with Skeleton */
                  <div className="relative rounded-2xl overflow-hidden border border-border shadow-sm">
                    {pdfStatus === 'loading' && !pdfIframeLoaded && (
                      <div className={`absolute inset-0 z-10 flex flex-col items-center justify-center p-8 transition-colors ${
                        readerTheme === 'dark' ? 'bg-gray-900' : readerTheme === 'sepia' ? 'bg-[#fbf0d9]' : 'bg-white'
                      }`}>
                        <FileText className="w-10 h-10 text-primary/40 animate-pulse mb-3" />
                        <p className="text-sm font-medium text-foreground">Loading PDF document...</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Page {currentPage}{totalPages ? ` of ${totalPages}` : ''}
                        </p>
                        <Button
                          variant="link"
                          size="sm"
                          onClick={() => setPdfManualFallback(true)}
                          className="text-xs text-muted-foreground mt-4"
                        >
                          Taking too long? Open externally ↗
                        </Button>
                      </div>
                    )}

                    <iframe
                      key={`${activeReadUrl}-${currentPage}-${pdfRetryCount}`}
                      src={buildSafePdfEmbedUrl(activeReadUrl, currentPage)}
                      className={`w-full border-0 ${isFullscreen ? 'h-screen' : 'h-[650px]'}`}
                      style={{ width: '100%', height: isFullscreen ? '100vh' : '650px' }}
                      title={bookTitle}
                      onLoad={() => {
                        setPdfIframeLoaded(true);
                        setPdfStatus('loaded');
                      }}
                      onError={() => {
                        setPdfStatus('blocked');
                      }}
                    />

                    {/* PDF Navigation & Helper overlay bar */}
                    <div className="p-3 bg-card border-t border-border flex flex-wrap items-center justify-between gap-2 text-xs">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-foreground">
                          Page {currentPage}{totalPages ? ` of ${totalPages}` : ''}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => activeReadUrl && window.open(activeReadUrl, '_blank', 'noopener,noreferrer')}
                          className="h-7 text-xs gap-1 text-primary"
                        >
                          <ExternalLink className="w-3 h-3" /> Open in new window
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setPdfManualFallback(true)}
                          className="h-7 text-xs"
                        >
                          Preview blocked?
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-12 border border-gray-300 rounded-lg space-y-3">
                <p className="text-gray-500">This book's format can't be previewed inline.</p>
                {activeReadUrl && (
                  <Button onClick={() => window.open(activeReadUrl, '_blank', 'noopener,noreferrer')}>
                    Open in new tab
                  </Button>
                )}
              </div>
            )}

            {/* Enhanced Navigation Controls for EPUB */}
            {isEpub && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-white/90 backdrop-blur-sm shadow-lg hover:bg-white"
                  onClick={navigatePrevious}
                  aria-label="Previous page"
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-white/90 backdrop-blur-sm shadow-lg hover:bg-white"
                  onClick={navigateNext}
                  aria-label="Next page"
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>

                {/* Progress indicator */}
                {totalPages > 0 && (
                  <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black/70 text-white px-4 py-2 rounded-lg text-sm">
                    Page {currentPage} of {totalPages} • {Math.round(progressPercentage)}%
                  </div>
                )}
              </>
            )}

            {/* Navigation controls for PDF */}
            {isPdf && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-white/90 backdrop-blur-sm shadow-lg hover:bg-white"
                  onClick={navigatePdfPrevious}
                  aria-label="Previous page"
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-white/90 backdrop-blur-sm shadow-lg hover:bg-white"
                  onClick={navigatePdfNext}
                  aria-label="Next page"
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>

                {totalPages > 0 && (
                  <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black/70 text-white px-4 py-2 rounded-lg text-sm">
                    Page {currentPage} of {totalPages} • {Math.round(progressPercentage)}%
                  </div>
                )}
              </>
            )}
          </div>

          {/* Enhanced Reader Instructions */}
          <div className="text-center text-sm text-gray-600 space-y-2">
            {isEpub ? (
              <div>
                <p>Use the navigation buttons or arrow keys to turn pages.</p>
                <p className="text-xs">Your reading position and progress are automatically saved.</p>
              </div>
            ) : isGoogleBooks ? (
              <div>
                <p>Use the Google Books reader controls to navigate through the book.</p>
                <p className="text-xs">Limited preview may be available based on publisher settings.</p>
              </div>
            ) : isPdf ? (
              <div>
                <p>Use the navigation buttons or built-in PDF controls to move through the book.</p>
                 <p className="text-xs">Your page is saved automatically. Zoom, search, and download are available in the PDF toolbar.</p>
              </div>
            ) : null}
            {user && !isGoogleBooks && (
              <Badge variant="secondary" className="mt-2">
                <Clock className="w-3 h-3 mr-1" />
                Reading session: {formatReadingTime(readingTime)}
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default BookReader;
