import React from 'react';
import { Bookmark } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useIsBookmarked, useToggleBookmark } from '@/hooks/useArticleBookmarks';
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
  variant?: 'icon' | 'full';
  className?: string;
}

const BookmarkButton: React.FC<Props> = ({ articleId, variant = 'icon', className }) => {
  const { user } = useAuth();
  const { data: isBookmarked = false } = useIsBookmarked(articleId);
  const toggle = useToggleBookmark();

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) return;
    toggle.mutate({ articleId, isBookmarked });
  };

  const button = (
    <Button
      variant="ghost"
      size={variant === 'icon' ? 'icon' : 'sm'}
      onClick={handleClick}
      disabled={!user || toggle.isPending}
      className={cn(
        'transition-colors',
        isBookmarked && 'text-[hsl(var(--brand-primary))]',
        variant === 'full' && 'gap-2',
        className
      )}
      aria-label={isBookmarked ? 'Remove bookmark' : 'Save article'}
    >
      <Bookmark
        className={cn(
          'w-5 h-5 transition-transform',
          isBookmarked && 'fill-current scale-110'
        )}
      />
      {variant === 'full' && (
        <span className="text-sm font-medium">{isBookmarked ? 'Saved' : 'Save'}</span>
      )}
    </Button>
  );

  if (!user) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>{button}</TooltipTrigger>
          <TooltipContent>Sign in to save articles</TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return button;
};

export default BookmarkButton;
