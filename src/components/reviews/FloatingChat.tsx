
import { useState } from "react";
import { MessageCircle, X, Send, Users, Search, Minimize2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";

interface ChatMessage {
  id: string;
  sender: string;
  message: string;
  timestamp: string;
  isMe: boolean;
}

interface ChatConversation {
  id: string;
  name: string;
  avatar?: string;
  isGroup: boolean;
  lastMessage: string;
  unreadCount: number;
  isOnline?: boolean;
  messages: ChatMessage[];
}

const conversations: ChatConversation[] = [
  {
    id: '1',
    name: 'Alice Reader',
    isGroup: false,
    lastMessage: 'Have you read The Great Gatsby?',
    unreadCount: 2,
    isOnline: true,
    messages: [
      {
        id: '1',
        sender: 'Alice Reader',
        message: 'Hey! How are you doing?',
        timestamp: '10:30 AM',
        isMe: false
      },
      {
        id: '2',
        sender: 'You',
        message: 'Great! Just finished reading Atomic Habits',
        timestamp: '10:32 AM',
        isMe: true
      },
      {
        id: '3',
        sender: 'Alice Reader',
        message: 'Have you read The Great Gatsby?',
        timestamp: '10:35 AM',
        isMe: false
      }
    ]
  },
  {
    id: '2',
    name: 'Classic Literature Club',
    isGroup: true,
    lastMessage: 'Sarah: What did everyone think of chapter 5?',
    unreadCount: 5,
    messages: [
      {
        id: '1',
        sender: 'Mike Johnson',
        message: 'The symbolism in this chapter is incredible',
        timestamp: '9:15 AM',
        isMe: false
      },
      {
        id: '2',
        sender: 'Sarah Wilson',
        message: 'What did everyone think of chapter 5?',
        timestamp: '9:45 AM',
        isMe: false
      }
    ]
  },
  {
    id: '3',
    name: 'Bob Bookworm',
    isGroup: false,
    lastMessage: 'Thanks for the book recommendation!',
    unreadCount: 0,
    isOnline: false,
    messages: [
      {
        id: '1',
        sender: 'Bob Bookworm',
        message: 'Thanks for the book recommendation!',
        timestamp: 'Yesterday',
        isMe: false
      }
    ]
  }
];

export const FloatingChat = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [selectedConversation, setSelectedConversation] = useState<ChatConversation | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const handleSendMessage = () => {
    if (newMessage.trim() && selectedConversation) {
      // In a real app, this would send the message to the backend
      const message: ChatMessage = {
        id: Date.now().toString(),
        sender: 'You',
        message: newMessage,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isMe: true
      };
      
      selectedConversation.messages.push(message);
      setNewMessage('');
    }
  };

  const filteredConversations = conversations.filter(conv =>
    conv.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalUnread = conversations.reduce((sum, conv) => sum + conv.unreadCount, 0);

  if (!isOpen) {
    return (
      <div className="fixed bottom-6 right-6 z-[9999]">
        <Button
          onClick={() => setIsOpen(true)}
          className="bg-amber-600 hover:bg-amber-700 text-white rounded-full w-14 h-14 shadow-lg hover:shadow-xl transition-all duration-300 relative"
        >
          <MessageCircle className="w-6 h-6" />
          {totalUnread > 0 && (
            <Badge className="absolute -top-2 -right-2 bg-red-500 text-white text-xs min-w-[20px] h-5 flex items-center justify-center rounded-full">
              {totalUnread > 99 ? '99+' : totalUnread}
            </Badge>
          )}
        </Button>
        <div className="mt-2 text-center">
          <span className="text-xs text-gray-600 bg-white px-2 py-1 rounded shadow-sm">
            Open Messages
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 z-[9999]">
      <div className={`bg-white rounded-lg shadow-2xl border border-gray-200 transition-all duration-300 ${
        isMinimized ? 'w-80 h-14' : 'w-80 h-96'
      }`}>
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-amber-50 rounded-t-lg">
          <div className="flex items-center space-x-2">
            <MessageCircle className="w-5 h-5 text-amber-600" />
            <h3 className="font-semibold text-gray-800">
              {selectedConversation ? selectedConversation.name : 'Messages'}
            </h3>
            {selectedConversation && selectedConversation.isGroup && (
              <Badge variant="outline" className="text-xs">
                <Users className="w-3 h-3 mr-1" />
                Group
              </Badge>
            )}
          </div>
          <div className="flex items-center space-x-1">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setIsMinimized(!isMinimized)}
              className="w-8 h-8 p-0"
            >
              <Minimize2 className="w-4 h-4" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setIsOpen(false)}
              className="w-8 h-8 p-0"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {!isMinimized && (
          <>
            {!selectedConversation ? (
              /* Conversation List */
              <div className="flex flex-col h-80">
                {/* Search */}
                <div className="p-3 border-b border-gray-100">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      placeholder="Search conversations..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-9 h-8 text-sm"
                    />
                  </div>
                </div>

                {/* Conversations */}
                <ScrollArea className="flex-1">
                  <div className="space-y-1 p-2">
                    {filteredConversations.map((conv) => (
                      <div
                        key={conv.id}
                        onClick={() => setSelectedConversation(conv)}
                        className="flex items-center space-x-3 p-2 hover:bg-gray-50 rounded-lg cursor-pointer transition-colors"
                      >
                        <div className="relative">
                          <Avatar className="w-10 h-10">
                            <AvatarFallback className="bg-gradient-to-br from-amber-400 to-orange-500 text-white text-sm">
                              {conv.name.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          {!conv.isGroup && conv.isOnline && (
                            <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <p className="font-medium text-sm text-gray-900 truncate">{conv.name}</p>
                            {conv.unreadCount > 0 && (
                              <Badge className="bg-red-500 text-white text-xs min-w-[18px] h-4 flex items-center justify-center rounded-full">
                                {conv.unreadCount}
                              </Badge>
                            )}
                          </div>
                          <p className="text-xs text-gray-600 truncate">{conv.lastMessage}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            ) : (
              /* Chat View */
              <div className="flex flex-col h-80">
                {/* Back Button */}
                <div className="p-2 border-b border-gray-100">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setSelectedConversation(null)}
                    className="text-amber-600 hover:bg-amber-50"
                  >
                    ← Back to conversations
                  </Button>
                </div>

                {/* Messages */}
                <ScrollArea className="flex-1 p-3">
                  <div className="space-y-3">
                    {selectedConversation.messages.map((message) => (
                      <div
                        key={message.id}
                        className={`flex ${message.isMe ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-[70%] p-2 rounded-lg text-sm ${
                            message.isMe
                              ? 'bg-amber-600 text-white'
                              : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {!message.isMe && selectedConversation.isGroup && (
                            <p className="text-xs font-semibold mb-1 opacity-75">
                              {message.sender}
                            </p>
                          )}
                          <p>{message.message}</p>
                          <p className={`text-xs mt-1 ${
                            message.isMe ? 'text-amber-100' : 'text-gray-500'
                          }`}>
                            {message.timestamp}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>

                {/* Message Input */}
                <div className="p-3 border-t border-gray-100">
                  <div className="flex space-x-2">
                    <Input
                      placeholder="Type a message..."
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                      className="flex-1 h-8 text-sm"
                    />
                    <Button
                      size="sm"
                      onClick={handleSendMessage}
                      className="bg-amber-600 hover:bg-amber-700 text-white px-3"
                    >
                      <Send className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};
