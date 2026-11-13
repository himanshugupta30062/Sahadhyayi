import React, { useState, useRef, useMemo } from 'react';
import { useAuth } from '@/contexts/authHelpers';
import { supabase } from '@/integrations/supabase/client-universal';
import { useQueryClient } from '@tanstack/react-query';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import {
  Upload,
  Download,
  FileSpreadsheet,
  FileText,
  FileJson,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  BookOpen,
  ArrowRight,
  RefreshCw,
  Library,
  Star,
} from 'lucide-react';
import {
  runImportPipeline,
  exportBookshelfCsv,
  exportReadingHistoryCsv,
  exportReviewsCsv,
  exportReadingJournalMarkdown,
  exportSahadhyayiJsonBackup,
  downloadExportFile,
  ImportPreviewSummary,
  ParsedImportBook,
  CatalogBook,
  ReadingStatus,
} from '@/lib/readingImportExport';
import { useUserBookshelf } from '@/hooks/useUserBookshelf';

interface ReadingImportExportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  catalogBooks?: CatalogBook[];
}

export const ReadingImportExportDialog: React.FC<ReadingImportExportDialogProps> = ({
  open,
  onOpenChange,
  catalogBooks = [],
}) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: userBooks = [] } = useUserBookshelf();

  // Import State
  const [activeTab, setActiveTab] = useState<'import' | 'export'>('import');
  const [selectedFileName, setSelectedFileName] = useState<string | null>(null);
  const [importSummary, setImportSummary] = useState<ImportPreviewSummary | null>(null);
  const [isParsing, setIsParsing] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const [importStageText, setImportStageText] = useState('');

  // Handle File Selection & Parsing
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedFileName(file.name);
    setIsParsing(true);

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        const summary = runImportPipeline(content, catalogBooks);
        setImportSummary(summary);
      } catch (err: any) {
        toast({
          title: 'Failed to parse file',
          description: err.message || 'The selected file format could not be processed.',
          variant: 'destructive',
        });
        setImportSummary(null);
      } finally {
        setIsParsing(false);
      }
    };
    reader.onerror = () => {
      setIsParsing(false);
      toast({
        title: 'Error reading file',
        description: 'Could not read the uploaded file from disk.',
        variant: 'destructive',
      });
    };
    reader.readAsText(file);
  };

  const handleResetImport = () => {
    setSelectedFileName(null);
    setImportSummary(null);
    setImportProgress(0);
    setImportStageText('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Execute Import Mutation
  const handleConfirmImport = async () => {
    if (!user || !importSummary || importSummary.books.length === 0) return;

    setIsImporting(true);
    setImportProgress(5);
    setImportStageText('Preparing books for import...');

    try {
      const validBooks = importSummary.books.filter((b) => b.isValid);
      const total = validBooks.length;
      let completed = 0;

      // Batch process in chunks of 25
      const chunkSize = 25;
      for (let i = 0; i < total; i += chunkSize) {
        const chunk = validBooks.slice(i, i + chunkSize);

        for (const book of chunk) {
          let bookId = book.matchedCatalogBookId;

          // If no catalog book is matched, look up or create in books_library
          if (!bookId) {
            const { data: existing } = await supabase
              .from('books_library')
              .select('id')
              .ilike('title', book.title.trim())
              .limit(1)
              .maybeSingle();

            if (existing?.id) {
              bookId = existing.id;
            } else {
              // Create library catalog entry
              const { data: created, error: createError } = await supabase
                .from('books_library')
                .insert({
                  title: book.title.trim(),
                  author: book.author?.trim() || 'Unknown Author',
                  isbn: book.isbn || null,
                  total_pages: book.pageCount || null,
                })
                .select('id')
                .single();

              if (!createError && created?.id) {
                bookId = created.id;
              }
            }
          }

          if (bookId) {
            // Upsert into user_bookshelf
            await supabase
              .from('user_bookshelf')
              .upsert(
                {
                  user_id: user.id,
                  book_id: bookId,
                  status: book.status,
                  rating: book.rating || null,
                  notes: book.review || null,
                  added_at: book.dateAdded ? new Date(book.dateAdded).toISOString() : new Date().toISOString(),
                  completed_at: book.dateRead ? new Date(book.dateRead).toISOString() : null,
                },
                { onConflict: 'user_id,book_id' }
              );
          }

          completed++;
        }

        const pct = Math.min(95, Math.round((completed / total) * 90) + 5);
        setImportProgress(pct);
        setImportStageText(`Importing books (${completed} of ${total})...`);
      }

      setImportProgress(100);
      setImportStageText('Import complete!');

      // Invalidate relevant React Query caches
      void queryClient.invalidateQueries({ queryKey: ['user-bookshelf'] });
      void queryClient.invalidateQueries({ queryKey: ['reading-progress'] });
      void queryClient.invalidateQueries({ queryKey: ['user-reading-stats'] });

      toast({
        title: 'Library imported successfully',
        description: `Imported ${completed} books into your Sahadhyayi bookshelf.`,
      });

      setTimeout(() => {
        setIsImporting(false);
        handleResetImport();
        onOpenChange(false);
      }, 1200);
    } catch (err: any) {
      console.error('Import execution error', err);
      toast({
        title: 'Import encountered issues',
        description: err.message || 'Some books could not be saved to your shelf.',
        variant: 'destructive',
      });
      setIsImporting(false);
    }
  };

  // Export Handlers
  const handleExportBookshelfCsv = () => {
    if (userBooks.length === 0) {
      toast({
        title: 'Bookshelf is empty',
        description: 'Add books to your shelf before exporting.',
        variant: 'destructive',
      });
      return;
    }

    const exportItems = userBooks.map((item) => ({
      book_id: item.book_id,
      title: item.books_library?.title || item.book?.title || 'Untitled',
      author: item.books_library?.author || item.book?.author || 'Unknown',
      status: item.status,
      rating: item.rating,
      progress: item.progress,
      added_at: item.added_at,
      completed_at: item.completed_at,
      notes: item.notes,
    }));

    const csv = exportBookshelfCsv(exportItems);
    const filename = `sahadhyayi_bookshelf_${new Date().toISOString().slice(0, 10)}.csv`;
    downloadExportFile(csv, filename, 'text/csv;charset=utf-8;');

    toast({
      title: 'Bookshelf Exported',
      description: `Downloaded ${exportItems.length} books as CSV.`,
    });
  };

  const handleExportJsonBackup = async () => {
    if (!user) return;

    try {
      // Fetch reviews and journal entries for complete backup
      const { data: reviews = [] } = await supabase
        .from('book_reviews')
        .select('*')
        .eq('user_id', user.id);

      const { data: journal = [] } = await supabase
        .from('reading_journal_entries')
        .select('*')
        .eq('user_id', user.id);

      const backup = {
        version: 'sahadhyayi-backup-v1' as const,
        exportedAt: new Date().toISOString(),
        user: {
          id: user.id,
          email: user.email,
        },
        bookshelf: userBooks.map((b) => ({
          book_id: b.book_id,
          title: b.books_library?.title || b.book?.title || 'Untitled',
          author: b.books_library?.author || b.book?.author,
          status: b.status as ReadingStatus,
          rating: b.rating,
          progress: b.progress,
          added_at: b.added_at,
          completed_at: b.completed_at,
          notes: b.notes,
        })),
        reviews: (reviews || []).map((r: any) => ({
          book_id: r.book_id,
          title: r.book_title || 'Untitled',
          rating: r.rating || 5,
          review_content: r.review_content || r.content,
          created_at: r.created_at,
        })),
        journalEntries: (journal || []).map((j: any) => ({
          id: j.id,
          book_id: j.book_id,
          title: j.title,
          content: j.content,
          created_at: j.created_at,
          tags: j.tags,
          is_pinned: j.is_pinned,
          folder_id: j.folder_id,
        })),
      };

      const json = exportSahadhyayiJsonBackup(backup);
      const filename = `sahadhyayi_backup_${new Date().toISOString().slice(0, 10)}.json`;
      downloadExportFile(json, filename, 'application/json;charset=utf-8;');

      toast({
        title: 'Full Backup Downloaded',
        description: 'Complete personal archive saved in portable JSON format.',
      });
    } catch (err: any) {
      toast({
        title: 'Backup failed',
        description: err.message || 'Could not compile backup data.',
        variant: 'destructive',
      });
    }
  };

  const handleExportJournalMarkdown = async () => {
    if (!user) return;

    try {
      const { data: journal = [] } = await supabase
        .from('reading_journal_entries')
        .select('*, books_library:book_id(title)')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (!journal || journal.length === 0) {
        toast({
          title: 'No journal entries found',
          description: 'Write notes in your Reading Journal before exporting.',
          variant: 'destructive',
        });
        return;
      }

      const entries = journal.map((j: any) => ({
        title: j.title,
        bookTitle: j.books_library?.title || null,
        content: j.content,
        createdAt: j.created_at ? new Date(j.created_at).toLocaleDateString() : '',
        tags: j.tags,
      }));

      const markdown = exportReadingJournalMarkdown(entries);
      const filename = `sahadhyayi_reading_journal_${new Date().toISOString().slice(0, 10)}.md`;
      downloadExportFile(markdown, filename, 'text/markdown;charset=utf-8;');

      toast({
        title: 'Journal Exported',
        description: `Exported ${entries.length} reflections as Markdown.`,
      });
    } catch (err: any) {
      toast({
        title: 'Export failed',
        description: err.message || 'Could not export journal entries.',
        variant: 'destructive',
      });
    }
  };

  const getFormatBadge = (fmt: string) => {
    switch (fmt) {
      case 'goodreads':
        return <Badge className="bg-amber-600 hover:bg-amber-600 text-white">Goodreads CSV</Badge>;
      case 'storygraph':
        return <Badge className="bg-teal-600 hover:bg-teal-600 text-white">StoryGraph CSV</Badge>;
      case 'generic':
        return <Badge className="bg-blue-600 hover:bg-blue-600 text-white">Generic Book CSV</Badge>;
      case 'sahadhyayi_json':
        return <Badge className="bg-purple-600 hover:bg-purple-600 text-white">Sahadhyayi Backup Archive</Badge>;
      default:
        return <Badge variant="outline">Standard CSV</Badge>;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col p-6 overflow-hidden">
        <DialogHeader className="pb-3 border-b border-border">
          <DialogTitle className="text-xl font-bold flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-[hsl(var(--brand-primary))]" />
            Reading Data Mobility & Library Migration
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Seamlessly import your library from Goodreads, StoryGraph, or CSV, and export your personal reading records anytime.
          </DialogDescription>
        </DialogHeader>

        <Tabs
          value={activeTab}
          onValueChange={(v) => setActiveTab(v as 'import' | 'export')}
          className="flex-1 flex flex-col overflow-hidden pt-2"
        >
          <TabsList className="grid grid-cols-2 w-full max-w-sm mb-4">
            <TabsTrigger value="import" className="text-xs font-semibold gap-1.5">
              <Upload className="w-3.5 h-3.5" /> Import Library
            </TabsTrigger>
            <TabsTrigger value="export" className="text-xs font-semibold gap-1.5">
              <Download className="w-3.5 h-3.5" /> Export Data
            </TabsTrigger>
          </TabsList>

          {/* TAB 1: IMPORT */}
          <TabsContent value="import" className="flex-1 flex flex-col overflow-hidden space-y-4 m-0">
            {!importSummary ? (
              <div className="flex-1 flex flex-col items-center justify-center border-2 border-dashed border-border rounded-xl p-8 text-center space-y-4 hover:border-[hsl(var(--brand-primary))] transition-colors bg-muted/20">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv,.json"
                  className="hidden"
                  onChange={handleFileChange}
                />
                <div className="w-12 h-12 rounded-full bg-[hsl(var(--brand-primary)/0.1)] flex items-center justify-center text-[hsl(var(--brand-primary))]">
                  <Upload className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <h4 className="text-sm font-semibold text-foreground">
                    Upload Goodreads, StoryGraph, or Sahadhyayi Export
                  </h4>
                  <p className="text-xs text-muted-foreground max-w-md">
                    Accepts <code className="text-xs bg-muted px-1 py-0.5 rounded">.csv</code> library exports or <code className="text-xs bg-muted px-1 py-0.5 rounded">.json</code> backup files.
                  </p>
                </div>

                <Button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isParsing}
                  className="bg-[hsl(var(--brand-primary))] hover:bg-[hsl(var(--brand-primary)/0.9)] text-white"
                >
                  {isParsing ? (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      Parsing file...
                    </>
                  ) : (
                    'Select File to Import'
                  )}
                </Button>

                <div className="pt-2 flex flex-wrap items-center justify-center gap-2 text-[11px] text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-emerald-500" /> Goodreads Export
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-teal-500" /> StoryGraph Export
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-purple-500" /> JSON Archive
                  </span>
                </div>
              </div>
            ) : (
              /* IMPORT PREVIEW VIEW */
              <div className="flex-1 flex flex-col overflow-hidden space-y-4">
                {/* Summary Header Bar */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 bg-muted/30 border border-border rounded-xl">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold">{selectedFileName}</span>
                      {getFormatBadge(importSummary.format)}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span><strong>{importSummary.totalRows}</strong> books identified</span>
                      <span>•</span>
                      <span><strong>{importSummary.matchedCount}</strong> matched in catalog</span>
                      <span>•</span>
                      <span><strong>{importSummary.unmatchedCount}</strong> custom titles</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleResetImport}
                      disabled={isImporting}
                      className="text-xs"
                    >
                      Choose Different File
                    </Button>
                    <Button
                      size="sm"
                      onClick={handleConfirmImport}
                      disabled={isImporting || importSummary.validCount === 0}
                      className="bg-[hsl(var(--brand-primary))] hover:bg-[hsl(var(--brand-primary)/0.9)] text-white text-xs"
                    >
                      {isImporting ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                          Importing...
                        </>
                      ) : (
                        `Import ${importSummary.validCount} Books`
                      )}
                    </Button>
                  </div>
                </div>

                {/* Progress Indicator when importing */}
                {isImporting && (
                  <div className="space-y-1.5 p-3 rounded-lg bg-[hsl(var(--brand-primary)/0.08)] border border-[hsl(var(--brand-primary)/0.2)]">
                    <div className="flex justify-between text-xs font-medium text-[hsl(var(--brand-primary))]">
                      <span>{importStageText}</span>
                      <span>{importProgress}%</span>
                    </div>
                    <Progress value={importProgress} className="h-2" />
                  </div>
                )}

                {/* Status Breakdown Pills */}
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <span className="text-muted-foreground">Status Breakdown:</span>
                  <Badge variant="outline" className="border-emerald-500/40 text-emerald-700 dark:text-emerald-300">
                    {importSummary.statusBreakdown.completed} Completed
                  </Badge>
                  <Badge variant="outline" className="border-blue-500/40 text-blue-700 dark:text-blue-300">
                    {importSummary.statusBreakdown.reading} Currently Reading
                  </Badge>
                  <Badge variant="outline" className="border-amber-500/40 text-amber-700 dark:text-amber-300">
                    {importSummary.statusBreakdown.want_to_read} Want to Read
                  </Badge>
                  {importSummary.statusBreakdown.dnf > 0 && (
                    <Badge variant="outline" className="border-rose-500/40 text-rose-700 dark:text-rose-300">
                      {importSummary.statusBreakdown.dnf} DNF
                    </Badge>
                  )}
                </div>

                {/* Preview Table */}
                <div className="flex-1 overflow-auto border border-border rounded-lg">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-muted/50 sticky top-0 border-b border-border">
                      <tr>
                        <th className="py-2.5 px-3 font-semibold">Title & Author</th>
                        <th className="py-2.5 px-3 font-semibold">Shelf Status</th>
                        <th className="py-2.5 px-3 font-semibold">Rating</th>
                        <th className="py-2.5 px-3 font-semibold">Catalog Match</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {importSummary.books.slice(0, 100).map((b, idx) => (
                        <tr key={idx} className="hover:bg-muted/20">
                          <td className="py-2 px-3">
                            <p className="font-medium text-foreground truncate max-w-xs">{b.title}</p>
                            <p className="text-[11px] text-muted-foreground truncate max-w-xs">{b.author}</p>
                          </td>
                          <td className="py-2 px-3">
                            <span className="capitalize text-[11px] font-medium">
                              {b.status.replace(/_/g, ' ')}
                            </span>
                          </td>
                          <td className="py-2 px-3">
                            {b.rating ? (
                              <span className="flex items-center gap-1 font-medium text-amber-600 dark:text-amber-400">
                                <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
                                {b.rating}
                              </span>
                            ) : (
                              <span className="text-muted-foreground">—</span>
                            )}
                          </td>
                          <td className="py-2 px-3">
                            {b.matchedCatalogBookId ? (
                              <Badge variant="outline" className="text-[10px] border-emerald-500/40 text-emerald-600 dark:text-emerald-400">
                                <CheckCircle2 className="w-2.5 h-2.5 mr-1" /> Matched
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="text-[10px] border-muted text-muted-foreground">
                                Custom Book
                              </Badge>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {importSummary.books.length > 100 && (
                  <p className="text-[11px] text-muted-foreground text-center">
                    Showing first 100 of {importSummary.books.length} books. All valid entries will be imported.
                  </p>
                )}
              </div>
            )}
          </TabsContent>

          {/* TAB 2: EXPORT */}
          <TabsContent value="export" className="flex-1 overflow-auto space-y-4 m-0 pr-1">
            <div className="grid sm:grid-cols-2 gap-3.5">
              {/* Bookshelf CSV */}
              <div className="p-4 rounded-xl border border-border hover:border-[hsl(var(--brand-primary)/0.5)] transition-all bg-card flex flex-col justify-between space-y-3">
                <div className="space-y-1.5">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
                    <FileSpreadsheet className="w-4 h-4" />
                  </div>
                  <h4 className="text-sm font-semibold text-foreground">Bookshelf CSV</h4>
                  <p className="text-xs text-muted-foreground">
                    All reading statuses, ratings, progress percentages, ISBNs, and dates in RFC 4180 CSV format.
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleExportBookshelfCsv}
                  className="w-full text-xs"
                >
                  <Download className="w-3.5 h-3.5 mr-1.5" /> Download Bookshelf CSV
                </Button>
              </div>

              {/* Complete JSON Backup */}
              <div className="p-4 rounded-xl border border-border hover:border-[hsl(var(--brand-primary)/0.5)] transition-all bg-card flex flex-col justify-between space-y-3">
                <div className="space-y-1.5">
                  <div className="w-8 h-8 rounded-lg bg-purple-500/10 text-purple-600 flex items-center justify-center">
                    <FileJson className="w-4 h-4" />
                  </div>
                  <h4 className="text-sm font-semibold text-foreground">Complete JSON Archive</h4>
                  <p className="text-xs text-muted-foreground">
                    Full personal data backup containing your bookshelf, reviews, goals, and journal notes.
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleExportJsonBackup}
                  className="w-full text-xs"
                >
                  <Download className="w-3.5 h-3.5 mr-1.5" /> Download JSON Backup
                </Button>
              </div>

              {/* Reading Journal Markdown */}
              <div className="p-4 rounded-xl border border-border hover:border-[hsl(var(--brand-primary)/0.5)] transition-all bg-card flex flex-col justify-between space-y-3">
                <div className="space-y-1.5">
                  <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-600 flex items-center justify-center">
                    <FileText className="w-4 h-4" />
                  </div>
                  <h4 className="text-sm font-semibold text-foreground">Journal Markdown (.md)</h4>
                  <p className="text-xs text-muted-foreground">
                    Your reading reflections, book notes, and tags compiled into a clean Markdown notebook.
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleExportJournalMarkdown}
                  className="w-full text-xs"
                >
                  <Download className="w-3.5 h-3.5 mr-1.5" /> Download Journal .md
                </Button>
              </div>

              {/* Privacy & Ownership Guarantee */}
              <div className="p-4 rounded-xl border border-border/80 bg-muted/20 flex flex-col justify-between space-y-2">
                <div className="flex items-center gap-2 text-xs font-semibold text-foreground">
                  <HelpCircle className="w-4 h-4 text-[hsl(var(--brand-primary))]" />
                  Your Data, Your Ownership
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Sahadhyayi upholds digital literacy autonomy. You can export or import your data at any time without platform lock-in.
                </p>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};
