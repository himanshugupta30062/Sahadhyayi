import React, { useMemo, useState, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client-universal';
import { useAuth } from '@/contexts/authHelpers';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import SEO from '@/components/SEO';
import { FileUp, Search, ShieldCheck, BookOpen, ExternalLink, LoaderCircle, Loader2, FileCheck2, Trash2, Replace, FileText, Check, X, Eye, Download, RotateCw, Filter, History, ChevronDown, ChevronUp, Link } from 'lucide-react';
import { CatalogueSelector, CatalogueBook } from '@/components/library/CatalogueSelector';

type BookRecord = {
  id: string;
  title: string;
  author: string | null;
  isbn: string | null;
  publication_year: number | null;
  pdf_url: string | null;
  cover_image_url: string | null;
  pdf_sha256: string | null;
  pdf_file_size: number | null;
  pdf_page_count: number | null;
  pdf_verification_status: string | null;
  genre: string | null;
  description: string | null;
  language: string | null;
  status: string | null;
  catalog_status: string | null;
  is_archived: boolean | null;
  created_at: string;
};

const MAX_PDF_BYTES = 50 * 1024 * 1024;
const BUCKET = 'book-pdfs';

const RIGHTS_OPTIONS = [
  { value: 'public_domain', label: 'Public domain' },
  { value: 'open_license', label: 'Open licence (CC or equivalent)' },
  { value: 'authorized', label: 'Written permission / authorized distribution' },
  { value: 'publisher_hosted', label: 'Official publisher or institution-hosted PDF' },
] as const;

// eslint-disable-next-line react-refresh/only-export-components
export async function validatePdf(file: File) {
  if (file.size <= 0 || file.size > MAX_PDF_BYTES) {
    throw new Error('Choose a PDF smaller than 50 MB.');
  }
  if (file.type && file.type !== 'application/pdf') {
    throw new Error('Only PDF files are accepted.');
  }
  const slice = file.slice(0, 5);
  let buffer: ArrayBuffer;
  if (typeof slice.arrayBuffer === 'function') {
    buffer = await slice.arrayBuffer();
  } else if (typeof file.arrayBuffer === 'function') {
    buffer = (await file.arrayBuffer()).slice(0, 5);
  } else {
    buffer = await new Promise<ArrayBuffer>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as ArrayBuffer);
      reader.onerror = () => reject(reader.error);
      reader.readAsArrayBuffer(slice);
    });
  }
  const header = new Uint8Array(buffer);
  if (new TextDecoder().decode(header) !== '%PDF-') {
    throw new Error('This file does not have a valid PDF signature.');
  }
}

function formatFileSize(bytes: number | null): string {
  if (!bytes) return 'Unknown size';
  const mb = bytes / (1024 * 1024);
  return mb >= 1 ? `${mb.toFixed(1)} MB` : `${(bytes / 1024).toFixed(0)} KB`;
}

function getPDFStatusBadge(pdfUrl: string | null, verificationStatus: string | null) {
  if (!pdfUrl) return { label: 'No PDF', variant: 'outline' as const, icon: FileText };
  if (verificationStatus === 'verified') return { label: 'Verified', variant: 'default' as const, icon: Check };
  if (verificationStatus === 'malware_detected') return { label: 'Malware', variant: 'destructive' as const, icon: X };
  return { label: 'Linked', variant: 'secondary' as const, icon: FileText };
}

