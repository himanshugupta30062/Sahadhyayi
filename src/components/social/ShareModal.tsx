
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Facebook, Instagram, Twitter, MessageCircle, Camera } from 'lucide-react';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  postContent: string;
  postId: string;
}

export const ShareModal = ({ isOpen, onClose, postContent, postId }: ShareModalProps) => {
  const currentUrl = window.location.origin + '/social';
  const shareText = `Check out this post on Sahadhyayi: "${postContent.slice(0, 100)}${postContent.length > 100 ? '...' : ''}"`;

  const shareOptions = [
    {
      name: 'Facebook',
      icon: Facebook,
      color: 'bg-blue-600 hover:bg-blue-700',
      action: () => {
        const url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(currentUrl)}&quote=${encodeURIComponent(shareText)}`;
        window.open(url, '_blank', 'width=600,height=400');
      }
    },
    {
      name: 'Twitter',
      icon: Twitter,
      color: 'bg-black hover:bg-gray-800',
      action: () => {
        const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(currentUrl)}`;
        window.open(url, '_blank', 'width=600,height=400');
      }
    },
    {
      name: 'WhatsApp',
      icon: MessageCircle,
      color: 'bg-green-600 hover:bg-green-700',
      action: () => {
        const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(shareText + ' ' + currentUrl)}`;
        window.open(url, '_blank');
      }
    },
    {
      name: 'Instagram',
      icon: Instagram,
      color: 'bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600',
      action: () => {
        // Instagram doesn't have a direct sharing API, so we'll copy to clipboard
        navigator.clipboard.writeText(shareText + ' ' + currentUrl);
        alert('Content copied to clipboard! You can now paste it on Instagram.');
      }
    },
    {
      name: 'Snapchat',
      icon: Camera,
      color: 'bg-yellow-400 hover:bg-yellow-500',
      action: () => {
        // Snapchat doesn't have a direct sharing API, so we'll copy to clipboard
        navigator.clipboard.writeText(shareText + ' ' + currentUrl);
        alert('Content copied to clipboard! You can now share it on Snapchat.');
      }
    }
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center">Share this post</DialogTitle>
        </DialogHeader>
        
        <div className="grid grid-cols-2 gap-3 py-4">
          {shareOptions.map((option) => {
            const IconComponent = option.icon;
            return (
              <Button
                key={option.name}
                variant="outline"
                className={`${option.color} text-white border-0 flex flex-col items-center space-y-2 h-auto py-4`}
                onClick={() => {
                  option.action();
                  onClose();
                }}
              >
                <IconComponent className="w-6 h-6" />
                <span className="text-sm">{option.name}</span>
              </Button>
            );
          })}
        </div>

        <div className="border-t pt-4">
          <div className="flex items-center space-x-2">
            <input
              type="text"
              value={currentUrl}
              readOnly
              className="flex-1 px-3 py-2 text-sm bg-gray-50 border rounded-md"
            />
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                navigator.clipboard.writeText(currentUrl);
                alert('Link copied to clipboard!');
              }}
            >
              Copy Link
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
