
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Bell, UserPlus, MessageCircle, Heart, Users } from 'lucide-react';

interface NotificationPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

const mockNotifications = [
  {
    id: '1',
    type: 'friend_request',
    user: { name: 'Emma Wilson', avatar: '' },
    message: 'sent you a friend request',
    timestamp: '2 hours ago',
    unread: true
  },
  {
    id: '2',
    type: 'comment',
    user: { name: 'Sarah Johnson', avatar: '' },
    message: 'commented on your post about "Atomic Habits"',
    timestamp: '4 hours ago',
    unread: true
  },
  {
    id: '3',
    type: 'like',
    user: { name: 'Mike Chen', avatar: '' },
    message: 'liked your book review',
    timestamp: '6 hours ago',
    unread: false
  },
  {
    id: '4',
    type: 'group',
    user: { name: 'Mystery Book Club', avatar: '' },
    message: 'New discussion started: "Best Detective Novels of 2024"',
    timestamp: '1 day ago',
    unread: false
  }
];

export const NotificationPanel: React.FC<NotificationPanelProps> = ({ isOpen, onClose }) => {
  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'friend_request': return <UserPlus className="w-4 h-4 text-blue-600" />;
      case 'comment': return <MessageCircle className="w-4 h-4 text-green-600" />;
      case 'like': return <Heart className="w-4 h-4 text-red-600" />;
      case 'group': return <Users className="w-4 h-4 text-orange-600" />;
      default: return <Bell className="w-4 h-4 text-gray-600" />;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md max-h-96 overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Bell className="w-5 h-5" />
            Notifications
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          {mockNotifications.map((notification) => (
            <div
              key={notification.id}
              className={`flex items-start gap-3 p-3 rounded-lg transition-colors ${
                notification.unread ? 'bg-amber-50 border border-amber-200' : 'bg-gray-50'
              }`}
            >
              <Avatar className="w-8 h-8 flex-shrink-0">
                <AvatarImage src={notification.user.avatar} />
                <AvatarFallback className="text-xs">
                  {notification.user.name.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  {getNotificationIcon(notification.type)}
                  {notification.unread && (
                    <Badge className="bg-orange-500 text-white text-xs px-1 py-0">New</Badge>
                  )}
                </div>
                <p className="text-sm text-gray-900">
                  <span className="font-medium">{notification.user.name}</span>{' '}
                  {notification.message}
                </p>
                <p className="text-xs text-gray-500">{notification.timestamp}</p>
              </div>
            </div>
          ))}
          <div className="pt-4 border-t">
            <Button variant="outline" className="w-full">
              Mark All as Read
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
