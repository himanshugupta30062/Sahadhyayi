import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Sparkles, ExternalLink, Bookmark } from 'lucide-react';
import SEO from '@/components/SEO';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/authHelpers';

type Work = { id: string; display_name?: string; title?: string; publication_year?: number; doi?: string; authorships?: { author?: { display_name?: string } }[]; abstract_inverted_index?: Record<string, number[]>; primary_location?: { landing_page_url?: string }; best_oa_location?: { landing_page_url?: string } };
type BookmarkRow = { openalex_id: string; paper: Record<string, unknown> };
const titleOf = (p: Work) => p.display_name || p.title || 'Research paper';
const urlOf = (p: Work) => p.best_oa_location?.landing_page_url || p.primary_location?.landing_page_url || (p.doi ? (p.doi.startsWith('http') ? p.doi : 'https://doi.org/' + p.doi) : p.id);

export default function RecommendedResearch() {
  const { user } = useAuth();
  const [items, setItems] = useState<Work[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  useEffect(() => {
    let active = true;
    const run = async () => {
      setLoading(true); setMessage('');
      if (!user) { setItems([]); setMessage('Sign in to get recommendations based on your saved papers.'); setLoading(false); return; }
      try {
        const { data, error } = await supabase.from('research_paper_bookmarks').select('openalex_id,paper').eq('user_id', user.id).order('created_at', { ascending: false }).limit(8);
        if (error) throw error;
        const seeds = (data ?? []) as BookmarkRow[];
        if (!seeds.length) { setItems([]); setMessage('Save a few research papers first; recommendations will be based on your reading interests.'); setLoading(false); return; }
        const seedTitles = seeds.map(s => String(s.paper?.display_name || s.paper?.title || '')).filter(Boolean);
        const query = seedTitles.slice(0, 3).join(' OR ');
        const { data: response, error: searchError } = await supabase.functions.invoke('search-research-papers', { body: { query, page: 1, perPage: 12, year: 'all', category: 'all' } });
        if (searchError) throw searchError;
        const results = Array.isArray(response?.results) ? response.results as Work[] : [];
        const ids = new Set(seeds.map(s => s.openalex_id));
        if (active) {
          setItems(results.filter(p => p.id && !ids.has(p.id)).slice(0, 8));
          if (!results.length) setMessage('No related papers found yet. Try saving papers from different topics.');
        }
      } catch (e) { if (active) setMessage(e instanceof Error ? e.message : 'Recommendations could not load. Please try again.'); }
      finally { if (active) setLoading(false); }
    };
    void run();
    return () => { active = false; };
  }, [user?.id, user]);
  return <main className="min-h-screen bg-[#F7F8F5] px-4 py-8 text-[#1C2820] dark:bg-[#101612] dark:text-[#E9EFEA] sm:px-6">
    <SEO title="Recommended Research | Sahadhyayi" description="Research discovery personalized from your saved papers." />
    <div className="mx-auto max-w-5xl"><Link to="/my-saved-research" className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground"><ArrowLeft className="h-4 w-4"/> My Saved Research</Link>
      <header className="mb-8"><p className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-emerald-700 dark:text-emerald-400"><Sparkles className="h-4 w-4"/> For your interests</p><h1 className="text-3xl font-semibold sm:text-4xl">Recommended Research</h1><p className="mt-2 text-muted-foreground">Discover related papers based on the research you save.</p></header>
      {loading ? <div className="rounded-xl border bg-white p-8 text-center dark:bg-[#172019]">Finding papers for you…</div> : message && <div className="mb-5 rounded-xl border bg-white p-5 text-sm text-muted-foreground dark:bg-[#172019]">{message}</div>}
      {!loading && items.length > 0 && <div className="grid gap-4 sm:grid-cols-2">{items.map(p => <article key={p.id} className="flex flex-col rounded-2xl border bg-white p-5 dark:bg-[#172019]"><span className="mb-2 text-xs text-muted-foreground">{p.publication_year || 'Research'}</span><h2 className="font-semibold leading-snug">{titleOf(p)}</h2><p className="mt-2 line-clamp-3 text-sm text-muted-foreground">{p.authorships?.slice(0,3).map(a=>a.author?.display_name).filter(Boolean).join(', ')}</p><div className="mt-auto pt-4"><Button asChild size="sm" variant="outline"><a href={urlOf(p)} target="_blank" rel="noreferrer">Read paper <ExternalLink className="ml-1 h-3 w-3"/></a></Button></div></article>)}</div>}
      <div className="mt-8"><Button asChild variant="outline"><Link to="/research-papers"><Bookmark className="mr-2 h-4 w-4"/> Explore all research</Link></Button></div>
    </div></main>;
}
