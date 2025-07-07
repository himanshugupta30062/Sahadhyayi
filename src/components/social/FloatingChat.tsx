
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { MessageCircle, Users, Send, X, Minimize2 } from 'lucide-react';

const mockFriends = [
  { id: '1', name: 'Sarah Johnson', isOnline: true, lastMessage: 'Hey, how are you?' },
  { id: '2', name: 'Mike Chen', isOnline: false, lastMessage: 'Thanks for the book rec!' },
  { id: '3', name: 'Emma Wilson', isOnline: true, lastMessage: 'See you at book club!' }
];

export const FloatingChat = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [selectedFriend, setSelectedFriend] = useState<string | null>(null);
  const [message, setMessage] = useState('');

  const onlineFriends = mockFriends.filter(friend => friend.isOnline);

  if (!isOpen) {
    return (
      <div className="fixed bottom-6 right-6 z-50">
        <Button
          onClick={() => setIsOpen(true)}
          className="bg-orange-600 hover:bg-orange-700 rounded-full w-14 h-14 shadow-lg relative"
        >
          <MessageCircle className="w-6 h-6" />
          {onlineFriends.length > 0 && (
            <Badge className="absolute -top-2 -right-2 bg-green-500 text-white text-xs w-6 h-6 rounded-full p-0 flex items-center justify-center">
              {onlineFriends.length}
            </Badge>
          )}
        </Button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <Card className={`w-80 bg-white shadow-xl border-amber-200 transition-all ${isMinimized ? 'h-14' : 'h-96'}`}>
        <CardHeader className="p-3 bg-gradient-to-r from-orange-500 to-amber-500 text-white">
          <CardTitle className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              <span>Friends Chat</span>
              {onlineFriends.length > 0 && (
                <Badge className="bg-green-500 text-white text-xs">
                  {onlineFriends.length} online
                </Badge>
              )}
            </div>
            <div className="flex gap-1">
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setIsMinimized(!isMinimized)}
                className="text-white hover:bg-white/20 h-6 w-6 p-0"
              >
                <Minimize2 className="w-3 h-3" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setIsOpen(false)}
                className="text-white hover:bg-white/20 h-6 w-6 p-0"
              >
                <X className="w-3 h-3" />
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        
        {!isMinimized && (
          <CardContent className="p-0 flex flex-col h-80">
            {selectedFriend ? (
              // Chat View
              <div className="flex flex-col h-full">
                <div className="p-3 border-b bg-gray-50">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedFriend(null)}
                    className="text-gray-600 hover:text-gray-900"
                  >
                    ← Back to friends
                  </Button>
                </div>
                <div className="flex-1 p-3 overflow-y-auto">
                  <div className="space-y-3">
                    <div className="bg-gray-100 p-2 rounded-lg max-w-xs">
                      <p className="text-sm">Hey! How's your reading going?</p>
                    </div>
                    <div className="bg-orange-100 p-2 rounded-lg max-w-xs ml-auto">
                      <p className="text-sm">Great! Just finished chapter 5 of Atomic Habits.</p>
                    </div>
                  </div>
                </div>
                <div className="p-3 border-t bg-gray-50">
                  <div className="flex gap-2">
                    <Input
                      placeholder="Type a message..."
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      className="flex-1 text-sm"
                      onKeyPress={(e) => e.key === 'Enter' && setMessage('')}
                    />
                    <Button size="sm" className="bg-orange-600 hover:bg-orange-700">
                      <Send className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              // Friends List
              <div className="flex-1 overflow-y-auto">
                <div className="p-3 space-y-2">
                  {mockFriends.map((friend) => (
                    <div
                      key={friend.id}
                      onClick={() => setSelectedFriend(friend.id)}
                      className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-lg cursor-pointer transition-colors"
                    >
                      <div className="relative">
                        <Avatar className="w-8 h-8">
                          <AvatarFallback className="text-xs">
                            {friend.name.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        {friend.isOnline && (
                          <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-gray-900 text-sm truncate">{friend.name}</h4>
                        <p className="text-xs text-gray-500 truncate">{friend.lastMessage}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        )}
      </Card>
    </div>
  );
};
