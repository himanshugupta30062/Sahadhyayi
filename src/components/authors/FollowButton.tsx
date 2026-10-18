import { Button } from '@/components/ui/button';
import { UserPlus, UserMinus, Loader2 } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { useAuthorFollow } from '@/hooks/useAuthorFollow';
import { useAuth } from '@/contexts/authHelpers';

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
      <TooltipProvider delayDuration={200}>
        <Tooltip>
          <TooltipTrigger asChild>
            <span>
              <Button
                variant={variant}
                size={size}
                disabled
                aria-label="Follow author (sign in required)"
                className={cn(
                  'rounded-full bg-[#1C442D] text-white hover:bg-[#143221] dark:bg-[#D5B16D] dark:text-[#0B0D0C] dark:hover:bg-[#c49f5c]',
                  variant !== 'default' && ''
                )}
              >
                <UserPlus className="w-4 h-4" />
                {showText && <span className="ml-2">Follow</span>}
              </Button>
            </span>
          </TooltipTrigger>
          <TooltipContent>Sign in to follow authors</TooltipContent>
        </Tooltip>
      </TooltipProvider>
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
      <Button variant={variant} size={size} disabled aria-label="Loading follow status">
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
      aria-label={isFollowing ? 'Unfollow author' : 'Follow author'}
      className={cn(
        'rounded-full bg-[#1C442D] text-white hover:bg-[#143221] dark:bg-[#D5B16D] dark:text-[#0B0D0C] dark:hover:bg-[#c49f5c]',
        isFollowing && 'bg-transparent text-foreground hover:bg-muted border border-border dark:text-[#F3F0E7]',
        variant !== 'default' && ''
      )}
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