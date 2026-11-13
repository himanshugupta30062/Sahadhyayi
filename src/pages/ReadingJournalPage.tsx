import { useEffect, useMemo, useState } from 'react';
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
} from 'lucide-react';
import { useReadingJournal } from '@/hooks/useReadingJournal';
import { useUpdateReaderHighlight } from '@/hooks/useReaderHighlights';
import {
  useJournalCollections,
  useJournalEntryMappings,
  useCreateJournalCollection,
  useRenameJournalCollection,
  useDeleteJournalCollection,
  useAssignEntryCollection,
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

  // Collections queries and mutations
  const { data: collections = [] } = useJournalCollections();
  const { data: entryCollectionMap = {} } = useJournalEntryMappings();
  const createCollectionMutation = useCreateJournalCollection();
  const renameCollectionMutation = useRenameJournalCollection();
  const deleteCollectionMutation = useDeleteJournalCollection();
  const assignCollectionMutation = useAssignEntryCollection();

  const [filter, setFilter] = useState<Filter>('all');
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState<'recent' | 'page'>('recent');
  const [collectionFilter, setCollectionFilter] = useState<string>('all');
  const [newCollectionName, setNewCollectionName] = useState('');

  // Manage collection dialog
  const [editingCollectionId, setEditingCollectionId] = useState<string | null>(null);
  const [editCollectionName, setEditCollectionName] = useState('');

  // Editing highlight inline
  const [editing, setEditing] = useState<string | null>(null);
  const [editText, setEditText] = useState('');
  const [editPage, setEditPage] = useState('1');
  const [editColor, setEditColor] = useState<'yellow' | 'green' | 'blue' | 'pink'>('yellow');

  // Metadata: favorite, pinned, tags
  const [meta, setMeta] = useState<Record<string, { favorite?: boolean; pinned?: boolean; tags?: string[] }>>({});
  const [tagInput, setTagInput] = useState<Record<string, string>>({});

  useEffect(() => {
    try {
      setMeta(JSON.parse(localStorage.getItem('journal-entry-meta') || '{}'));
    } catch {
      setMeta({});
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('journal-entry-meta', JSON.stringify(meta));
  }, [meta]);

  const toggleMeta = (id: string, key: 'favorite' | 'pinned') => {
    setMeta((prev) => ({
      ...prev,
      [id]: { ...prev[id], [key]: !prev[id]?.[key] },
    }));
  };

  const addTag = (id: string) => {
    const tag = (tagInput[id] || '').trim().replace(/^#/, '');
    if (!tag) return;
    setMeta((prev) => ({
      ...prev,
      [id]: {
        ...prev[id],
        tags: Array.from(new Set([...(prev[id]?.tags || []), tag])).slice(0, 10),
      },
    }));
    setTagInput((prev) => ({ ...prev, [id]: '' }));
  };

  const removeTag = (id: string, tag: string) => {
    setMeta((prev) => ({
      ...prev,
      [id]: {
        ...prev[id],
        tags: (prev[id]?.tags || []).filter((t) => t !== tag),
      },
    }));
  };

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
    if (!window.confirm('Delete this collection? Entries inside will remain in your journal.')) {
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

  // Entry collection name lookup
  const collectionNameById = useMemo(() => {
    const map = new Map<string, string>();
    collections.forEach((c) => map.set(c.id, c.name));
    return map;
  }, [collections]);

  // Entry counts by collection
  const collectionCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    Object.values(entryCollectionMap).forEach((colId) => {
      counts[colId] = (counts[colId] || 0) + 1;
    });
    return counts;
  }, [entryCollectionMap]);

  const filtered = useMemo(() => {
    const term = search.trim().toLocaleLowerCase();
    return entries
      .filter((entry) => {
        const matchesType = filter === 'all' || entry.type === filter;
        const entryCollectionId = entryCollectionMap[entry.id];
        const matchesCollection =
          collectionFilter === 'all' || entryCollectionId === collectionFilter;

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

        return matchesType && matchesCollection && (!term || haystack.includes(term));
      })
      .sort((a, b) => {
        // Pinned first
        const aPinned = meta[a.id]?.pinned ? 1 : 0;
        const bPinned = meta[b.id]?.pinned ? 1 : 0;
        if (aPinned !== bPinned) return bPinned - aPinned;

        return sort === 'recent'
          ? new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          : a.page - b.page;
      });
  }, [entries, filter, search, sort, collectionFilter, entryCollectionMap, meta, collectionNameById]);

  const counts = {
    reflection: entries.filter((e) => e.type === 'reflection').length,
    highlight: entries.filter((e) => e.type === 'highlight').length,
    quote: entries.filter((e) => e.type === 'quote').length,
  };

  const exportMarkdown = () => {
    const markdown = [
      '# My Reading Journal',
      '',
      `Exported ${new Date().toLocaleDateString()}`,
      '',
      ...filtered.flatMap((entry) => {
        const colId = entryCollectionMap[entry.id];
        const colName = colId ? collectionNameById.get(colId) : undefined;
        return [
          `## ${entry.bookTitle || 'Book'} — ${entry.type}`,
          `Page: ${entry.page || '—'} · ${
            entry.createdAt ? new Date(entry.createdAt).toLocaleDateString() : ''
          }${colName ? ` · Collection: ${colName}` : ''}`,
          '',
          entry.text ? `> ${entry.text.replace(/\n/g, '\n> ')}` : '',
          entry.note || '',
          '',
        ];
      }),
    ].join('\n');
    const blob = new Blob([markdown], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = 'reading-journal.md';
    anchor.click();
    URL.revokeObjectURL(url);
    toast.success('Journal exported as Markdown');
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
      <header className="rounded-2xl border bg-gradient-to-br from-amber-50 via-background to-orange-50 p-6 dark:from-amber-950/20 dark:to-orange-950/20">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <BookOpen className="h-4 w-4" /> Your private reading space
        </div>
        <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-3xl font-bold tracking-tight">Reading Journal</h1>
          <Button variant="outline" onClick={exportMarkdown}>
            <Download className="mr-2 h-4 w-4" />
            Export Markdown
          </Button>
        </div>
        <p className="mt-2 max-w-2xl text-muted-foreground">
          Every reflection, highlight, and saved quote—together, searchable, organized in collections,
          and connected to the book and page that inspired it.
        </p>
        <div className="mt-5 flex flex-wrap gap-2">
          <Badge variant="secondary">{entries.length} entries</Badge>
          <Badge variant="outline">{bookSummaries.length} books</Badge>
          <Badge variant="outline">{counts.reflection} reflections</Badge>
          <Badge variant="outline">{counts.highlight} highlights</Badge>
          <Badge variant="outline">{counts.quote} quotes</Badge>
          <Badge variant="outline">{collections.length} collections</Badge>
        </div>
      </header>

      {/* Filters and Search Bar */}
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
        <div className="flex gap-2 overflow-x-auto">
          {(['all', 'reflection', 'highlight', 'quote'] as Filter[]).map((f) => (
            <Button
              key={f}
              size="sm"
              variant={filter === f ? 'default' : 'outline'}
              onClick={() => setFilter(f)}
            >
              {labels[f]}
            </Button>
          ))}
        </div>
        <Select value={collectionFilter} onValueChange={setCollectionFilter}>
          <SelectTrigger className="w-full sm:w-52" aria-label="Filter by collection">
            <Folder className="mr-2 h-4 w-4 text-amber-600" />
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
          onClick={() => setSort((s) => (s === 'recent' ? 'page' : 'recent'))}
        >
          {sort === 'recent' ? 'Newest first' : 'Page order'}
        </Button>
      </div>

      {/* Collection management bar when a collection is selected */}
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

      {/* Add new collection bar */}
      <div className="flex flex-wrap items-center gap-2 rounded-xl border p-3">
        <FolderPlus className="h-4 w-4 text-muted-foreground" />
        <Input
          className="max-w-xs"
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
          onClick={handleCreateCollection}
          disabled={createCollectionMutation.isPending || !newCollectionName.trim()}
        >
          Create collection
        </Button>
        <span className="text-xs text-muted-foreground">
          Organize highlights and reflections into themed folders across all books
        </span>
      </div>

      {/* Entries List or Empty State */}
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
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {filtered.map((entry) => {
            const Icon = icons[entry.type as keyof typeof icons] || BookOpen;
            const currentCollectionId = entryCollectionMap[entry.id];
            const currentCollectionName = currentCollectionId
              ? collectionNameById.get(currentCollectionId)
              : undefined;

            return (
              <Card
                key={entry.id}
                className={`transition-shadow hover:shadow-sm ${
                  meta[entry.id]?.pinned ? 'border-amber-400 bg-amber-50/20 dark:bg-amber-950/10' : ''
                }`}
              >
                <CardContent className="space-y-3 p-4">
                  <div className="flex items-center justify-between gap-2">
                    <Badge variant="outline" className="capitalize">
                      <Icon className="mr-1 h-3 w-3" />
                      {entry.type}
                    </Badge>
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
                      <Badge variant="outline" className="border-amber-300 bg-amber-50 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300">
                        <Folder className="mr-1 h-3 w-3" />
                        {currentCollectionName}
                      </Badge>
                    )}

                    {(meta[entry.id]?.tags || []).map((tag) => (
                      <Badge
                        key={tag}
                        variant="secondary"
                        className="cursor-pointer"
                        onClick={() => removeTag(entry.id, tag)}
                      >
                        #{tag} ×
                      </Badge>
                    ))}

                    <Select
                      value={currentCollectionId || 'none'}
                      onValueChange={(val) => handleAssignCollection(entry.id, val)}
                    >
                      <SelectTrigger className="h-7 w-36 text-xs">
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

                  {/* Entry Content or Edit Mode */}
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
                          className="w-24"
                          value={editPage}
                          onChange={(e) => setEditPage(e.target.value)}
                          aria-label="Highlight page"
                        />
                        <Select
                          value={editColor}
                          onValueChange={(v) => setEditColor(v as typeof editColor)}
                        >
                          <SelectTrigger className="w-32">
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
                          onClick={() => saveEdit(entry)}
                          disabled={updateHighlight.isPending}
                        >
                          Save
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
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

                  {/* Footer details */}
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
          })}
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
    </div>
  );
}
