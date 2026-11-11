import { CheckCheck, Bell, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useNotifications, useMarkNotificationAsRead, useMarkAllNotificationsAsRead } from '@/hooks/useNotifications';
import { safeFormatDistanceToNow } from '@/lib/dateUtils';

export default function NotificationsPage() {
  const { data: notifications = [], isLoading, isError, refetch } = useNotifications();
  const markAsRead = useMarkNotificationAsRead();
  const markAllAsRead = useMarkAllNotificationsAsRead();
  const unread = notifications.filter((n) => !n.read).length;

  return (
    <main className="container mx-auto max-w-3xl px-4 py-8">
      <div className="mb-6 flex items-center justify-between gap-3">
        <div><Button asChild variant="ghost" size="sm"><Link to="/activity"><ArrowLeft className="mr-2 h-4 w-4"/>Back</Link></Button>
          <h1 className="mt-2 text-2xl font-semibold">Notifications</h1>
          <p className="text-sm text-muted-foreground">Updates from fellow readers and your community.</p>
        </div>
        {unread > 0 && <Button variant="outline" onClick={() => markAllAsRead.mutate()} disabled={markAllAsRead.isPending}><CheckCheck className="mr-2 h-4 w-4"/>Mark all read</Button>}
      </div>
      {isLoading ? <Card><CardContent className="p-8 text-center text-muted-foreground">Loading notifications…</CardContent></Card>
        : isError ? <Card><CardContent className="p-8 text-center"><p className="mb-3 text-muted-foreground">Couldn’t load notifications.</p><Button variant="outline" onClick={() => void refetch()}>Try again</Button></CardContent></Card>
        : notifications.length === 0 ? <Card><CardContent className="p-10 text-center"><Bell className="mx-auto mb-3 h-8 w-8 text-muted-foreground"/><p className="font-medium">You’re all caught up</p><p className="mt-1 text-sm text-muted-foreground">New activity will appear here.</p></CardContent></Card>
        : <div className="space-y-2">{notifications.map((n) => { const actor = n.actor?.full_name || n.actor?.username || 'A reader'; return <Card key={n.id} className={n.read ? '' : 'border-primary/30 bg-primary/5'}><CardContent className="flex items-start gap-3 p-4"><Avatar className="h-10 w-10"><AvatarImage src={n.actor?.profile_photo_url || n.authors?.profile_image_url || ''}/><AvatarFallback>{actor.slice(0,1).toUpperCase()}</AvatarFallback></Avatar><button className="min-w-0 flex-1 text-left" onClick={() => !n.read && markAsRead.mutate(n.id)}><p className="font-medium">{n.title}</p><p className="mt-1 text-sm text-muted-foreground">{n.message}</p><p className="mt-2 text-xs text-muted-foreground">{safeFormatDistanceToNow(n.created_at)}</p></button>{!n.read && <span className="mt-2 h-2 w-2 rounded-full bg-primary" aria-label="Unread"/>}</CardContent></Card>})}</div>}
    </main>
  );
}
