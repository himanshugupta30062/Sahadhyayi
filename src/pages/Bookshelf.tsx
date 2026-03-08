import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/authHelpers';
import { useUserBookshelf, useUpdateBookshelfItem, useRemoveFromBookshelf } from '@/hooks/useUserBookshelf';
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
  Trash2
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import LoadingSpinner from '@/components/LoadingSpinner';
import SEO from '@/components/SEO';

type StatusFilter = 'all' | 'reading' | 'completed' | 'want_to_read';

const Bookshelf = () => {
  const { user } = useAuth();
  const { data: bookshelfData, isLoading, error } = useUserBookshelf();
  const updateBookshelf = useUpdateBookshelfItem();
  const removeFromBookshelf = useRemoveFromBookshelf();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<StatusFilter>('all');

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

  // Filtered books
  const filteredBooks = useMemo(() => {
    if (!bookshelfData) return [];
    
    let filtered = bookshelfData;
    
    // Filter by status
    if (activeFilter !== 'all') {
      filtered = filtered.filter(b => b.status === activeFilter);
    }
    
    // Filter by search
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(b => 
        b.books_library?.title?.toLowerCase().includes(query) ||
        b.books_library?.author?.toLowerCase().includes(query)
      );
    }
    
    return filtered;
  }, [bookshelfData, activeFilter, searchQuery]);

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

  const getStatusBadge = (status: string) => {
    const badges = {
      reading: { icon: Clock, label: 'Reading', bg: 'bg-blue-100 text-blue-700' },
      completed: { icon: CheckCircle, label: 'Completed', bg: 'bg-green-100 text-green-700' },
      want_to_read: { icon: BookMarked, label: 'Want to Read', bg: 'bg-amber-100 text-amber-700' },
    };
    const badge = badges[status as keyof typeof badges] || badges.want_to_read;
    const Icon = badge.icon;
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${badge.bg}`}>
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
            <Button className="bg-[hsl(var(--brand-primary))] hover:bg-[hsl(var(--brand-primary)/0.9)]">
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
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-foreground">My Bookshelf</h1>
              <p className="text-muted-foreground mt-1">
                {stats.all} {stats.all === 1 ? 'book' : 'books'} in your collection
              </p>
            </div>
            <Link to="/library">
              <Button className="bg-[hsl(var(--brand-primary))] hover:bg-[hsl(var(--brand-primary)/0.9)] shadow-sm">
                <BookOpen className="w-4 h-4 mr-2" />
                Browse Library
              </Button>
            </Link>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { key: 'all', label: 'Total', icon: Library, color: 'text-foreground' },
              { key: 'reading', label: 'Reading', icon: Clock, color: 'text-blue-600' },
              { key: 'completed', label: 'Completed', icon: CheckCircle, color: 'text-green-600' },
              { key: 'want_to_read', label: 'Want to Read', icon: BookMarked, color: 'text-amber-600' },
            ].map(({ key, label, icon: Icon, color }) => (
              <Card 
                key={key} 
                className={`cursor-pointer transition-all hover:shadow-md ${
                  activeFilter === key ? 'ring-2 ring-[hsl(var(--brand-primary))] bg-[hsl(var(--brand-primary)/0.05)]' : 'border-border'
                }`}
                onClick={() => setActiveFilter(key as StatusFilter)}
              >
                <CardContent className="p-4 flex items-center gap-3">
                  <div className={`p-2 rounded-lg bg-muted`}>
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

          {/* Search & Filter Bar */}
          <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search your books..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-card border-border"
              />
            </div>
            <Tabs value={activeFilter} onValueChange={(v) => setActiveFilter(v as StatusFilter)} className="w-full sm:w-auto">
              <TabsList className="grid grid-cols-4 w-full sm:w-auto">
                <TabsTrigger value="all" className="text-xs sm:text-sm">All</TabsTrigger>
                <TabsTrigger value="reading" className="text-xs sm:text-sm">Reading</TabsTrigger>
                <TabsTrigger value="completed" className="text-xs sm:text-sm">Done</TabsTrigger>
                <TabsTrigger value="want_to_read" className="text-xs sm:text-sm">To Read</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          {/* Empty State */}
          {(!bookshelfData || bookshelfData.length === 0) && (
            <Card className="border-dashed border-2 border-border bg-muted/30">
              <CardContent className="py-16 text-center">
                <Library className="w-16 h-16 mx-auto text-muted-foreground/50 mb-4" />
                <h3 className="text-xl font-semibold text-foreground mb-2">Your bookshelf is empty</h3>
                <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                  Start building your personal library by adding books from our collection.
                </p>
                <Link to="/library">
                  <Button className="bg-[hsl(var(--brand-primary))] hover:bg-[hsl(var(--brand-primary)/0.9)]">
                    <BookOpen className="w-4 h-4 mr-2" />
                    Explore Books
                  </Button>
                </Link>
              </CardContent>
            </Card>
          )}

          {/* No Results */}
          {bookshelfData && bookshelfData.length > 0 && filteredBooks.length === 0 && (
            <Card className="bg-muted/30">
              <CardContent className="py-12 text-center">
                <Search className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-2">No books found</h3>
                <p className="text-muted-foreground">
                  Try adjusting your search or filter to find what you're looking for.
                </p>
              </CardContent>
            </Card>
          )}

          {/* Book Grid */}
          {filteredBooks.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {filteredBooks.map((item) => {
                const book = item.books_library;
                if (!book) return null;

                return (
                  <Card 
                    key={item.id} 
                    className="group overflow-hidden border-border hover:shadow-lg transition-all duration-200"
                  >
                    {/* Cover Image */}
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
                      <div className="absolute top-2 left-2">
                        {getStatusBadge(item.status)}
                      </div>

                      {/* Hover Actions */}
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                        <Link
                          to={`/book/${book.id}`}
                          className="p-3 rounded-full bg-white/20 hover:bg-white/30 text-white transition-colors"
                        >
                          <Info className="w-5 h-5" />
                        </Link>
                        {book.pdf_url && (
                          <button
                            onClick={() => handleDownloadPDF(book.pdf_url!, book.title)}
                            className="p-3 rounded-full bg-[hsl(var(--brand-primary))] hover:bg-[hsl(var(--brand-primary)/0.9)] text-white transition-colors"
                          >
                            <Download className="w-5 h-5" />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Book Info */}
                    <CardContent className="p-3 space-y-2">
                      <div className="flex items-start justify-between gap-2">
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
                            <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
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

                      {/* Genre Tag */}
                      {book.genre && (
                        <span className="inline-block text-[10px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                          {book.genre}
                        </span>
                      )}
                    </CardContent>
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
