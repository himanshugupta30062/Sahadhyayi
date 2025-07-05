import { useState } from 'react';
import { Send, X } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { ChatConversation, ChatMessage } from './chatData';

interface ChatWindowProps {
  conversation: ChatConversation;
  onClose: () => void;
}

export const ChatWindow = ({ conversation, onClose }: ChatWindowProps) => {
  const [messages, setMessages] = useState<ChatMessage[]>(conversation.messages);
  const [newMessage, setNewMessage] = useState('');

  const handleSendMessage = () => {
    if (!newMessage.trim()) return;
    const msg: ChatMessage = {
      id: Date.now().toString(),
      sender: 'You',
      message: newMessage,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isMe: true,
    };
    setMessages([...messages, msg]);
    setNewMessage('');
  };

  return (
    <Card className="mb-6 bg-white/90 backdrop-blur-sm border-amber-200">
      <CardHeader className="flex items-center justify-between pb-3">
        <CardTitle className="text-lg text-gray-900">{conversation.name}</CardTitle>
        <Button size="sm" variant="ghost" onClick={onClose} className="p-1">
          <X className="w-4 h-4" />
        </Button>
      </CardHeader>
      <CardContent className="flex flex-col h-[60vh]">
        <ScrollArea className="flex-1 pr-2">
          <div className="space-y-3">
            {messages.map((msg) => (
              <div key={msg.id} className={`flex ${msg.isMe ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[70%] p-2 rounded-lg text-sm ${msg.isMe ? 'bg-amber-600 text-white' : 'bg-gray-100 text-gray-800'}`}>
                  {!msg.isMe && conversation.isGroup && (
                    <p className="text-xs font-semibold mb-1 opacity-75">{msg.sender}</p>
                  )}
                  <p>{msg.message}</p>
                  <p className={`text-xs mt-1 ${msg.isMe ? 'text-amber-100' : 'text-gray-500'}`}>{msg.timestamp}</p>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
        <div className="flex mt-4 gap-2">
          <Input
            placeholder="Type a message..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
            className="flex-1 h-9"
          />
          <Button size="sm" onClick={handleSendMessage} className="bg-amber-600 hover:bg-amber-700 text-white px-3">
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
