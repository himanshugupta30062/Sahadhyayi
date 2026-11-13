import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  ArrowLeft, ArrowRight, BookOpen, Bookmark, BookmarkCheck,
  CheckCircle2, Download, ExternalLink, FileText, GitBranch,
  Quote, RefreshCw, Search, Sparkles,
} from 'lucide-react';
import SEO from '@/components/SEO';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import type { Json } from '@/integrations/supabase/types';

type OpenAlexAuthor = { author?: { id?: string | null; display_name?: string | null } | null } | null;
type OpenAlexLocation = {
  landing_page_url?: string | null;
  pdf_url?: string | null;
  source?: { display_name?: string | null } | null;
} | null;
type OpenAlexWork = {
  id?: string;
  doi?: string | null;
  display_name?: string | null;
  title?: string | null;
  publication_year?: number | null;
  publication_date?: string | null;
  type?: string | null;
  cited_by_count?: number | null;
  authorships?: OpenAlexAuthor[] | null;
  primary_location?: OpenAlexLocation;
  best_oa_location?: OpenAlexLocation;
  open_access?: { is_oa?: boolean; oa_status?: string | null } | null;
  abstract_inverted_index?: Record<string, number[]> | null;
};
type OpenAlexResponse = { meta?: { count?: number }; results?: OpenAlexWork[] };
type Topic = { label: string; query: string };
type ResearchPaperCategory = {
  slug: string;
  name: string;
  description: string | null;
  display_order: number;
  openalex_types: string[];
};
type CategoryQueryResult = {
  data: ResearchPaperCategory[] | null;
  error: { message: string } | null;
};
type CategoryQueryClient = {
  from: (table: string) => {
    select: (columns: string) => {
      order: (column: string, options: { ascending: boolean }) => PromiseLike<CategoryQueryResult>;
    };
  };
};

const DEFAULT_CATEGORIES: ResearchPaperCategory[] = [
  { slug: 'article', name: 'Research article', description: 'Original scholarly research', display_order: 1, openalex_types: ['article'] },
  { slug: 'review', name: 'Review paper', description: 'Synthesis of existing research', display_order: 2, openalex_types: ['review'] },
  { slug: 'preprint', name: 'Preprint', description: 'Research shared before peer review', display_order: 3, openalex_types: ['preprint'] },
  { slug: 'conference-paper', name: 'Conference paper', description: 'Research published in conference proceedings', display_order: 4, openalex_types: ['conference-paper'] },
  { slug: 'book-chapter', name: 'Book chapter', description: 'Scholarly chapter in an edited volume', display_order: 5, openalex_types: ['book-chapter'] },
  { slug: 'other', name: 'Other research', description: 'Other scholarly work types', display_order: 6, openalex_types: ['book', 'book-review', 'conference-abstract', 'data-paper', 'dataset', 'dissertation', 'editorial', 'erratum', 'letter', 'libguides', 'other', 'paratext', 'peer-review', 'reference-entry', 'report', 'retraction', 'software', 'software-paper', 'standard', 'supplementary-materials'] },
];

function getCategorySlug(paper: OpenAlexWork, categoryList: ResearchPaperCategory[]): string {
  const type = (paper.type || '').toLowerCase().replace(/_/g, '-');
  const matchedCategory = categoryList.find((item) => item.openalex_types?.includes(type));
  if (matchedCategory) return matchedCategory.slug;
  return 'other';
}

const API_URL = 'https://api.openalex.org/works';
const PAGE_SIZE = 12;
const MAX_OPENALEX_BASIC_RESULTS = 10000;
const MAX_NUMBERED_PAGES = Math.floor(MAX_OPENALEX_BASIC_RESULTS / PAGE_SIZE);
const TOPICS: Topic[] = [
  { label: 'All research', query: '' },
  { label: 'Artificial intelligence', query: 'artificial intelligence' },
  { label: 'Machine learning', query: 'machine learning' },
  { label: 'Climate science', query: 'climate change' },
  { label: 'Psychology', query: 'psychology' },
  { label: 'Medicine', query: 'medicine' },
  { label: 'Physics', query: 'physics' },
];


