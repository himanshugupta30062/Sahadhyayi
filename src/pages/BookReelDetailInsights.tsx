import React, { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Eye, Users, Heart, MessageCircle, CalendarDays } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client-universal';

type Reel = { reel_id:string; book_title:string; created_at:string; view_count:number; unique_viewers:number; reaction_count:number; comment_count:number };
type Point = { day:string; views:number };
type Watch = { session_count:number; completed_sessions:number; total_watched_seconds:number; average_watched_seconds:number; completion_rate:number };
const duration=(seconds:number)=>{const n=Math.max(0,Math.round(seconds||0));return n<60?`${n}s`:`${Math.floor(n/60)}m ${n%60}s`;};
const Stat = ({icon:Icon,label,value}:{icon:React.ElementType;label:string;value:number|string})=><div className="rounded-xl border bg-card p-4"><div className="flex items-center gap-2 text-xs text-muted-foreground"><Icon className="h-4 w-4"/>{label}</div><p className="mt-2 text-2xl font-semibold tabular-nums">{typeof value === 'number' ? value.toLocaleString() : value}</p></div>;

const DEFAULT_CHART_DATE_OPTIONS: Intl.DateTimeFormatOptions = Object.freeze({ month: 'short', day: 'numeric' });

const chartDate = (day: string, options: Intl.DateTimeFormatOptions = DEFAULT_CHART_DATE_OPTIONS) => {
 const date = new Date(day + 'T00:00:00');
 return Number.isNaN(date.getTime()) ? day : date.toLocaleDateString(undefined, options);
};

function DailyViewsChart({points,max}:{points:Point[];max:number}) {
 const width=720, height=240, left=44, right=14, top=14, bottom=34;
 const plotWidth=width-left-right, plotHeight=height-top-bottom;
 const x=(index:number)=>left+(points.length<=1?plotWidth/2:(index/(points.length-1))*plotWidth);
 const y=(views:number)=>top+plotHeight-(Math.max(0,views)/max)*plotHeight;
 const coordinates=points.map((point,index)=>({ ...point, x:x(index), y:y(point.views) }));
 const line=coordinates.map((point,index)=>`${index===0?'M':'L'} ${point.x.toFixed(2)} ${point.y.toFixed(2)}`).join(' ');
 const area=coordinates.length ? `${line} L ${coordinates[coordinates.length-1].x} ${top+plotHeight} L ${coordinates[0].x} ${top+plotHeight} Z` : '';
 const ticks=[0,Math.ceil(max/2),max].filter((value,index,all)=>all.indexOf(value)===index);
 const labelIndexes=Array.from(new Set([0,Math.floor((points.length-1)/4),Math.floor((points.length-1)/2),Math.floor(((points.length-1)*3)/4),points.length-1])).filter(index=>index>=0);
 return <div className="h-64 w-full" role="img" aria-label={`Daily views over ${points.length} days. ${points.reduce((sum,point)=>sum+point.views,0).toLocaleString()} total views.`}>
  {points.length ? <svg viewBox={`0 0 ${width} ${height}`} className="h-full w-full overflow-visible" preserveAspectRatio="none" aria-hidden="true">
   <defs><linearGradient id="reelDetailViewsFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity=".24"/><stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0"/></linearGradient></defs>
   {ticks.map(tick=><g key={tick}><line x1={left} x2={width-right} y1={y(tick)} y2={y(tick)} stroke="currentColor" opacity=".14" strokeDasharray="3 4"/><text x={left-9} y={y(tick)+4} textAnchor="end" fill="currentColor" opacity=".65" fontSize="11">{tick.toLocaleString()}</text></g>)}
   <path d={area} fill="url(#reelDetailViewsFill)"/>
   {coordinates.length>1&&<path d={line} fill="none" stroke="hsl(var(--primary))" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>}
   {coordinates.map(point=><circle key={point.day} cx={point.x} cy={point.y} r="3.5" fill="hsl(var(--primary))" stroke="hsl(var(--card))" strokeWidth="1.5"><title>{chartDate(point.day,{weekday:'long',month:'long',day:'numeric',year:'numeric'})}: {point.views.toLocaleString()} views</title></circle>)}
   {labelIndexes.map(index=><text key={points[index].day} x={x(index)} y={height-8} textAnchor={index===0?'start':index===points.length-1?'end':'middle'} fill="currentColor" opacity=".65" fontSize="11">{chartDate(points[index].day)}</text>)}
  </svg> : <p className="pt-20 text-center text-sm text-muted-foreground">No view events in this period yet.</p>}
 </div>;
}

