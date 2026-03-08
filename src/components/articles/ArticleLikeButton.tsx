import React, { useState } from 'react';
import { Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useArticleLikes, useToggleArticleLike } from '@/hooks/useArticleSocial';
import { useAuth } from '@/contexts/authHelpers';
import { cn } from '@/lib/utils';

interface Props {
  articleId: string;
}

const ArticleLikeButton: React.FC<Props> = ({ articleId }) => {
  const { user } = useAuth();
  const { count, hasLiked } = useArticleLikes(articleId);
  const toggleLike = useToggleArticleLike();
  const [optimistic, setOptimistic] = useState<boolean | null>(null);

  const liked = optimistic ?? hasLiked;
  const displayCount = count + (optimistic === null ? 0 : optimistic && !hasLiked ? 1 : !optimistic && hasLiked ? -1 : 0);

  const handleClick = () => {
    if (!user) return;
    setOptimistic(!liked);
    toggleLike.mutate(
      { articleId, hasLiked: liked },
      { onSettled: () => setOptimistic(null) }
    );
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleClick}
      disabled={!user}
      className={cn(
        'gap-2 transition-colors',
        liked && 'text-red-500 hover:text-red-600'
      )}
    >
      <Heart className={cn('w-5 h-5', liked && 'fill-current')} />
      <span className="text-sm font-medium">{displayCount}</span>
    </Button>
  );
};

export default ArticleLikeButton;
