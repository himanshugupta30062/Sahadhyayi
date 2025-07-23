import { Button } from '@/components/ui/button';
import { UserPlus, UserMinus, Loader2 } from 'lucide-react';
import { useAuthorFollow } from '@/hooks/useAuthorFollow';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface FollowButtonProps {
  authorId: string;
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'sm' | 'default' | 'lg';
  showText?: boolean;
}

export const FollowButton = ({ 
  authorId, 
  variant = 'default', 
  size = 'default',
  showText = true 
}: FollowButtonProps) => {
  const { user } = useAuth();
  const { 
    isFollowing, 
    isLoading, 
    follow, 
    unfollow, 
    isFollowLoading, 
    isUnfollowLoading 
  } = useAuthorFollow(authorId);

  if (!user) {
    return (
      <Button
        variant={variant}
        size={size}
        onClick={() => toast.error('Please sign in to follow authors')}
      >
        <UserPlus className="w-4 h-4" />
        {showText && <span className="ml-2">Follow</span>}
      </Button>
    );
  }

  const isProcessing = isFollowLoading || isUnfollowLoading;

  const handleClick = () => {
    if (isFollowing) {
      unfollow();
    } else {
      follow();
    }
  };

  if (isLoading) {
    return (
      <Button variant={variant} size={size} disabled>
        <Loader2 className="w-4 h-4 animate-spin" />
        {showText && <span className="ml-2">Loading...</span>}
      </Button>
    );
  }

  return (
    <Button
      variant={isFollowing ? 'outline' : variant}
      size={size}
      onClick={handleClick}
      disabled={isProcessing}
    >
      {isProcessing ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : isFollowing ? (
        <UserMinus className="w-4 h-4" />
      ) : (
        <UserPlus className="w-4 h-4" />
      )}
      {showText && (
        <span className="ml-2">
          {isProcessing ? 'Processing...' : isFollowing ? 'Following' : 'Follow'}
        </span>
      )}
    </Button>
  );
};