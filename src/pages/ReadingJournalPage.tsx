import { useEffect, useMemo, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  BookOpen,
  Search,
  PenLine,
  Highlighter,
  Quote,
  ArrowUpRight,
  Library,
  Download,
  Upload,
  Pencil,
  X,
  Star,
  Pin,
  Tags,
  FolderPlus,
  Folder,
  Trash2,
  Edit2,
  FolderOpen,
  CheckSquare,
  Square,
  Layers,
  Calendar,
  Filter as FilterIcon,
  ChevronDown,
  Sparkles,
} from 'lucide-react';
import { useReadingJournal } from '@/hooks/useReadingJournal';
import { useUpdateReaderHighlight } from '@/hooks/useReaderHighlights';
import {
  useJournalCollections,
  useJournalEntryMappings,
  useJournalEntryMeta,
  useUpdateJournalEntryMeta,
  useCreateJournalCollection,
  useRenameJournalCollection,
  useDeleteJournalCollection,
  useAssignEntryCollection,
  useBulkAssignEntriesCollection,
  useBulkTagEntries,
} from '@/hooks/useJournalCollections';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';

type Filter = 'all' | 'reflection' | 'highlight' | 'quote';
const labels: Record<Filter, string> = {
  all: 'Everything',
  reflection: 'Reflections',
  highlight: 'Highlights',
  quote: 'Quotes',
};
const icons = { reflection: PenLine, highlight: Highlighter, quote: Quote };

