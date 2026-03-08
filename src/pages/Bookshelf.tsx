import React, { useState, useMemo } from 'react';
import { useUserBookshelf, useRemoveFromBookshelf, useUpdateBookshelfItem } from '@/hooks/useUserBookshelf';
import { useAuth } from '@/contexts/authHelpers';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BookOpen, Download, Info, Search, Trash2, BookMarked, CheckCircle, Clock, Library, SortAsc } from 'lucide-react';
import { Link } from 'react-router-dom';
import LoadingSpinner from '@/components/LoadingSpinner';
import SEO from '@/components/SEO';

const statusConfig = {
  reading: { label: 'Reading', icon: BookOpen, color: 'bg-emerald-500/10 text-emerald-700 border-emerald-200' },
  want_to_read: { label: 'Want to Read', icon: Clock, color: 'bg-amber-500/10 text-amber-700 border-amber-200' },
  completed: { label: 'Completed', icon: CheckCircle, color: 'bg-sky-500/10 text-sky-700 border-sky-200' },
} as const;

const Bookshelf = () => {
  const { user } = useAuth();
  const { data: bookshelf = [], isLoading } = useUserBookshelf();
  const removeFromShelf = useRemoveFromBookshelf();
  const updateItem = useUpdateBookshelfItem();

  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<'recent' | 'title' | 'author'>('recent');
  const [activeTab, setActiveTab] = useState('all');

  // Stats
  const stats = useMemo(() => ({
    total: bookshelf.length,
    reading: bookshelf.filter(b => b.status === 'reading').length,
    completed: bookshelf.filter(b => b.status === 'completed').length,
    wantToRead: bookshelf.filter(b => b.status === 'want_to_read').length,
  }), [bookshelf]);

  // Filter & sort
  const filtered = useMemo(() => {
    let items = [...bookshelf];
    if (activeTab !== 'all') items = items.filter(i => i.status === activeTab);
    if (search) {
      const q = search.toLowerCase();
      items = items.filter(i =>
        i.books_library?.title?.toLowerCase().includes(q) ||
        i.books_library?.author?.toLowerCase().includes(q)
      );
    }
    items.sort((a, b) => {
      if (sortBy === 'title') return (a.books_library?.title || '').localeCompare(b.books_library?.title || '');
      if (sortBy === 'author') return (a.books_library?.author || '').localeCompare(b.books_library?.author || '');
      return new Date(b.added_at).getTime() - new Date(a.added_at).getTime();
    });
    return items;
  }, [bookshelf, activeTab, search, sortBy]);

  const handleStatusChange = (id: string, status: 'want_to_read' | 'reading' | 'completed') => {
    updateItem.mutate({ id, updates: { status } });
  };

  if (!user) {
    return (
      <div className="min-h-screen pt-20 flex items-center justify-center">
        <Card className="max-w-md w-full mx-4">
          <CardContent className="p-8 text-center">
            <Library className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
            <h2 className="text-xl font-semibold mb-2">Sign in to view your bookshelf</h2>
            <p className="text-muted-foreground mb-6">Track your reading, organize your books, and more.</p>
            <Link to="/signin"><Button className="bg-[hsl(var(--brand-primary))] hover:bg-[hsl(var(--brand-primary))]/90">Sign In</Button></Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <>
      <SEO
        title="My Bookshelf - Track Your Reading | Sahadhyayi"
        description="Manage your books, track reading progress, and organize your personal digital bookshelf."
        canonical="https://sahadhyayi.com/bookshelf"
        url="https://sahadhyayi.com/bookshelf"
      />
      <div className="min-h-screen pt-20 pb-8 px-4">
        <div className="max-w-7xl mx-auto">

          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-2">My Bookshelf</h1>
            <p className="text-muted-foreground">Your personal reading collection</p>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-8">
            {[
              { label: 'Total Books', value: stats.total, icon: Library, accent: 'border-l-[hsl(var(--brand-primary))]' },
              { label: 'Reading', value: stats.reading, icon: BookOpen, accent: 'border-l-emerald-500' },
              { label: 'Completed', value: stats.completed, icon: CheckCircle, accent: 'border-l-sky-500' },
              { label: 'Want to Read', value: stats.wantToRead, icon: Clock, accent: 'border-l-amber-500' },
            ].map(s => (
              <Card key={s.label} className={`border-l-4 ${s.accent}`}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">{s.label}</p>
                      <p className="text-2xl md:text-3xl font-bold text-foreground mt-1">{s.value}</p>
                    </div>
                    <s.icon className="w-8 h-8 text-muted-foreground/30" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Tabs + Search/Sort */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
            <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-4">
              <TabsList className="bg-muted/50 self-start">
                <TabsTrigger value="all">All ({stats.total})</TabsTrigger>
                <TabsTrigger value="reading">Reading ({stats.reading})</TabsTrigger>
                <TabsTrigger value="want_to_read">Want to Read ({stats.wantToRead})</TabsTrigger>
                <TabsTrigger value="completed">Completed ({stats.completed})</TabsTrigger>
              </TabsList>
              <div className="flex gap-2 sm:ml-auto">
                <div className="relative flex-1 sm:w-56">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input placeholder="Search books..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
                </div>
                <Select value={sortBy} onValueChange={(v: any) => setSortBy(v)}>
                  <SelectTrigger className="w-36">
                    <SortAsc className="w-4 h-4 mr-1" />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="recent">Recent</SelectItem>
                    <SelectItem value="title">Title</SelectItem>
                    <SelectItem value="author">Author</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {isLoading ? (
              <LoadingSpinner />
            ) : filtered.length === 0 ? (
              <Card>
                <CardContent className="p-12 text-center">
                  <BookMarked className="w-16 h-16 mx-auto mb-4 text-muted-foreground/40" />
                  <h3 className="text-lg font-semibold text-foreground mb-2">
                    {search ? 'No books match your search' : activeTab !== 'all' ? `No books in "${statusConfig[activeTab as keyof typeof statusConfig]?.label}"` : 'Your bookshelf is empty'}
                  </h3>
                  <p className="text-muted-foreground mb-6">
                    {search ? 'Try a different search term.' : 'Discover books in our library and start building your collection.'}
                  </p>
                  {!search && (
                    <Link to="/library">
                      <Button className="bg-[hsl(var(--brand-primary))] hover:bg-[hsl(var(--brand-primary))]/90">
                        <BookOpen className="w-4 h-4 mr-2" /> Browse Library
                      </Button>
                    </Link>
                  )}
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                {filtered.map(item => {
                  const book = item.books_library;
                  if (!book) return null;
                  const cfg = statusConfig[item.status as keyof typeof statusConfig];
                  const StatusIcon = cfg?.icon || BookOpen;

                  return (
                    <Card key={item.id} className="group overflow-hidden hover:shadow-lg transition-all duration-300 hover:-translate-y-1 bg-card border-border">
                      {/* Cover */}
                      <div className="aspect-[3/4] relative overflow-hidden">
                        {book.cover_image_url ? (
                          <img src={book.cover_image_url} alt={book.title} loading="lazy"
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-[hsl(var(--brand-primary))]/20 to-[hsl(var(--brand-secondary))]/20 flex items-center justify-center">
                            <BookOpen className="w-12 h-12 text-muted-foreground/40" />
                          </div>
                        )}
                        {/* Status badge */}
                        <Badge className={`absolute top-2 right-2 ${cfg?.color || 'bg-muted text-muted-foreground'} border text-xs`}>
                          <StatusIcon className="w-3 h-3 mr-1" />
                          {cfg?.label || item.status}
                        </Badge>
                        {/* Hover overlay */}
                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center gap-3">
                          <Link to={`/book/${book.id}`} className="w-10 h-10 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-white transition-colors" title="View Details">
                            <Info className="w-5 h-5" />
                          </Link>
                          {book.pdf_url && (
                            <a href={book.pdf_url} download={`${book.title}.pdf`} className="w-10 h-10 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-white transition-colors" title="Download">
                              <Download className="w-5 h-5" />
                            </a>
                          )}
                          <button onClick={() => removeFromShelf.mutate(item.id)} className="w-10 h-10 rounded-full bg-red-500/20 hover:bg-red-500/40 flex items-center justify-center text-white transition-colors" title="Remove">
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </div>
                      </div>

                      <CardContent className="p-4 space-y-3">
                        <div>
                          <h3 className="font-semibold text-foreground line-clamp-2 leading-tight">
                            <Link to={`/book/${book.id}`} className="hover:text-[hsl(var(--brand-primary))] transition-colors">{book.title}</Link>
                          </h3>
                          {book.author && <p className="text-sm text-muted-foreground mt-1 truncate">{book.author}</p>}
                        </div>

                        {/* Genre + year */}
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {book.genre && <span className="text-xs bg-muted px-2 py-0.5 rounded-full text-muted-foreground">{book.genre}</span>}
                          {book.publication_year && <span className="text-xs text-muted-foreground">{book.publication_year}</span>}
                        </div>

                        {/* Status selector */}
                        <Select value={item.status} onValueChange={(v: any) => handleStatusChange(item.id, v)}>
                          <SelectTrigger className="h-8 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="want_to_read">Want to Read</SelectItem>
                            <SelectItem value="reading">Reading</SelectItem>
                            <SelectItem value="completed">Completed</SelectItem>
                          </SelectContent>
                        </Select>

                        {/* Added date */}
                        <p className="text-[11px] text-muted-foreground">Added {new Date(item.added_at).toLocaleDateString()}</p>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </Tabs>
        </div>
      </div>
    </>
  );
};

export default Bookshelf;
