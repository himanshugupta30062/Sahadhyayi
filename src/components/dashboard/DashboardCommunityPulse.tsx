import React from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BookOpen, ChevronRight, MessageSquare, Radio, Users } from 'lucide-react';
import { useReadingRoomLive, useReadingRooms } from '@/hooks/useReadingRoom';
import { useUserJoinedGroups } from '@/hooks/useUserGroups';
import { useCommunityStats } from '@/hooks/useCommunityStats';
import { useSocialPosts } from '@/hooks/useSocialPosts';

const RoomParticipantCount = ({ room }: { room: { id: string; book_id: string; name: string } }) => {
  const { presence } = useReadingRoomLive(room, false, null);
  return <span className="shrink-0 text-[11px] tabular-nums text-muted-foreground">{presence.length} here</span>;
};

const DashboardCommunityPulse: React.FC = () => {
  const { data: rooms = [], isLoading: roomsLoading } = useReadingRooms();
  const { data: joinedGroups = [] } = useUserJoinedGroups();
  const { stats } = useCommunityStats();
  const { posts = [], isLoading: postsLoading, error: postsError } = useSocialPosts();

  const recentPosts = React.useMemo(() =>
    posts.filter((post) => new Date(post.created_at).getTime() >= Date.now() - 30 * 86400000),
  [posts]);

  const recentDiscussions = recentPosts.slice(0, 3);
  const popularBooks = React.useMemo(() => {
    const counts = new Map<string, { title: string; count: number; id: string }>();
    recentPosts.forEach((post) => {
      const book = post.books_library;
      if (!book?.id || !book.title) return;
      const current = counts.get(book.id) ?? { id: book.id, title: book.title, count: 0 };
      current.count += 1;
      counts.set(book.id, current);
    });
    return [...counts.values()].sort((a, b) => b.count - a.count).slice(0, 3);
  }, [recentPosts]);

  return (
    <Card className="overflow-hidden border-border">
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <div>
          <CardTitle className="flex items-center gap-2 text-base font-semibold">
            <MessageSquare className="h-4 w-4 text-brand-primary" />
            Community Pulse
          </CardTitle>
          {stats && <p className="mt-1 text-xs text-muted-foreground">{stats.registeredReaders.toLocaleString()} registered readers</p>}
        </div>
        <Link to="/social">
          <Button variant="ghost" size="sm" className="text-xs text-muted-foreground">Open feed <ChevronRight className="ml-1 h-3.5 w-3.5" /></Button>
        </Link>
      </CardHeader>

      <CardContent className="space-y-5">
        <section aria-labelledby="dashboard-rooms-title" className="space-y-2">
          <div className="flex items-center justify-between">
            <h3 id="dashboard-rooms-title" className="flex items-center gap-2 text-xs font-semibold text-muted-foreground"><Radio className="h-3.5 w-3.5" />Reading rooms</h3>
            <span className="text-xs text-muted-foreground">{rooms.length} listed</span>
          </div>
          {roomsLoading ? <div className="h-14 animate-pulse rounded-lg bg-muted" /> : rooms.length ? (
            <div className="space-y-2">
              {rooms.slice(0, 3).map((room) => (
                <div key={room.id} className="flex items-center justify-between gap-3 rounded-lg border border-border/70 bg-card p-2.5">
                  <div className="flex min-w-0 items-center gap-2.5">
                    <div className="flex h-10 w-8 shrink-0 items-center justify-center overflow-hidden rounded bg-muted">
                      {room.books_library?.cover_image_url ? <img src={room.books_library.cover_image_url} alt="" className="h-full w-full object-cover" /> : <BookOpen className="h-4 w-4 text-muted-foreground" />}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-xs font-semibold text-foreground">{room.name}</p>
                      <p className="truncate text-[11px] text-muted-foreground">{room.books_library?.title || 'General reading'}</p>
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-2"><RoomParticipantCount room={room} /><Link to={`/social?tab=rooms&roomId=${room.id}`}><Button size="sm" variant="outline" className="h-7 px-2.5 text-xs">Join</Button></Link></div>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-lg border border-dashed border-border p-3 text-center">
              <p className="text-xs text-muted-foreground">No reading rooms are available yet.</p>
              <Link to="/social?tab=rooms"><Button size="sm" variant="outline" className="mt-2 h-7 text-xs">Start a room</Button></Link>
            </div>
          )}
          <p className="text-[11px] text-muted-foreground">Participant counts use each room’s current Realtime presence.</p>
        </section>

        <section aria-labelledby="dashboard-discussions-title" className="space-y-2 border-t border-border pt-4">
          <div className="flex items-center justify-between">
            <h3 id="dashboard-discussions-title" className="text-xs font-semibold text-muted-foreground">Recent discussions</h3>
            <Link to="/social" className="text-xs text-brand-primary hover:underline">See all</Link>
          </div>
          {postsLoading ? <div className="h-14 animate-pulse rounded-lg bg-muted" /> : postsError ? (
            <p role="status" className="rounded-lg bg-muted/40 p-3 text-xs text-muted-foreground">Recent discussions are temporarily unavailable.</p>
          ) : recentDiscussions.length ? (
            recentDiscussions.map((post) => (
              <Link key={post.id} to="/social" className="block rounded-lg border border-border/70 p-3 transition-colors hover:bg-muted/40">
                <p className="line-clamp-2 text-sm text-foreground">{post.content || 'Shared a reading update'}</p>
                <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
                  {post.books_library?.title && <span className="inline-flex items-center gap-1"><BookOpen className="h-3 w-3" />{post.books_library.title}</span>}
                  <span>{post.comments_count} replies</span>
                </div>
              </Link>
            ))
          ) : <p className="rounded-lg bg-muted/40 p-3 text-xs text-muted-foreground">No recent posts yet. Share what you are reading to start a conversation.</p>}
        </section>

        {popularBooks.length > 0 && (
          <section className="space-y-2 border-t border-border pt-4">
            <h3 className="text-xs font-semibold text-muted-foreground">Books in recent posts · 30 days</h3>
            {popularBooks.map((book) => (
              <Link key={book.id} to={`/book/${book.id}`} className="flex items-center justify-between gap-3 rounded-lg px-2 py-1.5 text-sm hover:bg-muted/40">
                <span className="truncate font-medium text-foreground">{book.title}</span>
                <span className="shrink-0 text-xs text-muted-foreground">{book.count} {book.count === 1 ? 'post' : 'posts'}</span>
              </Link>
            ))}
          </section>
        )}

        <div className="grid grid-cols-2 gap-2 border-t border-border pt-4">
          <Link to="/groups" className="flex items-center gap-2 rounded-lg bg-muted/40 p-2 text-xs font-medium text-foreground hover:bg-muted">
            <Users className="h-4 w-4 text-brand-primary" /><span>Groups · {joinedGroups.length} joined</span>
          </Link>
          <Link to="/social?tab=threads" className="flex items-center gap-2 rounded-lg bg-muted/40 p-2 text-xs font-medium text-foreground hover:bg-muted">
            <MessageSquare className="h-4 w-4 text-brand-secondary" /><span>Book discussions</span>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
};

export default DashboardCommunityPulse;
