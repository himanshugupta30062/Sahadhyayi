import React, { useState } from 'react';
import {
  LITERARY_REACTIONS,
  LiteraryReactionType,
  PostReactionSummary,
  useTogglePostReaction,
} from '@/hooks/useSocialPostReactions';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Heart } from 'lucide-react';
import { useAuth } from '@/contexts/authHelpers';

interface LiteraryReactionPickerProps {
  postId: string;
  reactionSummary?: PostReactionSummary;
  legacyLikesCount?: number;
  userLikedLegacy?: boolean;
  onLegacyLikeToggle?: () => void;
  isPendingLegacy?: boolean;
}

export const LiteraryReactionPicker: React.FC<LiteraryReactionPickerProps> = ({
  postId,
  reactionSummary,
  legacyLikesCount = 0,
  userLikedLegacy = false,
  onLegacyLikeToggle,
  isPendingLegacy = false,
}) => {
  const { user } = useAuth();
  const toggleReaction = useTogglePostReaction();
  const [open, setOpen] = useState(false);

  const activeReaction = reactionSummary?.user_reaction;
  const counts = reactionSummary?.counts || {};
  const totalReactions = (reactionSummary?.total ?? 0) > 0 ? reactionSummary?.total : legacyLikesCount;

  const handleSelectReaction = (type: LiteraryReactionType, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setOpen(false);
    if (!user) return;
    toggleReaction.mutate({ postId, reactionType: type });
  };

  const handlePrimaryClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user) return;

    if (activeReaction) {
      toggleReaction.mutate({ postId, reactionType: activeReaction });
    } else if (onLegacyLikeToggle) {
      onLegacyLikeToggle();
    } else {
      handleSelectReaction('loved', e);
    }
  };

  // Determine button icon and label based on active reaction
  const currentReactionMeta = activeReaction ? LITERARY_REACTIONS[activeReaction] : null;

  return (
    <div className="flex flex-col gap-1.5 flex-1">
      <div className="flex items-center gap-1">
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              onMouseEnter={() => setOpen(true)}
              onClick={handlePrimaryClick}
              disabled={toggleReaction.isPending || isPendingLegacy || !user}
              aria-label={
                currentReactionMeta
                  ? `Reacted ${currentReactionMeta.label}, ${totalReactions} reactions`
                  : userLikedLegacy
                  ? `Unlike post, ${totalReactions} likes`
                  : `Like post, ${totalReactions} likes`
              }
              className={`flex-1 rounded-lg gap-2 text-xs h-8 transition-colors ${
                currentReactionMeta
                  ? `${currentReactionMeta.activeColor} bg-rose-50/50 dark:bg-rose-950/10 hover:bg-rose-100/50`
                  : userLikedLegacy
                  ? 'text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/20'
                  : 'text-[#636B65] hover:text-[#1C201D] hover:bg-[#FAF7F2] dark:text-[#A5ADA6] dark:hover:text-[#F3F0E7] dark:hover:bg-[#1B241E]'
              }`}
            >
              {currentReactionMeta ? (
                <span className="text-sm scale-110 leading-none">{currentReactionMeta.emoji}</span>
              ) : (
                <Heart className={`w-4 h-4 ${userLikedLegacy ? 'fill-current' : ''}`} />
              )}
              <span className="font-medium text-xs">
                {currentReactionMeta?.label || totalReactions || 'React'}
              </span>
            </Button>
          </PopoverTrigger>

          <PopoverContent
            side="top"
            align="start"
            onMouseLeave={() => setOpen(false)}
            className="w-auto p-1.5 bg-white/95 dark:bg-[#18201B]/95 backdrop-blur-md border border-[#E8E2D9] dark:border-[#2C3830] shadow-lg rounded-2xl flex items-center gap-1 z-50 animate-in fade-in zoom-in-95 duration-150"
          >
            {(Object.keys(LITERARY_REACTIONS) as LiteraryReactionType[]).map((type) => {
              const meta = LITERARY_REACTIONS[type];
              const isSelected = activeReaction === type;

              return (
                <button
                  key={type}
                  type="button"
                  title={`${meta.label}: ${meta.description}`}
                  onClick={(e) => handleSelectReaction(type, e)}
                  className={`group relative flex flex-col items-center justify-center p-2 rounded-xl transition-all duration-200 hover:scale-125 hover:-translate-y-1 ${
                    isSelected
                      ? 'bg-amber-100 dark:bg-amber-950/40 ring-1 ring-[#D5B16D]'
                      : 'hover:bg-[#FAF7F2] dark:hover:bg-[#202B24]'
                  }`}
                >
                  <span className="text-xl leading-none transition-transform group-hover:scale-110">
                    {meta.emoji}
                  </span>
                  <span className="sr-only">{meta.label}</span>
                </button>
              );
            })}
          </PopoverContent>
        </Popover>
      </div>

      {/* Aggregate Reaction Pills (Misskey / Slack style) */}
      {Object.keys(counts).length > 0 && (
        <div className="flex flex-wrap gap-1 px-1">
          {(Object.entries(counts) as [LiteraryReactionType, number][])
            .filter(([_, cnt]) => cnt > 0)
            .map(([type, cnt]) => {
              const meta = LITERARY_REACTIONS[type];
              const isMyReaction = activeReaction === type;

              return (
                <button
                  key={type}
                  type="button"
                  onClick={(e) => handleSelectReaction(type, e)}
                  title={`${cnt} readers felt this was ${meta.label}`}
                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium transition-all ${
                    isMyReaction
                      ? 'bg-amber-100 text-amber-900 border border-[#D5B16D] dark:bg-amber-950/60 dark:text-amber-200'
                      : 'bg-[#F2ECE1]/60 text-[#474F49] hover:bg-[#EAE2D5] dark:bg-[#1F2922] dark:text-[#C5CDC6] dark:hover:bg-[#28352C] border border-transparent'
                  }`}
                >
                  <span className="text-xs">{meta.emoji}</span>
                  <span>{cnt}</span>
                </button>
              );
            })}
        </div>
      )}
    </div>
  );
};
