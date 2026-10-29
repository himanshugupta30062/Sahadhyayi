import React, { useRef, useState } from 'react';
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
import { CheckCircle2, FileText, FileUp, Loader2, ShieldCheck, X } from 'lucide-react';

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
};

async function validatePdf(file: File) {
  if (file.size <= 0 || file.size > MAX_BYTES) throw new Error('Choose a PDF between 1 byte and 50 MB.');
  if (file.type && file.type !== 'application/pdf') throw new Error('Only PDF files are accepted.');
  const signature = new TextDecoder().decode(new Uint8Array(await file.slice(0, 5).arrayBuffer()));
  if (signature !== '%PDF-') throw new Error('The file does not have a valid PDF signature.');
}

const statusLabel: Record<string, string> = {
  uploaded: 'Uploaded — awaiting checks',
  queued: 'Queued for verification',
  scanning: 'Safety scan in progress',
  extracting: 'Reading book details',
  matching: 'Matching catalogue records',
  needs_review: 'Needs human review',
  approved: 'Approved',
  rejected: 'Not approved',
  failed: 'Processing failed',
};

function ContributeBookPdfDialogContent() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [rightsAttested, setRightsAttested] = useState(false);
  const [busy, setBusy] = useState(false);

  const { data: submissions = [], isLoading } = useQuery({
    queryKey: ['my-book-pdf-submissions', user?.id],
    enabled: Boolean(user && open),
    queryFn: async () => {
      const { data, error } = await supabase.from('book_pdf_submissions' as any).select('id,original_filename,submitted_title,submitted_author,status,created_at').eq('user_id', user!.id).order('created_at', { ascending: false }).limit(10);
      if (error) throw error;
      return (data || []) as Submission[];
    },
  });

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!user) {
      toast({ title: 'Sign in required', description: 'Sign in before contributing a PDF.', variant: 'destructive' });
      return;
    }
    if (!file || !rightsAttested) {
      toast({ title: 'Complete the form', description: 'Choose a PDF and confirm that you are authorized to submit it.', variant: 'destructive' });
      return;
    }

    setBusy(true);
    const id = crypto.randomUUID();
    const path = `${user.id}/${id}/source.pdf`;
    let submissionCreated = false;
    try {
      await validatePdf(file);
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
      });
      if (insertError) throw insertError;
      submissionCreated = true;

      const { error: uploadError } = await supabase.storage.from(BUCKET).upload(path, file, {
        contentType: 'application/pdf',
        cacheControl: '0',
        upsert: false,
      });
      if (uploadError) throw uploadError;

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
      if (fileRef.current) fileRef.current.value = '';
      await queryClient.invalidateQueries({ queryKey: ['my-book-pdf-submissions', user.id] });
    } catch (error) {
      console.error('Book PDF contribution failed', { submissionCreated, error });
      toast({
        title: submissionCreated ? 'Upload incomplete' : 'Submission failed',
        description: error instanceof Error ? error.message : 'The PDF could not be submitted. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="min-h-11 w-full justify-center gap-2 touch-manipulation sm:w-auto"><FileUp className="h-4 w-4 shrink-0" /> Contribute a PDF</Button>
      </DialogTrigger>
      <DialogContent className="top-4 w-[calc(100vw-1rem)] max-h-[calc(100dvh-2rem)] translate-y-0 overflow-y-auto overscroll-contain p-4 sm:top-[50%] sm:w-full sm:max-h-[calc(100dvh-4rem)] sm:max-w-xl sm:translate-y-[-50%] sm:p-6">
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
          <form onSubmit={submit} className="space-y-4">
            <div className="rounded-lg border border-primary/20 bg-primary/5 p-3 text-sm">
              <div className="flex items-center gap-2 font-medium"><ShieldCheck className="h-4 w-4" /> Private review process</div>
              <p className="mt-1 text-muted-foreground">Uploading does not publish the PDF. A valid book match does not by itself establish distribution rights.</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="contribute-pdf">PDF file</Label>
              <div className="rounded-xl border border-dashed border-border bg-muted/30 p-3 sm:p-4">
                <Input
                  id="contribute-pdf"
                  ref={fileRef}
                  type="file"
                  accept="application/pdf,.pdf"
                  required
                  disabled={busy}
                  className="sr-only"
                  tabIndex={-1}
                  aria-hidden="true"
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                />
                {!file ? (
                  <div className="flex flex-col items-center gap-3 py-3 text-center">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                      <FileUp className="h-6 w-6" aria-hidden="true" />
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-medium">Choose a book PDF</p>
                      <p className="text-xs text-muted-foreground">PDF format · Maximum file size 50 MB</p>
                    </div>
                    <Button type="button" variant="outline" className="min-h-11 w-full max-w-xs touch-manipulation" disabled={busy} onClick={() => fileRef.current?.click()}>
                      <FileUp className="mr-2 h-4 w-4" aria-hidden="true" />
                      Browse files
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <FileText className="h-5 w-5" aria-hidden="true" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="break-all text-sm font-medium">{file.name}</p>
                      <p className="mt-1 text-xs text-muted-foreground">{(file.size / (1024 * 1024)).toFixed(2)} MB · PDF selected</p>
                      <p className="mt-2 flex items-center gap-1 text-xs text-muted-foreground"><CheckCircle2 className="h-3.5 w-3.5" /> File signature will be checked before upload</p>
                    </div>
                    <Button type="button" variant="ghost" size="icon" className="h-10 w-10 shrink-0 touch-manipulation" aria-label="Remove selected PDF" disabled={busy} onClick={() => { setFile(null); if (fileRef.current) fileRef.current.value = ''; }}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="contribute-title">Book title (optional)</Label>
              <Input id="contribute-title" disabled={busy} value={title} maxLength={500} onChange={(e) => setTitle(e.target.value)} placeholder="Title printed in the book" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="contribute-author">Author (optional)</Label>
              <Input id="contribute-author" disabled={busy} value={author} maxLength={500} onChange={(e) => setAuthor(e.target.value)} placeholder="Author name" />
            </div>
            <label className="flex items-start gap-3 text-sm leading-5">
              <Checkbox disabled={busy} checked={rightsAttested} onCheckedChange={(checked) => setRightsAttested(checked === true)} />
              <span>I confirm I am authorized to submit this file for review and have provided accurate information. I understand this does not automatically authorize public distribution.</span>
            </label>
            <Button type="submit" className="min-h-12 w-full gap-2 touch-manipulation text-sm sm:text-base" disabled={busy || !file || !rightsAttested}>
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileUp className="h-4 w-4" />}
              {busy ? 'Submitting privately…' : 'Submit for verification'}
            </Button>
          </form>
        )}
        {user && (
          <section className="space-y-3 border-t pt-4">
            <h3 className="font-semibold">Your recent submissions</h3>
            {isLoading ? <p className="text-sm text-muted-foreground">Loading submissions…</p> : submissions.length === 0 ? (
              <p className="text-sm text-muted-foreground">No submissions yet.</p>
            ) : submissions.map((submission) => (
              <div key={submission.id} className="flex flex-col gap-1 rounded-lg border p-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{submission.submitted_title || submission.original_filename}</p>
                  <p className="text-xs text-muted-foreground">{submission.submitted_author || submission.original_filename} · {new Date(submission.created_at).toLocaleDateString()}</p>
                </div>
                <Badge variant={submission.status === 'rejected' || submission.status === 'failed' ? 'destructive' : 'secondary'}>{statusLabel[submission.status] || submission.status}</Badge>
              </div>
            ))}
          </section>
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
