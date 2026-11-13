import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, BookOpen, BookMarked, Clock3, TrendingUp } from 'lucide-react';
import { useAuth } from '@/contexts/authHelpers';
import { useUserBookshelf } from '@/hooks/useUserBookshelf';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import SEO from '@/components/SEO';
import { useReadingGoal } from '@/hooks/useReadingGoal';
import { useReadingLogs } from '@/hooks/useReadingLogs';
import { Input } from '@/components/ui/input';

const StatsPage = () => {
 const { user } = useAuth();
 const { data: shelf = [], isLoading } = useUserBookshelf();
 const { goal, currentYear, setGoal, isLoading: savingGoal } = useReadingGoal();
 const { data: logs = [], isLoading: logsLoading } = useReadingLogs();
 const [goalDraft, setGoalDraft] = useState(String(goal));
 const yearLogs = logs.filter(log => new Date(log.logged_at).getFullYear() === currentYear);
 const pagesThisYear = yearLogs.reduce((sum, log) => sum + (log.pages_read || 0), 0);
 const minutesThisYear = yearLogs.reduce((sum, log) => sum + (log.minutes_read || 0), 0);
 const readingDays = new Set(yearLogs.map(log => new Date(log.logged_at).toDateString())).size;
 const completedThisYear = new Set(yearLogs.filter(log => log.percentage === 100).map(log => log.book_id)).size;
 const goalProgress = Math.min(100, Math.round(completedThisYear / Math.max(1, goal) * 100));
 const completed=shelf.filter(x=>x.status==='completed');
 const reading=shelf.filter(x=>x.status==='reading');
 const want=shelf.filter(x=>x.status==='want_to_read');
 const dnf=shelf.filter(x=>x.status==='did_not_finish'||x.status==='dnf');
 const genreCounts=completed.reduce<Record<string,number>>((acc,x)=>{const g=x.books_library?.genre?.trim()||'Uncategorized';acc[g]=(acc[g]||0)+1;return acc;},{});
 const genres=Object.entries(genreCounts).sort((a,b)=>b[1]-a[1]).slice(0,8);
 const rated=completed.filter(x=>typeof x.rating==='number'&&x.rating>0);
 const avg=rated.length? (rated.reduce((s,x)=>s+(x.rating||0),0)/rated.length).toFixed(1):'—';
 const totalPages=completed.reduce((s,x)=>s+(x.books_library?.description?.match(/(?:pages|page count)\s*:?\s*(\d+)/i)?.[1]?Number(x.books_library.description.match(/(?:pages|page count)\s*:?\s*(\d+)/i)?.[1]):0),0);
 const counts=[{label:'Books finished',value:completed.length,icon:BookMarked},{label:'Currently reading',value:reading.length,icon:BookOpen},{label:'Want to read',value:want.length,icon:Clock3},{label:'Did not finish',value:dnf.length,icon:TrendingUp}];
 if(!user)return <div className="mx-auto max-w-xl p-8 text-center"><h1 className="text-2xl font-bold">Your reading stats</h1><p className="my-3 text-muted-foreground">Sign in to see your personal reading insights.</p><Button asChild><Link to="/signin">Sign in</Link></Button></div>;
 return <div className="min-h-screen bg-background"><SEO title="My Reading Stats | Sahadhyayi" description="Your personal reading history and bookshelf insights." noIndex/><div className="mx-auto max-w-5xl space-y-6 p-4 sm:p-8"><div className="flex items-center gap-3"><Button variant="ghost" size="icon" asChild><Link to="/dashboard"><ArrowLeft/></Link></Button><div><h1 className="text-2xl font-bold">My Reading Stats</h1><p className="text-sm text-muted-foreground">A snapshot of your reading journey</p></div></div>
 <Card className="border-primary/20"><CardHeader><CardTitle className="flex items-center justify-between"><span">${currentYear} Reading Challenge</span><span className="text-sm font-normal text-muted-foreground">${completedThisYear} / ${goal} books</span></CardTitle></CardHeader><CardContent><div className="h-3 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-primary transition-all" style={{width:`${goalProgress}%`}} /></div><div className="mt-2 flex items-center justify-between text-xs text-muted-foreground"><span>${goalProgress}% complete</span><span>${Math.max(0,goal-completedThisYear)} to go</span></div><div className="mt-4 flex flex-wrap items-center gap-2"><label htmlFor="reading-goal" className="text-sm">Annual target</label><Input id="reading-goal" type="number" min={1} max={1000} value={goalDraft} onChange={e=>setGoalDraft(e.target.value)} className="w-24" /><Button size="sm" disabled={savingGoal||!Number.isInteger(Number(goalDraft))||Number(goalDraft)<1||Number(goalDraft)>1000} onClick={()=>void setGoal(Number(goalDraft))}>{savingGoal?'Saving…':'Save goal'}</Button></div></CardContent></Card>
 <div className="grid grid-cols-2 gap-3 md:grid-cols-4">{counts.map(({label,value,icon:Icon})=><Card key={label}><CardContent className="p-4"><Icon className="mb-2 h-5 w-5 text-primary"/><div className="text-2xl font-bold">{isLoading?'—':value}</div><p className="text-xs text-muted-foreground">{label}</p></CardContent></Card>)}</div>
 <div className="grid grid-cols-2 gap-3 md:grid-cols-4">{[{label:'Pages read this year',value:pagesThisYear.toLocaleString(),icon:BookOpen},{label:'Reading minutes',value:minutesThisYear.toLocaleString(),icon:Clock3},{label:'Active reading days',value:readingDays,icon:TrendingUp},{label:'Reading sessions',value:yearLogs.length,icon:BookMarked}].map(({label,value,icon:Icon})=><Card key={label}><CardContent className="p-4"><Icon className="mb-2 h-5 w-5 text-primary"/><div className="text-2xl font-bold">{logsLoading?'—':value}</div><p className="text-xs text-muted-foreground">{label}</p></CardContent></Card>)}</div>
 <div className="grid gap-4 md:grid-cols-2"><Card><CardHeader><CardTitle>Genre breakdown · completed books</CardTitle></CardHeader><CardContent>{genres.length?<div className="space-y-3">{genres.map(([g,n])=><div key={g}><div className="mb-1 flex justify-between text-sm"><span>{g}</span><span>{n}</span></div><div className="h-2 rounded-full bg-muted"><div className="h-2 rounded-full bg-primary" style={{width:`${Math.max(5,n/completed.length*100)}%`}}/></div></div>)}</div>:<p className="text-sm text-muted-foreground">Finish books with genre details to see your distribution.</p>}</CardContent></Card>
 <Card><CardHeader><CardTitle>Your ratings</CardTitle></CardHeader><CardContent><div className="text-4xl font-bold">{avg}<span className="ml-1 text-lg text-muted-foreground">/ 5</span></div><p className="mt-2 text-sm text-muted-foreground">{rated.length} completed books rated</p><p className="mt-4 text-sm">Keep rating finished books to build your personal taste profile.</p></CardContent></Card></div>
 <Card><CardHeader><CardTitle>Recently completed</CardTitle></CardHeader><CardContent>{completed.slice(0,6).map(x=><div key={x.id} className="flex items-center justify-between border-b py-3 last:border-0"><div className="min-w-0"><p className="truncate font-medium">{x.books_library?.title||'Untitled book'}</p><p className="text-xs text-muted-foreground">{x.books_library?.author||'Unknown author'}</p></div><span className="text-xs text-muted-foreground">{x.rating? `★ ${x.rating}`:'Completed'}</span></div>)}{!completed.length&&<p className="text-sm text-muted-foreground">Completed books will appear here.</p>}</CardContent></Card>
 <div className="flex flex-wrap gap-2"><Button asChild><Link to="/bookshelf">Open bookshelf</Link></Button><Button variant="outline" asChild><Link to="/dashboard">Dashboard</Link></Button></div></div></div>;
};
export default StatsPage;
