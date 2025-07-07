
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Search, 
  UserPlus, 
  Users, 
  Share, 
  Facebook, 
  Instagram, 
  MessageCircle,
  Check,
  X,
  Info
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Friend {
  id: string;
  name: string;
  username: string;
  avatar?: string;
  mutualFriends: number;
  isOnline: boolean;
  location?: string;
}

interface FriendRequest {
  id: string;
  user: Friend;
  type: 'incoming' | 'outgoing';
  timestamp: string;
}

const mockFriends: Friend[] = [
  {
    id: '1',
    name: 'Sarah Johnson',
    username: 'sarah_reads',
    mutualFriends: 5,
    isOnline: true,
    location: 'New York, USA'
  },
  {
    id: '2',
    name: 'Mike Chen',
    username: 'bookworm_mike',
    mutualFriends: 3,
    isOnline: false,
    location: 'Toronto, Canada'
  }
];

const mockRequests: FriendRequest[] = [
  {
    id: '1',
    user: {
      id: '3',
      name: 'Emma Wilson',
      username: 'emma_bookclub',
      mutualFriends: 2,
      isOnline: true
    },
    type: 'incoming',
    timestamp: '2 hours ago'
  }
];

export const SocialFriends = () => {
  const [friends, setFriends] = useState<Friend[]>(mockFriends);
  const [requests, setRequests] = useState<FriendRequest[]>(mockRequests);
  const [searchQuery, setSearchQuery] = useState('');
  const [profileLink] = useState('https://sahadhyayi.com/profile/your-username');
  const { toast } = useToast();

  const handleAcceptRequest = (requestId: string) => {
    const request = requests.find(r => r.id === requestId);
    if (request) {
      setFriends([...friends, request.user]);
      setRequests(requests.filter(r => r.id !== requestId));
      toast({ title: 'Friend request accepted!' });
    }
  };

  const handleDeclineRequest = (requestId: string) => {
    setRequests(requests.filter(r => r.id !== requestId));
    toast({ title: 'Friend request declined' });
  };

  const handleConnectSocial = (platform: string) => {
    toast({ 
      title: `Connect ${platform}`, 
      description: `${platform} integration will be available soon!` 
    });
  };

  const copyProfileLink = () => {
    navigator.clipboard.writeText(profileLink);
    toast({ title: 'Profile link copied to clipboard!' });
  };

  return (
    <div className="space-y-6">
      <Tabs defaultValue="friends" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="friends">My Friends</TabsTrigger>
          <TabsTrigger value="requests">Friend Requests</TabsTrigger>
          <TabsTrigger value="connect">Connect Accounts</TabsTrigger>
        </TabsList>

        <TabsContent value="friends" className="space-y-6">
          {/* Search Friends */}
          <Card className="bg-white/90 backdrop-blur-sm border-amber-200">
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
                  className="flex-1"
                />
                <Button className="bg-orange-600 hover:bg-orange-700">
                  <Search className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Share Profile Link */}
          <Card className="bg-white/90 backdrop-blur-sm border-amber-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Share className="w-5 h-5" />
                Share Your Profile
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-3">
                <Input value={profileLink} readOnly className="flex-1" />
                <Button onClick={copyProfileLink} variant="outline">
                  Copy Link
                </Button>
              </div>
              <p className="text-sm text-gray-600 mt-2">
                Share this link with others to let them add you as a friend.
              </p>
            </CardContent>
          </Card>

          {/* Friends List */}
          <div className="grid gap-4">
            {friends.map((friend) => (
              <Card key={friend.id} className="bg-white/95 backdrop-blur-sm border-amber-200">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="relative">
                        <Avatar className="w-12 h-12">
                          <AvatarImage src={friend.avatar} />
                          <AvatarFallback className="bg-gradient-to-r from-amber-400 to-orange-500 text-white">
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
                        {friend.location && (
                          <p className="text-xs text-gray-400">{friend.location}</p>
                        )}
                        <Badge variant="outline" className="mt-1 text-xs">
                          {friend.mutualFriends} mutual friends
                        </Badge>
                      </div>
                    </div>
                    <Button size="sm" variant="outline" className="border-amber-300 text-amber-700">
                      <MessageCircle className="w-4 h-4 mr-2" />
                      Chat
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="requests" className="space-y-6">
          <Card className="bg-white/90 backdrop-blur-sm border-amber-200">
            <CardHeader>
              <CardTitle>Friend Requests</CardTitle>
            </CardHeader>
            <CardContent>
              {requests.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No pending friend requests</p>
              ) : (
                <div className="space-y-4">
                  {requests.map((request) => (
                    <div key={request.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <Avatar className="w-10 h-10">
                          <AvatarImage src={request.user.avatar} />
                          <AvatarFallback className="bg-gradient-to-r from-amber-400 to-orange-500 text-white">
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
                          className="bg-green-600 hover:bg-green-700"
                        >
                          <Check className="w-4 h-4 mr-1" />
                          Accept
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDeclineRequest(request.id)}
                          className="border-red-300 text-red-700 hover:bg-red-50"
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

        <TabsContent value="connect" className="space-y-6">
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              <strong>Privacy Notice:</strong> We use imported contacts only to help you find friends who are already on Sahadhyayi. 
              Your contacts are not stored permanently and are not shared with third parties.
            </AlertDescription>
          </Alert>

          <div className="grid gap-4">
            <Card className="bg-white/90 backdrop-blur-sm border-amber-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Facebook className="w-5 h-5 text-blue-600" />
                  Facebook
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 mb-4">Connect your Facebook account to find friends who are also on Sahadhyayi.</p>
                <Button onClick={() => handleConnectSocial('Facebook')} className="bg-blue-600 hover:bg-blue-700">
                  Connect Facebook
                </Button>
              </CardContent>
            </Card>

            <Card className="bg-white/90 backdrop-blur-sm border-amber-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Instagram className="w-5 h-5 text-pink-600" />
                  Instagram
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 mb-4">Connect your Instagram account to discover reading friends.</p>
                <Button onClick={() => handleConnectSocial('Instagram')} className="bg-pink-600 hover:bg-pink-700">
                  Connect Instagram
                </Button>
              </CardContent>
            </Card>

            <Card className="bg-white/90 backdrop-blur-sm border-amber-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageCircle className="w-5 h-5 text-blue-500" />
                  Telegram
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 mb-4">Connect your Telegram to find book discussion groups.</p>
                <Button onClick={() => handleConnectSocial('Telegram')} className="bg-blue-500 hover:bg-blue-600">
                  Connect Telegram
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};
