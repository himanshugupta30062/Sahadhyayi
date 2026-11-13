import { Link } from 'react-router-dom';
import { ArrowLeft, BookOpen, BookMarked, Clock3, TrendingUp, Award, BarChart3 } from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '@/contexts/authHelpers';
import { useUserBookshelf } from '@/hooks/useUserBookshelf';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import SEO from '@/components/SEO';
import { useReadingLogs } from '@/hooks/useReadingLogs';
import { useReadingStreak } from '@/hooks/useReadingStreak';

const StatsPage = () => {
 const { user } = useAuth();
 const { data: shelf = [], isLoading } = useUserBookshelf();
 const { data: logs = [], isLoading: logsLoading } = useReadingLogs();
 const { data: streak } = useReadingStreak();
 const weekStart = new Date(); weekStart.setHours(0,0,0,0); weekStart.setDate(weekStart.getDate()-((weekStart.getDay()+6)%7));
 const weekLogs = logs.filter(log => new Date(log.logged_at) >= weekStart);
 const weekMinutes = weekLogs.reduce((sum,log)=>sum+(log.minutes_read||0),0);
 const weekPages = weekLogs.reduce((sum,log)=>sum+(log.pages_read||0),0);
 const calendarEnd = new Date(); calendarEnd.setHours(0,0,0,0);
 const calendarStart = new Date(calendarEnd); calendarStart.setDate(calendarStart.getDate()-27);
 const calendarDays = Array.from({length:28},(_,i)=>{const day=new Date(calendarStart);day.setDate(day.getDate()+i);const key=`${day.getFullYear()}-${String(day.getMonth()+1).padStart(2,'0')}-${String(day.getDate()).padStart(2,'0')}`;const dayLogs=logs.filter(log=>{const d=new Date(log.logged_at);return d.getFullYear()===day.getFullYear()&&d.getMonth()===day.getMonth()&&d.getDate()===day.getDate();});return {key,day,pages:dayLogs.reduce((sum,log)=>sum+(log.pages_read||0),0),minutes:dayLogs.reduce((sum,log)=>sum+(log.minutes_read||0),0),sessions:dayLogs.length};});
 const maxDailyMinutes=Math.max(1,...calendarDays.map(day=>day.minutes));
 const activeCalendarDays=calendarDays.filter(day=>day.sessions>0).length;
 const completed=shelf.filter(x=>x.status==='completed');
 const reading=shelf.filter(x=>x.status==='reading');
 const want=shelf.filter(x=>x.status==='want_to_read');
 const dnf=shelf.filter(x=>x.status==='dnf');
 const [trendRange, setTrendRange] = useState<'month'|'year'>('month');
 const trendBuckets = Array.from({length:trendRange==='month'?6:12},(_,i)=>{
  const date=new Date(); date.setDate(1); date.setMonth(date.getMonth()-(trendRange==='month'?5-i:11-i));
  const key=`${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}`;
  const label=date.toLocaleDateString(undefined,{month:trendRange==='month'?'short':'short',...(trendRange==='year'?{year:'2-digit'}:{})});
  const sessions=logs.filter(log=>log.logged_at?.slice(0,7)===key);
  const finished=completed.filter(book=>book.completed_at?.slice(0,7)===key);
  return {key,label,pages:sessions.reduce((sum,l)=>sum+(l.pages_read||0),0),minutes:sessions.reduce((sum,l)=>sum+(l.minutes_read||0),0),books:finished.length};
 });
 const trendMax=Math.max(1,...trendBuckets.map(x=>x.pages));
 const completionMax=Math.max(1,...trendBuckets.map(x=>x.books));
 const genreCounts=completed.reduce<Record<string,number>>((acc,x)=>{const g=x.books_library?.genre?.trim()||'Uncategorized';acc[g]=(acc[g]||0)+1;return acc;},{});
 const genres=Object.entries(genreCounts).sort((a,b)=>b[1]-a[1]).slice(0,8);
 const topGenre=genres[0]?.[0];
 const genreVariety=Object.keys(genreCounts).filter(g=>g!=='Uncategorized').length;
 const readerType=completed.length>=10?'Seasoned reader':completed.length>=3?'Growing reader':'Curious beginner';
 const tasteType=genreVariety>=5?'Genre explorer':genreVariety>=2?'Varied taste':'Finding your niche';
 const rated=completed.filter(x=>typeof x.rating==='number'&&x.rating>0);
 const avg=rated.length? (rated.reduce((s,x)=>s+(x.rating||0),0)/rated.length).toFixed(1):'—';
 const totalPages=completed.reduce((s,x)=>s+(x.books_library?.description?.match(/(?:pages|page count)\s*:?\s*(\d+)/i)?.[1]?Number(x.books_library.description.match(/(?:pages|page count)\s*:?\s*(\d+)/i)?.[1]):0),0);
 const achievements=[
  {emoji:'🌱',name:'First Chapter',description:'Finish your first book',unlocked:completed.length>=1},
  {emoji:'📚',name:'Bookworm',description:'Finish 5 books',unlocked:completed.length>=5},
  {emoji:'🔥',name:'Dedicated Reader',description:'Finish 10 books',unlocked:completed.length>=10},
  {emoji:'🏆',name:'Shelf Legend',description:'Finish 25 books',unlocked:completed.length>=25},
  {emoji:'⭐',name:'Thoughtful Reviewer',description:'Rate 5 completed books',unlocked:rated.length>=5},
  {emoji:'🌈',name:'Genre Explorer',description:'Finish books across 3 genres',unlocked:Object.keys(genreCounts).filter(g=>g!=='Uncategorized').length>=3},
 ];
 const counts=[{label:'Books finished',value:completed.length,icon:BookMarked},{label:'Currently reading',value:reading.length,icon:BookOpen},{label:'Want to read',value:want.length,icon:Clock3},{label:'Did not finish',value:dnf.length,icon:TrendingUp}];
 if(!user)return <div className="mx-auto max-w-xl p-8 text-center"><h1 className="text-2xl font-bold">Your reading stats</h1><p className="my-3 text-muted-foreground">Sign in to see your personal reading insights.</p><Button asChild><Link to="/signin">Sign in</Link></Button></div>;
 return <div className="min-h-screen bg-background"><SEO title="My Reading Stats | Sahadhyayi" description="Your personal reading history and bookshelf insights." noIndex/><div className="mx-auto max-w-5xl space-y-6 p-4 sm:p-8"><div className="flex items-center gap-3"><Button variant="ghost" size="icon" asChild><Link to="/dashboard"><ArrowLeft/></Link></Button><div><h1 className="text-2xl font-bold">My Reading Stats</h1><p className="text-sm text-muted-foreground">A snapshot of your reading journey</p></div></div>
 <div className="grid grid-cols-2 gap-3 md:grid-cols-4">{counts.map(({label,value,icon:Icon})=><Card key={label}><CardContent className="p-4"><Icon className="mb-2 h-5 w-5 text-primary"/><div className="text-2xl font-bold">{isLoading?'—':value}</div><p className="text-xs text-muted-foreground">{label}</p></CardContent></Card>)}</div>
 <div className="grid gap-3 sm:grid-cols-3"><Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">This week · pages</p><p className="mt-1 text-2xl font-bold">{logsLoading?'—':weekPages}</p></CardContent></Card><Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">This week · reading time</p><p className="mt-1 text-2xl font-bold">{logsLoading?'—':weekMinutes>=60?(weekMinutes/60).toFixed(1)+' h':weekMinutes+' min'}</p></CardContent></Card><Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Current streak</p><p className="mt-1 text-2xl font-bold">{streak?.current??0} <span className="text-sm font-normal text-muted-foreground">days</span></p><p className="text-xs text-muted-foreground">Best: {streak?.best??0} days</p></CardContent></Card></div>
 <Card><CardHeader><CardTitle className="flex items-center gap-2"><BarChart3 className="h-5 w-5 text-primary"/>Reading trends</CardTitle></CardHeader><CardContent>
 <div className="mb-4 flex items-center justify-between gap-3"><p className="text-sm text-muted-foreground">Pages and completed books over time</p><div className="flex rounded-lg border p-1"><Button size="sm" variant={trendRange==='month'?'default':'ghost'} onClick={()=>setTrendRange('month')}>6 months</Button><Button size="sm" variant={trendRange==='year'?'default':'ghost'} onClick={()=>setTrendRange('year')}>12 months</Button></div></div>
 <div className="grid gap-5 md:grid-cols-2"><div><p className="mb-2 text-sm font-medium">Pages read</p><div className="flex h-36 items-end gap-2 border-b pb-1">{trendBuckets.map(bucket=><div key={bucket.key} className="flex h-full flex-1 flex-col justify-end gap-1" title={bucket.pages+' pages'}><span className="text-center text-[10px] text-muted-foreground">{bucket.pages||''}</span><div className="w-full rounded-t bg-primary/80" style={{height:`${bucket.pages/trendMax*72}%`,minHeight:bucket.pages?4:0}}/><span className="text-center text-[10px] text-muted-foreground">{bucket.label}</span></div>)}</div><p className="mt-2 text-xs text-muted-foreground">Total: {trendBuckets.reduce((s,b)=>s+b.pages,0).toLocaleString()} pages</p></div>
 <div><p className="mb-2 text-sm font-medium">Books completed</p><div className="flex h-36 items-end gap-2 border-b pb-1">{trendBuckets.map(bucket=><div key={bucket.key} className="flex h-full flex-1 flex-col justify-end gap-1" title={bucket.books+' books completed'}><span className="text-center text-[10px] text-muted-foreground">{bucket.books||''}</span><div className="w-full rounded-t bg-emerald-500/80" style={{height:`${bucket.books/completionMax*72}%`,minHeight:bucket.books?4:0}}/><span className="text-center text-[10px] text-muted-foreground">{bucket.label}</span></div>)}</div><p className="mt-2 text-xs text-muted-foreground">Total: {trendBuckets.reduce((s,b)=>s+b.books,0)} books completed</p></div></div>
 <div className="mt-4 grid grid-cols-2 gap-3"><div className="rounded-lg bg-muted/50 p-3"><p className="text-xs text-muted-foreground">Reading time</p><p className="text-lg font-semibold">{Math.round(trendBuckets.reduce((s,b)=>s+b.minutes,0)/60*10)/10} hrs</p></div><div className="rounded-lg bg-muted/50 p-3"><p className="text-xs text-muted-foreground">Monthly average · pages</p><p className="text-lg font-semibold">{Math.round(trendBuckets.reduce((s,b)=>s+b.pages,0)/trendBuckets.length)}</p></div></div>
 <p className="mt-3 text-xs text-muted-foreground">Trends use your available reading logs (latest 200) and recorded completion dates.</p></CardContent></Card>
 <Card><CardHeader><CardTitle className="flex items-center gap-2"><Award className="h-5 w-5 text-primary"/>Reading achievements</CardTitle></CardHeader><CardContent><p className="mb-4 text-sm text-muted-foreground">{achievements.filter(a=>a.unlocked).length} of {achievements.length} badges unlocked · Keep reading to earn more.</p><div className="grid grid-cols-2 gap-3 sm:grid-cols-3">{achievements.map(a=><div key={a.name} className={`rounded-xl border p-3 text-center ${a.unlocked?'border-primary/30 bg-primary/5':'border-border opacity-55'}`}><div className="text-2xl" aria-hidden="true">{a.unlocked?a.emoji:'🔒'}</div><p className="mt-2 text-sm font-semibold">{a.name}</p><p className="mt-1 text-xs text-muted-foreground">{a.description}</p><span className="mt-2 inline-block text-[10px] font-medium">{a.unlocked?'UNLOCKED':'LOCKED'}</span></div>)}</div></CardContent></Card>
 <Card><CardHeader><CardTitle>Reading personality</CardTitle></CardHeader><CardContent><div className="flex flex-wrap gap-2"><span className="rounded-full bg-primary/10 px-3 py-1 text-sm font-medium">{topGenre?topGenre+' enthusiast':'Your reader profile is emerging'}</span><span className="rounded-full bg-muted px-3 py-1 text-sm">{readerType}</span><span className="rounded-full bg-muted px-3 py-1 text-sm">{tasteType}</span></div><p className="mt-3 text-sm text-muted-foreground">Based on your completed books and genre data. Your profile updates as you read more.</p></CardContent></Card>
 <div className="grid gap-4 md:grid-cols-2"><Card><CardHeader><CardTitle>Genre breakdown · completed books</CardTitle></CardHeader><CardContent>{genres.length?<div className="space-y-3">{genres.map(([g,n])=><div key={g}><div className="mb-1 flex justify-between text-sm"><span>{g}</span><span>{n}</span></div><div className="h-2 rounded-full bg-muted"><div className="h-2 rounded-full bg-primary" style={{width:`${Math.max(5,n/completed.length*100)}%`}}/></div></div>)}</div>:<p className="text-sm text-muted-foreground">Finish books with genre details to see your distribution.</p>}</CardContent></Card>
 <Card><CardHeader><CardTitle>Your ratings</CardTitle></CardHeader><CardContent><div className="text-4xl font-bold">{avg}<span className="ml-1 text-lg text-muted-foreground">/ 5</span></div><p className="mt-2 text-sm text-muted-foreground">{rated.length} completed books rated</p><p className="mt-4 text-sm">Keep rating finished books to build your personal taste profile.</p></CardContent></Card></div>
<Card><CardHeader><CardTitle className="flex items-center justify-between"><span>Reading calendar · 28 days</span><span className="text-xs font-normal text-muted-foreground">{activeCalendarDays} active days</span></CardTitle></CardHeader><CardContent><div className="grid grid-cols-7 gap-1.5 sm:gap-2">{calendarDays.map(day=><div key={day.key} title={`${day.key}: ${day.pages} pages · ${day.minutes} min · ${day.sessions} sessions`} aria-label={`${day.key}: ${day.minutes} minutes read`} className={`aspect-square rounded-md border flex flex-col items-center justify-center text-[10px] sm:text-xs ${day.sessions? 'border-primary/30 bg-primary text-primary-foreground':'border-border bg-muted/40 text-muted-foreground'}`}><span>{day.day.getDate()}</span>{day.sessions>0&&<span className="text-[8px] sm:text-[10px]">{day.minutes?`${day.minutes}m`:`${day.pages}p`}</span>}</div>)}</div><div className="mt-3 flex items-center justify-between text-xs text-muted-foreground"><span>{calendarStart.toLocaleDateString(undefined,{month:'short',day:'numeric'})}</span><span>Today</span></div><p className="mt-3 text-xs text-muted-foreground">A day lights up when you log a reading session. Hover or tap a day for pages, minutes, and session count.</p></CardContent></Card>\n <Card><CardHeader><CardTitle>Recent reading sessions</CardTitle></CardHeader><CardContent>{logs.slice(0,5).map(log=><div key={log.id} className="flex items-center justify-between gap-3 border-b py-3 last:border-0"><div className="min-w-0"><p className="text-sm font-medium">{new Date(log.logged_at).toLocaleDateString(undefined,{month:'short',day:'numeric'})}</p><p className="truncate text-xs text-muted-foreground">{log.journal_note||((log.pages_read||0)+' pages logged')}</p></div><div className="shrink-0 text-right text-xs text-muted-foreground">{log.pages_read?(log.pages_read+' pages'):''}{log.minutes_read?(' · '+log.minutes_read+' min'):''}</div></div>)}{!logs.length&&<p className="text-sm text-muted-foreground">Log a reading session from a book to see your history here.</p>}<Button className="mt-3" variant="outline" asChild><Link to="/bookshelf">Log a session from your bookshelf</Link></Button></CardContent></Card>
 <Card><CardHeader><CardTitle>Recently completed</CardTitle></CardHeader><CardContent>{completed.slice(0,6).map(x=><div key={x.id} className="flex items-center justify-between border-b py-3 last:border-0"><div className="min-w-0"><p className="truncate font-medium">{x.books_library?.title||'Untitled book'}</p><p className="text-xs text-muted-foreground">{x.books_library?.author||'Unknown author'}</p></div><span className="text-xs text-muted-foreground">{x.rating? `★ ${x.rating}`:'Completed'}</span></div>)}{!completed.length&&<p className="text-sm text-muted-foreground">Completed books will appear here.</p>}</CardContent></Card>
 <div className="flex flex-wrap gap-2"><Button asChild><Link to="/bookshelf">Open bookshelf</Link></Button><Button variant="outline" asChild><Link to="/dashboard">Dashboard</Link></Button></div></div></div>;
};
export default StatsPage;
