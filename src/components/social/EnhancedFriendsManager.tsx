
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { UserPlus, UserMinus, Check, X, Users, Search, MessageCircle, User } from 'lucide-react';
import { useFriendRequests, useFriends, useSendFriendRequest, useRespondToFriendRequest } from '@/hooks/useFriends';
import { useUserSearch, useAllUsers } from '@/hooks/useUserSearch';
import { UserProfileModal } from './UserProfileModal';
import { ChatWindow } from './ChatWindow';

export const EnhancedFriendsManager = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [showChat, setShowChat] = useState<string | null>(null);
  const [sentRequests, setSentRequests] = useState<Set<string>>(new Set());

  const { data: friendRequests = [] } = useFriendRequests();
  const { data: friends = [] } = useFriends();
  const { data: searchResults = [] } = useUserSearch(searchTerm);
  const { data: allUsers = [] } = useAllUsers();
  
  const sendFriendRequest = useSendFriendRequest();
  const respondToRequest = useRespondToFriendRequest();

  const displayUsers = searchTerm ? searchResults : allUsers;
  
  // Filter out existing friends and pending requests
  const friendIds = new Set(friends.map(f => f.friend_profile?.id).filter(Boolean));
  const pendingRequestIds = new Set(friendRequests.map(r => r.requester_id === selectedUser ? r.addressee_id : r.requester_id));
  
  const availableUsers = displayUsers.filter(user => 
    !friendIds.has(user.id) && !pendingRequestIds.has(user.id)
  );

  const handleSendRequest = async (userId: string) => {
    try {
      await sendFriendRequest.mutateAsync({ addresseeId: userId });
      setSentRequests(prev => new Set([...prev, userId]));
    } catch (error) {
      console.error('Failed to send friend request:', error);
    }
  };

  const handleAcceptRequest = async (requestId: string) => {
    try {
      await respondToRequest.mutateAsync({ requestId, status: 'accepted' });
    } catch (error) {
      console.error('Failed to accept friend request:', error);
    }
  };

  const handleDeclineRequest = async (requestId: string) => {
    try {
      await respondToRequest.mutateAsync({ requestId, status: 'rejected' });
    } catch (error) {
      console.error('Failed to decline friend request:', error);
    }
  };

  const getInitials = (name: string) => {
    return name?.split(' ').map(n => n[0]).join('').toUpperCase() || 'U';
  };

  const pendingRequests = friendRequests.filter(r => r.status === 'pending');

  return (
    <>
      <Card className="bg-white shadow-sm border-0 rounded-xl">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Friends
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="requests" className="w-full">
            <TabsList className="grid w-full grid-cols-4 mb-4">
              <TabsTrigger value="requests" className="text-xs">
                Requests
                {pendingRequests.length > 0 && (
                  <Badge variant="secondary" className="ml-1 text-xs">
                    {pendingRequests.length}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="search" className="text-xs">Find</TabsTrigger>
              <TabsTrigger value="all" className="text-xs">Friends</TabsTrigger>
              <TabsTrigger value="chat" className="text-xs">Chat</TabsTrigger>
            </TabsList>

            <TabsContent value="requests" className="mt-0">
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {pendingRequests.length > 0 ? (
                  pendingRequests.map((request) => (
                    <div key={request.id} className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <Avatar className="w-10 h-10">
                          <AvatarImage src={request.requester_profile?.profile_photo_url} />
                          <AvatarFallback className="text-sm bg-orange-100 text-orange-700">
                            {getInitials(request.requester_profile?.full_name || '')}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {request.requester_profile?.full_name}
                          </p>
                          <p className="text-xs text-gray-500">
                            @{request.requester_profile?.username || 'user'}
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          className="h-8 w-8 p-0 bg-green-600 hover:bg-green-700"
                          onClick={() => handleAcceptRequest(request.id)}
                        >
                          <Check className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8 w-8 p-0 text-red-600 border-red-300 hover:bg-red-50"
                          onClick={() => handleDeclineRequest(request.id)}
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

            <TabsContent value="search" className="mt-0">
              <div className="space-y-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Search users by name, username..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {availableUsers.map((user) => (
                    <div key={user.id} className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg">
                      <div 
                        className="flex items-center gap-3 flex-1 cursor-pointer"
                        onClick={() => setSelectedUser(user.id)}
                      >
                        <Avatar className="w-10 h-10">
                          <AvatarImage src={user.profile_photo_url} />
                          <AvatarFallback className="text-sm bg-blue-100 text-blue-700">
                            {getInitials(user.full_name)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="text-sm font-medium text-gray-900">{user.full_name}</p>
                          <p className="text-xs text-gray-500">@{user.username || 'user'}</p>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-8 text-xs border-orange-300 text-orange-700 hover:bg-orange-50"
                        onClick={() => handleSendRequest(user.id)}
                        disabled={sentRequests.has(user.id)}
                      >
                        <UserPlus className="w-3 h-3 mr-1" />
                        {sentRequests.has(user.id) ? 'Sent' : 'Add'}
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="all" className="mt-0">
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {friends.map((friend) => (
                  <div key={friend.id} className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg">
                    <div 
                      className="flex items-center gap-3 flex-1 cursor-pointer"
                      onClick={() => setSelectedUser(friend.friend_profile?.id || '')}
                    >
                      <div className="relative">
                        <Avatar className="w-10 h-10">
                          <AvatarImage src={friend.friend_profile?.profile_photo_url} />
                          <AvatarFallback className="text-sm bg-green-100 text-green-700">
                            {getInitials(friend.friend_profile?.full_name || '')}
                          </AvatarFallback>
                        </Avatar>
                        {friend.friend_profile?.last_seen && new Date(friend.friend_profile.last_seen).getTime() > Date.now() - 300000 && (
                          <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {friend.friend_profile?.full_name}
                        </p>
                        <p className="text-xs text-gray-500">
                          @{friend.friend_profile?.username || 'user'}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-8 w-8 p-0 text-blue-600 hover:bg-blue-50"
                        onClick={() => setShowChat(friend.friend_profile?.id || '')}
                      >
                        <MessageCircle className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-8 w-8 p-0 text-red-600 hover:bg-red-50"
                      >
                        <UserMinus className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="chat" className="mt-0">
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {friends.map((friend) => (
                  <div key={friend.id} className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg cursor-pointer"
                       onClick={() => setShowChat(friend.friend_profile?.id || '')}>
                    <div className="flex items-center gap-3">
                      <Avatar className="w-10 h-10">
                        <AvatarImage src={friend.friend_profile?.profile_photo_url} />
                        <AvatarFallback className="text-sm bg-green-100 text-green-700">
                          {getInitials(friend.friend_profile?.full_name || '')}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {friend.friend_profile?.full_name}
                        </p>
                        <p className="text-xs text-gray-500">Click to chat</p>
                      </div>
                    </div>
                    <MessageCircle className="w-4 h-4 text-gray-400" />
                  </div>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {selectedUser && (
        <UserProfileModal
          userId={selectedUser}
          isOpen={!!selectedUser}
          onClose={() => setSelectedUser(null)}
        />
      )}

      {showChat && (
        <ChatWindow
          friendId={showChat}
          isOpen={!!showChat}
          onClose={() => setShowChat(null)}
        />
      )}
    </>
  );
};
