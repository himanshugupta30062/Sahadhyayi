
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Facebook, Instagram, Twitter, MessageCircle, Camera } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  postContent: string;
  postId: string;
  quoteText?: string | null;
  quoteAuthor?: string | null;
  quoteSource?: string | null;
  quoteContext?: string | null;
}

export const ShareModal = ({ isOpen, onClose, postContent, postId, quoteText, quoteAuthor, quoteSource, quoteContext }: ShareModalProps) => {
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://www.sahadhyayi.com';
  const currentUrl = postId ? `${baseUrl}/social?post=${encodeURIComponent(postId)}` : `${baseUrl}/social`;
  const quoteAttribution = [quoteAuthor?.trim(), quoteSource?.trim()].filter(Boolean).join(' — ');
  const shareText = quoteText
    ? ['“' + quoteText + '”', quoteAttribution, quoteContext?.trim(), 'Shared on Sahadhyayi'].filter(Boolean).join('\n\n')
    : `Check out this post on Sahadhyayi: "${postContent.slice(0, 100)}${postContent.length > 100 ? '...' : ''}"`;

  const copyToClipboard = async (message: string) => {
    try {
      await navigator.clipboard.writeText(shareText + '\n\n' + currentUrl);
      toast({ title: 'Copied!', description: message });
    } catch {
      toast({ title: 'Could not copy', description: 'Your browser did not allow clipboard access. Please copy the link below.', variant: 'destructive' });
    }
  };

  const shareOptions = [
    {
      name: 'Facebook',
      icon: Facebook,
      color: 'bg-blue-600 hover:bg-blue-700',
      action: () => {
        const url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(currentUrl)}&quote=${encodeURIComponent(shareText)}`;
        window.open(url, '_blank', 'noopener,noreferrer,width=600,height=400');
      }
    },
    {
      name: 'Twitter',
      icon: Twitter,
      color: 'bg-black hover:bg-zinc-800 border border-zinc-700',
      action: () => {
        const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(currentUrl)}`;
        window.open(url, '_blank', 'noopener,noreferrer,width=600,height=400');
      }
    },
    {
      name: 'WhatsApp',
      icon: MessageCircle,
      color: 'bg-emerald-600 hover:bg-emerald-700',
      action: () => {
        const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(shareText + ' ' + currentUrl)}`;
        window.open(url, '_blank', 'noopener,noreferrer');
      }
    },
    {
      name: 'Instagram',
      icon: Instagram,
      color: 'bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600',
      action: () => copyToClipboard('Content copied! You can now paste it on Instagram.')
    },
    {
      name: 'Snapchat',
      icon: Camera,
      color: 'bg-amber-400 hover:bg-amber-500 text-black',
      action: () => copyToClipboard('Content copied! You can now share it on Snapchat.')
    }
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md bg-white dark:bg-[#111614] border-[#E8E2D9] dark:border-[#29332D] text-[#1C201D] dark:text-[#F3F0E7] shadow-xl">
        <DialogHeader>
          <DialogTitle className="text-center font-serif font-bold text-base text-[#1C201D] dark:text-[#F3F0E7]">Share this post</DialogTitle>
        </DialogHeader>
        
        <div className="grid grid-cols-2 gap-3 py-4">
          {shareOptions.map((option) => {
            const IconComponent = option.icon;
            return (
              <Button
                key={option.name}
                variant="outline"
                className={`${option.color} text-white border-0 flex flex-col items-center space-y-2 h-auto py-3.5 rounded-xl shadow-xs`}
                onClick={() => {
                  option.action();
                  onClose();
                }}
              >
                <IconComponent className="w-5 h-5" />
                <span className="text-xs font-medium">{option.name}</span>
              </Button>
            );
          })}
        </div>

        <div className="border-t border-[#E8E2D9] dark:border-[#29332D] pt-4">
          <div className="flex items-center space-x-2">
            <input
              type="text"
              value={currentUrl}
              readOnly
              className="flex-1 px-3 py-2 text-xs bg-[#FAF7F2] dark:bg-[#0B0D0C] border border-[#E8E2D9] dark:border-[#29332D] rounded-xl text-[#1C201D] dark:text-[#F3F0E7] focus:outline-none focus:ring-1 focus:ring-[#1C442D] dark:focus:ring-[#D5B16D]"
            />
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                void navigator.clipboard.writeText(currentUrl).then(() => toast({ title: 'Link copied!', description: 'URL copied to clipboard.' })).catch(() => toast({ title: 'Could not copy link', description: 'Please select and copy the link manually.', variant: 'destructive' }));
              }}
              className="border-[#E8E2D9] dark:border-[#29332D] bg-[#1C442D] dark:bg-[#1C3024] text-white dark:text-[#D5B16D] hover:bg-[#153422] dark:hover:bg-[#253d2f] text-xs h-9 px-3 rounded-xl"
            >
              Copy Link
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
