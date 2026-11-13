import { Link } from 'react-router-dom';
import { ArrowLeft, BookOpen, BookMarked, Clock3, TrendingUp, Award } from 'lucide-react';
import { useAuth } from '@/contexts/authHelpers';
import { useUserBookshelf } from '@/hooks/useUserBookshelf';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import SEO from '@/components/SEO';
import { useReadingStreak } from '@/hooks/useReadingStreak';

const StatsPage = () => {
 const { user } = useAuth();
 const { data: shelf = [], isLoading } = useUserBookshelf();
 const { data: streak } = useReadingStreak();
 const currentStreak = streak?.current ?? 0;
 const bestStreak = streak?.best ?? 0;
 const completed=shelf.filter(x=>x.status==='completed');
 const reading=shelf.filter(x=>x.status==='reading');
 const want=shelf.filter(x=>x.status==='want_to_read');
 const dnf=shelf.filter(x=>x.status==='dnf');
 const genreCounts=completed.reduce<Record<string,number>>((acc,x)=>{const g=x.books_library?.genre?.trim()||'Uncategorized';acc[g]=(acc[g]||0)+1;return acc;},{});
 const genres=Object.entries(genreCounts).sort((a,b)=>b[1]-a[1]).slice(0,8);
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
  {emoji:'🔥',name:'3-day Spark',description:'Read 3 days in a row',unlocked:currentStreak>=3},
  {emoji:'⚡',name:'Week of Reading',description:'Read 7 days in a row',unlocked:currentStreak>=7},
  {emoji:'💎',name:'Monthly Momentum',description:'Read 30 days in a row',unlocked:currentStreak>=30},
 ];
 const counts=[{label:'Books finished',value:completed.length,icon:BookMarked},{label:'Currently reading',value:reading.length,icon:BookOpen},{label:'Want to read',value:want.length,icon:Clock3},{label:'Did not finish',value:dnf.length,icon:TrendingUp}];
 if(!user)return <div className="mx-auto max-w-xl p-8 text-center"><h1 className="text-2xl font-bold">Your reading stats</h1><p className="my-3 text-muted-foreground">Sign in to see your personal reading insights.</p><Button asChild><Link to="/signin">Sign in</Link></Button></div>;
 return <div className="min-h-screen bg-background"><SEO title="My Reading Stats | Sahadhyayi" description="Your personal reading history and bookshelf insights." noIndex/><div className="mx-auto max-w-5xl space-y-6 p-4 sm:p-8"><div className="flex items-center gap-3"><Button variant="ghost" size="icon" asChild><Link to="/dashboard"><ArrowLeft/></Link></Button><div><h1 className="text-2xl font-bold">My Reading Stats</h1><p className="text-sm text-muted-foreground">A snapshot of your reading journey</p></div></div>
 <div className="grid grid-cols-2 gap-3 md:grid-cols-4">{counts.map(({label,value,icon:Icon})=><Card key={label}><CardContent className="p-4"><Icon className="mb-2 h-5 w-5 text-primary"/><div className="text-2xl font-bold">{isLoading?'—':value}</div><p className="text-xs text-muted-foreground">{label}</p></CardContent></Card>)}</div>
 <Card><CardHeader><CardTitle className="flex items-center gap-2"><Award className="h-5 w-5 text-primary"/>Reading achievements</CardTitle></CardHeader><CardContent><p className="mb-4 text-sm text-muted-foreground">{achievements.filter(a=>a.unlocked).length} of {achievements.length} badges unlocked · Keep reading to earn more.</p><div className="mb-4 flex flex-wrap gap-3 rounded-lg bg-muted/50 p-3 text-sm"><span>🔥 Current streak: <strong>{currentStreak} days</strong></span><span>🏅 Best streak: <strong>{bestStreak} days</strong></span></div><div className="grid grid-cols-2 gap-3 sm:grid-cols-3">{achievements.map(a=><div key={a.name} className={`rounded-xl border p-3 text-center ${a.unlocked?'border-primary/30 bg-primary/5':'border-border opacity-55'}`}><div className="text-2xl" aria-hidden="true">{a.unlocked?a.emoji:'🔒'}</div><p className="mt-2 text-sm font-semibold">{a.name}</p><p className="mt-1 text-xs text-muted-foreground">{a.description}</p><span className="mt-2 inline-block text-[10px] font-medium">{a.unlocked?'UNLOCKED':'LOCKED'}</span></div>)}</div></CardContent></Card>
 <div className="grid gap-4 md:grid-cols-2"><Card><CardHeader><CardTitle>Genre breakdown · completed books</CardTitle></CardHeader><CardContent>{genres.length?<div className="space-y-3">{genres.map(([g,n])=><div key={g}><div className="mb-1 flex justify-between text-sm"><span>{g}</span><span>{n}</span></div><div className="h-2 rounded-full bg-muted"><div className="h-2 rounded-full bg-primary" style={{width:`${Math.max(5,n/completed.length*100)}%`}}/></div></div>)}</div>:<p className="text-sm text-muted-foreground">Finish books with genre details to see your distribution.</p>}</CardContent></Card>
 <Card><CardHeader><CardTitle>Your ratings</CardTitle></CardHeader><CardContent><div className="text-4xl font-bold">{avg}<span className="ml-1 text-lg text-muted-foreground">/ 5</span></div><p className="mt-2 text-sm text-muted-foreground">{rated.length} completed books rated</p><p className="mt-4 text-sm">Keep rating finished books to build your personal taste profile.</p></CardContent></Card></div>
 <Card><CardHeader><CardTitle>Recently completed</CardTitle></CardHeader><CardContent>{completed.slice(0,6).map(x=><div key={x.id} className="flex items-center justify-between border-b py-3 last:border-0"><div className="min-w-0"><p className="truncate font-medium">{x.books_library?.title||'Untitled book'}</p><p className="text-xs text-muted-foreground">{x.books_library?.author||'Unknown author'}</p></div><span className="text-xs text-muted-foreground">{x.rating? `★ ${x.rating}`:'Completed'}</span></div>)}{!completed.length&&<p className="text-sm text-muted-foreground">Completed books will appear here.</p>}</CardContent></Card>
 <div className="flex flex-wrap gap-2"><Button asChild><Link to="/bookshelf">Open bookshelf</Link></Button><Button variant="outline" asChild><Link to="/dashboard">Dashboard</Link></Button></div></div></div>;
};
export default StatsPage;
