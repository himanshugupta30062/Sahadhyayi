import React, { useState, useRef, useCallback } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Upload, Camera, Link as LinkIcon, Sparkles, Check, Loader2, RotateCcw, Image as ImageIcon } from 'lucide-react';
import { useUpdateUserAvatar } from '@/hooks/useUserAvatar';
import { useUpsertUserProfile } from '@/hooks/useUserProfile';
import { processAvatarImageFile } from '@/lib/avatarUtils';
import { toast } from 'sonner';

interface AvatarUploadDialogProps {
  isOpen: boolean;
  onClose: () => void;
  currentAvatarUrl?: string | null;
  onSuccess?: (avatarUrl: string) => void;
}

const PRESET_AVATARS = [
  {
    id: 'book-lover',
    label: 'Book Lover',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128"><circle cx="64" cy="64" r="64" fill="#1C442D"/><circle cx="64" cy="64" r="56" fill="#FAF7F2"/><path d="M40 78c8-6 16-6 24 0 8-6 16-6 24 0V44c-8-6-16-6-24 0-8-6-16-6-24 0z" fill="#D5B16D"/><path d="M64 44v34" stroke="#1C442D" stroke-width="2"/><circle cx="64" cy="34" r="10" fill="#D5B16D"/></svg>`,
  },
  {
    id: 'night-owl',
    label: 'Night Owl',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128"><circle cx="64" cy="64" r="64" fill="#0F172A"/><circle cx="64" cy="64" r="56" fill="#1E293B"/><ellipse cx="64" cy="68" rx="26" ry="32" fill="#D5B16D"/><circle cx="54" cy="58" r="9" fill="#FFF"/><circle cx="74" cy="58" r="9" fill="#FFF"/><circle cx="54" cy="58" r="5" fill="#0F172A"/><circle cx="74" cy="58" r="5" fill="#0F172A"/><polygon points="64,66 60,72 68,72" fill="#EA580C"/></svg>`,
  },
  {
    id: 'cozy-reader',
    label: 'Cozy Tea',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128"><circle cx="64" cy="64" r="64" fill="#78350F"/><circle cx="64" cy="64" r="56" fill="#FEF3C7"/><rect x="42" y="56" width="44" height="34" rx="8" fill="#B45309"/><path d="M86 64h6a5 5 0 0 1 0 10h-6" stroke="#B45309" stroke-width="3" fill="none"/><path d="M52 46c0-4 4-6 4-10m12 10c0-4 4-6 4-10m12 10c0-4 4-6 4-10" stroke="#D97706" stroke-width="2" stroke-linecap="round" fill="none"/></svg>`,
  },
  {
    id: 'scholar',
    label: 'Scholar',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128"><circle cx="64" cy="64" r="64" fill="#1E3A8A"/><circle cx="64" cy="64" r="56" fill="#EFF6FF"/><polygon points="64,36 32,52 64,68 96,52" fill="#1E3A8A"/><polygon points="44,58 44,76 64,88 84,76 84,58" fill="#3B82F6"/><circle cx="64" cy="60" r="16" fill="#FDE047"/><circle cx="58" cy="60" r="3" fill="#1E3A8A"/><circle cx="70" cy="60" r="3" fill="#1E3A8A"/></svg>`,
  },
  {
    id: 'star-reader',
    label: 'Star Reader',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128"><circle cx="64" cy="64" r="64" fill="#831843"/><circle cx="64" cy="64" r="56" fill="#FDF2F8"/><polygon points="64,28 73,48 95,50 78,65 83,86 64,74 45,86 50,65 33,50 55,48" fill="#F43F5E"/><circle cx="64" cy="56" r="14" fill="#FDE047"/><path d="M58 56a2 2 0 1 0 4 0 2 2 0 1 0-4 0m8 0a2 2 0 1 0 4 0 2 2 0 1 0-4 0" fill="#831843"/></svg>`,
  },
  {
    id: 'nature-reader',
    label: 'Eco Reader',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128"><circle cx="64" cy="64" r="64" fill="#064E3B"/><circle cx="64" cy="64" r="56" fill="#ECFDF5"/><path d="M64 32c-16 12-24 30-18 48 18 6 36-2 48-18-6-16-16-26-30-30z" fill="#10B981"/><path d="M46 80c10-10 24-18 38-24" stroke="#064E3B" stroke-width="2" fill="none"/><circle cx="64" cy="72" r="12" fill="#A7F3D0"/></svg>`,
  },
].map((p) => ({
  ...p,
  dataUrl: `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(p.svg)))}`,
}));

