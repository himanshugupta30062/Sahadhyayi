import { useEffect, useMemo, useState } from 'react';
import { Bookmark, BookOpen, MessageCircle, Search, X } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client-universal';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

type SavedDiscussion = {
  id: string; group_id: string; title: string; body: string | null;
  book_title: string; author_name: string; topic_type: string;
  chapter_number: number; spoiler_chapter: number; created_at: string;
};

export default function SavedGroupDiscussions() {
  const [items, setItems] = useState<SavedDiscussion[]>([]);
  const [loading, setLoading] = useState(true);
  const [removing, setRemoving] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [topic, setTopic] = useState('all');

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

  const topics = useMemo(() => [...new Set(items.map(item => item.topic_type).filter(Boolean))].sort(), [items]);
  const filtered = useMemo(() => {
    const needle = search.trim().toLowerCase();
    return items.filter(item => (topic === 'all' || item.topic_type === topic) &&
      (!needle || [item.title, item.body, item.book_title, item.author_name, item.topic_type]
        .some(value => value?.toLowerCase().includes(needle))));
  }, [items, search, topic]);

  const remove = async (id: string) => {
    setRemoving(id);
    const { error } = await supabase.rpc('toggle_group_reading_discussion_bookmark', { p_discussion_id: id });
    setRemoving(null);
    if (error) toast.error(error.message || 'Could not remove bookmark.');
    else { setItems(current => current.filter(item => item.id !== id)); toast.success('Bookmark removed.'); }
  };

  return <Card>
    <CardHeader>
      <CardTitle className="flex items-center gap-2"><Bookmark className="h-5 w-5"/>Saved discussions</CardTitle>
      <p className="text-sm text-muted-foreground">Keep useful conversations close and find them whenever you need.</p>
    </CardHeader>
    <CardContent className="space-y-4">
      {!loading && items.length > 0 && <div className="flex flex-col gap-2 sm:flex-row">
        <div className="relative min-w-0 flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"/>
          <Input value={search} onChange={event => setSearch(event.target.value)} placeholder="Search title, book, author or text…" className="pl-9 pr-9" aria-label="Search saved discussions"/>
          {search && <Button variant="ghost" size="icon" className="absolute right-1 top-1/2 h-8 w-8 -translate-y-1/2" onClick={() => setSearch('')} aria-label="Clear search"><X className="h-4 w-4"/></Button>}
        </div>
        <Select value={topic} onValueChange={setTopic}>
          <SelectTrigger className="w-full sm:w-[190px]" aria-label="Filter by discussion topic"><SelectValue placeholder="All topics"/></SelectTrigger>
          <SelectContent><SelectItem value="all">All topics</SelectItem>{topics.map(value=><SelectItem key={value} value={value}>{value.replace(/_/g, ' ')}</SelectItem>)}</SelectContent>
        </Select>
      </div>}
      {loading ? <div className="space-y-3" aria-label="Loading saved discussions"><div className="h-28 animate-pulse rounded-xl bg-muted"/><div className="h-28 animate-pulse rounded-xl bg-muted"/></div> :
      items.length === 0 ?
        <div className="space-y-4 py-3">
          <div className="rounded-xl border border-dashed border-border px-4 py-6 text-center">
            <Bookmark className="mx-auto mb-2 h-8 w-8 text-muted-foreground"/>
            <p className="font-medium">No saved discussions yet</p>
            <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">Save a thoughtful question, insight, or passage from any reading group and it will appear here.</p>
            <Button className="mt-3" size="sm" onClick={() => window.location.assign('/groups')}><MessageCircle className="mr-1 h-4 w-4"/>Explore reading groups</Button>
          </div>
          <article className="rounded-xl border bg-muted/20 p-4">
            <div className="mb-3 flex items-center justify-between gap-2"><Badge variant="outline">Example · Preview</Badge><Badge variant="secondary">Reflection</Badge></div>
            <h3 className="font-semibold">What makes a book stay with you?</h3>
            <p className="mt-1 text-xs text-muted-foreground">The reading circle · Example discussion</p>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">Sometimes it is a character, sometimes a single sentence—or the way a story changes how we see something ordinary. What moment from your current read has stayed with you, and why?</p>
            <p className="mt-3 text-xs text-muted-foreground">This is sample content for preview only. It is not a saved discussion.</p>
          </article>
        </div> :
      filtered.length === 0 ?
        <div className="py-8 text-center"><Search className="mx-auto mb-2 h-8 w-8 text-muted-foreground"/><p className="font-medium">No matching discussions</p><p className="text-sm text-muted-foreground">Try another search or topic.</p><Button variant="link" onClick={()=>{setSearch('');setTopic('all')}}>Clear filters</Button></div> :
      <>
        <p className="text-xs text-muted-foreground" aria-live="polite">Showing {filtered.length} of {items.length} saved {items.length===1?'discussion':'discussions'}</p>
        <div className="space-y-3">{filtered.map(item=><article key={item.id} className="rounded-xl border p-3 sm:p-4">
          <div className="flex items-start justify-between gap-3"><div className="min-w-0 flex-1"><Badge variant="secondary" className="capitalize">{item.topic_type.replace(/_/g, ' ')}</Badge><h3 className="mt-2 break-words font-semibold">{item.title}</h3><p className="mt-1 text-xs text-muted-foreground">{item.book_title} · {item.author_name} · {item.chapter_number ? 'Chapter '+item.chapter_number : 'General'}</p></div>
          <Button size="sm" variant="ghost" className="shrink-0" disabled={removing===item.id} onClick={()=>void remove(item.id)} aria-label={`Remove bookmark: ${item.title}`}><Bookmark className="mr-1 h-4 w-4"/>Remove</Button></div>
          {item.body && <p className="mt-3 line-clamp-4 whitespace-pre-wrap break-words text-sm">{item.body}</p>}
          <Button className="mt-3 w-full sm:w-auto" size="sm" variant="outline" onClick={()=>window.location.assign('/reading-groups/'+item.group_id)}><MessageCircle className="mr-1 h-4 w-4"/>Open group</Button>
        </article>)}</div>
      </>}
    </CardContent>
  </Card>;
}
