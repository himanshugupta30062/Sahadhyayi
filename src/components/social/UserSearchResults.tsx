
import React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { UserPlus, MessageCircle, Users } from 'lucide-react';
import { SearchUser } from '@/hooks/useUserSearch';

interface UserSearchResultsProps {
  users: SearchUser[];
  isLoading: boolean;
  searchTerm: string;
  onSendRequest: (userId: string, userName: string) => void;
}

export const UserSearchResults: React.FC<UserSearchResultsProps> = ({
  users,
  isLoading,
  searchTerm,
  onSendRequest
}) => {
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
            <div className="w-12 h-8 bg-gray-300 rounded"></div>
          </div>
        ))}
      </div>
    );
  }

  if (searchTerm && users.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <Users className="w-12 h-12 mx-auto mb-2 opacity-50" />
        <p className="text-sm">No users found matching "{searchTerm}"</p>
        <p className="text-xs mt-1">Try searching with different keywords</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {users.map((user) => (
        <div key={user.id} className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg hover:shadow-sm transition-shadow">
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
              onClick={() => onSendRequest(user.id, user.full_name || 'User')}
              className="border-orange-300 text-orange-700 hover:bg-orange-50"
            >
              <UserPlus className="w-4 h-4 mr-1" />
              Add
            </Button>
            <Button size="sm" variant="ghost">
              <MessageCircle className="w-4 h-4" />
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
};
