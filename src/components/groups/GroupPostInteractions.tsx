import { useState } from 'react';
import { MessageCircle, Send, Heart, Lightbulb, Coffee, Brain, Sparkles } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useCreateReadingGroupPostComment, useReadingGroupPostComments, useToggleReadingGroupPostReaction, type GroupPostReaction } from '@/hooks/useReadingGroupPostInteractions';

const reactions: {id:GroupPostReaction;label:string;Icon:typeof Heart}[]=[
{id:'loved',label:'Loved',Icon:Heart},{id:'insightful',label:'Insightful',Icon:Lightbulb},
{id:'cozy',label:'Cozy',Icon:Coffee},{id:'thought_provoking',label:'Thought-provoking',Icon:Brain},{id:'unputdownable',label:'Unputdownable',Icon:Sparkles}];
export default function GroupPostInteractions({postId}:{postId:string}){
 const [open,setOpen]=useState(false);const [draft,setDraft]=useState('');
 const {data:comments=[],isLoading,error}=useReadingGroupPostComments(postId,open);
 const add=useCreateReadingGroupPostComment();const react=useToggleReadingGroupPostReaction();
 const send=()=>{if(!draft.trim())return;add.mutate({postId,body:draft},{onSuccess:()=>{setDraft('');toast.success('Reply added.');},onError:e=>toast.error(e.message)});};
 return <div className="mt-3 border-t border-border pt-3">
  <div className="flex flex-wrap gap-1">{reactions.map(({id,label,Icon})=><Button key={id} type="button" variant="outline" size="sm" className="h-8 gap-1 px-2 text-xs" aria-label={label} disabled={react.isPending} onClick={()=>react.mutate({postId,reaction:id},{onError:e=>toast.error(e.message)})}><Icon className="h-3.5 w-3.5"/>{label}</Button>)}</div>
  <Button type="button" variant="ghost" size="sm" className="mt-1" onClick={()=>setOpen(v=>!v)} aria-expanded={open}><MessageCircle className="mr-2 h-4 w-4"/>{open?'Hide replies':'Replies'}</Button>
  {open&&<div className="mt-2 space-y-2">{isLoading?<p className="text-xs text-muted-foreground">Loading replies…</p>:error?<p role="alert" className="text-xs text-destructive">Replies unavailable.</p>:comments.map(c=><div key={c.id} className="rounded-lg bg-muted/40 p-2"><p className="text-xs font-medium">{c.author_name} <span className="font-normal text-muted-foreground">· {formatDistanceToNow(new Date(c.created_at),{addSuffix:true})}</span></p><p className="mt-1 whitespace-pre-wrap text-sm">{c.body}</p></div>)}<div className="flex gap-2"><Textarea value={draft} onChange={e=>setDraft(e.target.value)} maxLength={2000} rows={2} placeholder="Write a reply…" aria-label="Write a reply"/><Button size="icon" aria-label="Send reply" disabled={!draft.trim()||add.isPending} onClick={send}><Send className="h-4 w-4"/></Button></div></div>}
 </div>;
}