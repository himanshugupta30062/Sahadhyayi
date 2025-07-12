import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Search, UserPlus, Share, Check, X, MessageCircle, Users, MoreHorizontal } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Friend {
  id: string;
  name: string;
  username: string;
  avatar?: string;
  mutualFriends: number;
  isOnline: boolean;
}

const mockFriends: Friend[] = [
  {
    id: '1',
    name: 'Sarah Johnson',
    username: 'sarah_reads',
    avatar: '/api/placeholder/40/40',
    mutualFriends: 5,
    isOnline: true
  },
  {
    id: '2',
    name: 'Mike Chen',
    username: 'bookworm_mike',
    avatar: '/api/placeholder/40/40',
    mutualFriends: 3,
    isOnline: false
  },
  {
    id: '3',
    name: 'Emma Wilson',
    username: 'emma_bookclub',
    avatar: '/api/placeholder/40/40',
    mutualFriends: 8,
    isOnline: true
  },
  {
    id: '4',
    name: 'Alex Kumar',
    username: 'alex_reads',
    avatar: '/api/placeholder/40/40',
    mutualFriends: 2,
    isOnline: false
  },
  {
    id: '5',
    name: 'Sophie Lee',
    username: 'sophie_writes',
    avatar: '/api/placeholder/40/40',
    mutualFriends: 4,
    isOnline: true
  }
];

const mockRequests = [
  {
    id: '1',
    user: {
      id: '6',
      name: 'David Park',
      username: 'david_stories',
      avatar: '/api/placeholder/40/40',
      mutualFriends: 2,
      isOnline: true
    },
    timestamp: '2 hours ago'
  }
];

const mockSuggestions = [
  {
    id: '7',
    name: 'Lisa Chen',
    username: 'lisa_bookworm',
    avatar: '/api/placeholder/40/40',
    mutualFriends: 3,
    reason: 'Reads similar books'
  },
  {
    id: '8',
    name: 'Tom Wilson',
    username: 'tom_novels',
    avatar: '/api/placeholder/40/40',
    mutualFriends: 1,
    reason: 'Friend of Emma'
  }
];