export const AvatarUploadDialog: React.FC<AvatarUploadDialogProps> = ({
  isOpen,
  onClose,
  currentAvatarUrl,
  onSuccess,
}) => {
  const [activeTab, setActiveTab] = useState<'upload' | 'url' | 'presets'>('upload');
  const [selectedAvatarUrl, setSelectedAvatarUrl] = useState<string>(currentAvatarUrl || '');
  const [urlInput, setUrlInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const updateAvatarMutation = useUpdateUserAvatar();
  const upsertProfileMutation = useUpsertUserProfile();

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setErrorMsg('Please select a valid image file (PNG, JPG, WebP, or SVG).');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setErrorMsg('Image size exceeds 10MB limit. Please select a smaller photo.');
      return;
    }

    setErrorMsg(null);
    setIsProcessing(true);
    try {
      const processedUrl = await processAvatarImageFile(file);
      setSelectedAvatarUrl(processedUrl);
      toast.success('Photo ready for preview!');
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Could not process photo.');
    } finally {
      setIsProcessing(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleApplyUrl = () => {
    const trimmed = urlInput.trim();
    if (!trimmed) {
      setErrorMsg('Please enter an image URL.');
      return;
    }

    if (!trimmed.startsWith('https://')) {
      setErrorMsg('Avatar URL must start with https:// for security.');
      return;
    }

    setErrorMsg(null);
    setSelectedAvatarUrl(trimmed);
  };

  const handleSave = async () => {
    if (!selectedAvatarUrl) {
      setErrorMsg('Please select or upload an avatar image first.');
      return;
    }

    setIsProcessing(true);
    setErrorMsg(null);
    try {
      // 1. Save to owner-scoped user avatar table/RPC
      await updateAvatarMutation.mutateAsync({
        avatar_json: {
          type: 'photo_avatar',
          updated_at: new Date().toISOString(),
        },
        avatar_img_url: selectedAvatarUrl,
      });

      // 2. Also sync to profile photo for broader app presence
      try {
        await upsertProfileMutation.mutateAsync({
          profile_photo_url: selectedAvatarUrl,
        });
      } catch (profileErr) {
        console.warn('Profile sync optional update note:', profileErr);
      }

      toast.success('Avatar updated! Your new avatar is now visible on the map.');
      onSuccess?.(selectedAvatarUrl);
      onClose();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Could not save avatar. Please try again.';
      setErrorMsg(msg);
      toast.error(msg);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="max-w-md rounded-2xl border-[#E5DED2] bg-white p-6 shadow-xl dark:border-[#29332D] dark:bg-[#111614] sm:max-w-lg">
        <DialogHeader className="text-left space-y-1">
          <DialogTitle className="flex items-center gap-2 text-lg font-bold text-[#1C201D] dark:text-[#F3F0E7]">
            <Camera className="h-5 w-5 text-[#1C442D] dark:text-[#D5B16D]" />
            Upload Map Avatar
          </DialogTitle>
          <DialogDescription className="text-xs text-[#636B65] dark:text-[#A5ADA6]">
            Choose a photo or preset to show as your live reading marker on the map.
          </DialogDescription>
        </DialogHeader>

        {/* Live Snap Map Marker Preview */}
        <div className="flex items-center justify-center gap-6 rounded-xl border border-[#E8E2D9] bg-[#FAF7F2] p-4 dark:border-[#29332D] dark:bg-[#0B0D0C]">
          <div className="text-center">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-[#636B65] dark:text-[#A5ADA6] mb-2">
              Map Marker Preview
            </p>
            <div className="inline-flex flex-col items-center">
              <div className="relative flex h-[52px] w-[52px] items-center justify-center overflow-hidden rounded-full border-[3px] border-[#D5B16D] bg-white p-[3px] shadow-[0_3px_12px_rgba(213,177,109,0.45),0_0_0_2px_rgba(255,255,255,0.96)]">
                {selectedAvatarUrl ? (
                  <img
                    src={selectedAvatarUrl}
                    alt="Preview"
                    className="h-full w-full rounded-full object-cover"
                    onError={() => {
                      setErrorMsg('Preview failed to load image.');
                    }}
                  />
                ) : (
                  <span className="flex h-full w-full items-center justify-center rounded-full bg-[#FBF7EE] text-sm font-bold text-[#8F681C]">
                    YOU
                  </span>
                )}
              </div>
              <div className="h-0 w-0 border-l-[5px] border-l-transparent border-r-[5px] border-r-transparent border-t-[6px] border-t-[#D5B16D] -mt-[2px] drop-shadow-sm" />
              <span className="mt-[1px] rounded-full border border-[#D5B16D] bg-[#1C442D] px-1.5 py-0.5 text-[8px] font-bold tracking-wider text-white shadow-sm">
                YOU
              </span>
            </div>
          </div>
          <div className="text-xs text-[#636B65] dark:text-[#A5ADA6] max-w-[200px]">
            <p className="font-medium text-[#1C201D] dark:text-[#F3F0E7]">
              {selectedAvatarUrl ? 'Looking sharp!' : 'No avatar selected yet'}
            </p>
            <p className="mt-1 text-[11px] leading-relaxed">
              This character pin appears above your location for friends and fellow book readers.
            </p>
          </div>
        </div>

        {errorMsg && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-2.5 text-xs text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-300" role="alert">
            {errorMsg}
          </div>
        )}

        <Tabs value={activeTab} onValueChange={(v) => { setActiveTab(v as any); setErrorMsg(null); }} className="w-full">
          <TabsList className="grid w-full grid-cols-3 rounded-xl bg-[#EFECE6] p-1 dark:bg-[#161D19] border border-[#DCD5C9] dark:border-[#29332D]">
            <TabsTrigger
              value="upload"
              onClick={() => { setActiveTab('upload'); setErrorMsg(null); }}
              className="text-xs font-semibold gap-1.5 rounded-lg data-[state=active]:bg-white dark:data-[state=active]:bg-[#1C442D]"
            >
              <Upload className="h-3.5 w-3.5" />
              Upload
            </TabsTrigger>
            <TabsTrigger
              value="url"
              onClick={() => { setActiveTab('url'); setErrorMsg(null); }}
              className="text-xs font-semibold gap-1.5 rounded-lg data-[state=active]:bg-white dark:data-[state=active]:bg-[#1C442D]"
            >
              <LinkIcon className="h-3.5 w-3.5" />
              Web URL
            </TabsTrigger>
            <TabsTrigger
              value="presets"
              onClick={() => { setActiveTab('presets'); setErrorMsg(null); }}
              className="text-xs font-semibold gap-1.5 rounded-lg data-[state=active]:bg-white dark:data-[state=active]:bg-[#1C442D]"
            >
              <Sparkles className="h-3.5 w-3.5" />
              Presets
            </TabsTrigger>
          </TabsList>

          {/* Upload Tab */}
          <TabsContent value="upload" className="space-y-3 pt-2">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp,image/svg+xml"
              className="hidden"
              onChange={handleFileChange}
              id="avatar-photo-file-input"
            />
            <div
              onClick={() => fileInputRef.current?.click()}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') fileInputRef.current?.click(); }}
              role="button"
              tabIndex={0}
              aria-label="Click to choose a photo file"
              className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-[#DCD5C9] p-6 text-center hover:border-[#1C442D] hover:bg-[#FAF7F2] dark:border-[#29332D] dark:hover:border-[#D5B16D] dark:hover:bg-[#1C3024] cursor-pointer transition-colors"
            >
              <div className="rounded-full bg-[#EBF2EC] p-3 text-[#1C442D] dark:bg-[#1C3024] dark:text-[#D5B16D] mb-2">
                <ImageIcon className="h-6 w-6" />
              </div>
              <p className="text-xs font-semibold text-[#1C201D] dark:text-[#F3F0E7]">
                Click or tap to choose a photo
              </p>
              <p className="mt-1 text-[11px] text-[#636B65] dark:text-[#A5ADA6]">
                PNG, JPG, WebP, or SVG (automatically cropped into a sharp circular avatar)
              </p>
            </div>
          </TabsContent>

          {/* URL Tab */}
          <TabsContent value="url" className="space-y-3 pt-2">
            <div className="space-y-1.5">
              <label htmlFor="avatar-url-input" className="text-xs font-medium text-[#1C201D] dark:text-[#F3F0E7]">
                Paste HTTPS Image URL
              </label>
              <div className="flex gap-2">
                <Input
                  id="avatar-url-input"
                  type="url"
                  placeholder="https://example.com/my-photo.jpg"
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  className="text-xs h-9 rounded-xl border-[#DCD5C9] dark:border-[#29332D]"
                />
                <Button
                  type="button"
                  size="sm"
                  onClick={handleApplyUrl}
                  className="h-9 shrink-0 rounded-xl bg-[#1C442D] text-white hover:bg-[#143221] dark:bg-[#D5B16D] dark:text-[#0B0D0C]"
                >
                  Preview
                </Button>
              </div>
            </div>
          </TabsContent>

          {/* Presets Tab */}
          <TabsContent value="presets" className="pt-2">
            <div className="grid grid-cols-3 gap-2.5">
              {PRESET_AVATARS.map((preset) => {
                const isSelected = selectedAvatarUrl === preset.dataUrl;
                return (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => { setSelectedAvatarUrl(preset.dataUrl); setErrorMsg(null); }}
                    className={`flex flex-col items-center gap-1.5 rounded-xl border p-2.5 text-center transition-all ${
                      isSelected
                        ? 'border-[#D5B16D] bg-amber-50/60 ring-2 ring-[#D5B16D] dark:border-[#D5B16D] dark:bg-[#1C3024]'
                        : 'border-[#E8E2D9] bg-white hover:border-[#1C442D] dark:border-[#29332D] dark:bg-[#111614]'
                    }`}
                  >
                    <div className="h-10 w-10 overflow-hidden rounded-full border border-gray-200">
                      <img src={preset.dataUrl} alt={preset.label} className="h-full w-full object-cover" />
                    </div>
                    <span className="text-[11px] font-semibold text-[#1C201D] dark:text-[#F3F0E7] truncate w-full">
                      {preset.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter className="flex flex-row items-center justify-end gap-2 pt-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onClose}
            disabled={isProcessing}
            className="rounded-xl text-xs h-9"
          >
            Cancel
          </Button>
          <Button
            type="button"
            size="sm"
            onClick={handleSave}
            disabled={isProcessing || !selectedAvatarUrl}
            className="rounded-xl text-xs h-9 bg-[#1C442D] text-white hover:bg-[#143221] dark:bg-[#D5B16D] dark:text-[#0B0D0C] font-semibold gap-1.5"
          >
            {isProcessing ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Saving…
              </>
            ) : (
              <>
                <Check className="h-3.5 w-3.5" />
                Save & Show on Map
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
