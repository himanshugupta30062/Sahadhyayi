import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, Search, PenLine, Highlighter, Quote, ArrowUpRight, Library, Download, Pencil, X } from 'lucide-react';
import { useReadingJournal } from '@/hooks/useReadingJournal';
import { useUpdateReaderHighlight } from '@/hooks/useReaderHighlights';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';

type Filter = 'all' | 'reflection' | 'highlight' | 'quote';
const labels: Record<Filter, string> = { all: 'Everything', reflection: 'Reflections', highlight: 'Highlights', quote: 'Quotes' };
const icons = { reflection: PenLine, highlight: Highlighter, quote: Quote };

export default function ReadingJournalPage() {
  const { entries, bookSummaries, isLoading } = useReadingJournal();
  const updateHighlight = useUpdateReaderHighlight();
  const [filter, setFilter] = useState<Filter>('all');
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState<'recent' | 'page'>('recent');
  const [editing, setEditing] = useState<string | null>(null);
  const [editText, setEditText] = useState('');
  const [editPage, setEditPage] = useState('1');
  const [editColor, setEditColor] = useState<'yellow' | 'green' | 'blue' | 'pink'>('yellow');

  const filtered = useMemo(() => {
    const term = search.trim().toLocaleLowerCase();
    return entries.filter(entry => {
      const matchesType = filter === 'all' || entry.type === filter;
      const haystack = [entry.text, entry.note, entry.bookTitle, String(entry.page)].filter(Boolean).join(' ').toLocaleLowerCase();
      return matchesType && (!term || haystack.includes(term));
    }).sort((a, b) => sort === 'recent' ? new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime() : a.page - b.page);
  }, [entries, filter, search, sort]);
  const counts = { reflection: entries.filter(e => e.type === 'reflection').length, highlight: entries.filter(e => e.type === 'highlight').length, quote: entries.filter(e => e.type === 'quote').length };

  const exportMarkdown = () => {
    const markdown = ['# My Reading Journal', '', `Exported ${new Date().toLocaleDateString()}`, '', ...filtered.flatMap(entry => [
      `## ${entry.bookTitle || 'Book'} — ${entry.type}`,
      `Page: ${entry.page || '—'} · ${entry.createdAt ? new Date(entry.createdAt).toLocaleDateString() : ''}`,
      '', entry.text ? `> ${entry.text.replace(/\\n/g, '\\n> ')}` : '', entry.note || '', ''
    ])].join('\\n');
    const blob = new Blob([markdown], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a'); anchor.href = url; anchor.download = 'reading-journal.md'; anchor.click();
    URL.revokeObjectURL(url);
    toast.success('Journal exported as Markdown');
  };

  const beginEdit = (entry: (typeof entries)[number]) => {
    setEditing(entry.id); setEditText(entry.text || ''); setEditPage(String(entry.page || 1));
    setEditColor((entry.color as typeof editColor) || 'yellow');
  };
  const saveEdit = async (entry: (typeof entries)[number]) => {
    try {
      await updateHighlight.mutateAsync({ id: entry.id, bookId: entry.bookId, text: editText, page: Number(editPage) || 1, color: editColor });
      setEditing(null); toast.success('Highlight updated');
    } catch (error) { toast.error(error instanceof Error ? error.message : 'Could not update highlight'); }
  };

  return <div className="container mx-auto max-w-5xl space-y-6 px-4 py-8">
    <header className="rounded-2xl border bg-gradient-to-br from-amber-50 via-background to-orange-50 p-6 dark:from-amber-950/20 dark:to-orange-950/20">
      <div className="flex items-center gap-2 text-sm text-muted-foreground"><BookOpen className="h-4 w-4" /> Your private reading space</div>
      <div className="mt-2 flex flex-wrap items-center justify-between gap-3"><h1 className="text-3xl font-bold tracking-tight">Reading Journal</h1><Button variant="outline" onClick={exportMarkdown}><Download className="mr-2 h-4 w-4"/>Export Markdown</Button></div>
      <p className="mt-2 max-w-2xl text-muted-foreground">Every reflection, highlight, and saved quote—together, searchable, and connected to the book and page that inspired it.</p>
      <div className="mt-5 flex flex-wrap gap-2"><Badge variant="secondary">{entries.length} entries</Badge><Badge variant="outline">{bookSummaries.length} books</Badge><Badge variant="outline">{counts.reflection} reflections</Badge><Badge variant="outline">{counts.highlight} highlights</Badge><Badge variant="outline">{counts.quote} quotes</Badge></div>
    </header>
    <div className="flex flex-col gap-3 sm:flex-row">
      <div className="relative flex-1"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"/><Input className="pl-9" aria-label="Search journal" placeholder="Search text, book, or page…" value={search} onChange={e=>setSearch(e.target.value)}/></div>
      <div className="flex gap-2 overflow-x-auto">{(['all','reflection','highlight','quote'] as Filter[]).map(f=><Button key={f} size="sm" variant={filter===f?'default':'outline'} onClick={()=>setFilter(f)}>{labels[f]}</Button>)}</div>
      <Button size="sm" variant="ghost" onClick={()=>setSort(s=>s==='recent'?'page':'recent')}>{sort==='recent'?'Newest first':'Page order'}</Button>
    </div>
    {isLoading ? <div className="py-16 text-center text-muted-foreground">Loading your journal…</div> : filtered.length===0 ? <Card><CardContent className="flex flex-col items-center gap-3 py-14 text-center"><Library className="h-8 w-8 text-muted-foreground"/><h2 className="font-semibold">{entries.length?'No matching entries':'Your journal is waiting'}</h2><p className="max-w-md text-sm text-muted-foreground">{entries.length?'Try a different search or filter.':'Save a reflection, highlight, or quote while reading; it will appear here automatically.'}</p><Button asChild variant="outline"><Link to="/bookshelf">Explore your bookshelf</Link></Button></CardContent></Card> : <div className="grid gap-3 md:grid-cols-2">{filtered.map(entry=>{const Icon=icons[entry.type as keyof typeof icons]||BookOpen;return <Card key={entry.id} className="transition-shadow hover:shadow-sm"><CardContent className="space-y-3 p-4">
      <div className="flex items-center justify-between gap-2"><Badge variant="outline" className="capitalize"><Icon className="mr-1 h-3 w-3"/>{entry.type}</Badge><span className="text-xs text-muted-foreground">{entry.createdAt&&new Date(entry.createdAt).getTime()>0?new Date(entry.createdAt).toLocaleDateString():''}</span></div>
      {editing===entry.id ? <div className="space-y-2"><Textarea value={editText} onChange={e=>setEditText(e.target.value)} aria-label="Edit highlight text"/><div className="flex flex-wrap gap-2"><Input type="number" min="1" className="w-24" value={editPage} onChange={e=>setEditPage(e.target.value)} aria-label="Highlight page"/><Select value={editColor} onValueChange={v=>setEditColor(v as typeof editColor)}><SelectTrigger className="w-32"><SelectValue/></SelectTrigger><SelectContent><SelectItem value="yellow">Yellow</SelectItem><SelectItem value="green">Green</SelectItem><SelectItem value="blue">Blue</SelectItem><SelectItem value="pink">Pink</SelectItem></SelectContent></Select><Button size="sm" onClick={()=>saveEdit(entry)} disabled={updateHighlight.isPending}>Save</Button><Button size="sm" variant="ghost" onClick={()=>setEditing(null)}><X className="mr-1 h-3 w-3"/>Cancel</Button></div> : <>{entry.text&&<blockquote className="border-l-2 border-amber-400 pl-3 font-serif text-sm italic leading-relaxed">“{entry.text}”</blockquote>}{entry.note&&<p className="whitespace-pre-wrap text-sm">{entry.note}</p>}</>}
      <div className="flex items-center justify-between border-t pt-2 text-xs text-muted-foreground"><span className="truncate">{entry.bookTitle||'Book'} · p. {entry.page}</span><div className="flex items-center">{entry.type==='highlight'&&editing!==entry.id&&<Button variant="ghost" size="sm" className="h-7" onClick={()=>beginEdit(entry)}><Pencil className="mr-1 h-3 w-3"/>Edit</Button>}<Button asChild variant="ghost" size="sm" className="h-7"><Link to={entry.bookId==='general'?'/quotes':`/reader/${entry.bookId}?page=${entry.page}`}>Open <ArrowUpRight className="ml-1 h-3 w-3"/></Link></Button></div></div>
    </CardContent></Card>})}</div>}
  </div>;
}
