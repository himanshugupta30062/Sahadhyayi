
import React, { useState, useRef, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Send, X } from 'lucide-react';
import { usePrivateMessages, useSendPrivateMessage } from '@/hooks/useMessages';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
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

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;

    try {
      await sendMessage.mutateAsync({
        receiverId: friendId,
        content: message.trim(),
      });
      setMessage('');
      refetch();
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  };

  const getInitials = (name: string) => {
    return name?.split(' ').map(n => n[0]).join('').toUpperCase() || 'U';
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md h-[500px] flex flex-col p-0">
        <DialogHeader className="p-4 pb-2 border-b">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Avatar className="w-8 h-8">
                <AvatarImage src={friendProfile?.profile_photo_url} />
                <AvatarFallback className="text-sm bg-orange-100 text-orange-700">
                  {getInitials(friendProfile?.full_name || '')}
                </AvatarFallback>
              </Avatar>
              <div>
                <DialogTitle className="text-sm font-medium">
                  {friendProfile?.full_name}
                </DialogTitle>
                <p className="text-xs text-gray-500">@{friendProfile?.username}</p>
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose} className="h-8 w-8 p-0">
              <X className="w-4 h-4" />
            </Button>
          </div>
        </DialogHeader>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 ? (
            <div className="text-center text-gray-500 py-8">
              <p className="text-sm">No messages yet. Start the conversation!</p>
            </div>
          ) : (
            messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.sender_id === user?.id ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`max-w-[70%] ${msg.sender_id === user?.id ? 'order-2' : 'order-1'}`}>
                  {msg.sender_id !== user?.id && (
                    <div className="flex items-center gap-2 mb-1">
                      <Avatar className="w-5 h-5">
                        <AvatarImage src={msg.sender_profile?.profile_photo_url} />
                        <AvatarFallback className="text-xs bg-gray-100">
                          {getInitials(msg.sender_profile?.full_name || '')}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-xs text-gray-600">{msg.sender_profile?.full_name}</span>
                    </div>
                  )}
                  <div
                    className={`rounded-2xl px-3 py-2 ${
                      msg.sender_id === user?.id
                        ? 'bg-orange-600 text-white'
                        : 'bg-gray-100 text-gray-900'
                    }`}
                  >
                    <p className="text-sm">{msg.content}</p>
                  </div>
                  <p className={`text-xs text-gray-500 mt-1 ${msg.sender_id === user?.id ? 'text-right' : 'text-left'}`}>
                    {formatDistanceToNow(new Date(msg.created_at), { addSuffix: true })}
                  </p>
                </div>
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Message Input */}
        <div className="p-4 border-t">
          <form onSubmit={handleSendMessage} className="flex gap-2">
            <Input
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Type a message..."
              className="flex-1"
              autoFocus
            />
            <Button 
              type="submit" 
              disabled={!message.trim() || sendMessage.isPending}
              className="bg-orange-600 hover:bg-orange-700"
            >
              <Send className="w-4 h-4" />
            </Button>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
};
