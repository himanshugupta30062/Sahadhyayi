import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { BitmojiCreator } from '@/components/social/BitmojiCreator';
import { useUserAvatar } from '@/hooks/useUserAvatar';
import { Pencil, Sparkles, UserRound } from 'lucide-react';

export function MapAvatarControl() {
  const { data: avatar, isLoading } = useUserAvatar();
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const hasCustomBitmoji = Boolean(avatar?.avatar_json && avatar.avatar_img_url);

  return (
    <>
      <div className="flex min-w-0 items-center gap-3 rounded-xl border border-[#E8E2D9] bg-white/80 p-3 dark:border-[#29332D] dark:bg-[#111614]/80">
        <div className="h-12 w-12 shrink-0 overflow-hidden rounded-full border-2 border-[#D5B16D] bg-[#E8EFE9] shadow-sm dark:bg-[#1C3024]">
          {avatar?.avatar_img_url ? (
            <img
              src={avatar.avatar_img_url}
              alt="Your reading Bitmoji"
              className="h-full w-full object-cover"
              loading="lazy"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-[#1C442D] dark:text-[#D5B16D]">
              <UserRound className="h-6 w-6" aria-hidden="true" />
            </div>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-[#1C201D] dark:text-[#F3F0E7]">
            {hasCustomBitmoji ? 'Your map Bitmoji' : avatar?.avatar_img_url ? 'Your profile photo on the map' : 'Create your map Bitmoji'}
          </p>
          <p className="mt-0.5 text-xs text-[#636B65] dark:text-[#A5ADA6]">
            {hasCustomBitmoji
              ? 'Your character appears on the reader map.'
              : avatar?.avatar_img_url
                ? 'Your profile photo is shown until you create a Bitmoji.'
                : 'Give friends a recognizable character on the map.'}
          </p>
        </div>
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={isLoading}
          onClick={() => setIsEditorOpen(true)}
          className="shrink-0 gap-1.5 border-[#D5B16D] text-[#1C442D] hover:bg-[#FAF7F2] dark:text-[#D5B16D]"
        >
          {hasCustomBitmoji ? <Pencil className="h-3.5 w-3.5" /> : <Sparkles className="h-3.5 w-3.5" />}
          {hasCustomBitmoji ? 'Edit' : 'Create Bitmoji'}
        </Button>
      </div>
      <BitmojiCreator
        isOpen={isEditorOpen}
        onClose={() => setIsEditorOpen(false)}
        onSave={() => setIsEditorOpen(false)}
        initialFeatures={avatar?.avatar_json ?? null}
      />
    </>
  );
}
