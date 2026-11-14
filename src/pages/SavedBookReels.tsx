import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Bookmark, Play, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client-universal';
import { toast } from 'sonner';

type SavedReel = { reel_id: string; created_at: string; book_reels: { id: string; video_url: string; caption: string | null; book_title: string | null; book_author: string | null; user_id: string; created_at: string } | null };

export default function SavedBookReels() {
  const [items, setItems] = useState<SavedReel[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    let alive = true;
    void (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { if (alive) { setLoading(false); toast.error('Sign in to view saved reels.'); } return; }
      const { data, error } = await supabase.from('book_reel_saves').select('reel_id,created_at,book_reels(id,video_url,caption,book_title,book_author,user_id,created_at)').eq('user_id', user.id).order('created_at', { ascending: false });
      if (!alive) return;
      if (error) toast.error('Could not load saved reels. Apply the saved reels migration first.');
      setItems((data || []) as unknown as SavedReel[]);
      setLoading(false);
    })();
    return () => { alive = false; };
  }, []);
  return <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6">
    <Link to="/social" className="mb-5 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="h-4 w-4" /> Back to social</Link>
    <div className="mb-7 flex items-center gap-3"><div className="rounded-xl bg-amber-500/15 p-3 text-amber-600"><Bookmark className="h-6 w-6" /></div><div><h1 className="font-serif text-3xl font-bold">Saved Book Reels</h1><p className="text-sm text-muted-foreground">Your private collection of reader moments.</p></div></div>
    {loading ? <p className="py-12 text-center text-muted-foreground">Loading saved reels…</p> : !items.length ? <div className="rounded-2xl border border-dashed p-12 text-center"><Bookmark className="mx-auto mb-3 h-8 w-8 text-muted-foreground" /><h2 className="font-semibold">No saved reels yet</h2><p className="mt-1 text-sm text-muted-foreground">Bookmark a community reel to keep it here.</p><Button asChild className="mt-4"><Link to="/social">Explore reels</Link></Button></div> : <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{items.filter(x=>x.book_reels).map(({reel_id,book_reels:r})=><article key={reel_id} className="overflow-hidden rounded-2xl border bg-card"><video src={r!.video_url} controls playsInline preload="metadata" className="aspect-[9/12] w-full bg-black object-contain" /><div className="p-4"><h2 className="font-semibold">{r!.book_title || 'Reader moment'}</h2><p className="text-xs text-muted-foreground">{r!.book_author || 'Community Reel'}</p><p className="mt-2 line-clamp-3 text-sm">{r!.caption}</p></div></article>)}</div>}
  </main>;
}
