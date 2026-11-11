import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Bell, UserPlus, MessageCircle, Heart, Users, CheckCheck } from 'lucide-react';
import {
  useNotifications,
  useUnreadNotificationsCount,
  useMarkNotificationAsRead,
  useMarkAllNotificationsAsRead,
} from '@/hooks/useNotifications';
import { safeFormatDistanceToNow } from '@/lib/dateUtils';

interface NotificationPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NotificationPanel: React.FC<NotificationPanelProps> = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const { data: notifications = [], isLoading, isError } = useNotifications();
  const { data: unreadCount = 0 } = useUnreadNotificationsCount();
  const markAsRead = useMarkNotificationAsRead();
  const markAllAsRead = useMarkAllNotificationsAsRead();

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'friend_request': return <UserPlus className="w-4 h-4 text-blue-600" />;
      case 'comment': return <MessageCircle className="w-4 h-4 text-green-600" />;
      case 'like': return <Heart className="w-4 h-4 text-red-600" />;
      case 'group':
      case 'reading_group_event':
      case 'reading_group_event_rsvp': return <Users className="w-4 h-4 text-orange-600" />;
      default: return <Bell className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const handleNotificationClick = (notification: (typeof notifications)[number]) => {
    if (!notification.read) markAsRead.mutate(notification.id);
    if (notification.link?.startsWith('/')) {
      onClose();
      navigate(notification.link);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between gap-2">
            <span className="flex items-center gap-2"><Bell className="w-5 h-5" />Notifications</span>
            {unreadCount > 0 && (
              <Button variant="ghost" size="sm" onClick={() => markAllAsRead.mutate()}
                disabled={markAllAsRead.isPending} className="h-8 px-2 text-xs">
                <CheckCheck className="w-3 h-3 mr-1" />
                {markAllAsRead.isPending ? 'Marking…' : 'Mark all read'}
              </Button>
            )}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-2 overflow-y-auto pr-1">
          {isLoading ? (
            <p className="py-8 text-center text-sm text-muted-foreground">Loading notifications…</p>
          ) : isError ? (
            <p role="alert" className="py-8 text-center text-sm text-destructive">Could not load notifications. Please try again.</p>
          ) : notifications.length === 0 ? (
            <div className="py-10 text-center">
              <Bell className="mx-auto mb-2 h-8 w-8 text-muted-foreground/50" />
              <p className="text-sm font-medium">You’re all caught up</p>
              <p className="text-xs text-muted-foreground mt-1">New activity will appear here.</p>
            </div>
          ) : notifications.map((notification) => {
            const actorName = notification.actor?.full_name || notification.actor?.username || notification.authors?.name || 'Sahadhyayi';
            const avatarUrl = notification.actor?.profile_photo_url || notification.authors?.profile_image_url || '';
            return (
              <button type="button" key={notification.id} onClick={() => handleNotificationClick(notification)}
                className={`flex w-full items-start gap-3 rounded-lg p-3 text-left transition-colors hover:bg-muted/70 ${!notification.read ? 'bg-primary/5 border border-primary/10' : 'bg-muted/30'}`}>
                <Avatar className="w-9 h-9 flex-shrink-0">
                  <AvatarImage src={avatarUrl} alt={actorName} />
                  <AvatarFallback className="text-xs">{actorName.charAt(0).toUpperCase()}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    {getNotificationIcon(notification.type)}
                    {!notification.read && <Badge className="text-xs px-1 py-0">New</Badge>}
                  </div>
                  <p className="text-sm font-medium text-foreground">{notification.title}</p>
                  <p className="text-sm text-muted-foreground mt-0.5">{notification.message}</p>
                  <p className="text-xs text-muted-foreground mt-1">{safeFormatDistanceToNow(notification.created_at, { addSuffix: true })}</p>
                </div>
                {!notification.read && <span aria-label="Unread" className="mt-2 h-2 w-2 rounded-full bg-primary flex-shrink-0" />}
              </button>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
};
