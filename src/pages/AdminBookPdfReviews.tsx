import React, { useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client-universal';
import { useToast } from '@/hooks/use-toast';
import SEO from '@/components/SEO';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertCircle, CheckCircle2, ExternalLink, FileSearch, LoaderCircle, RefreshCw, ShieldCheck, XCircle } from 'lucide-react';

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
};
type Book = { id: string; title: string; author: string | null; pdf_url: string | null };
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

export default function AdminBookPdfReviews() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedId, setSelectedId] = useState('');
  const [busyAction, setBusyAction] = useState('');
  const [reason, setReason] = useState('');
  const [bookSearch, setBookSearch] = useState('');
  const [targetBookId, setTargetBookId] = useState('');
  const [rightsBasis, setRightsBasis] = useState<RightsBasis>('public_domain');
  const [evidenceUrl, setEvidenceUrl] = useState('');

  const submissionsQuery = useQuery({
    queryKey: ['admin-book-pdf-review-queue'],
    queryFn: async () => {
      const { data, error } = await supabase.from('book_pdf_submissions' as any)
        .select('id,user_id,original_filename,storage_path,file_size_bytes,submitted_title,submitted_author,status,rights_attested,detected_metadata,validation_findings,match_confidence,rejection_reason,created_at,verification_model,verification_completed_at,published_book_id')
        .order('created_at', { ascending: false }).limit(200);
      if (error) throw error;
      return (data || []) as Submission[];
    },
  });

  const booksQuery = useQuery({
    queryKey: ['admin-pdf-review-books'],
    queryFn: async () => {
      const { data, error } = await supabase.from('books_library')
        .select('id,title,author,pdf_url').order('title', { ascending: true }).limit(2000);
      if (error) throw error;
      return (data || []) as Book[];
    },
  });

  const submissions = submissionsQuery.data || [];
  const selected = submissions.find((item) => item.id === selectedId) || submissions[0] || null;
  const books = booksQuery.data || [];
  const eligibleBooks = useMemo(() => {
    const query = bookSearch.trim().toLowerCase();
    return books.filter((book) => !book.pdf_url && (!query || [book.title, book.author].some((v) => v?.toLowerCase().includes(query)))).slice(0, 100);
  }, [books, bookSearch]);

  const refresh = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['admin-book-pdf-review-queue'] }),
      queryClient.invalidateQueries({ queryKey: ['my-book-pdf-submissions'] }),
      queryClient.invalidateQueries({ queryKey: ['books'] }),
      queryClient.invalidateQueries({ queryKey: ['admin-book-pdf-manager-books'] }),
    ]);
  };

  const invokeReview = async (action: 'preview' | 'approve' | 'reject' | 'request_changes' | 'publish', extra: Record<string, unknown> = {}) => {
    if (!selected) return;
    setBusyAction(action);
    try {
      const { data, error } = await supabase.functions.invoke('review-book-pdf', {
        body: { submissionId: selected.id, action, ...extra },
      });
      if (error) throw error;
      if (action === 'preview' && data?.url) {
        window.open(data.url, '_blank', 'noopener,noreferrer');
        toast({ title: 'Temporary preview opened', description: 'This private link expires in three minutes.' });
      } else {
        toast({ title: action === 'publish' ? 'PDF published' : 'Review saved', description: data?.status ? `Status: ${data.status}` : 'The action completed.' });
        setReason('');
        await refresh();
      }
    } catch (error) {
      toast({ title: 'Action failed', description: error instanceof Error ? error.message : 'The review action could not be completed.', variant: 'destructive' });
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
      toast({ title: 'Verification failed', description: error instanceof Error ? error.message : 'The AI verification could not be completed.', variant: 'destructive' });
      await refresh();
    } finally {
      setBusyAction('');
    }
  };

  const report = selected?.detected_metadata || {};
  const findings = Array.isArray(selected?.validation_findings) ? selected.validation_findings : [];

  return (
    <main className="min-h-screen bg-background text-foreground">
      <SEO title="PDF Verification Review | Sahadhyayi Admin" description="Review AI-assisted book PDF submissions before publication." />
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
          <div className="grid items-start gap-5 lg:grid-cols-[minmax(280px,0.85fr)_minmax(0,1.5fr)]">
            <section className="space-y-2">
              <h2 className="font-semibold">Submissions ({submissions.length})</h2>
              {submissions.map((item) => (
                <button type="button" key={item.id} onClick={() => { setSelectedId(item.id); setTargetBookId(''); }}
                  className={`w-full rounded-xl border p-3 text-left transition hover:border-primary ${selected?.id === item.id ? 'border-primary bg-primary/5' : 'bg-card'}`}>
                  <div className="flex items-start justify-between gap-2"><span className="line-clamp-2 font-medium">{item.submitted_title || item.original_filename}</span><Badge variant={statusVariant(item.status)}>{item.status.replaceAll('_', ' ')}</Badge></div>
                  <p className="mt-1 text-xs text-muted-foreground">{item.submitted_author || 'Author not supplied'} · {new Date(item.created_at).toLocaleDateString()}</p>
                </button>
              ))}
            </section>

            {selected && <section className="space-y-5 rounded-xl border bg-card p-4 sm:p-6">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div><h2 className="text-xl font-semibold">{selected.submitted_title || selected.original_filename}</h2><p className="text-sm text-muted-foreground">{selected.submitted_author || 'Unknown author'} · {(selected.file_size_bytes || 0) / (1024 * 1024) > 0 ? `${((selected.file_size_bytes || 0) / (1024 * 1024)).toFixed(1)} MB` : 'Size unavailable'}</p></div>
                <Badge variant={statusVariant(selected.status)}>{selected.status.replaceAll('_', ' ')}</Badge>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button variant="outline" onClick={() => void invokeReview('preview')} disabled={Boolean(busyAction)}><ExternalLink className="mr-2 h-4 w-4" /> Preview PDF</Button>
                <Button onClick={() => void verify()} disabled={Boolean(busyAction) || ['approved', 'rejected'].includes(selected.status)}><FileSearch className="mr-2 h-4 w-4" /> {busyAction === 'verify' ? 'Verifying…' : 'Run Gemini verification'}</Button>
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
                    ].map(([label, value]) => <div key={String(label)}><dt className="text-xs text-muted-foreground">{label}</dt><dd className="break-words text-sm font-medium">{typeof value === 'string' || typeof value === 'number' ? String(value) : 'Not provided'}</dd></div>)}
                  </dl>
                )}
                {findings.length > 0 && <div className="mt-4 rounded-md bg-muted p-3"><p className="text-sm font-medium">Warnings</p><ul className="mt-1 list-disc space-y-1 pl-5 text-sm text-muted-foreground">{findings.map((finding, index) => <li key={index}>{typeof finding === 'string' ? finding : JSON.stringify(finding)}</li>)}</ul></div>}
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

              <div className="space-y-3 border-t pt-4">
                <h3 className="font-semibold">Publish to an existing library book</h3>
                <p className="text-sm text-muted-foreground">Publishing makes the PDF public. Select the matching catalogue record and provide evidence that permits redistribution. This will not overwrite an existing PDF. The server also requires a configured malware scanner to confirm the file is clean; without it, publishing is blocked.</p>
                <div className="space-y-1"><Label htmlFor="pdf-book-search">Find book (without an existing PDF)</Label><Input id="pdf-book-search" value={bookSearch} onChange={(e) => setBookSearch(e.target.value)} placeholder="Search title or author…" /></div>
                <div className="space-y-1"><Label>Target book</Label><Select value={targetBookId} onValueChange={setTargetBookId}><SelectTrigger><SelectValue placeholder={booksQuery.isLoading ? 'Loading books…' : 'Choose a catalogue book'} /></SelectTrigger><SelectContent>{eligibleBooks.map((book) => <SelectItem key={book.id} value={book.id}>{book.title}{book.author ? ` — ${book.author}` : ''}</SelectItem>)}</SelectContent></Select></div>
                <div className="space-y-1"><Label>Distribution-rights basis</Label><Select value={rightsBasis} onValueChange={(v) => setRightsBasis(v as RightsBasis)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{RIGHTS_OPTIONS.map((option) => <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>)}</SelectContent></Select></div>
                <div className="space-y-1"><Label htmlFor="pdf-rights-evidence">HTTPS licence / permission evidence URL</Label><Input id="pdf-rights-evidence" type="url" value={evidenceUrl} onChange={(e) => setEvidenceUrl(e.target.value)} placeholder="https://example.org/licence-or-permission" /></div>
                <Button className="w-full" onClick={() => void invokeReview('publish', { targetBookId, rightsBasis, evidenceUrl })} disabled={Boolean(busyAction) || selected.status !== 'approved' || !targetBookId || !evidenceUrl.trim() || booksQuery.isLoading}>
                  {busyAction === 'publish' ? <LoaderCircle className="mr-2 h-4 w-4 animate-spin" /> : <ShieldCheck className="mr-2 h-4 w-4" />} Publish approved PDF to Library
                </Button>
              </div>
            </section>}
          </div>
        )}
      </div>
    </main>
  );
}
