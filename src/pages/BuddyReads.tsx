import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { BookOpen, CalendarDays, Plus, Users, ArrowRight, Link2, Check, MessageCircle, Eye, EyeOff } from "lucide-react";
import { useAuth } from "@/contexts/authHelpers";
import { supabase } from "@/integrations/supabase/client";
import SEO from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";

type BuddyRead = { id: string; title: string; book_title: string; book_author?: string | null; description?: string | null; target_date?: string | null; status: string; created_at: string };

const BuddyReads = () => {
  const { user } = useAuth();
  const [reads, setReads] = useState<BuddyRead[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [title, setTitle] = useState("");
  const [bookTitle, setBookTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [description, setDescription] = useState("");
  const [targetDate, setTargetDate] = useState("");
  const [inviteBusy, setInviteBusy] = useState<string | null>(null);
  const [inviteLinks, setInviteLinks] = useState<Record<string, string>>({});
  const [progress, setProgress] = useState<Record<string, number>>({});
  const [progressSaving, setProgressSaving] = useState<string | null>(null);
  const [threads, setThreads] = useState<Record<string, {id:string;author_id:string;body:string;spoiler_page:number|null;created_at:string}[]>>({});
  const [threadDraft, setThreadDraft] = useState<Record<string,string>>({});
  const [spoilerPage, setSpoilerPage] = useState<Record<string,string>>({});
  const [threadBusy, setThreadBusy] = useState<string|null>(null);
  const [participants, setParticipants] = useState<Record<string, {user_id:string;role:string;progress_percent:number}[]>>({});
  const [milestones, setMilestones] = useState<Record<string, {id:string;title:string;target_page:number|null;target_date:string|null}[]>>({});
  const [milestoneDraft, setMilestoneDraft] = useState<Record<string,string>>({});
  const [milestoneDone, setMilestoneDone] = useState<Record<string, boolean>>({});
  const [revealedSpoilers, setRevealedSpoilers] = useState<Record<string, boolean>>({});

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const client = supabase as any;
    const { data, error } = await client.from("buddy_reads").select("id,title,book_title,book_author,description,target_date,status,created_at").order("created_at", { ascending: false });
    if (error) toast({ title: "Couldn't load Buddy Reads", description: error.message, variant: "destructive" });
    else { const plans=(data||[]) as BuddyRead[]; setReads(plans); if(plans.length){ const ids=plans.map(p=>p.id); const [{data:people},{data:steps},{data:posts},{data:done}]=await Promise.all([client.from("buddy_read_members").select("buddy_read_id,user_id,role,progress_percent").in("buddy_read_id",ids),client.from("buddy_read_milestones").select("id,buddy_read_id,title,target_page,target_date").in("buddy_read_id",ids).order("position"),client.from("buddy_read_discussions").select("id,buddy_read_id,author_id,body,spoiler_page,created_at").in("buddy_read_id",ids).order("created_at",{ascending:true}),client.from("buddy_read_milestone_completions").select("milestone_id,user_id")]); const grouped:Record<string,any[]>={}; (people||[]).forEach((m:any)=>(grouped[m.buddy_read_id] ||= []).push(m)); setParticipants(grouped); setProgress(Object.fromEntries((people||[]).filter((m:any)=>m.user_id===user.id).map((m:any)=>[m.buddy_read_id,Number(m.progress_percent)]))); const mg:Record<string,any[]>={}; (steps||[]).forEach((m:any)=>(mg[m.buddy_read_id] ||= []).push(m)); setMilestones(mg); const tg:Record<string,any[]>={}; (posts||[]).forEach((p:any)=>(tg[p.buddy_read_id] ||= []).push(p)); setThreads(tg); setMilestoneDone(Object.fromEntries((done||[]).filter((d:any)=>d.user_id===user.id).map((d:any)=>[d.milestone_id,true]))); }}
    setLoading(false);
  }, [user]);

  useEffect(() => {
    void load();
    const token = new URLSearchParams(window.location.search).get("invite");
    if (token && user) {
      (supabase as any).rpc("accept_buddy_read_invite", { invite_token: token }).then(({ data, error }: { data: string | null; error: { message: string } | null }) => {
        if (error) toast({ title: "Join failed", description: error.message, variant: "destructive" });
        else { toast({ title: "You joined the Buddy Read!", description: "Your shared reading journey is ready." }); window.history.replaceState({}, "", "/buddy-reads"); void load(); }
      });
    }
  }, [load, user]);

  const saveProgress = async (readId: string, value: number) => {
    if (!user) return;
    setProgressSaving(readId);
    const client = supabase as any;
    const { error } = await client.from("buddy_read_members").update({ progress_percent: value }).eq("buddy_read_id", readId).eq("user_id", user.id);
    setProgressSaving(null);
    if (error) toast({ title: "Progress not saved", description: error.message, variant: "destructive" });
    else toast({ title: "Progress updated" });
  };

  const addMilestone = async (readId: string) => {
    const name = (milestoneDraft[readId] || "").trim();
    if (!name) return;
    const { error } = await (supabase as any).from("buddy_read_milestones").insert({ buddy_read_id: readId, title: name, position: (milestones[readId] || []).length });
    if (error) toast({ title: "Milestone failed", description: error.message, variant: "destructive" });
    else {
      setMilestoneDraft((p) => ({ ...p, [readId]: "" }));
      await load();
      toast({ title: "Milestone added" });
    }
  };

  const toggleMilestone = async (milestoneId: string) => {
    if (!user) return; const done=!!milestoneDone[milestoneId]; const client=supabase as any;
    const result=done ? await client.from("buddy_read_milestone_completions").delete().eq("milestone_id",milestoneId).eq("user_id",user.id) : await client.from("buddy_read_milestone_completions").insert({milestone_id:milestoneId,user_id:user.id});
    if(result.error) toast({title:"Checkpoint update failed",description:result.error.message,variant:"destructive"}); else setMilestoneDone(p=>({...p,[milestoneId]:!done}));
  };

  const postDiscussion = async (readId: string) => {
    const body = (threadDraft[readId] || "").trim();
    if (!user || !body) return;
    setThreadBusy(readId);
    const { error } = await (supabase as any).from("buddy_read_discussions").insert({ buddy_read_id: readId, author_id: user.id, body, spoiler_page: spoilerPage[readId] ? Number(spoilerPage[readId]) : null });
    setThreadBusy(null);
    if (error) {
      toast({ title: "Message not posted", description: error.message, variant: "destructive" });
      return;
    }
    setThreadDraft((p) => ({ ...p, [readId]: "" }));
    setSpoilerPage((p) => ({ ...p, [readId]: "" }));
    await load();
  };
  const createInvite = async (readId: string) => {
    if (!user) return;
    setInviteBusy(readId);
    const client = supabase as any;
    const { data, error } = await client.from("buddy_read_invites").insert({ buddy_read_id: readId, created_by: user.id }).select("token").single();
    setInviteBusy(null);
    if (error || !data?.token) { toast({ title: "Invite link couldn't be created", description: error?.message || "Please try again.", variant: "destructive" }); return; }
    const url = `${window.location.origin}/buddy-reads?invite=${data.token}`;
    setInviteLinks(prev => ({ ...prev, [readId]: url }));
    try { await navigator.clipboard.writeText(url); toast({ title: "Invite link copied", description: "Share it with a friend. They must sign in to join." }); }
    catch { toast({ title: "Invite link ready", description: "Copy the link shown on this card." }); }
  };

  const create = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!user || !title.trim() || !bookTitle.trim()) return;
    setCreating(true);
    const client = supabase as any;
    const { error } = await client.from("buddy_reads").insert({
      title: title.trim(), book_title: bookTitle.trim(), book_author: author.trim() || null,
      description: description.trim() || null, target_date: targetDate || null, created_by: user.id,
    });
    setCreating(false);
    if (error) { toast({ title: "Buddy Read couldn't be created", description: error.message, variant: "destructive" }); return; }
    toast({ title: "Buddy Read created", description: "You're enrolled as the host. Invite friends from the share link soon." });
    setTitle(""); setBookTitle(""); setAuthor(""); setDescription(""); setTargetDate("");
    await load();
  };

  return <main className="min-h-screen bg-background">
    <SEO title="Buddy Reads | Sahadhyayi" description="Read books together, set a shared pace, and stay accountable with friends." />
    <section className="border-b bg-gradient-to-br from-amber-50 via-background to-emerald-50 dark:from-amber-950/20 dark:to-emerald-950/20">
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <p className="text-sm font-semibold uppercase tracking-widest text-amber-700 dark:text-amber-400">Read together</p>
        <h1 className="mt-2 text-4xl font-serif font-bold">Buddy Reads</h1>
        <p className="mt-3 max-w-2xl text-muted-foreground">Turn a book into a shared journey. Start a reading plan, set a finish date, and invite fellow readers.</p>
        <div className="mt-6 flex flex-wrap gap-3"><Button asChild><a href="#start-buddy-read"><Plus className="mr-2 h-4 w-4"/>Start a Buddy Read</a></Button><Button variant="outline" asChild><Link to="/groups"><Users className="mr-2 h-4 w-4"/>Find reading groups</Link></Button></div>
      </div>
    </section>
    <div className="mx-auto grid max-w-6xl gap-8 px-4 py-8 sm:px-6 lg:grid-cols-[minmax(0,1fr)_340px]">
      <section>
        <div className="mb-4 flex items-center justify-between"><h2 className="text-xl font-semibold">Your reading journeys</h2><span className="text-sm text-muted-foreground">{reads.length} plans</span></div>
        {loading ? <div className="grid gap-3 sm:grid-cols-2"><div className="h-36 animate-pulse rounded-xl bg-muted"/><div className="h-36 animate-pulse rounded-xl bg-muted"/></div> : reads.length === 0 ? <Card><CardContent className="py-12 text-center"><BookOpen className="mx-auto mb-3 h-10 w-10 text-muted-foreground"/><h3 className="font-semibold">Your first Buddy Read starts here</h3><p className="mt-1 text-sm text-muted-foreground">Choose a book and invite someone to read alongside you.</p></CardContent></Card> :
        <div className="grid gap-4 sm:grid-cols-2">{reads.map(read => <Card key={read.id} className="overflow-hidden"><CardHeader className="pb-2"><div className="flex items-start justify-between gap-2"><CardTitle className="text-base">{read.title}</CardTitle><span className="rounded-full bg-emerald-100 px-2 py-1 text-xs text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200">{read.status}</span></div></CardHeader><CardContent><p className="font-serif text-lg">{read.book_title}</p>{read.book_author && <p className="text-sm text-muted-foreground">by {read.book_author}</p>}{read.description && <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{read.description}</p>}{read.target_date && <p className="mt-3 flex items-center gap-2 text-xs text-muted-foreground"><CalendarDays className="h-3.5 w-3.5"/>Target finish {new Date(read.target_date).toLocaleDateString()}</p>}<div className="mt-4 rounded-lg bg-muted/60 p-3"><div className="mb-2 flex items-center justify-between text-sm"><span className="font-medium">Your progress</span><span>{progress[read.id] ?? 0}%</span></div><input aria-label="Reading progress percentage" type="range" min="0" max="100" step="5" value={progress[read.id] ?? 0} onChange={e=>setProgress(prev=>({...prev,[read.id]:Number(e.target.value)}))} className="w-full accent-primary"/><Button size="sm" className="mt-2" variant="secondary" disabled={progressSaving===read.id} onClick={()=>void saveProgress(read.id,progress[read.id]??0)}>{progressSaving===read.id?"Saving…":"Save progress"}</Button></div><div className="mt-4 rounded-lg bg-muted/60 p-3"><p className="text-sm font-semibold">Group progress · {(participants[read.id]||[]).length} readers</p>{(participants[read.id]||[]).map(m=><div key={m.user_id} className="mt-1 flex justify-between text-xs"><span>{m.user_id===user?.id?"You":m.role==="host"?"Host":"Reader"}</span><span>{Number(m.progress_percent)}%</span></div>)}</div><div className="mt-4 border-t pt-3"><p className="font-semibold text-sm">Milestones</p>{(milestones[read.id]||[]).map(m=><div key={m.id} className="mt-2 flex items-center gap-2 text-sm"><input type="checkbox" aria-label={`Complete ${m.title}`} checked={!!milestoneDone[m.id]} onChange={()=>void toggleMilestone(m.id)} className="h-4 w-4"/><span className={milestoneDone[m.id]?"line-through text-muted-foreground":""}>{m.title}{m.target_page!==null&&` · page ${m.target_page}`}</span></div>)}{(participants[read.id]||[]).some(m=>m.user_id===user?.id&&m.role==="host")&&<div className="mt-2 flex gap-2"><Input value={milestoneDraft[read.id]||""} onChange={e=>setMilestoneDraft(p=>({...p,[read.id]:e.target.value}))} placeholder="Add checkpoint"/><Button size="sm" onClick={()=>void addMilestone(read.id)}><Plus className="h-4 w-4"/></Button></div>}</div><p className="mt-3 text-xs text-muted-foreground">Created {new Date(read.created_at).toLocaleDateString()}</p><div className="mt-4 rounded-lg border p-3"><h3 className="flex items-center gap-2 text-sm font-semibold"><MessageCircle className="h-4 w-4"/>Buddy discussion</h3><div className="mt-2 space-y-2">{(threads[read.id]||[]).map(post=><div key={post.id} className="rounded-md bg-muted/50 p-2 text-sm"><p className="mb-1 text-xs text-muted-foreground">{post.author_id===user?.id?"You":"Reader"} · {new Date(post.created_at).toLocaleString()}{post.spoiler_page!==null&&<span className="ml-2 rounded bg-amber-100 px-1 text-amber-800 dark:bg-amber-900 dark:text-amber-100">Spoilers through p. {post.spoiler_page}</span>}</p>{post.spoiler_page!==null&&!revealedSpoilers[post.id]?<div className="mt-2 rounded border border-amber-300 bg-amber-50 p-2 dark:bg-amber-950/30"><p className="text-xs text-amber-800 dark:text-amber-200">Spoiler content · through page {post.spoiler_page}</p><Button size="sm" variant="outline" className="mt-1" onClick={()=>setRevealedSpoilers(p=>({...p,[post.id]:true}))}><Eye className="mr-2 h-3.5 w-3.5"/>Reveal spoiler</Button></div>:<><p className="whitespace-pre-wrap break-words">{post.body}</p>{post.spoiler_page!==null&&<Button size="sm" variant="ghost" className="mt-1 h-7 px-2" onClick={()=>setRevealedSpoilers(p=>({...p,[post.id]:false}))}><EyeOff className="mr-1 h-3 w-3"/>Hide spoiler</Button>}</>}</div>)}</div><Textarea className="mt-2" maxLength={2000} value={threadDraft[read.id]||""} onChange={e=>setThreadDraft(p=>({...p,[read.id]:e.target.value}))} placeholder="Share a thought with your reading buddies…" rows={2}/><div className="mt-2 flex gap-2"><Input className="max-w-32" type="number" min="1" value={spoilerPage[read.id]||""} onChange={e=>setSpoilerPage(p=>({...p,[read.id]:e.target.value}))} placeholder="Spoiler page"/><Button size="sm" disabled={threadBusy===read.id||!(threadDraft[read.id]||"").trim()} onClick={()=>void postDiscussion(read.id)}>{threadBusy===read.id?"Posting…":"Post"}</Button></div><p className="mt-1 text-xs text-muted-foreground">Mark the page number if your post contains spoilers.</p></div><div className="mt-4 border-t pt-3"><Button size="sm" variant="outline" onClick={() => void createInvite(read.id)}  disabled={inviteBusy===read.id}><Link2 className="mr-2 h-4 w-4"/>{inviteBusy===read.id?"Creating link…":"Invite a buddy"}</Button>{inviteLinks[read.id] && <div className="mt-2 flex items-center gap-2 rounded bg-muted p-2 text-xs"><span className="min-w-0 flex-1 break-all">{inviteLinks[read.id]}</span><Button size="icon" variant="ghost" onClick={()=>navigator.clipboard.writeText(inviteLinks[read.id])} aria-label="Copy invite link"><Check className="h-4 w-4"/></Button></div>}</div></CardContent></Card>)}</div>}
      </section>
      <Card id="start-buddy-read" className="h-fit"><CardHeader><CardTitle className="flex items-center gap-2"><Plus className="h-4 w-4"/>Start a Buddy Read</CardTitle></CardHeader><CardContent><form onSubmit={create} className="space-y-3"><div className="space-y-1"><Label htmlFor="br-name">Reading plan name *</Label><Input id="br-name" required maxLength={80} value={title} onChange={e=>setTitle(e.target.value)} placeholder="e.g. November together"/></div><div className="space-y-1"><Label htmlFor="br-book">Book title *</Label><Input id="br-book" required maxLength={200} value={bookTitle} onChange={e=>setBookTitle(e.target.value)} placeholder="What are you reading?"/></div><div className="space-y-1"><Label htmlFor="br-author">Author</Label><Input id="br-author" maxLength={120} value={author} onChange={e=>setAuthor(e.target.value)} placeholder="Author name"/></div><div className="space-y-1"><Label htmlFor="br-date">Target finish date</Label><Input id="br-date" type="date" min={new Date().toISOString().slice(0,10)} value={targetDate} onChange={e=>setTargetDate(e.target.value)}/></div><div className="space-y-1"><Label htmlFor="br-desc">Reading intention</Label><Textarea id="br-desc" maxLength={500} value={description} onChange={e=>setDescription(e.target.value)} placeholder="What would you like to explore together?" rows={3}/></div><Button className="w-full" type="submit" disabled={creating}>{creating?"Creating…":"Create Buddy Read"}<ArrowRight className="ml-2 h-4 w-4"/></Button><p className="text-xs text-muted-foreground">You'll be enrolled as host automatically. Membership is private by default.</p></form></CardContent></Card>
    </div>
  </main>;
};

export default BuddyReads;
