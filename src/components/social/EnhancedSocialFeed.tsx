
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Search, UserPlus, MessageCircle, Users, Loader2, Phone } from 'lucide-react';
import { useUserSearch, useAllUsers } from '@/hooks/useUserSearch';
import { useFriends, useSendFriendRequest } from '@/hooks/useFriends';
import { toast } from '@/hooks/use-toast';
import { UserSearchResults } from './UserSearchResults';
import { FriendsList } from './FriendsList';
import { SocialPostsFeed } from './SocialPostsFeed';
import { WhatsAppTab } from './WhatsAppTab';

export const EnhancedSocialFeed = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('feed');

  // Use the improved search hook with debouncing
  const { data: searchResults = [], isLoading: isSearching, error: searchError } = useUserSearch(searchTerm);
  const { data: allUsers = [], isLoading: isLoadingUsers } = useAllUsers();
  const { data: friends = [], isLoading: isLoadingFriends } = useFriends();
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

  const displayUsers = searchTerm ? searchResults : allUsers;
  const isLoadingDisplayUsers = searchTerm ? isSearching : isLoadingUsers;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-xl font-bold text-gray-900">Social Community</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-4 mb-6">
              <TabsTrigger value="feed" className="flex items-center gap-2">
                <MessageCircle className="w-4 h-4" />
                Feed
              </TabsTrigger>
              <TabsTrigger value="discover" className="flex items-center gap-2">
                <Search className="w-4 h-4" />
                Discover
              </TabsTrigger>
              <TabsTrigger value="friends" className="flex items-center gap-2">
                <Users className="w-4 h-4" />
                Friends ({friends.length})
              </TabsTrigger>
              <TabsTrigger value="contacts" className="flex items-center gap-2">
                <Phone className="w-4 h-4" />
                Contacts
              </TabsTrigger>
            </TabsList>

            <TabsContent value="feed" className="space-y-4">
              <SocialPostsFeed />
            </TabsContent>

            <TabsContent value="discover" className="space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search for friends by name, username, or bio..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 h-12 bg-gray-50 border-2 border-gray-200 focus:border-orange-400"
                />
              </div>

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

              <div className="max-h-96 overflow-y-auto">
                <UserSearchResults
                  users={displayUsers}
                  isLoading={isLoadingDisplayUsers}
                  searchTerm={searchTerm}
                  onSendRequest={handleSendFriendRequest}
                />
              </div>
            </TabsContent>

            <TabsContent value="friends" className="space-y-4">
              <div className="max-h-96 overflow-y-auto">
                <FriendsList friends={friends} isLoading={isLoadingFriends} />
              </div>
            </TabsContent>

            <TabsContent value="contacts" className="space-y-4">
              <div className="max-h-96 overflow-y-auto">
                <WhatsAppTab />
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};
