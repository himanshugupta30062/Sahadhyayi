import { useEffect, useState } from 'react';
import { BookHeart, Save, ShieldCheck } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/authHelpers';
import { CONTENT_WARNINGS, READER_MOODS, useBookExperience, type BookExperienceInput, type ReaderMood, type ContentWarning } from '@/hooks/useBookExperience';

export default function BookExperienceTags({bookId}:{bookId:string}) {
 const {user}=useAuth(); const {data, isLoading, save}=useBookExperience(bookId); const {toast}=useToast();
 const [moods,setMoods]=useState<ReaderMood[]>([]); const [pacing,setPacing]=useState<'fast'|'medium'|'slow'|''>('');
 const [warnings,setWarnings]=useState<ContentWarning[]>([]); const [custom,setCustom]=useState('');
 useEffect(()=>{if(data){setMoods(data.moods||[]);setPacing(data.pacing||'');setWarnings(data.content_warnings||[]);setCustom(data.custom_warning||'');}},[data]);
 const toggleMood=(m:ReaderMood)=>setMoods(old=>old.includes(m)?old.filter(x=>x!==m):[...old,m]);
 const toggleWarning=(w:ContentWarning)=>setWarnings(old=>old.includes(w)?old.filter(x=>x!==w):[...old,w]);
 const submit=async()=>{const input:BookExperienceInput={moods,pacing:pacing||null,content_warnings:warnings,custom_warning:custom.trim()||null};try{await save.mutateAsync(input);toast({title:'Reading tags saved',description:'These tags are private to you.'});}catch(e){toast({title:'Could not save tags',description:e instanceof Error?e.message:'Please try again.',variant:'destructive'});}};
 if(!user) return <Card className="my-6 border-border/70"><CardContent className="flex items-center justify-between gap-3 p-5"><p className="text-sm text-muted-foreground">Sign in to privately track this book’s mood, pacing, and content warnings.</p><Button asChild size="sm"><Link to="/signin">Sign in</Link></Button></CardContent></Card>;
 return <Card className="my-6 border-border/70"><CardHeader><CardTitle className="flex items-center gap-2"><BookHeart className="h-5 w-5"/>Your reading experience</CardTitle><p className="text-sm text-muted-foreground">Capture how this book felt to you. Your selections are private.</p></CardHeader><CardContent className="space-y-5">
 <section><Label className="mb-2 block">Mood (select any)</Label><div className="flex flex-wrap gap-2">{READER_MOODS.map(m=><Badge key={m} variant={moods.includes(m)?'default':'outline'} className="cursor-pointer capitalize" role="button" tabIndex={0} onClick={()=>toggleMood(m)} onKeyDown={e=>{if(e.key==='Enter'||e.key===' ')toggleMood(m)}}>{m}</Badge>)}</div></section>
 <section><Label className="mb-2 block">Pacing</Label><Select value={pacing||'unset'} onValueChange={v=>setPacing(v==='unset'?'':v as 'fast'|'medium'|'slow')}><SelectTrigger><SelectValue placeholder="How did it read?" /></SelectTrigger><SelectContent><SelectItem value="unset">Not set</SelectItem><SelectItem value="fast">Fast-paced</SelectItem><SelectItem value="medium">Medium-paced</SelectItem><SelectItem value="slow">Slow-paced</SelectItem></SelectContent></Select></section>
 <section><Label className="mb-2 block">Content warnings you noticed</Label><div className="grid grid-cols-2 gap-3 sm:grid-cols-3">{CONTENT_WARNINGS.map(w=><label key={w} className="flex items-center gap-2 text-sm capitalize"><Checkbox checked={warnings.includes(w)} onCheckedChange={()=>toggleWarning(w)}/>{w}</label>)}</div><Textarea className="mt-3" maxLength={500} value={custom} onChange={e=>setCustom(e.target.value)} placeholder="Other warning (optional, max 500 characters)"/></section>
 <div className="flex items-center justify-between gap-3"><p className="flex items-center gap-1 text-xs text-muted-foreground"><ShieldCheck className="h-4 w-4"/>Private to your account</p><Button onClick={submit} disabled={isLoading||save.isPending}><Save className="mr-2 h-4 w-4"/>{save.isPending?'Saving…':'Save tags'}</Button></div>
 </CardContent></Card>;
}
