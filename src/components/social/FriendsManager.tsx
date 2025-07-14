
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { UserPlus, UserMinus, Check, X, Users } from 'lucide-react';

interface User {
  id: string;
  name: string;
  avatar?: string;
  mutualFriends?: number;
  isOnline?: boolean;
}

const mockFriendRequests: User[] = [
  { id: '1', name: 'Alice Johnson', avatar: '', mutualFriends: 5 },
  { id: '2', name: 'Bob Smith', avatar: '', mutualFriends: 3 },
];

const mockSuggestions: User[] = [
  { id: '3', name: 'Carol Davis', avatar: '', mutualFriends: 8 },
  { id: '4', name: 'David Wilson', avatar: '', mutualFriends: 2 },
  { id: '5', name: 'Emma Brown', avatar: '', mutualFriends: 6 },
];

const mockFriends: User[] = [
  { id: '6', name: 'Sarah Johnson', avatar: '', isOnline: true },
  { id: '7', name: 'Mike Chen', avatar: '', isOnline: false },
  { id: '8', name: 'Emma Wilson', avatar: '', isOnline: true },
];

export const FriendsManager = () => {
  const [friendRequests, setFriendRequests] = useState(mockFriendRequests);
  const [suggestions, setSuggestions] = useState(mockSuggestions);
  const [friends, setFriends] = useState(mockFriends);

  const handleAcceptRequest = (userId: string) => {
    const user = friendRequests.find(u => u.id === userId);
    if (user) {
      setFriends([...friends, { ...user, isOnline: Math.random() > 0.5 }]);
      setFriendRequests(friendRequests.filter(u => u.id !== userId));
    }
  };

  const handleDeclineRequest = (userId: string) => {
    setFriendRequests(friendRequests.filter(u => u.id !== userId));
  };

  const handleSendRequest = (userId: string) => {
    setSuggestions(suggestions.filter(u => u.id !== userId));
  };

  const handleRemoveFriend = (userId: string) => {
    setFriends(friends.filter(u => u.id !== userId));
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  return (
    <Card className="bg-white shadow-sm border-0 rounded-xl">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2">
          <Users className="w-5 h-5" />
          Friends
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="requests" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-4">
            <TabsTrigger value="requests" className="text-xs">
              Requests
              {friendRequests.length > 0 && (
                <Badge variant="secondary" className="ml-1 text-xs">
                  {friendRequests.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="suggestions" className="text-xs">Suggestions</TabsTrigger>
            <TabsTrigger value="all" className="text-xs">All Friends</TabsTrigger>
          </TabsList>

          <TabsContent value="requests" className="mt-0">
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {friendRequests.length > 0 ? (
                friendRequests.map((user) => (
                  <div key={user.id} className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <Avatar className="w-10 h-10">
                        <AvatarImage src={user.avatar} />
                        <AvatarFallback className="text-sm bg-orange-100 text-orange-700">
                          {getInitials(user.name)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{user.name}</p>
                        <p className="text-xs text-gray-500">{user.mutualFriends} mutual friends</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        className="h-8 w-8 p-0 bg-green-600 hover:bg-green-700"
                        onClick={() => handleAcceptRequest(user.id)}
                      >
                        <Check className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-8 w-8 p-0 text-red-600 border-red-300 hover:bg-red-50"
                        onClick={() => handleDeclineRequest(user.id)}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Users className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No pending friend requests</p>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="suggestions" className="mt-0">
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {suggestions.map((user) => (
                <div key={user.id} className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Avatar className="w-10 h-10">
                      <AvatarImage src={user.avatar} />
                      <AvatarFallback className="text-sm bg-blue-100 text-blue-700">
                        {getInitials(user.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{user.name}</p>
                      <p className="text-xs text-gray-500">{user.mutualFriends} mutual friends</p>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-8 text-xs border-orange-300 text-orange-700 hover:bg-orange-50"
                    onClick={() => handleSendRequest(user.id)}
                  >
                    <UserPlus className="w-3 h-3 mr-1" />
                    Add
                  </Button>
                </div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="all" className="mt-0">
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {friends.map((user) => (
                <div key={user.id} className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <Avatar className="w-10 h-10">
                        <AvatarImage src={user.avatar} />
                        <AvatarFallback className="text-sm bg-green-100 text-green-700">
                          {getInitials(user.name)}
                        </AvatarFallback>
                      </Avatar>
                      {user.isOnline && (
                        <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{user.name}</p>
                      <p className="text-xs text-gray-500">
                        {user.isOnline ? 'Online' : 'Offline'}
                      </p>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-8 w-8 p-0 text-red-600 hover:bg-red-50"
                    onClick={() => handleRemoveFriend(user.id)}
                  >
                    <UserMinus className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};
