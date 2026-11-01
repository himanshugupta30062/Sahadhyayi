import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  ArrowLeft, ArrowRight, BookOpen, CheckCircle2, Download, ExternalLink,
  FileText, Quote, RefreshCw, Search, Sparkles,
} from 'lucide-react';
import SEO from '@/components/SEO';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

type OpenAlexAuthor = { author?: { display_name?: string | null } | null } | null;
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

const API_URL = 'https://api.openalex.org/works';
const PAGE_SIZE = 12;
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
  const [year, setYear] = useState('all');
  const [page, setPage] = useState(1);
  const [papers, setPapers] = useState<OpenAlexWork[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [retry, setRetry] = useState(0);
  const [debouncedQuery, setDebouncedQuery] = useState(searchParams.get('search') || '');

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedQuery(searchQuery.trim()), 350);
    return () => window.clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    const next = new URLSearchParams(searchParams);
    if (searchQuery.trim()) next.set('search', searchQuery.trim());
    else next.delete('search');
    if (next.toString() !== searchParams.toString()) setSearchParams(next, { replace: true });
  }, [searchQuery, searchParams, setSearchParams]);

  useEffect(() => {
    const controller = new AbortController();
    let timedOut = false;
    const timeout = window.setTimeout(() => { timedOut = true; controller.abort(); }, 18000);

    async function loadPapers() {
      setLoading(true);
      setError('');
      try {
        const params = new URLSearchParams({
          per_page: String(PAGE_SIZE),
          page: String(page),
          sort: 'cited_by_count:desc',
          filter: year === 'all' ? 'open_access.is_oa:true' : `open_access.is_oa:true,publication_year:${year}`,
          select: 'id,doi,display_name,title,publication_year,publication_date,type,cited_by_count,authorships,primary_location,best_oa_location,open_access,abstract_inverted_index',
        });
        if (debouncedQuery) params.set('search', debouncedQuery);
        const response = await fetch(`${API_URL}?${params.toString()}`, {
          signal: controller.signal,
          headers: { Accept: 'application/json' },
        });
        if (!response.ok) {
          if (response.status === 429) throw new Error('The research catalogue is receiving many requests. Please wait a moment and retry.');
          throw new Error(`The research catalogue returned an error (${response.status}).`);
        }
        const payload: unknown = await response.json();
        if (!isRecord(payload)) throw new Error('The research catalogue returned an unexpected response.');
        const responseData = payload as OpenAlexResponse;
        const validPapers = Array.isArray(responseData.results) ? responseData.results.filter(isUsableWork) : [];
        setPapers(validPapers);
        setTotalCount(Number.isFinite(responseData.meta?.count) ? Math.max(0, Number(responseData.meta?.count)) : validPapers.length);
      } catch (loadError) {
        if (controller.signal.aborted) {
          if (timedOut) {
            setError('The research catalogue took too long to respond. Please check your connection and try again.');
            setPapers([]);
            setTotalCount(0);
            setLoading(false);
          }
          return;
        } else {
          setError(loadError instanceof Error ? loadError.message : 'Unable to load research papers right now.');
        }
        setPapers([]);
        setTotalCount(0);
      } finally {
        window.clearTimeout(timeout);
        if (!controller.signal.aborted) setLoading(false);
      }
    }

    void loadPapers();
    return () => {
      window.clearTimeout(timeout);
      controller.abort();
    };
  }, [debouncedQuery, year, page, retry]);

  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));
  const resultLabel = useMemo(() => totalCount.toLocaleString('en-US'), [totalCount]);

  const chooseTopic = (topic: Topic) => {
    setActiveTopic(topic.label);
    setSearchQuery(topic.query);
    setPage(1);
  };

  const resetFilters = () => {
    setSearchQuery('');
    setActiveTopic('All research');
    setYear('all');
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
      <main className="min-h-screen bg-[#FAF7F2] text-[#1C201D] dark:bg-[#0B0D0C] dark:text-[#F3F0E7]">
        <section className="relative isolate overflow-hidden border-b border-[#29332D] bg-[#101711] text-white">
          <div aria-hidden="true" className="pointer-events-none absolute -right-24 -top-36 h-[28rem] w-[28rem] rounded-full bg-emerald-500/10 blur-3xl" />
          <div aria-hidden="true" className="pointer-events-none absolute -bottom-48 -left-24 h-96 w-96 rounded-full bg-amber-400/10 blur-3xl" />
          <div className="relative mx-auto max-w-7xl px-4 py-14 sm:px-6 sm:py-20 lg:px-8">
            <div className="mx-auto max-w-3xl text-center">
              <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl border border-white/15 bg-white/10 shadow-lg shadow-black/10">
                <FileText className="h-7 w-7 text-[#D5B16D]" />
              </div>
              <p className="mb-3 text-xs font-semibold uppercase tracking-[0.24em] text-[#D5B16D]">The open knowledge collection</p>
              <h1 className="font-serif text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">Research Papers</h1>
              <p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-white/70 sm:text-lg">
                Explore ideas that move the world forward. Discover influential studies, follow the evidence and read research from its original source.
              </p>
              <div className="mt-7 flex flex-wrap items-center justify-center gap-2 text-xs text-white/65">
                <span className="rounded-full border border-white/15 bg-white/5 px-3 py-1.5">Open-access papers</span>
                <span className="rounded-full border border-white/15 bg-white/5 px-3 py-1.5">Global research</span>
                <span className="rounded-full border border-white/15 bg-white/5 px-3 py-1.5">Citation-ranked discovery</span>
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
          <div className="mb-8 rounded-2xl border border-[#E8E2D9] bg-white p-4 shadow-sm dark:border-[#26302A] dark:bg-[#141815] sm:p-6">
            <div className="flex flex-col gap-3 md:flex-row">
              <div className="relative min-w-0 flex-1">
                <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#7A817B]" />
                <Input
                  value={searchQuery}
                  onChange={(event) => { setSearchQuery(event.target.value); setPage(1); setActiveTopic(''); }}
                  placeholder="Search papers, topics, authors or keywords..."
                  aria-label="Search research papers"
                  className="h-12 border-[#E8E2D9] bg-[#FAF7F2] pl-10 text-sm dark:border-[#26302A] dark:bg-[#0B0D0C]"
                />
              </div>
              <label className="flex h-12 items-center gap-2 rounded-lg border border-[#E8E2D9] bg-[#FAF7F2] px-3 text-sm dark:border-[#26302A] dark:bg-[#0B0D0C]">
                <span className="whitespace-nowrap text-xs text-[#737B74]">Published</span>
                <select value={year} onChange={(event) => { setYear(event.target.value); setPage(1); }} aria-label="Filter by publication year" className="min-w-0 bg-transparent font-medium outline-none">
                  <option value="all">Any year</option>
                  {Array.from({ length: 30 }, (_, index) => String(new Date().getFullYear() - index)).map((value) => <option key={value} value={value}>{value}</option>)}
                </select>
              </label>
              <Button type="button" variant="outline" onClick={resetFilters} className="h-12 gap-2 border-[#E8E2D9] dark:border-[#344039]">
                <RefreshCw className="h-4 w-4" /> Reset
              </Button>
            </div>
            <div className="mt-5">
              <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#899189]">Explore by subject</p>
              <div className="flex gap-2 overflow-x-auto pb-1">
                {TOPICS.map((topic) => (
                  <button
                    key={topic.label}
                    type="button"
                    onClick={() => chooseTopic(topic)}
                    aria-pressed={activeTopic === topic.label || (!activeTopic && topic.label === 'All research' && !searchQuery)}
                    className={`shrink-0 rounded-full border px-3.5 py-2 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1C442D] ${activeTopic === topic.label ? 'border-[#1C442D] bg-[#1C442D] text-white dark:border-[#D5B16D] dark:bg-[#D5B16D] dark:text-[#101711]' : 'border-[#E8E2D9] bg-white text-[#59635B] hover:border-[#AAB8AC] hover:bg-[#F6F8F5] dark:border-[#344039] dark:bg-[#141815] dark:text-[#C0C8C0] dark:hover:bg-[#1D2821]'}`}
                  >
                    {topic.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

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

          {loading ? (
            <div className="grid gap-4" aria-live="polite" aria-busy="true">
              {Array.from({ length: 5 }, (_, index) => (
                <div key={index} className="animate-pulse rounded-2xl border border-[#E8E2D9] bg-white p-6 dark:border-[#26302A] dark:bg-[#141815]">
                  <div className="h-3 w-28 rounded bg-[#EAE7E0] dark:bg-[#29332D]" />
                  <div className="mt-4 h-5 w-3/4 rounded bg-[#EAE7E0] dark:bg-[#29332D]" />
                  <div className="mt-3 h-3 w-1/3 rounded bg-[#EAE7E0] dark:bg-[#29332D]" />
                  <div className="mt-5 h-3 w-full rounded bg-[#EAE7E0] dark:bg-[#29332D]" />
                  <div className="mt-2 h-3 w-5/6 rounded bg-[#EAE7E0] dark:bg-[#29332D]" />
                </div>
              ))}
            </div>
          ) : error ? (
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
                  const authors = getAuthors(paper.authorships);
                  const title = paper.display_name || paper.title || 'Untitled research paper';
                  return (
                    <article key={paper.id} className="group rounded-2xl border border-[#E8E2D9] bg-white p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:border-[#C9D5CA] hover:shadow-md dark:border-[#26302A] dark:bg-[#141815] dark:hover:border-[#46594A] sm:p-6">
                      <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#F1F4EF] text-[#31583D] dark:bg-[#1D2A20] dark:text-[#D5B16D]">
                          <FileText className="h-5 w-5" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="mb-3 flex flex-wrap items-center gap-2">
                            {paper.open_access?.is_oa && (
                              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300">
                                <CheckCircle2 className="h-3 w-3" /> Open access
                              </span>
                            )}
                            {paper.publication_year && <span className="text-xs text-[#737B74] dark:text-[#A5ADA6]">{paper.publication_year}</span>}
                            {source && <span className="max-w-full truncate text-xs text-[#737B74] dark:text-[#A5ADA6]">· {source}</span>}
                          </div>
                          <h3 className="font-serif text-lg font-semibold leading-snug text-[#1C201D] transition-colors group-hover:text-[#1C442D] dark:text-[#F3F0E7] dark:group-hover:text-[#D5B16D] sm:text-xl">
                            {paperUrl ? <a href={paperUrl} target="_blank" rel="noopener noreferrer" className="focus-visible:rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1C442D]">{title}</a> : title}
                          </h3>
                          <p className="mt-2 text-sm text-[#59635B] dark:text-[#A5ADA6]">{authors || 'Author details unavailable'}</p>
                          {abstract && <p className="mt-3 line-clamp-3 max-w-5xl text-sm leading-6 text-[#737B74] dark:text-[#A5ADA6]">{abstract}</p>}
                          <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-[#737B74] dark:text-[#A5ADA6]">
                            <span className="inline-flex items-center gap-1.5"><Quote className="h-3.5 w-3.5" /> {Number(paper.cited_by_count || 0).toLocaleString('en-US')} citations</span>
                            {paper.type && <span className="capitalize">{paper.type.replace(/_/g, ' ')}</span>}
                            <span>Paper {((page - 1) * PAGE_SIZE) + index + 1}</span>
                          </div>
                          <div className="mt-5 flex flex-wrap gap-2">
                            {paperUrl && <a href={paperUrl} target="_blank" rel="noopener noreferrer" className="inline-flex h-9 items-center gap-2 rounded-lg bg-[#1C442D] px-3.5 text-xs font-semibold text-white transition-colors hover:bg-[#143221] dark:bg-[#D5B16D] dark:text-[#101711] dark:hover:bg-[#E3C483]"><BookOpen className="h-3.5 w-3.5" /> Read paper <ExternalLink className="h-3 w-3" /></a>}
                            {pdfUrl && <a href={pdfUrl} target="_blank" rel="noopener noreferrer" className="inline-flex h-9 items-center gap-2 rounded-lg border border-[#D9E1DA] px-3.5 text-xs font-semibold text-[#31583D] hover:bg-[#F3F6F2] dark:border-[#344039] dark:text-[#D5B16D] dark:hover:bg-[#1D2821]"><Download className="h-3.5 w-3.5" /> PDF</a>}
                          </div>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>

              <nav aria-label="Research results pagination" className="mt-8 flex flex-col items-center justify-between gap-3 rounded-2xl border border-[#E8E2D9] bg-white p-4 dark:border-[#26302A] dark:bg-[#141815] sm:flex-row">
                <p className="text-sm text-[#737B74] dark:text-[#A5ADA6]">Page {page} of {totalPages}</p>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => { setPage((value) => value - 1); window.scrollTo({ top: 0, behavior: 'smooth' }); }} className="gap-1.5"><ArrowLeft className="h-4 w-4" /> Previous</Button>
                  <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => { setPage((value) => value + 1); window.scrollTo({ top: 0, behavior: 'smooth' }); }} className="gap-1.5">Next <ArrowRight className="h-4 w-4" /></Button>
                </div>
              </nav>
            </>
          )}

          <aside className="mt-12 overflow-hidden rounded-2xl border border-[#E8E2D9] bg-[#F2EEE5] p-6 dark:border-[#26302A] dark:bg-[#141815] sm:p-8">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
              <div className="max-w-2xl">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#8A7350] dark:text-[#D5B16D]">Read beyond the abstract</p>
                <h2 className="mt-2 font-serif text-2xl font-semibold">Ideas are stronger with context</h2>
                <p className="mt-2 text-sm leading-6 text-[#667068] dark:text-[#A5ADA6]">Explore books alongside original research to connect discoveries, evidence and the bigger picture.</p>
              </div>
              <a href="/library" className="inline-flex h-10 shrink-0 items-center justify-center rounded-lg border border-[#D9E1DA] bg-white px-4 text-sm font-semibold text-[#1C442D] hover:bg-[#F3F6F2] dark:border-[#344039] dark:bg-[#1D2821] dark:text-[#D5B16D]">Explore the book library <ExternalLink className="ml-2 h-3.5 w-3.5" /></a>
            </div>
          </aside>
          <p className="mt-6 text-center text-xs text-[#899189] dark:text-[#7E897F]">Research metadata provided by OpenAlex. Full-text availability depends on the original publisher or repository.</p>
        </section>
      </main>
    </>
  );
};

export default ResearchPapers;
