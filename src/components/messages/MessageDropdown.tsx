import React, { useState } from 'react';
import { MessageCircle, CheckCheck } from 'lucide-react';
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
import {
  useUnreadMessages,
  useUnreadMessagesCount,
  useMarkMessagesAsRead,
  useMarkAllMessagesAsRead,
} from '@/hooks/useMessages';
import { formatDistanceToNow } from 'date-fns';

export const MessageDropdown = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { data: messages = [] } = useUnreadMessages();
  const { data: unreadCount = 0 } = useUnreadMessagesCount();
  const markAsRead = useMarkMessagesAsRead();
  const markAllAsRead = useMarkAllMessagesAsRead();

  const handleMessageClick = (senderId: string) => {
    markAsRead.mutate(senderId);
  };

  const handleMarkAll = () => {
    markAllAsRead.mutate();
  };

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative"
          aria-label="Messages"
        >
          <MessageCircle className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel className="flex items-center justify-between">
          <span>Messages</span>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleMarkAll}
              className="h-6 px-2 text-xs"
            >
              <CheckCheck className="w-3 h-3 mr-1" />
              Mark all read
            </Button>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {messages.length === 0 ? (
          <div className="p-4 text-center text-muted-foreground text-sm">
            No unread messages
          </div>
        ) : (
          <ScrollArea className="h-96">
            {messages.map((message) => (
              <DropdownMenuItem
                key={message.id}
                className="p-0 focus:bg-muted/50"
                onClick={() => handleMessageClick(message.sender_id)}
              >
                <div className="w-full p-3">
                  <div className="flex items-start gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarImage
                        src={message.sender_profile?.profile_photo_url || ''}
                        alt={message.sender_profile?.full_name || ''}
                      />
                      <AvatarFallback>
                        {message.sender_profile?.full_name?.charAt(0) || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium line-clamp-1">
                        {message.sender_profile?.full_name}
                      </p>
                      <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
                        {message.content}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {formatDistanceToNow(new Date(message.created_at), { addSuffix: true })}
                      </p>
                    </div>
                  </div>
                </div>
              </DropdownMenuItem>
            ))}
          </ScrollArea>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default MessageDropdown;

