import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Search,
  BookOpen,
  User,
  FileText,
  Clock,
  TrendingUp,
  X,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client-universal';
import useDebouncedValue from '@/lib/useDebouncedValue';
import { slugify } from '@/utils/slugify';

interface EnhancedGlobalSearchProps {
  isOpen: boolean;
  onClose: () => void;
}

export type SearchCategory = 'all' | 'books' | 'authors' | 'articles';

export interface GlobalSearchResult {
  id: string;
  category: 'book' | 'author' | 'article';
  title: string;
  subtitle?: string;
  meta?: string;
  url: string;
  imageUrl?: string | null;
  score: number;
}

const RECENT_SEARCHES_KEY = 'global_recent_searches';
const MAX_RECENT_SEARCHES = 5;

function computeRelevance(query: string, primary: string, secondary?: string | null, tertiary?: string | null): number {
  const q = query.toLowerCase().trim();
  const p = (primary || '').toLowerCase().trim();
  const s = (secondary || '').toLowerCase().trim();
  const t = (tertiary || '').toLowerCase().trim();

  if (p === q) return 100;
  if (p.startsWith(q)) return 70;
  if (p.includes(q)) return 50;
  if (s === q) return 40;
  if (s.startsWith(q)) return 30;
  if (s.includes(q)) return 25;
  if (t.includes(q)) return 15;
  return 10;
}

