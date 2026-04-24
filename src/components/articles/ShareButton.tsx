import React, { useState } from 'react';
import { Share2, Link as LinkIcon, Twitter, Facebook, Linkedin, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface Props {
  url: string;
  title: string;
  variant?: 'icon' | 'full';
  className?: string;
}

const ShareButton: React.FC<Props> = ({ url, title, variant = 'icon', className }) => {
  const [copied, setCopied] = useState(false);

  const fullUrl = url.startsWith('http')
    ? url
    : `${typeof window !== 'undefined' ? window.location.origin : ''}${url}`;
  const encodedUrl = encodeURIComponent(fullUrl);
  const encodedTitle = encodeURIComponent(title);

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title, url: fullUrl });
      } catch {
        // user dismissed
      }
    }
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(fullUrl);
      setCopied(true);
      toast({ title: 'Link copied to clipboard' });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast({ title: 'Failed to copy link', variant: 'destructive' });
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size={variant === 'icon' ? 'icon' : 'sm'}
          className={cn('transition-colors', variant === 'full' && 'gap-2', className)}
          aria-label="Share article"
        >
          <Share2 className="w-5 h-5" />
          {variant === 'full' && <span className="text-sm font-medium">Share</span>}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        {typeof navigator !== 'undefined' && 'share' in navigator && (
          <DropdownMenuItem onClick={handleNativeShare} className="cursor-pointer">
            <Share2 className="w-4 h-4 mr-2" /> Share...
          </DropdownMenuItem>
        )}
        <DropdownMenuItem onClick={copyLink} className="cursor-pointer">
          {copied ? <Check className="w-4 h-4 mr-2 text-green-600" /> : <LinkIcon className="w-4 h-4 mr-2" />}
          {copied ? 'Copied!' : 'Copy link'}
        </DropdownMenuItem>
        <DropdownMenuItem asChild className="cursor-pointer">
          <a
            href={`https://twitter.com/intent/tweet?text=${encodedTitle}&url=${encodedUrl}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            <Twitter className="w-4 h-4 mr-2" /> Twitter / X
          </a>
        </DropdownMenuItem>
        <DropdownMenuItem asChild className="cursor-pointer">
          <a
            href={`https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            <Facebook className="w-4 h-4 mr-2" /> Facebook
          </a>
        </DropdownMenuItem>
        <DropdownMenuItem asChild className="cursor-pointer">
          <a
            href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            <Linkedin className="w-4 h-4 mr-2" /> LinkedIn
          </a>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default ShareButton;
