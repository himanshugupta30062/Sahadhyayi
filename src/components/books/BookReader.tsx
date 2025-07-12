
import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
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
  Share2
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useReadingProgress, useUpdateReadingProgress } from '@/hooks/useReadingProgress';
import { useAudioSummary } from '@/hooks/useAudioSummaries';

interface BookReaderProps {
  bookId: string;
  bookTitle: string;
  pdfUrl?: string;
  epubUrl?: string;
}

const BookReader = ({ bookId, bookTitle, pdfUrl, epubUrl }: BookReaderProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [fontSize, setFontSize] = useState(16);
  const [showToc, setShowToc] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [readingTime, setReadingTime] = useState(0);
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [tocItems, setTocItems] = useState<any[]>([]);
  const [currentLocation, setCurrentLocation] = useState('');
  const [bookmarks, setBookmarks] = useState<string[]>([]);
  const viewerRef = useRef<HTMLDivElement>(null);
  const renditionRef = useRef<any>(null);
  const bookRef = useRef<any>(null);
  const readingTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Hooks for data management
  const { data: readingProgress } = useReadingProgress();
  const updateProgress = useUpdateReadingProgress();
  const { data: audioSummary } = useAudioSummary(bookId);

  // Determine if we have an EPUB or PDF
  const isEpub = epubUrl && epubUrl.length > 0;
  const isPdf = pdfUrl && pdfUrl.length > 0;
  const bookUrl = isEpub ? epubUrl : pdfUrl;

  // Calculate reading progress percentage
  const progressPercentage = totalPages > 0 ? (currentPage / totalPages) * 100 : 0;

  // Initialize reading session
  useEffect(() => {
    if (bookUrl && user) {
      setStartTime(new Date());
      startReadingTimer();
      
      // Load saved bookmarks
      const savedBookmarks = localStorage.getItem(`book-${bookId}-bookmarks`);
      if (savedBookmarks) {
        setBookmarks(JSON.parse(savedBookmarks));
      }
    }

    return () => {
      if (readingTimerRef.current) {
        clearInterval(readingTimerRef.current);
      }
    };
  }, [bookUrl, user, bookId]);

  useEffect(() => {
    if (isEpub && bookUrl && viewerRef.current) {
      loadEpubBook();
    }
  }, [isEpub, bookUrl]);

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
      script.src = 'https://cdn.jsdelivr.net/npm/epubjs/dist/epub.min.js';
      script.onload = () => initializeEpub();
      document.head.appendChild(script);
    } else {
      initializeEpub();
    }
  };

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

      // Get book metadata for total pages estimation
      bookRef.current.ready.then(() => {
        bookRef.current.locations.generate(1024).then(() => {
          setTotalPages(bookRef.current.locations.total);
        });
      });

      // Handle location changes
      renditionRef.current.on("relocated", (location: any) => {
        setCurrentLocation(location.start.cfi);
        
        // Update current page
        const currentPageNum = bookRef.current.locations.locationFromCfi(location.start.cfi);
        setCurrentPage(currentPageNum);
        
        // Save reading position and progress
        if (user) {
          localStorage.setItem(`book-${bookId}-position`, location.start.cfi);
          
          // Save to database every 5 pages or 5 minutes
          const savedTime = localStorage.getItem(`book-${bookId}-last-save`);
          const now = Date.now();
          if (!savedTime || now - parseInt(savedTime) > 300000) { // 5 minutes
            saveReadingProgress(currentPageNum);
            localStorage.setItem(`book-${bookId}-last-save`, now.toString());
          }
        }
      });

      // Load previous reading position
      if (user) {
        const savedPosition = localStorage.getItem(`book-${bookId}-position`);
        if (savedPosition) {
          renditionRef.current.display(savedPosition);
        }
      }

      // Apply initial theme and font
      applyTheme();
      applyFontSize();

    } catch (error) {
      console.error('Error loading EPUB:', error);
      toast({
        title: "Error",
        description: "Failed to load the book. Please try again.",
        variant: "destructive"
      });
    }
  };

  const applyTheme = () => {
    if (!renditionRef.current) return;

    if (isDarkMode) {
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
    } else {
      renditionRef.current.themes.default({
        "body": {
          "background": "#ffffff !important",
          "color": "#1a1a1a !important"
        }
      });
    }
  };

  const applyFontSize = () => {
    if (!renditionRef.current) return;

    renditionRef.current.themes.fontSize(`${fontSize}px`);
  };

  const saveReadingProgress = async (page: number) => {
    if (!user) return;

    try {
      // Find existing progress entry for this book
      const existingProgress = readingProgress?.find(p => 
        p.book_title.toLowerCase() === bookTitle.toLowerCase()
      );

      if (existingProgress) {
        await updateProgress.mutateAsync({
          id: existingProgress.id,
          current_page: page
        });
      } else {
        // Create new progress entry - this would need a separate mutation
        console.log('Creating new progress entry for book:', bookTitle);
      }
    } catch (error) {
      console.error('Error saving reading progress:', error);
    }
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      viewerRef.current?.requestFullscreen?.();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen?.();
      setIsFullscreen(false);
    }
  };

  const addBookmark = () => {
    if (!currentLocation) return;
    
    const newBookmarks = [...bookmarks, currentLocation];
    setBookmarks(newBookmarks);
    localStorage.setItem(`book-${bookId}-bookmarks`, JSON.stringify(newBookmarks));
    
    toast({
      title: "Bookmark Added",
      description: "Page bookmarked successfully!",
    });
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
        console.log('Error sharing:', error);
      }
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(window.location.href);
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

  const goToChapter = (href: string) => {
    if (renditionRef.current) {
      renditionRef.current.display(href);
      setShowToc(false);
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

  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
    if (isEpub) {
      setTimeout(applyTheme, 100);
    }
  };

  useEffect(() => {
    if (isEpub) {
      applyTheme();
    }
  }, [isDarkMode]);

  const formatReadingTime = (minutes: number) => {
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  if (!bookUrl) {
    return (
      <div className="text-center py-12">
        <BookOpen className="w-16 h-16 mx-auto mb-4 text-gray-400" />
        <h3 className="text-xl font-semibold text-gray-700 mb-2">Book Not Available</h3>
        <p className="text-gray-500 mb-4">This book is not available for online reading yet.</p>
        {audioSummary && (
          <div className="mt-4">
            <Button variant="outline" className="flex items-center gap-2">
              <Volume2 className="w-4 h-4" />
              Listen to Audio Summary
            </Button>
          </div>
        )}
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
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg text-orange-900 flex items-center gap-2">
              <BookOpen className="w-5 h-5" />
              {bookTitle}
            </CardTitle>
            <div className="flex items-center gap-2">
              {/* Audio Summary Button */}
              {audioSummary && (
                <Button
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-1"
                >
                  <Volume2 className="w-4 h-4" />
                  Audio
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
                  Save
                </Button>
              )}
              
              {/* Table of Contents */}
              {isEpub && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowToc(!showToc)}
                  className="flex items-center gap-1"
                >
                  <List className="w-4 h-4" />
                  TOC
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
                Settings
              </Button>

              {/* Share Button */}
              <Button
                variant="outline"
                size="sm"
                onClick={shareBook}
                className="flex items-center gap-1"
              >
                <Share2 className="w-4 h-4" />
                Share
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

        <CardContent className="space-y-4">
          {/* Settings Panel */}
          {showSettings && (
            <Card className="bg-gray-50 border-gray-200">
              <CardContent className="p-4 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Dark Mode Toggle */}
                  <div className="flex items-center justify-between">
                    <Label htmlFor="dark-mode" className="flex items-center gap-2">
                      {isDarkMode ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
                      Dark Mode
                    </Label>
                    <Switch
                      id="dark-mode"
                      checked={isDarkMode}
                      onCheckedChange={toggleDarkMode}
                    />
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
                <div className="space-y-1">
                  {tocItems.map((item, index) => (
                    <button
                      key={index}
                      className="w-full text-left p-2 text-sm hover:bg-white rounded transition-colors"
                      onClick={() => goToChapter(item.href)}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Enhanced Reader Area */}
          <div className="relative">
            {isEpub ? (
              <div
                ref={viewerRef}
                className={`w-full border rounded-lg overflow-hidden ${
                  isDarkMode ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-300'
                } ${isFullscreen ? 'h-screen' : 'h-[600px]'}`}
                style={{ fontSize: `${fontSize}px` }}
              />
            ) : isPdf ? (
              <div className="relative">
                <iframe
                  src={`${pdfUrl}#toolbar=1&navpanes=1&scrollbar=1&page=${currentPage}`}
                  className={`w-full border rounded-lg ${isFullscreen ? 'h-screen' : 'h-[600px]'}`}
                  style={{ border: 'none' }}
                  title={`${bookTitle} - PDF Reader`}
                />
                {/* PDF Navigation Helper */}
                <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black/70 text-white px-4 py-2 rounded-lg text-sm">
                  Use PDF controls to navigate • Page {currentPage}
                </div>
              </div>
            ) : (
              <div className="text-center py-12 border border-gray-300 rounded-lg">
                <p className="text-gray-500">Unsupported book format</p>
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
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-white/90 backdrop-blur-sm shadow-lg hover:bg-white"
                  onClick={navigateNext}
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
          </div>

          {/* Enhanced Reader Instructions */}
          <div className="text-center text-sm text-gray-600 space-y-2">
            {isEpub ? (
              <div>
                <p>Use the navigation buttons or arrow keys to turn pages.</p>
                <p className="text-xs">Your reading position and progress are automatically saved.</p>
              </div>
            ) : (
              <div>
                <p>Use the built-in PDF controls to navigate through the book.</p>
                <p className="text-xs">Zoom, search, and download features are available in the PDF toolbar.</p>
              </div>
            )}
            {user && (
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
