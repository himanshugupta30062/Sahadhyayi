import React, { useState, useEffect, useRef, useCallback, useMemo, useContext } from 'react';
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
  Bookmark,
  Compass,
  Users,
  BarChart3,
  Sun,
  Moon,
  Bot,
  Terminal,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client-universal';
import useDebouncedValue from '@/lib/useDebouncedValue';
import { slugify } from '@/utils/slugify';
import { useTheme } from '@/contexts/ThemeContext';
import { BookExpertContext } from '@/contexts/book-expert.utils';
import { isNonBookDocument } from '@/hooks/useLibraryBooks';

interface EnhancedGlobalSearchProps {
  isOpen: boolean;
  onClose: () => void;
}

export type SearchCategory = 'all' | 'books' | 'research-papers' | 'authors' | 'articles' | 'commands';

export interface GlobalSearchResult {
  id: string;
  category: 'book' | 'research-paper' | 'author' | 'article' | 'command';
  title: string;
  subtitle?: string;
  meta?: string;
  url?: string;
  action?: () => void;
  imageUrl?: string | null;
  score: number;
}

const RECENT_SEARCHES_KEY = 'global_recent_searches';
const MAX_RECENT_SEARCHES = 5;

function computeRelevance(
  query: string,
  primary: string,
  secondary?: string | null,
  tertiary?: string | null
): number {
  const q = query.toLowerCase().trim();
  const p = (primary || '').toLowerCase().trim();
  const s = (secondary || '').toLowerCase().trim();
  const t = (tertiary || '').toLowerCase().trim();

  // Exact whole matches
  if (p === q) return 100;
  if (p.startsWith(q)) return 75;
  if (p.includes(q)) return 55;

  // Multi-term token matching (e.g. "premchand godan")
  const terms = q.split(/\s+/).filter(Boolean);
  if (terms.length > 1) {
    const allInP = terms.every((term) => p.includes(term));
    if (allInP) return 70;

    const allInCombined = terms.every((term) => p.includes(term) || s.includes(term) || t.includes(term));
    if (allInCombined) return 65;

    const anyInCombined = terms.some((term) => p.includes(term) || s.includes(term) || t.includes(term));
    if (anyInCombined) return 35;
  }

  if (s === q) return 45;
  if (s.startsWith(q)) return 35;
  if (s.includes(q)) return 28;
  if (t.includes(q)) return 18;
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

  const { theme, toggleTheme } = useTheme();
  const bookExpertContext = useContext(BookExpertContext);

  const debouncedQuery = useDebouncedValue(searchQuery, 300);

  // Quick navigation destinations and actions
  const quickCommands = useMemo(() => {
    return [
      {
        id: 'cmd-library',
        category: 'command' as const,
        title: 'Browse Library',
        subtitle: 'Explore 1,000+ public domain books & classics',
        meta: 'Catalog',
        url: '/library',
        keywords: ['library', 'books', 'catalog', 'free', 'classics', 'read', 'digital'],
        score: 50,
      },
      {
        id: 'cmd-research-papers',
        category: 'command' as const,
        title: 'Explore Research Papers',
        subtitle: 'Find academic papers, preprints and technical reports',
        meta: 'Research',
        url: '/research-papers',
        keywords: ['research', 'research papers', 'academic papers', 'studies', 'preprints', 'technical reports', 'journals'],
        score: 48,
      },
      {
        id: 'cmd-authors',
        category: 'command' as const,
        title: 'Explore Authors',
        subtitle: 'Discover literary figures, biographies & author catalogs',
        meta: 'Explore',
        url: '/authors',
        keywords: ['authors', 'writers', 'bio', 'novelist', 'literature', 'premchand', 'tagore'],
        score: 45,
      },
      {
        id: 'cmd-articles',
        category: 'command' as const,
        title: 'Read Articles',
        subtitle: 'Read reader analyses, critiques, essays & updates',
        meta: 'Stories',
        url: '/articles',
        keywords: ['articles', 'essays', 'stories', 'reading', 'insights', 'critiques'],
        score: 40,
      },
      {
        id: 'cmd-bookshelf',
        category: 'command' as const,
        title: 'My Bookshelf',
        subtitle: 'Jump to your reading list, bookmarks & history',
        meta: 'Personal',
        url: '/bookshelf',
        keywords: ['bookshelf', 'my books', 'reading list', 'saved', 'bookmarks', 'library'],
        score: 40,
      },
      {
        id: 'cmd-dna',
        category: 'command' as const,
        title: 'Reading DNA Archetype',
        subtitle: 'Analyze your reading personality & custom recommendations',
        meta: 'Discovery',
        url: '/reading-dna',
        keywords: ['dna', 'archetype', 'reading dna', 'personality', 'recommendations'],
        score: 35,
      },
      {
        id: 'cmd-games',
        category: 'command' as const,
        title: 'Literary Games & Quizzes',
        subtitle: 'Test your literary mastery with quizzes & book challenges',
        meta: 'Interactive',
        url: '/games',
        keywords: ['games', 'quizzes', 'trivia', 'challenge', 'fun', 'play'],
        score: 35,
      },
      {
        id: 'cmd-social',
        category: 'command' as const,
        title: 'Reading Community & Feed',
        subtitle: 'Connect with fellow readers and book discussions',
        meta: 'Social',
        url: '/social',
        keywords: ['community', 'social', 'feed', 'readers', 'friends', 'groups', 'discussion'],
        score: 30,
      },
      {
        id: 'cmd-stats',
        category: 'command' as const,
        title: 'Live Website Stats',
        subtitle: 'Real-time telemetry, reader traffic & Community Pulse',
        meta: 'Analytics',
        action: () => {
          if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('open-community-pulse'));
          }
        },
        keywords: ['stats', 'live stats', 'pulse', 'community pulse', 'telemetry', 'analytics', 'traffic', 'visitors'],
        score: 30,
      },
      {
        id: 'cmd-expert',
        category: 'command' as const,
        title: 'Ask Book Expert AI',
        subtitle: 'Intelligent literary companion grounded in our catalog',
        meta: 'AI Companion',
        action: () => {
          if (bookExpertContext?.toggleChat) {
            bookExpertContext.toggleChat();
          } else {
            navigate('/');
          }
        },
        keywords: ['expert', 'book expert', 'ai', 'chatbot', 'assistant', 'companion', 'gemini', 'recommend'],
        score: 30,
      },
      {
        id: 'cmd-theme',
        category: 'command' as const,
        title: `Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`,
        subtitle: `Toggle visual theme to ${theme === 'dark' ? 'warm editorial light' : 'immersive dark aesthetic'}`,
        meta: 'Appearance',
        action: () => {
          toggleTheme();
        },
        keywords: ['theme', 'dark mode', 'light mode', 'color', 'appearance', 'night', 'day', 'toggle'],
        score: 25,
      },
    ];
  }, [theme, toggleTheme, bookExpertContext, navigate]);

  const quickCommandsRef = useRef(quickCommands);
  quickCommandsRef.current = quickCommands;

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

  const removeRecentSearch = (itemToRemove: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setRecentSearches((prev) => {
      const next = prev.filter((s) => s !== itemToRemove);
      try {
        if (typeof window !== 'undefined') {
          localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(next));
        }
      } catch {
        // Ignore
      }
      return next;
    });
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
      const terms = cleanTerm.split(/\s+/).filter(Boolean);

      // Match commands in-memory
      const matchedCommands: GlobalSearchResult[] = [];
      const qLower = cleanTerm.toLowerCase();
      for (const cmd of quickCommandsRef.current) {
        const titleMatch = cmd.title.toLowerCase().includes(qLower);
        const subtitleMatch = cmd.subtitle.toLowerCase().includes(qLower);
        const keywordMatch = cmd.keywords.some((kw) => kw.includes(qLower) || qLower.includes(kw));

        if (titleMatch || subtitleMatch || keywordMatch) {
          matchedCommands.push({
            id: cmd.id,
            category: 'command',
            title: cmd.title,
            subtitle: cmd.subtitle,
            meta: cmd.meta,
            url: cmd.url,
            action: cmd.action,
            score: titleMatch ? 90 : (keywordMatch ? 70 : 40),
          });
        }
      }

      // Build or queries supporting multi-token matching
      let bookOr = `title.ilike.%${cleanTerm}%,author.ilike.%${cleanTerm}%,genre.ilike.%${cleanTerm}%`;
      if (terms.length > 1) {
        const extraOrs: string[] = [];
        for (const t of terms.slice(0, 3)) {
          extraOrs.push(`title.ilike.%${t}%`, `author.ilike.%${t}%`);
        }
        bookOr = `${bookOr},${extraOrs.join(',')}`;
      }

      // Quick commands are local and should remain useful even if catalog APIs are slow.
      if (isMounted) {
        setResults(matchedCommands);
        setIsLoading(false);
      }

      const [booksResult, authorsResult, articlesResult] = await Promise.allSettled([
        // 1. Books query
        supabase
          .from('books_library')
          .select('id, title, author, genre, cover_image_url, language, pdf_url, description')
          .or(bookOr)
          .limit(12),

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

      const combined: GlobalSearchResult[] = [...matchedCommands];

      // Process books
      if (booksResult.status === 'fulfilled' && booksResult.value.data) {
        for (const b of booksResult.value.data) {
          combined.push({
            id: `book-${b.id}`,
            category: isNonBookDocument(b) ? 'research-paper' : 'book',
            title: b.title,
            subtitle: b.author ? `by ${b.author}` : undefined,
            meta: b.genre || b.language || undefined,
            url: isNonBookDocument(b) ? `/research-papers?search=${encodeURIComponent(b.title)}` : `/book/${b.id}`,
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

    void runSearch();

    return () => {
      isMounted = false;
    };
  }, [debouncedQuery]);

  // Filter results by selected category tab
  const filteredResults = useMemo(() => {
    if (selectedCategory === 'all') return results;
    if (selectedCategory === 'books') return results.filter((r) => r.category === 'book');
    if (selectedCategory === 'research-papers') return results.filter((r) => r.category === 'research-paper');
    if (selectedCategory === 'authors') return results.filter((r) => r.category === 'author');
    if (selectedCategory === 'articles') return results.filter((r) => r.category === 'article');
    if (selectedCategory === 'commands') return results.filter((r) => r.category === 'command');
    return results;
  }, [results, selectedCategory]);

  const counts = useMemo(() => {
    return {
      all: results.length,
      books: results.filter((r) => r.category === 'book').length,
      'research-papers': results.filter((r) => r.category === 'research-paper').length,
      authors: results.filter((r) => r.category === 'author').length,
      articles: results.filter((r) => r.category === 'article').length,
      commands: results.filter((r) => r.category === 'command').length,
    };
  }, [results]);

  const availableTabs = useMemo<SearchCategory[]>(() => {
    const tabs: SearchCategory[] = ['all'];
    if (counts.books > 0) tabs.push('books');
    if (counts['research-papers'] > 0) tabs.push('research-papers');
    if (counts.authors > 0) tabs.push('authors');
    if (counts.articles > 0) tabs.push('articles');
    if (counts.commands > 0) tabs.push('commands');
    return tabs;
  }, [counts]);

  const handleSelectResult = (item: GlobalSearchResult) => {
    saveRecentSearch(searchQuery.trim() || item.title);
    if (item.action) {
      item.action();
    } else if (item.url) {
      navigate(item.url);
    }
    onClose();
  };

  const handleLibraryFallback = (query: string) => {
    const trimmed = query.trim();
    if (!trimmed) return;
    saveRecentSearch(trimmed);
    navigate(`/library?search=${encodeURIComponent(trimmed)}`);
    onClose();
  };

  const handleInitialCommandSelect = (cmd: typeof quickCommands[0]) => {
    if (cmd.action) {
      cmd.action();
    } else if (cmd.url) {
      navigate(cmd.url);
    }
    onClose();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Cmd+K / Ctrl+K while focused in dialog closes it (toggle action)
    const isK = e.key === 'k' || e.key === 'K';
    if (isK && (e.metaKey || e.ctrlKey) && !e.altKey && !e.shiftKey) {
      e.preventDefault();
      onClose();
      return;
    }

    // Tab key cycles category filters
    if (e.key === 'Tab' && searchQuery.trim().length >= 2 && availableTabs.length > 1) {
      e.preventDefault();
      const currentIdx = availableTabs.indexOf(selectedCategory);
      const nextIdx = e.shiftKey
        ? (currentIdx - 1 + availableTabs.length) % availableTabs.length
        : (currentIdx + 1) % availableTabs.length;
      setSelectedCategory(availableTabs[nextIdx]);
      setActiveIndex(-1);
      return;
    }

    const currentList = searchQuery ? filteredResults : quickCommands;

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
          handleInitialCommandSelect(quickCommands[activeIndex]);
        }
      } else if (searchQuery.trim()) {
        handleLibraryFallback(searchQuery);
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
    }
  };

  const showRecent = !searchQuery && recentSearches.length > 0;
  const showResults = searchQuery.trim().length >= 2 && filteredResults.length > 0;
  const showNoResults = searchQuery.trim().length >= 2 && !isLoading && hasSearched && filteredResults.length === 0;

  const getCategoryIcon = (category: GlobalSearchResult['category'], iconType?: string) => {
    switch (category) {
      case 'book':
        return <BookOpen className="w-4 h-4 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />;
      case 'research-paper':
        return <FileText className="w-4 h-4 text-sky-600 dark:text-sky-400" aria-hidden="true" />;
      case 'author':
        return <User className="w-4 h-4 text-amber-600 dark:text-amber-400" aria-hidden="true" />;
      case 'article':
        return <FileText className="w-4 h-4 text-sky-600 dark:text-sky-400" aria-hidden="true" />;
      case 'command':
        if (iconType === 'stats') return <BarChart3 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />;
        if (iconType === 'expert') return <Bot className="w-4 h-4 text-indigo-600 dark:text-indigo-400" aria-hidden="true" />;
        if (iconType === 'theme') return <Sun className="w-4 h-4 text-amber-600 dark:text-amber-400" aria-hidden="true" />;
        if (iconType === 'games') return <Sparkles className="w-4 h-4 text-purple-600 dark:text-purple-400" aria-hidden="true" />;
        if (iconType === 'bookshelf') return <Bookmark className="w-4 h-4 text-teal-600 dark:text-teal-400" aria-hidden="true" />;
        if (iconType === 'dna') return <Compass className="w-4 h-4 text-rose-600 dark:text-rose-400" aria-hidden="true" />;
        if (iconType === 'social') return <Users className="w-4 h-4 text-blue-600 dark:text-blue-400" aria-hidden="true" />;
        return <Terminal className="w-4 h-4 text-stone-600 dark:text-stone-300" aria-hidden="true" />;
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
      case 'command':
        return 'bg-purple-50 text-purple-700 border-purple-200/60 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-800/40';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        className="sm:max-w-2xl p-0 gap-0 max-h-[85vh] bg-white dark:bg-[#111614] border border-stone-200 dark:border-white/[0.09] text-stone-900 dark:text-stone-100 rounded-2xl shadow-2xl overflow-hidden focus:outline-none [&>button:last-child]:hidden"
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
            <button
              type="button"
              onClick={onClose}
              className="p-1 text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 transition-colors rounded"
              aria-label="Close search"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Category Tabs Filter */}
        {searchQuery.trim().length >= 2 && results.length > 0 && (
          <div className="flex items-center gap-1.5 px-5 py-2.5 bg-stone-50/70 dark:bg-white/[0.02] border-b border-stone-100 dark:border-white/[0.06] overflow-x-auto">
            {(
              [
                { id: 'all' as const, label: 'All Results', count: counts.all },
                { id: 'books' as const, label: 'Books', count: counts.books },
                { id: 'authors' as const, label: 'Authors', count: counts.authors },
                { id: 'articles' as const, label: 'Articles', count: counts.articles },
                ...(counts.commands > 0 ? [{ id: 'commands' as const, label: 'Commands', count: counts.commands }] : []),
              ]
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
                    'px-3 py-1 rounded-full text-xs font-medium transition-colors flex items-center gap-1.5 whitespace-nowrap cursor-pointer',
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
                    className="text-xs font-medium text-stone-500 hover:text-stone-800 dark:text-stone-400 dark:hover:text-stone-200 transition-colors cursor-pointer"
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
                        'w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-colors text-left group cursor-pointer',
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
                      <button
                        type="button"
                        onClick={(e) => removeRecentSearch(search, e)}
                        className="opacity-0 group-hover:opacity-100 p-1 text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 transition-opacity"
                        aria-label={`Remove ${search} from history`}
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                      <ArrowRight className="w-3.5 h-3.5 text-stone-400 opacity-0 group-hover:opacity-100 transition-opacity" aria-hidden="true" />
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Initial State: Quick Navigation & Actions */}
            {!searchQuery && (
              <div>
                <div className="px-3 py-1.5 mb-1">
                  <h3 className="text-xs font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wider flex items-center gap-1.5">
                    <TrendingUp className="w-3.5 h-3.5" aria-hidden="true" />
                    Quick Navigation & Actions
                  </h3>
                </div>
                <div className="space-y-1">
                  {quickCommands.map((cmd, index) => {
                    const isSelected = activeIndex === index;
                    return (
                      <button
                        key={cmd.id}
                        type="button"
                        onClick={() => handleInitialCommandSelect(cmd)}
                        className={cn(
                          'w-full flex items-center gap-3.5 px-3.5 py-2.5 rounded-xl transition-all text-left cursor-pointer group',
                          isSelected
                            ? 'bg-stone-100 dark:bg-white/[0.08] border border-stone-200 dark:border-white/[0.12] shadow-2xs'
                            : 'hover:bg-stone-50 dark:hover:bg-white/[0.04] border border-transparent'
                        )}
                      >
                        <div className="w-9 h-9 rounded-lg bg-stone-100 dark:bg-white/[0.06] border border-stone-200/60 dark:border-white/[0.08] flex items-center justify-center flex-shrink-0">
                          {getCategoryIcon(cmd.category, cmd.keywords[0])}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-sm text-stone-900 dark:text-stone-100 truncate group-hover:text-[#1C442D] dark:group-hover:text-[#D5B16D] transition-colors">
                              {cmd.title}
                            </span>
                            <Badge
                              variant="outline"
                              className="text-[10px] px-1.5 py-0 uppercase font-bold tracking-wider bg-purple-50 text-purple-700 border-purple-200/60 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-800/40"
                            >
                              {cmd.meta}
                            </Badge>
                          </div>
                          <p className="text-xs text-stone-500 dark:text-stone-400 truncate mt-0.5">
                            {cmd.subtitle}
                          </p>
                        </div>
                        <div className="hidden sm:flex items-center gap-1 text-xs font-medium text-stone-400 dark:text-stone-500 opacity-0 group-hover:opacity-100 transition-opacity">
                          <span>Jump</span>
                          <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
                        </div>
                      </button>
                    );
                  })}
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
                      'group w-full flex items-center gap-3.5 px-3.5 py-2.5 rounded-xl transition-all text-left cursor-pointer',
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
                      <span>{item.action ? 'Run' : 'Open'}</span>
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
                  className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold bg-[#1C442D] hover:bg-[#26583A] text-white dark:bg-[#D5B16D] dark:hover:bg-[#E3C382] dark:text-black transition-colors cursor-pointer"
                >
                  <BookOpen className="w-3.5 h-3.5" aria-hidden="true" />
                  Search Full Library
                </button>
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
              className="hidden sm:inline-flex items-center gap-1 text-[#1C442D] hover:underline dark:text-[#D5B16D] font-semibold cursor-pointer"
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

export default EnhancedGlobalSearch;
