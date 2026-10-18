import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Repeat2 } from 'lucide-react';
import { SocialPost, useToggleRepost } from '@/hooks/useSocialPosts';

interface Props {
  post: SocialPost;
  isOpen: boolean;
  onClose: () => void;
}

export const RepostDialog: React.FC<Props> = ({ post, isOpen, onClose }) => {
  const [comment, setComment] = useState('');
  const repost = useToggleRepost();

  // The original post (handle the case where 'post' is itself a repost)
  const original = post.reposted_post || post;

  const handleSubmit = async () => {
    await repost.mutateAsync({ post, isReposted: false, comment });
    setComment('');
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg bg-white dark:bg-[#111614] border-[#E8E2D9] dark:border-[#29332D] text-[#1C201D] dark:text-[#F3F0E7] shadow-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-serif font-bold text-base text-[#1C201D] dark:text-[#F3F0E7]">
            <Repeat2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" /> Repost
          </DialogTitle>
        </DialogHeader>

        <Textarea
          placeholder="Add a comment (optional)…"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          maxLength={500}
          aria-label="Add a comment to repost"
          className="min-h-[80px] bg-[#FAF7F2] dark:bg-[#0B0D0C] border-[#E8E2D9] dark:border-[#29332D] text-xs text-[#1C201D] dark:text-[#F3F0E7] placeholder:text-[#636B65]/70 dark:placeholder:text-[#A5ADA6]/70 rounded-xl focus-visible:ring-1 focus-visible:ring-[#1C442D] dark:focus-visible:ring-[#D5B16D]"
        />

        <div className="border border-[#E8E2D9] dark:border-[#29332D] rounded-xl p-3 bg-[#FAF7F2] dark:bg-[#16211A]/60">
          <div className="flex items-center gap-2 mb-2">
            <Avatar className="w-8 h-8 border border-[#E8E2D9] dark:border-[#29332D]">
              <AvatarImage src={original.profiles?.profile_photo_url} />
              <AvatarFallback className="bg-[#EBF2EC] text-[#1C442D] dark:bg-[#1C3024] dark:text-[#D5B16D] text-xs font-semibold">
                {original.profiles?.full_name?.charAt(0) || 'U'}
              </AvatarFallback>
            </Avatar>
            <div className="text-sm">
              <div className="font-medium text-[#1C201D] dark:text-[#F3F0E7]">{original.profiles?.full_name || 'Anonymous'}</div>
              {original.profiles?.username && (
                <div className="text-xs text-[#636B65] dark:text-[#A5ADA6]">@{original.profiles.username}</div>
              )}
            </div>
          </div>
          <p className="text-sm text-[#1C201D] dark:text-[#F3F0E7] line-clamp-4 whitespace-pre-wrap">{original.content}</p>
        </div>

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={onClose}
            className="border-[#E8E2D9] dark:border-[#29332D] bg-[#FAF7F2] dark:bg-[#111614] text-[#1C201D] dark:text-[#F3F0E7] hover:bg-[#F4EFEA] dark:hover:bg-[#1B241E] text-xs h-8 px-4"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={repost.isPending}
            className="bg-[#1C442D] hover:bg-[#153422] text-white dark:bg-[#D5B16D] dark:hover:bg-[#c49f5c] dark:text-[#0B0D0C] font-semibold text-xs h-8 px-4"
          >
            <Repeat2 className="w-4 h-4 mr-2" />
            Repost
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
