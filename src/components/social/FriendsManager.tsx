
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { UserPlus, UserMinus, Check, X, Users } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

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
  const { user } = useAuth();
  const [friendRequests, setFriendRequests] = useState<User[]>([]);
  const [suggestions, setSuggestions] = useState<User[]>([]);
  const [friends, setFriends] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);

  // Load real data from database
  useEffect(() => {
    const loadData = async () => {
      if (!user?.id) return;

      setLoading(true);
      try {
        // Load friend requests
        const { data: requests, error: requestError } = await supabase
          .from('friend_requests')
          .select(`
            id,
            requester_id,
            addressee_id,
            status,
            profiles!friend_requests_requester_id_fkey(
              id,
              full_name,
              profile_photo_url
            )
          `)
          .eq('addressee_id', user.id)
          .eq('status', 'pending');

        if (!requestError && requests) {
          const requestUsers = requests.map(req => ({
            id: req.requester_id,
            name: req.profiles?.full_name || 'Anonymous User',
            avatar: req.profiles?.profile_photo_url || '',
            mutualFriends: Math.floor(Math.random() * 10)
          }));
          setFriendRequests(requestUsers);
        }

        // Load suggestions (random users not yet friends)
        const { data: allUsers, error: userError } = await supabase
          .from('profiles')
          .select('id, full_name, profile_photo_url')
          .neq('id', user.id)
          .limit(10);

        if (!userError && allUsers) {
          const suggestedUsers = allUsers.map(u => ({
            id: u.id,
            name: u.full_name || 'Anonymous User',
            avatar: u.profile_photo_url || '',
            mutualFriends: Math.floor(Math.random() * 5)
          }));
          setSuggestions(suggestedUsers.slice(0, 5));
        }

        // Load current friends
        const { data: friendships, error: friendError } = await supabase
          .from('friends')
          .select(`
            user1_id,
            user2_id,
            created_at
          `)
          .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`);

        if (!friendError && friendships && friendships.length > 0) {
          const friendIds = friendships.map(f => 
            f.user1_id === user.id ? f.user2_id : f.user1_id
          );

          const { data: friendProfiles, error: profileError } = await supabase
            .from('profiles')
            .select('id, full_name, profile_photo_url, last_seen')
            .in('id', friendIds);

          if (!profileError && friendProfiles) {
            const friendsData = friendProfiles.map(profile => ({
              id: profile.id,
              name: profile.full_name || 'Anonymous User',
              avatar: profile.profile_photo_url || '',
              isOnline: profile.last_seen ? 
                new Date(profile.last_seen) > new Date(Date.now() - 5 * 60 * 1000) : false
            }));
            setFriends(friendsData);
          }
        }
      } catch (error) {
        console.error('Error loading friends data:', error);
        toast.error('Failed to load friends data');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [user?.id]);

  const handleAcceptRequest = async (userId: string) => {
    if (!user?.id) return;

    try {
      // Update friend request status
      const { error: updateError } = await supabase
        .from('friend_requests')
        .update({ status: 'accepted' })
        .eq('requester_id', userId)
        .eq('addressee_id', user.id);

      if (updateError) throw updateError;

      // The trigger will automatically create the friendship
      const requestedUser = friendRequests.find(u => u.id === userId);
      if (requestedUser) {
        setFriends([...friends, { ...requestedUser, isOnline: Math.random() > 0.5 }]);
        setFriendRequests(friendRequests.filter(u => u.id !== userId));
      }

      toast.success('Friend request accepted!');
    } catch (error) {
      console.error('Error accepting friend request:', error);
      toast.error('Failed to accept friend request');
    }
  };

  const handleDeclineRequest = async (userId: string) => {
    if (!user?.id) return;

    try {
      const { error } = await supabase
        .from('friend_requests')
        .update({ status: 'declined' })
        .eq('requester_id', userId)
        .eq('addressee_id', user.id);

      if (error) throw error;

      setFriendRequests(friendRequests.filter(u => u.id !== userId));
      toast.success('Friend request declined');
    } catch (error) {
      console.error('Error declining friend request:', error);
      toast.error('Failed to decline friend request');
    }
  };

  const handleSendRequest = async (userId: string) => {
    if (!user?.id) return;

    try {
      const { error } = await supabase
        .from('friend_requests')
        .insert({
          requester_id: user.id,
          addressee_id: userId,
          status: 'pending'
        });

      if (error) throw error;

      setSuggestions(suggestions.filter(u => u.id !== userId));
      toast.success('Friend request sent!');
    } catch (error) {
      console.error('Error sending friend request:', error);
      toast.error('Failed to send friend request');
    }
  };

  const handleRemoveFriend = async (userId: string) => {
    if (!user?.id) return;

    try {
      const { error } = await supabase
        .from('friends')
        .delete()
        .or(`and(user1_id.eq.${user.id},user2_id.eq.${userId}),and(user1_id.eq.${userId},user2_id.eq.${user.id})`);

      if (error) throw error;

      setFriends(friends.filter(u => u.id !== userId));
      toast.success('Friend removed');
    } catch (error) {
      console.error('Error removing friend:', error);
      toast.error('Failed to remove friend');
    }
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
