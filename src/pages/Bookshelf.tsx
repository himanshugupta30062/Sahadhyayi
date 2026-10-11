import React, { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/authHelpers';
import { useUserBookshelf, useUpdateBookshelfItem, useRemoveFromBookshelf } from '@/hooks/useUserBookshelf';
import { useReadingProgress } from '@/hooks/useReadingProgress';
import { loadProgressLocally } from '@/utils/readingProgressStorage';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  BookOpen, 
  Download, 
  Info, 
  Search, 
  Library, 
  Clock, 
  CheckCircle, 
  BookMarked,
  MoreVertical,
  Trash2,
  Share2,
  FileSpreadsheet,
  ArrowUpDown,
  Play
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import LoadingSpinner from '@/components/LoadingSpinner';
import SEO from '@/components/SEO';
import { trackUiEvent } from '@/lib/analytics';

type StatusFilter = 'all' | 'reading' | 'completed' | 'want_to_read';
type SortOption = 'recent' | 'progress' | 'title' | 'author';

const Bookshelf = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { data: bookshelfData, isLoading, error } = useUserBookshelf();
  const { data: dbProgress = [] } = useReadingProgress();
  const updateBookshelf = useUpdateBookshelfItem();
  const removeFromBookshelf = useRemoveFromBookshelf();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<StatusFilter>('all');
  const [sortBy, setSortBy] = useState<SortOption>('recent');

  // Stats
  const stats = useMemo(() => {
    if (!bookshelfData) return { all: 0, reading: 0, completed: 0, want_to_read: 0 };
    return {
      all: bookshelfData.length,
      reading: bookshelfData.filter(b => b.status === 'reading').length,
      completed: bookshelfData.filter(b => b.status === 'completed').length,
      want_to_read: bookshelfData.filter(b => b.status === 'want_to_read').length,
    };
  }, [bookshelfData]);

  // Enriched & Filtered books
  const booksWithProgress = useMemo(() => {
    if (!bookshelfData) return [];

    return bookshelfData.map(item => {
      const localProg = loadProgressLocally(item.book_id, user?.id);
      const dbItem = dbProgress.find(p => p.book_id === item.book_id);

      const currentPage = Math.max(localProg?.currentPage || 0, dbItem?.current_page || 0, 1);
      const totalPages = Math.max(localProg?.totalPages || 0, dbItem?.total_pages || 0, 1);
      const hasKnownTotal = totalPages > 1;
      const progressPercent = item.status === 'completed' 
        ? 100 
        : hasKnownTotal 
          ? Math.min(100, Math.round((currentPage / totalPages) * 100))
          : 0;

      return {
        ...item,
        currentPage,
        totalPages,
        hasKnownTotal,
        progressPercent,
      };
    });
  }, [bookshelfData, dbProgress, user?.id]);

  const filteredBooks = useMemo(() => {
    let filtered = [...booksWithProgress];
    
    // Filter by status
    if (activeFilter !== 'all') {
      filtered = filtered.filter(b => b.status === activeFilter);
    }
    
    // Filter by search
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(b => 
        b.books_library?.title?.toLowerCase().includes(query) ||
        b.books_library?.author?.toLowerCase().includes(query) ||
        b.books_library?.genre?.toLowerCase().includes(query)
      );
    }

    // Sort
    filtered.sort((a, b) => {
      if (sortBy === 'progress') {
        return b.progressPercent - a.progressPercent;
      }
      if (sortBy === 'title') {
        return (a.books_library?.title || '').localeCompare(b.books_library?.title || '');
      }
      if (sortBy === 'author') {
        return (a.books_library?.author || '').localeCompare(b.books_library?.author || '');
      }
      // 'recent' default
      return new Date(b.added_at).getTime() - new Date(a.added_at).getTime();
    });
    
    return filtered;
  }, [booksWithProgress, activeFilter, searchQuery, sortBy]);

  const handleStatusChange = (itemId: string, newStatus: 'reading' | 'completed' | 'want_to_read') => {
    updateBookshelf.mutate({ id: itemId, updates: { status: newStatus } });
  };

  const handleRemove = (itemId: string) => {
    removeFromBookshelf.mutate(itemId);
  };

  const handleDownloadPDF = (pdfUrl: string, title: string) => {
    if (!pdfUrl) return;
    const link = document.createElement('a');
    link.href = pdfUrl;
    link.download = `${title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.pdf`;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportCSV = () => {
    if (!bookshelfData || bookshelfData.length === 0) {
      toast({ title: 'Bookshelf is empty', description: 'Add books before exporting.', variant: 'destructive' });
      return;
    }

    const rows = [
      ['Title', 'Author', 'Status', 'Current Page', 'Total Pages', 'Progress %', 'Date Added'],
      ...booksWithProgress.map(item => [
        `"${(item.books_library?.title || 'Untitled').replace(/"/g, '""')}"`,
        `"${(item.books_library?.author || 'Unknown').replace(/"/g, '""')}"`,
        item.status,
        String(item.currentPage),
        String(item.totalPages),
        `${item.progressPercent}%`,
        item.added_at ? new Date(item.added_at).toLocaleDateString() : '',
      ]),
    ];

    const csvContent = 'data:text/csv;charset=utf-8,' + rows.map(r => r.join(',')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `sahadhyayi_bookshelf_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      title: 'Bookshelf Exported',
      description: 'Your shelf CSV file has been generated and downloaded.',
    });
  };

  const handleShareShelf = () => {
    const summary = `📚 My Reading Shelf on Sahadhyayi: ${stats.reading} in progress, ${stats.completed} completed, ${stats.want_to_read} to read! Check it out: ${window.location.origin}/bookshelf`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(summary);
      toast({
        title: 'Shelf Summary Copied!',
        description: 'You can now paste and share your reading stats with friends.',
      });
    }
  };

  const getStatusBadge = (status: string) => {
    const badges = {
      reading: { 
        icon: Clock, 
        label: 'Reading', 
        bg: 'bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/20' 
      },
      completed: { 
        icon: CheckCircle, 
        label: 'Completed', 
        bg: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20' 
      },
      want_to_read: { 
        icon: BookMarked, 
        label: 'Want to Read', 
        bg: 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/20' 
      },
    };
    const badge = badges[status as keyof typeof badges] || badges.want_to_read;
    const Icon = badge.icon;
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium backdrop-blur-xs ${badge.bg}`}>
        <Icon className="w-3 h-3" />
        {badge.label}
      </span>
    );
  };

  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: 'My Bookshelf',
    description: 'Manage your books, track reading progress, and get AI-powered assistance in your personal digital bookshelf.',
    url: 'https://sahadhyayi.com/bookshelf',
  };

  if (!user) {
    return (
      <div className="min-h-screen pt-20 pb-8 px-4 bg-background">
        <div className="max-w-7xl mx-auto text-center py-16">
          <Library className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
          <h1 className="text-2xl font-bold text-foreground mb-2">Sign in to view your bookshelf</h1>
          <p className="text-muted-foreground mb-6">Track your reading progress and manage your book collection.</p>
          <Link to="/signin">
            <Button className="bg-[hsl(var(--brand-primary))] hover:bg-[hsl(var(--brand-primary)/0.9)] text-white">
              Sign In
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen pt-20 pb-8 px-4 bg-background">
        <div className="max-w-7xl mx-auto">
          <LoadingSpinner />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen pt-20 pb-8 px-4 bg-background">
        <div className="max-w-7xl mx-auto text-center py-16">
          <p className="text-destructive">Failed to load your library. Please try again.</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <SEO
        title="My Bookshelf - Track Your Reading | Sahadhyayi"
        description="Manage your books, track reading progress, and get AI-powered assistance in your personal digital bookshelf."
        canonical="https://sahadhyayi.com/bookshelf"
        url="https://sahadhyayi.com/bookshelf"
      />
      <script type="application/ld+json">{JSON.stringify(structuredData)}</script>
      
      <div className="min-h-screen pt-20 pb-8 px-4 bg-background">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Header with Actions */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-foreground">My Bookshelf</h1>
              <p className="text-muted-foreground mt-1 text-sm">
                {stats.all} {stats.all === 1 ? 'book' : 'books'} in your collection · {stats.reading} currently reading
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleShareShelf}
                className="border-border hover:border-[hsl(var(--brand-primary))] text-foreground"
              >
                <Share2 className="w-4 h-4 mr-1.5 text-muted-foreground" />
                Share Shelf
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={handleExportCSV}
                className="border-border hover:border-[hsl(var(--brand-primary))] text-foreground"
              >
                <FileSpreadsheet className="w-4 h-4 mr-1.5 text-muted-foreground" />
                Export CSV
              </Button>

              <Link to="/library">
                <Button size="sm" className="bg-[hsl(var(--brand-primary))] hover:bg-[hsl(var(--brand-primary)/0.9)] text-white shadow-xs">
                  <BookOpen className="w-4 h-4 mr-1.5" />
                  Browse Library
                </Button>
              </Link>
            </div>
          </div>

          {/* Stats Overview Filter Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { key: 'all', label: 'All Saved', icon: Library, color: 'text-foreground', bg: 'bg-muted' },
              { key: 'reading', label: 'Reading Now', icon: Clock, color: 'text-blue-500 dark:text-blue-400', bg: 'bg-blue-500/10' },
              { key: 'completed', label: 'Completed', icon: CheckCircle, color: 'text-emerald-500 dark:text-emerald-400', bg: 'bg-emerald-500/10' },
              { key: 'want_to_read', label: 'Want to Read', icon: BookMarked, color: 'text-amber-500 dark:text-amber-400', bg: 'bg-amber-500/10' },
            ].map(({ key, label, icon: Icon, color, bg }) => (
              <Card 
                key={key} 
                className={`cursor-pointer transition-all hover:shadow-md ${
                  activeFilter === key 
                    ? 'ring-2 ring-[hsl(var(--brand-primary))] bg-[hsl(var(--brand-primary)/0.05)] border-[hsl(var(--brand-primary)/0.3)]' 
                    : 'border-border'
                }`}
                onClick={() => setActiveFilter(key as StatusFilter)}
              >
                <CardContent className="p-4 flex items-center gap-3">
                  <div className={`p-2.5 rounded-xl ${bg}`}>
                    <Icon className={`w-5 h-5 ${color}`} />
                  </div>
                  <div>
                    <p className="text-xl font-bold text-foreground">{stats[key as keyof typeof stats]}</p>
                    <p className="text-xs text-muted-foreground">{label}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Search, Filter & Sort Controls */}
          <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
            <div className="flex flex-col sm:flex-row gap-2 flex-1 max-w-2xl">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search by title, author, or genre..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 bg-card border-border h-9 text-sm"
                />
              </div>

              {/* Sort Selector */}
              <div className="w-full sm:w-44">
                <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortOption)}>
                  <SelectTrigger className="h-9 border-border bg-card text-xs">
                    <ArrowUpDown className="w-3.5 h-3.5 mr-1.5 text-muted-foreground" />
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="recent">Recently Added</SelectItem>
                    <SelectItem value="progress">Reading Progress</SelectItem>
                    <SelectItem value="title">Title (A-Z)</SelectItem>
                    <SelectItem value="author">Author (A-Z)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Tabs value={activeFilter} onValueChange={(v) => setActiveFilter(v as StatusFilter)} className="w-full md:w-auto">
              <TabsList className="grid grid-cols-4 w-full md:w-auto h-9">
                <TabsTrigger value="all" className="text-xs">All ({stats.all})</TabsTrigger>
                <TabsTrigger value="reading" className="text-xs">Reading ({stats.reading})</TabsTrigger>
                <TabsTrigger value="completed" className="text-xs">Done ({stats.completed})</TabsTrigger>
                <TabsTrigger value="want_to_read" className="text-xs">To Read ({stats.want_to_read})</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          {/* Empty State */}
          {(!bookshelfData || bookshelfData.length === 0) && (
            <Card className="border-dashed border-2 border-border bg-muted/30">
              <CardContent className="py-16 text-center">
                <Library className="w-16 h-16 mx-auto text-muted-foreground/50 mb-4" />
                <h3 className="text-xl font-semibold text-foreground mb-2">Your bookshelf is empty</h3>
                <p className="text-muted-foreground mb-6 max-w-md mx-auto text-sm">
                  Start building your personal library by adding books from our collection. You will start getting continue-reading and recommended-next suggestions after your first save.
                </p>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                  <Link to="/library">
                    <Button
                      className="bg-[hsl(var(--brand-primary))] hover:bg-[hsl(var(--brand-primary)/0.9)] text-white"
                      onClick={() => {
                        void trackUiEvent('bookshelf_empty_cta_clicked', { cta: 'explore_books' });
                      }}
                    >
                      <BookOpen className="w-4 h-4 mr-2" />
                      Explore Books
                    </Button>
                  </Link>
                  <Link to="/discovery">
                    <Button
                      variant="outline"
                      onClick={() => {
                        void trackUiEvent('bookshelf_empty_cta_clicked', { cta: 'recommended_next' });
                      }}
                    >
                      Recommended Next Reads
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          )}

          {/* No Results Filter State */}
          {bookshelfData && bookshelfData.length > 0 && filteredBooks.length === 0 && (
            <Card className="bg-muted/30 border-border">
              <CardContent className="py-12 text-center space-y-3">
                <Search className="w-10 h-10 mx-auto text-muted-foreground/50" />
                <h3 className="text-base font-semibold text-foreground">No matching books found</h3>
                <p className="text-sm text-muted-foreground">
                  Try adjusting your search query or reset the filter tab.
                </p>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => {
                    setSearchQuery('');
                    setActiveFilter('all');
                  }}
                >
                  Clear Filters
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Modernized Book Grid */}
          {filteredBooks.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {filteredBooks.map((item) => {
                const book = item.books_library;
                if (!book) return null;

                const isReading = item.status === 'reading';
                const isCompleted = item.status === 'completed';
                const isWantToRead = item.status === 'want_to_read';

                return (
                  <Card 
                    key={item.id} 
                    className="group overflow-hidden border-border bg-card hover:shadow-lg transition-all duration-200 flex flex-col justify-between"
                  >
                    <div>
                      {/* Cover Image & Overlays */}
                      <div className="aspect-[2/3] relative overflow-hidden bg-muted">
                        {book.cover_image_url ? (
                          <img
                            src={book.cover_image_url}
                            alt={book.title}
                            loading="lazy"
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-[hsl(var(--brand-primary)/0.2)] to-[hsl(var(--brand-secondary)/0.3)] flex items-center justify-center">
                            <BookOpen className="w-10 h-10 text-[hsl(var(--brand-primary))]" />
                          </div>
                        )}
                        
                        {/* Status Badge */}
                        <div className="absolute top-2 left-2 z-10">
                          {getStatusBadge(item.status)}
                        </div>

                        {/* Progress Badge on Cover */}
                        {isReading && item.progressPercent > 0 && (
                          <div className="absolute top-2 right-2 bg-black/80 backdrop-blur-xs text-white text-[10px] font-semibold px-1.5 py-0.5 rounded shadow-xs">
                            {item.progressPercent}%
                          </div>
                        )}

                        {/* Hover Quick Actions */}
                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2.5 z-20">
                          <Link
                            to={`/book/${book.id}`}
                            className="p-2.5 rounded-full bg-white/20 hover:bg-white/30 text-white transition-colors"
                            title="View Book Details"
                          >
                            <Info className="w-4 h-4" />
                          </Link>
                          {book.pdf_url && (
                            <button
                              onClick={() => handleDownloadPDF(book.pdf_url!, book.title)}
                              className="p-2.5 rounded-full bg-[hsl(var(--brand-primary))] hover:bg-[hsl(var(--brand-primary)/0.9)] text-white transition-colors"
                              title="Download PDF"
                            >
                              <Download className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Book Info */}
                      <CardContent className="p-3 space-y-2">
                        <div className="flex items-start justify-between gap-1.5">
                          <div className="min-w-0 flex-1">
                            <Link to={`/book/${book.id}`}>
                              <h3 className="font-semibold text-sm text-foreground line-clamp-1 hover:text-[hsl(var(--brand-primary))] transition-colors">
                                {book.title}
                              </h3>
                            </Link>
                            {book.author && (
                              <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
                                {book.author}
                              </p>
                            )}
                          </div>
                          
                          {/* Actions Menu */}
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0 text-muted-foreground hover:text-foreground">
                                <MoreVertical className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-48">
                              <DropdownMenuItem 
                                onClick={() => handleStatusChange(item.id, 'reading')}
                                disabled={item.status === 'reading'}
                              >
                                <Clock className="w-4 h-4 mr-2" />
                                Mark as Reading
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                onClick={() => handleStatusChange(item.id, 'completed')}
                                disabled={item.status === 'completed'}
                              >
                                <CheckCircle className="w-4 h-4 mr-2" />
                                Mark as Completed
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                onClick={() => handleStatusChange(item.id, 'want_to_read')}
                                disabled={item.status === 'want_to_read'}
                              >
                                <BookMarked className="w-4 h-4 mr-2" />
                                Want to Read
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem 
                                onClick={() => handleRemove(item.id)}
                                className="text-destructive focus:text-destructive"
                              >
                                <Trash2 className="w-4 h-4 mr-2" />
                                Remove from Shelf
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>

                        {/* Progress Bar for Reading Items */}
                        {isReading && (
                          <div className="space-y-1 pt-1">
                            <div className="w-full bg-muted rounded-full h-1.5 overflow-hidden">
                              <div
                                className="bg-[hsl(var(--brand-primary))] h-full rounded-full transition-all duration-300"
                                style={{
                                  width: `${item.progressPercent > 0 ? item.progressPercent : 8}%`,
                                }}
                              />
                            </div>
                            <div className="flex justify-between items-center text-[10px] text-muted-foreground">
                              <span>
                                {item.hasKnownTotal 
                                  ? `Pg ${item.currentPage} of ${item.totalPages}` 
                                  : `Page ${item.currentPage}`}
                              </span>
                              {item.hasKnownTotal && (
                                <span className="font-semibold text-foreground">{item.progressPercent}%</span>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Genre Tag */}
                        {book.genre && (
                          <div>
                            <span className="inline-block text-[10px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                              {book.genre}
                            </span>
                          </div>
                        )}
                      </CardContent>
                    </div>

                    {/* Quick 1-Click Action Button at Bottom of Card */}
                    <div className="p-3 pt-0">
                      {isReading && (
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="w-full text-xs h-7 border-border hover:border-[hsl(var(--brand-primary))] hover:text-[hsl(var(--brand-primary))]"
                          onClick={() => navigate(`/book/${book.id}`)}
                        >
                          {item.currentPage > 1 ? `Resume · Pg ${item.currentPage}` : 'Continue Reading'}
                        </Button>
                      )}

                      {isWantToRead && (
                        <Button 
                          size="sm" 
                          className="w-full text-xs h-7 bg-[hsl(var(--brand-primary))] hover:bg-[hsl(var(--brand-primary)/0.9)] text-white"
                          onClick={() => {
                            handleStatusChange(item.id, 'reading');
                            navigate(`/book/${book.id}`);
                          }}
                        >
                          <Play className="w-3 h-3 mr-1 fill-current" />
                          Start Reading
                        </Button>
                      )}

                      {isCompleted && (
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          className="w-full text-xs h-7 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10"
                          onClick={() => navigate(`/book/${book.id}`)}
                        >
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Read Again
                        </Button>
                      )}
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default Bookshelf;
