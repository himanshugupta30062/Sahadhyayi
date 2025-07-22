
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Search, UserPlus, Users, Clock, Check, X, MessageCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';

interface Profile {
  id: string;
  full_name: string;
  username: string;
  profile_photo_url?: string;
  bio?: string;
  location_lat?: number;
  location_lng?: number;
}

interface FriendRequest {
  id: string;
  requester_id: string;
  addressee_id: string;
  status: string;
  created_at: string;
  requester_profile?: Profile;
  addressee_profile?: Profile;
}

interface Friendship {
  id: string;
  user1_id: string;
  user2_id: string;
  created_at: string;
  friend_profile?: Profile;
}

const EnhancedFriendsManager = () => {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Profile[]>([]);
  const [friendRequests, setFriendRequests] = useState<FriendRequest[]>([]);
  const [friends, setFriends] = useState<Friendship[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('friends');

  // Load initial data
  useEffect(() => {
    if (user) {
      loadFriends();
      loadFriendRequests();
    }
  }, [user]);

  const loadFriends = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('friends')
        .select(`
          id,
          user1_id,
          user2_id,
          created_at,
          user1_profile:profiles!friends_user1_id_fkey(id, full_name, username, profile_photo_url, bio),
          user2_profile:profiles!friends_user2_id_fkey(id, full_name, username, profile_photo_url, bio)
        `)
        .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`);

      if (error) throw error;

      const friendsWithProfiles = data?.map((friendship) => ({
        ...friendship,
        friend_profile: friendship.user1_id === user.id ? friendship.user2_profile : friendship.user1_profile
      })) || [];

      setFriends(friendsWithProfiles);
    } catch (error) {
      console.error('Error loading friends:', error);
    }
  };

  const loadFriendRequests = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('friend_requests')
        .select(`
          id,
          requester_id,
          addressee_id,
          status,
          created_at,
          requester_profile:profiles!friend_requests_requester_id_fkey(id, full_name, username, profile_photo_url, bio),
          addressee_profile:profiles!friend_requests_addressee_id_fkey(id, full_name, username, profile_photo_url, bio)
        `)
        .or(`requester_id.eq.${user.id},addressee_id.eq.${user.id}`)
        .eq('status', 'pending');

      if (error) throw error;

      setFriendRequests(data || []);
    } catch (error) {
      console.error('Error loading friend requests:', error);
    }
  };

  const searchUsers = async () => {
    if (!searchQuery.trim() || !user) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, username, profile_photo_url, bio')
        .or(`full_name.ilike.%${searchQuery}%,username.ilike.%${searchQuery}%`)
        .neq('id', user.id)
        .limit(10);

      if (error) throw error;

      setSearchResults(data || []);
    } catch (error) {
      console.error('Error searching users:', error);
      toast({
        title: "Search Error",
        description: "Failed to search for users",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const sendFriendRequest = async (targetUserId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('friend_requests')
        .insert({
          requester_id: user.id,
          addressee_id: targetUserId,
          status: 'pending'
        });

      if (error) throw error;

      toast({
        title: "Friend Request Sent",
        description: "Your friend request has been sent successfully!",
      });

      // Refresh search results
      await searchUsers();
      await loadFriendRequests();
    } catch (error) {
      console.error('Error sending friend request:', error);
      toast({
        title: "Error",
        description: "Failed to send friend request",
        variant: "destructive",
      });
    }
  };

  const acceptFriendRequest = async (requestId: string, requesterId: string) => {
    if (!user) return;

    try {
      // Update friend request status
      const { error: updateError } = await supabase
        .from('friend_requests')
        .update({ status: 'accepted' })
        .eq('id', requestId);

      if (updateError) throw updateError;

      // Create friendship record
      const { error: friendshipError } = await supabase
        .from('friends')
        .insert({
          user1_id: requesterId,
          user2_id: user.id
        });

      if (friendshipError) throw friendshipError;

      toast({
        title: "Friend Request Accepted",
        description: "You are now friends!",
      });

      // Refresh data
      await loadFriends();
      await loadFriendRequests();
    } catch (error) {
      console.error('Error accepting friend request:', error);
      toast({
        title: "Error",
        description: "Failed to accept friend request",
        variant: "destructive",
      });
    }
  };

  const rejectFriendRequest = async (requestId: string) => {
    try {
      const { error } = await supabase
        .from('friend_requests')
        .update({ status: 'rejected' })
        .eq('id', requestId);

      if (error) throw error;

      toast({
        title: "Friend Request Rejected",
        description: "The friend request has been rejected",
      });

      await loadFriendRequests();
    } catch (error) {
      console.error('Error rejecting friend request:', error);
      toast({
        title: "Error",
        description: "Failed to reject friend request",
        variant: "destructive",
      });
    }
  };

  const removeFriend = async (friendshipId: string) => {
    try {
      const { error } = await supabase
        .from('friends')
        .delete()
        .eq('id', friendshipId);

      if (error) throw error;

      toast({
        title: "Friend Removed",
        description: "Friend has been removed from your list",
      });

      await loadFriends();
    } catch (error) {
      console.error('Error removing friend:', error);
      toast({
        title: "Error",
        description: "Failed to remove friend",
        variant: "destructive",
      });
    }
  };

  const isAlreadyFriend = (profileId: string) => {
    return friends.some(f => f.friend_profile?.id === profileId);
  };

  const hasPendingRequest = (profileId: string) => {
    return friendRequests.some(req => 
      (req.requester_id === user?.id && req.addressee_id === profileId) ||
      (req.addressee_id === user?.id && req.requester_id === profileId)
    );
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  const incomingRequests = friendRequests.filter(req => req.addressee_id === user?.id);
  const outgoingRequests = friendRequests.filter(req => req.requester_id === user?.id);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Friends & Connections
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="friends">
                Friends ({friends.length})
              </TabsTrigger>
              <TabsTrigger value="requests">
                Requests ({incomingRequests.length})
              </TabsTrigger>
              <TabsTrigger value="sent">
                Sent ({outgoingRequests.length})
              </TabsTrigger>
              <TabsTrigger value="search">
                Find Friends
              </TabsTrigger>
            </TabsList>

            <TabsContent value="friends" className="space-y-4">
              <div className="grid gap-4">
                {friends.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No friends yet. Start connecting with other readers!</p>
                  </div>
                ) : (
                  friends.map((friendship) => (
                    <Card key={friendship.id} className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Avatar>
                            <AvatarImage src={friendship.friend_profile?.profile_photo_url} />
                            <AvatarFallback>
                              {getInitials(friendship.friend_profile?.full_name || 'U')}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <h4 className="font-medium">{friendship.friend_profile?.full_name}</h4>
                            <p className="text-sm text-gray-500">@{friendship.friend_profile?.username}</p>
                            {friendship.friend_profile?.bio && (
                              <p className="text-sm text-gray-600 mt-1">{friendship.friend_profile.bio}</p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button variant="outline" size="sm">
                            <MessageCircle className="h-4 w-4 mr-1" />
                            Message
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => removeFriend(friendship.id)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </Card>
                  ))
                )}
              </div>
            </TabsContent>

            <TabsContent value="requests" className="space-y-4">
              <div className="grid gap-4">
                {incomingRequests.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No pending friend requests</p>
                  </div>
                ) : (
                  incomingRequests.map((request) => (
                    <Card key={request.id} className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Avatar>
                            <AvatarImage src={request.requester_profile?.profile_photo_url} />
                            <AvatarFallback>
                              {getInitials(request.requester_profile?.full_name || 'U')}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <h4 className="font-medium">{request.requester_profile?.full_name}</h4>
                            <p className="text-sm text-gray-500">@{request.requester_profile?.username}</p>
                            <p className="text-xs text-gray-400">
                              {new Date(request.created_at).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button 
                            size="sm" 
                            onClick={() => acceptFriendRequest(request.id, request.requester_id)}
                          >
                            <Check className="h-4 w-4 mr-1" />
                            Accept
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => rejectFriendRequest(request.id)}
                          >
                            <X className="h-4 w-4 mr-1" />
                            Decline
                          </Button>
                        </div>
                      </div>
                    </Card>
                  ))
                )}
              </div>
            </TabsContent>

            <TabsContent value="sent" className="space-y-4">
              <div className="grid gap-4">
                {outgoingRequests.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No outgoing friend requests</p>
                  </div>
                ) : (
                  outgoingRequests.map((request) => (
                    <Card key={request.id} className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Avatar>
                            <AvatarImage src={request.addressee_profile?.profile_photo_url} />
                            <AvatarFallback>
                              {getInitials(request.addressee_profile?.full_name || 'U')}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <h4 className="font-medium">{request.addressee_profile?.full_name}</h4>
                            <p className="text-sm text-gray-500">@{request.addressee_profile?.username}</p>
                            <p className="text-xs text-gray-400">
                              Sent {new Date(request.created_at).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <Badge variant="secondary">Pending</Badge>
                      </div>
                    </Card>
                  ))
                )}
              </div>
            </TabsContent>

            <TabsContent value="search" className="space-y-4">
              <div className="flex gap-2">
                <Input
                  placeholder="Search by name or username..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && searchUsers()}
                />
                <Button onClick={searchUsers} disabled={loading}>
                  <Search className="h-4 w-4" />
                </Button>
              </div>

              <div className="grid gap-4">
                {searchResults.map((profile) => (
                  <Card key={profile.id} className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Avatar>
                          <AvatarImage src={profile.profile_photo_url} />
                          <AvatarFallback>{getInitials(profile.full_name || 'U')}</AvatarFallback>
                        </Avatar>
                        <div>
                          <h4 className="font-medium">{profile.full_name}</h4>
                          <p className="text-sm text-gray-500">@{profile.username}</p>
                          {profile.bio && (
                            <p className="text-sm text-gray-600 mt-1">{profile.bio}</p>
                          )}
                        </div>
                      </div>
                      <div>
                        {isAlreadyFriend(profile.id) ? (
                          <Badge variant="secondary">Friends</Badge>
                        ) : hasPendingRequest(profile.id) ? (
                          <Badge variant="outline">Request Sent</Badge>
                        ) : (
                          <Button 
                            size="sm" 
                            onClick={() => sendFriendRequest(profile.id)}
                          >
                            <UserPlus className="h-4 w-4 mr-1" />
                            Add Friend
                          </Button>
                        )}
                      </div>
                    </div>
                  </Card>
                ))}
              </div>

              {searchResults.length === 0 && searchQuery && !loading && (
                <div className="text-center py-8 text-gray-500">
                  <Search className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No users found matching your search</p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default EnhancedFriendsManager;
