import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, Search, PenLine, Highlighter, Quote, ArrowUpRight, Library } from 'lucide-react';
import { useReadingJournal } from '@/hooks/useReadingJournal';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

type Filter = 'all' | 'reflection' | 'highlight' | 'quote';

const labels: Record<Filter, string> = { all: 'Everything', reflection: 'Reflections', highlight: 'Highlights', quote: 'Quotes' };
const icons = { reflection: PenLine, highlight: Highlighter, quote: Quote };

export default function ReadingJournalPage() {
  const { entries, bookSummaries, isLoading } = useReadingJournal();
  const [filter, setFilter] = useState<Filter>('all');
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState<'recent' | 'page'>('recent');

  const filtered = useMemo(() => {
    const term = search.trim().toLocaleLowerCase();
    return entries.filter((entry) => {
      const matchesType = filter === 'all' || entry.type === filter;
      const text = [entry.text, entry.note, entry.bookTitle, String(entry.page)].filter(Boolean).join(' ').toLocaleLowerCase();
      return matchesType && (!term || text.includes(term));
    }).sort((a, b) => sort === 'recent'
      ? new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      : a.page - b.page);
  }, [entries, filter, search, sort]);

  const counts = { reflection: entries.filter(e => e.type === 'reflection').length, highlight: entries.filter(e => e.type === 'highlight').length, quote: entries.filter(e => e.type === 'quote').length };

  return <div className="container mx-auto max-w-5xl space-y-6 px-4 py-8">
    <header className="rounded-2xl border bg-gradient-to-br from-amber-50 via-background to-orange-50 p-6 dark:from-amber-950/20 dark:to-orange-950/20">
      <div className="flex items-center gap-2 text-sm text-muted-foreground"><BookOpen className="h-4 w-4" /> Your private reading space</div>
      <h1 className="mt-2 text-3xl font-bold tracking-tight">Reading Journal</h1>
      <p className="mt-2 max-w-2xl text-muted-foreground">Every reflection, highlight, and saved quote—together, searchable, and connected to the book and page that inspired it.</p>
      <div className="mt-5 flex flex-wrap gap-2">
        <Badge variant="secondary">{entries.length} entries</Badge><Badge variant="outline">{bookSummaries.length} books</Badge>
        <Badge variant="outline">{counts.reflection} reflections</Badge><Badge variant="outline">{counts.highlight} highlights</Badge><Badge variant="outline">{counts.quote} quotes</Badge>
      </div>
    </header>
    <div className="flex flex-col gap-3 sm:flex-row">
      <div className="relative flex-1"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input className="pl-9" aria-label="Search journal" placeholder="Search text, book, or page…" value={search} onChange={e => setSearch(e.target.value)} /></div>
      <div className="flex gap-2 overflow-x-auto">{(['all','reflection','highlight','quote'] as Filter[]).map(f => <Button key={f} size="sm" variant={filter===f?'default':'outline'} onClick={()=>setFilter(f)}>{labels[f]}</Button>)}</div>
      <Button size="sm" variant="ghost" onClick={()=>setSort(s=>s==='recent'?'page':'recent')}>{sort==='recent'?'Newest first':'Page order'}</Button>
    </div>
    {isLoading ? <div className="py-16 text-center text-muted-foreground">Loading your journal…</div> : filtered.length===0 ? <Card><CardContent className="flex flex-col items-center gap-3 py-14 text-center"><Library className="h-8 w-8 text-muted-foreground"/><h2 className="font-semibold">{entries.length?'No matching entries':'Your journal is waiting'}</h2><p className="max-w-md text-sm text-muted-foreground">{entries.length?'Try a different search or filter.':'Save a reflection, highlight, or quote while reading; it will appear here automatically.'}</p><Button asChild variant="outline"><Link to="/bookshelf">Explore your bookshelf</Link></Button></CardContent></Card> : <div className="grid gap-3 md:grid-cols-2">{filtered.map(entry=>{const Icon=icons[entry.type as keyof typeof icons]||BookOpen;return <Card key={entry.id} className="transition-shadow hover:shadow-sm"><CardContent className="space-y-3 p-4"><div className="flex items-center justify-between gap-2"><Badge variant="outline" className="capitalize"><Icon className="mr-1 h-3 w-3"/>{entry.type}</Badge><span className="text-xs text-muted-foreground">{entry.createdAt && new Date(entry.createdAt).getTime()>0?new Date(entry.createdAt).toLocaleDateString():''}</span></div>{entry.text&&<blockquote className="border-l-2 border-amber-400 pl-3 font-serif text-sm italic leading-relaxed">“{entry.text}”</blockquote>}{entry.note&&<p className="whitespace-pre-wrap text-sm">{entry.note}</p>}<div className="flex items-center justify-between border-t pt-2 text-xs text-muted-foreground"><span className="truncate">{entry.bookTitle||'Book'} · p. {entry.page}</span><Button asChild variant="ghost" size="sm" className="h-7"><Link to={entry.bookId==='general'?'/quotes':`/reader/${entry.bookId}?page=${entry.page}`}>Open <ArrowUpRight className="ml-1 h-3 w-3"/></Link></Button></div></CardContent></Card>})}</div>}
  </div>;
}
