import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client-universal';
import { useToast } from '@/hooks/use-toast';
import SEO from '@/components/SEO';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { AlertCircle, BookOpen, CheckCircle2, ExternalLink, FileSearch, LoaderCircle, PlusCircle, RefreshCw, ShieldCheck, Sparkles, XCircle, Search, ChevronDown, ChevronUp, FileText, Check, X, Eye, Download, RotateCw, Filter, FileUp } from 'lucide-react';
import { CatalogueSelector, CatalogueBook } from '@/components/library/CatalogueSelector';

type Submission = {
  id: string;
  user_id: string;
  original_filename: string;
  storage_path: string;
  file_size_bytes: number | null;
  submitted_title: string | null;
  submitted_author: string | null;
  status: string;
  rights_attested: boolean;
  detected_metadata: Record<string, unknown> | null;
  validation_findings: unknown[] | null;
  match_confidence: number | null;
  rejection_reason: string | null;
  created_at: string;
  verification_model: string | null;
  verification_completed_at: string | null;
  published_book_id: string | null;
  target_book_id: string | null;
  catalogue_match_status: string | null;
  pdf_sha256: string | null;
  pdf_page_count: number | null;
  malware_scan_status: string | null;
  rights_basis: string | null;
  rights_evidence_url: string | null;
};

type Book = { id: string; title: string; author: string | null; pdf_url: string | null };

async function getFunctionErrorMessage(error: unknown, fallback: string): Promise<string> {
  const candidate = error as { message?: string; context?: Response } | null;
  const response = candidate?.context;
  if (response && typeof response.clone === "function") {
    try {
      const payload = await response.clone().json();
      if (typeof payload?.error === "string" && payload.error.trim()) return payload.error;
      if (typeof payload?.message === "string" && payload.message.trim()) return payload.message;
    } catch {
      // Some gateway/runtime errors return non-JSON bodies; fall through to the SDK message.
    }
  }
  return candidate?.message || fallback;
}

type RightsBasis = 'public_domain' | 'open_license' | 'rights_holder' | 'written_permission' | 'official_source';

const RIGHTS_OPTIONS: { value: RightsBasis; label: string }[] = [
  { value: 'public_domain', label: 'Public domain / copyright expired' },
  { value: 'open_license', label: 'Open licence allowing redistribution' },
  { value: 'rights_holder', label: 'Uploader is the rights holder' },
  { value: 'written_permission', label: 'Written permission obtained' },
  { value: 'official_source', label: 'Official source explicitly permits redistribution' },
];

const statusVariant = (status: string) => status === 'rejected' || status === 'failed'
  ? 'destructive' as const
  : status === 'approved' ? 'default' as const : 'secondary' as const;

const statusIcon: Record<string, React.ComponentType<{ className?: string }>> = {
  uploaded: FileUp,
  queued: LoaderCircle,
  scanning: ShieldCheck,
  extracting: FileSearch,
  matching: RotateCw,
  needs_review: AlertCircle,
  approved: CheckCircle2,
  rejected: XCircle,
  failed: XCircle,
};

function formatFileSize(bytes: number | null): string {
  if (!bytes) return 'Size unavailable';
  const mb = bytes / (1024 * 1024);
  return mb >= 1 ? `${mb.toFixed(1)} MB` : `${(bytes / 1024).toFixed(0)} KB`;
}