export const SocialFriends = () => {
  const [friends, setFriends] = useState<Friend[]>(mockFriends);
  const [requests, setRequests] = useState(mockRequests);
  const [searchQuery, setSearchQuery] = useState('');
  const [profileLink] = useState('https://sahadhyayi.com/profile/your-username');
  const { toast } = useToast();

  const handleAcceptRequest = (requestId: string) => {
    const request = requests.find(r => r.id === requestId);
    if (request) {
      setFriends([...friends, { ...request.user, avatar: request.user.avatar || '' }]);
      setRequests(requests.filter(r => r.id !== requestId));
      toast({ title: 'Friend request accepted!' });
    }
  };

  const handleDeclineRequest = (requestId: string) => {
    setRequests(requests.filter(r => r.id !== requestId));
    toast({ title: 'Friend request declined' });
  };

  const copyProfileLink = () => {
    navigator.clipboard.writeText(profileLink);
    toast({ title: 'Profile link copied to clipboard!' });
  };

  // Check if we're in the sidebar (lg screen and up)
  const isSidebar = window.innerWidth >= 1024;

  if (isSidebar) {
    // Compact Sidebar Layout for Desktop
    return (
      <div className="space-y-4">
        {/* Friends List Header */}
        <Card className="bg-white shadow-sm border-0 rounded-xl">
          <CardHeader className="p-4 pb-3">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                <Users className="w-5 h-5" />
                Friends
              </h3>
              <Badge variant="secondary" className="text-xs">
                {friends.filter(f => f.isOnline).length} online
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            {/* Search Bar */}
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search friends..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-gray-50 border-0 rounded-xl text-sm"
              />
            </div>

            {/* Online Friends */}
            <div className="space-y-2 mb-4">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Online</p>
              {friends.filter(f => f.isOnline).map((friend) => (
                <div key={friend.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors">
                  <div className="relative">
                    <Avatar className="w-8 h-8">
                      <AvatarImage src={friend.avatar} />
                      <AvatarFallback className="bg-gradient-to-r from-orange-400 to-amber-500 text-white text-sm">
                        {friend.name.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm text-gray-900 truncate">{friend.name}</p>
                  </div>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0 hover:bg-gray-100">
                    <MessageCircle className="w-4 h-4 text-gray-500" />
                  </Button>
                </div>
              ))}
            </div>

            {/* Offline Friends */}
            <div className="space-y-2">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Offline</p>
              {friends.filter(f => !f.isOnline).slice(0, 3).map((friend) => (
                <div key={friend.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors opacity-75">
                  <Avatar className="w-8 h-8">
                    <AvatarImage src={friend.avatar} />
                    <AvatarFallback className="bg-gradient-to-r from-gray-400 to-gray-500 text-white text-sm">
                      {friend.name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm text-gray-700 truncate">{friend.name}</p>
                  </div>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0 hover:bg-gray-100">
                    <MessageCircle className="w-4 h-4 text-gray-400" />
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Friend Suggestions */}
        <Card className="bg-white shadow-sm border-0 rounded-xl">
          <CardHeader className="p-4 pb-3">
            <h3 className="font-semibold text-gray-900 text-sm">People You May Know</h3>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="space-y-3">
              {mockSuggestions.map((suggestion) => (
                <div key={suggestion.id} className="flex items-center gap-3">
                  <Avatar className="w-8 h-8">
                    <AvatarImage src={suggestion.avatar} />
                    <AvatarFallback className="bg-gradient-to-r from-blue-400 to-indigo-500 text-white text-sm">
                      {suggestion.name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm text-gray-900 truncate">{suggestion.name}</p>
                    <p className="text-xs text-gray-500 truncate">{suggestion.reason}</p>
                  </div>
                  <Button size="sm" className="h-7 px-3 text-xs bg-orange-600 hover:bg-orange-700">
                    Add
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Friend Requests */}
        {requests.length > 0 && (
          <Card className="bg-white shadow-sm border-0 rounded-xl">
            <CardHeader className="p-4 pb-3">
              <h3 className="font-semibold text-gray-900 text-sm">Friend Requests</h3>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <div className="space-y-3">
                {requests.map((request) => (
                  <div key={request.id} className="space-y-2">
                    <div className="flex items-center gap-3">
                      <Avatar className="w-8 h-8">
                        <AvatarImage src={request.user.avatar} />
                        <AvatarFallback className="bg-gradient-to-r from-orange-400 to-amber-500 text-white text-sm">
                          {request.user.name.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm text-gray-900 truncate">{request.user.name}</p>
                        <p className="text-xs text-gray-500">{request.user.mutualFriends} mutual</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => handleAcceptRequest(request.id)}
                        className="flex-1 h-7 text-xs bg-green-600 hover:bg-green-700"
                      >
                        Accept
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDeclineRequest(request.id)}
                        className="flex-1 h-7 text-xs border-gray-300"
                      >
                        Decline
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    );
  }

  // Full Layout for Mobile/Tablet
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Tabs defaultValue="friends" className="w-full">
        <TabsList className="grid w-full grid-cols-3 bg-white shadow-sm">
          <TabsTrigger value="friends">My Friends ({friends.length})</TabsTrigger>
          <TabsTrigger value="requests">Requests ({requests.length})</TabsTrigger>
          <TabsTrigger value="find">Find Friends</TabsTrigger>
        </TabsList>

        <TabsContent value="friends" className="space-y-6">
          {/* My Friends */}
          <div className="grid gap-4">
            {friends.map((friend) => (
              <Card key={friend.id} className="bg-white shadow-sm border-0 rounded-xl">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="relative">
                        <Avatar className="w-12 h-12">
                          <AvatarImage src={friend.avatar} />
                          <AvatarFallback className="bg-gradient-to-r from-orange-400 to-amber-500 text-white">
                            {friend.name.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        {friend.isOnline && (
                          <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-white rounded-full"></div>
                        )}
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900">{friend.name}</h4>
                        <p className="text-sm text-gray-500">@{friend.username}</p>
                        <Badge variant="outline" className="mt-1 text-xs">
                          {friend.mutualFriends} mutual friends
                        </Badge>
                      </div>
                    </div>
                    <Button size="sm" variant="outline" className="border-orange-300 text-orange-700 rounded-xl">
                      Message
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="requests" className="space-y-6">
          <Card className="bg-white shadow-sm border-0 rounded-xl">
            <CardHeader>
              <CardTitle>Friend Requests</CardTitle>
            </CardHeader>
            <CardContent>
              {requests.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No pending friend requests</p>
              ) : (
                <div className="space-y-4">
                  {requests.map((request) => (
                    <div key={request.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                      <div className="flex items-center space-x-3">
                        <Avatar className="w-10 h-10">
                          <AvatarImage src={request.user.avatar} />
                          <AvatarFallback className="bg-gradient-to-r from-orange-400 to-amber-500 text-white">
                            {request.user.name.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <h4 className="font-medium text-gray-900">{request.user.name}</h4>
                          <p className="text-sm text-gray-500">@{request.user.username} • {request.timestamp}</p>
                          <Badge variant="outline" className="mt-1 text-xs">
                            {request.user.mutualFriends} mutual friends
                          </Badge>
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <Button
                          size="sm"
                          onClick={() => handleAcceptRequest(request.id)}
                          className="bg-green-600 hover:bg-green-700 rounded-xl"
                        >
                          <Check className="w-4 h-4 mr-1" />
                          Accept
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDeclineRequest(request.id)}
                          className="border-red-300 text-red-700 hover:bg-red-50 rounded-xl"
                        >
                          <X className="w-4 h-4 mr-1" />
                          Decline
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="find" className="space-y-6">
          {/* Search Friends */}
          <Card className="bg-white shadow-sm border-0 rounded-xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Search className="w-5 h-5" />
                Find Friends
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-3">
                <Input
                  placeholder="Search by name or username..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="flex-1 rounded-xl"
                />
                <Button className="bg-orange-600 hover:bg-orange-700 rounded-xl">
                  <Search className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Friend Suggestions */}
          <Card className="bg-white shadow-sm border-0 rounded-xl">
            <CardHeader>
              <CardTitle>People You May Know</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {mockSuggestions.map((suggestion) => (
                  <div key={suggestion.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                    <div className="flex items-center space-x-3">
                      <Avatar className="w-10 h-10">
                        <AvatarImage src={suggestion.avatar} />
                        <AvatarFallback className="bg-gradient-to-r from-blue-400 to-indigo-500 text-white">
                          {suggestion.name.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <h4 className="font-medium text-gray-900">{suggestion.name}</h4>
                        <p className="text-sm text-gray-500">{suggestion.reason}</p>
                      </div>
                    </div>
                    <Button size="sm" className="bg-orange-600 hover:bg-orange-700 rounded-xl">
                      Add Friend
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Share Profile Link */}
          <Card className="bg-white shadow-sm border-0 rounded-xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Share className="w-5 h-5" />
                Share Your Profile
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-3">
                <Input value={profileLink} readOnly className="flex-1 rounded-xl" />
                <Button onClick={copyProfileLink} variant="outline" className="rounded-xl">
                  Copy Link
                </Button>
              </div>
              <p className="text-sm text-gray-600 mt-2">
                Share this link with others to let them add you as a friend.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
