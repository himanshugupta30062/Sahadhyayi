
import React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { MessageCircle, Users } from 'lucide-react';
import { Friend } from '@/hooks/useFriends';

interface FriendsListProps {
  friends: Friend[];
  isLoading: boolean;
}

export const FriendsList: React.FC<FriendsListProps> = ({ friends, isLoading }) => {
  const getInitials = (name: string) => {
    return name?.split(' ').map(n => n[0]).join('').toUpperCase() || '?';
  };

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg animate-pulse">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gray-300 rounded-full"></div>
              <div className="space-y-1">
                <div className="w-24 h-4 bg-gray-300 rounded"></div>
                <div className="w-16 h-3 bg-gray-300 rounded"></div>
              </div>
            </div>
            <div className="w-16 h-8 bg-gray-300 rounded"></div>
          </div>
        ))}
      </div>
    );
  }

  if (friends.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <Users className="w-12 h-12 mx-auto mb-2 opacity-50" />
        <p className="text-sm">No friends yet</p>
        <p className="text-xs mt-1">Search for users to send friend requests</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {friends.map((friendship) => (
        <div key={friendship.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
          <div className="flex items-center gap-3">
            <div className="relative">
              <Avatar className="w-10 h-10">
                <AvatarImage src={friendship.friend_profile?.profile_photo_url || ''} />
                <AvatarFallback className="bg-gradient-to-r from-green-400 to-blue-500 text-white">
                  {getInitials(friendship.friend_profile?.full_name || '')}
                </AvatarFallback>
              </Avatar>
              {friendship.friend_profile?.last_seen && (
                <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
              )}
            </div>
            <div>
              <p className="font-medium text-gray-900">
                {friendship.friend_profile?.full_name || 'Unknown User'}
              </p>
              <p className="text-sm text-gray-500">
                @{friendship.friend_profile?.username || 'username'}
              </p>
              {friendship.friend_profile?.bio && (
                <p className="text-xs text-gray-400 mt-1 truncate max-w-48">
                  {friendship.friend_profile.bio}
                </p>
              )}
            </div>
          </div>
          <Button size="sm" variant="outline" className="border-blue-300 text-blue-700 hover:bg-blue-50">
            <MessageCircle className="w-4 h-4 mr-2" />
            Message
          </Button>
        </div>
      ))}
    </div>
  );
};
