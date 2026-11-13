import React, { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Eye, Users, Heart, MessageCircle, CalendarDays } from 'lucide-react';
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { supabase } from '@/integrations/supabase/client-universal';

type Reel = { reel_id:string; book_title:string; created_at:string; view_count:number; unique_viewers:number; reaction_count:number; comment_count:number };
type Point = { day:string; views:number };
const Stat = ({icon:Icon,label,value}:{icon:React.ElementType;label:string;value:number})=><div className="rounded-xl border bg-card p-4"><div className="flex items-center gap-2 text-xs text-muted-foreground"><Icon className="h-4 w-4"/>{label}</div><p className="mt-2 text-2xl font-semibold tabular-nums">{value.toLocaleString()}</p></div>;

export default function BookReelDetailInsights(){
 const {reelId}=useParams(); const [reel,setReel]=useState<Reel|null>(null);const [points,setPoints]=useState<Point[]>([]);const [loading,setLoading]=useState(true);const [error,setError]=useState('');
 useEffect(()=>{let alive=true;setLoading(true);setError('');(async()=>{const [all,trend]=await Promise.all([supabase.rpc('get_my_book_reel_analytics'),supabase.rpc('get_my_book_reel_daily_detail',{p_reel_id:reelId,p_days:range})]);if(!alive)return;
  if(all.error){setError('Could not load creator analytics. Check that the Book Reel analytics migrations are applied.');setLoading(false);return;}
  const found=((all.data||[]) as Reel[]).find(x=>x.reel_id===reelId);if(!found){setError('This Reel is unavailable or you do not own it.');setLoading(false);return;}setReel(found);
  if(!trend.error)setPoints((trend.data||[]).map((x:Point)=>({...x,views:Number(x.views||0)})));else setError('Daily chart is unavailable until the detail analytics migration is applied.');
  setLoading(false);})();return()=>{alive=false;};},[reelId,range]);
 const max=Math.max(1,...points.map(p=>p.views));const total=useMemo(()=>points.reduce((sum,p)=>sum+p.views,0),[points]);
 return <main className="mx-auto max-w-5xl space-y-6 px-4 py-8 sm:px-6"><Link to="/social/reels/insights" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="h-4 w-4"/>All Reel insights</Link>
 {loading?<p className="py-12 text-center text-muted-foreground">Loading Reel performance…</p>:error&&!reel?<div role="alert" className="rounded-xl border border-dashed p-6 text-sm text-muted-foreground">{error}</div>:reel&&<>
 <header><div className="flex items-center gap-2 text-primary text-sm"><CalendarDays className="h-4 w-4"/>Creator studio · Reel detail</div><h1 className="mt-2 font-serif text-3xl font-bold">{reel.book_title||'Reader moment'}</h1><p className="mt-1 text-muted-foreground">Published {new Date(reel.created_at).toLocaleDateString()} · Last {range} days chart</p></header>
 <section className="grid grid-cols-2 gap-3 md:grid-cols-4"><Stat icon={Eye} label="All-time views" value={Number(reel.view_count||0)}/><Stat icon={Users} label="Known viewers" value={Number(reel.unique_viewers||0)}/><Stat icon={Heart} label="Reactions" value={Number(reel.reaction_count||0)}/><Stat icon={MessageCircle} label="Comments" value={Number(reel.comment_count||0)}/></section>
 <section className="rounded-2xl border bg-card p-4 sm:p-6"><div className="mb-4 flex flex-wrap items-center justify-between gap-3"><div><h2 className="font-semibold">Daily views</h2><p className="text-sm text-muted-foreground">{total.toLocaleString()} views in the displayed {range}-day period</p></div><div className="flex gap-1 rounded-lg bg-muted p-1" aria-label="Chart time range">{[7,14,30,90].map(days=><button key={days} type="button" onClick={()=>setRange(days)} aria-pressed={range===days} className={`rounded-md px-3 py-1.5 text-xs font-medium ${range===days?"bg-background shadow":"text-muted-foreground hover:text-foreground"}`}>{days}d</button>)}</div></div><div className="h-64 w-full">{points.length?<ResponsiveContainer width="100%" height="100%"><AreaChart data={points}><defs><linearGradient id="reelDetailViews" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopOpacity={0.25}/><stop offset="95%" stopOpacity={0}/></linearGradient></defs><CartesianGrid strokeDasharray="3 3" vertical={false}/><XAxis dataKey="day" tickFormatter={v=>new Date(v+'T00:00:00').toLocaleDateString(undefined,{month:'short',day:'numeric'})} tick={{fontSize:11}}/><YAxis allowDecimals={false} domain={[0,max]}/><Tooltip labelFormatter={v=>new Date(String(v)+'T00:00:00').toLocaleDateString()}/><Area type="monotone" dataKey="views" stroke="hsl(var(--primary))" fill="url(#reelDetailViews)" /></AreaChart></ResponsiveContainer>:<p className="pt-20 text-center text-sm text-muted-foreground">No view events in this period yet.</p>}</div>{error&&<p className="mt-3 text-xs text-muted-foreground">{error}</p>}</section>
 <Link to={`/social/reel/${reel.reel_id}`} className="inline-flex rounded-lg border px-4 py-2 text-sm hover:bg-muted">Open public Reel</Link></>}
 </main>;
}