export function EnhancedGlobalSearch({ isOpen, onClose }: EnhancedGlobalSearchProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<SearchCategory>('all');
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [results, setResults] = useState<GlobalSearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  const debouncedQuery = useDebouncedValue(searchQuery, 300);

  // Load recent searches from localStorage safely
  useEffect(() => {
    try {
      const stored = typeof window !== 'undefined' ? localStorage.getItem(RECENT_SEARCHES_KEY) : null;
      if (stored) {
        setRecentSearches(JSON.parse(stored));
      }
    } catch {
      // Storage unavailable or disabled
    }
  }, []);

  // Focus input and reset state when dialog opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 80);
      setSearchQuery('');
      setSelectedCategory('all');
      setActiveIndex(-1);
      setResults([]);
      setHasSearched(false);
    }
  }, [isOpen]);

  const saveRecentSearch = useCallback((query: string) => {
    const trimmed = query.trim();
    if (!trimmed) return;

    try {
      setRecentSearches((prev) => {
        const next = [trimmed, ...prev.filter((s) => s.toLowerCase() !== trimmed.toLowerCase())].slice(0, MAX_RECENT_SEARCHES);
        if (typeof window !== 'undefined') {
          localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(next));
        }
        return next;
      });
    } catch {
      // Ignore write errors
    }
  }, []);

  const clearRecentSearches = () => {
    setRecentSearches([]);
    try {
      if (typeof window !== 'undefined') {
        localStorage.removeItem(RECENT_SEARCHES_KEY);
      }
    } catch {
      // Ignore write errors
    }
  };

  // Perform multi-category search with Promise.allSettled for fault tolerance
  useEffect(() => {
    const trimmed = debouncedQuery.trim();
    if (trimmed.length < 2) {
      setResults([]);
      setIsLoading(false);
      setHasSearched(false);
      return;
    }

    let isMounted = true;
    setIsLoading(true);
    setHasSearched(true);

    const runSearch = async () => {
      const cleanTerm = trimmed.replace(/[,()]/g, ' ').replace(/\s+/g, ' ').trim();

      const [booksResult, authorsResult, articlesResult] = await Promise.allSettled([
        // 1. Books query
        supabase
          .from('books_library')
          .select('id, title, author, genre, cover_image_url, language')
          .or(`title.ilike.%${cleanTerm}%,author.ilike.%${cleanTerm}%,genre.ilike.%${cleanTerm}%`)
          .limit(10),

        // 2. Authors query
        supabase
          .from('authors')
          .select('id, name, bio, profile_image_url, genres, books_count')
          .or(`name.ilike.%${cleanTerm}%,bio.ilike.%${cleanTerm}%`)
          .limit(8),

        // 3. Articles query
        (supabase as any)
          .from('articles')
          .select('id, title, subtitle, slug, cover_image_url, reading_time_minutes')
          .eq('is_published', true)
          .or(`title.ilike.%${cleanTerm}%,subtitle.ilike.%${cleanTerm}%`)
          .limit(8),
      ]);

      if (!isMounted) return;

      const combined: GlobalSearchResult[] = [];

      // Process books
      if (booksResult.status === 'fulfilled' && booksResult.value.data) {
        for (const b of booksResult.value.data) {
          combined.push({
            id: `book-${b.id}`,
            category: 'book',
            title: b.title,
            subtitle: b.author ? `by ${b.author}` : undefined,
            meta: b.genre || b.language || undefined,
            url: `/book/${b.id}`,
            imageUrl: b.cover_image_url,
            score: computeRelevance(cleanTerm, b.title, b.author, b.genre),
          });
        }
      }

      // Process authors
      if (authorsResult.status === 'fulfilled' && authorsResult.value.data) {
        for (const a of authorsResult.value.data) {
          const authorSlug = slugify(a.name);
          combined.push({
            id: `author-${a.id}`,
            category: 'author',
            title: a.name,
            subtitle: a.bio ? (a.bio.length > 70 ? `${a.bio.slice(0, 70)}…` : a.bio) : (a.books_count ? `${a.books_count} books published` : 'Author'),
            meta: Array.isArray(a.genres) && a.genres.length > 0 ? a.genres.slice(0, 2).join(', ') : 'Author',
            url: authorSlug ? `/authors/${authorSlug}` : `/authors`,
            imageUrl: a.profile_image_url,
            score: computeRelevance(cleanTerm, a.name, a.bio),
          });
        }
      }

      // Process articles
      if (articlesResult.status === 'fulfilled' && articlesResult.value.data) {
        for (const art of articlesResult.value.data) {
          const articleUrl = art.slug ? `/articles/${art.slug}` : `/articles/${art.id}`;
          combined.push({
            id: `article-${art.id}`,
            category: 'article',
            title: art.title,
            subtitle: art.subtitle || undefined,
            meta: art.reading_time_minutes ? `${art.reading_time_minutes} min read` : 'Article',
            url: articleUrl,
            imageUrl: art.cover_image_url,
            score: computeRelevance(cleanTerm, art.title, art.subtitle),
          });
        }
      }

      // Sort by relevance score descending
      combined.sort((a, b) => b.score - a.score);

      setResults(combined);
      setIsLoading(false);
      setActiveIndex(-1);
    };

    runSearch();

    return () => {
      isMounted = false;
    };
  }, [debouncedQuery]);

  // Filter results by selected category tab
  const filteredResults = useMemo(() => {
    if (selectedCategory === 'all') return results;
    if (selectedCategory === 'books') return results.filter((r) => r.category === 'book');
    if (selectedCategory === 'authors') return results.filter((r) => r.category === 'author');
    if (selectedCategory === 'articles') return results.filter((r) => r.category === 'article');
    return results;
  }, [results, selectedCategory]);

  const counts = useMemo(() => {
    return {
      all: results.length,
      books: results.filter((r) => r.category === 'book').length,
      authors: results.filter((r) => r.category === 'author').length,
      articles: results.filter((r) => r.category === 'article').length,
    };
  }, [results]);

  const handleSelectResult = (item: GlobalSearchResult) => {
    saveRecentSearch(searchQuery.trim() || item.title);
    navigate(item.url);
    onClose();
  };

  const handleLibraryFallback = (query: string) => {
    const trimmed = query.trim();
    if (!trimmed) return;
    saveRecentSearch(trimmed);
    navigate(`/library?search=${encodeURIComponent(trimmed)}`);
    onClose();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    const currentList = searchQuery ? filteredResults : recentSearches;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex((prev) => Math.min(prev + 1, currentList.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((prev) => Math.max(prev - 1, -1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (activeIndex >= 0 && activeIndex < currentList.length) {
        if (searchQuery) {
          handleSelectResult(filteredResults[activeIndex]);
        } else {
          const recent = recentSearches[activeIndex];
          setSearchQuery(recent);
        }
      } else if (searchQuery.trim()) {
        handleLibraryFallback(searchQuery);
      }
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  const showRecent = !searchQuery && recentSearches.length > 0;
  const showResults = searchQuery.trim().length >= 2 && filteredResults.length > 0;
  const showNoResults = searchQuery.trim().length >= 2 && !isLoading && hasSearched && filteredResults.length === 0;

  const getCategoryIcon = (category: GlobalSearchResult['category']) => {
    switch (category) {
      case 'book':
        return <BookOpen className="w-4 h-4 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />;
      case 'author':
        return <User className="w-4 h-4 text-amber-600 dark:text-amber-400" aria-hidden="true" />;
      case 'article':
        return <FileText className="w-4 h-4 text-sky-600 dark:text-sky-400" aria-hidden="true" />;
    }
  };

  const getCategoryBadgeClass = (category: GlobalSearchResult['category']) => {
    switch (category) {
      case 'book':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200/60 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800/40';
      case 'author':
        return 'bg-amber-50 text-amber-700 border-amber-200/60 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800/40';
      case 'article':
        return 'bg-sky-50 text-sky-700 border-sky-200/60 dark:bg-sky-950/40 dark:text-sky-300 dark:border-sky-800/40';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        className="sm:max-w-2xl p-0 gap-0 max-h-[85vh] bg-white dark:bg-[#111614] border border-stone-200 dark:border-white/[0.09] text-stone-900 dark:text-stone-100 rounded-2xl shadow-2xl overflow-hidden focus:outline-none"
      >
        {/* Search Input Header */}
        <div className="relative flex items-center border-b border-stone-100 dark:border-white/[0.08] px-5 py-4">
          <Search className="w-5 h-5 text-stone-400 dark:text-stone-500 flex-shrink-0" aria-hidden="true" />
          <Input
            ref={inputRef}
            placeholder="Search books, authors, or articles..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setActiveIndex(-1);
            }}
            onKeyDown={handleKeyDown}
            aria-label="Search catalog"
            className="flex-1 ml-3 bg-transparent border-0 outline-none shadow-none focus-visible:ring-0 focus-visible:ring-offset-0 text-base sm:text-lg text-stone-900 dark:text-stone-100 placeholder:text-stone-400 dark:placeholder:text-stone-500 font-medium h-auto p-0"
          />
          {searchQuery ? (
            <button
              onClick={() => {
                setSearchQuery('');
                inputRef.current?.focus();
              }}
              className="ml-2 p-1 text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 transition-colors rounded"
              aria-label="Clear search"
            >
              <X className="w-4 h-4" />
            </button>
          ) : (
            <span className="hidden sm:inline-block ml-3 px-2 py-0.5 text-[10px] font-semibold text-stone-500 dark:text-stone-400 bg-stone-100 dark:bg-white/[0.06] border border-stone-200 dark:border-white/[0.1] rounded tracking-wide uppercase">
              Esc
            </span>
          )}
        </div>

        {/* Category Tabs Filter */}
        {searchQuery.trim().length >= 2 && results.length > 0 && (
          <div className="flex items-center gap-1.5 px-5 py-2.5 bg-stone-50/70 dark:bg-white/[0.02] border-b border-stone-100 dark:border-white/[0.06] overflow-x-auto">
            {(
              [
                { id: 'all', label: 'All Results', count: counts.all },
                { id: 'books', label: 'Books', count: counts.books },
                { id: 'authors', label: 'Authors', count: counts.authors },
                { id: 'articles', label: 'Articles', count: counts.articles },
              ] as const
            ).map((tab) => {
              const isActive = selectedCategory === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => {
                    setSelectedCategory(tab.id);
                    setActiveIndex(-1);
                  }}
                  className={cn(
                    'px-3 py-1 rounded-full text-xs font-medium transition-colors flex items-center gap-1.5 whitespace-nowrap',
                    isActive
                      ? 'bg-[#1C442D] text-white dark:bg-[#D5B16D] dark:text-black font-semibold shadow-xs'
                      : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-white bg-white dark:bg-white/[0.04] border border-stone-200/60 dark:border-white/[0.08]'
                  )}
                >
                  <span>{tab.label}</span>
                  <span
                    className={cn(
                      'text-[10px] px-1.5 py-0.2 rounded-full',
                      isActive
                        ? 'bg-white/20 text-white dark:bg-black/20 dark:text-black'
                        : 'bg-stone-100 dark:bg-white/[0.08] text-stone-500 dark:text-stone-400'
                    )}
                  >
                    {tab.count}
                  </span>
                </button>
              );
            })}
          </div>
        )}

        {/* Scrollable Results Area */}
        <ScrollArea className="max-h-[58vh]">
          <div className="p-3 space-y-3">
            {/* Recent Searches */}
            {showRecent && (
              <div>
                <div className="flex items-center justify-between px-3 py-1.5 mb-1">
                  <h3 className="text-xs font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5" aria-hidden="true" />
                    Recent Searches
                  </h3>
                  <button
                    onClick={clearRecentSearches}
                    className="text-xs font-medium text-stone-500 hover:text-stone-800 dark:text-stone-400 dark:hover:text-stone-200 transition-colors"
                  >
                    Clear history
                  </button>
                </div>
                <div className="space-y-1">
                  {recentSearches.map((search, index) => (
                    <button
                      key={search}
                      onClick={() => {
                        setSearchQuery(search);
                        handleLibraryFallback(search);
                      }}
                      className={cn(
                        'w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-colors text-left group',
                        activeIndex === index
                          ? 'bg-stone-100 dark:bg-white/[0.08] border border-stone-200 dark:border-white/[0.12]'
                          : 'hover:bg-stone-50 dark:hover:bg-white/[0.04] border border-transparent'
                      )}
                    >
                      <div className="w-8 h-8 rounded-lg bg-stone-100 dark:bg-white/[0.06] flex-shrink-0 flex items-center justify-center text-stone-500 dark:text-stone-400">
                        <Search className="w-4 h-4" aria-hidden="true" />
                      </div>
                      <span className="text-sm font-medium text-stone-800 dark:text-stone-200 truncate flex-1">
                        {search}
                      </span>
                      <ArrowRight className="w-3.5 h-3.5 text-stone-400 opacity-0 group-hover:opacity-100 transition-opacity" aria-hidden="true" />
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Loading Indicator */}
            {isLoading && searchQuery.trim().length >= 2 && (
              <div className="text-center py-10 text-stone-500 dark:text-stone-400">
                <div className="animate-pulse text-sm font-medium flex items-center justify-center gap-2">
                  <Sparkles className="w-4 h-4 animate-spin text-[#B68A35] dark:text-[#D5B16D]" />
                  Searching books, authors & articles…
                </div>
              </div>
            )}

            {/* Character Length Guidance */}
            {searchQuery.trim().length > 0 && searchQuery.trim().length < 2 && (
              <div className="text-center py-8 text-stone-500 dark:text-stone-400">
                <p className="text-sm">Type at least 2 characters to search</p>
              </div>
            )}

            {/* Results List */}
            {showResults && (
              <div className="space-y-1">
                {filteredResults.map((item, index) => (
                  <button
                    key={item.id}
                    onClick={() => handleSelectResult(item)}
                    className={cn(
                      'group w-full flex items-center gap-3.5 px-3.5 py-2.5 rounded-xl transition-all text-left',
                      activeIndex === index
                        ? 'bg-stone-100 dark:bg-white/[0.08] border border-stone-200 dark:border-white/[0.12] shadow-2xs'
                        : 'hover:bg-stone-50 dark:hover:bg-white/[0.04] border border-transparent'
                    )}
                  >
                    {/* Thumbnail / Category Icon */}
                    <div className="w-10 h-13 rounded-md overflow-hidden bg-stone-100 dark:bg-white/[0.06] border border-stone-200/60 dark:border-white/[0.08] flex-shrink-0 flex items-center justify-center">
                      {item.imageUrl ? (
                        <img
                          src={item.imageUrl}
                          alt=""
                          aria-hidden="true"
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            // If image fails to load, gracefully replace with icon
                            (e.target as HTMLElement).style.display = 'none';
                          }}
                        />
                      ) : (
                        getCategoryIcon(item.category)
                      )}
                    </div>

                    {/* Metadata Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm text-stone-900 dark:text-stone-100 truncate group-hover:text-[#1C442D] dark:group-hover:text-[#D5B16D] transition-colors">
                          {item.title}
                        </span>
                        <Badge
                          variant="outline"
                          className={cn('text-[10px] px-1.5 py-0 uppercase font-bold tracking-wider', getCategoryBadgeClass(item.category))}
                        >
                          {item.category}
                        </Badge>
                      </div>
                      {item.subtitle && (
                        <p className="text-xs text-stone-500 dark:text-stone-400 truncate mt-0.5">
                          {item.subtitle}
                        </p>
                      )}
                      {item.meta && (
                        <p className="text-[11px] text-stone-400 dark:text-stone-500 truncate mt-0.5">
                          {item.meta}
                        </p>
                      )}
                    </div>

                    <div className="hidden sm:flex items-center gap-1 text-xs font-medium text-stone-400 dark:text-stone-500 opacity-0 group-hover:opacity-100 transition-opacity">
                      <span>Open</span>
                      <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
                    </div>
                  </button>
                ))}
              </div>
            )}

            {/* No Results Fallback */}
            {showNoResults && (
              <div className="text-center py-10 px-6">
                <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-stone-100 dark:bg-white/[0.06] flex items-center justify-center text-stone-400 dark:text-stone-500">
                  <Search className="w-6 h-6" aria-hidden="true" />
                </div>
                <p className="text-sm font-semibold text-stone-900 dark:text-stone-100">
                  No matching results for "{searchQuery}"
                </p>
                <p className="text-xs mt-1 text-stone-500 dark:text-stone-400 max-w-sm mx-auto">
                  Try broader keywords or search the complete digital library catalog.
                </p>
                <button
                  type="button"
                  onClick={() => handleLibraryFallback(searchQuery)}
                  className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold bg-[#1C442D] hover:bg-[#26583A] text-white dark:bg-[#D5B16D] dark:hover:bg-[#E3C382] dark:text-black transition-colors"
                >
                  <BookOpen className="w-3.5 h-3.5" aria-hidden="true" />
                  Search Full Library
                </button>
              </div>
            )}

            {/* Default Empty State */}
            {!searchQuery && !showRecent && (
              <div className="text-center py-12 px-6">
                <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-stone-100 dark:bg-white/[0.06] flex items-center justify-center text-stone-400 dark:text-stone-500">
                  <TrendingUp className="w-6 h-6" aria-hidden="true" />
                </div>
                <p className="text-sm font-semibold text-stone-900 dark:text-stone-100">
                  Search across Sahadhyayi
                </p>
                <p className="text-xs mt-1 text-stone-500 dark:text-stone-400">
                  Find books, discover authors, and read insightful articles.
                </p>
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Command Footer */}
        <div className="flex items-center justify-between px-5 py-3 bg-stone-50 dark:bg-[#0E1210] border-t border-stone-100 dark:border-white/[0.08] text-[11px] font-medium text-stone-500 dark:text-stone-400">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5">
              <kbd className="min-w-[18px] h-[18px] flex items-center justify-center bg-white dark:bg-white/[0.08] border border-stone-200 dark:border-white/[0.1] rounded text-[10px] text-stone-700 dark:text-stone-300">↑</kbd>
              <kbd className="min-w-[18px] h-[18px] flex items-center justify-center bg-white dark:bg-white/[0.08] border border-stone-200 dark:border-white/[0.1] rounded text-[10px] text-stone-700 dark:text-stone-300">↓</kbd>
              <span>Navigate</span>
            </div>
            <div className="flex items-center gap-1.5">
              <kbd className="px-1.5 h-[18px] flex items-center justify-center bg-white dark:bg-white/[0.08] border border-stone-200 dark:border-white/[0.1] rounded text-[10px] text-stone-700 dark:text-stone-300">Enter</kbd>
              <span>Open</span>
            </div>
            <div className="flex items-center gap-1.5">
              <kbd className="px-1.5 h-[18px] flex items-center justify-center bg-white dark:bg-white/[0.08] border border-stone-200 dark:border-white/[0.1] rounded text-[10px] text-stone-700 dark:text-stone-300">Esc</kbd>
              <span>Close</span>
            </div>
          </div>
          {searchQuery && (
            <button
              onClick={() => handleLibraryFallback(searchQuery)}
              className="hidden sm:inline-flex items-center gap-1 text-[#1C442D] hover:underline dark:text-[#D5B16D] font-semibold"
            >
              <span>Search in Library</span>
              <ArrowRight className="w-3 h-3" aria-hidden="true" />
            </button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
