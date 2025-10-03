
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/authHelpers';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { MessageCircle, UserPlus, Users } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client-universal';
import { toast } from 'sonner';

interface DiscoveredFriend {
  id: string;
  platform_friend_name: string | null;
  platform_friend_avatar: string | null;
  mutual_connections: number;
  common_interests: string[];
  is_invited: boolean;
}

export const WhatsAppDiscovery = () => {
  const { user } = useAuth();
  const [discoveredFriends, setDiscoveredFriends] = useState<DiscoveredFriend[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (user) {
      fetchDiscoveredFriends();
    }
  }, [user]);

  const fetchDiscoveredFriends = async () => {
    try {
      const { data, error } = await supabase
        .from('discovered_friends')
        .select('*')
        .eq('user_id', user?.id)
        .eq('platform', 'whatsapp')
        .order('mutual_connections', { ascending: false });

      if (error) throw error;
      setDiscoveredFriends(data || []);
    } catch (error) {
      console.error('Error fetching discovered friends:', error);
    }
  };

  const discoverFriends = async () => {
    setIsLoading(true);
    try {
      // Simulate discovering friends based on WhatsApp contacts
      const mockDiscoveredFriends = [
        {
          platform_friend_name: 'Alice Johnson',
          platform_friend_avatar: null,
          mutual_connections: 3,
          common_interests: ['Fiction', 'Mystery', 'Biography']
        },
        {
          platform_friend_name: 'Mike Chen',
          platform_friend_avatar: null,
          mutual_connections: 1,
          common_interests: ['Technology', 'Science Fiction']
        },
        {
          platform_friend_name: 'Sarah Wilson',
          platform_friend_avatar: null,
          mutual_connections: 2,
          common_interests: ['Romance', 'Historical Fiction']
        }
      ];

      for (const friend of mockDiscoveredFriends) {
        await supabase
          .from('discovered_friends')
          .upsert({
            user_id: user?.id,
            platform: 'whatsapp',
            platform_friend_id: `whatsapp_${(friend.platform_friend_name || 'user').replace(/\s+/g, '_').toLowerCase()}`,
            platform_friend_name: friend.platform_friend_name,
            platform_friend_avatar: friend.platform_friend_avatar,
            mutual_connections: friend.mutual_connections,
            common_interests: friend.common_interests,
            is_invited: false
          });
      }

      await fetchDiscoveredFriends();
      toast.success('Friends discovered successfully!');
    } catch (error) {
      console.error('Error discovering friends:', error);
      toast.error('Failed to discover friends');
    } finally {
      setIsLoading(false);
    }
  };

  const sendInvite = async (friend: DiscoveredFriend) => {
    try {
      // Mark as invited
      await supabase
        .from('discovered_friends')
        .update({ is_invited: true })
        .eq('id', friend.id);

      // Get user's invite message
      const { data: profile } = await supabase
        .from('user_profile')
        .select('whatsapp_invite_message')
        .eq('id', user?.id)
        .single();

      const inviteMessage = profile?.whatsapp_invite_message || 
        'Join me on Sahadhyayi - the ultimate reading community! Download the app and discover amazing books together.';

      // In a real app, this would send via WhatsApp API
      console.log(`Sending invite to ${friend.platform_friend_name}: ${inviteMessage}`);
      
      toast.success(`Invitation sent to ${friend.platform_friend_name}`);
      await fetchDiscoveredFriends();
    } catch (error) {
      console.error('Error sending invite:', error);
      toast.error('Failed to send invitation');
    }
  };

  const getInitials = (name: string | null) => {
    if (!name) return '?';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="w-5 h-5" />
          Discover WhatsApp Friends
        </CardTitle>
        <CardDescription>
          Find friends from your WhatsApp contacts who share similar reading interests
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button 
          onClick={discoverFriends} 
          disabled={isLoading}
          className="w-full"
        >
          {isLoading ? 'Discovering...' : 'Discover Friends'}
        </Button>

        {discoveredFriends.length > 0 && (
          <div className="space-y-3">
            <h4 className="font-medium text-sm text-muted-foreground">
              Found {discoveredFriends.length} potential friends
            </h4>
            {discoveredFriends.map((friend) => (
              <div key={friend.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  <Avatar>
                    <AvatarImage src={friend.platform_friend_avatar || undefined} />
                    <AvatarFallback>
                      {getInitials(friend.platform_friend_name)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">
                      {friend.platform_friend_name || 'Unknown User'}
                    </p>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <span>{friend.mutual_connections} mutual connections</span>
                      {friend.common_interests.length > 0 && (
                        <>
                          <span>•</span>
                          <span>{friend.common_interests.length} shared interests</span>
                        </>
                      )}
                    </div>
                    {friend.common_interests.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1">
                        {friend.common_interests.slice(0, 3).map((interest) => (
                          <Badge key={interest} variant="outline" className="text-xs">
                            {interest}
                          </Badge>
                        ))}
                        {friend.common_interests.length > 3 && (
                          <Badge variant="outline" className="text-xs">
                            +{friend.common_interests.length - 3} more
                          </Badge>
                        )}
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex gap-2">
                  {friend.is_invited ? (
                    <Badge variant="secondary">Invited</Badge>
                  ) : (
                    <>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => sendInvite(friend)}
                        className="flex items-center gap-1"
                      >
                        <UserPlus className="w-4 h-4" />
                        Invite
                      </Button>
                      <Button
                        size="sm"
                        className="flex items-center gap-1"
                      >
                        <MessageCircle className="w-4 h-4" />
                        Message
                      </Button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {discoveredFriends.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <Users className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>No friends discovered yet</p>
            <p className="text-sm">Click "Discover Friends" to find WhatsApp contacts</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
