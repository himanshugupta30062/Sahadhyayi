import React, { useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client-universal';
import { useAuth } from '@/contexts/authHelpers';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import SEO from '@/components/SEO';
import { FileUp, Search, ShieldCheck, BookOpen, ExternalLink, LoaderCircle, FileCheck2 } from 'lucide-react';

type BookRecord = {
  id: string;
  title: string;
  author: string | null;
  isbn: string | null;
  publication_year: number | null;
  pdf_url: string | null;
  cover_image_url: string | null;
};

const MAX_PDF_BYTES = 50 * 1024 * 1024;
const BUCKET = 'book-pdfs';

const RIGHTS_OPTIONS = [
  { value: 'public_domain', label: 'Public domain' },
  { value: 'open_license', label: 'Open licence (CC or equivalent)' },
  { value: 'authorized', label: 'Written permission / authorized distribution' },
  { value: 'publisher_hosted', label: 'Official publisher or institution-hosted PDF' },
] as const;

async function validatePdf(file: File) {
  if (file.size <= 0 || file.size > MAX_PDF_BYTES) {
    throw new Error('Choose a PDF smaller than 50 MB.');
  }
  if (file.type && file.type !== 'application/pdf') {
    throw new Error('Only PDF files are accepted.');
  }
  const header = new Uint8Array(await file.slice(0, 5).arrayBuffer());
  if (new TextDecoder().decode(header) !== '%PDF-') {
    throw new Error('This file does not have a valid PDF signature.');
  }
}

export default function AdminBookPdfManager() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [sourceUrl, setSourceUrl] = useState('');
  const [rightsBasis, setRightsBasis] = useState<(typeof RIGHTS_OPTIONS)[number]['value']>('public_domain');
  const [rightsNotes, setRightsNotes] = useState('');
  const [confirmRights, setConfirmRights] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const { data: books = [], isLoading, error } = useQuery({
    queryKey: ['admin-book-pdf-manager-books'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('books_library')
        .select('id,title,author,isbn,publication_year,pdf_url,cover_image_url')
        .order('title', { ascending: true })
        .limit(2000);
      if (error) throw error;
      return (data || []) as BookRecord[];
    },
  });

  const filteredBooks = useMemo(() => {
    const needle = search.trim().toLowerCase();
    if (!needle) return books.filter((book) => !book.pdf_url).slice(0, 100);
    return books.filter((book) =>
      [book.title, book.author, book.isbn].some((value) => value?.toLowerCase().includes(needle))
    ).slice(0, 100);
  }, [books, search]);

  const selectedBook = books.find((book) => book.id === selectedId) || null;

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
    let uploadedPath = '';
    try {
      await validatePdf(file);
      const signature = crypto.randomUUID();
      uploadedPath = `${selectedBook.id}/${signature}.pdf`;

      const { error: uploadError } = await supabase.storage.from(BUCKET).upload(uploadedPath, file, {
        contentType: 'application/pdf',
        cacheControl: '3600',
        upsert: false,
      });
      if (uploadError) throw uploadError;

      const pdfUrl = supabase.storage.from(BUCKET).getPublicUrl(uploadedPath).data.publicUrl;
      const { data: updatedBook, error: updateError } = await supabase
        .from('books_library')
        .update({ pdf_url: pdfUrl })
        .eq('id', selectedBook.id)
        .select('id')
        .maybeSingle();
      if (updateError) throw updateError;
      if (!updatedBook) throw new Error('The book record was not updated. Check catalog write permissions.');

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
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <SEO title="Admin PDF Manager | Sahadhyayi" description="Review book PDF rights and upload verified files to the Sahadhyayi catalog." />
      <div className="mx-auto max-w-6xl space-y-8 px-4 py-8 sm:px-6 lg:px-8">
        <header className="space-y-3">
          <div className="flex items-center gap-2 text-sm font-medium text-primary"><ShieldCheck className="h-4 w-4" /> Administrator tools</div>
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Book PDF Manager</h1>
          <p className="max-w-3xl text-muted-foreground">Upload a verified PDF, record where it came from, and document why Sahadhyayi is allowed to distribute it. Only authorized admins should use this page.</p>
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-xl border bg-card p-4"><p className="text-sm text-muted-foreground">Catalog books loaded</p><p className="mt-1 text-2xl font-semibold">{books.length}</p></div>
            <div className="rounded-xl border bg-card p-4"><p className="text-sm text-muted-foreground">Missing PDF</p><p className="mt-1 text-2xl font-semibold">{books.filter((book) => !book.pdf_url).length}</p></div>
            <div className="rounded-xl border bg-card p-4"><p className="text-sm text-muted-foreground">Already linked</p><p className="mt-1 text-2xl font-semibold">{books.filter((book) => Boolean(book.pdf_url)).length}</p></div>
          </div>
        </header>

        <section className="grid gap-6 lg:grid-cols-[0.9fr,1.1fr]">
          <div className="rounded-2xl border bg-card p-5 sm:p-6">
            <h2 className="flex items-center gap-2 text-xl font-semibold"><BookOpen className="h-5 w-5" /> 1. Select a book</h2>
            <label htmlFor="book-search" className="mt-5 block text-sm font-medium">Search title, author or ISBN</label>
            <div className="relative mt-2">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input id="book-search" value={search} onChange={(event) => setSearch(event.target.value)} className="pl-9" placeholder="e.g. To Kill a Mockingbird" />
            </div>
            <div className="mt-4 max-h-[440px] space-y-2 overflow-y-auto" aria-live="polite">
              {isLoading && <p className="py-8 text-center text-sm text-muted-foreground">Loading catalog…</p>}
              {error && <p role="alert" className="text-sm text-destructive">Could not load books. Please refresh and try again.</p>}
              {!isLoading && !error && filteredBooks.length === 0 && <p className="py-8 text-center text-sm text-muted-foreground">No matching books found.</p>}
              {filteredBooks.map((book) => (
                <button key={book.id} type="button" onClick={() => setSelectedId(book.id)} className={`w-full rounded-xl border p-3 text-left transition-colors ${selectedId === book.id ? 'border-primary bg-primary/5' : 'hover:bg-muted/50'}`}>
                  <span className="flex items-start justify-between gap-3">
                    <span className="min-w-0"><span className="block font-medium">{book.title}</span><span className="mt-1 block text-sm text-muted-foreground">{book.author || 'Unknown author'}{book.publication_year ? ` · ${book.publication_year}` : ''}</span>{book.isbn && <span className="mt-1 block text-xs text-muted-foreground">ISBN {book.isbn}</span>}</span>
                    {book.pdf_url ? <Badge variant="secondary">PDF linked</Badge> : <Badge variant="outline">Missing PDF</Badge>}
                  </span>
                </button>
              ))}
            </div>
            {selectedBook && <div className="mt-4 rounded-lg bg-muted/50 p-3 text-sm"><p className="font-medium">Selected: {selectedBook.title}</p>{selectedBook.pdf_url && <a href={selectedBook.pdf_url} target="_blank" rel="noreferrer" className="mt-2 inline-flex items-center gap-1 text-primary underline">Open current PDF <ExternalLink className="h-3 w-3" /></a>}<p className="mt-2 text-muted-foreground">Uploading a replacement creates a new file and records the previous URL in the audit trail.</p></div>}
          </div>

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
              {isUploading ? <><LoaderCircle className="mr-2 h-4 w-4 animate-spin" /> Uploading and linking…</> : <><FileCheck2 className="mr-2 h-4 w-4" /> Validate and upload PDF</>}
            </Button>
            <p className="text-xs text-muted-foreground">The browser checks the PDF signature and size. These checks do not replace malware scanning, full content inspection, or legal review.</p>
          </form>
        </section>
      </div>
    </div>
  );
}
