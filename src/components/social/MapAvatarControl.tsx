import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { BitmojiCreator } from '@/components/social/BitmojiCreator';
import { AvatarUploadDialog } from '@/components/social/AvatarUploadDialog';
import { useUserAvatar } from '@/hooks/useUserAvatar';
import { Camera, Pencil, Sparkles, UserRound } from 'lucide-react';

export function MapAvatarControl() {
  const { data: avatar, isLoading } = useUserAvatar();
  const [isBitmojiOpen, setIsBitmojiOpen] = useState(false);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const hasCustomBitmoji = Boolean(avatar?.avatar_json && avatar.avatar_img_url);

  return (
    <>
      <div className="flex flex-col sm:flex-row min-w-0 sm:items-center justify-between gap-3 rounded-xl border border-[#E8E2D9] bg-white/80 p-3.5 dark:border-[#29332D] dark:bg-[#111614]/80 shadow-xs">
        <div className="flex min-w-0 items-center gap-3">
          <button
            type="button"
            onClick={() => setIsUploadOpen(true)}
            title="Click to change or upload avatar"
            className="group relative h-12 w-12 shrink-0 overflow-hidden rounded-full border-2 border-[#D5B16D] bg-[#E8EFE9] shadow-sm transition-transform hover:scale-105 dark:bg-[#1C3024] cursor-pointer"
          >
            {avatar?.avatar_img_url ? (
              <img
                src={avatar.avatar_img_url}
                alt={hasCustomBitmoji ? 'Your reading Bitmoji' : 'Your profile photo'}
                className="h-full w-full object-cover"
                loading="lazy"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-[#1C442D] dark:text-[#D5B16D]">
                <UserRound className="h-6 w-6" aria-hidden="true" />
              </div>
            )}
            <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
              <Camera className="h-4 w-4 text-white" />
            </div>
          </button>
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
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={isLoading}
            onClick={() => setIsUploadOpen(true)}
            className="gap-1.5 text-xs rounded-xl border-[#DCD5C9] hover:bg-[#FAF7F2] dark:border-[#29332D]"
          >
            <Camera className="h-3.5 w-3.5 text-[#1C442D] dark:text-[#D5B16D]" />
            Upload Photo
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={isLoading}
            onClick={() => setIsBitmojiOpen(true)}
            className="shrink-0 gap-1.5 border-[#D5B16D] text-[#1C442D] hover:bg-[#FAF7F2] dark:text-[#D5B16D]"
          >
            {hasCustomBitmoji ? <Pencil className="h-3.5 w-3.5" /> : <Sparkles className="h-3.5 w-3.5" />}
            {hasCustomBitmoji ? 'Edit' : 'Create Bitmoji'}
          </Button>
        </div>
      </div>

      <AvatarUploadDialog
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        currentAvatarUrl={avatar?.avatar_img_url}
        onSuccess={() => setIsUploadOpen(false)}
      />

      <BitmojiCreator
        isOpen={isBitmojiOpen}
        onClose={() => setIsBitmojiOpen(false)}
        onSave={() => setIsBitmojiOpen(false)}
        initialFeatures={avatar?.avatar_json ?? null}
      />
    </>
  );
}
