
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
import { useToggleUserFollow, useUserFollows, useFollowedReaders } from '@/hooks/useUserFollows';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/authHelpers';
import { ChatWindow } from '@/components/social/ChatWindow';
import { DnaMatchChip } from '@/components/social/dna/DnaMatchChip';

export const EnhancedFriendsManager = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [chatId, setChatId] = useState<string | null>(null);
  const { toast } = useToast();

  // Use the improved search hook with debouncing
  const { data: searchResults = [], isLoading: isSearching, error: searchError, refetch: refetchSearch } = useUserSearch(searchTerm);
  const { data: allUsers = [], isLoading: isLoadingUsers, error: usersError, refetch: refetchUsers } = useAllUsers();
  const { data: friends = [], isLoading: isLoadingFriends, error: friendsError, refetch: refetchFriends } = useFriends();
  const { data: friendRequests = [], isLoading: isLoadingRequests, error: friendRequestsError, refetch: refetchFriendRequests } = useFriendRequests();
  const sendFriendRequest = useSendFriendRequest();
  const respondToFriendRequest = useRespondToFriendRequest();
  const cancelFriendRequest = useCancelFriendRequest();
  const { data: followingIds = [], error: followingError, refetch: refetchFollowing } = useUserFollows();
  const { data: followedReaders = [], isLoading: isLoadingFollowed, error: followedReadersError, refetch: refetchFollowedReaders } = useFollowedReaders();
  const toggleUserFollow = useToggleUserFollow();

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

  const handleToggleFollow = async (targetUserId: string, targetUserName: string, isFollowing: boolean) => {
    try {
      await toggleUserFollow.mutateAsync({ targetUserId, isFollowing });
      toast({
        title: isFollowing ? 'Unfollowed reader' : 'Following reader',
        description: isFollowing ? `You no longer follow ${targetUserName}.` : `${targetUserName} is now in your Following list.`,
      });
    } catch (error) {
      console.error('Failed to update reader follow:', error);
      toast({
        variant: 'destructive',
        title: 'Could not update follow',
        description: error instanceof Error ? error.message : 'Please try again.',
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
  const relationshipStateUnavailable = Boolean(friendsError || friendRequestsError);
  const followStateUnavailable = Boolean(followingError);

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
            <TabsList className="grid w-full grid-cols-4 mb-6 bg-muted/60 rounded-xl p-1">
              <TabsTrigger value="discover" className="flex items-center gap-1.5 rounded-lg data-[state=active]:bg-background data-[state=active]:text-brand-primary data-[state=active]:shadow-sm">
                <Search className="w-4 h-4" />
                <span className="hidden sm:inline">Discover</span>
              </TabsTrigger>
              <TabsTrigger value="friends" className="flex items-center gap-1.5 rounded-lg data-[state=active]:bg-background data-[state=active]:text-brand-primary data-[state=active]:shadow-sm">
                <Users className="w-4 h-4" />
                <span className="hidden sm:inline">Friends</span> ({friends.length})
              </TabsTrigger>
              <TabsTrigger value="following" className="flex items-center gap-1.5 rounded-lg data-[state=active]:bg-background data-[state=active]:text-brand-primary data-[state=active]:shadow-sm">
                <Check className="w-4 h-4" />
                <span className="hidden sm:inline">Following</span> ({followingIds.length})
              </TabsTrigger>
              <TabsTrigger value="requests" className="flex items-center gap-1.5 rounded-lg data-[state=active]:bg-background data-[state=active]:text-brand-primary data-[state=active]:shadow-sm">
                <UserPlus className="w-4 h-4" />
                <span className="hidden sm:inline">Requests</span> ({incomingRequests.length + outgoingRequests.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="discover" className="space-y-4">
              {(relationshipStateUnavailable || followStateUnavailable) && (
                <div role="alert" className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
                  <p>Connection status could not be verified, so relationship actions are temporarily disabled to avoid duplicate requests.</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {friendsError && <Button type="button" size="sm" variant="outline" onClick={() => void refetchFriends()}>Retry friends</Button>}
                    {friendRequestsError && <Button type="button" size="sm" variant="outline" onClick={() => void refetchFriendRequests()}>Retry requests</Button>}
                    {followingError && <Button type="button" size="sm" variant="outline" onClick={() => void refetchFollowing()}>Retry following</Button>}
                  </div>
                </div>
              )}
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
              {searchTerm.trim() && (
                <div className="text-sm text-muted-foreground bg-brand-primary/5 px-4 py-2 rounded-lg border border-brand-primary/20" aria-live="polite">
                  {searchTerm.trim().length < 2 ? (
                    <span>Enter at least 2 characters to search readers.</span>
                  ) : isSearching ? (
                    <div className="flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin text-brand-primary" />
                      <span>Searching for “{searchTerm.trim()}”…</span>
                    </div>
                  ) : searchError ? (
                    <span className="text-destructive">Reader search failed.</span>
                  ) : (
                    <span>Found <strong className="text-foreground">{visibleSearchResults.length}</strong> result{visibleSearchResults.length !== 1 ? 's' : ''} for “{searchTerm.trim()}”</span>
                  )}
                </div>
              )}

              {/* Search Results or All Users */}
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {searchTerm.trim() ? (
                  searchTerm.trim().length < 2 ? (
                    <div className="text-center py-8 text-sm text-muted-foreground">
                      Type at least 2 characters to search the reader directory.
                    </div>
                  ) : isSearching ? (
                    <div className="flex items-center justify-center py-8" role="status">
                      <Loader2 className="w-6 h-6 animate-spin text-brand-primary" />
                      <span className="ml-2 text-muted-foreground">Searching readers…</span>
                    </div>
                  ) : searchError ? (
                    <div role="alert" className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
                      <p>Search failed. Your previous results are not being shown as current results.</p>
                      <Button type="button" size="sm" variant="outline" className="mt-3" onClick={() => void refetchSearch()}>Retry search</Button>
                    </div>
                  ) : visibleSearchResults.length > 0 ? (
                    visibleSearchResults.map((result) => (
                      <UserCard
                        key={result.id}
                        user={result}
                        onSendRequest={handleSendFriendRequest}
                        getInitials={getInitials}
                        isFriend={friends.some(f => f.friend_profile?.id === result.id)}
                        hasPendingRequest={pendingUserIds.has(result.id)}
                        isFollowing={followingIds.includes(result.id)}
                        isFollowPending={toggleUserFollow.isPending}
                        onToggleFollow={handleToggleFollow}
                        onMessage={(id) => setChatId(id)}
                        isRequestPending={sendFriendRequest.isPending}
                        relationshipStateUnavailable={relationshipStateUnavailable}
                        followStateUnavailable={followStateUnavailable}
                      />
                    ))
                  ) : (
                    <div className="text-center py-12 text-muted-foreground">
                      <div className="w-16 h-16 mx-auto mb-3 rounded-2xl bg-muted flex items-center justify-center">
                        <Search className="w-8 h-8 text-muted-foreground" />
                      </div>
                      <p className="text-sm font-medium text-foreground">No readers found for “{searchTerm.trim()}”</p>
                      <p className="text-xs">Try another name or username.</p>
                    </div>
                  )
                ) : (
                  <>
                    {isLoadingUsers ? (
                      <div className="flex items-center justify-center py-8" role="status">
                        <Loader2 className="w-6 h-6 animate-spin text-brand-primary" />
                        <span className="ml-2 text-muted-foreground">Loading readers…</span>
                      </div>
                    ) : usersError ? (
                      <div role="alert" className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
                        <p>Reader suggestions could not be loaded.</p>
                        <Button type="button" size="sm" variant="outline" className="mt-3" onClick={() => void refetchUsers()}>Retry suggestions</Button>
                      </div>
                    ) : visibleAllUsers.length > 0 ? (
                      visibleAllUsers.map((result) => (
                        <UserCard
                          key={result.id}
                          user={result}
                          onSendRequest={handleSendFriendRequest}
                          getInitials={getInitials}
                          isFriend={friends.some(f => f.friend_profile?.id === result.id)}
                          hasPendingRequest={pendingUserIds.has(result.id)}
                          isFollowing={followingIds.includes(result.id)}
                          isFollowPending={toggleUserFollow.isPending}
                          onToggleFollow={handleToggleFollow}
                          onMessage={(id) => setChatId(id)}
                          isRequestPending={sendFriendRequest.isPending}
                          relationshipStateUnavailable={relationshipStateUnavailable}
                          followStateUnavailable={followStateUnavailable}
                        />
                      ))
                    ) : (
                      <div className="text-center py-12 text-muted-foreground">
                        <div className="w-16 h-16 mx-auto mb-3 rounded-2xl bg-brand-primary/10 flex items-center justify-center">
                          <Users className="w-8 h-8 text-brand-primary" />
                        </div>
                        <p className="text-sm font-medium text-foreground">No new readers to suggest</p>
                        <p className="text-xs">Try searching for a reader by name or username.</p>
                      </div>
                    )}
                  </>
                )}
              </div>
            </TabsContent>

            <TabsContent value="following" className="space-y-4">
              {isLoadingFollowed ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-brand-primary" />
                  <span className="ml-2 text-muted-foreground">Loading followed readers...</span>
                </div>
              ) : followedReadersError ? (
                <div role="alert" className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
                  Could not load your Following list. Please try again later.
                </div>
              ) : followedReaders.length > 0 ? (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {followedReaders.map((reader) => (
                    <UserCard
                      key={reader.id}
                      user={reader}
                      onSendRequest={handleSendFriendRequest}
                      getInitials={getInitials}
                      isFriend={friends.some(f => f.friend_profile?.id === reader.id)}
                      hasPendingRequest={pendingUserIds.has(reader.id)}
                      isFollowing={followingIds.includes(reader.id)}
                      isFollowPending={toggleUserFollow.isPending}
                      onToggleFollow={handleToggleFollow}
                      onMessage={(id) => setChatId(id)}
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  <div className="w-16 h-16 mx-auto mb-3 rounded-2xl bg-brand-primary/10 flex items-center justify-center">
                    <Users className="w-8 h-8 text-brand-primary" />
                  </div>
                  <p className="text-sm font-medium text-foreground">You’re not following any readers yet</p>
                  <p className="text-xs">Discover readers and follow people whose book interests you share.</p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="friends" className="space-y-4">
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {isLoadingFriends ? (
                  <div className="flex items-center justify-center py-8" role="status">
                    <Loader2 className="w-6 h-6 animate-spin text-brand-primary" />
                    <span className="ml-2 text-muted-foreground">Loading friends…</span>
                  </div>
                ) : friendsError ? (
                  <div role="alert" className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
                    <p>Your friends could not be loaded.</p>
                    <Button type="button" size="sm" variant="outline" className="mt-3" onClick={() => void refetchFriends()}>Retry</Button>
                  </div>
                ) : friends.length > 0 ? (
                  friends.map((friendship) => {
                    // useFriends returns the other reader in friend_profile.
                    const friendProfile = friendship.friend_profile;
                    
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
                            <div className="flex items-center gap-2">
                              <p className="font-semibold text-foreground">
                                {friendProfile?.full_name || 'Unknown User'}
                              </p>
                              {friendProfile?.id && (
                                <DnaMatchChip userId={friendProfile.id} userName={friendProfile.full_name || 'Friend'} />
                              )}
                            </div>
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
              ) : friendRequestsError ? (
                <div role="alert" className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
                  <p>Friend requests could not be loaded.</p>
                  <Button type="button" size="sm" variant="outline" className="mt-3" onClick={() => void refetchFriendRequests()}>Retry</Button>
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
  isFollowing?: boolean;
  isFollowPending?: boolean;
  isRequestPending?: boolean;
  relationshipStateUnavailable?: boolean;
  followStateUnavailable?: boolean;
  onToggleFollow?: (userId: string, userName: string, isFollowing: boolean) => void;
}

const UserCard: React.FC<UserCardProps> = ({ user, onSendRequest, getInitials, isFriend = false, hasPendingRequest = false, onMessage, isFollowing = false, isFollowPending = false, isRequestPending = false, relationshipStateUnavailable = false, followStateUnavailable = false, onToggleFollow }) => (
  <div className="flex items-center justify-between p-3 bg-card border border-border rounded-xl hover:shadow-sm hover:border-brand-primary/30 transition-all">
    <div className="flex items-center gap-3 min-w-0">
      <Avatar className="w-11 h-11 ring-2 ring-brand-primary/10">
        <AvatarImage
          src={user.profile_photo_url || ''}
          alt={user.full_name || 'User'}
          onError={(e) => {
            (e.currentTarget as HTMLElement).style.display = 'none';
          }}
        />
        <AvatarFallback className="bg-gradient-button text-white font-semibold">
          {getInitials(user.full_name || '')}
        </AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="font-semibold text-foreground truncate">
            {user.full_name || 'Unknown User'}
          </p>
          {user.id && (
            <DnaMatchChip userId={user.id} userName={user.full_name || 'User'} />
          )}
        </div>
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
      <Button
        size="sm"
        variant={isFollowing ? 'secondary' : 'outline'}
        aria-label={isFollowing ? `Unfollow ${user.full_name || 'reader'}` : `Follow ${user.full_name || 'reader'}`}
        disabled={isFollowPending || followStateUnavailable}
        onClick={() => onToggleFollow?.(user.id, user.full_name || 'Reader', isFollowing)}
        className={isFollowing
          ? 'rounded-lg bg-brand-primary/10 text-brand-primary hover:bg-brand-primary/15'
          : 'rounded-lg border-brand-primary/40 text-brand-primary hover:bg-brand-primary/10'}
      >
        {isFollowing ? <Check className="w-4 h-4 mr-1" /> : <Users className="w-4 h-4 mr-1" />}
        {isFollowing ? 'Following' : 'Follow'}
      </Button>
      {relationshipStateUnavailable ? (
        <Button size="sm" variant="ghost" disabled aria-label="Connection status unavailable">Status unavailable</Button>
      ) : !isFriend && !hasPendingRequest ? (
        <Button
          size="sm"
          variant="outline"
          aria-label={`Send friend request to ${user.full_name || 'user'}`}
          onClick={() => onSendRequest(user.id, user.full_name || 'User')}
          disabled={isRequestPending}
          className="border-brand-primary/40 text-brand-primary hover:bg-brand-primary/10 rounded-lg"
        >
          {isRequestPending ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <UserPlus className="w-4 h-4 mr-1" />}
          {isRequestPending ? 'Sending…' : 'Add'}
        </Button>
      ) : isFriend ? (
        <Button
          size="sm"
          variant="ghost"
          aria-label={`Message ${user.full_name || 'user'}`}
          onClick={() => onMessage?.(user.id)}
          className="text-brand-primary hover:bg-brand-primary/10 rounded-lg"
        >
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
