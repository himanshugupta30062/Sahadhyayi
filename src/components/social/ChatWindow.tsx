
import React, { useState, useRef, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Send, X, Check, CheckCheck } from 'lucide-react';
import { usePrivateMessages, useSendPrivateMessage, useMarkMessagesAsRead } from '@/hooks/useMessages';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import SignInLink from '@/components/SignInLink';
import { formatDistanceToNow } from 'date-fns';

interface ChatWindowProps {
  friendId: string;
  isOpen: boolean;
  onClose: () => void;
}

export const ChatWindow: React.FC<ChatWindowProps> = ({ friendId, isOpen, onClose }) => {
  const [message, setMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();
  
  const { data: messages = [], refetch } = usePrivateMessages(friendId);
  const sendMessage = useSendPrivateMessage();
  const markMessagesAsRead = useMarkMessagesAsRead();

  const { data: friendProfile } = useQuery({
    queryKey: ['friend-profile', friendId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('full_name, profile_photo_url, username')
        .eq('id', friendId)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!friendId,
  });

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    const markRead = async () => {
      if (isOpen && friendId) {
        const hasUnread = messages.some(m => m.sender_id === friendId && !m.is_read);
        if (hasUnread) {
          await markMessagesAsRead.mutateAsync(friendId);
          await refetch();
        }
      }
    };
    markRead();
  }, [messages, isOpen, friendId, markMessagesAsRead, refetch]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;

    try {
      await sendMessage.mutateAsync({
        receiverId: friendId,
        content: message.trim(),
      });
      setMessage('');
      await refetch();
      scrollToBottom();
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  };

  const getInitials = (name: string) => {
    return name?.split(' ').map(n => n[0]).join('').toUpperCase() || 'U';
  };

  if (!user) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-md p-6 text-center space-y-4">
          <p className="text-sm text-gray-600">Please sign in to send messages.</p>
          <SignInLink>
            <Button className="bg-orange-600 hover:bg-orange-700">Sign In</Button>
          </SignInLink>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md h-[500px] flex flex-col p-0 mx-4">
        <DialogHeader className="p-3 sm:p-4 pb-2 border-b shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 sm:gap-3 min-w-0">
              <Avatar className="w-7 h-7 sm:w-8 sm:h-8 shrink-0">
                <AvatarImage src={friendProfile?.profile_photo_url} />
                <AvatarFallback className="text-xs sm:text-sm bg-orange-100 text-orange-700">
                  {getInitials(friendProfile?.full_name || '')}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <DialogTitle className="text-sm font-medium truncate">
                  {friendProfile?.full_name}
                </DialogTitle>
                <p className="text-xs text-gray-500 truncate">@{friendProfile?.username}</p>
              </div>
            </div>
            {/* Close handled by DialogContent's built-in button */}
          </div>
        </DialogHeader>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-3 sm:space-y-4 min-h-0">
          {messages.length === 0 ? (
            <div className="text-center text-gray-500 py-6 sm:py-8">
              <p className="text-xs sm:text-sm">No messages yet. Start the conversation!</p>
            </div>
          ) : (
            messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.sender_id === user?.id ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`max-w-[75%] sm:max-w-[70%] ${msg.sender_id === user?.id ? 'order-2' : 'order-1'}`}>
                  {msg.sender_id !== user?.id && (
                    <div className="flex items-center gap-2 mb-1">
                      <Avatar className="w-4 h-4 sm:w-5 sm:h-5">
                        <AvatarImage src={msg.sender_profile?.profile_photo_url} />
                        <AvatarFallback className="text-xs bg-gray-100">
                          {getInitials(msg.sender_profile?.full_name || '')}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-xs text-gray-600 truncate">{msg.sender_profile?.full_name}</span>
                    </div>
                  )}
                  <div
                    className={`rounded-2xl px-3 py-2 ${
                      msg.sender_id === user?.id
                        ? 'bg-orange-600 text-white'
                        : 'bg-gray-100 text-gray-900'
                    }`}
                  >
                    <p className="text-sm break-words">{msg.content}</p>
                  </div>
                  <p
                    className={`text-xs text-gray-500 mt-1 flex items-center ${
                      msg.sender_id === user?.id ? 'justify-end' : 'justify-start'
                    }`}
                  >
                    {formatDistanceToNow(new Date(msg.created_at), { addSuffix: true })}
                    {msg.sender_id === user?.id && (
                      msg.is_read ? (
                        <CheckCheck className="w-3 h-3 ml-1 text-blue-500" />
                      ) : (
                        <Check className="w-3 h-3 ml-1 text-gray-400" />
                      )
                    )}
                  </p>
                </div>
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Message Input */}
        <div className="p-3 sm:p-4 border-t shrink-0">
          <form onSubmit={handleSendMessage} className="flex gap-2">
            <Input
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Type a message..."
              className="flex-1 text-sm border-orange-200 focus:border-orange-300"
              autoFocus
            />
            <Button 
              type="submit" 
              disabled={!message.trim() || sendMessage.isPending}
              className="bg-orange-600 hover:bg-orange-700 shrink-0 px-3"
              size="sm"
            >
              <Send className="w-4 h-4" />
            </Button>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
};
