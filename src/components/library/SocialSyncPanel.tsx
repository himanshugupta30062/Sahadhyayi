
import * as React from 'react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { 
  Users, 
  Facebook, 
  Instagram, 
  MessageCircle,
  CheckCircle,
  UserPlus,
  BookOpen,
  ExternalLink
} from 'lucide-react';

const SocialSyncPanel: React.FC = () => {
  const [syncStatus, setSyncStatus] = useState<{
    facebook: 'idle' | 'syncing' | 'synced';
    instagram: 'idle' | 'syncing' | 'synced';
    snapchat: 'idle' | 'syncing' | 'synced';
  }>({
    facebook: 'idle',
    instagram: 'idle',
    snapchat: 'idle'
  });

  const [syncProgress, setSyncProgress] = useState(0);

  // Mock data for discovered friends
  const mockFriends = [
    {
      name: 'Emma Thompson',
      avatar: '/placeholder.svg',
      platform: 'Facebook',
      commonBooks: ['The Seven Husbands of Evelyn Hugo', 'Where the Crawdads Sing'],
      currentlyReading: 'The Midnight Library',
      mutualFriends: 5
    },
    {
      name: 'Ryan Martinez',
      avatar: '/placeholder.svg',
      platform: 'Instagram',
      commonBooks: ['Atomic Habits', 'The 7 Habits of Highly Effective People'],
      currentlyReading: 'Think and Grow Rich',
      mutualFriends: 3
    },
    {
      name: 'Jessica Lee',
      avatar: '/placeholder.svg',
      platform: 'Snapchat',
      commonBooks: ['The Alchemist', 'Educated'],
      currentlyReading: 'Becoming',
      mutualFriends: 8
    }
  ];

  const [discoveredFriends, setDiscoveredFriends] = useState<typeof mockFriends>([]);
  const [selectedTab, setSelectedTab] = useState('sync');

  const handleSync = async (platform: 'facebook' | 'instagram' | 'snapchat') => {
    setSyncStatus(prev => ({ ...prev, [platform]: 'syncing' }));
    setSyncProgress(0);

    // Simulate syncing progress
    const interval = setInterval(() => {
      setSyncProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setSyncStatus(prev => ({ ...prev, [platform]: 'synced' }));
          
          // Add discovered friends
          if (discoveredFriends.length === 0) {
            setDiscoveredFriends(mockFriends);
            setSelectedTab('discovered');
          }
          
          return 100;
        }
        return prev + 10;
      });
    }, 200);
  };

  const connectFriend = (friendName: string) => {
    alert(`Sending reading friend request to ${friendName}!`);
  };

  const getSyncButtonText = (platform: string, status: string) => {
    switch (status) {
      case 'syncing': return 'Syncing...';
      case 'synced': return 'Synced ✓';
      default: return `Connect ${platform}`;
    }
  };

  const getSyncButtonVariant = (status: string) => {
    switch (status) {
      case 'synced': return 'default';
      case 'syncing': return 'outline';
      default: return 'outline';
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-lg font-semibold mb-2">Find Your Reading Friends</h3>
        <p className="text-gray-600 text-sm">
          Connect your social accounts to find friends who share your reading interests
        </p>
      </div>

      <Tabs value={selectedTab} onValueChange={setSelectedTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="sync">
            <Users className="w-4 h-4 mr-2" />
            Sync Contacts
          </TabsTrigger>
          <TabsTrigger value="discovered">
            <UserPlus className="w-4 h-4 mr-2" />
            Discovered ({discoveredFriends.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="sync" className="space-y-6">
          {/* Sync Progress */}
          {Object.values(syncStatus).some(status => status === 'syncing') && (
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                <span className="text-sm font-medium">Syncing contacts...</span>
              </div>
              <Progress value={syncProgress} className="w-full" />
            </div>
          )}

          {/* Social Platform Connections */}
          <div className="space-y-4">
            {/* Facebook */}
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
                  <Facebook className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h4 className="font-medium">Facebook</h4>
                  <p className="text-sm text-gray-600">Find friends who love books</p>
                </div>
              </div>
              <Button
                variant={getSyncButtonVariant(syncStatus.facebook)}
                onClick={() => handleSync('facebook')}
                disabled={syncStatus.facebook === 'syncing'}
                className={syncStatus.facebook === 'synced' ? 'bg-green-600 hover:bg-green-700' : ''}
              >
                {getSyncButtonText('Facebook', syncStatus.facebook)}
              </Button>
            </div>

            {/* Instagram */}
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-pink-600 rounded-full flex items-center justify-center">
                  <Instagram className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h4 className="font-medium">Instagram</h4>
                  <p className="text-sm text-gray-600">Discover bookstagrammers</p>
                </div>
              </div>
              <Button
                variant={getSyncButtonVariant(syncStatus.instagram)}
                onClick={() => handleSync('instagram')}
                disabled={syncStatus.instagram === 'syncing'}
                className={syncStatus.instagram === 'synced' ? 'bg-green-600 hover:bg-green-700' : ''}
              >
                {getSyncButtonText('Instagram', syncStatus.instagram)}
              </Button>
            </div>

            {/* Snapchat */}
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-yellow-400 rounded-full flex items-center justify-center">
                  <MessageCircle className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h4 className="font-medium">Snapchat</h4>
                  <p className="text-sm text-gray-600">Connect with snap readers</p>
                </div>
              </div>
              <Button
                variant={getSyncButtonVariant(syncStatus.snapchat)}
                onClick={() => handleSync('snapchat')}
                disabled={syncStatus.snapchat === 'syncing'}
                className={syncStatus.snapchat === 'synced' ? 'bg-green-600 hover:bg-green-700' : ''}
              >
                {getSyncButtonText('Snapchat', syncStatus.snapchat)}
              </Button>
            </div>
          </div>

          {/* Benefits */}
          <div className="bg-amber-50 p-4 rounded-lg">
            <h4 className="font-medium mb-2">Why sync your contacts?</h4>
            <ul className="text-sm text-gray-700 space-y-1">
              <li>• Find friends who share your reading interests</li>
              <li>• Get book recommendations from people you trust</li>
              <li>• Start reading groups with friends</li>
              <li>• See what your friends are currently reading</li>
            </ul>
          </div>
        </TabsContent>

        <TabsContent value="discovered" className="space-y-4">
          {discoveredFriends.length === 0 ? (
            <div className="text-center py-8">
              <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h4 className="font-medium text-gray-600 mb-2">No friends discovered yet</h4>
              <p className="text-gray-500 text-sm">
                Sync your social accounts to find reading friends
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {discoveredFriends.map((friend, index) => (
                <div key={index} className="border rounded-lg p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarImage src={friend.avatar} alt={friend.name} />
                        <AvatarFallback>{friend.name[0]}</AvatarFallback>
                      </Avatar>
                      <div>
                        <h4 className="font-medium">{friend.name}</h4>
                        <p className="text-sm text-gray-600">
                          From {friend.platform} • {friend.mutualFriends} mutual friends
                        </p>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => connectFriend(friend.name)}
                      className="bg-amber-600 hover:bg-amber-700"
                    >
                      <UserPlus className="w-4 h-4 mr-1" />
                      Connect
                    </Button>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <BookOpen className="w-4 h-4 text-gray-600" />
                      <span className="text-sm font-medium">Currently Reading:</span>
                      <span className="text-sm">{friend.currentlyReading}</span>
                    </div>
                    
                    <div>
                      <span className="text-sm font-medium">Books in Common:</span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {friend.commonBooks.map((book, bookIndex) => (
                          <Badge key={bookIndex} variant="secondary" className="text-xs">
                            {book}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SocialSyncPanel;
