
import * as React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, MapPin, BookOpen, Users, Star } from 'lucide-react';
import { format } from 'date-fns';

interface UserProfile {
  id: string;
  name?: string;
  username?: string;
  email?: string;
  bio?: string;
  profile_picture_url?: string;
  location?: string;
  joined_at?: string;
  stories_written_count?: number;
  stories_read_count?: number;
  life_tags?: string[];
  social_links?: Record<string, string>;
}

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserProfile;
}

const UserProfileModal: React.FC<UserProfileModalProps> = ({ isOpen, onClose, user }) => {
  const getUserInitials = (name?: string, email?: string) => {
    if (name) return name.charAt(0).toUpperCase();
    if (email) return email.charAt(0).toUpperCase();
    return 'U';
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>User Profile</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Header Section */}
          <div className="flex items-start space-x-4">
            <Avatar className="w-20 h-20">
              <AvatarImage src={user.profile_picture_url} />
              <AvatarFallback className="bg-gradient-to-br from-amber-400 to-orange-500 text-white text-2xl">
                {getUserInitials(user.name, user.email)}
              </AvatarFallback>
            </Avatar>
            
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-gray-900">
                {user.name || user.username || 'Anonymous User'}
              </h2>
              {user.username && user.name && (
                <p className="text-gray-600">@{user.username}</p>
              )}
              {user.email && (
                <p className="text-sm text-gray-500">{user.email}</p>
              )}
            </div>
            
            <Button size="sm" className="bg-amber-600 hover:bg-amber-700">
              Follow
            </Button>
          </div>

          {/* Bio Section */}
          {user.bio && (
            <div>
              <h3 className="font-semibold mb-2">About</h3>
              <p className="text-gray-700">{user.bio}</p>
            </div>
          )}

          {/* Stats Section */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-3 bg-blue-50 rounded-lg">
              <BookOpen className="w-6 h-6 mx-auto mb-1 text-blue-600" />
              <div className="font-bold text-lg text-blue-800">{user.stories_read_count || 0}</div>
              <div className="text-xs text-blue-600">Stories Read</div>
            </div>
            
            <div className="text-center p-3 bg-green-50 rounded-lg">
              <Star className="w-6 h-6 mx-auto mb-1 text-green-600" />
              <div className="font-bold text-lg text-green-800">{user.stories_written_count || 0}</div>
              <div className="text-xs text-green-600">Stories Written</div>
            </div>
            
            <div className="text-center p-3 bg-purple-50 rounded-lg">
              <Users className="w-6 h-6 mx-auto mb-1 text-purple-600" />
              <div className="font-bold text-lg text-purple-800">0</div>
              <div className="text-xs text-purple-600">Followers</div>
            </div>
            
            <div className="text-center p-3 bg-amber-50 rounded-lg">
              <Users className="w-6 h-6 mx-auto mb-1 text-amber-600" />
              <div className="font-bold text-lg text-amber-800">0</div>
              <div className="text-xs text-amber-600">Following</div>
            </div>
          </div>

          {/* Info Section */}
          <div className="space-y-2">
            {user.location && (
              <div className="flex items-center space-x-2 text-gray-600">
                <MapPin className="w-4 h-4" />
                <span>{user.location}</span>
              </div>
            )}
            
            {user.joined_at && (
              <div className="flex items-center space-x-2 text-gray-600">
                <Calendar className="w-4 h-4" />
                <span>Joined {format(new Date(user.joined_at), 'MMMM yyyy')}</span>
              </div>
            )}
          </div>

          {/* Life Tags */}
          {user.life_tags && user.life_tags.length > 0 && (
            <div>
              <h3 className="font-semibold mb-2">Life Phases</h3>
              <div className="flex flex-wrap gap-2">
                {user.life_tags.map((tag, index) => (
                  <Badge key={index} variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Social Links */}
          {user.social_links && Object.keys(user.social_links).length > 0 && (
            <div>
              <h3 className="font-semibold mb-2">Social Links</h3>
              <div className="flex flex-wrap gap-2">
                {Object.entries(user.social_links).map(([platform, url]) => (
                  url && (
                    <Button
                      key={platform}
                      variant="outline"
                      size="sm"
                      onClick={() => window.open(url, '_blank')}
                      className="capitalize"
                    >
                      {platform}
                    </Button>
                  )
                ))}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default UserProfileModal;
