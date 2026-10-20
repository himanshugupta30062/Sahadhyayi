import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, CheckCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useNotifications, useUnreadNotificationsCount, useMarkNotificationAsRead, useMarkAllNotificationsAsRead } from '@/hooks/useNotifications';
import { safeFormatDistanceToNow } from '@/lib/dateUtils';

export const NotificationDropdown = () => {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();
  const { data: notifications = [] } = useNotifications();
  const { data: unreadCount = 0 } = useUnreadNotificationsCount();
  const markAsRead = useMarkNotificationAsRead();
  const markAllAsRead = useMarkAllNotificationsAsRead();

  const handleNotificationClick = (notification: (typeof notifications)[number]) => {
    if (!notification.read) markAsRead.mutate(notification.id);
    if (notification.link?.startsWith('/')) {
      setIsOpen(false);
      navigate(notification.link);
    }
  };

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative"
          aria-label={unreadCount > 0 ? `${unreadCount} unread notification${unreadCount === 1 ? '' : 's'}` : 'Notifications'}>
          <Bell className="h-5 w-5" aria-hidden="true" />
          {unreadCount > 0 && <Badge variant="destructive" aria-hidden="true"
            className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs">
            {unreadCount > 99 ? '99+' : unreadCount}
          </Badge>}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel className="flex items-center justify-between">
          <span>Notifications</span>
          {unreadCount > 0 && <Button variant="ghost" size="sm" onClick={() => markAllAsRead.mutate()}
            className="h-6 px-2 text-xs" disabled={markAllAsRead.isPending}>
            <CheckCheck className="w-3 h-3 mr-1" />Mark all read
          </Button>}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {notifications.length === 0 ? (
          <div className="p-4 text-center text-muted-foreground text-sm">No notifications yet</div>
        ) : (
          <ScrollArea className="h-96">
            {notifications.map((notification) => {
              const actorName = notification.actor?.full_name || notification.actor?.username;
              const avatarUrl = notification.actor?.profile_photo_url || notification.authors?.profile_image_url || '';
              return (
                <DropdownMenuItem key={notification.id} className="p-0 focus:bg-muted/50"
                  onClick={() => handleNotificationClick(notification)}>
                  <div className={`w-full p-3 ${!notification.read ? 'bg-primary/5' : ''}`}>
                    <div className="flex items-start gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={avatarUrl} alt={actorName || notification.authors?.name || ''} />
                        <AvatarFallback>{(actorName || notification.authors?.name || 'S').charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1">
                            <p className="text-sm font-medium line-clamp-1">{notification.title}</p>
                            <p className="text-xs text-muted-foreground line-clamp-2 mt-1">{notification.message}</p>
                            <p className="text-xs text-muted-foreground mt-1">
                              {safeFormatDistanceToNow(notification.created_at, { addSuffix: true })}
                            </p>
                          </div>
                          {!notification.read && <div className="w-2 h-2 bg-primary rounded-full mt-1 flex-shrink-0" />}
                        </div>
                      </div>
                    </div>
                  </div>
                </DropdownMenuItem>
              );
            })}
          </ScrollArea>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
