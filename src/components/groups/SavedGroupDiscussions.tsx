import { useEffect, useState } from 'react';
import { Bookmark, BookOpen, MessageCircle } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client-universal';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

type SavedDiscussion = {
  id: string; group_id: string; title: string; body: string | null;
  book_title: string; author_name: string; topic_type: string;
  chapter_number: number; spoiler_chapter: number; created_at: string;
};

export default function SavedGroupDiscussions() {
  const [items, setItems] = useState<SavedDiscussion[]>([]);
  const [loading, setLoading] = useState(true);
  const [removing, setRemoving] = useState<string | null>(null);
  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase.rpc('list_my_group_discussion_bookmarks');
    if (error) { toast.error('Saved discussions could not be loaded.'); setLoading(false); return; }
    const ids = (data || []).map((x: { discussion_id: string }) => x.discussion_id);
    if (!ids.length) { setItems([]); setLoading(false); return; }
    const { data: discussions, error: discussionError } = await supabase.rpc('get_saved_group_reading_discussions', { p_discussion_ids: ids });
    if (discussionError) { toast.error('Saved discussion details could not be loaded.'); setLoading(false); return; }
    setItems((discussions || []) as SavedDiscussion[]);
    setLoading(false);
  };
  useEffect(() => { void load(); }, []);
  const remove = async (id: string) => {
    setRemoving(id);
    const { error } = await supabase.rpc('toggle_group_reading_discussion_bookmark', { p_discussion_id: id });
    setRemoving(null);
    if (error) toast.error(error.message || 'Could not remove bookmark.');
    else { setItems(current => current.filter(item => item.id !== id)); toast.success('Bookmark removed.'); }
  };
  return <Card><CardHeader><CardTitle className="flex items-center gap-2"><Bookmark className="h-5 w-5"/>Saved discussions</CardTitle></CardHeader><CardContent>
    {loading ? <p className="text-sm text-muted-foreground">Loading saved discussions…</p> : items.length === 0 ?
      <div className="py-8 text-center"><Bookmark className="mx-auto mb-2 h-8 w-8 text-muted-foreground"/><p className="font-medium">No saved discussions yet</p><p className="text-sm text-muted-foreground">Bookmark a useful conversation to find it here.</p></div> :
      <div className="space-y-3">{items.map(item=><article key={item.id} className="rounded-xl border p-4">
        <div className="flex items-start justify-between gap-3"><div className="min-w-0"><Badge variant="secondary">{item.topic_type}</Badge><h3 className="mt-2 font-semibold">{item.title}</h3><p className="mt-1 text-xs text-muted-foreground">{item.book_title} · {item.author_name} · {item.chapter_number ? 'Chapter '+item.chapter_number : 'General'}</p></div>
        <Button size="sm" variant="ghost" disabled={removing===item.id} onClick={()=>void remove(item.id)}><Bookmark className="mr-1 h-4 w-4"/>Remove</Button></div>
        {item.body && <p className="mt-3 line-clamp-4 whitespace-pre-wrap text-sm">{item.body}</p>}
        <Button className="mt-3" size="sm" variant="outline" onClick={()=>window.location.assign('/reading-groups/'+item.group_id)}><MessageCircle className="mr-1 h-4 w-4"/>Open group</Button>
      </article>)}</div>}
  </CardContent></Card>;
}
