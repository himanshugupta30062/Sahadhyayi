
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Search, UserPlus, MessageCircle, Users, Loader2, Check, X } from 'lucide-react';
import { useUserSearch, useAllUsers } from '@/hooks/useUserSearch';
import { useFriends, useSendFriendRequest, useFriendRequests, useRespondToFriendRequest, useCancelFriendRequest } from '@/hooks/useFriends';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/authHelpers';
import { ChatWindow } from '@/components/social/ChatWindow';

export const EnhancedFriendsManager = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [chatId, setChatId] = useState<string | null>(null);
  const { toast } = useToast();

  // Use the improved search hook with debouncing
  const { data: searchResults = [], isLoading: isSearching, error: searchError } = useUserSearch(searchTerm);
  const { data: allUsers = [], isLoading: isLoadingUsers } = useAllUsers();
  const { data: friends = [] } = useFriends();
  const { data: friendRequests = [], isLoading: isLoadingRequests } = useFriendRequests();
  const sendFriendRequest = useSendFriendRequest();
  const respondToFriendRequest = useRespondToFriendRequest();
  const cancelFriendRequest = useCancelFriendRequest();

  const handleSendFriendRequest = async (userId: string, userName: string) => {
    try {
      await sendFriendRequest.mutateAsync({ addresseeId: userId });
      toast({
        title: 'Friend Request Sent',
        description: `Friend request sent to ${userName}!`,
      });
    } catch (error) {
      console.error('Failed to send friend request:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to send friend request. Please try again.',
      });
    }
  };

  const handleRespondToRequest = async (requestId: string, status: 'accepted' | 'rejected', requesterName: string) => {
    try {
      await respondToFriendRequest.mutateAsync({ requestId, status });
      toast({
        title: status === 'accepted' ? 'Friend Request Accepted' : 'Friend Request Rejected',
        description: status === 'accepted' 
          ? `You are now friends with ${requesterName}!`
          : `Friend request from ${requesterName} has been rejected.`,
      });
    } catch (error) {
      console.error('Failed to respond to friend request:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to respond to friend request. Please try again.',
      });
    }
  };

  const handleCancelRequest = async (requestId: string, addresseeName: string) => {
    try {
      await cancelFriendRequest.mutateAsync({ requestId });
      toast({
        title: 'Friend Request Cancelled',
        description: `Friend request to ${addresseeName} has been cancelled.`,
      });
    } catch (error) {
      console.error('Failed to cancel friend request:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to cancel friend request. Please try again.',
      });
    }
  };

  const getInitials = (name: string) => {
    return name?.split(' ').map(n => n[0]).join('').toUpperCase() || '?';
  };

  // Separate incoming and outgoing requests
  const { user } = useAuth();
  const incomingRequests = friendRequests.filter(req => req.addressee_id === user?.id && req.status === 'pending');
  const outgoingRequests = friendRequests.filter(req => req.requester_id === user?.id && req.status === 'pending');


  return (
    <>
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-xl font-bold text-gray-900">Friends & Connections</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="discover" className="w-full">
            <TabsList className="grid w-full grid-cols-3 mb-6">
              <TabsTrigger value="discover" className="flex items-center gap-2">
                <Search className="w-4 h-4" />
                Discover
              </TabsTrigger>
              <TabsTrigger value="friends" className="flex items-center gap-2">
                <Users className="w-4 h-4" />
                Friends ({friends.length})
              </TabsTrigger>
              <TabsTrigger value="requests" className="flex items-center gap-2">
                <UserPlus className="w-4 h-4" />
                Requests ({incomingRequests.length + outgoingRequests.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="discover" className="space-y-4">
              {/* Search Bar */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search for friends by name, username, or bio..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 h-12 bg-gray-50 border-2 border-gray-200 focus:border-orange-400"
                />
              </div>

              {/* Search Status */}
              {searchTerm && (
                <div className="text-sm text-gray-600 bg-orange-50 px-4 py-2 rounded-lg border border-orange-200">
                  {isSearching ? (
                    <div className="flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Searching for "{searchTerm}"...</span>
                    </div>
                  ) : searchError ? (
                    <span className="text-red-600">Search failed. Please try again.</span>
                  ) : (
                    <span>Found {searchResults.length} result{searchResults.length !== 1 ? 's' : ''} for "{searchTerm}"</span>
                  )}
                </div>
              )}

              {/* Search Results or All Users */}
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {searchTerm ? (
                  // Show search results
                  searchResults.length > 0 ? (
                    searchResults.map((user) => (
                      <UserCard
                        key={user.id}
                        user={user}
                        onSendRequest={handleSendFriendRequest}
                        getInitials={getInitials}
                        isFriend={friends.some(f => f.friend_profile?.id === user.id)}
                        onMessage={(id) => setChatId(id)}
                      />
                    ))
                  ) : !isSearching ? (
                    <div className="text-center py-8 text-gray-500">
                      <Search className="w-12 h-12 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">No users found matching "{searchTerm}"</p>
                      <p className="text-xs">Try searching with different keywords</p>
                    </div>
                  ) : null
                ) : (
                  // Show all users when no search term
                  <>
                    {isLoadingUsers ? (
                      <div className="flex items-center justify-center py-8">
                        <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
                        <span className="ml-2 text-gray-500">Loading users...</span>
                      </div>
                    ) : allUsers.length > 0 ? (
                      allUsers.map((user) => (
                        <UserCard
                          key={user.id}
                          user={user}
                          onSendRequest={handleSendFriendRequest}
                          getInitials={getInitials}
                          isFriend={friends.some(f => f.friend_profile?.id === user.id)}
                          onMessage={(id) => setChatId(id)}
                        />
                      ))
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        <Users className="w-12 h-12 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">No users found</p>
                      </div>
                    )}
                  </>
                )}
              </div>
            </TabsContent>

            <TabsContent value="friends" className="space-y-4">
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {friends.length > 0 ? (
                  friends.map((friendship) => {
                    // Get the friend's profile (the one that's not the current user)
                    const friendProfile = friendship.user1_id === user?.id 
                      ? friendship.user2_profile 
                      : friendship.user1_profile;
                    
                    return (
                      <div key={friendship.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <Avatar className="w-10 h-10">
                            <AvatarImage src={friendProfile?.profile_photo_url || ''} />
                            <AvatarFallback className="bg-gradient-to-r from-green-400 to-blue-500 text-white">
                              {getInitials(friendProfile?.full_name || '')}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium text-gray-900">
                              {friendProfile?.full_name || 'Unknown User'}
                            </p>
                            <p className="text-sm text-gray-500">
                              @{friendProfile?.username || 'username'}
                            </p>
                            {friendProfile?.bio && (
                              <p className="text-xs text-gray-400 truncate">
                                {friendProfile.bio}
                              </p>
                            )}
                          </div>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setChatId(friendProfile?.id || '')}
                          className="text-blue-600 hover:text-blue-700"
                        >
                          <MessageCircle className="w-4 h-4 mr-2" />
                          Message
                        </Button>
                      </div>
                    );
                  })
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <Users className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No friends yet</p>
                    <p className="text-xs">Search for users to send friend requests</p>
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="requests" className="space-y-4">
              {isLoadingRequests ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
                  <span className="ml-2 text-gray-500">Loading requests...</span>
                </div>
              ) : (
                <>
                  {/* Incoming Friend Requests */}
                  {incomingRequests.length > 0 && (
                    <div className="space-y-3">
                      <h3 className="text-sm font-semibold text-gray-700 px-2">
                        Incoming Requests ({incomingRequests.length})
                      </h3>
                      {incomingRequests.map((request) => (
                        <div key={request.id} className="flex items-center justify-between p-3 bg-blue-50 border border-blue-200 rounded-lg">
                          <div className="flex items-center gap-3">
                            <Avatar className="w-10 h-10">
                              <AvatarImage src={request.requester_profile?.profile_photo_url || ''} />
                              <AvatarFallback>
                                {getInitials(request.requester_profile?.full_name || '')}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium text-gray-900">
                                {request.requester_profile?.full_name || 'Unknown User'}
                              </p>
                              <p className="text-sm text-gray-500">
                                @{request.requester_profile?.username || 'username'}
                              </p>
                              <p className="text-xs text-gray-400">
                                Sent {new Date(request.created_at).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              onClick={() => handleRespondToRequest(request.id, 'accepted', request.requester_profile?.full_name || 'User')}
                              disabled={respondToFriendRequest.isPending}
                              className="bg-green-600 hover:bg-green-700 text-white"
                            >
                              <Check className="w-4 h-4 mr-1" />
                              Accept
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleRespondToRequest(request.id, 'rejected', request.requester_profile?.full_name || 'User')}
                              disabled={respondToFriendRequest.isPending}
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

                  {/* Outgoing Friend Requests */}
                  {outgoingRequests.length > 0 && (
                    <div className="space-y-3">
                      <h3 className="text-sm font-semibold text-gray-700 px-2">
                        Sent Requests ({outgoingRequests.length})
                      </h3>
                      {outgoingRequests.map((request) => (
                        <div key={request.id} className="flex items-center justify-between p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                          <div className="flex items-center gap-3">
                            <Avatar className="w-10 h-10">
                              <AvatarImage src={request.addressee_profile?.profile_photo_url || ''} />
                              <AvatarFallback>
                                {getInitials(request.addressee_profile?.full_name || '')}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium text-gray-900">
                                {request.addressee_profile?.full_name || 'Unknown User'}
                              </p>
                              <p className="text-sm text-gray-500">
                                @{request.addressee_profile?.username || 'username'}
                              </p>
                              <p className="text-xs text-gray-400">
                                Sent {new Date(request.created_at).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                              Pending
                            </Badge>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleCancelRequest(request.id, request.addressee_profile?.full_name || 'User')}
                              disabled={cancelFriendRequest.isPending}
                              className="border-red-300 text-red-700 hover:bg-red-50"
                            >
                              <X className="w-4 h-4 mr-1" />
                              Cancel
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* No Requests State */}
                  {incomingRequests.length === 0 && outgoingRequests.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      <UserPlus className="w-12 h-12 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">No pending requests</p>
                      <p className="text-xs">Friend requests will appear here</p>
                    </div>
                  )}
                </>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
    {chatId && (
      <ChatWindow friendId={chatId} isOpen={!!chatId} onClose={() => setChatId(null)} />
    )}
    </>
  );
};

// Separate UserCard component for better organization
interface UserCardProps {
  user: any;
  onSendRequest: (userId: string, userName: string) => void;
  getInitials: (name: string) => string;
  isFriend?: boolean;
  onMessage?: (userId: string) => void;
}

const UserCard: React.FC<UserCardProps> = ({ user, onSendRequest, getInitials, isFriend = false, onMessage }) => (
  <div className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg hover:shadow-sm transition-shadow">
    <div className="flex items-center gap-3">
      <Avatar className="w-10 h-10">
        <AvatarImage src={user.profile_photo_url || ''} />
        <AvatarFallback className="bg-gradient-to-r from-orange-400 to-amber-500 text-white">
          {getInitials(user.full_name || '')}
        </AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0">
        <p className="font-medium text-gray-900 truncate">
          {user.full_name || 'Unknown User'}
        </p>
        <p className="text-sm text-gray-500 truncate">
          @{user.username || 'username'}
        </p>
        {user.bio && (
          <p className="text-xs text-gray-400 truncate mt-1">
            {user.bio}
          </p>
        )}
      </div>
    </div>
    <div className="flex gap-2">
      {!isFriend ? (
        <Button
          size="sm"
          variant="outline"
          aria-label="Add friend"
          onClick={() => onSendRequest(user.id, user.full_name || 'User')}
        >
          <UserPlus className="w-4 h-4 mr-1" />
          Add
        </Button>
      ) : (
        <Button size="sm" variant="ghost" aria-label="Message user" onClick={() => onMessage?.(user.id)}>
          <MessageCircle className="w-4 h-4 mr-1" />
          Message
        </Button>
      )}
    </div>
  </div>
);
