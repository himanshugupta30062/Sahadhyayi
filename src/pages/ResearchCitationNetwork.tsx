import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, ExternalLink, GitBranch, Loader2, Quote, RefreshCw } from 'lucide-react';
import SEO from '@/components/SEO';
import { Button } from '@/components/ui/button';

type Work = {
  id: string;
  display_name?: string;
  title?: string;
  publication_year?: number | null;
  cited_by_count?: number;
  doi?: string | null;
  authorships?: Array<{ author?: { display_name?: string } }>;
  referenced_works?: string[];
};
type WorksResponse = { results?: Work[] };

const OPENALEX = 'https://api.openalex.org/works';
const safeTitle = (work: Work) => work.display_name || work.title || 'Untitled research';
const externalUrl = (work: Work) => work.doi ? (work.doi.startsWith('https://') ? work.doi : `https://doi.org/${work.doi}`) : work.id;

const ResearchCitationNetwork = () => {
  const { workId } = useParams<{ workId: string }>();
  const [root, setRoot] = useState<Work | null>(null);
  const [references, setReferences] = useState<Work[]>([]);
  const [citing, setCiting] = useState<Work[]>([]);
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
        const refs = Array.isArray(paper.referenced_works) ? paper.referenced_works.slice(0, 12) : [];
        const [refResult, citingResult] = await Promise.all([
          refs.length ? fetch(`${OPENALEX}?filter=openalex_id:${refs.join('|')}&per-page=12&select=id,display_name,title,publication_year,cited_by_count,doi`) : Promise.resolve(null),
          fetch(`${OPENALEX}?filter=cites:${workId}&per-page=12&select=id,display_name,title,publication_year,cited_by_count,doi`)
        ]);
        if (refResult && !refResult.ok) throw new Error('Could not load referenced papers.');
        if (!citingResult.ok) throw new Error(citingResult.status === 429 ? 'OpenAlex citation lookup is rate-limited. Retry in a moment.' : 'Could not load papers citing this work.');
        const [refData, citingData] = await Promise.all([
          refResult ? refResult.json() as Promise<WorksResponse> : Promise.resolve({ results: [] }),
          citingResult.json() as Promise<WorksResponse>,
        ]);
        if (active) { setReferences(refData.results || []); setCiting(citingData.results || []); }
      } catch (e) { if (active) setError(e instanceof Error ? e.message : 'Citation network failed to load.'); }
      finally { if (active) setLoading(false); }
    };
    void load();
    return () => { active = false; };
  }, [workId, refresh]);

  const PaperCard = ({ work, label }: { work: Work; label: string }) => (
    <article className="rounded-xl border border-border bg-card p-4 transition hover:border-primary/50">
      <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</div>
      <h3 className="font-semibold leading-snug">{safeTitle(work)}</h3>
      <p className="mt-2 text-sm text-muted-foreground">{work.publication_year || 'Year unknown'} · {Number(work.cited_by_count || 0).toLocaleString()} citations</p>
      <div className="mt-3 flex flex-wrap gap-2">
        <Button asChild size="sm" variant="outline"><Link to={`/research-network/${work.id.split('/').pop()}`}><GitBranch className="mr-1 h-3.5 w-3.5"/>Explore network</Link></Button>
        <Button asChild size="sm" variant="ghost"><a href={externalUrl(work)} target="_blank" rel="noreferrer">Open paper <ExternalLink className="ml-1 h-3.5 w-3.5"/></a></Button>
      </div>
    </article>
  );

  return <main className="container mx-auto max-w-6xl px-4 py-8">
    <SEO title="Research Citation Network | Sahadhyayi" description="Explore the references and citing papers connected to scholarly research." />
    <Button asChild variant="ghost" className="mb-5"><Link to="/research-papers"><ArrowLeft className="mr-2 h-4 w-4"/>Research Papers</Link></Button>
    <header className="mb-8 rounded-2xl border border-border bg-card p-6">
      <div className="flex items-center gap-2 text-sm text-muted-foreground"><GitBranch className="h-4 w-4"/> Citation explorer</div>
      {loading && !root ? <div className="mt-4 flex items-center gap-2"><Loader2 className="h-5 w-5 animate-spin"/>Loading paper…</div> : <><h1 className="mt-3 text-2xl font-bold md:text-3xl">{root ? safeTitle(root) : 'Citation network'}</h1><p className="mt-2 text-muted-foreground">{root?.publication_year || 'Year unknown'} · <Quote className="inline h-4 w-4"/> {Number(root?.cited_by_count || 0).toLocaleString()} citations</p></>}
      {error && <p role="alert" className="mt-4 text-sm text-destructive">{error}</p>}
      <Button className="mt-4" variant="outline" onClick={() => setRefresh((n) => n + 1)} disabled={loading}><RefreshCw className="mr-2 h-4 w-4"/>Refresh network</Button>
    </header>
    {loading && root && <p className="mb-4 text-sm text-muted-foreground">Loading connected papers…</p>}
    <div className="grid gap-6 md:grid-cols-2">
      <section><h2 className="mb-3 text-xl font-semibold">References <span className="text-sm text-muted-foreground">({references.length})</span></h2><p className="mb-4 text-sm text-muted-foreground">Works this paper cites (up to 12).</p>{references.length ? <div className="space-y-3">{references.map(w => <PaperCard key={w.id} work={w} label="Referenced by this paper"/>)}</div> : <p className="rounded-xl border border-dashed p-5 text-sm text-muted-foreground">No reference metadata available for this paper.</p>}</section>
      <section><h2 className="mb-3 text-xl font-semibold">Cited by <span className="text-sm text-muted-foreground">({citing.length})</span></h2><p className="mb-4 text-sm text-muted-foreground">Newer works that cite this paper (up to 12).</p>{citing.length ? <div className="space-y-3">{citing.map(w => <PaperCard key={w.id} work={w} label="Cites this paper"/>)}</div> : <p className="rounded-xl border border-dashed p-5 text-sm text-muted-foreground">No citing works found in the current results.</p>}</section>
    </div>
  </main>;
};
export default ResearchCitationNetwork;
