
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Search, UserPlus, MessageCircle, Users, Loader2 } from 'lucide-react';
import { useUserSearch, useAllUsers } from '@/hooks/useUserSearch';
import { useFriends, useSendFriendRequest } from '@/hooks/useFriends';
import { useToast } from '@/hooks/use-toast';
import { ChatWindow } from '@/components/social/ChatWindow';

export const EnhancedFriendsManager = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [chatId, setChatId] = useState<string | null>(null);
  const { toast } = useToast();

  // Use the improved search hook with debouncing
  const { data: searchResults = [], isLoading: isSearching, error: searchError } = useUserSearch(searchTerm);
  const { data: allUsers = [], isLoading: isLoadingUsers } = useAllUsers();
  const { data: friends = [] } = useFriends();
  const sendFriendRequest = useSendFriendRequest();

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

  const getInitials = (name: string) => {
    return name?.split(' ').map(n => n[0]).join('').toUpperCase() || '?';
  };

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
                Requests
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
                  friends.map((friendship) => (
                    <div key={friendship.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <Avatar className="w-10 h-10">
                          <AvatarImage src={friendship.friend_profile?.profile_photo_url || ''} />
                          <AvatarFallback>
                            {getInitials(friendship.friend_profile?.full_name || '')}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium text-gray-900">
                            {friendship.friend_profile?.full_name || 'Unknown User'}
                          </p>
                          <p className="text-sm text-gray-500">
                            @{friendship.friend_profile?.username || 'username'}
                          </p>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setChatId(friendship.friend_profile?.id || '')}
                      >
                        <MessageCircle className="w-4 h-4 mr-2" />
                        Message
                      </Button>
                    </div>
                  ))
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
              <div className="text-center py-8 text-gray-500">
                <UserPlus className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No pending requests</p>
                <p className="text-xs">Friend requests will appear here</p>
              </div>
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
      <Button
        size="sm"
        variant="outline"
        aria-label="Add friend"
        onClick={() => onSendRequest(user.id, user.full_name || 'User')}
      >
        <UserPlus className="w-4 h-4 mr-1" />
        Add
      </Button>
      {isFriend && onMessage && (
        <Button size="sm" variant="ghost" aria-label="Message user" onClick={() => onMessage(user.id)}>
          <MessageCircle className="w-4 h-4" />
        </Button>
      )}
    </div>
  </div>
);
