import React, { useRef, useState, useCallback } from 'react';
import { QueryClient, QueryClientProvider, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client-universal';
import { useAuth } from '@/contexts/authHelpers';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { FileUp, Loader2, ShieldCheck, Search, AlertCircle, CheckCircle2, XCircle, ArrowLeft, ArrowRight, Info, RotateCw, RefreshCw, X } from 'lucide-react';
import { CatalogueSelector, CatalogueBook } from './CatalogueSelector';

const BUCKET = 'book-pdf-quarantine';
const MAX_BYTES = 50 * 1024 * 1024;

// This contribution dialog owns its submission-history cache and can also be
// rendered on public pages that do not mount the app-wide React Query provider.
const submissionQueryClient = new QueryClient({
  defaultOptions: { queries: { retry: false } },
});

type Submission = {
  id: string;
  original_filename: string;
  submitted_title: string | null;
  submitted_author: string | null;
  status: string;
  created_at: string;
  published_book_id?: string | null;
};

async function validatePdf(file: File) {
  if (file.size <= 0 || file.size > MAX_BYTES) throw new Error('Choose a PDF between 1 byte and 50 MB.');
  // Browsers (especially mobile Safari/Android file pickers) frequently report
  // application/octet-stream or an empty MIME type for genuine PDFs. Do not use
  // file.type as the source of truth; the file's magic bytes are authoritative.
  const signature = new TextDecoder().decode(new Uint8Array(await file.slice(0, 5).arrayBuffer()));
  if (signature !== '%PDF-') throw new Error('The selected file is not a valid PDF (missing %PDF- signature).');
}

const statusLabel: Record<string, string> = {
  uploaded: 'Uploaded — awaiting checks',
  queued: 'Queued for verification',
  scanning: 'Safety scan in progress',
  extracting: 'Reading book details',
  matching: 'Matching catalogue records',
  needs_review: 'Needs human review',
  approved: 'Approved — awaiting publishing',
  rejected: 'Not approved',
  failed: 'Processing failed',
};

const statusIcon: Record<string, React.ComponentType<{ className?: string }>> = {
  uploaded: FileUp,
  queued: Loader2,
  scanning: ShieldCheck,
  extracting: Search,
  matching: RotateCw,
  needs_review: AlertCircle,
  approved: CheckCircle2,
  rejected: XCircle,
  failed: XCircle,
};

function formatFileSize(bytes: number): string {
  const mb = bytes / (1024 * 1024);
  return mb >= 1 ? `${mb.toFixed(1)} MB` : `${(bytes / 1024).toFixed(0)} KB`;
}

function ContributeBookPdfDialogContent() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<'search' | 'upload' | 'confirm'>('search');
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [rightsAttested, setRightsAttested] = useState(false);
  const [busy, setBusy] = useState(false);
  const [busyStage, setBusyStage] = useState<'idle' | 'validating' | 'uploading' | 'verifying' | 'matching'>('idle');
  const [selectedBook, setSelectedBook] = useState<CatalogueBook | null>(null);
  const [selectedBookIds, setSelectedBookIds] = useState<string[]>([]);
  const [matchedCandidates, setMatchedCandidates] = useState<CatalogueBook[]>([]);
  const [showExistingMatch, setShowExistingMatch] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const maxRetries = 3;

  const { data: submissions = [], isLoading } = useQuery({
    queryKey: ['my-book-pdf-submissions', user?.id],
    enabled: Boolean(user && open),
    queryFn: async () => {
      const { data, error } = await supabase.from('book_pdf_submissions' as any).select('id,original_filename,submitted_title,submitted_author,status,created_at,published_book_id').eq('user_id', user!.id).order('created_at', { ascending: false }).limit(10);
      if (error) throw error;
      return (data || []) as Submission[];
    },
  });

  const handleCatalogueSelection = useCallback((ids: string[]) => {
    setSelectedBookIds(ids);
    if (ids.length > 0) {
      // For single selection, we'll use the first ID
      // The actual book object will be fetched when needed
    }
  }, []);

  const handleSearchExisting = async () => {
    if (!title.trim() && !author.trim()) {
      toast({ title: 'Enter book details', description: 'Provide a title or author to search for existing catalogue matches.', variant: 'destructive' });
      return;
    }
    setBusy(true);
    setBusyStage('matching');
    try {
      const searchTerm = `${title.trim()} ${author.trim()}`.trim();
      const { data, error } = await supabase.functions.invoke('review-book-pdf', {
        body: { action: 'search_catalogue', query: searchTerm, page: 1, pageSize: 10 },
      });
      if (error) throw error;
      if (data?.success && data?.books?.length > 0) {
        setMatchedCandidates(data.books as CatalogueBook[]);
        setShowExistingMatch(true);
        setStep('search'); // Stay on search step but show matches
      } else {
        toast({ title: 'No matches found', description: 'No existing catalogue books matched your search. You can proceed to upload a new PDF.' });
        setStep('upload');
      }
    } catch (error) {
      console.error('Catalogue search failed:', error);
      toast({ title: 'Search failed', description: 'Could not search the catalogue. You can still proceed to upload.', variant: 'destructive' });
      setStep('upload');
    } finally {
      setBusy(false);
      setBusyStage('idle');
    }
  };

  const handleSelectExistingBook = (book: CatalogueBook) => {
    setSelectedBook(book);
    setShowExistingMatch(false);
    if (book.pdf_url) {
      toast({ title: 'PDF already exists', description: 'This book already has a PDF linked. You can still contribute a new version for review.', variant: 'default' });
    }
    setStep('confirm');
  };

  const handleBackToUpload = () => {
    setSelectedBook(null);
    setShowExistingMatch(false);
    setStep('upload');
  };

  const submit = async (event?: React.SyntheticEvent) => {
    event?.preventDefault();
    if (!user) {
      toast({ title: 'Sign in required', description: 'Sign in before contributing a PDF.', variant: 'destructive' });
      return;
    }
    if (!file || !rightsAttested) {
      toast({ title: 'Complete the form', description: 'Choose a PDF and confirm that you are authorized to submit it.', variant: 'destructive' });
      return;
    }

    setBusy(true);
    setBusyStage('validating');

    try {
      await validatePdf(file);
    } catch (validationErr) {
      setBusy(false);
      setBusyStage('idle');
      toast({
        title: 'Submission failed',
        description: validationErr instanceof Error ? validationErr.message : 'Invalid PDF',
        variant: 'destructive',
      });
      return;
    }

    const id = crypto.randomUUID();
    const path = `${user.id}/${id}/source.pdf`;
    let submissionCreated = false;
    let attempt = 0;

    const attemptUpload = async (): Promise<boolean> => {
      try {
        setBusyStage('uploading');

        const { error: insertError } = await supabase.from('book_pdf_submissions' as any).insert({
          id,
          user_id: user.id,
          submission_source: 'user_upload',
          original_filename: file.name.slice(0, 255),
          storage_path: path,
          file_size_bytes: file.size,
          submitted_title: title.trim() || null,
          submitted_author: author.trim() || null,
          rights_attested: true,
          rights_statement: 'Contributor attests they are authorized to submit this file for review.',
          status: 'uploaded',
          target_book_id: selectedBook?.id || null,
        });
        if (insertError) throw insertError;
        submissionCreated = true;

        const { error: uploadError } = await supabase.storage.from(BUCKET).upload(path, file, {
          contentType: 'application/pdf',
          cacheControl: '0',
          upsert: false,
        });
        if (uploadError) throw uploadError;

        setBusyStage('verifying');
        // Kick off AI verification after the private upload succeeds. Failure to
        // start the worker must not turn a successful upload into a failed submission;
        // the admin queue can retry verification later.
        const { error: verificationError } = await supabase.functions.invoke('verify-book-pdf', {
          body: { submissionId: id },
        });
        if (verificationError) {
          console.warn('PDF was uploaded privately but automatic verification did not start.', verificationError);
        }

        toast({ title: 'PDF submitted privately', description: 'Your file is quarantined for verification. It is not publicly downloadable.' });
        setFile(null);
        setTitle('');
        setAuthor('');
        setRightsAttested(false);
        setSelectedBook(null);
        setSelectedBookIds([]);
        setMatchedCandidates([]);
        setShowExistingMatch(false);
        setStep('search');
        if (fileRef.current) fileRef.current.value = '';
        await queryClient.invalidateQueries({ queryKey: ['my-book-pdf-submissions', user.id] });
        return true;
      } catch (error) {
        // Supabase/PostgREST/Storage failures are plain objects, not necessarily
        // Error instances. Preserve their actionable message instead of hiding
        // every backend failure behind the same generic toast.
        const failure = error && typeof error === 'object'
          ? error as { message?: unknown; code?: unknown; details?: unknown; hint?: unknown }
          : null;
        const failureMessage = error instanceof Error
          ? error.message
          : typeof failure?.message === 'string'
            ? failure.message
            : 'The PDF could not be submitted. Please try again.';
        console.error('Book PDF contribution failed', {
          stage: submissionCreated ? 'storage-upload-or-verification' : 'submission-record-or-validation',
          code: typeof failure?.code === 'string' ? failure.code : undefined,
          details: typeof failure?.details === 'string' ? failure.details : undefined,
          hint: typeof failure?.hint === 'string' ? failure.hint : undefined,
          error,
        });
        toast({
          title: submissionCreated ? 'Upload incomplete' : 'Submission failed',
          description: failureMessage,
          variant: 'destructive',
        });
        return false;
      }
    };

    // Retry logic for network failures
    while (attempt <= maxRetries) {
      const success = await attemptUpload();
      if (success) break;
      attempt++;
      setRetryCount(attempt);
      if (attempt <= maxRetries) {
        await new Promise((resolve) => setTimeout(resolve, 1000 * attempt)); // Exponential backoff
      }
    }

    setBusy(false);
    setBusyStage('idle');
    setRetryCount(0);
  };

  const getStageLabel = () => {
    switch (busyStage) {
      case 'validating': return 'Validating PDF…';
      case 'uploading': return 'Uploading to secure storage…';
      case 'verifying': return 'Starting AI verification…';
      case 'matching': return 'Searching catalogue…';
      default: return 'Submitting…';
    }
  };

  const getStageProgress = () => {
    switch (busyStage) {
      case 'validating': return 20;
      case 'uploading': return 50;
      case 'verifying': return 80;
      case 'matching': return 40;
      default: return 0;
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2"><FileUp className="h-4 w-4" /> Contribute a PDF</Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Contribute a book PDF</DialogTitle>
          <DialogDescription>Help improve the catalogue. New files stay private while verification and rights review are pending.</DialogDescription>
        </DialogHeader>

        {!user ? (
          <div className="space-y-3 rounded-lg border p-4">
            <p className="text-sm text-muted-foreground">Sign in to submit a PDF and track its review status.</p>
            <Button onClick={() => { setOpen(false); window.location.assign('/signin'); }}>Sign in</Button>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Progress Steps */}
            <div className="flex items-center justify-between relative">
              <div className="absolute top-3 left-0 right-0 h-1 bg-muted" />
              {['search', 'upload', 'confirm'].map((s, i) => (
                <div key={s} className="relative flex flex-col items-center z-10">
                  <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all ${
                    (step === s || (step === 'upload' && s === 'search') || (step === 'confirm' && (s === 'search' || s === 'upload')))
                      ? 'bg-primary border-primary text-primary-foreground'
                      : 'bg-background border-muted text-muted-foreground'
                  }`}>
                    {i + 1}
                  </div>
                  <span className={`mt-1 text-xs font-medium ${step === s ? 'text-foreground' : 'text-muted-foreground'}`}>
                    {s === 'search' && 'Find Book'}
                    {s === 'upload' && 'Upload PDF'}
                    {s === 'confirm' && 'Confirm'}
                  </span>
                </div>
              ))}
            </div>

            {/* Step 1: Search Existing Catalogue */}
            {step === 'search' && (
              <div className="space-y-4 animate-in fade-in slide-in-from-left-2">
                <div className="rounded-lg border border-primary/20 bg-primary/5 p-3 text-sm">
                  <div className="flex items-center gap-2 font-medium"><Search className="h-4 w-4" /> Search catalogue first (optional)</div>
                  <p className="mt-1 text-muted-foreground">Check if the book already exists in our catalogue. If it does, you can link your PDF to the existing record instead of creating a duplicate.</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="contribute-title">Book title</Label>
                  <Input id="contribute-title" value={title} maxLength={500} onChange={(e) => setTitle(e.target.value)} placeholder="Title printed in the book" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contribute-author">Author (optional)</Label>
                  <Input id="contribute-author" value={author} maxLength={500} onChange={(e) => setAuthor(e.target.value)} placeholder="Author name" />
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={handleSearchExisting}
                    disabled={busy || (!title.trim() && !author.trim())}
                    className="flex-1 gap-2"
                  >
                    {busy && busyStage === 'matching' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                    {busy && busyStage === 'matching' ? 'Searching…' : 'Search Catalogue'}
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={() => setStep('upload')}
                    disabled={busy}
                    className="flex-1"
                  >
                    Skip → Upload PDF
                  </Button>
                </div>

                {/* Matched Candidates */}
                {showExistingMatch && matchedCandidates.length > 0 && (
                  <div className="space-y-3 border-t pt-4">
                    <h3 className="font-semibold flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                      Found {matchedCandidates.length} matching book{matchedCandidates.length !== 1 ? 's' : ''}
                    </h3>
                    <p className="text-sm text-muted-foreground">Select a book to link your PDF, or continue to upload as a new entry.</p>
                    <div className="space-y-2 max-h-60 overflow-y-auto">
                      {matchedCandidates.map((candidate) => (
                        <button
                          key={candidate.id}
                          type="button"
                          onClick={() => handleSelectExistingBook(candidate)}
                          disabled={busy}
                          className="w-full rounded-lg border p-3 text-left transition hover:border-primary bg-card flex flex-col gap-1"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <span className="font-medium truncate">{candidate.title}</span>
                            <Badge variant={candidate.pdf_url ? 'secondary' : 'outline'}>
                              {candidate.pdf_url ? 'Has PDF' : 'No PDF'}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {candidate.author || 'Unknown author'}
                            {Boolean(candidate.publication_year) && ` · ${candidate.publication_year}`}
                            {candidate.isbn && ` · ISBN ${candidate.isbn}`}
                            {candidate.language && ` · ${candidate.language}`}
                          </p>
                          {candidate.description && (
                            <p className="text-xs text-muted-foreground line-clamp-2">{candidate.description}</p>
                          )}
                        </button>
                      ))}
                    </div>
                    <Button variant="outline" onClick={() => { setShowExistingMatch(false); setStep('upload'); }} className="w-full">
                      <ArrowLeft className="mr-2 h-4 w-4" /> Back to Upload
                    </Button>
                  </div>
                )}

                {showExistingMatch && matchedCandidates.length === 0 && !busy && (
                  <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm">
                    <div className="flex items-center gap-2 text-amber-800">
                      <Info className="h-4 w-4" />
                      <span>No exact matches found. You can try a different search or proceed to upload.</span>
                    </div>
                    <Button variant="outline" onClick={() => { setShowExistingMatch(false); setStep('upload'); }} className="mt-2 w-full">
                      Continue to Upload
                    </Button>
                  </div>
                )}
              </div>
            )}

            {/* Step 2: Upload PDF */}
            {step === 'upload' && (
              <form onSubmit={submit} className="space-y-4 animate-in fade-in">
                <div className="rounded-lg border border-primary/20 bg-primary/5 p-3 text-sm">
                  <div className="flex items-center gap-2 font-medium"><ShieldCheck className="h-4 w-4" /> Private review process</div>
                  <p className="mt-1 text-muted-foreground">Uploading does not publish the PDF. A valid book match does not by itself establish distribution rights.</p>
                </div>

                {selectedBook && (
                  <div className="rounded-lg border border-green-200 bg-green-50 p-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                        <span className="font-medium text-green-800">Linking to existing catalogue book</span>
                      </div>
                      <Button variant="ghost" size="sm" onClick={handleBackToUpload}>
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                    <p className="mt-1 text-sm text-green-700 font-medium">{selectedBook.title}</p>
                    <p className="text-xs text-green-600">{selectedBook.author || 'Unknown author'}{Boolean(selectedBook.publication_year) && ` · ${selectedBook.publication_year}`}</p>
                    {selectedBook.pdf_url && (
                      <p className="mt-1 text-xs text-amber-700 flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" /> This book already has a PDF. Your submission will be reviewed as a potential replacement or additional edition.
                      </p>
                    )}
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="contribute-pdf">PDF file (max 50 MB)</Label>
                  <Input
                    id="contribute-pdf"
                    ref={fileRef}
                    type="file"
                    accept="application/pdf,.pdf"
                    required
                    onChange={(e) => setFile(e.target.files?.[0] || null)}
                    disabled={busy}
                    className="file:mr-4 file:rounded-md file:border-0 file:bg-primary/10 file:text-primary file:px-3 file:py-1 hover:file:bg-primary/20"
                  />
                  {file && (
                    <div className="flex items-center justify-between text-xs text-muted-foreground bg-muted/50 p-2 rounded">
                      <span className="truncate flex-1">{file.name}</span>
                      <span className="ml-2 font-mono">{formatFileSize(file.size)}</span>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="contribute-title-upload">Book title (optional if linked to catalogue)</Label>
                  <Input id="contribute-title-upload" value={title} maxLength={500} onChange={(e) => setTitle(e.target.value)} placeholder="Title printed in the book" disabled={busy || !!selectedBook} />
                  {selectedBook && <p className="text-xs text-muted-foreground">Title will be taken from the selected catalogue book.</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contribute-author-upload">Author (optional)</Label>
                  <Input id="contribute-author-upload" value={author} maxLength={500} onChange={(e) => setAuthor(e.target.value)} placeholder="Author name" disabled={busy || !!selectedBook} />
                  {selectedBook && <p className="text-xs text-muted-foreground">Author will be taken from the selected catalogue book.</p>}
                </div>

                <label className="flex items-start gap-3 text-sm leading-5">
                  <Checkbox checked={rightsAttested} onCheckedChange={(checked) => setRightsAttested(checked === true)} disabled={busy} />
                  <span>I confirm I am authorized to submit this file for review and have provided accurate information. I understand this does not automatically authorize public distribution.</span>
                </label>

                {busy && (
                  <div className="space-y-2 rounded-lg border border-primary/20 bg-primary/5 p-3">
                    <div className="flex items-center justify-between text-sm">
                      <span>{getStageLabel()}</span>
                      <span className="font-mono">{getStageProgress()}%</span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary transition-all duration-300"
                        style={{ width: `${getStageProgress()}%` }}
                      />
                    </div>
                    {retryCount > 0 && (
                      <p className="text-xs text-amber-600 flex items-center gap-1">
                        <RotateCw className="h-3 w-3 animate-spin" /> Retry attempt {retryCount} of {maxRetries}…
                      </p>
                    )}
                  </div>
                )}

                <Button type="submit" className="w-full gap-2" disabled={busy || !file || !rightsAttested || (!selectedBook && !title.trim())}>
                  {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileUp className="h-4 w-4" />}
                  {busy ? 'Submitting privately…' : selectedBook ? 'Submit for verification (linked to catalogue)' : 'Submit for verification'}
                </Button>
              </form>
            )}

            {/* Step 3: Confirm (when linked to existing book) */}
            {step === 'confirm' && selectedBook && (
              <div className="space-y-4 animate-in fade-in slide-in-from-right-2">
                <div className="rounded-lg border border-green-200 bg-green-50 p-4">
                  <div className="flex items-center gap-2 font-medium text-green-800">
                    <CheckCircle2 className="h-5 w-5" />
                    <span>Ready to submit</span>
                  </div>
                  <p className="mt-1 text-sm text-green-700">Your PDF will be linked to this existing catalogue book:</p>
                  <div className="mt-3 p-3 bg-white/50 rounded border">
                    <p className="font-medium">{selectedBook.title}</p>
                    <p className="text-sm text-muted-foreground">{selectedBook.author || 'Unknown author'}</p>
                    <div className="mt-1 flex flex-wrap gap-1 text-xs text-muted-foreground">
                      {Boolean(selectedBook.publication_year) && <span>· {selectedBook.publication_year}</span>}
                      {selectedBook.isbn && <span>· ISBN {selectedBook.isbn}</span>}
                      {selectedBook.language && <span>· {selectedBook.language}</span>}
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="contribute-pdf-confirm">PDF file (max 50 MB)</Label>
                  <Input
                    id="contribute-pdf-confirm"
                    ref={fileRef}
                    type="file"
                    accept="application/pdf,.pdf"
                    required
                    onChange={(e) => setFile(e.target.files?.[0] || null)}
                    disabled={busy}
                    className="file:mr-4 file:rounded-md file:border-0 file:bg-primary/10 file:text-primary file:px-3 file:py-1 hover:file:bg-primary/20"
                  />
                  {file && (
                    <div className="flex items-center justify-between text-xs text-muted-foreground bg-muted/50 p-2 rounded">
                      <span className="truncate flex-1">{file.name}</span>
                      <span className="ml-2 font-mono">{formatFileSize(file.size)}</span>
                    </div>
                  )}
                </div>

                <label className="flex items-start gap-3 text-sm leading-5">
                  <Checkbox checked={rightsAttested} onCheckedChange={(checked) => setRightsAttested(checked === true)} disabled={busy} />
                  <span>I confirm I am authorized to submit this file for review and have provided accurate information. I understand this does not automatically authorize public distribution.</span>
                </label>

                {busy && (
                  <div className="space-y-2 rounded-lg border border-primary/20 bg-primary/5 p-3">
                    <div className="flex items-center justify-between text-sm">
                      <span>{getStageLabel()}</span>
                      <span className="font-mono">{getStageProgress()}%</span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary transition-all duration-300"
                        style={{ width: `${getStageProgress()}%` }}
                      />
                    </div>
                    {retryCount > 0 && (
                      <p className="text-xs text-amber-600 flex items-center gap-1">
                        <RotateCw className="h-3 w-3 animate-spin" /> Retry attempt {retryCount} of {maxRetries}…
                      </p>
                    )}
                  </div>
                )}

                <div className="flex gap-2">
                  <Button variant="outline" onClick={handleBackToUpload} disabled={busy} className="flex-1">
                    <ArrowLeft className="mr-2 h-4 w-4" /> Change Book
                  </Button>
                  <Button type="button" onClick={submit} className="w-full gap-2" disabled={busy || !file || !rightsAttested}>
                    {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileUp className="h-4 w-4" />}
                    {busy ? 'Submitting…' : 'Submit for verification'}
                  </Button>
                </div>
              </div>
            )}

            {/* Submission History */}
            <section className="space-y-3 border-t pt-4">
              <h3 className="font-semibold">Your recent submissions</h3>
              {isLoading ? <p className="text-sm text-muted-foreground">Loading submissions…</p> : submissions.length === 0 ? (
                <p className="text-sm text-muted-foreground">No submissions yet.</p>
              ) : submissions.map((submission) => {
                const isPublished = Boolean(submission.published_book_id);
                const StatusIcon = statusIcon[submission.status] || FileUp;
                return (
                  <div key={submission.id} className="flex flex-col gap-1 rounded-lg border p-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0 flex items-center gap-2">
                      <StatusIcon className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      <div>
                        <p className="truncate text-sm font-medium">{submission.submitted_title || submission.original_filename}</p>
                        <p className="text-xs text-muted-foreground">{submission.submitted_author || submission.original_filename} · {new Date(submission.created_at).toLocaleDateString()}</p>
                        {isPublished ? (
                          <a href={`/library?search=${encodeURIComponent(submission.submitted_title || '')}`} className="mt-1 inline-block text-xs font-medium text-primary hover:underline">
                            View in Library →
                          </a>
                        ) : submission.status === 'approved' ? (
                          <p className="mt-0.5 text-xs text-amber-600 dark:text-amber-400">Approved by reviewer · catalog publishing in progress</p>
                        ) : null}
                      </div>
                    </div>
                    <Badge variant={isPublished ? 'default' : submission.status === 'rejected' || submission.status === 'failed' ? 'destructive' : 'secondary'}>
                      {isPublished ? 'Published to Library' : statusLabel[submission.status] || submission.status}
                    </Badge>
                  </div>
                );
              })}
            </section>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

export default function ContributeBookPdfDialog() {
  return (
    <QueryClientProvider client={submissionQueryClient}>
      <ContributeBookPdfDialogContent />
    </QueryClientProvider>
  );
}