export default function ReadingJournalPage() {
  const { entries, bookSummaries, isLoading } = useReadingJournal();
  const updateHighlight = useUpdateReaderHighlight();

  // Supabase + local fallback hooks
  const { data: collections = [] } = useJournalCollections();
  const { data: entryCollectionMap = {} } = useJournalEntryMappings();
  const { data: remoteMeta = {} } = useJournalEntryMeta();
  const updateMetaMutation = useUpdateJournalEntryMeta();
  const createCollectionMutation = useCreateJournalCollection();
  const renameCollectionMutation = useRenameJournalCollection();
  const deleteCollectionMutation = useDeleteJournalCollection();
  const assignCollectionMutation = useAssignEntryCollection();
  const bulkAssignCollectionMutation = useBulkAssignEntriesCollection();
  const bulkTagMutation = useBulkTagEntries();

  // Primary filtering and view states
  const [filter, setFilter] = useState<Filter>('all');
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState<'recent' | 'page'>('recent');
  const [collectionFilter, setCollectionFilter] = useState<string>('all');
  const [bookFilter, setBookFilter] = useState<string>('all');
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const [pinnedOnly, setPinnedOnly] = useState(false);
  const [viewMode, setViewMode] = useState<'timeline' | 'by-book'>('timeline');

  // Collection creation & editing
  const [newCollectionName, setNewCollectionName] = useState('');
  const [editingCollectionId, setEditingCollectionId] = useState<string | null>(null);
  const [editCollectionName, setEditCollectionName] = useState('');

  // Inline highlight editing
  const [editing, setEditing] = useState<string | null>(null);
  const [editText, setEditText] = useState('');
  const [editPage, setEditPage] = useState('1');
  const [editColor, setEditColor] = useState<'yellow' | 'green' | 'blue' | 'pink'>('yellow');

  // Metadata: favorite, pinned, tags
  const [meta, setMeta] = useState<Record<string, { favorite?: boolean; pinned?: boolean; tags?: string[] }>>({});
  const [tagInput, setTagInput] = useState<Record<string, string>>({});

  // Bulk actions state
  const [selectedEntryIds, setSelectedEntryIds] = useState<Set<string>>(new Set());
  const [bulkTagInput, setBulkTagInput] = useState('');
  const [isBulkTagDialogOpen, setIsBulkTagDialogOpen] = useState(false);
  const [bulkTargetCollection, setBulkTargetCollection] = useState<string>('none');

  // JSON Import Ref
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync remote metadata when loaded
  useEffect(() => {
    if (remoteMeta && Object.keys(remoteMeta).length > 0) {
      setMeta((prev) => {
        const keys = Object.keys(remoteMeta);
        const hasChange = keys.some((k) => JSON.stringify(prev[k]) !== JSON.stringify(remoteMeta[k]));
        return hasChange ? { ...prev, ...remoteMeta } : prev;
      });
    }
  }, [remoteMeta]);

  // Fallback local storage sync
  useEffect(() => {
    try {
      const stored = localStorage.getItem('journal-entry-meta');
      if (stored) {
        setMeta((prev) => ({ ...JSON.parse(stored), ...prev }));
      }
    } catch {
      // ignore
    }
  }, []);

  const toggleMeta = async (id: string, key: 'favorite' | 'pinned') => {
    const newVal = !meta[id]?.[key];
    setMeta((prev) => ({
      ...prev,
      [id]: { ...prev[id], [key]: newVal },
    }));

    try {
      await updateMetaMutation.mutateAsync({
        entryId: id,
        meta: { [key]: newVal },
      });
    } catch {
      // Offline fallback already updated in local state
    }
  };

  const addTag = async (id: string) => {
    const tag = (tagInput[id] || '').trim().replace(/^#/, '');
    if (!tag) return;
    const currentTags = meta[id]?.tags || [];
    const newTags = Array.from(new Set([...currentTags, tag])).slice(0, 10);

    setMeta((prev) => ({
      ...prev,
      [id]: { ...prev[id], tags: newTags },
    }));
    setTagInput((prev) => ({ ...prev, [id]: '' }));

    try {
      await updateMetaMutation.mutateAsync({
        entryId: id,
        meta: { tags: newTags },
      });
    } catch {
      // Offline fallback preserved
    }
  };

  const removeTag = async (id: string, tag: string) => {
    const currentTags = meta[id]?.tags || [];
    const newTags = currentTags.filter((t) => t !== tag);

    setMeta((prev) => ({
      ...prev,
      [id]: { ...prev[id], tags: newTags },
    }));

    try {
      await updateMetaMutation.mutateAsync({
        entryId: id,
        meta: { tags: newTags },
      });
    } catch {
      // Offline fallback preserved
    }
  };

  // Collection management handlers
  const handleCreateCollection = async () => {
    const name = newCollectionName.trim();
    if (!name) return;
    try {
      await createCollectionMutation.mutateAsync({ name });
      setNewCollectionName('');
    } catch {
      // Handled in mutation onError
    }
  };

  const handleAssignCollection = async (entryId: string, selectedColId: string) => {
    const colId = selectedColId === 'none' ? null : selectedColId;
    try {
      await assignCollectionMutation.mutateAsync({ entryId, collectionId: colId });
    } catch (err: any) {
      toast.error(err.message || 'Failed to update collection');
    }
  };

  const handleSaveRenameCollection = async () => {
    if (!editingCollectionId || !editCollectionName.trim()) return;
    try {
      await renameCollectionMutation.mutateAsync({
        id: editingCollectionId,
        newName: editCollectionName.trim(),
      });
      setEditingCollectionId(null);
      setEditCollectionName('');
    } catch (err: any) {
      toast.error(err.message || 'Failed to rename collection');
    }
  };

  const handleDeleteCollection = async (id: string) => {
    if (!window.confirm('Delete this collection? Entries inside will remain safe in your journal.')) {
      return;
    }
    try {
      await deleteCollectionMutation.mutateAsync(id);
      if (collectionFilter === id) {
        setCollectionFilter('all');
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete collection');
    }
  };

  // Lookup helpers
  const collectionNameById = useMemo(() => {
    const map = new Map<string, string>();
    collections.forEach((c) => map.set(c.id, c.name));
    return map;
  }, [collections]);

  const collectionCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    Object.values(entryCollectionMap).forEach((colId) => {
      counts[colId] = (counts[colId] || 0) + 1;
    });
    return counts;
  }, [entryCollectionMap]);

  // Main filtered entries
  const filtered = useMemo(() => {
    const term = search.trim().toLocaleLowerCase();
    return entries
      .filter((entry) => {
        const matchesType = filter === 'all' || entry.type === filter;
        const entryCollectionId = entryCollectionMap[entry.id];
        const matchesCollection =
          collectionFilter === 'all' || entryCollectionId === collectionFilter;
        const matchesBook = bookFilter === 'all' || entry.bookId === bookFilter;
        const matchesFavorite = !favoritesOnly || Boolean(meta[entry.id]?.favorite);
        const matchesPinned = !pinnedOnly || Boolean(meta[entry.id]?.pinned);

        const haystack = [
          entry.text,
          entry.note,
          entry.bookTitle,
          String(entry.page),
          ...(meta[entry.id]?.tags || []),
          entryCollectionId ? collectionNameById.get(entryCollectionId) : '',
        ]
          .filter(Boolean)
          .join(' ')
          .toLocaleLowerCase();

        return (
          matchesType &&
          matchesCollection &&
          matchesBook &&
          matchesFavorite &&
          matchesPinned &&
          (!term || haystack.includes(term))
        );
      })
      .sort((a, b) => {
        const aPinned = meta[a.id]?.pinned ? 1 : 0;
        const bPinned = meta[b.id]?.pinned ? 1 : 0;
        if (aPinned !== bPinned) return bPinned - aPinned;

        return sort === 'recent'
          ? new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          : a.page - b.page;
      });
  }, [
    entries,
    filter,
    search,
    sort,
    collectionFilter,
    bookFilter,
    favoritesOnly,
    pinnedOnly,
    entryCollectionMap,
    meta,
    collectionNameById,
  ]);

  // Grouped entries by book for By-Book View
  const groupedByBook = useMemo(() => {
    const map = new Map<string, { title: string; entries: typeof filtered }>();
    filtered.forEach((item) => {
      const key = item.bookId || 'other';
      const existing = map.get(key) || {
        title: item.bookTitle || 'General Reflections',
        entries: [],
      };
      existing.entries.push(item);
      map.set(key, existing);
    });
    return Array.from(map.entries()).map(([bookId, data]) => ({
      bookId,
      title: data.title,
      entries: data.entries,
    }));
  }, [filtered]);

  const counts = {
    reflection: entries.filter((e) => e.type === 'reflection').length,
    highlight: entries.filter((e) => e.type === 'highlight').length,
    quote: entries.filter((e) => e.type === 'quote').length,
  };

  // Bulk Selection Logic
  const handleToggleSelectAll = () => {
    if (selectedEntryIds.size === filtered.length) {
      setSelectedEntryIds(new Set());
    } else {
      setSelectedEntryIds(new Set(filtered.map((e) => e.id)));
    }
  };

  const handleToggleSelectEntry = (id: string) => {
    const next = new Set(selectedEntryIds);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setSelectedEntryIds(next);
  };

  const handleExecuteBulkAssign = async () => {
    const target = bulkTargetCollection === 'none' ? null : bulkTargetCollection;
    const ids = Array.from(selectedEntryIds);
    try {
      await bulkAssignCollectionMutation.mutateAsync({
        entryIds: ids,
        collectionId: target,
      });
      setSelectedEntryIds(new Set());
    } catch (err: any) {
      toast.error(err.message || 'Failed bulk collection assignment');
    }
  };

  const handleExecuteBulkTag = async () => {
    const tags = bulkTagInput.split(',').map((t) => t.trim()).filter(Boolean);
    if (tags.length === 0) return;
    const ids = Array.from(selectedEntryIds);
    try {
      await bulkTagMutation.mutateAsync({
        entryIds: ids,
        tagsToAdd: tags,
      });
      setIsBulkTagDialogOpen(false);
      setBulkTagInput('');
      setSelectedEntryIds(new Set());
    } catch (err: any) {
      toast.error(err.message || 'Failed bulk tagging');
    }
  };

  // Multi-format Export Handlers
  const exportToMarkdown = (exportList = filtered, filename = 'reading-journal.md') => {
    if (exportList.length === 0) {
      toast.error('No entries to export');
      return;
    }

    const markdown = [
      '# My Reading Journal',
      '',
      `Exported on ${new Date().toLocaleDateString()}`,
      '',
      ...exportList.flatMap((entry) => {
        const colId = entryCollectionMap[entry.id];
        const colName = colId ? collectionNameById.get(colId) : undefined;
        const tags = meta[entry.id]?.tags?.map((t) => `#${t}`).join(' ') || '';
        return [
          `## ${entry.bookTitle || 'Book'} — ${entry.type}`,
          `Page: ${entry.page || '—'} · ${
            entry.createdAt ? new Date(entry.createdAt).toLocaleDateString() : ''
          }${colName ? ` · Collection: ${colName}` : ''}${tags ? ` · ${tags}` : ''}`,
          '',
          entry.text ? `> ${entry.text.replace(/\n/g, '\n> ')}` : '',
          entry.note || '',
          '',
          '---',
          '',
        ];
      }),
    ].join('\n');

    const blob = new Blob([markdown], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = filename;
    anchor.click();
    URL.revokeObjectURL(url);
    toast.success(`Exported ${exportList.length} entries to ${filename}`);
  };

  const exportHighlightsCsv = () => {
    const highlights = entries.filter((e) => e.type === 'highlight');
    if (highlights.length === 0) {
      toast.error('No highlights available to export');
      return;
    }

    const csvRows = [
      ['Book Title', 'Page', 'Highlight Text', 'Color', 'Date Created'],
      ...highlights.map((h) => [
        `"${(h.bookTitle || 'Book').replace(/"/g, '""')}"`,
        String(h.page || 1),
        `"${(h.text || '').replace(/"/g, '""')}"`,
        h.color || 'yellow',
        h.createdAt ? new Date(h.createdAt).toLocaleDateString() : '',
      ]),
    ];

    const csv = '\uFEFF' + csvRows.map((r) => r.join(',')).join('\r\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = 'sahadhyayi_highlights.csv';
    anchor.click();
    URL.revokeObjectURL(url);
    toast.success('Highlights exported as CSV');
  };

  const exportQuotesCsv = () => {
    const quotes = entries.filter((e) => e.type === 'quote');
    if (quotes.length === 0) {
      toast.error('No quotes available to export');
      return;
    }

    const csvRows = [
      ['Source / Book', 'Quote Text', 'Note', 'Page', 'Date Added'],
      ...quotes.map((q) => [
        `"${(q.bookTitle || 'Quote').replace(/"/g, '""')}"`,
        `"${(q.text || '').replace(/"/g, '""')}"`,
        `"${(q.note || '').replace(/"/g, '""')}"`,
        String(q.page || 1),
        q.createdAt ? new Date(q.createdAt).toLocaleDateString() : '',
      ]),
    ];

    const csv = '\uFEFF' + csvRows.map((r) => r.join(',')).join('\r\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = 'sahadhyayi_quotes.csv';
    anchor.click();
    URL.revokeObjectURL(url);
    toast.success('Quotes exported as CSV');
  };

  const exportFullJsonBackup = () => {
    const backup = {
      version: 'sahadhyayi-journal-backup-v1',
      exportedAt: new Date().toISOString(),
      collections: collections.map((c) => ({
        id: c.id,
        name: c.name,
        description: c.description,
        color: c.color,
      })),
      entries: entries.map((e) => ({
        id: e.id,
        type: e.type,
        bookId: e.bookId,
        bookTitle: e.bookTitle,
        page: e.page,
        text: e.text,
        note: e.note,
        createdAt: e.createdAt,
        collectionId: entryCollectionMap[e.id] || null,
        metadata: meta[e.id] || {},
      })),
    };

    const json = JSON.stringify(backup, null, 2);
    const blob = new Blob([json], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `sahadhyayi_journal_backup_${new Date().toISOString().slice(0, 10)}.json`;
    anchor.click();
    URL.revokeObjectURL(url);
    toast.success('Complete journal JSON archive downloaded');
  };

  const handleImportJsonFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const text = event.target?.result as string;
        const parsed = JSON.parse(text);

        if (!parsed.collections && !parsed.entries) {
          throw new Error('Invalid journal backup format');
        }

        let importedCols = 0;
        if (Array.isArray(parsed.collections)) {
          for (const col of parsed.collections) {
            if (col.name && !collections.some((c) => c.name.toLowerCase() === col.name.toLowerCase())) {
              await createCollectionMutation.mutateAsync({
                name: col.name,
                description: col.description,
              });
              importedCols++;
            }
          }
        }

        toast.success(`Journal backup parsed! Restored ${importedCols} collections.`);
      } catch (err: any) {
        toast.error(err.message || 'Could not parse JSON backup file');
      }
    };
    reader.readAsText(file);
  };

  const beginEdit = (entry: (typeof entries)[number]) => {
    setEditing(entry.id);
    setEditText(entry.text || '');
    setEditPage(String(entry.page || 1));
    setEditColor((entry.color as typeof editColor) || 'yellow');
  };

  const saveEdit = async (entry: (typeof entries)[number]) => {
    try {
      await updateHighlight.mutateAsync({
        id: entry.id,
        bookId: entry.bookId,
        text: editText,
        page: Number(editPage) || 1,
        color: editColor,
      });
      setEditing(null);
      toast.success('Highlight updated');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not update highlight');
    }
  };

  const activeCollectionObj = collections.find((c) => c.id === collectionFilter);

  return (
    <div className="container mx-auto max-w-5xl space-y-6 px-4 py-8">
      {/* Header Banner */}
      <header className="rounded-2xl border bg-gradient-to-br from-amber-50 via-background to-orange-50 p-6 dark:from-amber-950/20 dark:to-orange-950/20">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <BookOpen className="h-4 w-4" /> Your private reading space
        </div>
        <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-3xl font-bold tracking-tight">Reading Journal</h1>
          <div className="flex flex-wrap items-center gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              className="hidden"
              onChange={handleImportJsonFile}
            />
            <Button
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="mr-1.5 h-3.5 w-3.5" />
              Restore Backup
            </Button>

            {/* Export Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <Download className="mr-1.5 h-3.5 w-3.5" />
                  Export Journal
                  <ChevronDown className="ml-1 h-3.5 w-3.5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>Export Options</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => exportToMarkdown(filtered, 'journal_filtered.md')}>
                  Export Current View (.md)
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => exportToMarkdown(entries, 'journal_complete.md')}>
                  Export Entire Journal (.md)
                </DropdownMenuItem>
                <DropdownMenuItem onClick={exportHighlightsCsv}>
                  Export Highlights (CSV)
                </DropdownMenuItem>
                <DropdownMenuItem onClick={exportQuotesCsv}>
                  Export Quotes (CSV)
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={exportFullJsonBackup}>
                  Full JSON Archive Backup
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
        <p className="mt-2 max-w-2xl text-muted-foreground">
          Every reflection, highlight, and saved quote—together, searchable, organized in collections,
          and connected to the book and page that inspired it.
        </p>
        <div className="mt-5 flex flex-wrap items-center gap-2">
          <Badge variant="secondary">{entries.length} entries</Badge>
          <Badge variant="outline">{bookSummaries.length} books</Badge>
          <Badge variant="outline">{counts.reflection} reflections</Badge>
          <Badge variant="outline">{counts.highlight} highlights</Badge>
          <Badge variant="outline">{counts.quote} quotes</Badge>
          <Badge variant="outline">{collections.length} collections</Badge>
        </div>
      </header>

      {/* View Switcher and Quick Toggles */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b pb-3">
        <div className="flex items-center gap-1.5">
          <Button
            size="sm"
            variant={viewMode === 'timeline' ? 'default' : 'ghost'}
            className="h-8 text-xs gap-1.5"
            onClick={() => setViewMode('timeline')}
          >
            <Calendar className="h-3.5 w-3.5" /> Timeline View
          </Button>
          <Button
            size="sm"
            variant={viewMode === 'by-book' ? 'default' : 'ghost'}
            className="h-8 text-xs gap-1.5"
            onClick={() => setViewMode('by-book')}
          >
            <Layers className="h-3.5 w-3.5" /> By Book
          </Button>
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant={favoritesOnly ? 'default' : 'outline'}
            className="h-8 text-xs gap-1"
            onClick={() => setFavoritesOnly(!favoritesOnly)}
          >
            <Star className={`h-3.5 w-3.5 ${favoritesOnly ? 'fill-current text-amber-300' : ''}`} />
            Favorites
          </Button>
          <Button
            size="sm"
            variant={pinnedOnly ? 'default' : 'outline'}
            className="h-8 text-xs gap-1"
            onClick={() => setPinnedOnly(!pinnedOnly)}
          >
            <Pin className={`h-3.5 w-3.5 ${pinnedOnly ? 'fill-current' : ''}`} />
            Pinned
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="h-8 text-xs"
            onClick={handleToggleSelectAll}
          >
            {selectedEntryIds.size === filtered.length && filtered.length > 0 ? (
              <>
                <CheckSquare className="mr-1.5 h-3.5 w-3.5 text-primary" /> Deselect All
              </>
            ) : (
              <>
                <Square className="mr-1.5 h-3.5 w-3.5 text-muted-foreground" /> Select All
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Floating / Sticky Bulk Action Bar */}
      {selectedEntryIds.size > 0 && (
        <div className="sticky top-4 z-40 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-primary/30 bg-primary/10 p-3 shadow-md backdrop-blur-md">
          <div className="flex items-center gap-2">
            <Badge className="bg-primary text-primary-foreground font-semibold">
              {selectedEntryIds.size} selected
            </Badge>
            <span className="text-xs text-foreground font-medium">Bulk Actions:</span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Select value={bulkTargetCollection} onValueChange={setBulkTargetCollection}>
              <SelectTrigger className="h-8 w-40 text-xs bg-background">
                <SelectValue placeholder="Assign Collection" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Remove from Collection</SelectItem>
                {collections.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button
              size="sm"
              variant="outline"
              className="h-8 text-xs bg-background"
              onClick={handleExecuteBulkAssign}
              disabled={bulkAssignCollectionMutation.isPending}
            >
              Assign
            </Button>

            <Button
              size="sm"
              variant="outline"
              className="h-8 text-xs bg-background gap-1"
              onClick={() => setIsBulkTagDialogOpen(true)}
            >
              <Tags className="h-3 w-3" /> Add Tags
            </Button>

            <Button
              size="sm"
              variant="outline"
              className="h-8 text-xs bg-background gap-1"
              onClick={() => {
                const list = entries.filter((e) => selectedEntryIds.has(e.id));
                exportToMarkdown(list, 'selected_entries.md');
              }}
            >
              <Download className="h-3 w-3" /> Export Selected
            </Button>

            <Button
              size="sm"
              variant="ghost"
              className="h-8 text-xs text-muted-foreground"
              onClick={() => setSelectedEntryIds(new Set())}
            >
              Clear
            </Button>
          </div>
        </div>
      )}

      {/* Search and Secondary Filter Row */}
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="pl-9"
            aria-label="Search journal"
            placeholder="Search text, book, tags, or page…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* Type Filter Buttons */}
        <div className="flex gap-1.5 overflow-x-auto">
          {(['all', 'reflection', 'highlight', 'quote'] as Filter[]).map((f) => (
            <Button
              key={f}
              size="sm"
              variant={filter === f ? 'default' : 'outline'}
              className="h-9 text-xs"
              onClick={() => setFilter(f)}
            >
              {labels[f]}
            </Button>
          ))}
        </div>

        {/* Book Filter Select */}
        <Select value={bookFilter} onValueChange={setBookFilter}>
          <SelectTrigger className="w-full sm:w-44 h-9 text-xs" aria-label="Filter by book">
            <BookOpen className="mr-1.5 h-3.5 w-3.5 text-muted-foreground" />
            <SelectValue placeholder="All Books" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Books</SelectItem>
            {bookSummaries.map((b) => (
              <SelectItem key={b.bookId} value={b.bookId}>
                {b.bookTitle} ({b.totalEntriesCount})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Collection Filter Select */}
        <Select value={collectionFilter} onValueChange={setCollectionFilter}>
          <SelectTrigger className="w-full sm:w-48 h-9 text-xs" aria-label="Filter by collection">
            <Folder className="mr-1.5 h-3.5 w-3.5 text-amber-600" />
            <SelectValue placeholder="All collections" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All collections</SelectItem>
            {collections.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {c.name} ({collectionCounts[c.id] || 0})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Button
          size="sm"
          variant="ghost"
          className="h-9 text-xs"
          onClick={() => setSort((s) => (s === 'recent' ? 'page' : 'recent'))}
        >
          {sort === 'recent' ? 'Newest first' : 'Page order'}
        </Button>
      </div>

      {/* Active Collection Banner with Rename/Delete */}
      {activeCollectionObj && (
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-amber-200 bg-amber-50/50 p-3 dark:border-amber-900/40 dark:bg-amber-950/20">
          <div className="flex items-center gap-2">
            <FolderOpen className="h-5 w-5 text-amber-600" />
            <div>
              <span className="font-semibold text-foreground">{activeCollectionObj.name}</span>
              {activeCollectionObj.description && (
                <p className="text-xs text-muted-foreground">{activeCollectionObj.description}</p>
              )}
            </div>
            <Badge variant="secondary" className="ml-2">
              {collectionCounts[activeCollectionObj.id] || 0} entries
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                setEditingCollectionId(activeCollectionObj.id);
                setEditCollectionName(activeCollectionObj.name);
              }}
            >
              <Edit2 className="mr-1 h-3.5 w-3.5" />
              Rename
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="text-destructive hover:bg-destructive/10"
              onClick={() => handleDeleteCollection(activeCollectionObj.id)}
            >
              <Trash2 className="mr-1 h-3.5 w-3.5" />
              Delete
            </Button>
          </div>
        </div>
      )}

      {/* Create New Collection Inline Bar */}
      <div className="flex flex-wrap items-center gap-2 rounded-xl border p-3 bg-card">
        <FolderPlus className="h-4 w-4 text-muted-foreground" />
        <Input
          className="max-w-xs h-9 text-xs"
          placeholder="New collection name (e.g. Favorite Philosophy, Thesis Quotes)…"
          value={newCollectionName}
          onChange={(e) => setNewCollectionName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              void handleCreateCollection();
            }
          }}
        />
        <Button
          size="sm"
          className="h-9 text-xs"
          onClick={handleCreateCollection}
          disabled={createCollectionMutation.isPending}
        >
          Create collection
        </Button>
        <span className="text-xs text-muted-foreground">
          Organize highlights and reflections into themed folders across all books
        </span>
      </div>

      {/* Render Main Content */}
      {isLoading ? (
        <div className="py-16 text-center text-muted-foreground">Loading your journal…</div>
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-14 text-center">
            <Library className="h-8 w-8 text-muted-foreground" />
            <h2 className="font-semibold">
              {entries.length ? 'No matching entries' : 'Your journal is waiting'}
            </h2>
            <p className="max-w-md text-sm text-muted-foreground">
              {entries.length
                ? 'Try a different search or filter.'
                : 'Save a reflection, highlight, or quote while reading; it will appear here automatically.'}
            </p>
            <Button asChild variant="outline">
              <Link to="/bookshelf">Explore your bookshelf</Link>
            </Button>
          </CardContent>
        </Card>
      ) : viewMode === 'by-book' ? (
        /* BY-BOOK GROUPED VIEW */
        <div className="space-y-6">
          {groupedByBook.map((group) => (
            <div key={group.bookId} className="space-y-3">
              <div className="flex items-center justify-between border-b pb-2">
                <div className="flex items-center gap-2">
                  <BookOpen className="h-4 w-4 text-primary" />
                  <h3 className="font-semibold text-foreground text-base">{group.title}</h3>
                  <Badge variant="secondary" className="text-xs">
                    {group.entries.length} notes
                  </Badge>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7 text-xs"
                  onClick={() => exportToMarkdown(group.entries, `${group.title}_notes.md`)}
                >
                  <Download className="mr-1 h-3 w-3" /> Export Book Notes
                </Button>
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                {group.entries.map((entry) => renderEntryCard(entry))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* TIMELINE VIEW */
        <div className="grid gap-3 md:grid-cols-2">
          {filtered.map((entry) => renderEntryCard(entry))}
        </div>
      )}

      {/* Rename Collection Dialog */}
      <Dialog
        open={!!editingCollectionId}
        onOpenChange={(open) => !open && setEditingCollectionId(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rename Collection</DialogTitle>
            <DialogDescription>
              Update the name of this reading collection. All entries inside will stay mapped.
            </DialogDescription>
          </DialogHeader>
          <div className="py-2">
            <Input
              value={editCollectionName}
              onChange={(e) => setEditCollectionName(e.target.value)}
              placeholder="Collection name"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  void handleSaveRenameCollection();
                }
              }}
            />
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setEditingCollectionId(null)}>
              Cancel
            </Button>
            <Button
              onClick={handleSaveRenameCollection}
              disabled={renameCollectionMutation.isPending || !editCollectionName.trim()}
            >
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk Tag Dialog */}
      <Dialog open={isBulkTagDialogOpen} onOpenChange={setIsBulkTagDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Tags in Bulk</DialogTitle>
            <DialogDescription>
              Enter tags separated by commas to add to all {selectedEntryIds.size} selected entries.
            </DialogDescription>
          </DialogHeader>
          <div className="py-2">
            <Input
              placeholder="e.g. stoicism, mindset, favorite"
              value={bulkTagInput}
              onChange={(e) => setBulkTagInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  void handleExecuteBulkTag();
                }
              }}
            />
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setIsBulkTagDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleExecuteBulkTag}
              disabled={bulkTagMutation.isPending || !bulkTagInput.trim()}
            >
              Apply Tags
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );

  // Card Renderer
  function renderEntryCard(entry: (typeof entries)[number]) {
    const Icon = icons[entry.type as keyof typeof icons] || BookOpen;
    const currentCollectionId = entryCollectionMap[entry.id];
    const currentCollectionName = currentCollectionId
      ? collectionNameById.get(currentCollectionId)
      : undefined;
    const isSelected = selectedEntryIds.has(entry.id);

    return (
      <Card
        key={entry.id}
        className={`transition-all hover:shadow-sm relative ${
          meta[entry.id]?.pinned ? 'border-amber-400 bg-amber-50/20 dark:bg-amber-950/10' : ''
        } ${isSelected ? 'ring-2 ring-primary border-primary' : ''}`}
      >
        <CardContent className="space-y-3 p-4">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <button
                type="button"
                aria-label={`Select entry ${entry.id}`}
                onClick={() => handleToggleSelectEntry(entry.id)}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                {isSelected ? (
                  <CheckSquare className="h-4 w-4 text-primary fill-primary/10" />
                ) : (
                  <Square className="h-4 w-4" />
                )}
              </button>
              <Badge variant="outline" className="capitalize text-xs">
                <Icon className="mr-1 h-3 w-3" />
                {entry.type}
              </Badge>
            </div>

            <span className="text-xs text-muted-foreground">
              {entry.createdAt && new Date(entry.createdAt).getTime() > 0
                ? new Date(entry.createdAt).toLocaleDateString()
                : ''}
            </span>
          </div>

          {/* Actions & Meta Controls */}
          <div className="flex flex-wrap items-center gap-1.5">
            <Button
              size="sm"
              variant="ghost"
              aria-label="Toggle favorite"
              className="h-7 w-7 p-0"
              onClick={() => toggleMeta(entry.id, 'favorite')}
            >
              <Star
                className={
                  'h-3.5 w-3.5 ' +
                  (meta[entry.id]?.favorite ? 'fill-amber-400 text-amber-500' : '')
                }
              />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              aria-label="Pin entry"
              className="h-7 w-7 p-0"
              onClick={() => toggleMeta(entry.id, 'pinned')}
            >
              <Pin
                className={
                  'h-3.5 w-3.5 ' + (meta[entry.id]?.pinned ? 'fill-current text-primary' : '')
                }
              />
            </Button>

            {currentCollectionName && (
              <Badge
                variant="outline"
                className="border-amber-300 bg-amber-50 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300 text-xs"
              >
                <Folder className="mr-1 h-3 w-3" />
                {currentCollectionName}
              </Badge>
            )}

            {(meta[entry.id]?.tags || []).map((tag) => (
              <Badge
                key={tag}
                variant="secondary"
                className="cursor-pointer text-xs"
                onClick={() => removeTag(entry.id, tag)}
              >
                #{tag} ×
              </Badge>
            ))}

            <Select
              value={currentCollectionId || 'none'}
              onValueChange={(val) => handleAssignCollection(entry.id, val)}
            >
              <SelectTrigger className="h-7 w-32 text-xs">
                <SelectValue placeholder="Collection" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No collection</SelectItem>
                {collections.map((col) => (
                  <SelectItem key={col.id} value={col.id}>
                    {col.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="flex items-center gap-1">
              <Input
                className="h-7 w-20 text-xs"
                placeholder="Tag"
                value={tagInput[entry.id] || ''}
                onChange={(e) =>
                  setTagInput((prev) => ({ ...prev, [entry.id]: e.target.value }))
                }
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addTag(entry.id);
                  }
                }}
              />
              <Button
                size="sm"
                variant="ghost"
                className="h-7 w-7 p-0"
                onClick={() => addTag(entry.id)}
              >
                <Tags className="h-3 w-3" />
              </Button>
            </div>
          </div>

          {/* Entry Content or Inline Edit */}
          {editing === entry.id ? (
            <div className="space-y-2">
              <Textarea
                value={editText}
                onChange={(e) => setEditText(e.target.value)}
                aria-label="Edit highlight text"
              />
              <div className="flex flex-wrap gap-2">
                <Input
                  type="number"
                  min="1"
                  className="w-24 h-8 text-xs"
                  value={editPage}
                  onChange={(e) => setEditPage(e.target.value)}
                  aria-label="Highlight page"
                />
                <Select
                  value={editColor}
                  onValueChange={(v) => setEditColor(v as typeof editColor)}
                >
                  <SelectTrigger className="w-28 h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="yellow">Yellow</SelectItem>
                    <SelectItem value="green">Green</SelectItem>
                    <SelectItem value="blue">Blue</SelectItem>
                    <SelectItem value="pink">Pink</SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  size="sm"
                  className="h-8 text-xs"
                  onClick={() => saveEdit(entry)}
                  disabled={updateHighlight.isPending}
                >
                  Save
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-8 text-xs"
                  onClick={() => setEditing(null)}
                >
                  <X className="mr-1 h-3 w-3" />
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <>
              {entry.text && (
                <blockquote className="border-l-2 border-amber-400 pl-3 font-serif text-sm italic leading-relaxed text-foreground/90">
                  “{entry.text}”
                </blockquote>
              )}
              {entry.note && (
                <p className="whitespace-pre-wrap text-sm text-foreground/80">
                  {entry.note}
                </p>
              )}
            </>
          )}

          {/* Card Footer */}
          <div className="flex items-center justify-between border-t pt-2 text-xs text-muted-foreground">
            <span className="truncate">
              {entry.bookTitle || 'Book'} · p. {entry.page}
            </span>
            <div className="flex items-center gap-1">
              {entry.type === 'highlight' && editing !== entry.id && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs"
                  onClick={() => beginEdit(entry)}
                >
                  <Pencil className="mr-1 h-3 w-3" />
                  Edit
                </Button>
              )}
              <Button asChild variant="ghost" size="sm" className="h-7 text-xs">
                <Link
                  to={
                    entry.bookId === 'general'
                      ? '/quotes'
                      : `/reader/${entry.bookId}?page=${entry.page}`
                  }
                >
                  Open <ArrowUpRight className="ml-1 h-3 w-3" />
                </Link>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }
}