export default function BookReelDetailInsights(){
 const {reelId}=useParams(); const [reel,setReel]=useState<Reel|null>(null);const [points,setPoints]=useState<Point[]>([]);const [watch,setWatch]=useState<Watch|null>(null);const [loading,setLoading]=useState(true);const [error,setError]=useState('');const [range,setRange]=useState(14);
 useEffect(()=>{let alive=true;setLoading(true);setError('');void (async()=>{const [all,trend,watchRes]=await Promise.all([supabase.rpc('get_my_book_reel_analytics'),supabase.rpc('get_my_book_reel_daily_detail',{p_reel_id:reelId,p_days:range}),supabase.rpc('get_my_book_reel_watch_analytics')]);if(!alive)return;
  if(all.error){setError('Could not load creator analytics. Check that the Book Reel analytics migrations are applied.');setLoading(false);return;}
  const found=((all.data||[]) as Reel[]).find(x=>x.reel_id===reelId);if(!found){setError('This Reel is unavailable or you do not own it.');setLoading(false);return;}setReel(found);
  if(!trend.error)setPoints((trend.data||[]).map((x:Point)=>({...x,views:Number(x.views||0)})));else setError('Daily chart is unavailable until the detail analytics migration is applied.');
  setLoading(false);})();return()=>{alive=false;};},[reelId,range]);
 const max=Math.max(1,...points.map(p=>p.views));const total=useMemo(()=>points.reduce((sum,p)=>sum+p.views,0),[points]);
 return <main className="mx-auto max-w-5xl space-y-6 px-4 py-8 sm:px-6"><Link to="/social/reels/insights" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="h-4 w-4"/>All Reel insights</Link>
 {loading?<p className="py-12 text-center text-muted-foreground">Loading Reel performance…</p>:error&&!reel?<div role="alert" className="rounded-xl border border-dashed p-6 text-sm text-muted-foreground">{error}</div>:reel&&<>
 <header><div className="flex items-center gap-2 text-primary text-sm"><CalendarDays className="h-4 w-4"/>Creator studio · Reel detail</div><h1 className="mt-2 font-serif text-3xl font-bold">{reel.book_title||'Reader moment'}</h1><p className="mt-1 text-muted-foreground">Published {new Date(reel.created_at).toLocaleDateString()} · Last {range} days chart</p></header>
 <section className="grid grid-cols-2 gap-3 md:grid-cols-4"><Stat icon={Eye} label="All-time views" value={Number(reel.view_count||0)}/><Stat icon={Users} label="Known viewers" value={Number(reel.unique_viewers||0)}/><Stat icon={Heart} label="Reactions" value={Number(reel.reaction_count||0)}/><Stat icon={MessageCircle} label="Comments" value={Number(reel.comment_count||0)}/></section>
 <section className="grid grid-cols-2 gap-3 md:grid-cols-4"><Stat icon={CalendarDays} label="Watch sessions" value={Number(watch?.session_count||0)}/><Stat icon={Eye} label="Completed" value={Number(watch?.completed_sessions||0)}/><Stat icon={CalendarDays} label="Total watch time" value={duration(Number(watch?.total_watched_seconds||0))}/><Stat icon={CalendarDays} label="Avg watch time" value={duration(Number(watch?.average_watched_seconds||0))}/></section>
 <p className="text-sm text-muted-foreground">Session completion rate: <strong>{Number(watch?.completion_rate||0).toFixed(1)}%</strong> · Signed-in viewers only</p>
 <section className="rounded-2xl border bg-card p-4 sm:p-6"><div className="mb-4 flex flex-wrap items-center justify-between gap-3"><div><h2 className="font-semibold">Daily views</h2><p className="text-sm text-muted-foreground">{total.toLocaleString()} views in the displayed {range}-day period</p></div><div className="flex gap-1 rounded-lg bg-muted p-1" aria-label="Chart time range">{[7,14,30,90].map(days=><button key={days} type="button" onClick={()=>setRange(days)} aria-pressed={range===days} className={`rounded-md px-3 py-1.5 text-xs font-medium ${range===days?"bg-background shadow":"text-muted-foreground hover:text-foreground"}`}>{days}d</button>)}</div></div><DailyViewsChart points={points} max={max}/>{error&&<p className="mt-3 text-xs text-muted-foreground">{error}</p>}</section>
 <Link to={`/social/reel/${reel.reel_id}`} className="inline-flex rounded-lg border px-4 py-2 text-sm hover:bg-muted">Open public Reel</Link></>}
 </main>;
}
