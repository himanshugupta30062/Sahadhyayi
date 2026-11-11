import { useEffect, useMemo, useState } from 'react';
import { Heart, ThumbsUp, Lightbulb, Bookmark } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { BookOpen, Lock, MessageCircle, Plus, Send, ShieldAlert, Trash2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/authHelpers';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useGroupReadingBooks } from '@/hooks/useGroupReadingBoard';
import {
  useCreateGroupReadingDiscussion,
  useCreateGroupReadingDiscussionComment,
  useDeleteGroupReadingDiscussion,
  useDeleteGroupReadingDiscussionComment,
  useGroupReadingDiscussions,
  useGroupReadingDiscussionComments,
} from '@/hooks/useGroupReadingDiscussions';
import type {
  GroupReadingDiscussion,
  GroupReadingDiscussionType,
} from '@/hooks/useGroupReadingDiscussions';

interface GroupReadingDiscussionsProps {
  groupId: string;
  canModerate: boolean;
}

const discussionLabels: Record<GroupReadingDiscussionType, string> = {
  discussion: 'Discussion',
  question: 'Question',
  reflection: 'Reflection',
  quote: 'Quote',
};

const formatCreatedAt = (value: string) => {
  try {
    return formatDistanceToNow(new Date(value), { addSuffix: true });
  } catch {
    return 'Recently';
  }
};

type ReactionKind = 'heart' | 'like' | 'insightful';
const reactionMeta: Record<ReactionKind, { label: string; Icon: typeof Heart }> = {
  heart: { label: 'Heart', Icon: Heart }, like: { label: 'Like', Icon: ThumbsUp }, insightful: { label: 'Insightful', Icon: Lightbulb },
};
const DiscussionReactions = ({ discussionId }: { discussionId: string }) => {
  const [counts, setCounts] = useState<Record<ReactionKind, { count: number; mine: boolean }>>({
    heart: { count: 0, mine: false }, like: { count: 0, mine: false }, insightful: { count: 0, mine: false },
  });
  const [busy, setBusy] = useState<ReactionKind | null>(null);
  const refresh = async () => {
    const { data, error } = await supabase.rpc('list_group_reading_discussion_reactions', { p_discussion_id: discussionId });
    if (error) { toast.error('Could not load reactions.'); return; }
    const next = { heart: { count: 0, mine: false }, like: { count: 0, mine: false }, insightful: { count: 0, mine: false } };
    (data || []).forEach((row: { reaction: ReactionKind; reaction_count: number; mine: boolean }) => {
      if (row.reaction in next) next[row.reaction] = { count: Number(row.reaction_count), mine: Boolean(row.mine) };
    });
    setCounts(next);
  };
  useEffect(() => { void refresh(); }, [discussionId]);
  const toggle = async (kind: ReactionKind) => {
    setBusy(kind);
    const { error } = await supabase.rpc('toggle_group_reading_discussion_reaction', { p_discussion_id: discussionId, p_reaction: kind });
    setBusy(null);
    if (error) { toast.error(error.message || 'Reaction failed.'); return; }
    await refresh();
  };
  return <div className="mt-3 flex flex-wrap gap-2" aria-label="Discussion reactions">
    {(Object.keys(reactionMeta) as ReactionKind[]).map(kind => {
      const { Icon, label } = reactionMeta[kind]; const item = counts[kind];
      return <Button key={kind} type="button" size="sm" variant={item.mine ? 'secondary' : 'outline'} aria-pressed={item.mine}
        aria-label={label + ': ' + item.count} disabled={busy !== null} onClick={() => void toggle(kind)} className="h-8 gap-1.5">
        <Icon className="h-3.5 w-3.5" />{item.count > 0 && <span>{item.count}</span>}<span className="sr-only">{label}</span>
      </Button>;
    })}
  </div>;
};

const DiscussionBookmark = ({ discussionId }: { discussionId: string }) => {
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    let alive = true;
    supabase.rpc('list_my_group_discussion_bookmarks').then(({ data, error }) => {
      if (!alive) return;
      if (error) toast.error('Could not load saved discussions.');
      else setSaved((data || []).some((row: { discussion_id: string }) => row.discussion_id === discussionId));
      setLoading(false);
    });
    return () => { alive = false; };
  }, [discussionId]);
  const toggle = async () => {
    setBusy(true);
    const { data, error } = await supabase.rpc('toggle_group_reading_discussion_bookmark', { p_discussion_id: discussionId });
    setBusy(false);
    if (error) { toast.error(error.message || 'Could not save discussion.'); return; }
    setSaved(Boolean(data));
    toast.success(data ? 'Discussion saved.' : 'Removed from saved discussions.');
  };
  return <Button type="button" size="sm" variant={saved ? 'secondary' : 'outline'} aria-pressed={saved}
    disabled={loading || busy} onClick={() => void toggle()} className="h-8 gap-1.5">
    <Bookmark className="h-3.5 w-3.5" />{saved ? 'Saved' : 'Save'}
  </Button>;
};

