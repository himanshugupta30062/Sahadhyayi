import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, ExternalLink, GitBranch, Loader2, Quote, RefreshCw, Sparkles } from 'lucide-react';
import SEO from '@/components/SEO';
import { Button } from '@/components/ui/button';

type Work = {
  id: string; display_name?: string; title?: string; publication_year?: number | null;
  cited_by_count?: number; doi?: string | null; authorships?: Array<{ author?: { display_name?: string } }>;
  referenced_works?: string[];
};
type WorksResponse = { results?: Work[]; meta?: { count?: number } };
const OPENALEX = 'https://api.openalex.org/works';
const safeTitle = (work: Work) => work.display_name || work.title || 'Untitled research';
const externalUrl = (work: Work) => work.doi ? (work.doi.startsWith('https://') ? work.doi : `https://doi.org/${work.doi}`) : work.id;
const authorNames = (work: Work) => (work.authorships || []).slice(0,3).map(a=>a.author?.display_name).filter(Boolean).join(', ');

const ResearchCitationNetwork = () => {
  const { workId } = useParams<{ workId: string }>();
  const [root, setRoot] = useState<Work | null>(null);
  const [references, setReferences] = useState<Work[]>([]);
  const [citing, setCiting] = useState<Work[]>([]);\n  const [related, setRelated] = useState<Work[]>([]);
  const [refCount, setRefCount] = useState(0);
  const [citingCount, setCitingCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [refresh, setRefresh] = useState(0);

  useEffect(() => {
    let active = true;
    const load = async () => {
      setLoading(true); setError('');
      try {
        if (!workId || !/^W\d+$/.test(workId)) throw new Error('Invalid OpenAlex work identifier.');
        const response = await fetch(`${OPENALEX}/https://openalex.org/${workId}?select=id,display_name,title,publication_year,cited_by_count,doi,authorships,referenced_works`);
        if (!response.ok) throw new Error(response.status === 429 ? 'OpenAlex is rate-limiting requests. Please retry shortly.' : 'Unable to load this paper from OpenAlex.');
        const paper = await response.json() as Work;
        if (!active) return;
        setRoot(paper);
        setRefCount(paper.referenced_works?.length || 0);
        const refs = Array.isArray(paper.referenced_works) ? paper.referenced_works.slice(0, 12) : [];
        const [refResult, citingResult, relatedResult] = await Promise.all([
          refs.length ? fetch(`${OPENALEX}?filter=openalex_id:${refs.join('|')}&per-page=12&select=id,display_name,title,publication_year,cited_by_count,doi,authorships`) : Promise.resolve(null),
          fetch(`${OPENALEX}?filter=cites:${workId}&per-page=12&select=id,display_name,title,publication_year,cited_by_count,doi,authorships`)
        ]);
        if (refResult && !refResult.ok) throw new Error('Could not load referenced papers.');
        if (!citingResult.ok) throw new Error(citingResult.status === 429 ? 'OpenAlex citation lookup is rate-limited. Retry in a moment.' : 'Could not load papers citing this work.');
        const [refData, citingData, relatedData] = await Promise.all([
          refResult ? refResult.json() as Promise<WorksResponse> : Promise.resolve({ results: [] }),
          citingResult.json() as Promise<WorksResponse>,
        ]);
        if (active) { setReferences(refData.results || []); setCiting(citingData.results || []); setRelated((relatedData.results || []).filter((work) => work.id !== paper.id)); setCitingCount(citingData.meta?.count || paper.cited_by_count || 0); }
      } catch (e) { if (active) setError(e instanceof Error ? e.message : 'Citation network failed to load.'); }
      finally { if (active) setLoading(false); }
    };
    void load();
    return () => { active = false; };
  }, [workId, refresh]);

  const PaperCard = ({ work, relation }: { work: Work; relation: 'reference' | 'citing' }) => (
    <article className="group rounded-xl border border-border/70 bg-card p-4 transition-all hover:-translate-y-0.5 hover:border-primary/50 hover:shadow-md">
      <div className="mb-2 flex items-center justify-between gap-2"><span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{relation === 'reference' ? 'This paper references' : 'Cites this paper'}</span><span className="rounded-full bg-muted px-2 py-0.5 text-xs">{work.publication_year || '—'}</span></div>
      <h3 className="line-clamp-3 font-semibold leading-snug group-hover:text-primary">{safeTitle(work)}</h3>
      {authorNames(work) && <p className="mt-2 line-clamp-1 text-xs text-muted-foreground">{authorNames(work)}</p>}
      <p className="mt-2 text-xs text-muted-foreground"><Quote className="mr-1 inline h-3 w-3"/>{Number(work.cited_by_count || 0).toLocaleString()} citations</p>
      <div className="mt-3 flex flex-wrap gap-2">
        <Button asChild size="sm" variant="outline"><Link to={`/research-network/${work.id.split('/').pop()}`}><GitBranch className="mr-1 h-3.5 w-3.5"/>Explore</Link></Button>
        <Button asChild size="sm" variant="ghost"><a href={externalUrl(work)} target="_blank" rel="noreferrer">Open paper <ExternalLink className="ml-1 h-3.5 w-3.5"/></a></Button>
      </div>
    </article>
  );

  return <main className="min-h-screen bg-background">
    <SEO title="Research Citation Network | Sahadhyayi" description="Explore references, citing papers and scholarly connections." />
    <div className="border-b border-border bg-gradient-to-br from-primary/10 via-background to-background">
      <div className="container mx-auto max-w-6xl px-4 pb-10 pt-6">
        <Button asChild variant="ghost" className="mb-6 -ml-3"><Link to="/research-papers"><ArrowLeft className="mr-2 h-4 w-4"/>Back to Research Papers</Link></Button>
        <div className="flex items-center gap-2 text-sm font-medium text-primary"><GitBranch className="h-4 w-4"/> Research graph <span className="text-muted-foreground">/ Citation explorer</span></div>
        {loading && !root ? <div className="mt-5 flex items-center gap-2"><Loader2 className="h-5 w-5 animate-spin"/>Loading paper…</div> : <h1 className="mt-4 max-w-4xl text-3xl font-bold leading-tight tracking-tight md:text-4xl">{root ? safeTitle(root) : 'Citation network'}</h1>}
        {root && <><p className="mt-3 max-w-3xl text-muted-foreground">{authorNames(root) || 'Authors unavailable'}{root.publication_year ? ` · ${root.publication_year}` : ''}</p><div className="mt-5 flex flex-wrap gap-2"><span className="rounded-full border border-border bg-background/80 px-3 py-1.5 text-sm"><Quote className="mr-1.5 inline h-4 w-4"/><strong>{Number(root.cited_by_count || 0).toLocaleString()}</strong> citations</span><span className="rounded-full border border-border bg-background/80 px-3 py-1.5 text-sm"><GitBranch className="mr-1.5 inline h-4 w-4"/><strong>{refCount.toLocaleString()}</strong> references</span><span className="rounded-full border border-border bg-background/80 px-3 py-1.5 text-sm"><Sparkles className="mr-1.5 inline h-4 w-4"/><strong>{citingCount.toLocaleString()}</strong> citing works</span></div></>}
        <div className="mt-5 flex items-center gap-3">{root && <Button asChild><a href={externalUrl(root)} target="_blank" rel="noreferrer">View original paper <ExternalLink className="ml-2 h-4 w-4"/></a></Button>}<Button variant="outline" onClick={()=>setRefresh(n=>n+1)} disabled={loading}><RefreshCw className={`mr-2 h-4 w-4 ${loading?'animate-spin':''}`}/>Refresh</Button></div>
        {error && <div role="alert" className="mt-4 rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">{error}</div>}
      </div>
    </div>
    <div className="container mx-auto max-w-6xl px-4 py-8">
      {loading && root && <p className="mb-5 text-sm text-muted-foreground">Updating connected papers…</p>}
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3"><div><h2 className="text-2xl font-bold">Explore the connections</h2><p className="mt-1 text-sm text-muted-foreground">Follow references backward or discover newer research citing this work.</p></div><span className="text-xs text-muted-foreground">Showing up to 12 per direction</span></div>
      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-2xl border border-border bg-muted/20 p-4 sm:p-5"><div className="mb-4 flex items-center justify-between"><div><h2 className="text-lg font-semibold">References</h2><p className="text-sm text-muted-foreground">Earlier research this paper builds on</p></div><span className="rounded-full bg-muted px-3 py-1 text-sm font-semibold">{references.length}</span></div>{references.length ? <div className="space-y-3">{references.map(w=><PaperCard key={w.id} work={w} relation="reference"/>)}</div>:<div className="rounded-xl border border-dashed border-border bg-background p-6 text-center text-sm text-muted-foreground">{loading?'Loading references…':'No reference metadata available for this paper.'}</div>}</section>
        <section className="rounded-2xl border border-border bg-muted/20 p-4 sm:p-5"><div className="mb-4 flex items-center justify-between"><div><h2 className="text-lg font-semibold">Cited by</h2><p className="text-sm text-muted-foreground">Newer research building on this work</p></div><span className="rounded-full bg-muted px-3 py-1 text-sm font-semibold">{citing.length}</span></div>{citing.length ? <div className="space-y-3">{citing.map(w=><PaperCard key={w.id} work={w} relation="citing"/>)}</div>:<div className="rounded-xl border border-dashed border-border bg-background p-6 text-center text-sm text-muted-foreground">{loading?'Loading citing works…':'No citing works found in this result set.'}</div>}</section>
      </div>
      <section className="mt-8 rounded-2xl border border-border bg-muted/20 p-4 sm:p-5"><div className="mb-4"><h2 className="text-2xl font-bold">Related research</h2><p className="mt-1 text-sm text-muted-foreground">Discover similar works beyond direct citations, based on OpenAlex relationships.</p></div>{related.length ? <div className="grid gap-3 md:grid-cols-2">{related.map((work) => <PaperCard key={work.id} work={work} relation="reference" />)}</div> : <p className="rounded-xl border border-dashed border-border bg-background p-6 text-center text-sm text-muted-foreground">{loading ? "Finding related research…" : "No related works were returned for this paper."}</p>}</section>\n      <p className="mt-8 text-center text-xs text-muted-foreground">Citation metadata provided by OpenAlex. Counts and coverage may vary by publication.</p>
    </div>
  </main>;
};
export default ResearchCitationNetwork;