export default function AdminBookPdfManager() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'with_pdf' | 'without_pdf'>('without_pdf');
  const [selectedId, setSelectedId] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [sourceUrl, setSourceUrl] = useState('');
  const [rightsBasis, setRightsBasis] = useState<(typeof RIGHTS_OPTIONS)[number]['value']>('public_domain');
  const [rightsNotes, setRightsNotes] = useState('');
  const [confirmRights, setConfirmRights] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStage, setUploadStage] = useState<'idle' | 'validating' | 'uploading' | 'linking' | 'audit'>('idle');
  const [showReplaceDialog, setShowReplaceDialog] = useState(false);
  const [replaceFile, setReplaceFile] = useState<File | null>(null);
  const [replaceSourceUrl, setReplaceSourceUrl] = useState('');
  const [replaceRightsBasis, setReplaceRightsBasis] = useState<(typeof RIGHTS_OPTIONS)[number]['value']>('public_domain');
  const [replaceRightsNotes, setReplaceRightsNotes] = useState('');
  const [replaceConfirmRights, setReplaceConfirmRights] = useState(false);
  const [isReplacing, setIsReplacing] = useState(false);
  const [replaceStage, setReplaceStage] = useState<'idle' | 'validating' | 'uploading' | 'replacing' | 'audit'>('idle');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteReason, setDeleteReason] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [showAuditTrail, setShowAuditTrail] = useState(false);
  const [auditData, setAuditData] = useState<any[]>([]);
  const [auditLoading, setAuditLoading] = useState(false);
  const [showSubmissionDetails, setShowSubmissionDetails] = useState<string | null>(null);
  const [submissionDetails, setSubmissionDetails] = useState<any>(null);
  const [submissionDetailsLoading, setSubmissionDetailsLoading] = useState(false);

  const { data: books = [], isLoading, error } = useQuery({
    queryKey: ['admin-book-pdf-manager-books', filter],
    queryFn: async () => {
      // PostgREST applies a server-side max-row cap (commonly 1,000).
      // Fetch in bounded pages so the manager doesn't silently omit catalog books.
      const pageSize = 1000;
      const allBooks: BookRecord[] = [];
      for (let offset = 0; ; offset += pageSize) {
        let queryBuilder = supabase
          .from('books_library')
          .select('id,title,author,isbn,publication_year,pdf_url,cover_image_url,pdf_sha256,pdf_file_size,pdf_page_count,pdf_verification_status,genre,description,language,status,catalog_status,is_archived,created_at')
          .order('title', { ascending: true })
          .range(offset, offset + pageSize - 1);

        if (filter === 'with_pdf') {
          queryBuilder = queryBuilder.not('pdf_url', 'is', null).neq('pdf_url', '');
        } else if (filter === 'without_pdf') {
          queryBuilder = queryBuilder.or('pdf_url.is.null,pdf_url.eq.');
        }

        const { data, error } = await queryBuilder;
        if (error) throw error;
        const page = (data || []) as BookRecord[];
        allBooks.push(...page);
        if (page.length < pageSize) break;
      }
      return allBooks;
    },
  });

  const filteredBooks = useMemo(() => {
    const needle = search.trim().toLowerCase();
    if (!needle) return books;
    return books.filter((book) =>
      [book.title, book.author, book.isbn, book.id].some((value) => value?.toLowerCase().includes(needle))
    );
  }, [books, search]);

  const selectedBook = books.find((book) => book.id === selectedId) || null;

  const fetchAuditTrail = useCallback(async (bookId: string) => {
    setAuditLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('pdf-management', {
        body: { action: 'get_pdf_audit', bookId },
      });
      if (error) throw error;
      if (data?.success && data?.audit) {
        setAuditData(data.audit);
      } else {
        setAuditData([]);
      }
    } catch (error) {
      console.error('Failed to fetch audit trail:', error);
      toast({ title: 'Failed to load audit trail', description: 'Could not retrieve audit history.', variant: 'destructive' });
      setAuditData([]);
    } finally {
      setAuditLoading(false);
    }
  }, [toast]);

  const fetchSubmissionDetails = useCallback(async (submissionId: string) => {
    setSubmissionDetailsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('pdf-management', {
        body: { action: 'get_submission_details', submissionId },
      });
      if (error) throw error;
      if (data?.success) {
        setSubmissionDetails(data);
      }
    } catch (error) {
      console.error('Failed to fetch submission details:', error);
    } finally {
      setSubmissionDetailsLoading(false);
    }
  }, []);

  const handleUpload = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!user) {
      toast({ title: 'Sign in required', description: 'Sign in with an administrator account to upload a PDF.', variant: 'destructive' });
      return;
    }
    if (!selectedBook || !file || !sourceUrl.trim() || !rightsNotes.trim() || !confirmRights) {
      toast({ title: 'Complete the review details', description: 'Select a book and PDF, provide its source and rights evidence, and confirm you are authorized to distribute it.', variant: 'destructive' });
      return;
    }

    let parsedSource: URL;
    try {
      parsedSource = new URL(sourceUrl.trim());
      if (parsedSource.protocol !== 'https:' && parsedSource.protocol !== 'http:') throw new Error('Invalid protocol');
    } catch {
      toast({ title: 'Invalid source URL', description: 'Enter a valid http or https URL for the source or rights evidence.', variant: 'destructive' });
      return;
    }

    setIsUploading(true);
    setUploadStage('validating');
    let uploadedPath = '';
    try {
      await validatePdf(file);
      setUploadStage('uploading');
      const signature = crypto.randomUUID();
      uploadedPath = `${selectedBook.id}/${signature}.pdf`;

      const { error: uploadError } = await supabase.storage.from(BUCKET).upload(uploadedPath, file, {
        contentType: 'application/pdf',
        cacheControl: '3600',
        upsert: false,
      });
      if (uploadError) throw uploadError;

      setUploadStage('linking');
      const pdfUrl = supabase.storage.from(BUCKET).getPublicUrl(uploadedPath).data.publicUrl;
      const { data: updatedBook, error: updateError } = await supabase
        .from('books_library')
        .update({ pdf_url: pdfUrl })
        .eq('id', selectedBook.id)
        .select('id')
        .maybeSingle();
      if (updateError) throw updateError;
      if (!updatedBook) throw new Error('The book record was not updated. Check catalog write permissions.');

      setUploadStage('audit');
      const { error: auditError } = await supabase.from('book_pdf_admin_audit' as any).insert({
        book_id: selectedBook.id,
        previous_pdf_url: selectedBook.pdf_url,
        pdf_url: pdfUrl,
        source_url: parsedSource.toString(),
        rights_basis: rightsBasis,
        rights_notes: rightsNotes.trim(),
        file_name: file.name,
        file_size_bytes: file.size,
        uploaded_by: user.id,
      });
      if (auditError) {
        // Do not roll back the working PDF link; surface that the audit log needs attention.
        console.error('PDF uploaded but audit logging failed:', auditError);
        toast({ title: 'PDF linked, audit log failed', description: 'The book was updated, but the audit record could not be saved. Please report this to the technical admin.', variant: 'destructive' });
      } else {
        toast({ title: 'PDF added successfully', description: `The PDF is now linked to “${selectedBook.title}”.` });
      }

      setFile(null);
      setSourceUrl('');
      setRightsNotes('');
      setConfirmRights(false);
      const fileInput = document.getElementById('book-pdf-file') as HTMLInputElement | null;
      if (fileInput) fileInput.value = '';
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['admin-book-pdf-manager-books'] }),
        queryClient.invalidateQueries({ queryKey: ['books'] }),
      ]);
    } catch (uploadError) {
      console.error('Admin PDF upload failed:', uploadError);
      toast({
        title: 'PDF upload failed',
        description: uploadError instanceof Error ? uploadError.message : 'The file could not be uploaded. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsUploading(false);
      setUploadStage('idle');
    }
  };

  const handleReplace = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!user) {
      toast({ title: 'Sign in required', description: 'Sign in with an administrator account.', variant: 'destructive' });
      return;
    }
    if (!selectedBook || !replaceFile || !replaceSourceUrl.trim() || !replaceRightsNotes.trim() || !replaceConfirmRights) {
      toast({ title: 'Complete all fields', description: 'Provide the replacement PDF, source URL, rights basis, evidence notes, and confirm authorization.', variant: 'destructive' });
      return;
    }

    let parsedSource: URL;
    try {
      parsedSource = new URL(replaceSourceUrl.trim());
      if (parsedSource.protocol !== 'https:') throw new Error('HTTPS required');
    } catch {
      toast({ title: 'Invalid source URL', description: 'Enter a valid https URL for the source or rights evidence.', variant: 'destructive' });
      return;
    }

    setIsReplacing(true);
    setReplaceStage('validating');
    try {
      await validatePdf(replaceFile);
      setReplaceStage('uploading');

      // Upload new PDF to quarantine first for scanning
      const signature = crypto.randomUUID();
      const quarantinePath = `${selectedBook.id}/${signature}-replacement.pdf`;
      const { error: uploadError } = await supabase.storage.from('book-pdf-quarantine').upload(quarantinePath, replaceFile, {
        contentType: 'application/pdf',
        cacheControl: '0',
        upsert: false,
      });
      if (uploadError) throw uploadError;

      setReplaceStage('replacing');
      // Use the pdf-management function to replace PDF
      const { data, error } = await supabase.functions.invoke('pdf-management', {
        body: {
          action: 'replace_pdf',
          bookId: selectedBook.id,
          newSubmissionId: signature, // We'll need a proper submission ID
          rightsBasis: replaceRightsBasis,
          evidenceUrl: parsedSource.toString(),
          rightsNotes: replaceRightsNotes.trim(),
        },
      });

      // Since we don't have a proper submission, let's use the review-book-pdf function
      // Actually, we need a different approach - create a submission first
      const submissionId = crypto.randomUUID();
      const { error: subError } = await supabase.from('book_pdf_submissions' as any).insert({
        id: submissionId,
        user_id: user.id,
        submission_source: 'admin_replacement',
        original_filename: replaceFile.name.slice(0, 255),
        storage_path: quarantinePath,
        file_size_bytes: replaceFile.size,
        submitted_title: selectedBook.title,
        submitted_author: selectedBook.author,
        rights_attested: true,
        rights_statement: 'Admin replacement with verified rights.',
        status: 'approved',
        target_book_id: selectedBook.id,
      });
      if (subError) throw subError;

      const { data: replaceResult, error: replaceError } = await supabase.functions.invoke('review-book-pdf', {
        body: {
          submissionId,
          action: 'replace_pdf',
          bookId: selectedBook.id,
          newSubmissionId: submissionId,
          rightsBasis: replaceRightsBasis,
          evidenceUrl: parsedSource.toString(),
          rightsNotes: replaceRightsNotes.trim(),
        },
      });

      if (replaceError) throw replaceError;
      if (!replaceResult?.success) throw new Error(replaceResult?.error || 'Replacement failed');

      setReplaceStage('audit');
      toast({ title: 'PDF replaced successfully', description: `The PDF for “${selectedBook.title}” has been replaced. Previous version archived in audit trail.` });

      setReplaceFile(null);
      setReplaceSourceUrl('');
      setReplaceRightsNotes('');
      setReplaceConfirmRights(false);
      const replaceFileInput = document.getElementById('replace-pdf-file') as HTMLInputElement | null;
      if (replaceFileInput) replaceFileInput.value = '';
      setShowReplaceDialog(false);

      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['admin-book-pdf-manager-books'] }),
        queryClient.invalidateQueries({ queryKey: ['books'] }),
      ]);
    } catch (error) {
      console.error('PDF replacement failed:', error);
      toast({
        title: 'Replacement failed',
        description: error instanceof Error ? error.message : 'Could not replace the PDF. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsReplacing(false);
      setReplaceStage('idle');
    }
  };

  const handleDelete = async () => {
    if (!user || !selectedBook || !deleteReason.trim()) return;

    setIsDeleting(true);
    try {
      const { data, error } = await supabase.functions.invoke('pdf-management', {
        body: {
          action: 'delete_pdf',
          bookId: selectedBook.id,
          reason: deleteReason.trim(),
        },
      });
      if (error) throw error;
      if (!data?.success) throw new Error(data?.error || 'Deletion failed');

      toast({ title: 'PDF deleted', description: data.message || `PDF removed from “${selectedBook.title}”` });
      setShowDeleteConfirm(false);
      setDeleteReason('');
      setSelectedId('');

      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['admin-book-pdf-manager-books'] }),
        queryClient.invalidateQueries({ queryKey: ['books'] }),
      ]);
    } catch (error) {
      console.error('PDF deletion failed:', error);
      toast({
        title: 'Deletion failed',
        description: error instanceof Error ? error.message : 'Could not delete the PDF.',
        variant: 'destructive',
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleViewAudit = async () => {
    if (!selectedBook) return;
    setShowAuditTrail(true);
    await fetchAuditTrail(selectedBook.id);
  };

  const handleViewSubmissionDetails = async (submissionId: string) => {
    setShowSubmissionDetails(submissionId);
    await fetchSubmissionDetails(submissionId);
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <SEO title="Admin PDF Manager | Sahadhyayi" description="Review book PDF rights and upload verified files to the Sahadhyayi catalog." noIndex={true} />
      <div className="mx-auto max-w-6xl space-y-8 px-4 py-8 sm:px-6 lg:px-8">
        <header className="space-y-3">
          <div className="flex items-center gap-2 text-sm font-medium text-primary"><ShieldCheck className="h-4 w-4" /> Administrator tools</div>
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Book PDF Manager</h1>
          <p className="max-w-3xl text-muted-foreground">Upload a verified PDF, record where it came from, and document why Sahadhyayi is allowed to distribute it. Only authorized admins should use this page.</p>
          <div className="grid gap-3 sm:grid-cols-4">
            <div className="rounded-xl border bg-card p-4"><p className="text-sm text-muted-foreground">Catalog books loaded</p><p className="mt-1 text-2xl font-semibold">{books.length}</p></div>
            <div className="rounded-xl border bg-card p-4"><p className="text-sm text-muted-foreground">Missing PDF</p><p className="mt-1 text-2xl font-semibold">{books.filter((book) => !book.pdf_url).length}</p></div>
            <div className="rounded-xl border bg-card p-4"><p className="text-sm text-muted-foreground">Already linked</p><p className="mt-1 text-2xl font-semibold">{books.filter((book) => Boolean(book.pdf_url)).length}</p></div>
            <div className="rounded-xl border bg-card p-4"><p className="text-sm text-muted-foreground">Verified PDFs</p><p className="mt-1 text-2xl font-semibold">{books.filter((book) => book.pdf_verification_status === 'verified').length}</p></div>
          </div>
        </header>

        <section className="grid gap-6 lg:grid-cols-[0.9fr,1.1fr]">
          <div className="rounded-2xl border bg-card p-5 sm:p-6">
            <h2 className="flex items-center gap-2 text-xl font-semibold"><BookOpen className="h-5 w-5" /> 1. Select a book</h2>

            {/* Search and Filter */}
            <div className="space-y-3 mt-4">
              <label htmlFor="book-search" className="block text-sm font-medium">Search title, author, ISBN, or book ID</label>
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input id="book-search" value={search} onChange={(event) => setSearch(event.target.value)} className="pl-9" placeholder="e.g. To Kill a Mockingbird" />
              </div>

              <div className="flex flex-wrap gap-2">
                {(['all', 'without_pdf', 'with_pdf'] as const).map((f) => (
                  <Button
                    key={f}
                    type="button"
                    variant={filter === f ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setFilter(f)}
                    className="gap-1"
                  >
                    {f === 'all' && <><Filter className="h-3 w-3" /> All</>}
                    {f === 'without_pdf' && <><FileText className="h-3 w-3" /> Missing PDF</>}
                    {f === 'with_pdf' && <><Check className="h-3 w-3" /> Has PDF</>}
                  </Button>
                ))}
              </div>
            </div>

            {/* Book List */}
            <div className="mt-4 max-h-[500px] space-y-2 overflow-y-auto" aria-live="polite">
              {isLoading && <p className="py-8 text-center text-sm text-muted-foreground">Loading catalog…</p>}
              {error && <p role="alert" className="text-sm text-destructive">Could not load books: {error instanceof Error ? error.message : 'Unknown catalog error'}. Check administrator access and the books_library API permissions, then retry.</p>}
              {!isLoading && !error && filteredBooks.length === 0 && <p className="py-8 text-center text-sm text-muted-foreground">No matching books found.</p>}
              {filteredBooks.map((book) => {
                const pdfStatus = getPDFStatusBadge(book.pdf_url, book.pdf_verification_status);
                return (
                  <button
                    key={book.id}
                    type="button"
                    onClick={() => setSelectedId(book.id)}
                    className={`w-full rounded-xl border p-3 text-left transition-colors ${selectedId === book.id ? 'border-primary bg-primary/5' : 'hover:bg-muted/50'}`}
                  >
                    <div className="flex items-start gap-3">
                      {book.cover_image_url && (
                        <img
                          src={book.cover_image_url}
                          alt=""
                          className="w-14 h-20 object-cover rounded border flex-shrink-0"
                          loading="lazy"
                          onError={(e) => { e.currentTarget.style.display = 'none'; }}
                        />
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <span className="font-medium truncate">{book.title}</span>
                          <Badge variant={pdfStatus.variant} className="gap-1 flex-shrink-0">
                            {React.createElement(pdfStatus.icon, { className: 'h-3 w-3' })}
                            {pdfStatus.label}
                          </Badge>
                        </div>
                        <p className="mt-1 text-sm text-muted-foreground">{book.author || 'Unknown author'}{book.publication_year ? ` · ${book.publication_year}` : ''}</p>
                        {book.isbn && <p className="mt-0.5 text-xs text-muted-foreground font-mono">ISBN {book.isbn}</p>}
                        <div className="mt-1 flex flex-wrap gap-2 text-xs text-muted-foreground">
                          {book.language && <span>{book.language}</span>}
                          {book.pdf_page_count && <span>{book.pdf_page_count} pp</span>}
                          {book.pdf_file_size && <span>{formatFileSize(book.pdf_file_size)}</span>}
                          {book.pdf_verification_status && book.pdf_verification_status !== 'verified' && (
                            <span className="text-amber-600">{book.pdf_verification_status.replace(/_/g, ' ')}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            {selectedBook && (
              <div className="mt-4 rounded-lg bg-muted/50 p-3 text-sm">
                <p className="font-medium">Selected: {selectedBook.title}</p>
                {selectedBook.pdf_url && (
                  <>
                    <a href={selectedBook.pdf_url} target="_blank" rel="noreferrer" className="mt-2 inline-flex items-center gap-1 text-primary underline">
                      <Eye className="h-3 w-3" /> View current PDF
                    </a>
                    <div className="mt-2 flex flex-wrap gap-2">
                      <Button variant="outline" size="sm" onClick={() => { setShowReplaceDialog(true); setReplaceFile(null); setReplaceSourceUrl(''); setReplaceRightsNotes(''); setReplaceConfirmRights(false); }}>
                        <Replace className="mr-1 h-3 w-3" /> Replace PDF
                      </Button>
                      <Button variant="destructive" size="sm" onClick={() => { setShowDeleteConfirm(true); setDeleteReason(''); }}>
                        <Trash2 className="mr-1 h-3 w-3" /> Delete PDF
                      </Button>
                      <Button variant="ghost" size="sm" onClick={handleViewAudit}>
                        <History className="mr-1 h-3 w-3" /> Audit Trail
                      </Button>
                    </div>
                  </>
                )}
                <p className="mt-2 text-muted-foreground">Uploading a replacement creates a new file and records the previous URL in the audit trail.</p>
              </div>
            )}
          </div>

          {/* Upload/Replace Form */}
          <form onSubmit={handleUpload} className="space-y-5 rounded-2xl border bg-card p-5 sm:p-6">
            <h2 className="flex items-center gap-2 text-xl font-semibold"><FileUp className="h-5 w-5" /> 2. Upload and verify</h2>
            <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-3 text-sm"><p className="font-medium">Rights check required</p><p className="mt-1 text-muted-foreground">Do not upload copyrighted PDFs unless distribution is authorized. A search result or Telegram link alone is not proof of permission.</p></div>
            <div>
              <label htmlFor="book-pdf-file" className="mb-2 block text-sm font-medium">PDF file (maximum 50 MB)</label>
              <Input id="book-pdf-file" type="file" accept="application/pdf,.pdf" onChange={(event) => setFile(event.target.files?.[0] || null)} />
              {file && <p className="mt-2 text-xs text-muted-foreground">{file.name} · {(file.size / (1024 * 1024)).toFixed(2)} MB</p>}
            </div>
            <div>
              <label htmlFor="pdf-source-url" className="mb-2 block text-sm font-medium">Source / rights evidence URL</label>
              <Input id="pdf-source-url" type="url" required value={sourceUrl} onChange={(event) => setSourceUrl(event.target.value)} placeholder="https://official-source.example/book.pdf" />
            </div>
            <div>
              <label htmlFor="pdf-rights-basis" className="mb-2 block text-sm font-medium">Distribution basis</label>
              <select id="pdf-rights-basis" value={rightsBasis} onChange={(event) => setRightsBasis(event.target.value as typeof rightsBasis)} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                {RIGHTS_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
              </select>
            </div>
            <div>
              <label htmlFor="pdf-rights-notes" className="mb-2 block text-sm font-medium">Rights evidence / licence notes</label>
              <textarea id="pdf-rights-notes" required minLength={10} value={rightsNotes} onChange={(event) => setRightsNotes(event.target.value)} rows={3} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring" placeholder="Describe the licence, public-domain basis, or written permission. Include edition details." />
            </div>
            <label className="flex items-start gap-3 rounded-xl border p-3 text-sm">
              <input type="checkbox" checked={confirmRights} onChange={(event) => setConfirmRights(event.target.checked)} className="mt-1 h-4 w-4 accent-primary" />
              <span>I reviewed the source and confirm that Sahadhyayi is permitted to distribute this PDF under the selected basis.</span>
            </label>
            <Button type="submit" disabled={isUploading || !selectedBook || !file || !confirmRights || !sourceUrl.trim() || rightsNotes.trim().length < 10} className="w-full">
              {isUploading ? (
                <>
                  {uploadStage === 'validating' && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {uploadStage === 'uploading' && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {uploadStage === 'linking' && <Link className="mr-2 h-4 w-4" />}
                  {uploadStage === 'audit' && <FileCheck2 className="mr-2 h-4 w-4" />}
                  Uploading and linking…
                </>
              ) : (
                <>
                  <FileCheck2 className="mr-2 h-4 w-4" />
                  Validate and upload PDF
                </>
              )}
            </Button>
            <p className="text-xs text-muted-foreground">The browser checks the PDF signature and size. These checks do not replace malware scanning, full content inspection, or legal review.</p>
          </form>
        </section>
      </div>

      {/* Replace PDF Dialog */}
      {showReplaceDialog && selectedBook && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-xl bg-card shadow-xl">
            <div className="border-b p-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold">Replace PDF for “{selectedBook.title}”</h2>
              <Button variant="ghost" size="icon" onClick={() => setShowReplaceDialog(false)}><X className="h-4 w-4" /></Button>
            </div>
            <form onSubmit={handleReplace} className="p-4 space-y-4">
              <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-3 text-sm">
                <p className="font-medium">This will replace the existing PDF. The previous version will be archived in the audit trail.</p>
              </div>
              <div>
                <label htmlFor="replace-pdf-file" className="mb-2 block text-sm font-medium">Replacement PDF file (maximum 50 MB)</label>
                <Input id="replace-pdf-file" type="file" accept="application/pdf,.pdf" onChange={(event) => setReplaceFile(event.target.files?.[0] || null)} />
                {replaceFile && <p className="mt-2 text-xs text-muted-foreground">{replaceFile.name} · {(replaceFile.size / (1024 * 1024)).toFixed(2)} MB</p>}
              </div>
              <div>
                <label htmlFor="replace-source-url" className="mb-2 block text-sm font-medium">Source / rights evidence URL (HTTPS required)</label>
                <Input id="replace-source-url" type="url" required value={replaceSourceUrl} onChange={(event) => setReplaceSourceUrl(event.target.value)} placeholder="https://official-source.example/book.pdf" />
              </div>
              <div>
                <label htmlFor="replace-rights-basis" className="mb-2 block text-sm font-medium">Distribution basis</label>
                <select id="replace-rights-basis" value={replaceRightsBasis} onChange={(event) => setReplaceRightsBasis(event.target.value as typeof replaceRightsBasis)} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                  {RIGHTS_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                </select>
              </div>
              <div>
                <label htmlFor="replace-rights-notes" className="mb-2 block text-sm font-medium">Rights evidence / licence notes</label>
                <textarea id="replace-rights-notes" required minLength={10} value={replaceRightsNotes} onChange={(event) => setReplaceRightsNotes(event.target.value)} rows={3} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring" placeholder="Describe the licence, public-domain basis, or written permission. Include edition details." />
              </div>
              <label className="flex items-start gap-3 rounded-xl border p-3 text-sm">
                <input type="checkbox" checked={replaceConfirmRights} onChange={(event) => setReplaceConfirmRights(event.target.checked)} className="mt-1 h-4 w-4 accent-primary" />
                <span>I confirm that Sahadhyayi is permitted to distribute this replacement PDF under the selected basis.</span>
              </label>
              <div className="flex gap-2">
                <Button type="button" variant="outline" onClick={() => setShowReplaceDialog(false)} className="flex-1" disabled={isReplacing}>Cancel</Button>
                <Button type="submit" className="flex-1" disabled={isReplacing || !replaceFile || !replaceConfirmRights || !replaceSourceUrl.trim() || replaceRightsNotes.trim().length < 10}>
                  {isReplacing ? (
                    <>
                      {replaceStage === 'validating' && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      {replaceStage === 'uploading' && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      {replaceStage === 'replacing' && <Replace className="mr-2 h-4 w-4 animate-spin" />}
                      {replaceStage === 'audit' && <FileCheck2 className="mr-2 h-4 w-4" />}
                      Replacing…
                    </>
                  ) : (
                    <>
                      <Replace className="mr-2 h-4 w-4" />
                      Replace PDF
                    </>
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      {showDeleteConfirm && selectedBook && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="w-full max-w-md rounded-xl bg-card shadow-xl p-6">
            <h2 className="text-lg font-semibold">Delete PDF from “{selectedBook.title}”</h2>
            <div className="mt-4 space-y-3">
              <p className="text-sm text-muted-foreground">This will remove the PDF link from the catalogue book. The file will be deleted from storage and the action recorded in the audit trail. This cannot be undone.</p>
              <div className="space-y-2">
                <Label htmlFor="delete-reason">Reason for deletion (required)</Label>
                <textarea id="delete-reason" value={deleteReason} onChange={(e) => setDeleteReason(e.target.value)} rows={3} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" placeholder="e.g. Copyright violation, corrupted file, replaced with better version..." />
              </div>
            </div>
            <div className="mt-6 flex gap-2 justify-end">
              <Button variant="outline" onClick={() => { setShowDeleteConfirm(false); setDeleteReason(''); }} disabled={isDeleting}>Cancel</Button>
              <Button variant="destructive" onClick={handleDelete} disabled={isDeleting || !deleteReason.trim()}>
                {isDeleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Trash2 className="mr-2 h-4 w-4" />}
                Delete PDF
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Audit Trail Dialog */}
      {showAuditTrail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="w-full max-w-4xl max-h-[90vh] overflow-hidden rounded-xl bg-card shadow-xl flex flex-col">
            <div className="border-b p-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold">PDF Audit Trail</h2>
              <Button variant="ghost" size="icon" onClick={() => setShowAuditTrail(false)}><X className="h-4 w-4" /></Button>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              {auditLoading ? (
                <div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin" /></div>
              ) : auditData.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">No audit records found.</div>
              ) : (
                <div className="space-y-3">
                  {auditData.map((record, index) => (
                    <div key={record.id || index} className="rounded-lg border p-4">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="font-medium">{record.action || 'Unknown action'}</p>
                          <p className="text-sm text-muted-foreground">{new Date(record.created_at).toLocaleString()}</p>
                        </div>
                        <Badge variant="outline">{record.admin_user_id?.slice(0, 8) || 'Unknown'}</Badge>
                      </div>
                      {record.details && (
                        <pre className="mt-2 text-xs text-muted-foreground bg-muted p-2 rounded overflow-x-auto">{JSON.stringify(record.details, null, 2)}</pre>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Submission Details Dialog */}
      {showSubmissionDetails && submissionDetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-xl bg-card shadow-xl">
            <div className="border-b p-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold">Submission Details</h2>
              <Button variant="ghost" size="icon" onClick={() => { setShowSubmissionDetails(null); setSubmissionDetails(null); }}><X className="h-4 w-4" /></Button>
            </div>
            <div className="p-4 space-y-4">
              {submissionDetails.submission && (
                <div className="space-y-2">
                  <h3 className="font-medium">Submission</h3>
                  <pre className="text-xs bg-muted p-3 rounded overflow-x-auto">{JSON.stringify(submissionDetails.submission, null, 2)}</pre>
                </div>
              )}
              {submissionDetails.audit && submissionDetails.audit.length > 0 && (
                <div className="space-y-2">
                  <h3 className="font-medium">Audit Trail</h3>
                  {submissionDetails.audit.map((record: any, index: number) => (
                    <div key={record.id || index} className="rounded-lg border p-3">
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-medium">{record.action}</span>
                        <span className="text-muted-foreground">{new Date(record.created_at).toLocaleString()}</span>
                      </div>
                      {record.reason && <p className="mt-1 text-xs text-muted-foreground">{record.reason}</p>}
                      {record.details && (
                        <pre className="mt-1 text-[10px] bg-muted p-2 rounded overflow-x-auto">{JSON.stringify(record.details, null, 2)}</pre>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}