import { useState } from 'react';
import { BookOpen, Loader2, MessageSquare, Send, Trash2, Users } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/authHelpers';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { BookSelectionModal } from '@/components/social/BookSelectionModal';
import { useCreateReadingGroupPost, useDeleteReadingGroupPost, useReadingGroupPosts } from '@/hooks/useReadingGroupPosts';

interface Props { groupId: string; canModerate: boolean }
const GroupActivityFeed = ({ groupId, canModerate }: Props) => {
  const { user } = useAuth();
  const { data: posts = [], isLoading, error } = useReadingGroupPosts(groupId, true);
  const createPost = useCreateReadingGroupPost();
  const deletePost = useDeleteReadingGroupPost();
  const [body, setBody] = useState('');
  const [book, setBook] = useState<{ id: string; title: string } | null>(null);
  const [bookPickerOpen, setBookPickerOpen] = useState(false);

  const publish = () => {
    if (!body.trim()) { toast.error('Write something before publishing.'); return; }
    createPost.mutate({ groupId, body, bookId: book?.id }, {
      onSuccess: () => { setBody(''); setBook(null); toast.success('Posted to your reading group.'); },
      onError: (e) => toast.error(e.message),
    });
  };
  return (
    <Card id="group-feed" className="border-border bg-card scroll-mt-24">
      <CardHeader className="border-b border-border pb-3">
        <CardTitle className="flex items-center gap-2 text-base"><MessageSquare className="h-4 w-4 text-primary" /> Group activity</CardTitle>
        <p className="text-sm text-muted-foreground">Share reading notes, questions, discoveries, and book recommendations with members.</p>
      </CardHeader>
      <CardContent className="space-y-4 p-4">
        <div className="rounded-xl border border-border bg-muted/20 p-3 space-y-3">
          <Textarea value={body} onChange={(e) => setBody(e.target.value)} maxLength={5000}
            placeholder="What are you reading or thinking about?" aria-label="Write a group post" />
          {book && <div className="text-sm text-primary flex items-center gap-2"><BookOpen className="h-4 w-4" /> Book: {book.title <span />}</div>}
          <div className="flex flex-wrap items-center justify-between gap-2">
            <Button type="button" variant="outline" size="sm" onClick={() => setBookPickerOpen(true)}><BookOpen className="mr-2 h-4 w-4" />{book ? 'Change book' : 'Attach book'}</Button>
            <span className="text-xs text-muted-foreground">{body.length}/5000</span>
            <Button type="button" size="sm" disabled={createPost.isPending || !body.trim()} onClick={publish}>
              {createPost.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />} Publish
            </Button>
          </div>
        </div>
        {isLoading ? <div className="py-6 text-center text-sm text-muted-foreground"><Loader2 className="mx-auto mb-2 h-5 w-5 animate-spin" />Loading group activity…</div>
          : error ? <p role="alert" className="text-sm text-destructive">Activity could not be loaded. Please refresh.</p>
          : posts.length === 0 ? <div className="py-8 text-center"><Users className="mx-auto mb-2 h-8 w-8 text-muted-foreground" /><p className="font-medium">Start the conversation</p><p className="text-sm text-muted-foreground">Be the first to share something with this group.</p></div>
          : <div className="space-y-3">{posts.map((post) => (
            <article key={post.id} className="rounded-xl border border-border p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0"><p className="font-medium text-sm">{post.author_name}</p><p className="text-xs text-muted-foreground">{formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}</p></div>
                {(post.author_id === user?.id || canModerate) && <Button type="button" variant="ghost" size="icon" aria-label="Delete group post" disabled={deletePost.isPending} onClick={() => deletePost.mutate({ groupId, postId: post.id }, { onSuccess: () => toast.success('Post deleted.'), onError: (e) => toast.error(e.message) })}><Trash2 className="h-4 w-4 text-muted-foreground" /></Button>}
              </div>
              <p className="mt-3 whitespace-pre-wrap break-words text-sm leading-relaxed">{post.body}</p>
              {post.book_title && <div className="mt-3 flex items-center gap-3 rounded-lg bg-muted/40 p-2">{post.book_cover_url && <img src={post.book_cover_url} alt="" className="h-12 w-8 rounded object-cover" loading="lazy" />}<div className="text-sm"><span className="text-xs text-muted-foreground">Discussing</span><p className="font-medium">{post.book_title}</p></div></div>}
            {post.pinned_at && <span className="mt-2 inline-block text-xs text-primary">Pinned announcement</span>}
          </article>
        ))}</div>}
      <BookSelectionModal isOpen={bookPickerOpen} onClose={() => setBookPickerOpen(false)} onSelectBook={(selected) => { setBook({ id: selected.id, title: selected.title }); setBookPickerOpen(false); }} />
    </CardContent>
    </Card>
  );
};
export default GroupActivityFeed;