function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function getAbstract(index?: Record<string, number[]> | null): string {
  if (!index || !isRecord(index)) return '';
  const words: string[] = [];
  for (const [word, positions] of Object.entries(index)) {
    if (!Array.isArray(positions)) continue;
    for (const position of positions) {
      if (Number.isInteger(position) && position >= 0 && position < 30000) words[position] = word;
    }
  }
  return words.filter((word): word is string => typeof word === 'string').join(' ');
}

function getAuthors(authorships?: OpenAlexAuthor[] | null): string {
  if (!Array.isArray(authorships)) return '';
  const names = authorships
    .filter((item): item is Exclude<OpenAlexAuthor, null> => item !== null && typeof item === 'object')
    .map((item) => item.author?.display_name)
    .filter((name): name is string => typeof name === 'string' && name.trim().length > 0);
  if (names.length <= 3) return names.join(', ');
  return `${names.slice(0, 3).join(', ')} and ${names.length - 3} more`;
}

function safeHttpUrl(value?: string | null): string {
  if (typeof value !== 'string') return '';
  try {
    const url = new URL(value);
    return url.protocol === 'https:' || url.protocol === 'http:' ? url.href : '';
  } catch {
    return '';
  }
}

function getPaperUrl(paper: OpenAlexWork): string {
  return safeHttpUrl(
    paper.best_oa_location?.landing_page_url
      || paper.primary_location?.landing_page_url
      || paper.doi
      || paper.id,
  );
}

function isUsableWork(value: unknown): value is OpenAlexWork {
  if (!isRecord(value)) return false;
  return typeof value.id === 'string'
    && value.id.startsWith('https://openalex.org/')
    && (typeof value.display_name === 'string' || typeof value.title === 'string');
}

