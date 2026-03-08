import React from 'react';
import { useNavigate } from 'react-router-dom';
import SEO from '@/components/SEO';
import Breadcrumb from '@/components/Breadcrumb';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useMyPublications, usePublishBook, formatFileSize } from '@/hooks/usePublishBook';
import { BookOpen, Plus, Trash2, Send, Clock, CheckCircle, XCircle, FileText, Loader2, Eye, Download, Edit } from 'lucide-react';

const STATUS_CONFIG: Record<string, { label: string; icon: React.ReactNode; className: string }> = {
  draft: { label: 'Draft', icon: <FileText className="h-3 w-3" />, className: 'bg-muted text-muted-foreground' },
  pending_review: { label: 'Pending Review', icon: <Clock className="h-3 w-3" />, className: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' },
  approved: { label: 'Approved', icon: <CheckCircle className="h-3 w-3" />, className: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' },
  rejected: { label: 'Rejected', icon: <XCircle className="h-3 w-3" />, className: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' },
};

export default function MyPublications() {
  const navigate = useNavigate();
  const { data: books, isLoading } = useMyPublications();
  const { submitForReview, deleteBook } = usePublishBook();

  const breadcrumbItems = [
    { name: 'Library', path: '/library' },
    { name: 'My Publications', path: '/my-publications', current: true },
  ];

  return (
    <div className="min-h-screen bg-background">
      <SEO title="My Publications | Sahadhyayi" description="Manage your published books." />
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-6">
          <Breadcrumb items={breadcrumbItems} />
        </div>

        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-foreground">My Publications</h1>
          <Button onClick={() => navigate('/publish')}>
            <Plus className="mr-2 h-4 w-4" /> Publish New Book
          </Button>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
        ) : !books?.length ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16 text-center">
              <BookOpen className="h-16 w-16 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">No publications yet</h3>
              <p className="text-muted-foreground mb-4">Share your first book with the community!</p>
              <Button onClick={() => navigate('/publish')}>Publish Your First Book</Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {books.map(book => {
              const status = STATUS_CONFIG[book.status] || STATUS_CONFIG.draft;
              const canEdit = book.status === 'draft' || book.status === 'rejected';
              const canDelete = book.status !== 'approved';
              return (
                <Card key={book.id} className="overflow-hidden">
                  <CardContent className="p-4">
                    <div className="flex gap-4">
                      {book.cover_image_url ? (
                        <img src={book.cover_image_url} alt={book.title} className="w-20 h-28 object-cover rounded shadow-sm flex-shrink-0" />
                      ) : (
                        <div className="w-20 h-28 bg-muted rounded flex items-center justify-center flex-shrink-0">
                          <BookOpen className="h-6 w-6 text-muted-foreground" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <h3 className="font-semibold text-foreground truncate">{book.title}</h3>
                            {book.subtitle && <p className="text-xs text-muted-foreground italic truncate">{book.subtitle}</p>}
                            <p className="text-sm text-muted-foreground">by {book.author_name}</p>
                          </div>
                          <span className={`inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full whitespace-nowrap ${status.className}`}>
                            {status.icon} {status.label}
                          </span>
                        </div>
                        <div className="flex flex-wrap items-center gap-2 mt-1">
                          {book.genre && <span className="inline-block text-xs bg-primary/10 text-primary px-2 py-0.5 rounded">{book.genre}</span>}
                          {book.file_size && <span className="text-xs text-muted-foreground">{formatFileSize(book.file_size)}</span>}
                          {book.reading_time_minutes && <span className="text-xs text-muted-foreground">~{book.reading_time_minutes} min</span>}
                        </div>
                        {book.tags && book.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1.5">
                            {book.tags.slice(0, 5).map(tag => (
                              <span key={tag} className="text-xs bg-muted text-muted-foreground px-1.5 py-0.5 rounded">#{tag}</span>
                            ))}
                          </div>
                        )}
                        {book.description && <p className="text-sm text-muted-foreground mt-2 line-clamp-2">{book.description}</p>}
                        {book.status === 'rejected' && book.rejection_reason && (
                          <p className="text-sm text-destructive mt-2">Reason: {book.rejection_reason}</p>
                        )}
                        {/* Analytics for approved books */}
                        {book.status === 'approved' && (
                          <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                            <span className="inline-flex items-center gap-1"><Eye className="h-3 w-3" /> {book.views_count} views</span>
                            <span className="inline-flex items-center gap-1"><Download className="h-3 w-3" /> {book.downloads_count} downloads</span>
                          </div>
                        )}
                        <div className="flex items-center gap-2 mt-3">
                          {book.status === 'draft' && (
                            <Button size="sm" onClick={() => submitForReview.mutate(book.id)} disabled={submitForReview.isPending}>
                              <Send className="mr-1 h-3 w-3" /> Submit
                            </Button>
                          )}
                          {book.status === 'rejected' && (
                            <Button size="sm" onClick={() => submitForReview.mutate(book.id)} disabled={submitForReview.isPending}>
                              <Send className="mr-1 h-3 w-3" /> Resubmit
                            </Button>
                          )}
                          {canDelete && (
                            <Button size="sm" variant="destructive" onClick={() => deleteBook.mutate(book.id)} disabled={deleteBook.isPending}>
                              <Trash2 className="mr-1 h-3 w-3" /> Delete
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
