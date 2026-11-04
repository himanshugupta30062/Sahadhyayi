import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, BookmarkCheck, ExternalLink, FileText, Trash2 } from 'lucide-react';
import SEO from '@/components/SEO';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/authHelpers';

type SavedPaper = {
  id: string;
  openalex_id: string;
  paper: Record<string, unknown>;
  created_at: string;
};

const asText = (value: unknown, fallback = '') => typeof value === 'string' ? value : fallback;
const asNumber = (value: unknown) => typeof value === 'number' ? value : null;

export default function MySavedResearch() {
  const { user } = useAuth();
  const [papers, setPapers] = useState<SavedPaper[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [removing, setRemoving] = useState<string | null>(null);

  const load = async () => {
    if (!user) { setPapers([]); setLoading(false); return; }
    setLoading(true); setError('');
    const { data, error: queryError } = await supabase
      .from('research_paper_bookmarks')
      .select('id,openalex_id,paper,created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    if (queryError) setError(queryError.message);
    else setPapers((data ?? []) as SavedPaper[]);
    setLoading(false);
  };

  useEffect(() => { void load(); }, [user?.id]);

  const remove = async (paper: SavedPaper) => {
    if (!user) return;
    setRemoving(paper.id); setError('');
    const { error: deleteError } = await supabase
      .from('research_paper_bookmarks')
      .delete()
      .eq('id', paper.id)
      .eq('user_id', user.id);
    if (deleteError) setError(deleteError.message);
    else setPapers(current => current.filter(item => item.id !== paper.id));
    setRemoving(null);
  };

  return (
    <main className="min-h-screen bg-[#F7F8F5] px-4 py-8 text-[#1C2820] dark:bg-[#101612] dark:text-[#E9EFEA] sm:px-6">
      <SEO title="My Saved Research | Sahadhyayi" description="Your personal collection of saved research papers." />
      <div className="mx-auto max-w-5xl">
        <Link to="/research-papers" className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="h-4 w-4" /> Back to Research Papers</Link>
        <header className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700 dark:text-emerald-400">Your research library</p>
            <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">My Saved Research</h1>
            <p className="mt-2 text-muted-foreground">A personal reading list for papers you want to revisit.</p>
          </div>
          <div className="flex flex-wrap items-center gap-2"><Button asChild variant="outline"><Link to="/recommended-research">Recommended for you</Link></Button><div className="flex items-center gap-2 rounded-full border border-emerald-200 bg-white px-4 py-2 text-sm dark:border-emerald-900 dark:bg-[#172019]"><BookmarkCheck className="h-4 w-4 text-emerald-600" /> {papers.length} saved</div></div>
        </header>
        {error && <p role="alert" className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-300">{error}</p>}
        {!user ? <section className="rounded-2xl border bg-white p-8 text-center dark:bg-[#172019]"><BookmarkCheck className="mx-auto mb-3 h-8 w-8 text-emerald-600" /><h2 className="text-xl font-semibold">Sign in to see your saved papers</h2><p className="mt-2 text-muted-foreground">Save papers from Research Papers and keep them here.</p><Button asChild className="mt-5"><Link to="/signin">Sign in</Link></Button></section>
        : loading ? <div className="rounded-2xl border bg-white p-8 text-center dark:bg-[#172019]">Loading your saved research…</div>
        : papers.length === 0 ? <section className="rounded-2xl border bg-white p-10 text-center dark:bg-[#172019]"><BookmarkCheck className="mx-auto mb-3 h-9 w-9 text-emerald-600" /><h2 className="text-xl font-semibold">Your reading list is empty</h2><p className="mt-2 text-muted-foreground">Browse research and tap “Save paper” to build your collection.</p><Button asChild className="mt-5"><Link to="/research-papers">Discover research papers</Link></Button></section>
        : <div className="grid gap-4 sm:grid-cols-2">{papers.map(saved => {
          const paper = saved.paper || {};
          const title = asText(paper.display_name, asText(paper.title, 'Untitled research paper'));
          const year = asNumber(paper.publication_year);
          const doi = asText(paper.doi);
          const authors = Array.isArray(paper.authorships) ? paper.authorships.slice(0, 3).map((a: unknown) => {
            if (a && typeof a === 'object' && 'author' in a && a.author && typeof a.author === 'object' && 'display_name' in a.author) return asText(a.author.display_name);
            return '';
          }).filter(Boolean).join(', ') : '';
          const link = doi ? (doi.startsWith('http') ? doi : 'https://doi.org/' + doi) : saved.openalex_id;
          return <article key={saved.id} className="flex min-w-0 flex-col rounded-2xl border border-[#E0E7E0] bg-white p-5 shadow-sm dark:border-[#303C33] dark:bg-[#172019]">
            <div className="mb-3 flex items-center justify-between gap-2"><span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300"><FileText className="h-3.5 w-3.5" /> {year ?? 'Research paper'}</span><span className="text-xs text-muted-foreground">Saved {new Date(saved.created_at).toLocaleDateString()}</span></div>
            <h2 className="text-lg font-semibold leading-snug">{title}</h2>
            {authors && <p className="mt-2 text-sm text-muted-foreground">{authors}</p>}
            <p className="mt-3 line-clamp-3 text-sm leading-6 text-muted-foreground">{asText(paper.abstract, asText(paper.summary, ''))}</p>
            <div className="mt-auto flex flex-wrap items-center gap-2 pt-5"><Button asChild size="sm" variant="outline"><a href={link} target="_blank" rel="noreferrer">Open paper <ExternalLink className="ml-1 h-3.5 w-3.5" /></a></Button><Button size="sm" variant="ghost" disabled={removing === saved.id} onClick={() => { void remove(saved); }} className="text-muted-foreground"><Trash2 className="mr-1.5 h-3.5 w-3.5" />{removing === saved.id ? 'Removing…' : 'Remove'}</Button></div>
          </article>;
        })}</div>}
      </div>
    </main>
  );
}