export default function AdminBookPdfReviews() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedId, setSelectedId] = useState('');
  const [busyAction, setBusyAction] = useState('');
  const [reason, setReason] = useState('');
  const [rightsBasis, setRightsBasis] = useState<RightsBasis>('public_domain');
  const [evidenceUrl, setEvidenceUrl] = useState('');
  const [publishMode, setPublishMode] = useState<'existing' | 'new'>('existing');
  const [newBookTitle, setNewBookTitle] = useState('');
  const [newBookAuthor, setNewBookAuthor] = useState('');
  const [newBookGenre, setNewBookGenre] = useState('Classic');
  const [newBookDescription, setNewBookDescription] = useState('');
  const [newBookLanguage, setNewBookLanguage] = useState('English');
  const [updateAlias, setUpdateAlias] = useState(true);
  const [showCatalogueSelector, setShowCatalogueSelector] = useState(false);
  const [catalogueSearchQuery, setCatalogueSearchQuery] = useState('');
  const [cataloguePage, setCataloguePage] = useState(1);
  const [catalogueBooks, setCatalogueBooks] = useState<CatalogueBook[]>([]);
  const [catalogueTotal, setCatalogueTotal] = useState(0);
  const [catalogueLoading, setCatalogueLoading] = useState(false);
  const [catalogueHasMore, setCatalogueHasMore] = useState(true);
  const [catalogueFilter, setCatalogueFilter] = useState<'all' | 'with_pdf' | 'without_pdf'>('without_pdf');
  const [targetBookId, setTargetBookId] = useState('');
  const [selectedCatalogueBook, setSelectedCatalogueBook] = useState<CatalogueBook | null>(null);

  const submissionsQuery = useQuery({
    queryKey: ['admin-book-pdf-review-queue'],
    queryFn: async () => {
      const { data, error } = await supabase.from('book_pdf_submissions' as any)
        .select('id,user_id,original_filename,storage_path,file_size_bytes,submitted_title,submitted_author,status,rights_attested,detected_metadata,validation_findings,match_confidence,rejection_reason,created_at,verification_model,verification_completed_at,published_book_id,target_book_id,catalogue_match_status,pdf_sha256,pdf_page_count,malware_scan_status,rights_basis,rights_evidence_url')
        .order('created_at', { ascending: false }).limit(200);
      if (error) throw error;
      return (data || []) as Submission[];
    },
  });

  const submissions = submissionsQuery.data || [];
  const selected = submissions.find((item) => item.id === selectedId) || submissions[0] || null;

  // Reset form state when selection changes
  useEffect(() => {
    if (selected) {
      const rep = (selected.detected_metadata || {}) as Record<string, any>;
      setNewBookTitle(selected.submitted_title || rep.detected_title || '');
      setNewBookAuthor(selected.submitted_author || rep.detected_author || 'Unknown');
      setNewBookGenre(rep.document_type || 'Classic');
      setNewBookDescription(rep.content_relevance || rep.readability || '');
      setNewBookLanguage(rep.language || 'English');
      if (selected.published_book_id) {
        setTargetBookId(selected.published_book_id);
      } else if (selected.target_book_id) {
        setTargetBookId(selected.target_book_id);
      }
      setReason('');
      setEvidenceUrl('');
      setRightsBasis('public_domain');
      setUpdateAlias(true);
      setPublishMode('existing');
      setShowCatalogueSelector(false);
      setCatalogueSearchQuery('');
      setCataloguePage(1);
      setCatalogueBooks([]);
      setSelectedCatalogueBook(null);
    } else {
      setTargetBookId('');
    }
  }, [selected]);

  const refresh = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['admin-book-pdf-review-queue'] }),
      queryClient.invalidateQueries({ queryKey: ['my-book-pdf-submissions'] }),
      queryClient.invalidateQueries({ queryKey: ['books'] }),
      queryClient.invalidateQueries({ queryKey: ['admin-book-pdf-manager-books'] }),
    ]);
  };

  const searchCatalogue = useCallback(async (query: string, page: number = 1, append: boolean = false) => {
    if (!query.trim() && page === 1) {
      setCatalogueBooks([]);
      setCatalogueTotal(0);
      setCatalogueHasMore(false);
      return;
    }
    setCatalogueLoading(true);
    try {
      const cleanQuery = query.trim().replace(/[,()]/g, ' ').replace(/\s+/g, ' ').slice(0, 200);
      const { data, error } = await supabase.functions.invoke('review-book-pdf', {
        body: { action: 'search_catalogue', query: cleanQuery, page, pageSize: 20 },
      });
      if (error) throw error;
      if (data?.success && data?.books) {
        const books = data.books as CatalogueBook[];
        const filtered = catalogueFilter === 'with_pdf'
          ? books.filter(b => b.pdf_url)
          : catalogueFilter === 'without_pdf'
            ? books.filter(b => !b.pdf_url)
            : books;

        if (append) {
          setCatalogueBooks(prev => [...prev, ...filtered]);
        } else {
          setCatalogueBooks(filtered);
        }
        setCatalogueTotal(data.total || books.length);
        setCatalogueHasMore(data.hasMore || false);
      } else {
        if (!append) setCatalogueBooks([]);
        setCatalogueTotal(0);
        setCatalogueHasMore(false);
      }
    } catch (error) {
      console.error('Catalogue search failed:', error);
      toast({ title: 'Search failed', description: 'Could not search the catalogue.', variant: 'destructive' });
      if (!append) setCatalogueBooks([]);
    } finally {
      setCatalogueLoading(false);
    }
  }, [catalogueFilter, toast]);

  useEffect(() => {
    if (showCatalogueSelector) {
      searchCatalogue(catalogueSearchQuery, 1, false);
    }
  }, [showCatalogueSelector, catalogueSearchQuery, searchCatalogue]);

  const loadMoreCatalogue = useCallback(() => {
    if (!catalogueLoading && catalogueHasMore) {
      searchCatalogue(catalogueSearchQuery, cataloguePage + 1, true);
      setCataloguePage(prev => prev + 1);
    }
  }, [catalogueLoading, catalogueHasMore, cataloguePage, catalogueSearchQuery, searchCatalogue]);

  const handleCatalogueScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const target = e.currentTarget;
    if (target.scrollTop + target.clientHeight >= target.scrollHeight - 100) {
      loadMoreCatalogue();
    }
  }, [loadMoreCatalogue]);

  const invokeReview = async (action: 'preview' | 'approve' | 'reject' | 'request_changes' | 'publish', extra: Record<string, unknown> = {}) => {
    if (!selected) return;
    setBusyAction(action);
    try {
      const { data, error } = await supabase.functions.invoke('review-book-pdf', {
        body: { submissionId: selected.id, action, ...extra },
      });
      if (error) throw error;
      if (action === 'preview') {
        if (!data?.url) throw new Error(data?.error || 'The server did not return a preview link.');
        const preview = window.open(data.url, '_blank', 'noopener,noreferrer');
        if (!preview) throw new Error('The preview popup was blocked. Allow pop-ups and try again.');
        toast({ title: 'Temporary preview opened', description: 'This private link expires in three minutes.' });
      } else {
        if (data?.success !== true) throw new Error(data?.error || 'The server did not confirm that this action completed.');
        if (action === 'approve' && data?.targetBookId) setTargetBookId(data.targetBookId);
        const description = action === 'approve'
          ? data?.catalogueAction === 'created'
            ? 'Gemini metadata was used to create a catalogue entry automatically. Complete the rights/security checks and publish the PDF.'
            : data?.catalogueAction === 'matched'
              ? 'A unique catalogue book was matched automatically. Complete the rights/security checks and publish the PDF.'
              : 'Approved. Gemini could not safely select a catalogue entry; resolve the match and rights/security checks before publishing.'
          : action === 'publish'
            ? 'The PDF was published and is now live in the Library. Refresh the Library page to see it.'
            : data?.status ? `Status: ${data.status}` : 'The action completed.';
        toast({ title: action === 'publish' ? 'PDF published' : action === 'approve' ? 'Approved — catalogue handled' : 'Review saved', description });
        setReason('');
        await refresh();
      }
    } catch (error) {
      toast({ title: 'Action failed', description: await getFunctionErrorMessage(error, 'The review action could not be completed.'), variant: 'destructive' });
    } finally {
      setBusyAction('');
    }
  };

  const verify = async () => {
    if (!selected) return;
    setBusyAction('verify');
    try {
      const { data, error } = await supabase.functions.invoke('verify-book-pdf', { body: { submissionId: selected.id } });
      if (error) throw error;
      toast({ title: 'AI review completed', description: 'The report is saved for human review. It does not establish copyright permission or malware safety.' });
      await refresh();
      if (data?.report) {
        // Keep the selected submission visible after its status changes.
        setSelectedId(selected.id);
      }
    } catch (error) {
      toast({ title: 'Verification failed', description: await getFunctionErrorMessage(error, 'The AI verification could not be completed.'), variant: 'destructive' });
      await refresh();
    } finally {
      setBusyAction('');
    }
  };

  const report = selected?.detected_metadata || {};
  const findings = Array.isArray(selected?.validation_findings) ? selected.validation_findings : [];

  const suggestedCandidates = useMemo(() => {
    if (!selected) return [];
    const books = catalogueBooks;
    const rep = (selected.detected_metadata || {}) as Record<string, any>;
    const title = (selected.submitted_title || rep.detected_title || '').toLowerCase();
    const author = (selected.submitted_author || rep.detected_author || '').toLowerCase();
    const authorTokens = author.split(/\s+/).filter((w: string) => w.length > 2);
    const titleTokens = title.split(/\s+/).filter((w: string) => w.length > 3 && !['poems', 'songs', 'book', 'edition'].includes(w));
    const allTokens = [...authorTokens, ...titleTokens];
    if (allTokens.length === 0) return [];

    return books
      .filter((book) => !book.pdf_url)
      .filter((book) => {
        const text = `${book.title} ${book.author || ''}`.toLowerCase();
        return allTokens.some((tok) => text.includes(tok));
      })
      .slice(0, 4);
  }, [selected, catalogueBooks]);

  return (
    <main className="min-h-screen bg-background text-foreground">
      <SEO title="PDF Verification Review | Sahadhyayi Admin" description="Review AI-assisted book PDF submissions before publication." noIndex={true} />
      <div className="container mx-auto max-w-7xl space-y-6 px-4 py-8">
        <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <div className="flex items-center gap-2"><ShieldCheck className="h-6 w-6" /><h1 className="text-2xl font-bold">Book PDF Verification</h1></div>
            <p className="mt-1 max-w-2xl text-sm text-muted-foreground">Review quarantined user uploads, inspect Gemini's report, and publish only after checking distribution rights.</p>
          </div>
          <Button variant="outline" onClick={() => { void refresh(); }} disabled={submissionsQuery.isFetching}><RefreshCw className="mr-2 h-4 w-4" /> Refresh queue</Button>
        </header>

        <div className="grid gap-3 sm:grid-cols-4">
          {[
            ['Pending review', submissions.filter((s) => ['uploaded', 'queued', 'scanning', 'extracting', 'matching', 'needs_review', 'failed'].includes(s.status)).length],
            ['Approved', submissions.filter((s) => s.status === 'approved').length],
            ['Rejected', submissions.filter((s) => s.status === 'rejected').length],
            ['Published', submissions.filter((s) => Boolean(s.published_book_id)).length],
          ].map(([label, value]) => <div key={String(label)} className="rounded-xl border bg-card p-4"><p className="text-sm text-muted-foreground">{label}</p><p className="mt-1 text-2xl font-semibold">{value}</p></div>)}
        </div>

        {submissionsQuery.isLoading ? <div className="flex items-center gap-2 py-12 text-muted-foreground"><LoaderCircle className="h-5 w-5 animate-spin" /> Loading submissions…</div> : submissionsQuery.error ? (
          <div role="alert" className="rounded-lg border border-destructive/30 p-4 text-sm">Could not load the review queue. Confirm the review migration is installed in the test environment and your account has admin permissions.</div>
        ) : submissions.length === 0 ? (
          <div className="rounded-xl border border-dashed p-10 text-center"><FileSearch className="mx-auto h-8 w-8 text-muted-foreground" /><h2 className="mt-3 font-semibold">No submissions yet</h2><p className="mt-1 text-sm text-muted-foreground">User contributions will appear here after upload.</p></div>
        ) : (
          <div className="grid items-start gap-5 lg:grid-cols-[minmax(320px,0.85fr)_minmax(0,1.5fr)]">
            <section className="space-y-2">
              <div className="flex items-center justify-between">
                <h2 className="font-semibold">Submissions ({submissions.length})</h2>
                <Badge variant="outline" className="text-xs">{submissionsQuery.isFetching ? 'Refreshing…' : 'Up to date'}</Badge>
              </div>
              <ScrollArea className="h-[calc(100vh-320px)] min-h-[400px] max-h-[600px]" style={{ scrollbarWidth: 'thin' }}>
                <div className="space-y-2">
                  {submissions.map((item) => {
                    const StatusIcon = statusIcon[item.status] || FileUp;
                    return (
                      <button
                        type="button"
                        key={item.id}
                        onClick={() => { setSelectedId(item.id); setTargetBookId(''); }}
                        className={`w-full rounded-xl border p-3 text-left transition hover:border-primary ${selected?.id === item.id ? 'border-primary bg-primary/5' : 'bg-card'}`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2 min-w-0">
                            <StatusIcon className={`h-4 w-4 flex-shrink-0 ${item.status === 'approved' ? 'text-green-600' : item.status === 'rejected' || item.status === 'failed' ? 'text-destructive' : 'text-muted-foreground'}`} />
                            <span className="line-clamp-2 font-medium truncate">{item.submitted_title || item.original_filename}</span>
                          </div>
                          <Badge variant={statusVariant(item.status)}>{item.status.replace(/_/g, ' ')}</Badge>
                        </div>
                        <p className="mt-1 text-xs text-muted-foreground flex items-center gap-1">
                          <FileText className="h-3 w-3" /> {item.original_filename}
                          <span>·</span>
                          {item.submitted_author || 'Author not supplied'}
                          <span>·</span>
                          {new Date(item.created_at).toLocaleDateString()}
                        </p>
                        {item.match_confidence && item.match_confidence > 0 && (
                          <div className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                            <Sparkles className="h-3 w-3" />
                            <span>Match confidence: {Math.round(item.match_confidence * 100)}%</span>
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </ScrollArea>
            </section>

            {selected && <section className="space-y-5 rounded-xl border bg-card p-4 sm:p-6">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div><h2 className="text-xl font-semibold">{selected.submitted_title || selected.original_filename}</h2><p className="text-sm text-muted-foreground">{selected.submitted_author || 'Unknown author'} · {formatFileSize(selected.file_size_bytes)}</p></div>
                <Badge variant={statusVariant(selected.status)}>{selected.status.replace(/_/g, ' ')}</Badge>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button variant="outline" onClick={() => void invokeReview('preview')} disabled={Boolean(busyAction)}><ExternalLink className="mr-2 h-4 w-4" /> Preview PDF</Button>
                <Button onClick={() => void verify()} disabled={Boolean(busyAction) || selected.status === 'rejected' || Boolean(selected.published_book_id) || ['scanning', 'extracting', 'matching'].includes(selected.status) || (selected.status === 'approved' && Boolean(selected.verification_completed_at))}><FileSearch className="mr-2 h-4 w-4" /> {busyAction === 'verify' ? 'Verifying…' : 'Run Gemini verification'}</Button>
              </div>

              <div className="rounded-lg border p-4">
                <h3 className="flex items-center gap-2 font-semibold"><FileSearch className="h-4 w-4" /> AI verification report</h3>
                {Object.keys(report).length === 0 ? <p className="mt-2 text-sm text-muted-foreground">No report yet. Run verification to extract metadata and content-match signals.</p> : (
                  <dl className="mt-3 grid gap-3 sm:grid-cols-2">
                    {[
                      ['Detected title', report.detected_title],
                      ['Detected author', report.detected_author],
                      ['Language', report.language],
                      ['Document type', report.document_type],
                      ['Content relevance', report.content_relevance],
                      ['Readability', report.readability],
                      ['Completeness signals', report.completeness_signals],
                      ['Recommendation', report.recommendation],
                      ['Confidence', typeof selected.match_confidence === 'number' ? `${Math.round(selected.match_confidence * 100)}%` : 'Not available'],
                      ['Model', selected.verification_model || 'Not recorded'],
                    ].map(([label, value]) => <div key={String(label)}><dt className="text-xs text-muted-foreground">{String(label)}</dt><dd className="break-words text-sm font-medium">{typeof value === 'string' || typeof value === 'number' ? String(value) : 'Not provided'}</dd></div>)}
                  </dl>
                )}
                {findings.length > 0 && <div className="mt-4 rounded-md bg-muted p-3"><p className="text-sm font-medium">Warnings</p><ul className="mt-1 list-disc space-y-1 pl-5 text-sm text-muted-foreground">{findings.map((finding, index) => <li key={index}>{typeof finding === 'string' ? finding : JSON.stringify(finding)}</li>)}</ul></div>}
                {Array.isArray(report.catalogue_candidates) && report.catalogue_candidates.length > 0 && <div className="mt-4 rounded-md border p-3"><p className="text-sm font-medium">Possible catalogue matches (from AI)</p><ul className="mt-2 space-y-2">{(report.catalogue_candidates as Record<string, unknown>[]).map((candidate, index) => <li key={String(candidate.id || index)} className="flex flex-wrap items-center justify-between gap-2 text-sm"><span><strong>{String(candidate.title || 'Untitled')}</strong>{candidate.author ? ` — ${String(candidate.author)}` : ''}</span><Badge variant={candidate.pdf_url ? 'secondary' : 'outline'}>{candidate.pdf_url ? 'PDF already linked' : 'No PDF linked'}</Badge></li>)}</ul><p className="mt-2 text-xs text-muted-foreground">Check title, author, ISBN and edition before linking this submission.</p></div>}
                <p className="mt-3 text-xs text-muted-foreground">AI findings are advisory only. They do not confirm malware-free status, authenticity, completeness, or copyright clearance.</p>
              </div>

              <div className="space-y-3 border-t pt-4">
                <h3 className="font-semibold">Human review decision</h3>
                <Label htmlFor="pdf-review-reason">Reason (required for rejection or change request)</Label>
                <Textarea id="pdf-review-reason" value={reason} onChange={(e) => setReason(e.target.value)} maxLength={2000} placeholder="Explain missing pages, metadata mismatch, rights concern, or required changes." />
                <div className="flex flex-wrap gap-2">
                  <Button onClick={() => void invokeReview('approve')} disabled={Boolean(busyAction) || selected.status === 'rejected'}><CheckCircle2 className="mr-2 h-4 w-4" /> Approve for publishing review</Button>
                  <Button variant="outline" onClick={() => void invokeReview('request_changes', { reason })} disabled={Boolean(busyAction) || !reason.trim()}><AlertCircle className="mr-2 h-4 w-4" /> Request changes</Button>
                  <Button variant="destructive" onClick={() => void invokeReview('reject', { reason })} disabled={Boolean(busyAction) || !reason.trim()}><XCircle className="mr-2 h-4 w-4" /> Reject</Button>
                </div>
              </div>

              {selected.published_book_id ? (
                <div className="rounded-lg border border-primary/20 bg-primary/10 p-4">
                  <div className="flex items-center gap-2 font-medium text-primary">
                    <CheckCircle2 className="h-5 w-5" />
                    <span>This book PDF is published and publicly visible in the Library.</span>
                  </div>
                  <div className="mt-3 flex gap-2">
                    <Button variant="outline" size="sm" asChild>
                      <a href={`/library?search=${encodeURIComponent(selected.submitted_title || '')}`} target="_blank" rel="noopener noreferrer">
                        <BookOpen className="mr-2 h-4 w-4" /> View in Library Catalog
                      </a>
                    </Button>
                  </div>
                </div>
              ) : selected.status === 'approved' ? (
                <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-800 dark:text-amber-200">
                  <div className="flex items-center gap-2 font-semibold">
                    <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                    <span>Submission Approved — Pending Library Catalog Publication</span>
                  </div>
                  <p className="mt-1">
                    This file passed preliminary review. Complete the publishing step below (select an existing catalogue book or create a new catalogue entry) to make it publicly readable in the Library.
                  </p>
                </div>
              ) : null}

              <div className="space-y-3 border-t pt-4">
                <h3 className="font-semibold">Publish to Library</h3>
                <p className="text-sm text-muted-foreground">Publishing makes the PDF public to all readers. Select an existing catalogue record or create a new catalogue entry, and specify the distribution-rights basis.</p>

                <div className="grid w-full grid-cols-2 rounded-lg border bg-muted p-1" role="tablist">
                  <button
                    type="button"
                    role="tab"
                    aria-selected={publishMode === 'existing'}
                    onClick={() => { setPublishMode('existing'); setShowCatalogueSelector(true); }}
                    className={`rounded-md px-3 py-1.5 text-sm font-medium transition ${publishMode === 'existing' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
                  >
                    Link to Existing Catalogue Book
                  </button>
                  <button
                    type="button"
                    role="tab"
                    aria-selected={publishMode === 'new'}
                    onClick={() => { setPublishMode('new'); setShowCatalogueSelector(false); }}
                    className={`rounded-md px-3 py-1.5 text-sm font-medium transition ${publishMode === 'new' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
                  >
                    Publish as New Library Book
                  </button>
                </div>

                {publishMode === 'existing' ? (
                  <div className="space-y-3 pt-2">
                    {suggestedCandidates.length > 0 && (
                      <div className="rounded-lg border border-primary/20 bg-primary/5 p-3 text-sm">
                        <div className="flex items-center gap-1.5 font-medium text-primary">
                          <Sparkles className="h-4 w-4" /> AI-suggested catalogue matches
                        </div>
                        <div className="mt-2 flex flex-wrap gap-2">
                          {suggestedCandidates.map((candidate) => (
                            <Button
                              key={candidate.id}
                              variant={targetBookId === candidate.id ? 'default' : 'outline'}
                              size="sm"
                              className="text-xs"
                              onClick={() => { setTargetBookId(candidate.id); setSelectedCatalogueBook(candidate); }}
                            >
                              {candidate.title.slice(0, 35)}{candidate.title.length > 35 ? '…' : ''} {candidate.author ? `(${candidate.author})` : ''}
                            </Button>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="pdf-book-search">Find catalogue book (without an existing PDF)</Label>
                        <div className="flex items-center gap-2">
                          <Select value={catalogueFilter} onValueChange={(v) => { setCatalogueFilter(v as any); searchCatalogue(catalogueSearchQuery, 1, false); }}>
                            <SelectTrigger className="w-auto"><SelectValue placeholder="Filter" /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="without_pdf">Missing PDF</SelectItem>
                              <SelectItem value="with_pdf">Has PDF</SelectItem>
                              <SelectItem value="all">All Books</SelectItem>
                            </SelectContent>
                          </Select>
                          <Button variant="outline" size="sm" onClick={() => setShowCatalogueSelector(!showCatalogueSelector)} className="gap-1">
                            {showCatalogueSelector ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                            {showCatalogueSelector ? 'Hide' : 'Show'} Search
                          </Button>
                        </div>
                      </div>
                      <Input id="pdf-book-search" value={catalogueSearchQuery} onChange={(e) => { setCatalogueSearchQuery(e.target.value); setCataloguePage(1); }} placeholder="Search title, author, ISBN, or book ID…" />
                    </div>

                    {showCatalogueSelector && (
                      <div className="space-y-2">
                        <CatalogueSelector
                          selectedIds={targetBookId ? [targetBookId] : []}
                          onSelectionChange={(ids) => {
                            setTargetBookId(ids[0] || '');
                            const book = catalogueBooks.find(b => b.id === ids[0]);
                            if (book) setSelectedCatalogueBook(book);
                          }}
                          showCovers={true}
                          showISBN={true}
                          showPDFAvailability={true}
                          onlyMissingPDF={catalogueFilter === 'without_pdf'}
                          searchPlaceholder="Search catalogue…"
                          maxHeight="300px"
                          debounceMs={300}
                          label=""
                          helpText={`${catalogueBooks.length} of ${catalogueTotal} results shown. Scroll for more.`}
                          showPDFFilter={false}
                          disabled={catalogueLoading}
                        />

                        {catalogueBooks.length > 0 && (
                          <div className="border-t pt-2">
                            <ScrollArea className="max-h-60" onScroll={handleCatalogueScroll}>
                              <div className="space-y-1">
                                {catalogueBooks.map((book) => (
                                  <button
                                    key={book.id}
                                    type="button"
                                    onClick={() => { setTargetBookId(book.id); setSelectedCatalogueBook(book); }}
                                    className={`w-full rounded-lg border p-3 text-left transition ${targetBookId === book.id ? 'border-primary bg-primary/5' : 'hover:bg-muted/50'}`}
                                  >
                                    <div className="flex items-start justify-between gap-2">
                                      <div className="flex items-center gap-2 min-w-0">
                                        {book.cover_image_url && (
                                          <img src={book.cover_image_url} alt="" className="w-10 h-14 object-cover rounded border flex-shrink-0" loading="lazy" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                                        )}
                                        <div>
                                          <p className="font-medium truncate">{book.title}</p>
                                          <p className="text-xs text-muted-foreground">{book.author || 'Unknown author'}</p>
                                        </div>
                                      </div>
                                      <Badge variant={book.pdf_url ? 'secondary' : 'outline'} className="flex-shrink-0">
                                        {book.pdf_url ? <><Check className="h-3 w-3 mr-1" /> Has PDF</> : <><FileText className="h-3 w-3 mr-1" /> No PDF</>}
                                      </Badge>
                                    </div>
                                    <div className="mt-1 flex flex-wrap gap-2 text-xs text-muted-foreground">
                                      {book.isbn && <span>ISBN {book.isbn}</span>}
                                      {book.publication_year && <span>· {book.publication_year}</span>}
                                      {book.language && <span>· {book.language}</span>}
                                      {book.pdf_page_count && <span>· {book.pdf_page_count} pp</span>}
                                    </div>
                                  </button>
                                ))}
                              </div>
                            </ScrollArea>
                            {catalogueHasMore && (
                              <Button variant="outline" size="sm" className="w-full" onClick={loadMoreCatalogue} disabled={catalogueLoading}>
                                {catalogueLoading ? <LoaderCircle className="mr-2 h-4 w-4 animate-spin" /> : 'Load more…'}
                              </Button>
                            )}
                          </div>
                        )}
                      </div>
                    )}

                    <div className="space-y-1">
                      <Label>Target catalogue book</Label>
                      {targetBookId && selectedCatalogueBook ? (
                        <div className="rounded-lg border bg-green-50 p-3">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-medium text-green-800">{selectedCatalogueBook.title}</p>
                              <p className="text-sm text-green-700">{selectedCatalogueBook.author || 'Unknown author'}</p>
                              <div className="mt-1 flex flex-wrap gap-2 text-xs text-green-600">
                                {selectedCatalogueBook.isbn && <span>ISBN {selectedCatalogueBook.isbn}</span>}
                                {selectedCatalogueBook.publication_year && <span>· {selectedCatalogueBook.publication_year}</span>}
                                {selectedCatalogueBook.language && <span>· {selectedCatalogueBook.language}</span>}
                              </div>
                            </div>
                            <Button variant="ghost" size="sm" onClick={() => { setTargetBookId(''); setSelectedCatalogueBook(null); }}>
                              <X className="h-3 w-3" /> Clear
                            </Button>
                          </div>
                          {selectedCatalogueBook.pdf_url && (
                            <p className="mt-2 text-xs text-amber-700 flex items-center gap-1">
                              <AlertCircle className="h-3 w-3" /> This book already has a PDF. Publishing will replace it (audit trail preserved).
                            </p>
                          )}
                        </div>
                      ) : (
                        <Select value={targetBookId} onValueChange={setTargetBookId} disabled={!targetBookId}>
                          <SelectTrigger>
                            <SelectValue placeholder={catalogueLoading ? 'Loading books…' : targetBookId ? 'Selected' : 'Choose a catalogue book'} />
                          </SelectTrigger>
                          <SelectContent>
                            {catalogueBooks.slice(0, 50).map((book) => (
                              <SelectItem key={book.id} value={book.id}>
                                {book.title}{book.author ? ` — ${book.author}` : ''} {book.pdf_url ? '(has PDF)' : ''}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    </div>

                    <label className="flex items-center gap-2 pt-1 text-xs text-muted-foreground">
                      <Checkbox checked={updateAlias} onCheckedChange={(c) => setUpdateAlias(c === true)} />
                      <span>Add submitted title &ldquo;{selected.submitted_title}&rdquo; as searchable alias if catalogue title differs</span>
                    </label>
                  </div>
                ) : (
                  <div className="space-y-3 pt-2">
                    <div className="rounded-lg border border-muted bg-muted/30 p-3 text-sm">
                      <p className="font-medium">Create a new book record</p>
                      <p className="text-xs text-muted-foreground">If this book is not yet in the catalogue, publish it as a brand-new title visible in the public Library.</p>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className="space-y-1 sm:col-span-2">
                        <Label htmlFor="new-book-title">Book Title</Label>
                        <Input id="new-book-title" value={newBookTitle} onChange={(e) => setNewBookTitle(e.target.value)} placeholder="Full book title" required />
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor="new-book-author">Author</Label>
                        <Input id="new-book-author" value={newBookAuthor} onChange={(e) => setNewBookAuthor(e.target.value)} placeholder="Author name" />
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor="new-book-genre">Genre / Category</Label>
                        <Input id="new-book-genre" value={newBookGenre} onChange={(e) => setNewBookGenre(e.target.value)} placeholder="e.g. Poetry, Fiction, Philosophy" />
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor="new-book-lang">Language</Label>
                        <Input id="new-book-lang" value={newBookLanguage} onChange={(e) => setNewBookLanguage(e.target.value)} placeholder="e.g. English, Hindi" />
                      </div>
                      <div className="space-y-1">
                        <Label>Distribution-rights basis</Label>
                        <Select value={rightsBasis} onValueChange={(v) => setRightsBasis(v as RightsBasis)}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {RIGHTS_OPTIONS.map((option) => (
                              <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1 sm:col-span-2">
                        <Label htmlFor="new-book-desc">Description</Label>
                        <Textarea id="new-book-desc" value={newBookDescription} onChange={(e) => setNewBookDescription(e.target.value)} placeholder="Book description, translator notes, or edition information..." rows={2} />
                      </div>
                      <div className="space-y-1 sm:col-span-2">
                        <Label htmlFor="new-book-evidence">HTTPS licence / permission evidence URL</Label>
                        <Input id="new-book-evidence" type="url" value={evidenceUrl} onChange={(e) => setEvidenceUrl(e.target.value)} placeholder="https://example.org/licence-or-permission" />
                      </div>
                    </div>

                    {/* Publish button for new book mode */}
                    <Button
                      className="w-full"
                      onClick={() => void invokeReview('publish', { createNewBook: true, newBookTitle, newBookAuthor, newBookGenre, newBookLanguage, newBookDescription, rightsBasis, evidenceUrl })}
                      disabled={Boolean(busyAction) || selected.status !== 'approved' || !newBookTitle.trim() || !evidenceUrl.trim()}
                    >
                      {busyAction === 'publish' ? <LoaderCircle className="mr-2 h-4 w-4 animate-spin" /> : <ShieldCheck className="mr-2 h-4 w-4" />}
                      Publish approved PDF to Library Book
                    </Button>
                  </div>
                )}

                {publishMode === 'existing' && (
                  <div className="space-y-3">
                    <div className="space-y-1">
                      <Label>Distribution-rights basis</Label>
                      <Select value={rightsBasis} onValueChange={(v) => setRightsBasis(v as RightsBasis)}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {RIGHTS_OPTIONS.map((option) => (
                            <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-1">
                      <Label htmlFor="pdf-rights-evidence">HTTPS licence / permission evidence URL</Label>
                      <Input id="pdf-rights-evidence" type="url" value={evidenceUrl} onChange={(e) => setEvidenceUrl(e.target.value)} placeholder="https://example.org/licence-or-permission" />
                    </div>

                    <Button
                      className="w-full"
                      onClick={() => void invokeReview('publish', { targetBookId, rightsBasis, evidenceUrl, updateBookTitleWithAlias: updateAlias })}
                      disabled={Boolean(busyAction) || selected.status !== 'approved' || !targetBookId || !evidenceUrl.trim()}
                    >
                      {busyAction === 'publish' ? <LoaderCircle className="mr-2 h-4 w-4 animate-spin" /> : <ShieldCheck className="mr-2 h-4 w-4" />}
                      Publish approved PDF to Library Book
                    </Button>
                  </div>
                )}
              </div>
            </section>}
          </div>
        )}
      </div>
    </main>
  );
}