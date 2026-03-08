import React from 'react';
import { UserPlus, UserCheck, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuthorFollowStatus, useToggleFollowAuthor } from '@/hooks/useArticleSocial';
import { useAuth } from '@/contexts/authHelpers';

interface Props {
  authorUserId: string;
  authorName?: string;
}

const FollowAuthorButton: React.FC<Props> = ({ authorUserId, authorName }) => {
  const { user } = useAuth();
  const { followersCount, isFollowing } = useAuthorFollowStatus(authorUserId);
  const toggleFollow = useToggleFollowAuthor();

  // Don't show follow button for own profile
  if (user?.id === authorUserId) return null;

  return (
    <div className="flex items-center gap-3">
      <Button
        variant={isFollowing ? 'secondary' : 'default'}
        size="sm"
        onClick={() => toggleFollow.mutate({ authorUserId, isFollowing })}
        disabled={!user || toggleFollow.isPending}
        className={
          isFollowing
            ? 'border-border text-muted-foreground hover:text-destructive hover:border-destructive'
            : 'bg-[hsl(var(--brand-primary))] hover:bg-[hsl(var(--brand-primary)/0.9)] text-white'
        }
      >
        {isFollowing ? (
          <>
            <UserCheck className="w-4 h-4 mr-1" />
            Following
          </>
        ) : (
          <>
            <UserPlus className="w-4 h-4 mr-1" />
            Follow
          </>
        )}
      </Button>
      <span className="text-xs text-muted-foreground flex items-center gap-1">
        <Users className="w-3 h-3" />
        {followersCount}
      </span>
    </div>
  );
};

export default FollowAuthorButton;
