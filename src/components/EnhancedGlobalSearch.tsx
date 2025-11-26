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
      <DialogContent className="sm:max-w-2xl p-0 gap-0 max-h-[80vh]">
        <div className="flex items-center gap-3 px-4 py-3 border-b">
          <Search className="w-5 h-5 text-muted-foreground" />
          <Input
            ref={inputRef}
            placeholder="Search books, authors, or keywords... (Cmd+K)"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setActiveIndex(-1);
            }}
            onKeyDown={handleKeyDown}
            className="border-0 focus-visible:ring-0 focus-visible:ring-offset-0 text-base"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="text-muted-foreground hover:text-foreground"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        <ScrollArea className="max-h-[60vh]">
          <div className="p-4">
            {showRecent && (
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                    <Clock className="w-4 h-4" />
                    Recent Searches
                  </div>
                  <button
                    onClick={clearRecentSearches}
                    className="text-xs text-muted-foreground hover:text-foreground"
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
                        'w-full text-left px-3 py-2 rounded-lg hover:bg-accent transition-colors',
                        activeIndex === index && 'bg-accent'
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <Search className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm">{search}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {isLoading && searchQuery.trim().length >= 2 && (
              <div className="text-center py-8 text-muted-foreground">
                <div className="animate-pulse">Searching...</div>
              </div>
            )}

            {searchQuery.trim().length > 0 && searchQuery.trim().length < 2 && (
              <div className="text-center py-8 text-muted-foreground">
                <p className="text-sm">Type at least 2 characters to search</p>
              </div>
            )}

            {showResults && (
              <div>
                <div className="flex items-center gap-2 mb-3 text-sm font-medium text-muted-foreground">
                  <TrendingUp className="w-4 h-4" />
                  Books
                </div>
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
                        'w-full text-left px-3 py-3 rounded-lg hover:bg-accent transition-colors',
                        activeIndex === index && 'bg-accent'
                      )}
                    >
                      <div className="flex items-start gap-3">
                        <BookOpen className="w-5 h-5 text-primary mt-0.5" />
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-sm truncate">
                            {book.title}
                          </h4>
                          {book.author && (
                            <p className="text-xs text-muted-foreground mt-0.5">
                              by {book.author}
                            </p>
                          )}
                          <div className="flex items-center gap-2 mt-1">
                            {book.genre && (
                              <Badge variant="secondary" className="text-xs">
                                {book.genre}
                              </Badge>
                            )}
                            {book.language && (
                              <span className="text-xs text-muted-foreground">
                                {book.language}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {showNoResults && (
              <div className="text-center py-8 text-muted-foreground">
                <Search className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p className="text-sm">No books found for "{searchQuery}"</p>
                <p className="text-xs mt-2">Try different keywords or browse our library</p>
              </div>
            )}
          </div>
        </ScrollArea>

        <div className="px-4 py-3 border-t bg-muted/50">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 bg-background border rounded">↑</kbd>
                <kbd className="px-1.5 py-0.5 bg-background border rounded">↓</kbd>
                Navigate
              </span>
              <span className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 bg-background border rounded">Enter</kbd>
                Select
              </span>
              <span className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 bg-background border rounded">Esc</kbd>
                Close
              </span>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
