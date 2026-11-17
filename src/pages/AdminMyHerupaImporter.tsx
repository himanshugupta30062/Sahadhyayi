import React, { useState } from 'react';
import { supabase } from '@/integrations/supabase/client-universal';
import SEO from '@/components/SEO';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { ExternalLink, Loader2, Search, Upload, BookOpen, Info } from 'lucide-react';

type Candidate = { title: string; url: string; kind: string; selected: boolean; author: string };

export default function AdminMyHerupaImporter() {
  const { toast } = useToast();
  const [sourceUrl, setSourceUrl] = useState('https://myherupa.com/');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [pageTitle, setPageTitle] = useState('');
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [manualTitle, setManualTitle] = useState('');
  const [manualAuthor, setManualAuthor] = useState('');
  const [manualUrl, setManualUrl] = useState('');

  const discover = async () => {
    setLoading(true);
    setCandidates([]);
    try {
      const { data, error } = await supabase.functions.invoke('myherupa-import', {
        body: { action: 'discover', url: sourceUrl },
      });
      if (error) throw error;
      if (!data?.success) throw new Error(data?.error || 'Could not inspect this myHerupa page.');
      setPageTitle(data.pageTitle || 'myHerupa resources');
      setCandidates((data.resources || []).map((item: any) => ({
        title: item.title || '',
        url: item.url,
        kind: item.kind || 'Resource',
        selected: false,
        author: '',
      })));
      if (!data.resources?.length) {
        toast({ title: 'No resource links found', description: 'Try opening a specific myHerupa course page, then paste that URL here.' });
      } else {
        toast({ title: 'Resources discovered', description: `Found ${data.resources.length} links. Review them before adding catalogue records.` });
      }
    } catch (error) {
      toast({ title: 'Discovery failed', description: error instanceof Error ? error.message : 'Could not inspect the source page.', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const updateCandidate = (index: number, patch: Partial<Candidate>) => {
    setCandidates(current => current.map((item, i) => i === index ? { ...item, ...patch } : item));
  };

  const saveBooks = async () => {
    const selected = candidates.filter(item => item.selected && item.title.trim());
    const manual = manualTitle.trim() ? [{ title: manualTitle.trim(), author: manualAuthor.trim(), url: manualUrl.trim() }] : [];
    const books = [...selected.map(item => ({ title: item.title.trim(), author: item.author.trim(), url: item.url })), ...manual];
    if (!books.length) {
      toast({ title: 'Select or enter a book', description: 'Choose discovered resources with a clear book title, or enter a title manually.', variant: 'destructive' });
      return;
    }
    setSaving(true);
    try {
      const selectedBooks = books.map(book => ({
        title: book.title,
        author: book.author || undefined,
        genre: 'Academic',
        language: 'English',
        description: `Discovered via myHerupa. Source: ${book.url || sourceUrl}. This record contains bibliographic/source information only; no PDF has been copied or republished.`,
      }));
      const { data, error } = await supabase.functions.invoke('save-selected-books', { body: { selectedBooks } });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      const inserted = Number(data?.newlyInserted || 0);
      const enriched = Number(data?.enrichedCount || 0);
      const duplicates = Number(data?.duplicatesFound || 0);
      const failed = Number(data?.failedCount || 0);
      toast({ title: 'Import completed', description: `${inserted} added, ${enriched} enriched, ${duplicates} existing/duplicate, ${failed} failed.` });
      setCandidates(current => current.map(item => item.selected ? { ...item, selected: false } : item));
      setManualTitle(''); setManualAuthor(''); setManualUrl('');
    } catch (error) {
      toast({ title: 'Could not add books', description: error instanceof Error ? error.message : 'The catalogue import failed.', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="container mx-auto max-w-5xl px-4 py-8 space-y-6">
      <SEO title="myHerupa Library Importer | Sahadhyayi Admin" description="Discover academic resources and add book records to Sahadhyayi." />
      <div className="space-y-2">
        <Badge variant="outline">Admin · Source importer</Badge>
        <h1 className="text-3xl font-bold flex items-center gap-2"><BookOpen className="h-7 w-7" /> myHerupa Library Importer</h1>
        <p className="text-muted-foreground">Discover course/resource links from myHerupa and create catalogue records without requiring a PDF upload.</p>
      </div>

      <section className="rounded-xl border p-5 space-y-3">
        <div className="flex items-center gap-2 font-semibold"><Search className="h-4 w-4" /> Discover resources</div>
        <Label htmlFor="myherupa-url">myHerupa homepage or course page URL</Label>
        <div className="flex flex-col sm:flex-row gap-2">
          <Input id="myherupa-url" value={sourceUrl} onChange={event => setSourceUrl(event.target.value)} placeholder="https://myherupa.com/pages/subjects/..." />
          <Button onClick={discover} disabled={loading || !sourceUrl.trim()} className="sm:min-w-40">
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Search className="mr-2 h-4 w-4" />}
            {loading ? 'Scanning…' : 'Discover'}
          </Button>
        </div>
        {pageTitle && <p className="text-sm text-muted-foreground">Scanned: <strong>{pageTitle}</strong></p>}
        <div className="rounded-lg bg-muted/50 p-3 text-sm flex gap-2"><Info className="h-4 w-4 mt-0.5 shrink-0" /><p>myHerupa groups materials by academic year and course. Start with a specific course page (for example, a page under <code>/pages/subjects/</code>) for more useful results. The importer only reads page links; it does not bypass Google Drive permissions or copy protected PDFs.</p></div>
      </section>

      {candidates.length > 0 && <section className="rounded-xl border p-5 space-y-4">
        <div className="flex items-center justify-between gap-2"><h2 className="font-semibold">Discovered links ({candidates.length})</h2><Button variant="outline" size="sm" onClick={() => setCandidates(current => current.map(item => ({ ...item, selected: true })))}>Select all</Button></div>
        <div className="space-y-3">
          {candidates.map((item, index) => <div key={item.url} className="rounded-lg border p-3 space-y-2">
            <div className="flex items-start gap-3">
              <Checkbox checked={item.selected} onCheckedChange={checked => updateCandidate(index, { selected: checked === true })} />
              <div className="min-w-0 flex-1 space-y-2">
                <div className="flex flex-wrap items-center gap-2"><Badge variant="secondary">{item.kind}</Badge><a className="text-sm underline inline-flex items-center gap-1 break-all" href={item.url} target="_blank" rel="noreferrer">{item.url}<ExternalLink className="h-3 w-3 shrink-0" /></a></div>
                <Input value={item.title} onChange={event => updateCandidate(index, { title: event.target.value })} placeholder="Enter the actual book/resource title before selecting" />
                <Input value={item.author} onChange={event => updateCandidate(index, { author: event.target.value })} placeholder="Author (optional)" />
              </div>
            </div>
          </div>)}
        </div>
      </section>}

      <section className="rounded-xl border p-5 space-y-3">
        <h2 className="font-semibold">Add a book manually (without PDF)</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1"><Label htmlFor="manual-title">Book title *</Label><Input id="manual-title" value={manualTitle} onChange={event => setManualTitle(event.target.value)} placeholder="Book title" /></div>
          <div className="space-y-1"><Label htmlFor="manual-author">Author</Label><Input id="manual-author" value={manualAuthor} onChange={event => setManualAuthor(event.target.value)} placeholder="Author name" /></div>
        </div>
        <div className="space-y-1"><Label htmlFor="manual-source">myHerupa/source URL</Label><Input id="manual-source" value={manualUrl} onChange={event => setManualUrl(event.target.value)} placeholder="https://..." /></div>
        <Button onClick={saveBooks} disabled={saving || (!manualTitle.trim() && !candidates.some(item => item.selected && item.title.trim()))}>
          {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
          {saving ? 'Adding to library…' : 'Add selected books to library'}
        </Button>
      </section>
    </div>
  );
}
