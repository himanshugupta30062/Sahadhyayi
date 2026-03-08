import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import SEO from '@/components/SEO';
import Breadcrumb from '@/components/Breadcrumb';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import {
  usePublishBook,
  uploadPublishFile,
  validateCoverFile,
  validatePdfFile,
  formatFileSize,
  estimateReadingTime,
} from '@/hooks/usePublishBook';
import { useAuth } from '@/contexts/AuthContext';
import { BookOpen, Upload, Eye, ArrowLeft, ArrowRight, Loader2, X, Tag } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { nanoid } from 'nanoid';

const GENRES = ['Fiction', 'Non-Fiction', 'Science', 'Technology', 'History', 'Philosophy', 'Poetry', 'Biography', 'Self-Help', 'Fantasy', 'Mystery', 'Romance', 'Horror', 'Other'];
const LANGUAGES = ['English', 'Hindi', 'Tamil', 'Telugu', 'Kannada', 'Malayalam', 'Bengali', 'Marathi', 'Gujarati', 'Punjabi', 'Other'];

export default function PublishBook() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { createBook, submitForReview } = usePublishBook();
  const [step, setStep] = useState(1);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [tagInput, setTagInput] = useState('');

  const [form, setForm] = useState({
    title: '',
    subtitle: '',
    author_name: '',
    description: '',
    genre: '',
    language: 'English',
    pages: '',
    isbn: '',
    tags: [] as string[],
  });
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);

  const updateField = (field: string, value: string) => setForm(prev => ({ ...prev, [field]: value }));

  const addTag = useCallback(() => {
    const tag = tagInput.trim().toLowerCase();
    if (tag && !form.tags.includes(tag) && form.tags.length < 10) {
      setForm(prev => ({ ...prev, tags: [...prev.tags, tag] }));
      setTagInput('');
    }
  }, [tagInput, form.tags]);

  const removeTag = (tag: string) => {
    setForm(prev => ({ ...prev, tags: prev.tags.filter(t => t !== tag) }));
  };

  const handleCoverChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const error = validateCoverFile(file);
      if (error) { toast({ title: error, variant: 'destructive' }); return; }
      setCoverFile(file);
      setCoverPreview(URL.createObjectURL(file));
    }
  };

  const handlePdfChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const error = validatePdfFile(file);
      if (error) { toast({ title: error, variant: 'destructive' }); return; }
      setPdfFile(file);
    }
  };

  const canProceedStep1 = form.title.trim() && form.author_name.trim();
  const canSubmit = canProceedStep1;
  const readingTime = form.pages ? estimateReadingTime(parseInt(form.pages)) : null;

  const handleSubmit = async () => {
    if (!user) return;
    setUploading(true);
    setUploadProgress(0);
    const bookId = nanoid(12);
    try {
      let cover_image_url: string | undefined;
      let pdf_url: string | undefined;

      if (coverFile) {
        cover_image_url = await uploadPublishFile(coverFile, user.id, bookId, 'cover', p => setUploadProgress(Math.round(p * 0.3)));
      }
      if (pdfFile) {
        pdf_url = await uploadPublishFile(pdfFile, user.id, bookId, 'pdf', p => setUploadProgress(30 + Math.round(p * 0.5)));
      }
      setUploadProgress(80);

      const pages = form.pages ? parseInt(form.pages) : undefined;
      const book = await createBook.mutateAsync({
        title: form.title.trim(),
        subtitle: form.subtitle.trim() || undefined,
        author_name: form.author_name.trim(),
        description: form.description.trim() || undefined,
        genre: form.genre || undefined,
        language: form.language,
        pages,
        isbn: form.isbn.trim() || undefined,
        tags: form.tags.length > 0 ? form.tags : undefined,
        cover_image_url,
        pdf_url,
        file_size: pdfFile?.size,
        reading_time_minutes: pages ? estimateReadingTime(pages) : undefined,
      });

      setUploadProgress(90);
      await submitForReview.mutateAsync(book.id);
      setUploadProgress(100);
      navigate('/my-publications');
    } catch {
      // errors handled by mutation callbacks
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const breadcrumbItems = [
    { name: 'Library', path: '/library' },
    { name: 'Publish Book', path: '/publish', current: true },
  ];

  return (
    <div className="min-h-screen bg-background">
      <SEO title="Publish Your Book | Sahadhyayi" description="Share your book with the Sahadhyayi community." />
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <div className="mb-6">
          <Breadcrumb items={breadcrumbItems} />
        </div>

        {/* Step indicator */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {[1, 2, 3].map(s => (
            <div key={s} className={`flex items-center gap-2 ${s <= step ? 'text-primary' : 'text-muted-foreground'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold border-2 ${s <= step ? 'border-primary bg-primary text-primary-foreground' : 'border-muted-foreground'}`}>
                {s}
              </div>
              <span className="text-sm hidden sm:inline">{s === 1 ? 'Details' : s === 2 ? 'Files' : 'Preview'}</span>
              {s < 3 && <div className={`w-8 h-0.5 ${s < step ? 'bg-primary' : 'bg-muted'}`} />}
            </div>
          ))}
        </div>

        {/* Step 1: Book details */}
        {step === 1 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><BookOpen className="h-5 w-5" /> Book Details</CardTitle>
              <CardDescription>Tell us about your book</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Title *</Label>
                <Input id="title" value={form.title} onChange={e => updateField('title', e.target.value)} placeholder="Enter book title" maxLength={200} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="subtitle">Subtitle</Label>
                <Input id="subtitle" value={form.subtitle} onChange={e => updateField('subtitle', e.target.value)} placeholder="Optional subtitle" maxLength={200} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="author">Author Name *</Label>
                <Input id="author" value={form.author_name} onChange={e => updateField('author_name', e.target.value)} placeholder="Author name" maxLength={100} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea id="description" value={form.description} onChange={e => updateField('description', e.target.value)} placeholder="Brief description of your book" rows={4} maxLength={2000} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Genre</Label>
                  <Select value={form.genre} onValueChange={v => updateField('genre', v)}>
                    <SelectTrigger><SelectValue placeholder="Select genre" /></SelectTrigger>
                    <SelectContent>{GENRES.map(g => <SelectItem key={g} value={g}>{g}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Language</Label>
                  <Select value={form.language} onValueChange={v => updateField('language', v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{LANGUAGES.map(l => <SelectItem key={l} value={l}>{l}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="pages">Pages</Label>
                  <Input id="pages" type="number" value={form.pages} onChange={e => updateField('pages', e.target.value)} placeholder="Number of pages" min={1} />
                  {readingTime && <p className="text-xs text-muted-foreground">~{readingTime} min reading time</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="isbn">ISBN (optional)</Label>
                  <Input id="isbn" value={form.isbn} onChange={e => updateField('isbn', e.target.value)} placeholder="ISBN" maxLength={20} />
                </div>
              </div>
              {/* Tags */}
              <div className="space-y-2">
                <Label>Tags (up to 10)</Label>
                <div className="flex gap-2">
                  <Input
                    value={tagInput}
                    onChange={e => setTagInput(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addTag(); } }}
                    placeholder="Add a tag and press Enter"
                    maxLength={30}
                  />
                  <Button type="button" variant="outline" size="sm" onClick={addTag} disabled={!tagInput.trim()}>
                    <Tag className="h-4 w-4" />
                  </Button>
                </div>
                {form.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {form.tags.map(tag => (
                      <span key={tag} className="inline-flex items-center gap-1 text-xs bg-primary/10 text-primary px-2 py-1 rounded-full">
                        {tag}
                        <button type="button" onClick={() => removeTag(tag)} className="hover:text-destructive">
                          <X className="h-3 w-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
              <div className="flex justify-end">
                <Button onClick={() => setStep(2)} disabled={!canProceedStep1}>Next <ArrowRight className="ml-2 h-4 w-4" /></Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 2: File uploads */}
        {step === 2 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Upload className="h-5 w-5" /> Upload Files</CardTitle>
              <CardDescription>Add a cover image and PDF of your book</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label>Cover Image <span className="text-xs text-muted-foreground">(JPG, PNG, WebP — max 5MB)</span></Label>
                <div className="border-2 border-dashed border-muted rounded-lg p-6 text-center">
                  {coverPreview ? (
                    <div className="flex flex-col items-center gap-3">
                      <img src={coverPreview} alt="Cover preview" className="h-48 object-contain rounded" />
                      <p className="text-xs text-muted-foreground">{coverFile && formatFileSize(coverFile.size)}</p>
                      <Button variant="outline" size="sm" onClick={() => { setCoverFile(null); setCoverPreview(null); }}>Remove</Button>
                    </div>
                  ) : (
                    <label className="cursor-pointer flex flex-col items-center gap-2 text-muted-foreground">
                      <Upload className="h-8 w-8" />
                      <span>Click to upload cover image</span>
                      <span className="text-xs">JPG, PNG, WebP (max 5MB)</span>
                      <input type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handleCoverChange} />
                    </label>
                  )}
                </div>
              </div>
              <div className="space-y-2">
                <Label>PDF File <span className="text-xs text-muted-foreground">(max 50MB)</span></Label>
                <div className="border-2 border-dashed border-muted rounded-lg p-6 text-center">
                  {pdfFile ? (
                    <div className="flex flex-col items-center gap-3">
                      <div className="flex items-center gap-3">
                        <BookOpen className="h-6 w-6 text-primary" />
                        <div className="text-left">
                          <p className="text-sm font-medium text-foreground">{pdfFile.name}</p>
                          <p className="text-xs text-muted-foreground">{formatFileSize(pdfFile.size)}</p>
                        </div>
                      </div>
                      <Button variant="outline" size="sm" onClick={() => setPdfFile(null)}>Remove</Button>
                    </div>
                  ) : (
                    <label className="cursor-pointer flex flex-col items-center gap-2 text-muted-foreground">
                      <Upload className="h-8 w-8" />
                      <span>Click to upload PDF</span>
                      <span className="text-xs">PDF format (max 50MB)</span>
                      <input type="file" accept="application/pdf" className="hidden" onChange={handlePdfChange} />
                    </label>
                  )}
                </div>
              </div>
              <div className="flex justify-between">
                <Button variant="outline" onClick={() => setStep(1)}><ArrowLeft className="mr-2 h-4 w-4" /> Back</Button>
                <Button onClick={() => setStep(3)}>Preview <ArrowRight className="ml-2 h-4 w-4" /></Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 3: Preview & Submit */}
        {step === 3 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Eye className="h-5 w-5" /> Preview & Submit</CardTitle>
              <CardDescription>Review your book details before submitting</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-6">
                {coverPreview ? (
                  <img src={coverPreview} alt="Cover" className="w-32 h-44 object-cover rounded shadow" />
                ) : (
                  <div className="w-32 h-44 bg-muted rounded flex items-center justify-center">
                    <BookOpen className="h-8 w-8 text-muted-foreground" />
                  </div>
                )}
                <div className="flex-1 space-y-2">
                  <h3 className="text-xl font-bold text-foreground">{form.title}</h3>
                  {form.subtitle && <p className="text-sm text-muted-foreground italic">{form.subtitle}</p>}
                  <p className="text-sm text-muted-foreground">by {form.author_name}</p>
                  <div className="flex flex-wrap gap-1">
                    {form.genre && <span className="inline-block text-xs bg-primary/10 text-primary px-2 py-1 rounded">{form.genre}</span>}
                    {form.language && <span className="inline-block text-xs bg-secondary text-secondary-foreground px-2 py-1 rounded">{form.language}</span>}
                  </div>
                  {form.pages && <p className="text-sm text-muted-foreground">{form.pages} pages · ~{readingTime} min read</p>}
                  {pdfFile && <p className="text-sm text-muted-foreground">📄 {pdfFile.name} ({formatFileSize(pdfFile.size)})</p>}
                </div>
              </div>
              {form.tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {form.tags.map(tag => (
                    <span key={tag} className="text-xs bg-muted text-muted-foreground px-2 py-1 rounded-full">#{tag}</span>
                  ))}
                </div>
              )}
              {form.description && (
                <div>
                  <h4 className="font-medium text-foreground mb-1">Description</h4>
                  <p className="text-sm text-muted-foreground">{form.description}</p>
                </div>
              )}
              <div className="bg-muted/50 rounded-lg p-4 text-sm text-muted-foreground">
                <p>📋 Your book will be submitted for review. Once approved by our team, it will appear in the public library.</p>
              </div>
              {uploading && (
                <div className="space-y-2">
                  <Progress value={uploadProgress} className="h-2" />
                  <p className="text-xs text-muted-foreground text-center">{uploadProgress}% — Uploading files...</p>
                </div>
              )}
              <div className="flex justify-between">
                <Button variant="outline" onClick={() => setStep(2)} disabled={uploading}><ArrowLeft className="mr-2 h-4 w-4" /> Back</Button>
                <Button onClick={handleSubmit} disabled={!canSubmit || uploading}>
                  {uploading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Submitting...</> : 'Submit for Review'}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
