
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { MessageCircle, UserPlus, MapPin, Calendar } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client-universal';
import { formatDistanceToNow } from 'date-fns';

interface UserProfileModalProps {
  userId: string;
  isOpen: boolean;
  onClose: () => void;
}

export const UserProfileModal: React.FC<UserProfileModalProps> = ({
  userId,
  isOpen,
  onClose,
}) => {
  const { data: userProfile, isLoading } = useQuery({
    queryKey: ['user-profile', userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!userId,
  });

  const { data: userPosts } = useQuery({
    queryKey: ['user-posts', userId],
    queryFn: async () => {
      // This would fetch user's posts from your posts table
      // For now, return empty array as posts table structure isn't defined
      return [];
    },
    enabled: !!userId,
  });

  if (isLoading) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-lg">
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (!userProfile) return null;

  const getInitials = (name: string) => {
    return name?.split(' ').map(n => n[0]).join('').toUpperCase() || 'U';
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-center">User Profile</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Profile Header */}
          <div className="text-center space-y-4">
            <Avatar className="w-24 h-24 mx-auto">
              <AvatarImage src={userProfile.profile_photo_url} />
              <AvatarFallback className="text-2xl bg-gradient-to-r from-orange-400 to-amber-500 text-white">
                {getInitials(userProfile.full_name)}
              </AvatarFallback>
            </Avatar>
            
            <div>
              <h2 className="text-xl font-bold text-gray-900">{userProfile.full_name}</h2>
              <p className="text-gray-600">@{userProfile.username || 'user'}</p>
            </div>
            
            {userProfile.bio && (
              <p className="text-gray-700 text-sm max-w-md mx-auto">{userProfile.bio}</p>
            )}
          </div>

          {/* Profile Stats */}
          <div className="grid grid-cols-2 gap-4 py-4 border-y border-gray-200">
            <div className="text-center">
              <div className="text-lg font-bold text-gray-900">{userProfile.stories_read_count || 0}</div>
              <div className="text-sm text-gray-600">Stories Read</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-gray-900">{userProfile.stories_written_count || 0}</div>
              <div className="text-sm text-gray-600">Stories Written</div>
            </div>
          </div>

          {/* Additional Info */}
          <div className="space-y-3">
            {userProfile.last_seen && (
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Calendar className="w-4 h-4" />
                <span>Last seen {formatDistanceToNow(new Date(userProfile.last_seen), { addSuffix: true })}</span>
              </div>
            )}
            
            {userProfile.writing_frequency && (
              <div className="flex items-center gap-2">
                <Badge variant="secondary">{userProfile.writing_frequency}</Badge>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <Button className="flex-1 bg-orange-600 hover:bg-orange-700">
              <UserPlus className="w-4 h-4 mr-2" />
              Add Friend
            </Button>
            <Button variant="outline" className="flex-1 border-orange-300 text-orange-700 hover:bg-orange-50">
              <MessageCircle className="w-4 h-4 mr-2" />
              Message
            </Button>
          </div>

          {/* Recent Posts Section */}
          <div className="space-y-3">
            <h3 className="font-semibold text-gray-900">Recent Posts</h3>
            {userPosts && userPosts.length > 0 ? (
              <div className="space-y-2">
                {userPosts.slice(0, 3).map((post: any) => (
                  <div key={post.id} className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-700">{post.content}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500 text-center py-4">No posts yet</p>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
