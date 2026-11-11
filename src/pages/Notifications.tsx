import { useMemo, useState } from 'react';
import { CheckCheck, Bell, ArrowLeft, Filter } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useNotificationHistory, useMarkNotificationAsRead, useMarkAllNotificationsAsRead } from '@/hooks/useNotifications';
import { safeFormatDistanceToNow } from '@/lib/dateUtils';

type NotificationFilter = 'all' | 'unread' | 'read';
type NotificationCategory = 'all' | 'social' | 'groups' | 'events' | 'system';
const categoryForType = (type: string): NotificationCategory => {
  if (/event|rsvp|reminder/i.test(type)) return 'events';
  if (/group|reading_room|digest|membership/i.test(type)) return 'groups';
  if (/system|security|account|email|admin/i.test(type)) return 'system';
  return 'social';
};

export default function NotificationsPage() {
  const [filter, setFilter] = useState<NotificationFilter>('all');
  const [category, setCategory] = useState<NotificationCategory>('all');
  const navigate = useNavigate();
  const { data, isLoading, isError, refetch, fetchNextPage, hasNextPage, isFetchingNextPage } = useNotificationHistory();
  const notifications = data?.pages.flat() ?? [];
  const markAsRead = useMarkNotificationAsRead();
  const markAllAsRead = useMarkAllNotificationsAsRead();
  const unread = notifications.filter((n) => !n.read).length;
  const filtered = useMemo(() => notifications.filter((n) => filter === 'all' || (filter === 'unread' ? !n.read : n.read)), [notifications, filter]);
  const categoryCounts = useMemo(() => ({ social: notifications.filter((n) => categoryForType(n.type) === 'social').length, groups: notifications.filter((n) => categoryForType(n.type) === 'groups').length, events: notifications.filter((n) => categoryForType(n.type) === 'events').length, system: notifications.filter((n) => categoryForType(n.type) === 'system').length }), [notifications]);
  const categorized = useMemo(() => filtered.filter((n) => category === 'all' || categoryForType(n.type) === category), [filtered, category]);
  const grouped = useMemo(() => {
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const yesterday = new Date(today); yesterday.setDate(yesterday.getDate() - 1);
    const buckets = new Map<string, typeof filtered>();
    categorized.forEach((n) => {
      const date = new Date(n.created_at); date.setHours(0, 0, 0, 0);
      const key = date.getTime() === today.getTime() ? 'Today' : date.getTime() === yesterday.getTime() ? 'Yesterday' : 'Earlier';
      buckets.set(key, [...(buckets.get(key) ?? []), n]);
    });
    return ['Today', 'Yesterday', 'Earlier'].filter((key) => buckets.has(key)).map((key) => ({ title: key, items: buckets.get(key)! }));
  }, [categorized]);

  return (
    <main className="container mx-auto max-w-3xl px-4 py-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div><Button asChild variant="ghost" size="sm"><Link to="/activity"><ArrowLeft className="mr-2 h-4 w-4"/>Back</Link></Button>
          <h1 className="mt-2 text-2xl font-semibold">Notifications</h1>
          <p className="text-sm text-muted-foreground">Updates from fellow readers and your community.</p>
        </div>
        {unread > 0 && <Button variant="outline" onClick={() => markAllAsRead.mutate()} disabled={markAllAsRead.isPending}><CheckCheck className="mr-2 h-4 w-4"/>Mark all read</Button>}
      </div>
      <div className="mb-5 flex flex-wrap items-center gap-3">
        <Filter className="h-4 w-4 text-muted-foreground" aria-hidden="true"/>
        <Tabs value={filter} onValueChange={(v) => setFilter(v as NotificationFilter)} aria-label="Filter notifications">
          <TabsList><TabsTrigger value="all">All ({notifications.length})</TabsTrigger><TabsTrigger value="unread">Unread ({unread})</TabsTrigger><TabsTrigger value="read">Read ({notifications.length - unread})</TabsTrigger></TabsList>
        </Tabs>
      </div>
      <div className="mb-4"><Tabs value={category} onValueChange={(v) => setCategory(v as NotificationCategory)} aria-label="Notification categories"><TabsList className="flex h-auto flex-wrap"><TabsTrigger value="all">All types</TabsTrigger><TabsTrigger value="social">Social ({categoryCounts.social})</TabsTrigger><TabsTrigger value="groups">Reading Groups ({categoryCounts.groups})</TabsTrigger><TabsTrigger value="events">Events ({categoryCounts.events})</TabsTrigger><TabsTrigger value="system">System ({categoryCounts.system})</TabsTrigger></TabsList></Tabs></div>
      {isLoading ? <Card><CardContent className="p-8 text-center text-muted-foreground">Loading notifications…</CardContent></Card>
        : isError ? <Card><CardContent className="p-8 text-center"><p className="mb-3 text-muted-foreground">Couldn’t load notifications.</p><Button variant="outline" onClick={() => void refetch()}>Try again</Button></CardContent></Card>
        : filtered.length === 0 ? <Card><CardContent className="p-10 text-center"><Bell className="mx-auto mb-3 h-8 w-8 text-muted-foreground"/><p className="font-medium">{filter === 'unread' ? 'No unread notifications' : filter === 'read' ? 'No read notifications yet' : 'You’re all caught up'}</p><p className="mt-1 text-sm text-muted-foreground">{filter === 'all' ? 'New activity will appear here.' : 'Switch filters to see other notifications.'}</p></CardContent></Card>
        : <><div className="space-y-6">{grouped.map((group) => <section key={group.title} aria-label={group.title}><h2 className="mb-2 text-sm font-semibold text-muted-foreground">{group.title}</h2><div className="space-y-2">{group.items.map((n) => { const actor = n.actor?.full_name || n.actor?.username || 'A reader'; return <Card key={n.id} className={n.read ? '' : 'border-primary/30 bg-primary/5'}><CardContent className="flex items-start gap-3 p-4"><Avatar className="h-10 w-10"><AvatarImage src={n.actor?.profile_photo_url || n.authors?.profile_image_url || ''}/><AvatarFallback>{actor.slice(0,1).toUpperCase()}</AvatarFallback></Avatar><button className="min-w-0 flex-1 text-left" onClick={() => { if (!n.read) markAsRead.mutate(n.id); if (n.link?.startsWith('/') && !n.link.startsWith('//')) navigate(n.link); }} aria-label={n.link ? `Open notification: ${n.title}` : n.read ? n.title : `Mark as read: ${n.title}`}><p className="font-medium">{n.title}</p><p className="mt-1 text-sm text-muted-foreground">{n.message}</p><p className="mt-2 text-xs text-muted-foreground">{safeFormatDistanceToNow(n.created_at)}</p></button>{!n.read && <span className="mt-2 h-2 w-2 rounded-full bg-primary" aria-label="Unread"/>}</CardContent></Card>})}</div></section>)}</div>{hasNextPage && <div className="mt-5 flex justify-center"><Button variant="outline" onClick={() => void fetchNextPage()} disabled={isFetchingNextPage}>{isFetchingNextPage ? 'Loading…' : 'Load older notifications'}</Button></div>}</>}
    </main>
  );
}