const ResearchPapers = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '');
  const [activeTopic, setActiveTopic] = useState('');
  const [year, setYear] = useState(searchParams.get('year') || 'all');
  const [category, setCategory] = useState(searchParams.get('category') || 'all');
  const [sort, setSort] = useState(searchParams.get('sort') || 'cited_by_count');
  const [categories, setCategories] = useState<ResearchPaperCategory[]>(DEFAULT_CATEGORIES);
  const [page, setPage] = useState(() => Math.max(1, Math.min(MAX_NUMBERED_PAGES, Number(searchParams.get('page')) || 1)));
  const [papers, setPapers] = useState<OpenAlexWork[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [retry, setRetry] = useState(0);
  const [debouncedQuery, setDebouncedQuery] = useState(searchParams.get('search') || '');
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());
  const [savingId, setSavingId] = useState<string | null>(null);
  const [bookmarkError, setBookmarkError] = useState('');

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedQuery(searchQuery.trim()), 350);
    return () => window.clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    let active = true;
    const loadCategories = async () => {
      try {
        const categoryClient = supabase as unknown as CategoryQueryClient;
        const { data, error: categoryError } = await categoryClient
          .from('research_paper_categories')
          .select('slug,name,description,display_order,openalex_types')
          .order('display_order', { ascending: true });
        if (categoryError) throw categoryError;
        if (active && Array.isArray(data) && data.length > 0) setCategories(data);
      } catch (categoryLoadError) {
        // Keep the built-in taxonomy available if the database is temporarily unavailable.
        console.warn('Unable to load research paper categories:', categoryLoadError);
      }
    };
    void loadCategories();
    return () => { active = false; };
  }, []);

  useEffect(() => {
    let active = true;
    const loadBookmarks = async () => {
      try {
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user || !active) return;
        const { data, error: bookmarkLoadError } = await supabase
          .from('research_paper_bookmarks')
          .select('openalex_id')
          .eq('user_id', user.id);
        if (!bookmarkLoadError && active) {
          setSavedIds(new Set((data ?? []).map((item) => item.openalex_id)));
        }
      } catch (loadError) {
        if (active) setBookmarkError(loadError instanceof Error ? loadError.message : 'Unable to load saved papers.');
      }
    };
    void loadBookmarks();
    return () => { active = false; };
  }, []);

  const toggleBookmark = async (paper: OpenAlexWork) => {
    if (!paper.id) return;
    setSavingId(paper.id);
    setBookmarkError('');
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        window.location.assign('/signin');
        return;
      }
      if (savedIds.has(paper.id)) {
        const { error: deleteError } = await supabase
          .from('research_paper_bookmarks')
          .delete()
          .eq('user_id', user.id)
          .eq('openalex_id', paper.id);
        if (deleteError) throw deleteError;
        setSavedIds((current) => {
          const next = new Set(current);
          next.delete(paper.id!);
          return next;
        });
      } else {
        const { error: insertError } = await supabase
          .from('research_paper_bookmarks')
          .insert({ user_id: user.id, openalex_id: paper.id, paper: paper as unknown as Json });
        if (insertError) throw insertError;
        setSavedIds((current) => new Set(current).add(paper.id!));
      }
    } catch (bookmarkSaveError) {
      setBookmarkError(bookmarkSaveError instanceof Error ? bookmarkSaveError.message : 'Unable to update your saved papers.');
    } finally {
      setSavingId(null);
    }
  };

  const serializedSearchParams = searchParams.toString();
  useEffect(() => {
    const urlParams = new URLSearchParams(serializedSearchParams);
    setSearchQuery(urlParams.get('search') || '');
    setYear(urlParams.get('year') || 'all');
    setCategory(urlParams.get('category') || 'all');
    setSort(['cited_by_count', 'publication_date', 'relevance_score'].includes(urlParams.get('sort') || '') ? urlParams.get('sort')! : 'cited_by_count');
    setPage(Math.max(1, Math.min(MAX_NUMBERED_PAGES, Number(urlParams.get('page')) || 1)));
  }, [serializedSearchParams]);

  useEffect(() => {
    setSearchParams((currentParams) => {
      const next = new URLSearchParams(currentParams);
      if (searchQuery.trim()) next.set('search', searchQuery.trim());
      else next.delete('search');
      if (year !== 'all') next.set('year', year);
      else next.delete('year');
      if (category !== 'all') next.set('category', category);
      else next.delete('category');
      if (page > 1) next.set('page', String(page));
      else next.delete('page');
      return next.toString() === currentParams.toString() ? currentParams : next;
    }, { replace: true });
  }, [searchQuery, year, category, sort, page, setSearchParams]);

  useEffect(() => {
    let active = true;
    async function loadPapers() {
      setLoading(true);
      setError('');
      try {
        const { data, error: functionError } = await supabase.functions.invoke('search-research-papers', {
          body: { query: debouncedQuery, year, category, sort, page, perPage: PAGE_SIZE },
        });
        if (functionError) throw functionError;
        const payload: unknown = data;
        if (!isRecord(payload)) throw new Error('The research catalogue returned an unexpected response.');
        const responseData = payload as OpenAlexResponse;
        const validPapers = Array.isArray(responseData.results) ? responseData.results.filter(isUsableWork) : [];
        if (!active) return;
        setPapers(validPapers);
        setTotalCount(Number.isFinite(responseData.meta?.count) ? Math.max(0, Number(responseData.meta?.count)) : validPapers.length);
      } catch (loadError) {
        if (!active) return;
        setError(loadError instanceof Error ? loadError.message : 'Unable to load research papers right now.');
        // Keep the last successful page visible during transient upstream failures.
      } finally {
        if (active) setLoading(false);
      }
    }
    void loadPapers();
    return () => { active = false; };
  }, [debouncedQuery, year, category, sort, page, retry]);

  const totalPages = Math.max(1, Math.min(MAX_NUMBERED_PAGES, Math.ceil(totalCount / PAGE_SIZE)));
  const pageNumbers = useMemo(() => {
    const first = Math.max(1, Math.min(page - 2, totalPages - 4));
    return Array.from({ length: Math.min(5, totalPages) }, (_, index) => first + index);
  }, [page, totalPages]);
  const firstResult = totalCount === 0 ? 0 : ((page - 1) * PAGE_SIZE) + 1;
  const lastResult = Math.min(page * PAGE_SIZE, totalCount);
  const resultLabel = useMemo(() => totalCount.toLocaleString('en-US'), [totalCount]);

  useEffect(() => {
    if (!loading && page > totalPages) setPage(totalPages);
  }, [loading, page, totalPages]);

  const goToPage = (nextPage: number) => {
    const safePage = Math.max(1, Math.min(totalPages, nextPage));
    setPage(safePage);
    setSearchParams((currentParams) => {
      const next = new URLSearchParams(currentParams);
      if (safePage > 1) next.set('page', String(safePage));
      else next.delete('page');
      return next;
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const chooseTopic = (topic: Topic) => {
    setActiveTopic(topic.label);
    setSearchQuery(topic.query);
    setPage(1);
  };

  const resetFilters = () => {
    setSearchQuery('');
    setActiveTopic('All research');
    setYear('all');
    setCategory('all');
    setPage(1);
  };

  return (
    <>
      <SEO
        title="Research Papers & Open Access Studies | Sahadhyayi"
        description="Discover influential research papers, academic studies and open-access publications from across the world's scholarly literature."
        canonical="https://sahadhyayi.com/research-papers"
        keywords={['research papers', 'open access research', 'academic papers', 'scientific studies', 'scholarly articles']}
      />
      <main className="min-h-screen bg-[#FAFAF8] text-[#1C201D] dark:bg-[#0B0D0C] dark:text-[#F3F0E7]">
        <section className="relative isolate overflow-hidden border-b border-[#E8E8E3] bg-[#F4F3EF] dark:border-[#29332D] dark:bg-[#101711]">
          <img
            src="https://images.unsplash.com/photo-1532012164546-f432f2e3edd4?auto=format&fit=crop&w=2400&q=85"
            alt=""
            aria-hidden="true"
            className="absolute right-0 top-0 z-0 h-full w-full object-cover object-[center_40%] sm:w-[65%] lg:w-[60%]"
            loading="eager"
          />
          {/* Mobile scrim for readability */}
          <div aria-hidden="true" className="absolute inset-0 z-0 bg-gradient-to-b from-[#F4F3EF]/92 via-[#F4F3EF]/85 to-[#F4F3EF]/78 dark:from-[#101711]/92 dark:via-[#101711]/85 dark:to-[#101711]/80 sm:hidden" />
          {/* Desktop gradient fade */}
          <div aria-hidden="true" className="hidden sm:block absolute inset-0 z-0 bg-gradient-to-r from-[#F4F3EF] via-[#F4F3EF]/85 to-[#F4F3EF]/20 dark:from-[#101711] dark:via-[#101711]/85 dark:to-[#101711]/20" />
          <div aria-hidden="true" className="hidden sm:block absolute inset-0 z-0 bg-gradient-to-t from-[#F4F3EF]/70 via-transparent to-transparent dark:from-[#101711]/80 dark:via-transparent dark:to-transparent" />
          <div className="relative mx-auto max-w-7xl px-4 py-9 sm:px-6 sm:py-12 lg:px-8">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#8A7350] dark:text-[#D5B16D]">Explore scholarly knowledge</p>
            <h1 className="mt-2 font-serif text-3xl font-bold tracking-tight sm:text-4xl">Research Papers</h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-[#636B65] dark:text-white/70 sm:text-base">Find research, compare evidence and read papers from their original sources.</p>
            <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
              <a href="/research-papers/submit?kind=publish" className="inline-flex min-h-11 items-center justify-center rounded-lg bg-[#1C442D] px-4 text-sm font-semibold text-white hover:bg-[#163824] dark:bg-[#D5B16D] dark:text-[#101711] dark:hover:bg-[#E3C58B]">Publish Research Paper</a>
              <a href="/research-papers/submit?kind=contribute" className="inline-flex min-h-11 items-center justify-center rounded-lg border border-[#C9D2CA] bg-white px-4 text-sm font-semibold text-[#1C442D] hover:bg-[#F3F6F2] dark:border-[#344039] dark:bg-[#1D2821] dark:text-[#D5B16D]">Add Research Paper</a>
              <a href="/my-saved-research" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-[#C9D2CA] bg-white px-4 text-sm font-semibold text-[#1C442D] hover:bg-[#F3F6F2] dark:border-[#344039] dark:bg-[#1D2821] dark:text-[#D5B16D]"><BookmarkCheck className="h-4 w-4" /> My Saved Research</a>
            </div>
          </div>
        </section>

        <section id="research-catalogue" className="mx-auto max-w-7xl scroll-mt-24 px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
          <div className="mb-5 rounded-2xl border border-[#E8E8E3] bg-white p-4 shadow-sm dark:border-[#26302A] dark:bg-[#141815] sm:p-6">
            <div className="flex flex-col gap-3 md:flex-row">
              <div className="relative min-w-0 flex-1">
                <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#7A817B]" />
                <Input
                  value={searchQuery}
                  onChange={(event) => { setSearchQuery(event.target.value); setPage(1); setActiveTopic(''); }}
                  placeholder="Search papers, topics, authors or keywords..."
                  aria-label="Search research papers"
                  className="h-12 border-[#E8E8E3] bg-[#FAFAF8] pl-10 text-sm dark:border-[#26302A] dark:bg-[#0B0D0C]"
                />
              </div>
              <div className="flex h-12 items-center gap-2 rounded-lg border border-[#E8E8E3] bg-[#FAFAF8] px-3 text-sm dark:border-[#26302A] dark:bg-[#0B0D0C]">
                <label htmlFor="research-year-filter" className="whitespace-nowrap text-xs text-[#737B74]">Published</label>
                <select id="research-year-filter" aria-label="Filter by publication year" value={year} onChange={(event) => { setYear(event.target.value); setPage(1); }} className="min-w-0 bg-transparent font-medium outline-none">
                  <option value="all">Any year</option>
                  {Array.from({ length: 30 }, (_, index) => String(new Date().getFullYear() - index)).map((value) => <option key={value} value={value}>{value}</option>)}
                </select>
              </div>
              <div className="flex h-12 items-center gap-2 rounded-lg border border-[#E8E8E3] bg-[#FAFAF8] px-3 text-sm dark:border-[#26302A] dark:bg-[#0B0D0C]">
                <label htmlFor="research-category-filter" className="whitespace-nowrap text-xs text-[#737B74]">Category</label>
                <select id="research-category-filter" aria-label="Filter by research category" value={category} onChange={(event) => { setCategory(event.target.value); setPage(1); }} className="min-w-0 bg-transparent font-medium outline-none">
                  <option value="all">All categories</option>
                  {categories.map((item) => <option key={item.slug} value={item.slug}>{item.name}</option>)}
                </select>
              </div>
              <div className="flex h-12 items-center gap-2 rounded-lg border border-[#E8E8E3] bg-[#FAFAF8] px-3 text-sm dark:border-[#26302A] dark:bg-[#0B0D0C]">
                <label htmlFor="research-sort-filter" className="whitespace-nowrap text-xs text-[#737B74]">Sort</label>
                <select id="research-sort-filter" aria-label="Sort research papers" value={sort} onChange={(event) => { setSort(event.target.value); setPage(1); }} className="min-w-0 bg-transparent font-medium outline-none">
                  <option value="cited_by_count">Most cited</option>
                  <option value="publication_date">Newest</option>
                  <option value="relevance_score">Most relevant</option>
                </select>
              </div>
              <Button type="button" variant="outline" onClick={resetFilters} className="h-12 gap-2 border-[#E8E8E3] dark:border-[#344039]">
                <RefreshCw className="h-4 w-4" /> Reset
              </Button>
            </div>
            <div className="mt-5">
              <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#899189]">Browse subjects</p>
              <div className="flex gap-2 overflow-x-auto pb-1">
                {TOPICS.map((topic) => (
                  <button
                    key={topic.label}
                    type="button"
                    onClick={() => chooseTopic(topic)}
                    aria-pressed={activeTopic === topic.label || (!activeTopic && topic.label === 'All research' && !searchQuery)}
                    className={`shrink-0 rounded-full border px-3.5 py-2 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1C442D] ${activeTopic === topic.label ? 'border-[#1C442D] bg-[#1C442D] text-white dark:border-[#D5B16D] dark:bg-[#D5B16D] dark:text-[#101711]' : 'border-[#E8E8E3] bg-white text-[#59635B] hover:border-[#AAB8AC] hover:bg-[#F6F8F5] dark:border-[#344039] dark:bg-[#141815] dark:text-[#C0C8C0] dark:hover:bg-[#1D2821]'}`}
                  >
                    {topic.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {bookmarkError && <p role="alert" className="mb-4 text-sm text-red-600 dark:text-red-400">{bookmarkError}</p>}
          {error && papers.length > 0 && <p role="alert" className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-200">Showing the last successfully loaded papers. The latest refresh failed: {error}</p>}
          <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-[#B38A45]" />
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#8A7350] dark:text-[#D5B16D]">From the global research index</p>
              </div>
              <h2 className="mt-1 font-serif text-2xl font-semibold sm:text-3xl">
                {debouncedQuery ? `Results for “${debouncedQuery}”` : 'Influential open-access research'}
              </h2>
            </div>
            <p className="text-sm text-[#737B74] dark:text-[#A5ADA6]">{loading ? 'Searching the catalogue…' : `${resultLabel} matching papers`}</p>
          </div>

          {loading && papers.length === 0 ? (
            <div className="grid gap-4" aria-live="polite" aria-busy="true">
              {Array.from({ length: 5 }, (_, index) => (
                <div key={index} className="animate-pulse rounded-2xl border border-[#E8E8E3] bg-white p-6 dark:border-[#26302A] dark:bg-[#141815]">
                  <div className="h-3 w-28 rounded bg-[#EAE7E0] dark:bg-[#29332D]" />
                  <div className="mt-4 h-5 w-3/4 rounded bg-[#EAE7E0] dark:bg-[#29332D]" />
                  <div className="mt-3 h-3 w-1/3 rounded bg-[#EAE7E0] dark:bg-[#29332D]" />
                  <div className="mt-5 h-3 w-full rounded bg-[#EAE7E0] dark:bg-[#29332D]" />
                  <div className="mt-2 h-3 w-5/6 rounded bg-[#EAE7E0] dark:bg-[#29332D]" />
                </div>
              ))}
            </div>
          ) : error && papers.length === 0 ? (
            <div role="alert" className="rounded-2xl border border-red-200 bg-white px-6 py-12 text-center dark:border-red-900 dark:bg-[#141815]">
              <FileText className="mx-auto h-9 w-9 text-red-400" />
              <h3 className="mt-4 font-serif text-xl font-semibold">We couldn't reach the research index</h3>
              <p className="mx-auto mt-2 max-w-lg text-sm text-[#737B74] dark:text-[#A5ADA6]">{error}</p>
              <Button onClick={() => setRetry((value) => value + 1)} className="mt-5 gap-2"><RefreshCw className="h-4 w-4" /> Try again</Button>
            </div>
          ) : papers.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-[#D8D2C8] px-6 py-16 text-center dark:border-[#344039]">
              <Search className="mx-auto h-10 w-10 text-[#9AA19A]" />
              <h3 className="mt-4 font-serif text-2xl font-semibold">No matching papers found</h3>
              <p className="mt-2 text-sm text-[#737B74] dark:text-[#A5ADA6]">Try a broader topic, another keyword or a different publication year.</p>
              <Button variant="outline" onClick={resetFilters} className="mt-5">Clear filters</Button>
            </div>
          ) : (
            <>
              <div className="grid gap-4">
                {papers.map((paper, index) => {
                  const pdfUrl = safeHttpUrl(paper.best_oa_location?.pdf_url || paper.primary_location?.pdf_url);
                  const paperUrl = getPaperUrl(paper);
                  const source = paper.primary_location?.source?.display_name;
                  const abstract = getAbstract(paper.abstract_inverted_index);
                  const authorLinks = getAuthorLinks(paper.authorships);
                  const title = paper.display_name || paper.title || 'Untitled research paper';
                  return (
                    <article key={paper.id} className="group rounded-2xl border border-[#E8E8E3] bg-white p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:border-[#C9D5CA] hover:shadow-md dark:border-[#26302A] dark:bg-[#141815] dark:hover:border-[#46594A] sm:p-6">
                      <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#F1F4EF] text-[#31583D] dark:bg-[#1D2A20] dark:text-[#D5B16D]">
                          <FileText className="h-5 w-5" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="mb-3 flex flex-wrap items-center gap-2">
                            {Boolean(paper.open_access?.is_oa) && (
                              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300">
                                <CheckCircle2 className="h-3 w-3" /> Open access
                              </span>
                            )}
                            {Boolean(paper.publication_year) && <span className="text-xs text-[#737B74] dark:text-[#A5ADA6]">{paper.publication_year}</span>}
                            {source && <span className="max-w-full truncate text-xs text-[#737B74] dark:text-[#A5ADA6]">· {source}</span>}
                          </div>
                          <h3 className="font-serif text-lg font-semibold leading-snug text-[#1C201D] transition-colors group-hover:text-[#1C442D] dark:text-[#F3F0E7] dark:group-hover:text-[#D5B16D] sm:text-xl">
                            {paperUrl ? <a href={paperUrl} target="_blank" rel="noopener noreferrer" className="focus-visible:rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1C442D]">{title}</a> : title}
                          </h3>
                          <p className="mt-2 flex flex-wrap items-center gap-x-1 text-sm text-[#59635B] dark:text-[#A5ADA6]">{authorLinks.length ? authorLinks.slice(0, 3).map((author, authorIndex) => <span key={`${author.name}-${authorIndex}`}>{author.url ? <a href={author.url} target="_blank" rel="noopener noreferrer" className="font-medium underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1C442D]">{author.name}<ExternalLink className="ml-0.5 inline h-3 w-3" aria-hidden="true" /></a> : author.name}{authorIndex < Math.min(authorLinks.length, 3) - 1 ? "," : ""}</span>) : "Author details unavailable"}{authorLinks.length > 3 && <span className="text-xs">and {authorLinks.length - 3} more</span>}</p>
                          {abstract && <p className="mt-3 line-clamp-3 max-w-5xl text-sm leading-6 text-[#737B74] dark:text-[#A5ADA6]">{abstract}</p>}
                          <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-[#737B74] dark:text-[#A5ADA6]">
                            <span className="inline-flex items-center gap-1.5"><Quote className="h-3.5 w-3.5" /> {Number(paper.cited_by_count || 0).toLocaleString('en-US')} citations</span>
                            <span className="inline-flex rounded-full border border-[#D7E1D6] bg-[#F1F5EF] px-2.5 py-1 text-[11px] font-semibold capitalize text-[#31583D] dark:border-[#344039] dark:bg-[#1D2821] dark:text-[#D5B16D]">
                              {categories.find((item) => item.slug === getCategorySlug(paper, categories))?.name || 'Other research'}
                            </span>
                            <span>Paper {((page - 1) * PAGE_SIZE) + index + 1}</span>
                          </div>
                          <div className="mt-5 flex flex-wrap gap-2">
                            {paperUrl && <a href={paperUrl} target="_blank" rel="noopener noreferrer" className="inline-flex h-9 items-center gap-2 rounded-lg bg-[#1C442D] px-3.5 text-xs font-semibold text-white transition-colors hover:bg-[#143221] dark:bg-[#D5B16D] dark:text-[#101711] dark:hover:bg-[#E3C483]"><BookOpen className="h-3.5 w-3.5" /> Read paper <ExternalLink className="h-3 w-3" /></a>}
                            {paper.id && <a href={`/research-network/${paper.id.split('/').pop()}`} className="inline-flex h-9 items-center gap-2 rounded-lg border border-[#D9E1DA] px-3.5 text-xs font-semibold text-[#31583D] hover:bg-[#F3F6F2] dark:border-[#344039] dark:text-[#D5B16D] dark:hover:bg-[#1D2821]"><GitBranch className="h-3.5 w-3.5" /> Citation network</a>}
                            {pdfUrl && <a href={pdfUrl} target="_blank" rel="noopener noreferrer" className="inline-flex h-9 items-center gap-2 rounded-lg border border-[#D9E1DA] px-3.5 text-xs font-semibold text-[#31583D] hover:bg-[#F3F6F2] dark:border-[#344039] dark:text-[#D5B16D] dark:hover:bg-[#1D2821]"><Download className="h-3.5 w-3.5" /> PDF</a>}
                            <Button type="button" variant="outline" disabled={savingId === paper.id} onClick={() => { toggleBookmark(paper).catch((bookmarkSaveError: unknown) => { setBookmarkError(bookmarkSaveError instanceof Error ? bookmarkSaveError.message : 'Unable to update your saved papers.'); }); }} className="h-9 gap-2 border-[#D9E1DA] px-3.5 text-xs dark:border-[#344039]">
                              {savedIds.has(paper.id || '') ? <BookmarkCheck className="h-3.5 w-3.5" /> : <Bookmark className="h-3.5 w-3.5" />}
                              {savingId === paper.id ? 'Saving…' : savedIds.has(paper.id || '') ? 'Saved' : 'Save paper'}
                            </Button>
                          </div>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>

              <nav aria-label="Research results pagination" className="mt-8 flex flex-col items-center justify-between gap-3 rounded-2xl border border-[#E8E8E3] bg-white p-4 dark:border-[#26302A] dark:bg-[#141815] sm:flex-row">
                <div className="text-center sm:text-left">
                  <p className="text-sm font-medium text-[#344139] dark:text-[#DCE4DC]">
                    Showing {firstResult.toLocaleString('en-US')}–{lastResult.toLocaleString('en-US')} of {resultLabel} papers
                  </p>
                  <p className="mt-1 text-xs text-[#737B74] dark:text-[#A5ADA6]">Page {page} of {totalPages}</p>
                </div>
                <div className="flex flex-wrap items-center justify-center gap-1.5">
                  <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => goToPage(1)} aria-label="First page">«</Button>
                  <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => goToPage(page - 1)} className="gap-1.5"><ArrowLeft className="h-4 w-4" /> Previous</Button>
                  {pageNumbers.map((number) => (
                    <Button key={number} size="sm" variant={number === page ? 'default' : 'outline'} aria-current={number === page ? 'page' : undefined} aria-label={`Page ${number}`} onClick={() => goToPage(number)}>
                      {number}
                    </Button>
                  ))}
                  <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => goToPage(page + 1)} className="gap-1.5">Next <ArrowRight className="h-4 w-4" /></Button>
                  <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => goToPage(totalPages)} aria-label="Last page">»</Button>
                </div>
              </nav>
            </>
          )}

          {totalCount > MAX_NUMBERED_PAGES * PAGE_SIZE && (
            <p role="note" className="mt-3 text-center text-xs text-[#8A7350] dark:text-[#D5B16D]">
              OpenAlex basic pagination is limited to the first 10,000 results. Refine your search to explore a narrower set of results.
            </p>
          )}
          <p className="mt-6 text-center text-xs text-[#899189] dark:text-[#7E897F]">Research metadata provided by OpenAlex. Full-text availability depends on the original publisher or repository.</p>
        </section>
      </main>
    </>
  );
};

export default ResearchPapers;
