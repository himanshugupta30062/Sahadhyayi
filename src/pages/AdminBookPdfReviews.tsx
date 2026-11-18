import React, { useEffect, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client-universal';
import { useToast } from '@/hooks/use-toast';
import SEO from '@/components/SEO';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { CheckCircle2, ExternalLink, FileSearch, FileText, FileUp, LoaderCircle, RefreshCw, ShieldCheck, XCircle } from 'lucide-react';

type Submission = {
  id: string;
  original_filename: string;
  file_size_bytes: number | null;
  submitted_title: string | null;
  submitted_author: string | null;
  status: string;
  rejection_reason: string | null;
  created_at: string;
  published_book_id: string | null;
};

async function getFunctionErrorMessage(error: unknown, fallback: string): Promise<string> {
  const candidate = error as { message?: string; context?: Response } | null;
  if (candidate?.context && typeof candidate.context.clone === 'function') {
    try {
      const payload = await candidate.context.clone().json();
      if (typeof payload?.error === 'string' && payload.error.trim()) return payload.error;
    } catch {
      // Fall back to the SDK error for non-JSON responses.
    }
  }
  return candidate?.message || fallback;
}

const statusVariant = (status: string) => status === 'rejected' || status === 'failed'
  ? 'destructive' as const
  : status === 'approved' ? 'default' as const : 'secondary' as const;

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
        .select('id,original_filename,file_size_bytes,submitted_title,submitted_author,status,rejection_reason,created_at,published_book_id')
        .order('created_at', { ascending: false }).limit(200);
      if (error) throw error;
      return (data || []) as Submission[];
    },
  });

  const submissions = submissionsQuery.data || [];
  const selected = submissions.find((item) => item.id === selectedId) || submissions[0] || null;

  useEffect(() => {
    setReason('');
    setPreviewedId('');
  }, [selected?.id]);

  const refresh = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['admin-book-pdf-review-queue'] }),
      queryClient.invalidateQueries({ queryKey: ['my-book-pdf-submissions'] }),
      queryClient.invalidateQueries({ queryKey: ['books'] }),
      queryClient.invalidateQueries({ queryKey: ['admin-book-pdf-manager-books'] }),
    ]);
  };

  const invokeReview = async (action: 'preview' | 'approve' | 'reject') => {
    if (!selected) return;
    setBusyAction(action);
    try {
      const { data, error } = await supabase.functions.invoke('review-book-pdf', {
        body: { submissionId: selected.id, action, ...(action === 'reject' ? { reason } : {}) },
      });
      if (error) throw error;
      if (action === 'preview') {
        if (!data?.url) throw new Error(data?.error || 'The server did not return a preview link.');
        const preview = window.open(data.url, '_blank', 'noopener,noreferrer');
        if (!preview) throw new Error('The preview popup was blocked. Allow pop-ups and try again.');
        setPreviewedId(selected.id);
        toast({ title: 'Private PDF preview opened', description: 'Inspect the document before approving it. The link expires in three minutes.' });
      } else {
        if (data?.success !== true) throw new Error(data?.error || 'The server did not confirm the action.');
        toast({
          title: action === 'approve' ? 'Added to Library' : 'Submission rejected',
          description: action === 'approve'
            ? 'The PDF and its Library book entry are now publicly available.'
            : 'The contributor submission has been rejected.',
        });
        setReason('');
        await refresh();
      }
    } catch (error) {
      toast({ title: 'Action failed', description: await getFunctionErrorMessage(error, 'The review action could not be completed.'), variant: 'destructive' });
    } finally {
      setBusyAction('');
    }
  };

  const pendingStatuses = ['uploaded', 'queued', 'scanning', 'extracting', 'matching', 'needs_review', 'failed'];

  return (
    <main className="min-h-screen bg-background text-foreground">
      <SEO title="Book PDF Review | Sahadhyayi Admin" description="Preview contributed PDFs and approve them for the Library." noIndex={true} />
      <div className="container mx-auto max-w-7xl space-y-6 px-4 py-8">
        <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <div className="flex items-center gap-2"><ShieldCheck className="h-6 w-6" /><h1 className="text-2xl font-bold">Book PDF Review</h1></div>
            <p className="mt-1 max-w-2xl text-sm text-muted-foreground">Preview each private contribution, then approve it to add it directly to the Library or reject it.</p>
          </div>
          <Button variant="outline" onClick={() => { void refresh(); }} disabled={submissionsQuery.isFetching}><RefreshCw className="mr-2 h-4 w-4" /> Refresh queue</Button>
        </header>

        <div className="grid gap-3 sm:grid-cols-3">
          {[
            ['Pending review', submissions.filter((item) => pendingStatuses.includes(item.status) && !item.published_book_id).length],
            ['Rejected', submissions.filter((item) => item.status === 'rejected').length],
            ['Published', submissions.filter((item) => Boolean(item.published_book_id)).length],
          ].map(([label, value]) => <div key={String(label)} className="rounded-xl border bg-card p-4"><p className="text-sm text-muted-foreground">{label}</p><p className="mt-1 text-2xl font-semibold">{value}</p></div>)}
        </div>

        {submissionsQuery.isLoading ? (
          <div className="flex items-center gap-2 py-12 text-muted-foreground"><LoaderCircle className="h-5 w-5 animate-spin" /> Loading submissions…</div>
        ) : submissionsQuery.error ? (
          <div role="alert" className="rounded-lg border border-destructive/30 p-4 text-sm">Could not load the review queue. Confirm the PDF review migration and admin permissions.</div>
        ) : submissions.length === 0 ? (
          <div className="rounded-xl border border-dashed p-10 text-center"><FileSearch className="mx-auto h-8 w-8 text-muted-foreground" /><h2 className="mt-3 font-semibold">No submissions yet</h2><p className="mt-1 text-sm text-muted-foreground">User PDF contributions will appear here.</p></div>
        ) : (
          <div className="grid items-start gap-5 lg:grid-cols-[minmax(300px,0.8fr)_minmax(0,1.5fr)]">
            <section className="space-y-2">
              <h2 className="font-semibold">Submissions ({submissions.length})</h2>
              <ScrollArea className="h-[calc(100vh-320px)] min-h-[400px] max-h-[650px]">
                <div className="space-y-2">
                  {submissions.map((item) => (
                    <button
                      type="button"
                      key={item.id}
                      onClick={() => setSelectedId(item.id)}
                      className={`w-full rounded-xl border p-3 text-left transition hover:border-primary ${selected?.id === item.id ? 'border-primary bg-primary/5' : 'bg-card'}`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span className="line-clamp-2 min-w-0 truncate font-medium">{item.submitted_title || item.original_filename}</span>
                        <Badge variant={statusVariant(item.status)}>{item.published_book_id ? 'published' : item.status.replace(/_/g, ' ')}</Badge>
                      </div>
                      <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground"><FileText className="h-3 w-3" /> {item.original_filename} · {item.submitted_author || 'Author not supplied'}</p>
                      <p className="mt-1 text-xs text-muted-foreground">{formatFileSize(item.file_size_bytes)} · {new Date(item.created_at).toLocaleDateString()}</p>
                    </button>
                  ))}
                </div>
              </ScrollArea>
            </section>

            {selected && (
              <section className="space-y-5 rounded-xl border bg-card p-4 sm:p-6">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h2 className="text-xl font-semibold">{selected.submitted_title || selected.original_filename}</h2>
                    <p className="text-sm text-muted-foreground">{selected.submitted_author || 'Unknown author'} · {formatFileSize(selected.file_size_bytes)}</p>
                  </div>
                  <Badge variant={statusVariant(selected.status)}>{selected.published_book_id ? 'published' : selected.status.replace(/_/g, ' ')}</Badge>
                </div>

                <div className="rounded-lg border p-4">
                  <h3 className="font-semibold">PDF preview</h3>
                  <p className="mt-1 text-sm text-muted-foreground">The uploaded file remains private until you approve it. Open the temporary preview and inspect the pages before making your decision.</p>
                  <Button className="mt-3" variant="outline" onClick={() => void invokeReview('preview')} disabled={Boolean(busyAction)}>
                    <ExternalLink className="mr-2 h-4 w-4" /> {busyAction === 'preview' ? 'Opening preview…' : 'View PDF'}
                  </Button>
                </div>

                {selected.published_book_id ? (
                  <div className="rounded-lg border border-primary/20 bg-primary/10 p-4">
                    <div className="flex items-center gap-2 font-medium text-primary"><CheckCircle2 className="h-5 w-5" /> This PDF is live in the Library.</div>
                    <a className="mt-2 inline-flex text-sm underline" href={`/library?search=${encodeURIComponent(selected.submitted_title || '')}`} target="_blank" rel="noopener noreferrer">View Library entry</a>
                  </div>
                ) : selected.status !== 'rejected' ? (
                  <div className="space-y-3 border-t pt-4">
                    <h3 className="font-semibold">Admin decision</h3>
                    <Label htmlFor="pdf-review-reason">Rejection reason (required only when rejecting)</Label>
                    <Textarea id="pdf-review-reason" value={reason} onChange={(event) => setReason(event.target.value)} maxLength={2000} placeholder="Optional note for the contributor; required when rejecting." />
                    <div className="flex flex-wrap gap-2">
                      <Button onClick={() => void invokeReview('approve')} disabled={Boolean(busyAction) || previewedId !== selected.id}>
                        {busyAction === 'approve' ? <LoaderCircle className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle2 className="mr-2 h-4 w-4" />}
                        Approve & Add to Library
                      </Button>
                      <Button variant="destructive" onClick={() => void invokeReview('reject')} disabled={Boolean(busyAction) || !reason.trim()}>
                        <XCircle className="mr-2 h-4 w-4" /> Reject
                      </Button>
                    </div>
                    {previewedId !== selected.id && <p className="text-xs text-muted-foreground">View the PDF before the approval button becomes available.</p>}
                  </div>
                ) : (
                  <div className="rounded-lg border border-destructive/30 p-4 text-sm text-destructive">This submission was rejected. {selected.rejection_reason || ''}</div>
                )}
              </section>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
