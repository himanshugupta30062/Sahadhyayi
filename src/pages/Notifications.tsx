import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, CheckCheck, UserPlus, MessageCircle, Heart, Users, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import SEO from '@/components/SEO';
import Breadcrumb from '@/components/Breadcrumb';
import {
  useNotifications,
  useUnreadNotificationsCount,
  useMarkNotificationAsRead,
  useMarkAllNotificationsAsRead,
} from '@/hooks/useNotifications';
import { safeFormatDistanceToNow } from '@/lib/dateUtils';

const NotificationsPage: React.FC = () => {
  const navigate = useNavigate();
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const { data: notifications = [], isLoading, isError, refetch } = useNotifications();
  const { data: unreadCount = 0 } = useUnreadNotificationsCount();
  const markAsRead = useMarkNotificationAsRead();
  const markAllAsRead = useMarkAllNotificationsAsRead();

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'friend_request':
        return <UserPlus className="w-4 h-4 text-blue-600 dark:text-blue-400" />;
      case 'comment':
        return <MessageCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />;
      case 'like':
        return <Heart className="w-4 h-4 text-rose-600 dark:text-rose-400" />;
      case 'group':
      case 'reading_group_event':
      case 'reading_group_event_rsvp':
        return <Users className="w-4 h-4 text-amber-600 dark:text-amber-400" />;
      default:
        return <BookOpen className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const handleNotificationClick = (notification: (typeof notifications)[number]) => {
    if (!notification.read) {
      markAsRead.mutate(notification.id);
    }
    if (notification.link?.startsWith('/')) {
      navigate(notification.link);
    }
  };

  const filteredNotifications = filter === 'unread'
    ? notifications.filter((n) => !n.read)
    : notifications;

  return (
    <>
      <SEO
        title="Notifications - Sahadhyayi"
        description="Stay updated with reader discussions, friend requests, reading groups, and literary activity."
        canonical="https://sahadhyayi.com/notifications"
        url="https://sahadhyayi.com/notifications"
      />
      <div className="container mx-auto max-w-4xl px-4 py-6 sm:py-8">
        <Breadcrumb
          items={[
            { name: 'Home', path: '/' },
            { name: 'Notifications', path: '/notifications', current: true },
          ]}
          className="mb-6"
        />

        <Card className="border-border/80 shadow-sm bg-card">
          <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border/60 pb-5">
            <div>
              <div className="flex items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Bell className="h-5 w-5" aria-hidden="true" />
                </div>
                <CardTitle className="text-xl sm:text-2xl font-serif font-bold text-foreground">
                  Notifications
                </CardTitle>
                {unreadCount > 0 && (
                  <Badge variant="destructive" className="ml-1 px-2 py-0.5 text-xs font-semibold">
                    {unreadCount} new
                  </Badge>
                )}
              </div>
              <CardDescription className="mt-1 text-xs sm:text-sm text-muted-foreground">
                Your latest reader interactions, group invitations, and book updates
              </CardDescription>
            </div>

            <div className="flex items-center gap-2">
              <div className="flex rounded-lg border border-border p-0.5 bg-muted/40">
                <button
                  type="button"
                  onClick={() => setFilter('all')}
                  className={`rounded-md px-3 py-1 text-xs font-medium transition-colors ${
                    filter === 'all'
                      ? 'bg-background text-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  All ({notifications.length})
                </button>
                <button
                  type="button"
                  onClick={() => setFilter('unread')}
                  className={`rounded-md px-3 py-1 text-xs font-medium transition-colors ${
                    filter === 'unread'
                      ? 'bg-background text-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  Unread ({unreadCount})
                </button>
              </div>

              {unreadCount > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => markAllAsRead.mutate()}
                  disabled={markAllAsRead.isPending}
                  className="h-8 gap-1 text-xs"
                >
                  <CheckCheck className="h-3.5 w-3.5" />
                  <span>{markAllAsRead.isPending ? 'Marking...' : 'Mark all read'}</span>
                </Button>
              )}
            </div>
          </CardHeader>

          <CardContent className="p-0">
            {isLoading ? (
              <div className="py-16 text-center text-sm text-muted-foreground">
                <div className="mx-auto mb-3 h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                Loading your notifications...
              </div>
            ) : isError ? (
              <div className="py-12 text-center text-sm text-destructive">
                <p>Unable to load notifications right now.</p>
                <Button variant="ghost" size="sm" onClick={() => refetch()} className="mt-2 text-xs">
                  Try Again
                </Button>
              </div>
            ) : filteredNotifications.length === 0 ? (
              <div className="py-16 text-center">
                <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-muted/60 text-muted-foreground">
                  <Bell className="h-6 w-6 opacity-60" />
                </div>
                <h3 className="text-base font-semibold text-foreground">
                  {filter === 'unread' ? 'No unread notifications' : 'No notifications yet'}
                </h3>
                <p className="mt-1 text-xs sm:text-sm text-muted-foreground max-w-sm mx-auto">
                  {filter === 'unread'
                    ? 'You have caught up with all your updates.'
                    : 'When readers comment on your posts, invite you to reading rooms, or connect with you, updates will appear here.'}
                </p>
              </div>
            ) : (
              <div className="divide-y divide-border/60">
                {filteredNotifications.map((notification) => {
                  const actorName =
                    notification.actor?.full_name ||
                    notification.actor?.username ||
                    notification.authors?.name ||
                    'Sahadhyayi Reader';
                  const avatarUrl =
                    notification.actor?.profile_photo_url ||
                    notification.authors?.profile_image_url ||
                    '';

                  return (
                    <button
                      key={notification.id}
                      type="button"
                      onClick={() => handleNotificationClick(notification)}
                      className={`flex w-full items-start gap-3.5 p-4 text-left transition-colors hover:bg-muted/60 ${
                        !notification.read
                          ? 'bg-primary/5 dark:bg-primary/10'
                          : 'bg-card'
                      }`}
                    >
                      <Avatar className="h-10 w-10 shrink-0 border border-border/60">
                        <AvatarImage src={avatarUrl} alt={actorName} />
                        <AvatarFallback className="bg-gradient-to-br from-amber-400 to-orange-500 text-white font-medium text-xs">
                          {actorName.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 mb-0.5">
                          {getNotificationIcon(notification.type)}
                          <span className="text-xs font-semibold text-foreground truncate">
                            {notification.title}
                          </span>
                          {!notification.read && (
                            <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-primary/40 text-primary">
                              New
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs sm:text-sm text-muted-foreground line-clamp-2">
                          {notification.message}
                        </p>
                        <p className="mt-1.5 text-[11px] text-muted-foreground/70">
                          {safeFormatDistanceToNow(notification.created_at, { addSuffix: true })}
                        </p>
                      </div>

                      {!notification.read && (
                        <span
                          aria-label="Unread"
                          className="mt-2 h-2.5 w-2.5 rounded-full bg-primary shrink-0"
                        />
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
};

export default NotificationsPage;
