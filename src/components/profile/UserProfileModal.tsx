
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, MapPin, BookOpen, Star, UserPlus, CheckCircle, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { useAuth } from '@/contexts/authHelpers';
import { useFriends, useSendFriendRequest, useFriendRequests } from '@/hooks/useFriends';
import { toast } from 'sonner';

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
  const { user: currentUser } = useAuth();
  const { data: friends = [] } = useFriends();
  const { data: friendRequests = [] } = useFriendRequests();
  const sendFriendRequest = useSendFriendRequest();

  const isSelf = currentUser?.id === user.id;
  const isFriend = friends.some(f => f.friend_profile?.id === user.id);
  const hasPendingRequest = friendRequests.some(
    req => req.status === 'pending' && (req.requester_id === user.id || req.addressee_id === user.id)
  );

  const getUserInitials = (name?: string) => {
    if (name) return name.charAt(0).toUpperCase();
    return 'U';
  };

  const handleConnect = async () => {
    if (!currentUser) {
      toast.error('Please sign in to connect with readers');
      return;
    }
    try {
      await sendFriendRequest.mutateAsync({ addresseeId: user.id });
      toast.success(`Friend request sent to ${user.name || 'reader'}!`);
    } catch {
      toast.error('Failed to send friend request. Please try again.');
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto bg-card border-border text-foreground">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-foreground">Reader Profile</DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Explore reader interests, reading activity, and shared literary connections.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6 pt-2">
          {/* Header Section */}
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center space-x-4">
              <Avatar className="w-16 h-16 sm:w-20 sm:h-20 border border-border">
                <AvatarImage src={user.profile_picture_url} alt={user.name || 'Reader'} />
                <AvatarFallback className="bg-[#1C442D] text-white dark:bg-[#1C3024] dark:text-[#D5B16D] text-xl font-semibold">
                  {getUserInitials(user.name)}
                </AvatarFallback>
              </Avatar>
              
              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-foreground">
                  {user.name || user.username || 'Anonymous Reader'}
                </h2>
                {user.username && (
                  <p className="text-sm text-muted-foreground">@{user.username}</p>
                )}
              </div>
            </div>
            
            {/* Follow/Connect Button */}
            {!isSelf && (
              <div className="shrink-0">
                {isFriend ? (
                  <Badge variant="outline" className="border-emerald-500/40 text-emerald-600 dark:text-emerald-400 gap-1 py-1 px-2.5">
                    <CheckCircle className="w-3.5 h-3.5" /> Friends
                  </Badge>
                ) : hasPendingRequest ? (
                  <Badge variant="secondary" className="gap-1 py-1 px-2.5 bg-amber-500/10 text-amber-600 dark:text-amber-400">
                    <Clock className="w-3.5 h-3.5" /> Pending
                  </Badge>
                ) : (
                  <Button
                    size="sm"
                    onClick={handleConnect}
                    disabled={sendFriendRequest.isPending}
                    aria-label={`Send friend request to ${user.name || 'reader'}`}
                    className="bg-[#1C442D] hover:bg-[#143221] text-white dark:bg-[#D5B16D] dark:hover:bg-[#c49f5c] dark:text-[#0B0D0C] font-semibold text-xs h-8 px-3 rounded-xl gap-1.5"
                  >
                    <UserPlus className="w-3.5 h-3.5" /> Connect
                  </Button>
                )}
              </div>
            )}
          </div>

          {/* Bio Section */}
          {user.bio && (
            <div>
              <h3 className="font-semibold text-sm text-foreground mb-1">About</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{user.bio}</p>
            </div>
          )}

          {/* Genuine Stats Section */}
          {Boolean((user.stories_read_count || 0) > 0 || (user.stories_written_count || 0) > 0) && (
            <div className="grid grid-cols-2 gap-3">
              {(user.stories_read_count || 0) > 0 && (
                <div className="text-center p-3 bg-muted/40 border border-border/50 rounded-xl">
                  <BookOpen className="w-5 h-5 mx-auto mb-1 text-[hsl(var(--brand-primary))]" />
                  <div className="font-bold text-base text-foreground">{user.stories_read_count}</div>
                  <div className="text-xs text-muted-foreground">Stories Read</div>
                </div>
              )}
              
              {(user.stories_written_count || 0) > 0 && (
                <div className="text-center p-3 bg-muted/40 border border-border/50 rounded-xl">
                  <Star className="w-5 h-5 mx-auto mb-1 text-amber-500" />
                  <div className="font-bold text-base text-foreground">{user.stories_written_count}</div>
                  <div className="text-xs text-muted-foreground">Stories Written</div>
                </div>
              )}
            </div>
          )}

          {/* Info Section */}
          <div className="space-y-2 text-xs text-muted-foreground">
            {user.location && (
              <div className="flex items-center space-x-2">
                <MapPin className="w-3.5 h-3.5" />
                <span>{user.location}</span>
              </div>
            )}
            
            {user.joined_at && (
              <div className="flex items-center space-x-2">
                <Calendar className="w-3.5 h-3.5" />
                <span>Joined {format(new Date(user.joined_at), 'MMMM yyyy')}</span>
              </div>
            )}
          </div>

          {/* Life Tags */}
          {user.life_tags && user.life_tags.length > 0 && (
            <div>
              <h3 className="font-semibold text-sm text-foreground mb-2">Reading & Life Interests</h3>
              <div className="flex flex-wrap gap-1.5">
                {user.life_tags.map((tag, index) => (
                  <Badge key={index} variant="secondary" className="text-xs py-0.5 px-2 bg-muted/60 text-foreground">
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Social Links */}
          {user.social_links && Object.keys(user.social_links).length > 0 && (
            <div>
              <h3 className="font-semibold text-sm text-foreground mb-2">Links</h3>
              <div className="flex flex-wrap gap-2">
                {Object.entries(user.social_links).map(([platform, url]) => (
                  url && (
                    <Button
                      key={platform}
                      variant="outline"
                      size="sm"
                      onClick={() => window.open(url, '_blank', 'noopener,noreferrer')}
                      className="capitalize text-xs h-7 border-border"
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
