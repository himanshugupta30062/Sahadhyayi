import React, { useRef, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client-universal';
import { useAuth } from '@/contexts/authHelpers';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { FileUp, Loader2, ShieldCheck } from 'lucide-react';

const BUCKET = 'book-pdf-quarantine';
const MAX_BYTES = 50 * 1024 * 1024;

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

export default function ContributeBookPdfDialog() {
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
      const { data, error } = await supabase.from('book_pdf_submissions').select('id,original_filename,submitted_title,submitted_author,status,created_at').eq('user_id', user!.id).order('created_at', { ascending: false }).limit(10);
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
      const { error: insertError } = await supabase.from('book_pdf_submissions').insert({
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
        <Button variant="outline" className="gap-2"><FileUp className="h-4 w-4" /> Contribute a PDF</Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
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
              <Label htmlFor="contribute-pdf">PDF file (max 50 MB)</Label>
              <Input id="contribute-pdf" ref={fileRef} type="file" accept="application/pdf,.pdf" required onChange={(e) => setFile(e.target.files?.[0] || null)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="contribute-title">Book title (optional)</Label>
              <Input id="contribute-title" value={title} maxLength={500} onChange={(e) => setTitle(e.target.value)} placeholder="Title printed in the book" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="contribute-author">Author (optional)</Label>
              <Input id="contribute-author" value={author} maxLength={500} onChange={(e) => setAuthor(e.target.value)} placeholder="Author name" />
            </div>
            <label className="flex items-start gap-3 text-sm leading-5">
              <Checkbox checked={rightsAttested} onCheckedChange={(checked) => setRightsAttested(checked === true)} />
              <span>I confirm I am authorized to submit this file for review and have provided accurate information. I understand this does not automatically authorize public distribution.</span>
            </label>
            <Button type="submit" className="w-full gap-2" disabled={busy || !file || !rightsAttested}>
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
