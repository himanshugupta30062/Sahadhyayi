
import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
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
  Menu
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

interface BookReaderProps {
  bookId: string;
  bookTitle: string;
  pdfUrl?: string;
  epubUrl?: string;
}

const BookReader = ({ bookId, bookTitle, pdfUrl, epubUrl }: BookReaderProps) => {
  const { user } = useAuth();
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [fontSize, setFontSize] = useState(16);
  const [showToc, setShowToc] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [tocItems, setTocItems] = useState<any[]>([]);
  const [currentLocation, setCurrentLocation] = useState('');
  const viewerRef = useRef<HTMLDivElement>(null);
  const renditionRef = useRef<any>(null);
  const bookRef = useRef<any>(null);

  // Determine if we have an EPUB or PDF
  const isEpub = epubUrl && epubUrl.length > 0;
  const isPdf = pdfUrl && pdfUrl.length > 0;
  const bookUrl = isEpub ? epubUrl : pdfUrl;

  useEffect(() => {
    if (isEpub && bookUrl && viewerRef.current) {
      loadEpubBook();
    }
  }, [isEpub, bookUrl]);

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

      // Handle location changes
      renditionRef.current.on("relocated", (location: any) => {
        setCurrentLocation(location.start.cfi);
        // Save reading position
        if (user) {
          localStorage.setItem(`book-${bookId}-position`, location.start.cfi);
        }
      });

      // Load previous reading position
      if (user) {
        const savedPosition = localStorage.getItem(`book-${bookId}-position`);
        if (savedPosition) {
          renditionRef.current.display(savedPosition);
        }
      }

      // Apply initial theme
      applyTheme();
      applyFontSize();

    } catch (error) {
      console.error('Error loading EPUB:', error);
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

  if (!bookUrl) {
    return (
      <div className="text-center py-12">
        <BookOpen className="w-16 h-16 mx-auto mb-4 text-gray-400" />
        <h3 className="text-xl font-semibold text-gray-700 mb-2">Book Not Available</h3>
        <p className="text-gray-500">This book is not available for online reading yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="text-center mb-6">
        <div className="flex items-center justify-center gap-2 mb-2">
          <BookOpen className="w-6 h-6 text-orange-600" />
          <h3 className="text-2xl font-bold text-orange-900">Read Book</h3>
        </div>
        <p className="text-orange-700">Enjoy reading "{bookTitle}" online</p>
      </div>

      {/* Reader Controls */}
      <Card className="bg-white/80 backdrop-blur-sm border-orange-200 shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg text-orange-900 flex items-center gap-2">
              <BookOpen className="w-5 h-5" />
              {bookTitle}
            </CardTitle>
            <div className="flex items-center gap-2">
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
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowSettings(!showSettings)}
                className="flex items-center gap-1"
              >
                <Settings className="w-4 h-4" />
                Settings
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

                  {/* Reading Progress */}
                  <div className="flex items-center justify-between">
                    <Label>Progress</Label>
                    <span className="text-sm text-gray-600">
                      {user ? 'Position saved' : 'Sign in to save progress'}
                    </span>
                  </div>
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

          {/* Reader Area */}
          <div className="relative">
            {isEpub ? (
              <div
                ref={viewerRef}
                className={`w-full h-[600px] border rounded-lg overflow-hidden ${
                  isDarkMode ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-300'
                }`}
                style={{ fontSize: `${fontSize}px` }}
              />
            ) : isPdf ? (
              <iframe
                src={pdfUrl}
                className="w-full h-[600px] border rounded-lg"
                style={{ border: 'none' }}
                title={`${bookTitle} - PDF Reader`}
              />
            ) : (
              <div className="text-center py-12 border border-gray-300 rounded-lg">
                <p className="text-gray-500">Unsupported book format</p>
              </div>
            )}

            {/* Navigation Controls for EPUB */}
            {isEpub && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-white/80 backdrop-blur-sm"
                  onClick={navigatePrevious}
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-white/80 backdrop-blur-sm"
                  onClick={navigateNext}
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </>
            )}
          </div>

          {/* Reader Instructions */}
          <div className="text-center text-sm text-gray-600">
            {isEpub ? (
              <p>Use the navigation buttons or arrow keys to turn pages. Your reading position is automatically saved.</p>
            ) : (
              <p>Use the built-in PDF controls to navigate through the book.</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default BookReader;
