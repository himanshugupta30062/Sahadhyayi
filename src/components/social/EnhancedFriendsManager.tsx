
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
  const pendingUserIds = new Set([
    ...incomingRequests.map(req => req.requester_id),
    ...outgoingRequests.map(req => req.addressee_id),
  ]);

  const visibleSearchResults = searchResults.filter(result => result.id !== user?.id);
  const visibleAllUsers = allUsers.filter(result => result.id !== user?.id);

  return (
    <>
    <div className="space-y-6">
      <Card className="bg-card border-border rounded-2xl shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-xl font-bold text-foreground flex items-center gap-2">
            <Users className="w-5 h-5 text-brand-primary" />
            Friends & Connections
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="discover" className="w-full">
            <TabsList className="grid w-full grid-cols-3 mb-6 bg-muted/60 rounded-xl p-1">
              <TabsTrigger value="discover" className="flex items-center gap-1.5 rounded-lg data-[state=active]:bg-background data-[state=active]:text-brand-primary data-[state=active]:shadow-sm">
                <Search className="w-4 h-4" />
                <span className="hidden sm:inline">Discover</span>
              </TabsTrigger>
              <TabsTrigger value="friends" className="flex items-center gap-1.5 rounded-lg data-[state=active]:bg-background data-[state=active]:text-brand-primary data-[state=active]:shadow-sm">
                <Users className="w-4 h-4" />
                <span className="hidden sm:inline">Friends</span> ({friends.length})
              </TabsTrigger>
              <TabsTrigger value="requests" className="flex items-center gap-1.5 rounded-lg data-[state=active]:bg-background data-[state=active]:text-brand-primary data-[state=active]:shadow-sm">
                <UserPlus className="w-4 h-4" />
                <span className="hidden sm:inline">Requests</span> ({incomingRequests.length + outgoingRequests.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="discover" className="space-y-4">
              {/* Search Bar */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder="Search readers by name, username, or bio..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 h-11 bg-muted/40 border-border focus-visible:border-brand-primary focus-visible:ring-2 focus-visible:ring-brand-primary/20 rounded-xl"
                />
              </div>

              {/* Search Status */}
              {searchTerm && (
                <div className="text-sm text-muted-foreground bg-brand-primary/5 px-4 py-2 rounded-lg border border-brand-primary/20">
                  {isSearching ? (
                    <div className="flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin text-brand-primary" />
                      <span>Searching for "{searchTerm}"...</span>
                    </div>
                  ) : searchError ? (
                    <span className="text-destructive">Search failed. Please try again.</span>
                  ) : (
                    <span>Found <strong className="text-foreground">{visibleSearchResults.length}</strong> result{visibleSearchResults.length !== 1 ? 's' : ''} for "{searchTerm}"</span>
                  )}
                </div>
              )}

              {/* Search Results or All Users */}
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {searchTerm ? (
                  // Show search results
                  visibleSearchResults.length > 0 ? (
                    visibleSearchResults.map((user) => (
                      <UserCard
                        key={user.id}
                        user={user}
                        onSendRequest={handleSendFriendRequest}
                        getInitials={getInitials}
                        isFriend={friends.some(f => f.friend_profile?.id === user.id)}
                        hasPendingRequest={pendingUserIds.has(user.id)}
                        onMessage={(id) => setChatId(id)}
                      />
                    ))
                  ) : !isSearching ? (
                    <div className="text-center py-12 text-muted-foreground">
                      <div className="w-16 h-16 mx-auto mb-3 rounded-2xl bg-muted flex items-center justify-center">
                        <Search className="w-8 h-8 text-muted-foreground" />
                      </div>
                      <p className="text-sm font-medium text-foreground">No users found matching "{searchTerm}"</p>
                      <p className="text-xs">Try searching with different keywords</p>
                    </div>
                  ) : null
                ) : (
                  // Show all users when no search term
                  <>
                    {isLoadingUsers ? (
                      <div className="flex items-center justify-center py-8">
                        <Loader2 className="w-6 h-6 animate-spin text-brand-primary" />
                        <span className="ml-2 text-muted-foreground">Loading users...</span>
                      </div>
                    ) : visibleAllUsers.length > 0 ? (
                      visibleAllUsers.map((user) => (
                        <UserCard
                          key={user.id}
                          user={user}
                          onSendRequest={handleSendFriendRequest}
                          getInitials={getInitials}
                          isFriend={friends.some(f => f.friend_profile?.id === user.id)}
                          hasPendingRequest={pendingUserIds.has(user.id)}
                          onMessage={(id) => setChatId(id)}
                        />
                      ))
                    ) : (
                      <div className="text-center py-12 text-muted-foreground">
                        <div className="w-16 h-16 mx-auto mb-3 rounded-2xl bg-brand-primary/10 flex items-center justify-center">
                          <Users className="w-8 h-8 text-brand-primary" />
                        </div>
                        <p className="text-sm font-medium text-foreground">No users found</p>
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
                      <div key={friendship.id} className="flex items-center justify-between p-3 bg-card border border-border rounded-xl hover:shadow-sm hover:border-brand-primary/30 transition-all">
                        <div className="flex items-center gap-3">
                          <Avatar className="w-11 h-11 ring-2 ring-brand-primary/10">
                            <AvatarImage src={friendProfile?.profile_photo_url || ''} />
                            <AvatarFallback className="bg-gradient-button text-white font-semibold">
                              {getInitials(friendProfile?.full_name || '')}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-semibold text-foreground">
                              {friendProfile?.full_name || 'Unknown User'}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              @{friendProfile?.username || 'username'}
                            </p>
                            {friendProfile?.bio && (
                              <p className="text-xs text-muted-foreground/80 truncate max-w-[180px]">
                                {friendProfile.bio}
                              </p>
                            )}
                          </div>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setChatId(friendProfile?.id || '')}
                          className="border-brand-primary/40 text-brand-primary hover:bg-brand-primary/10 rounded-lg"
                        >
                          <MessageCircle className="w-4 h-4 mr-1.5" />
                          Message
                        </Button>
                      </div>
                    );
                  })
                ) : (
                  <div className="text-center py-12 text-muted-foreground">
                    <div className="w-16 h-16 mx-auto mb-3 rounded-2xl bg-brand-primary/10 flex items-center justify-center">
                      <Users className="w-8 h-8 text-brand-primary" />
                    </div>
                    <p className="text-sm font-medium text-foreground">No friends yet</p>
                    <p className="text-xs">Search for users to send friend requests</p>
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="requests" className="space-y-4">
              {isLoadingRequests ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-brand-primary" />
                  <span className="ml-2 text-muted-foreground">Loading requests...</span>
                </div>
              ) : (
                <>
                  {/* Incoming Friend Requests */}
                  {incomingRequests.length > 0 && (
                    <div className="space-y-3">
                      <h3 className="text-sm font-semibold text-foreground px-2">
                        Incoming Requests ({incomingRequests.length})
                      </h3>
                      {incomingRequests.map((request) => (
                        <div key={request.id} className="flex items-center justify-between p-3 bg-card border border-brand-primary/20 rounded-xl">
                          <div className="flex items-center gap-3">
                            <Avatar className="w-11 h-11 ring-2 ring-brand-primary/10">
                              <AvatarImage src={request.requester_profile?.profile_photo_url || ''} />
                              <AvatarFallback className="bg-gradient-button text-white font-semibold">
                                {getInitials(request.requester_profile?.full_name || '')}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-semibold text-foreground">
                                {request.requester_profile?.full_name || 'Unknown User'}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                @{request.requester_profile?.username || 'username'}
                              </p>
                              <p className="text-xs text-muted-foreground/80">
                                Sent {new Date(request.created_at).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              onClick={() => handleRespondToRequest(request.id, 'accepted', request.requester_profile?.full_name || 'User')}
                              disabled={respondToFriendRequest.isPending}
                              className="bg-gradient-button text-white hover:opacity-95 rounded-lg"
                            >
                              <Check className="w-4 h-4 mr-1" />
                              Accept
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleRespondToRequest(request.id, 'rejected', request.requester_profile?.full_name || 'User')}
                              disabled={respondToFriendRequest.isPending}
                              className="border-destructive/40 text-destructive hover:bg-destructive/10 rounded-lg"
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
                      <h3 className="text-sm font-semibold text-foreground px-2">
                        Sent Requests ({outgoingRequests.length})
                      </h3>
                      {outgoingRequests.map((request) => (
                        <div key={request.id} className="flex items-center justify-between p-3 bg-muted/40 border border-border rounded-xl">
                          <div className="flex items-center gap-3">
                            <Avatar className="w-11 h-11">
                              <AvatarImage src={request.addressee_profile?.profile_photo_url || ''} />
                              <AvatarFallback className="bg-gradient-button text-white font-semibold">
                                {getInitials(request.addressee_profile?.full_name || '')}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-semibold text-foreground">
                                {request.addressee_profile?.full_name || 'Unknown User'}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                @{request.addressee_profile?.username || 'username'}
                              </p>
                              <p className="text-xs text-muted-foreground/80">
                                Sent {new Date(request.created_at).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant="secondary" className="bg-amber-100 text-amber-800 dark:bg-amber-500/20 dark:text-amber-300">
                              Pending
                            </Badge>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleCancelRequest(request.id, request.addressee_profile?.full_name || 'User')}
                              disabled={cancelFriendRequest.isPending}
                              className="border-destructive/40 text-destructive hover:bg-destructive/10 rounded-lg"
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
                    <div className="text-center py-12 text-muted-foreground">
                      <div className="w-16 h-16 mx-auto mb-3 rounded-2xl bg-brand-primary/10 flex items-center justify-center">
                        <UserPlus className="w-8 h-8 text-brand-primary" />
                      </div>
                      <p className="text-sm font-medium text-foreground">No pending requests</p>
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
  hasPendingRequest?: boolean;
  onMessage?: (userId: string) => void;
}

const UserCard: React.FC<UserCardProps> = ({ user, onSendRequest, getInitials, isFriend = false, hasPendingRequest = false, onMessage }) => (
  <div className="flex items-center justify-between p-3 bg-card border border-border rounded-xl hover:shadow-sm hover:border-brand-primary/30 transition-all">
    <div className="flex items-center gap-3 min-w-0">
      <Avatar className="w-11 h-11 ring-2 ring-brand-primary/10">
        <AvatarImage src={user.profile_photo_url || ''} />
        <AvatarFallback className="bg-gradient-button text-white font-semibold">
          {getInitials(user.full_name || '')}
        </AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-foreground truncate">
          {user.full_name || 'Unknown User'}
        </p>
        <p className="text-sm text-muted-foreground truncate">
          @{user.username || 'username'}
        </p>
        {user.bio && (
          <p className="text-xs text-muted-foreground/80 truncate mt-0.5">
            {user.bio}
          </p>
        )}
      </div>
    </div>
    <div className="flex gap-2 flex-shrink-0">
      {!isFriend && !hasPendingRequest ? (
        <Button
          size="sm"
          variant="outline"
          aria-label="Add friend"
          onClick={() => onSendRequest(user.id, user.full_name || 'User')}
          className="border-brand-primary/40 text-brand-primary hover:bg-brand-primary/10 rounded-lg"
        >
          <UserPlus className="w-4 h-4 mr-1" />
          Add
        </Button>
      ) : isFriend ? (
        <Button size="sm" variant="ghost" aria-label="Message user" onClick={() => onMessage?.(user.id)} className="text-brand-primary hover:bg-brand-primary/10 rounded-lg">
          <MessageCircle className="w-4 h-4 mr-1" />
          Message
        </Button>
      ) : (
        <Badge variant="secondary" className="bg-amber-100 text-amber-800 dark:bg-amber-500/20 dark:text-amber-300">
          Pending
        </Badge>
      )}
    </div>
  </div>
);
