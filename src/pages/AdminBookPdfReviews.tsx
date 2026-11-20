import React, { useEffect, useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client-universal';
import { useToast } from '@/hooks/use-toast';
import SEO from '@/components/SEO';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertCircle,
  BookOpen,
  CheckCircle2,
  Download,
  ExternalLink,
  FileSearch,
  FileText,
  LoaderCircle,
  RefreshCw,
  Search,
  ShieldCheck,
  Wrench,
  XCircle,
} from 'lucide-react';

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
  user_id?: string | null;
  target_book_id?: string | null;
  rights_attested?: boolean | null;
  rights_statement?: string | null;
  malware_scan_status?: string | null;
  catalogue_match_status?: string | null;
};

type AuditIssue = {
  submissionId: string;
  title: string;
  type: string;
  message: string;
  autoFixable: boolean;
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

const PENDING_STATUSES = ['uploaded', 'queued', 'scanning', 'extracting', 'matching', 'needs_review', 'failed'];

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
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'published' | 'rejected'>('all');

  // Metadata customization for approval
  const [customTitle, setCustomTitle] = useState('');
  const [customAuthor, setCustomAuthor] = useState('');
  const [customGenre, setCustomGenre] = useState('Classic');
  const [customLanguage, setCustomLanguage] = useState('English');

  // Health check / Reconciliation
  const [auditOpen, setAuditOpen] = useState(false);
  const [auditLoading, setAuditLoading] = useState(false);
  const [auditIssues, setAuditIssues] = useState<AuditIssue[]>([]);
  const [totalAudited, setTotalAudited] = useState(0);

  const submissionsQuery = useQuery({
    queryKey: ['admin-book-pdf-review-queue'],
    queryFn: async () => {
      const { data, error } = await supabase.from('book_pdf_submissions' as any)
        .select('id,original_filename,file_size_bytes,submitted_title,submitted_author,status,rejection_reason,created_at,published_book_id,user_id,target_book_id,rights_attested,rights_statement,malware_scan_status,catalogue_match_status')
        .order('created_at', { ascending: false }).limit(200);
      if (error) throw error;
      return (data || []) as Submission[];
    },
  });

  const rawSubmissions = submissionsQuery.data;
  const submissions = useMemo(() => rawSubmissions || [], [rawSubmissions]);

  const filteredSubmissions = useMemo(() => {
    return submissions.filter((item) => {
      if (statusFilter === 'pending' && (item.published_book_id || !PENDING_STATUSES.includes(item.status))) return false;
      if (statusFilter === 'published' && !item.published_book_id && item.status !== 'approved') return false;
      if (statusFilter === 'rejected' && item.status !== 'rejected') return false;

      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const titleMatch = (item.submitted_title || '').toLowerCase().includes(query);
        const authorMatch = (item.submitted_author || '').toLowerCase().includes(query);
        const fileMatch = (item.original_filename || '').toLowerCase().includes(query);
        const userMatch = (item.user_id || '').toLowerCase().includes(query);
        if (!titleMatch && !authorMatch && !fileMatch && !userMatch) return false;
      }

      return true;
    });
  }, [submissions, statusFilter, searchQuery]);

  const selected = filteredSubmissions.find((item) => item.id === selectedId) || filteredSubmissions[0] || submissions.find((item) => item.id === selectedId) || submissions[0] || null;

  // Query target catalogue book if present
  const targetBookQuery = useQuery({
    queryKey: ['admin-target-book', selected?.target_book_id],
    queryFn: async () => {
      if (!selected?.target_book_id) return null;
      const { data, error } = await supabase.from('books_library' as any)
        .select('id,title,author,pdf_url,cover_image_url')
        .eq('id', selected.target_book_id)
        .maybeSingle();
      if (error) return null;
      return data as { id: string; title: string; author: string | null; pdf_url: string | null; cover_image_url: string | null } | null;
    },
    enabled: Boolean(selected?.target_book_id),
  });

  useEffect(() => {
    setReason('');
    setPreviewedId('');
    setPreviewUrl(null);
    if (selected) {
      setCustomTitle(selected.submitted_title || '');
      setCustomAuthor(selected.submitted_author || '');
      setCustomGenre('Classic');
      setCustomLanguage('English');
    }
  }, [selected]);

  const refresh = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['admin-book-pdf-review-queue'] }),
      queryClient.invalidateQueries({ queryKey: ['my-book-pdf-submissions'] }),
      queryClient.invalidateQueries({ queryKey: ['books'] }),
      queryClient.invalidateQueries({ queryKey: ['admin-book-pdf-manager-books'] }),
      queryClient.invalidateQueries({ queryKey: ['admin-target-book'] }),
    ]);
  };

  const invokeReview = async (action: 'preview' | 'approve' | 'reject') => {
    if (!selected) return;
    setBusyAction(action);
    try {
      const body: Record<string, unknown> = {
        submissionId: selected.id,
        action,
        ...(action === 'reject' ? { reason } : {}),
      };

      // If approving and custom metadata was provided for a new book, pass it
      if (action === 'approve' && !selected.target_book_id) {
        if (customTitle.trim() && customTitle.trim() !== (selected.submitted_title || '')) {
          body.newBookTitle = customTitle.trim();
        }
        if (customAuthor.trim() && customAuthor.trim() !== (selected.submitted_author || '')) {
          body.newBookAuthor = customAuthor.trim();
        }
        if (customGenre.trim() && customGenre.trim() !== 'Classic') {
          body.newBookGenre = customGenre.trim();
        }
        if (customLanguage.trim() && customLanguage.trim() !== 'English') {
          body.newBookLanguage = customLanguage.trim();
        }
      }

      const { data, error } = await supabase.functions.invoke('review-book-pdf', { body });
      if (error) throw error;
      if (action === 'preview') {
        if (!data?.url) throw new Error(data?.error || 'The server did not return a preview link.');
        const preview = window.open(data.url, '_blank', 'noopener,noreferrer');
        if (!preview) throw new Error('The preview popup was blocked. Allow pop-ups and try again.');
        setPreviewedId(selected.id);
        setPreviewUrl(data.url);
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

  const handleDownload = async () => {
    if (previewUrl) {
      window.open(previewUrl, '_blank');
      return;
    }
    await invokeReview('preview');
  };

  const runQueueAudit = async () => {
    setAuditLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('review-book-pdf', {
        body: { action: 'audit_queue' },
      });
      if (error) throw error;
      setAuditIssues(data?.issues || []);
      setTotalAudited(data?.totalAudited || 0);
      setAuditOpen(true);
    } catch (error) {
      toast({
        title: 'Audit failed',
        description: await getFunctionErrorMessage(error, 'Could not inspect the review queue.'),
        variant: 'destructive',
      });
    } finally {
      setAuditLoading(false);
    }
  };

  const runReconciliation = async () => {
    setAuditLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('review-book-pdf', {
        body: { action: 'reconcile_queue' },
      });
      if (error) throw error;
      toast({
        title: 'Reconciliation complete',
        description: `Successfully resolved ${data?.fixedCount || 0} discrepancy records.`,
      });
      await runQueueAudit();
      await refresh();
    } catch (error) {
      toast({
        title: 'Reconciliation failed',
        description: await getFunctionErrorMessage(error, 'Could not reconcile queue.'),
        variant: 'destructive',
      });
    } finally {
      setAuditLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-background text-foreground">
      <SEO title="Book PDF Review | Sahadhyayi Admin" description="Preview contributed PDFs and approve them for the Library." noIndex={true} />
      <div className="container mx-auto max-w-7xl space-y-6 px-4 py-8">
        <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <div className="flex items-center gap-2"><ShieldCheck className="h-6 w-6 text-primary" /><h1 className="text-2xl font-bold">Book PDF Review</h1></div>
            <p className="mt-1 max-w-2xl text-sm text-muted-foreground">Preview each private contribution, verify rights and document integrity, then approve to add directly to the Library or reject.</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => void runQueueAudit()} disabled={auditLoading}>
              <Wrench className="mr-2 h-4 w-4" /> {auditLoading ? 'Auditing…' : 'Queue Health & Audit'}
            </Button>
            <Button variant="outline" size="sm" onClick={() => { void refresh(); }} disabled={submissionsQuery.isFetching}>
              <RefreshCw className="mr-2 h-4 w-4" /> Refresh queue
            </Button>
          </div>
        </header>

        <div className="grid gap-3 sm:grid-cols-3">
          {[
            ['Pending review', submissions.filter((item) => PENDING_STATUSES.includes(item.status) && !item.published_book_id).length, 'pending' as const],
            ['Rejected', submissions.filter((item) => item.status === 'rejected').length, 'rejected' as const],
            ['Published', submissions.filter((item) => Boolean(item.published_book_id)).length, 'published' as const],
          ].map(([label, value, filterType]) => (
            <button
              type="button"
              key={String(label)}
              onClick={() => setStatusFilter(statusFilter === filterType ? 'all' : filterType)}
              className={`rounded-xl border p-4 text-left transition hover:border-primary ${statusFilter === filterType ? 'border-primary bg-primary/5' : 'bg-card'}`}
            >
              <p className="text-sm text-muted-foreground">{label}</p>
              <p className="mt-1 text-2xl font-semibold">{value}</p>
            </button>
          ))}
        </div>

        {/* Search and Filters Bar */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by title, author, user ID or filename…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 text-sm"
            />
          </div>
          <div className="flex flex-wrap gap-1.5">
            {[
              ['all', 'All Submissions'],
              ['pending', 'Pending'],
              ['published', 'Published'],
              ['rejected', 'Rejected'],
            ].map(([f, label]) => (
              <Button
                key={f}
                variant={statusFilter === f ? 'default' : 'outline'}
                size="sm"
                onClick={() => setStatusFilter(f as any)}
              >
                {label}
              </Button>
            ))}
          </div>
        </div>

        {submissionsQuery.isLoading ? (
          <div className="flex items-center gap-2 py-12 text-muted-foreground"><LoaderCircle className="h-5 w-5 animate-spin" /> Loading submissions…</div>
        ) : submissionsQuery.error ? (
          <div role="alert" className="rounded-lg border border-destructive/30 p-4 text-sm">Could not load the review queue. Confirm the PDF review migration and admin permissions.</div>
        ) : submissions.length === 0 ? (
          <div className="rounded-xl border border-dashed p-10 text-center"><FileSearch className="mx-auto h-8 w-8 text-muted-foreground" /><h2 className="mt-3 font-semibold">No submissions yet</h2><p className="mt-1 text-sm text-muted-foreground">User PDF contributions will appear here.</p></div>
        ) : filteredSubmissions.length === 0 ? (
          <div className="rounded-xl border border-dashed p-10 text-center">
            <FileSearch className="mx-auto h-8 w-8 text-muted-foreground" />
            <h2 className="mt-3 font-semibold">No matching submissions</h2>
            <p className="mt-1 text-sm text-muted-foreground">No submissions found matching your search or status filter.</p>
            <Button variant="outline" size="sm" className="mt-4" onClick={() => { setSearchQuery(''); setStatusFilter('all'); }}>
              Clear filters
            </Button>
          </div>
        ) : (
          <div className="grid items-start gap-5 lg:grid-cols-[minmax(300px,0.8fr)_minmax(0,1.5fr)]">
            <section className="space-y-2">
              <h2 className="font-semibold">Submissions ({filteredSubmissions.length})</h2>
              <ScrollArea className="h-[calc(100vh-320px)] min-h-[400px] max-h-[650px]">
                <div className="space-y-2">
                  {filteredSubmissions.map((item) => (
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

                {/* Contributor and Attestation Details */}
                <div className="grid gap-3 rounded-lg border bg-muted/30 p-3 text-xs sm:grid-cols-2">
                  <div>
                    <span className="font-medium text-muted-foreground">Contributor:</span>{' '}
                    <span className="font-mono">{selected.user_id ? `${selected.user_id.slice(0, 8)}…` : 'Anonymous'}</span>
                  </div>
                  <div>
                    <span className="font-medium text-muted-foreground">Submitted:</span>{' '}
                    <span>{new Date(selected.created_at).toLocaleString()}</span>
                  </div>
                  <div>
                    <span className="font-medium text-muted-foreground">Rights Attested:</span>{' '}
                    <span className={selected.rights_attested ? 'text-green-600 font-medium' : 'text-amber-600'}>
                      {selected.rights_attested ? 'Confirmed by contributor' : 'Not confirmed'}
                    </span>
                  </div>
                  <div>
                    <span className="font-medium text-muted-foreground">Malware Scan:</span>{' '}
                    <Badge variant={selected.malware_scan_status === 'clean' ? 'default' : 'outline'} className="text-[10px] h-4">
                      {selected.malware_scan_status || 'Pending scan'}
                    </Badge>
                  </div>
                </div>

                {/* Target Catalogue Book or New Book Creation Info */}
                <div className="rounded-lg border p-4 space-y-3">
                  <h3 className="font-semibold flex items-center gap-2">
                    <BookOpen className="h-4 w-4" />
                    Catalogue Association
                  </h3>

                  {selected.target_book_id ? (
                    <div className="rounded-md border border-primary/20 bg-primary/5 p-3 text-sm">
                      <div className="flex items-center gap-2 font-medium text-primary">
                        <CheckCircle2 className="h-4 w-4" />
                        Target Book in Catalogue
                      </div>
                      <p className="mt-1 font-semibold">{targetBookQuery.data?.title || `Book ID: ${selected.target_book_id}`}</p>
                      {targetBookQuery.data?.author && (
                        <p className="text-xs text-muted-foreground">by {targetBookQuery.data.author}</p>
                      )}
                      {targetBookQuery.data?.pdf_url && (
                        <p className="mt-1 text-xs text-amber-700 flex items-center gap-1">
                          <AlertCircle className="h-3 w-3" /> This catalogue book already has a PDF. Approval will replace or update the reader link.
                        </p>
                      )}
                      <a
                        className="mt-2 inline-flex text-xs text-primary underline"
                        href={`/library?search=${encodeURIComponent(targetBookQuery.data?.title || selected.submitted_title || '')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        View Catalogue Book
                      </a>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <p className="text-xs text-muted-foreground">
                        This contribution is for a new Library entry. You can adjust the catalogue metadata before approval.
                      </p>
                      <div className="grid gap-3 sm:grid-cols-2">
                        <div className="space-y-1">
                          <Label htmlFor="admin-new-title" className="text-xs">Book Title</Label>
                          <Input
                            id="admin-new-title"
                            value={customTitle}
                            onChange={(e) => setCustomTitle(e.target.value)}
                            placeholder="Title"
                            className="h-8 text-xs"
                          />
                        </div>
                        <div className="space-y-1">
                          <Label htmlFor="admin-new-author" className="text-xs">Author</Label>
                          <Input
                            id="admin-new-author"
                            value={customAuthor}
                            onChange={(e) => setCustomAuthor(e.target.value)}
                            placeholder="Author name"
                            className="h-8 text-xs"
                          />
                        </div>
                        <div className="space-y-1">
                          <Label htmlFor="admin-new-genre" className="text-xs">Genre</Label>
                          <Input
                            id="admin-new-genre"
                            value={customGenre}
                            onChange={(e) => setCustomGenre(e.target.value)}
                            placeholder="e.g. Classic, Science"
                            className="h-8 text-xs"
                          />
                        </div>
                        <div className="space-y-1">
                          <Label htmlFor="admin-new-language" className="text-xs">Language</Label>
                          <Input
                            id="admin-new-language"
                            value={customLanguage}
                            onChange={(e) => setCustomLanguage(e.target.value)}
                            placeholder="e.g. English, Hindi"
                            className="h-8 text-xs"
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="rounded-lg border p-4">
                  <h3 className="font-semibold">PDF preview</h3>
                  <p className="mt-1 text-sm text-muted-foreground">The uploaded file remains private until you approve it. Open the temporary preview and inspect the pages before making your decision.</p>
                  <div className="flex flex-wrap gap-2 mt-3">
                    <Button variant="outline" onClick={() => void invokeReview('preview')} disabled={Boolean(busyAction)}>
                      <ExternalLink className="mr-2 h-4 w-4" /> {busyAction === 'preview' ? 'Opening preview…' : 'View PDF'}
                    </Button>
                    <Button variant="outline" onClick={() => void handleDownload()} disabled={Boolean(busyAction)}>
                      <Download className="mr-2 h-4 w-4" /> Download PDF
                    </Button>
                  </div>
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

      {/* Queue Audit and Reconciliation Dialog */}
      <Dialog open={auditOpen} onOpenChange={setAuditOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Wrench className="h-5 w-5 text-primary" />
              Queue Health & Reconciliation Report
            </DialogTitle>
            <DialogDescription>
              Inspected {totalAudited} recent submissions across the quarantine bucket, database, and Library catalog.
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto space-y-3 my-2">
            {auditIssues.length === 0 ? (
              <div className="rounded-lg border border-green-200 bg-green-50 p-4 text-center">
                <CheckCircle2 className="mx-auto h-8 w-8 text-green-600 mb-2" />
                <h4 className="font-semibold text-green-800">Queue is Healthy</h4>
                <p className="text-xs text-green-700 mt-1">All approved submissions are published to the catalog, with valid Storage objects and consistent records.</p>
              </div>
            ) : (
              <div className="space-y-2">
                <p className="text-xs font-medium text-amber-700">Found {auditIssues.length} item(s) requiring attention:</p>
                {auditIssues.map((issue, idx) => (
                  <div key={idx} className="rounded-lg border p-3 text-xs space-y-1 bg-card">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold">{issue.title}</span>
                      <Badge variant="outline" className="text-[10px]">{issue.type}</Badge>
                    </div>
                    <p className="text-muted-foreground">{issue.message}</p>
                    <p className="font-mono text-[10px] text-muted-foreground">ID: {issue.submissionId}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex items-center justify-between pt-3 border-t">
            <Button variant="ghost" size="sm" onClick={() => setAuditOpen(false)}>
              Close
            </Button>
            {auditIssues.some((i) => i.autoFixable) && (
              <Button size="sm" onClick={() => void runReconciliation()} disabled={auditLoading}>
                <Wrench className="mr-2 h-3.5 w-3.5" />
                {auditLoading ? 'Reconciling…' : 'Run Safe Reconciliation'}
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </main>
  );
}
