import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client-universal';
import { useToast } from '@/hooks/use-toast';
import SEO from '@/components/SEO';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { CheckCircle2, ExternalLink, FileSearch, LoaderCircle, RefreshCw, ShieldCheck, XCircle, FileText, FileUp } from 'lucide-react';

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
  const [previewedId, setPreviewedId] = useState('');

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
      setReason('');
      setPreviewedId('');
    } else {
      setPreviewedId('');
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

  const invokeReview = async (action: 'preview' | 'approve' | 'reject', extra: Record<string, unknown> = {}) => {
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
        setPreviewedId(selected.id);
        toast({ title: 'Private PDF preview opened', description: 'Review the document before approving it. This link expires in three minutes.' });
      } else {
        if (data?.success !== true) throw new Error(data?.error || 'The server did not confirm that this action completed.');
        const description = action === 'approve'
          ? 'The PDF and book entry are now added to the public Library.'
          : data?.status ? `Status: ${data.status}` : 'The submission was rejected.';
        toast({ title: action === 'approve' ? 'Added to Library' : 'Submission rejected', description });
        setReason('');
        await refresh();
      }
    } catch (error) {
      toast({ title: 'Action failed', description: await getFunctionErrorMessage(error, 'The review action could not be completed.'), variant: 'destructive' });
    } finally {
      setBusyAction('');
    }
  };


  return (
    <main className="min-h-screen bg-background text-foreground">
      <SEO title="PDF Verification Review | Sahadhyayi Admin" description="Review AI-assisted book PDF submissions before publication." noIndex={true} />
      <div className="container mx-auto max-w-7xl space-y-6 px-4 py-8">
        <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <div className="flex items-center gap-2"><ShieldCheck className="h-6 w-6" /><h1 className="text-2xl font-bold">Book PDF Verification</h1></div>
            <p className="mt-1 max-w-2xl text-sm text-muted-foreground">Open each private PDF once, then approve it to add it to the Library or reject it.</p>
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
                        {Boolean(item.match_confidence && item.match_confidence > 0) && (
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
                {selected.published_book_id ? <Badge variant="default">Published</Badge> : null}
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
                <h3 className="font-semibold">Admin decision</h3>
                <Label htmlFor="pdf-review-reason">Rejection reason (required only when rejecting)</Label>
                <Textarea id="pdf-review-reason" value={reason} onChange={(e) => setReason(e.target.value)} maxLength={2000} placeholder="Optional note for the contributor; required when rejecting." />
                <div className="flex flex-wrap gap-2">
                  <Button onClick={() => void invokeReview('approve')} disabled={Boolean(busyAction) || selected.status === 'rejected' || Boolean(selected.published_book_id) || previewedId !== selected.id}>
                    {busyAction === 'approve' ? <LoaderCircle className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle2 className="mr-2 h-4 w-4" />}
                    Approve & Add to Library
                  </Button>
                  <Button variant="destructive" onClick={() => void invokeReview('reject', { reason })} disabled={Boolean(busyAction) || !reason.trim() || Boolean(selected.published_book_id)}><XCircle className="mr-2 h-4 w-4" /> Reject</Button>
                </div>
                {previewedId !== selected.id && !selected.published_book_id && <p className="text-xs text-muted-foreground">Preview the PDF before the approval button becomes available.</p>}
              </div>

              {selected.published_book_id ? (
                <div className="rounded-lg border border-primary/20 bg-primary/10 p-4">
                  <div className="flex items-center gap-2 font-medium text-primary"><CheckCircle2 className="h-5 w-5" /> This PDF is live in the Library.</div>
                  <a className="mt-2 inline-flex items-center text-sm underline" href={`/library?search=${encodeURIComponent(selected.submitted_title || '')}`} target="_blank" rel="noopener noreferrer">View Library entry</a>
                </div>
              ) : null}
            </section>}
          </div>
        )}
      </div>
    </main>
  );
}