interface DiscussionCardProps {
  discussion: GroupReadingDiscussion;
  groupId: string;
  currentUserId: string;
  canModerate: boolean;
}

const DiscussionCard = ({
  discussion,
  groupId,
  currentUserId,
  canModerate,
}: DiscussionCardProps) => {
  const [showReplies, setShowReplies] = useState(false);
  const [replyBody, setReplyBody] = useState('');
  const [replySpoilerChapter, setReplySpoilerChapter] = useState('0');
  const { data: comments = [], isLoading, error } = useGroupReadingDiscussionComments(
    discussion.id,
    showReplies,
  );
  const createComment = useCreateGroupReadingDiscussionComment();
  const deleteDiscussion = useDeleteGroupReadingDiscussion();
  const deleteComment = useDeleteGroupReadingDiscussionComment();

  const handleReply = () => {
    const spoilerChapter = Number(replySpoilerChapter);
    if (!replyBody.trim()) {
      toast.error('Write a reply first.');
      return;
    }
    if (!Number.isInteger(spoilerChapter) || spoilerChapter < 0) {
      toast.error('Enter a valid spoiler chapter, or use 0 for no spoilers.');
      return;
    }

    createComment.mutate(
      {
        groupId,
        discussionId: discussion.id,
        body: replyBody,
        spoilerChapter,
      },
      {
        onSuccess: () => {
          setReplyBody('');
          setReplySpoilerChapter('0');
          toast.success('Reply added.');
        },
        onError: (mutationError) => toast.error(mutationError.message),
      },
    );
  };

  const handleDeleteDiscussion = () => {
    if (typeof window !== 'undefined' && !window.confirm('Delete this discussion and its replies? This cannot be undone.')) return;
    deleteDiscussion.mutate(
      { groupId, discussionId: discussion.id },
      {
        onSuccess: () => toast.success('Discussion removed.'),
        onError: (mutationError) => toast.error(mutationError.message),
      },
    );
  };

  const canDeleteDiscussion = canModerate || discussion.created_by === currentUserId;

  return (
    <article className="rounded-xl border border-border bg-card p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <Badge variant="secondary">{discussionLabels[discussion.topic_type]}</Badge>
            <Badge variant="outline" className="gap-1">
              <BookOpen className="h-3 w-3" />
              {discussion.chapter_number > 0 ? `Chapter ${discussion.chapter_number}` : 'General'}
            </Badge>
            {discussion.spoiler_chapter > 0 && (
              <Badge variant="outline" className="gap-1 border-amber-500/40 text-amber-700 dark:text-amber-300">
                <ShieldAlert className="h-3 w-3" />
                Spoilers through chapter {discussion.spoiler_chapter}
              </Badge>
            )}
          </div>
          <h4 className="font-semibold text-foreground">{discussion.title}</h4>
          <p className="mt-1 text-xs text-muted-foreground">
            <span>{discussion.book_title}</span>
            <span aria-hidden="true"> · </span>
            <span>{discussion.author_name}</span>
            <span aria-hidden="true"> · </span>
            <span>{formatCreatedAt(discussion.created_at)}</span>
          </p>
        </div>
        {canDeleteDiscussion && (
          <Button
            type="button"
            size="icon"
            variant="ghost"
            aria-label={`Delete discussion: ${discussion.title}`}
            disabled={deleteDiscussion.isPending}
            onClick={handleDeleteDiscussion}
            className="text-muted-foreground hover:text-destructive"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        )}
      </div>

      {discussion.body !== null ? (
        <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-foreground">{discussion.body}</p>
      ) : (
        <div className="mt-3 flex items-start gap-2 rounded-lg border border-amber-500/20 bg-amber-500/5 p-3 text-sm text-muted-foreground">
          <Lock className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
          <span>
            Spoiler-protected text. Complete chapter {discussion.spoiler_chapter} in your reading progress to unlock it.
          </span>
        </div>
      )}

      <div className="mt-3 flex flex-wrap items-center justify-between gap-2"><DiscussionReactions discussionId={discussion.id} /><DiscussionBookmark discussionId={discussion.id} /></div>

      <div className="mt-4 border-t border-border pt-3">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => setShowReplies((value) => !value)}
          aria-expanded={showReplies}
          className="gap-2 px-2"
        >
          <MessageCircle className="h-4 w-4" />
          {discussion.reply_count} {discussion.reply_count === 1 ? 'reply' : 'replies'}
        </Button>

        {showReplies && (
          <div className="mt-3 space-y-3">
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-3"><Input aria-label="Search discussions" placeholder="Search title, book or author…" value={searchText} onChange={event=>setSearchText(event.target.value)}/><select aria-label="Filter discussion topic" className="h-10 rounded-md border bg-background px-3 text-sm" value={topicFilter} onChange={event=>setTopicFilter(event.target.value as 'all'|GroupReadingDiscussionType)}><option value="all">All topics</option><option value="discussion">Discussion</option><option value="question">Question</option><option value="reflection">Reflection</option><option value="quote">Quote</option></select><select aria-label="Sort discussions" className="h-10 rounded-md border bg-background px-3 text-sm" value={sortOrder} onChange={event=>setSortOrder(event.target.value as 'newest'|'replies')}><option value="newest">Newest first</option><option value="replies">Most replies</option></select></div>\n        {isLoading ? (
              <p className="text-sm text-muted-foreground">Loading replies…</p>
            ) : error ? (
              <p role="alert" className="text-sm text-destructive">Replies could not be loaded. Please try again.</p>
            ) : comments.length === 0 ? (
              <p className="text-sm text-muted-foreground">No replies yet. Start the conversation.</p>
            ) : (
              comments.map((comment) => {
                const canDeleteComment = canModerate || comment.user_id === currentUserId;
                return (
                  <div key={comment.id} className="rounded-lg bg-muted/40 p-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-xs font-medium text-foreground">
                          <span>{comment.author_name}</span>
                          <span aria-hidden="true"> · </span>
                          <span>{formatCreatedAt(comment.created_at)}</span>
                        </p>
                        {comment.spoiler_chapter > 0 && (
                          <p className="mt-1 text-[11px] text-amber-700 dark:text-amber-300">
                            Spoilers through chapter {comment.spoiler_chapter}
                          </p>
                        )}
                      </div>
                      {canDeleteComment && (
                        <Button
                          type="button"
                          size="icon"
                          variant="ghost"
                          aria-label="Delete reply"
                          disabled={deleteComment.isPending}
                          onClick={() => deleteComment.mutate(
                            { groupId, discussionId: discussion.id, commentId: comment.id },
                            {
                              onSuccess: () => toast.success('Reply removed.'),
                              onError: (mutationError) => toast.error(mutationError.message),
                            },
                          )}
                          className="h-7 w-7 text-muted-foreground hover:text-destructive"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      )}
                    </div>
                    {comment.body !== null ? (
                      <p className="mt-2 whitespace-pre-wrap text-sm text-foreground">{comment.body}</p>
                    ) : (
                      <p className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                        <Lock className="h-3.5 w-3.5" />
                        Complete chapter {comment.spoiler_chapter} to unlock this reply.
                      </p>
                    )}
                  </div>
                );
              })
            )}

            {discussion.is_unlocked ? (
              <div className="space-y-2 rounded-lg border border-border p-3">
                <Textarea
                  value={replyBody}
                  onChange={(event) => setReplyBody(event.target.value)}
                  placeholder="Add a thoughtful reply…"
                  rows={2}
                  maxLength={2500}
                  aria-label={`Reply to ${discussion.title}`}
                />
                <div className="flex flex-wrap items-end justify-between gap-2">
                  <label className="text-xs text-muted-foreground">
                    Spoiler chapter (0 = no spoilers)
                    <Input
                      type="number"
                      min={0}
                      max={10000}
                      value={replySpoilerChapter}
                      onChange={(event) => setReplySpoilerChapter(event.target.value)}
                      className="mt-1 h-8 w-36"
                      aria-label="Reply spoiler chapter"
                    />
                  </label>
                  <Button
                    type="button"
                    size="sm"
                    onClick={handleReply}
                    disabled={!replyBody.trim() || createComment.isPending}
                  >
                    <Send className="mr-1.5 h-3.5 w-3.5" />
                    Reply
                  </Button>
                </div>
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">
                Finish the discussion’s spoiler chapter before replying.
              </p>
            )}
          </div>
        )}
      </div>
    </article>
  );
};

