
import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Send, X } from 'lucide-react';
import { chatData } from './chatData';

interface ChatWindowProps {
  isOpen: boolean;
  onClose: () => void;
}

const ChatWindow = ({ isOpen, onClose }: ChatWindowProps) => {
  const [messages, setMessages] = useState(chatData);
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = () => {
    if (newMessage.trim()) {
      const message = {
        id: messages.length + 1,
        user: 'You',
        avatar: '',
        message: newMessage.trim(),
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isCurrentUser: true
      };
      setMessages([...messages, message]);
      setNewMessage('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed bottom-4 right-4 w-80 h-96 bg-white rounded-lg shadow-xl border border-gray-200 flex flex-col z-50">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gradient-to-r from-orange-600 to-amber-600 text-white rounded-t-lg">
        <h3 className="font-semibold">Reading Community Chat</h3>
        <Button variant="ghost" size="sm" onClick={onClose} className="text-white hover:bg-white/20">
          <X className="w-4 h-4" />
        </Button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.isCurrentUser ? 'justify-end' : 'justify-start'}`}>
            <div className={`flex ${msg.isCurrentUser ? 'flex-row-reverse' : 'flex-row'} items-start space-x-2 max-w-[85%]`}>
              <Avatar className="w-8 h-8 flex-shrink-0">
                <AvatarImage src={msg.avatar} alt={msg.user} />
                <AvatarFallback className="text-xs bg-gradient-to-br from-orange-500 to-amber-500 text-white">
                  {msg.user.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <div className={`flex flex-col ${msg.isCurrentUser ? 'items-end' : 'items-start'} space-y-1`}>
                <div className={`px-3 py-2 rounded-lg shadow-sm break-words ${
                  msg.isCurrentUser 
                    ? 'bg-gradient-to-r from-orange-600 to-amber-600 text-white' 
                    : 'bg-gray-100 text-gray-900'
                }`}>
                  <p className="text-sm leading-relaxed whitespace-pre-wrap word-wrap break-word">
                    {msg.message}
                  </p>
                </div>
                <div className={`flex items-center space-x-2 text-xs text-gray-500 ${msg.isCurrentUser ? 'flex-row-reverse space-x-reverse' : ''}`}>
                  <span className="font-medium">{msg.user}</span>
                  <span>•</span>
                  <span>{msg.timestamp}</span>
                </div>
              </div>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t border-gray-200">
        <div className="flex space-x-2">
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type your message..."
            className="flex-1 text-sm"
            maxLength={500}
          />
          <Button 
            onClick={handleSendMessage} 
            disabled={!newMessage.trim()}
            size="sm"
            className="bg-orange-600 hover:bg-orange-700"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
        <p className="text-xs text-gray-500 mt-1">
          Press Enter to send • Shift+Enter for new line
        </p>
      </div>
    </div>
  );
};

export default ChatWindow;
