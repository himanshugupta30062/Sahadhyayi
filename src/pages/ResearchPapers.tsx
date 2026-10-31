import { useState } from 'react';
import { FileText, Search, ExternalLink, Download, RefreshCw } from 'lucide-react';
import { Link } from 'react-router-dom';
import SEO from '@/components/SEO';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import LibraryPagination from '@/components/library/LibraryPagination';
import BookFlipLoader from '@/components/ui/BookFlipLoader';
import { usePaginatedLibraryBooks } from '@/hooks/usePaginatedLibraryBooks';

const ResearchPapers = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [field, setField] = useState('all');
  const [year, setYear] = useState('all');
  const { data, isLoading, isError, error, refetch, page, pageSize, totalPages, setPage, setPageSize } =
    usePaginatedLibraryBooks({
      searchQuery,
      selectedGenre: field === 'all' ? 'All' : field,
      selectedYear: year === 'all' ? '' : year,
      contentType: 'research-papers',
    });
  const papers = data?.books ?? [];

  return (
    <>
      <SEO
        title="Research Papers & Academic Studies | Sahadhyayi"
        description="Discover research papers, academic studies, preprints and technical reports across disciplines."
        canonical="https://sahadhyayi.com/research-papers"
        keywords={['research papers', 'academic papers', 'preprints', 'technical reports', 'open access research']}
      />
      <main className="min-h-screen bg-[#FAF7F2] text-[#1C201D] dark:bg-[#0B0D0C] dark:text-[#F3F0E7]">
        <section className="relative overflow-hidden border-b border-[#29332D] bg-[#101711] text-white">
          <div className="pointer-events-none absolute -right-20 -top-32 h-96 w-96 rounded-full bg-emerald-500/10 blur-3xl" />
          <div className="relative mx-auto max-w-7xl px-4 py-16 text-center sm:px-6 lg:px-8">
            <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl border border-white/15 bg-white/10">
              <FileText className="h-7 w-7 text-[#D5B16D]" />
            </div>
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.24em] text-[#D5B16D]">Explore knowledge</p>
            <h1 className="font-serif text-4xl font-bold tracking-tight sm:text-5xl">Research Papers</h1>
            <p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-white/70">
              Explore academic papers, scientific studies, preprints and technical reports. Discover evidence and access research from its original source.
            </p>
            <div className="mt-7 flex flex-wrap justify-center gap-2 text-xs text-white/70">
              <span className="rounded-full border border-white/15 px-3 py-1.5">Academic research</span>
              <span className="rounded-full border border-white/15 px-3 py-1.5">Technical reports</span>
              <span className="rounded-full border border-white/15 px-3 py-1.5">Preprints & studies</span>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 py-9 sm:px-6 lg:px-8">
          <div className="mb-7 rounded-2xl border border-[#E8E2D9] bg-white p-4 shadow-sm dark:border-[#26302A] dark:bg-[#141815] sm:p-5">
            <div className="flex flex-col gap-3 lg:flex-row">
              <div className="relative flex-1">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#7A817B]" />
                <Input value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} placeholder="Search paper titles, researchers, topics..." className="h-11 border-[#E8E2D9] bg-[#FAF7F2] pl-10 dark:border-[#26302A] dark:bg-[#0B0D0C]" />
              </div>
              <div className="flex flex-col gap-3 sm:flex-row">
                <Select value={field} onValueChange={setField}>
                  <SelectTrigger className="h-11 w-full sm:w-52"><SelectValue placeholder="Research field" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All research fields</SelectItem>
                    <SelectItem value="Science">Science</SelectItem>
                    <SelectItem value="Technology">Technology</SelectItem>
                    <SelectItem value="Research Paper">Research papers</SelectItem>
                    <SelectItem value="Academic Paper">Academic papers</SelectItem>
                    <SelectItem value="Preprint">Preprints</SelectItem>
                    <SelectItem value="Technical Report">Technical reports</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={year} onValueChange={setYear}>
                  <SelectTrigger className="h-11 w-full sm:w-40"><SelectValue placeholder="Publication year" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All years</SelectItem>
                    {Array.from({ length: 30 }, (_, index) => String(new Date().getFullYear() - index)).map((value) => <SelectItem key={value} value={value}>{value}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="mt-3 flex items-center justify-between text-xs text-[#737B74] dark:text-[#A5ADA6]">
              <span>{data?.totalCount ?? 0} papers in this view</span>
              <button type="button" onClick={() => { setSearchQuery(''); setField('all'); setYear('all'); }} className="font-medium text-[#1C442D] hover:underline dark:text-[#D5B16D]">Clear filters</button>
            </div>
          </div>

          {isLoading ? (
            <div className="flex min-h-64 items-center justify-center"><BookFlipLoader size="md" text="Gathering research papers..." /></div>
          ) : isError ? (
            <div role="alert" className="rounded-2xl border border-red-200 bg-white p-8 text-center dark:border-red-900 dark:bg-[#141815]">
              <p className="font-semibold">Research papers could not be loaded</p>
              <p className="mt-2 text-sm text-muted-foreground">{error instanceof Error ? error.message : 'Please try again.'}</p>
              <Button onClick={() => refetch()} className="mt-4 gap-2"><RefreshCw className="h-4 w-4" /> Try again</Button>
            </div>
          ) : papers.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-[#D8D2C8] px-6 py-16 text-center dark:border-[#344039]">
              <FileText className="mx-auto h-10 w-10 text-[#9AA19A]" />
              <h2 className="mt-4 font-serif text-2xl font-semibold">No papers found</h2>
              <p className="mt-2 text-sm text-muted-foreground">Try a different title, researcher, topic, or year.</p>
            </div>
          ) : (
            <>
              <div className="mb-4 flex items-center justify-between">
                <h2 className="font-serif text-2xl font-semibold">Browse research</h2>
                <span className="text-sm text-muted-foreground">Page {page} of {Math.max(totalPages, 1)}</span>
              </div>
              <div className="grid gap-4">
                {papers.map((paper) => {
                  const resourceCandidate = paper.pdf_url || (paper as any).external_url || '';
                  const resource = /^https?:\\/\\//i.test(resourceCandidate) ? resourceCandidate : '';
                  const published = paper.publication_year || (paper.created_at ? new Date(paper.created_at).getFullYear() : null);
                  return (
                    <Card key={paper.id} className="border-[#E8E2D9] bg-white transition-shadow hover:shadow-md dark:border-[#26302A] dark:bg-[#141815]">
                      <CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-start sm:justify-between sm:p-6">
                        <div className="min-w-0 flex-1">
                          <div className="mb-3 flex flex-wrap items-center gap-2">
                            <Badge variant="outline" className="border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-300">{paper.genre || 'Research paper'}</Badge>
                            {published && <span className="text-xs text-muted-foreground">{published}</span>}
                            {paper.language && <span className="text-xs text-muted-foreground">{paper.language}</span>}
                          </div>
                          <Link to={`/book/${paper.id}`} className="font-serif text-lg font-semibold leading-snug text-[#1C201D] hover:text-[#1C442D] dark:text-[#F3F0E7] dark:hover:text-[#D5B16D]">{paper.title}</Link>
                          <p className="mt-2 text-sm font-medium text-[#59635B] dark:text-[#A5ADA6]">{paper.author || 'Researcher not specified'}</p>
                          {paper.description && <p className="mt-3 line-clamp-3 max-w-4xl text-sm leading-6 text-[#737B74] dark:text-[#A5ADA6]">{paper.description}</p>}
                          {paper.pages && <p className="mt-3 text-xs text-muted-foreground">{paper.pages} pages</p>}
                        </div>
                        <div className="flex shrink-0 flex-wrap gap-2 sm:flex-col">
                          <Link to={`/book/${paper.id}`} className="inline-flex h-9 items-center justify-center gap-2 rounded-lg border border-[#D9E1DA] px-3 text-sm font-medium hover:bg-[#F3F6F2] dark:border-[#344039] dark:hover:bg-[#1D2821]">View details <ExternalLink className="h-3.5 w-3.5" /></Link>
                          {resource && <a href={resource} target="_blank" rel="noopener noreferrer" className="inline-flex h-9 items-center justify-center gap-2 rounded-lg bg-[#1C442D] px-3 text-sm font-medium text-white hover:bg-[#143221] dark:bg-[#D5B16D] dark:text-[#0B0D0C]"><Download className="h-3.5 w-3.5" /> Open paper</a>}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
              <div className="mt-7">
                <LibraryPagination currentPage={page} totalPages={totalPages} onPageChange={setPage} pageSize={pageSize} onPageSizeChange={setPageSize} totalItems={data?.totalCount ?? 0} itemLabel="papers" />
              </div>
            </>
          )}
          <div className="mt-12 rounded-2xl border border-[#E8E2D9] bg-[#F2EEE5] p-6 dark:border-[#26302A] dark:bg-[#141815]">
            <h2 className="font-serif text-xl font-semibold">Research belongs alongside reading</h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-[#667068] dark:text-[#A5ADA6]">Explore books for deeper context, or browse research to discover the studies, reports and evidence behind new ideas.</p>
            <Link to="/library" className="mt-4 inline-flex text-sm font-semibold text-[#1C442D] hover:underline dark:text-[#D5B16D]">Explore the book library →</Link>
          </div>
        </section>
      </main>
    </>
  );
};

export default ResearchPapers;
