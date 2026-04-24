import React, { useState } from 'react';
import { Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useArticleLikes, useToggleArticleLike } from '@/hooks/useArticleSocial';
import { useAuth } from '@/contexts/authHelpers';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface Props {
  articleId: string;
  variant?: 'compact' | 'full';
}

const ArticleLikeButton: React.FC<Props> = ({ articleId, variant = 'full' }) => {
  const { user } = useAuth();
  const { count, hasLiked } = useArticleLikes(articleId);
  const toggleLike = useToggleArticleLike();
  const [optimistic, setOptimistic] = useState<boolean | null>(null);
  const [bursting, setBursting] = useState(false);

  const liked = optimistic ?? hasLiked;
  const displayCount =
    count + (optimistic === null ? 0 : optimistic && !hasLiked ? 1 : !optimistic && hasLiked ? -1 : 0);

  const handleClick = () => {
    if (!user) return;
    const next = !liked;
    setOptimistic(next);
    if (next) {
      setBursting(true);
      setTimeout(() => setBursting(false), 500);
    }
    toggleLike.mutate(
      { articleId, hasLiked: liked },
      { onSettled: () => setOptimistic(null) }
    );
  };

  const button = (
    <Button
      variant="ghost"
      size={variant === 'compact' ? 'sm' : 'sm'}
      onClick={handleClick}
      disabled={!user}
      className={cn(
        'gap-2 transition-colors group',
        liked && 'text-red-500 hover:text-red-600'
      )}
      aria-label={liked ? 'Unlike article' : 'Like article'}
    >
      <span className="relative inline-flex">
        <Heart
          className={cn(
            'w-5 h-5 transition-transform duration-200',
            liked && 'fill-current',
            bursting && 'scale-150'
          )}
        />
        {bursting && (
          <span className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <span className="w-5 h-5 rounded-full bg-red-400/40 animate-ping" />
          </span>
        )}
      </span>
      <span className="text-sm font-medium tabular-nums">{displayCount}</span>
    </Button>
  );

  if (!user) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>{button}</TooltipTrigger>
          <TooltipContent>Sign in to like</TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return button;
};

export default ArticleLikeButton;

