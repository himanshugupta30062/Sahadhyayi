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
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Repeat2 className="w-5 h-5 text-emerald-600" /> Repost
          </DialogTitle>
        </DialogHeader>

        <Textarea
          placeholder="Add a comment (optional)…"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          maxLength={500}
          className="min-h-[80px]"
        />

        <div className="border border-border rounded-xl p-3 bg-muted/30">
          <div className="flex items-center gap-2 mb-2">
            <Avatar className="w-8 h-8">
              <AvatarImage src={original.profiles?.profile_photo_url} />
              <AvatarFallback className="bg-gradient-button text-white text-xs">
                {original.profiles?.full_name?.charAt(0) || 'U'}
              </AvatarFallback>
            </Avatar>
            <div className="text-sm">
              <div className="font-medium text-foreground">{original.profiles?.full_name || 'Anonymous'}</div>
              {original.profiles?.username && (
                <div className="text-xs text-muted-foreground">@{original.profiles.username}</div>
              )}
            </div>
          </div>
          <p className="text-sm text-foreground line-clamp-4 whitespace-pre-wrap">{original.content}</p>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button
            onClick={handleSubmit}
            disabled={repost.isPending}
            className="bg-emerald-600 hover:bg-emerald-700 text-white"
          >
            <Repeat2 className="w-4 h-4 mr-2" />
            Repost
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