const GroupReadingDiscussions = ({ groupId, canModerate }: GroupReadingDiscussionsProps) => {\n  const [searchText,setSearchText]=useState('');\n  const [topicFilter,setTopicFilter]=useState<'all'|GroupReadingDiscussionType>('all');\n  const [sortOrder,setSortOrder]=useState<'newest'|'replies'>('newest');
  const { user } = useAuth();
  const { data: books = [], isLoading: booksLoading } = useGroupReadingBooks(groupId, true);
  const { data: discussions = [], isLoading, error } = useGroupReadingDiscussions(groupId, true);\n  const visibleDiscussions=useMemo(()=>discussions.filter(item=>(topicFilter==='all'||item.topic_type===topicFilter)&&(!searchText.trim()||[item.title,item.body,item.book_title,item.author_name].some(value=>value?.toLowerCase().includes(searchText.trim().toLowerCase())))).sort((a,b)=>sortOrder==='replies'?b.reply_count-a.reply_count:new Date(b.created_at).getTime()-new Date(a.created_at).getTime()),[discussions,topicFilter,searchText,sortOrder]);
  const createDiscussion = useCreateGroupReadingDiscussion();
  const [showComposer, setShowComposer] = useState(false);
  const [selectedBookId, setSelectedBookId] = useState('');
  const [chapterNumber, setChapterNumber] = useState('0');
  const [spoilerChapter, setSpoilerChapter] = useState('0');
  const [topicType, setTopicType] = useState<GroupReadingDiscussionType>('discussion');
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');

  const selectableBooks = useMemo(
    () => books.filter((book) => book.status !== 'archived'),
    [books],
  );
  const defaultBookId = selectedBookId || (
    selectableBooks.find((book) => book.status === 'current')?.id
      ?? selectableBooks[0]?.id
      ?? ''
  );

  const handleCreate = () => {
    const chapter = Number(chapterNumber);
    const spoiler = Number(spoilerChapter);
    if (!defaultBookId) {
      toast.error('Add a book to the group reading list first.');
      return;
    }
    if (!Number.isInteger(chapter) || chapter < 0 || chapter > 10000
      || !Number.isInteger(spoiler) || spoiler < 0 || spoiler > 10000) {
      toast.error('Enter valid chapter numbers.');
      return;
    }
    if (spoiler > 0 && spoiler < chapter) {
      toast.error('The spoiler level must be the same as or later than the discussion chapter.');
      return;
    }
    if (title.trim().length < 3 || title.trim().length > 160 || !body.trim()) {
      toast.error('Add a title and some discussion text.');
      return;
    }

    const selectedBook = selectableBooks.find((book) => book.id === defaultBookId);
    createDiscussion.mutate(
      {
        groupId,
        groupReadingBookId: defaultBookId,
        chapterNumber: chapter,
        spoilerChapter: spoiler,
        topicType,
        title,
        body,
      },
      {
        onSuccess: () => {
          setTitle('');
          setBody('');
          setChapterNumber('0');
          setSpoilerChapter('0');
          setTopicType('discussion');
          setShowComposer(false);
          toast.success(`Discussion started for ${selectedBook?.title || 'the group book'}.`);
        },
        onError: (mutationError) => toast.error(mutationError.message),
      },
    );
  };

  return (
    <Card className="border-border bg-card">
      <CardHeader className="flex flex-row items-center justify-between gap-3 space-y-0 border-b border-border">
        <div>
          <CardTitle className="flex items-center gap-2 text-base">
            <MessageCircle className="h-4 w-4 text-[hsl(var(--brand-primary))]" />
            Chapter discussions
          </CardTitle>
          <p className="mt-1 text-xs text-muted-foreground">
            Questions, reflections and spoiler-aware conversations about your group books.
          </p>
        </div>
        <Button
          type="button"
          size="sm"
          onClick={() => setShowComposer((value) => !value)}
          disabled={booksLoading || selectableBooks.length === 0}
        >
          <Plus className="mr-1.5 h-4 w-4" />
          Start discussion
        </Button>
      </CardHeader>

      <CardContent className="space-y-4 p-4 sm:p-5">
        {booksLoading ? (
          <div className="h-20 animate-pulse rounded-lg bg-muted" aria-label="Loading group books" />
        ) : selectableBooks.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border px-4 py-7 text-center">
            <BookOpen className="mx-auto mb-2 h-7 w-7 text-muted-foreground/60" />
            <p className="font-medium text-foreground">Add a shared book to begin</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Chapter discussions are attached to books on this group’s shared reading list.
            </p>
          </div>
        ) : null}

        {showComposer && selectableBooks.length > 0 && (
          <section className="space-y-3 rounded-xl border border-border bg-muted/20 p-4">
            <div>
              <h3 className="font-semibold text-foreground">Start a conversation</h3>
              <p className="mt-1 text-xs text-muted-foreground">
                Keep the title spoiler-free. Spoiler text is hidden until a reader marks the required chapter complete.
              </p>
            </div>

            <label className="block text-xs font-medium text-muted-foreground">
              Group book
              <select
                value={defaultBookId}
                onChange={(event) => setSelectedBookId(event.target.value)}
                className="mt-1 h-10 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground"
              >
                {selectableBooks.map((book) => (
                  <option key={book.id} value={book.id}>{book.title}</option>
                ))}
              </select>
            </label>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <label className="text-xs font-medium text-muted-foreground">
                Topic type
                <select
                  value={topicType}
                  onChange={(event) => setTopicType(event.target.value as GroupReadingDiscussionType)}
                  className="mt-1 h-10 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground"
                >
                  <option value="discussion">Discussion</option>
                  <option value="question">Question</option>
                  <option value="reflection">Reflection</option>
                  <option value="quote">Quote</option>
                </select>
              </label>
              <label className="text-xs font-medium text-muted-foreground">
                Chapter (0 = general)
                <Input
                  type="number"
                  min={0}
                  max={10000}
                  value={chapterNumber}
                  onChange={(event) => setChapterNumber(event.target.value)}
                  className="mt-1 h-10"
                />
              </label>
              <label className="text-xs font-medium text-muted-foreground">
                Spoiler chapter (0 = none)
                <Input
                  type="number"
                  min={0}
                  max={10000}
                  value={spoilerChapter}
                  onChange={(event) => setSpoilerChapter(event.target.value)}
                  className="mt-1 h-10"
                />
              </label>
            </div>

            <label className="block text-xs font-medium text-muted-foreground">
              Title
              <Input
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                placeholder="A spoiler-free discussion title"
                maxLength={160}
                className="mt-1"
              />
            </label>
            <label className="block text-xs font-medium text-muted-foreground">
              Your thoughts
              <Textarea
                value={body}
                onChange={(event) => setBody(event.target.value)}
                placeholder="Share a question, reflection or passage you want to discuss…"
                rows={4}
                maxLength={6000}
                className="mt-1"
              />
            </label>

            <div className="flex flex-wrap justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setShowComposer(false)}>
                Cancel
              </Button>
              <Button
                type="button"
                onClick={handleCreate}
                disabled={createDiscussion.isPending || !title.trim() || !body.trim()}
              >
                Start discussion
              </Button>
            </div>
          </section>
        )}

        {isLoading ? (
          <div className="space-y-3" aria-label="Loading chapter discussions">
            <div className="h-28 animate-pulse rounded-xl bg-muted" />
            <div className="h-28 animate-pulse rounded-xl bg-muted" />
          </div>
        ) : error ? (
          <p role="alert" className="text-sm text-destructive">
            Chapter discussions could not be loaded. Refresh the group page and try again.
          </p>
        ) : discussions.length === 0 && selectableBooks.length > 0 ? (
          <div className="rounded-xl border border-dashed border-border px-4 py-7 text-center">
            <MessageCircle className="mx-auto mb-2 h-7 w-7 text-muted-foreground/60" />
            <p className="font-medium text-foreground">No discussions yet</p>
            <p className="mt-1 text-sm text-muted-foreground">Start with a question or a favourite passage from the current read.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {visibleDiscussions.map((discussion) => (
              <DiscussionCard
                key={discussion.id}
                discussion={discussion}
                groupId={groupId}
                currentUserId={user?.id || ''}
                canModerate={canModerate}
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default GroupReadingDiscussions;
