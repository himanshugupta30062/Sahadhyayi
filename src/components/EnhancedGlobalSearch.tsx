import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Search, BookOpen, Users, Clock, TrendingUp, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLibraryBooks } from '@/hooks/useLibraryBooks';
import useDebouncedValue from '@/lib/useDebouncedValue';

interface EnhancedGlobalSearchProps {
  isOpen: boolean;
  onClose: () => void;
}

const RECENT_SEARCHES_KEY = 'global_recent_searches';
const MAX_RECENT_SEARCHES = 5;

export function EnhancedGlobalSearch({ isOpen, onClose }: EnhancedGlobalSearchProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [activeIndex, setActiveIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  
  const debouncedQuery = useDebouncedValue(searchQuery, 300);
  
  // Fetch books with search query (only search if query has at least 2 characters)
  const shouldSearch = debouncedQuery.trim().length >= 2;
  const { data: books, isLoading } = useLibraryBooks(shouldSearch ? debouncedQuery : undefined);

  // Load recent searches from localStorage
  useEffect(() => {
    const stored = localStorage.getItem(RECENT_SEARCHES_KEY);
    if (stored) {
      try {
        setRecentSearches(JSON.parse(stored));
      } catch (e) {
        console.error('Failed to parse recent searches:', e);
      }
    }
  }, []);

  // Focus input when dialog opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
      setSearchQuery('');
      setActiveIndex(-1);
    }
  }, [isOpen]);

  const saveRecentSearch = useCallback((query: string) => {
    if (!query.trim()) return;
    
    const newRecent = [
      query,
      ...recentSearches.filter(s => s !== query)
    ].slice(0, MAX_RECENT_SEARCHES);
    
    setRecentSearches(newRecent);
    localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(newRecent));
  }, [recentSearches]);

  const clearRecentSearches = () => {
    setRecentSearches([]);
    localStorage.removeItem(RECENT_SEARCHES_KEY);
  };

  const handleSearch = (query: string) => {
    if (!query.trim()) return;
    
    saveRecentSearch(query);
    navigate(`/library?search=${encodeURIComponent(query)}`);
    onClose();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    const results = books || [];
    const suggestions = searchQuery ? results : recentSearches;
    
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex(prev => Math.min(prev + 1, suggestions.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex(prev => Math.max(prev - 1, -1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (activeIndex >= 0 && activeIndex < suggestions.length) {
        if (searchQuery) {
          const book = results[activeIndex];
          if (book) {
            saveRecentSearch(book.title);
            navigate(`/book/${book.id}`);
            onClose();
          }
        } else {
          const recent = suggestions[activeIndex] as string;
          setSearchQuery(recent);
          handleSearch(recent);
        }
      } else if (searchQuery) {
        handleSearch(searchQuery);
      }
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  const results = (books || []).slice(0, 10); // Limit to 10 results
  const showRecent = !searchQuery && recentSearches.length > 0;
  const showResults = searchQuery.trim().length >= 2 && results.length > 0;
  const showNoResults = searchQuery.trim().length >= 2 && !isLoading && results.length === 0;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        className="sm:max-w-2xl p-0 gap-0 max-h-[80vh] bg-amber-50 border border-amber-200/60 rounded-2xl shadow-2xl overflow-hidden"
      >
        {/* Search Input Header */}
        <div className="relative flex items-center border-b border-amber-100 px-6 py-4">
          <Search className="w-5 h-5 text-amber-500 flex-shrink-0" />
          <Input
            ref={inputRef}
            placeholder="Search books, authors, or articles..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setActiveIndex(-1);
            }}
            onKeyDown={handleKeyDown}
            className="flex-1 ml-4 bg-transparent border-0 outline-none shadow-none focus-visible:ring-0 focus-visible:ring-offset-0 text-lg text-amber-900 placeholder:text-amber-400 font-medium h-auto p-0"
          />
          {searchQuery ? (
            <button
              onClick={() => setSearchQuery('')}
              className="ml-3 text-amber-500 hover:text-amber-700 transition-colors"
              aria-label="Clear search"
            >
              <X className="w-4 h-4" />
            </button>
          ) : (
            <span className="hidden sm:inline-block ml-3 px-2 py-1 text-[10px] font-bold text-amber-600 bg-amber-100 border border-amber-200 rounded uppercase tracking-wider">
              Esc
            </span>
          )}
        </div>

        {/* Scrollable Results Area */}
        <ScrollArea className="max-h-[60vh]">
          <div className="p-2 space-y-4">
            {showRecent && (
              <div>
                <div className="flex items-center justify-between px-4 py-2">
                  <h3 className="text-xs font-bold text-amber-500 uppercase tracking-widest flex items-center gap-2">
                    <Clock className="w-3.5 h-3.5" />
                    Recent Searches
                  </h3>
                  <button
                    onClick={clearRecentSearches}
                    className="text-[11px] font-medium text-amber-600 hover:text-amber-800 transition-colors"
                  >
                    Clear
                  </button>
                </div>
                <div className="space-y-1">
                  {recentSearches.map((search, index) => (
                    <button
                      key={search}
                      onClick={() => {
                        setSearchQuery(search);
                        handleSearch(search);
                      }}
                      className={cn(
                        'w-full flex items-center gap-4 px-4 py-3 rounded-xl transition-colors text-left',
                        activeIndex === index
                          ? 'bg-amber-100/80 border border-amber-200/50 shadow-sm'
                          : 'hover:bg-amber-100/40 border border-transparent'
                      )}
                    >
                      <div className="w-10 h-10 bg-amber-100 rounded-full flex-shrink-0 flex items-center justify-center text-amber-500">
                        <Search className="w-4 h-4" />
                      </div>
                      <span className="text-sm font-medium text-amber-900 truncate">
                        {search}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {isLoading && searchQuery.trim().length >= 2 && (
              <div className="text-center py-10 text-amber-600">
                <div className="animate-pulse text-sm font-medium">Searching the library…</div>
              </div>
            )}

            {searchQuery.trim().length > 0 && searchQuery.trim().length < 2 && (
              <div className="text-center py-10 text-amber-500">
                <p className="text-sm">Type at least 2 characters to search</p>
              </div>
            )}

            {showResults && (
              <div>
                <h3 className="px-4 py-2 text-xs font-bold text-amber-500 uppercase tracking-widest flex items-center gap-2">
                  <TrendingUp className="w-3.5 h-3.5" />
                  Books
                </h3>
                <div className="space-y-1">
                  {results.map((book, index) => (
                    <button
                      key={book.id}
                      onClick={() => {
                        saveRecentSearch(book.title);
                        navigate(`/book/${book.id}`);
                        onClose();
                      }}
                      className={cn(
                        'group w-full flex items-center gap-4 px-4 py-3 rounded-xl transition-colors text-left',
                        activeIndex === index
                          ? 'bg-amber-100/80 border border-amber-200/50 shadow-sm'
                          : 'hover:bg-amber-100/40 border border-transparent'
                      )}
                    >
                      <div
                        className={cn(
                          'w-10 h-14 rounded shadow-sm flex-shrink-0 flex items-center justify-center transition-colors',
                          activeIndex === index
                            ? 'bg-amber-200 text-amber-600'
                            : 'bg-amber-100 text-amber-400 group-hover:bg-amber-200'
                        )}
                      >
                        <BookOpen className="w-5 h-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-sm text-amber-950 truncate">
                          {book.title}
                        </div>
                        {book.author && (
                          <div className="text-sm text-amber-700 truncate">
                            by {book.author}
                          </div>
                        )}
                        <div className="flex items-center gap-2 mt-1">
                          {book.genre && (
                            <Badge
                              variant="secondary"
                              className="text-[10px] bg-amber-100 text-amber-700 border-amber-200 hover:bg-amber-100"
                            >
                              {book.genre}
                            </Badge>
                          )}
                          {book.language && (
                            <span className="text-[11px] text-amber-600">
                              {book.language}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="hidden sm:block text-xs font-medium text-amber-500 opacity-0 group-hover:opacity-100 transition-opacity">
                        Open →
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {showNoResults && (
              <div className="text-center py-12 px-6">
                <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-amber-100 flex items-center justify-center text-amber-500">
                  <Search className="w-7 h-7" />
                </div>
                <p className="text-sm font-semibold text-amber-900">
                  No books found for "{searchQuery}"
                </p>
                <p className="text-xs mt-2 text-amber-600">
                  Try different keywords or browse the full library
                </p>
              </div>
            )}

            {!searchQuery && !showRecent && (
              <div className="text-center py-12 px-6">
                <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-amber-100 flex items-center justify-center text-amber-500">
                  <BookOpen className="w-7 h-7" />
                </div>
                <p className="text-sm font-semibold text-amber-900">
                  Start typing to search Sahadhyayi
                </p>
                <p className="text-xs mt-2 text-amber-600">
                  Books, authors, articles and more
                </p>
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Command Footer */}
        <div className="flex items-center gap-6 px-6 py-3 bg-amber-100/30 border-t border-amber-100 text-[11px] font-medium text-amber-700">
          <div className="flex items-center gap-1.5">
            <kbd className="min-w-[18px] h-[18px] flex items-center justify-center bg-white border border-amber-200 rounded text-amber-900">↑</kbd>
            <kbd className="min-w-[18px] h-[18px] flex items-center justify-center bg-white border border-amber-200 rounded text-amber-900">↓</kbd>
            <span>Navigate</span>
          </div>
          <div className="flex items-center gap-1.5">
            <kbd className="px-1.5 h-[18px] flex items-center justify-center bg-white border border-amber-200 rounded text-amber-900">Enter</kbd>
            <span>Select</span>
          </div>
          <div className="flex items-center gap-1.5">
            <kbd className="px-1.5 h-[18px] flex items-center justify-center bg-white border border-amber-200 rounded text-amber-900">Esc</kbd>
            <span>Close</span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

