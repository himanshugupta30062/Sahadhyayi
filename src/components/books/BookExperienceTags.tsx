import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/authHelpers';
import { BOOK_CONTENT_WARNINGS, BOOK_MOODS, BookExperience, useBookExperience } from '@/hooks/useBookExperience';

const empty: BookExperience = { moods: [], pacing: null, content_warnings: [], custom_warning: null };
const labelize = (s: string) => s.replace(/\b\w/g, c => c.toUpperCase());

export default function BookExperienceTags({ bookId }: { bookId: string }) {
  const { user } = useAuth();
  const { toast } = useToast();
  const { data, isLoading, save } = useBookExperience(bookId);
  const [draft, setDraft] = useState<BookExperience>(empty);
  useEffect(() => { if (data) setDraft(data); }, [data]);
  if (!user) return <Card className="my-6"><CardContent className="p-5 flex flex-wrap items-center justify-between gap-3"><div><p className="font-semibold">Track your reading experience</p><p className="text-sm text-muted-foreground">Save moods, pacing and content warnings privately.</p></div><Button asChild><Link to="/signin">Sign in</Link></Button></CardContent></Card>;
  const toggle = <T extends string>(values: T[], value: T, selected: boolean) => selected ? values.filter(v => v !== value) : [...values, value];
  return <Card className="my-6"><CardHeader><CardTitle className="text-lg">Your reading experience</CardTitle><p className="text-sm text-muted-foreground">Private to you · Help remember how this book felt</p></CardHeader><CardContent className="space-y-5">
    <section><p className="mb-2 text-sm font-medium">What mood did it leave you in?</p><div className="flex flex-wrap gap-2">{BOOK_MOODS.map(m => <Button key={m} size="sm" variant={draft.moods.includes(m) ? 'default' : 'outline'} onClick={() => setDraft(d => ({...d,moods:toggle(d.moods,m,d.moods.includes(m))}))}>{labelize(m)}</Button>)}</div></section>
    <section><label className="mb-2 block text-sm font-medium" htmlFor="book-pacing">Pacing</label><select id="book-pacing" className="w-full rounded-md border bg-background p-2 text-sm" value={draft.pacing ?? ''} onChange={e => setDraft(d=>({...d,pacing:(e.target.value||null) as BookExperience['pacing']}))}><option value="">Not sure / skip</option><option value="fast">Fast-paced</option><option value="medium">Balanced</option><option value="slow">Slow &amp; thoughtful</option></select></section>
    <section><p className="mb-2 text-sm font-medium">Content warnings (optional)</p><div className="grid grid-cols-2 gap-2 sm:grid-cols-3">{BOOK_CONTENT_WARNINGS.map(w=><label key={w} className="flex items-center gap-2 text-sm"><input type="checkbox" checked={draft.content_warnings.includes(w)} onChange={e=>setDraft(d=>({...d,content_warnings:toggle(d.content_warnings,w,e.target.checked)}))}/>{labelize(w)}</label>)}</div><textarea className="mt-3 w-full rounded-md border bg-background p-2 text-sm" rows={2} maxLength={500} placeholder="Add a personal note or warning (optional)" value={draft.custom_warning ?? ''} onChange={e=>setDraft(d=>({...d,custom_warning:e.target.value||null}))}/><p className="text-right text-xs text-muted-foreground">{draft.custom_warning?.length ?? 0}/500</p></section>
    <div className="flex items-center justify-between gap-3"><span className="text-xs text-muted-foreground">{isLoading ? 'Loading saved choices…' : 'Only you can see these selections.'}</span><Button disabled={save.isPending||isLoading} onClick={()=>save.mutate(draft,{onSuccess:()=>toast({title:'Reading experience saved'}),onError:()=>toast({title:'Could not save',description:'Please try again.',variant:'destructive'})})}>{save.isPending?'Saving…':'Save'}</Button></div>
  </CardContent></Card>;
}
