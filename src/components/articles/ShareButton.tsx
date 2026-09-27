import React, { useState } from 'react';
import {
  Share2,
  Link as LinkIcon,
  Twitter,
  Facebook,
  Linkedin,
  Instagram,
  Check,
  Sparkles,
  Loader2,
  BookOpen,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/authHelpers';
import { useNavigate } from 'react-router-dom';

type Platform = 'twitter' | 'facebook' | 'linkedin' | 'instagram' | 'sahadhyayi';

interface Props {
  url: string;
  title: string;
  subtitle?: string;
  content?: string;
  coverImageUrl?: string;
  variant?: 'icon' | 'full';
  className?: string;
}

const ShareButton: React.FC<Props> = ({
  url,
  title,
  subtitle,
  content,
  coverImageUrl,
  variant = 'icon',
  className,
}) => {
  const [copied, setCopied] = useState(false);
  const [generating, setGenerating] = useState<Platform | null>(null);
  const { user } = useAuth();
  const navigate = useNavigate();

  // Always use the production domain for share URLs so external crawlers
  // (Facebook, LinkedIn, X) can fetch the page — preview/localhost URLs
  // are not publicly reachable and cause "link can't be shared" errors.
  const PROD_ORIGIN = 'https://sahadhyayi.com';
  const fullUrl = url.startsWith('http') ? url : `${PROD_ORIGIN}${url}`;
  const encodedUrl = encodeURIComponent(fullUrl);
  const encodedTitle = encodeURIComponent(title);

  const openShareWindow = (shareUrl: string) => {
    window.open(shareUrl, '_blank', 'noopener,noreferrer,width=600,height=600');
  };

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

  const generateCaption = async (platform: Platform): Promise<string | null> => {
    try {
      // The edge function only supports external platforms; map internal "sahadhyayi" to facebook-style copy.
      const apiPlatform = platform === 'sahadhyayi' ? 'facebook' : platform;
      const { data, error } = await supabase.functions.invoke('generate-share-caption', {
        body: { platform: apiPlatform, title, subtitle, content, url: fullUrl },
      });
      if (error) throw error;
      const caption = (data as any)?.caption?.trim();
      if (!caption) throw new Error('No caption returned');
      return caption;
    } catch (err: any) {
      const msg = err?.message || 'Failed to generate caption';
      toast({ title: 'AI caption failed', description: msg, variant: 'destructive' });
      return null;
    }
  };

  const shareWithAI = async (platform: Platform) => {
    setGenerating(platform);
    try {
      const caption = await generateCaption(platform);
      if (!caption) return;

      if (platform === 'twitter') {
        // Tweet text + URL appended automatically via &url
        openShareWindow(
          `https://twitter.com/intent/tweet?text=${encodeURIComponent(caption)}&url=${encodedUrl}`,
        );
      } else if (platform === 'facebook') {
        // Facebook ignores `quote` now and rejects non-public URLs.
        // Copy caption + URL, then open the sharer with just the URL.
        try {
          await navigator.clipboard.writeText(`${caption}\n\n${fullUrl}`);
          toast({
            title: 'Caption copied!',
            description: 'Paste it in the Facebook share dialog.',
          });
        } catch {
          // ignore
        }
        openShareWindow(`https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`);
      } else if (platform === 'linkedin') {
        // LinkedIn no longer supports prefilled text; copy caption + open dialog
        try {
          await navigator.clipboard.writeText(`${caption}\n\n${fullUrl}`);
          toast({
            title: 'Caption copied!',
            description: 'Paste it into your LinkedIn post.',
          });
        } catch {
          // ignore
        }
        openShareWindow(`https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`);
      } else if (platform === 'instagram') {
        // Instagram has no web share intent — copy and open Instagram
        try {
          await navigator.clipboard.writeText(`${caption}\n\n${fullUrl}`);
          toast({
            title: 'Caption copied!',
            description: 'Open Instagram and paste it into your post or story.',
          });
        } catch {
          toast({ title: 'Failed to copy caption', variant: 'destructive' });
        }
        window.open('https://www.instagram.com/', '_blank', 'noopener,noreferrer');
      } else if (platform === 'sahadhyayi') {
        if (!user?.id) {
          toast({
            title: 'Sign in required',
            description: 'Please sign in to share on Sahadhyayi.',
            variant: 'destructive',
          });
          return;
        }
        const postContent = `📖 ${title}\n\n${caption}\n\n🔗 Read here: ${fullUrl}`;
        const { error } = await supabase.from('posts').insert({
          user_id: user.id,
          content: postContent,
          image_url: coverImageUrl ?? null,
        });
        if (error) {
          toast({
            title: 'Failed to share',
            description: error.message,
            variant: 'destructive',
          });
          return;
        }
        toast({
          title: 'Shared on Sahadhyayi! 🎉',
          description: 'Your article post is now live on the social feed.',
        });
        setTimeout(() => navigate('/social'), 800);
      }
    } finally {
      setGenerating(null);
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
      <DropdownMenuContent align="end" className="w-64">
        {typeof navigator !== 'undefined' && 'share' in navigator && (
          <DropdownMenuItem onClick={handleNativeShare} className="cursor-pointer">
            <Share2 className="w-4 h-4 mr-2" /> Share...
          </DropdownMenuItem>
        )}
        <DropdownMenuItem onClick={copyLink} className="cursor-pointer">
          {copied ? (
            <Check className="w-4 h-4 mr-2 text-green-600" />
          ) : (
            <LinkIcon className="w-4 h-4 mr-2" />
          )}
          {copied ? 'Copied!' : 'Copy link'}
        </DropdownMenuItem>

        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => shareWithAI('sahadhyayi')}
          disabled={generating !== null}
          className="cursor-pointer bg-[hsl(var(--brand-primary))]/5 focus:bg-[hsl(var(--brand-primary))]/10"
        >
          {generating === 'sahadhyayi' ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin text-[hsl(var(--brand-primary))]" />
          ) : (
            <BookOpen className="w-4 h-4 mr-2 text-[hsl(var(--brand-primary))]" />
          )}
          <span className="font-semibold text-[hsl(var(--brand-primary))]">
            Post on Sahadhyayi
          </span>
        </DropdownMenuItem>

        <DropdownMenuSeparator />
        <DropdownMenuLabel className="flex items-center gap-1.5 text-xs font-semibold text-[hsl(var(--brand-primary))]">
          <Sparkles className="w-3.5 h-3.5" /> Share with AI caption
        </DropdownMenuLabel>

        <DropdownMenuItem
          onClick={() => shareWithAI('twitter')}
          disabled={generating !== null}
          className="cursor-pointer"
        >
          {generating === 'twitter' ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <Twitter className="w-4 h-4 mr-2" />
          )}
          X / Twitter
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => shareWithAI('facebook')}
          disabled={generating !== null}
          className="cursor-pointer"
        >
          {generating === 'facebook' ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <Facebook className="w-4 h-4 mr-2" />
          )}
          Facebook
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => shareWithAI('linkedin')}
          disabled={generating !== null}
          className="cursor-pointer"
        >
          {generating === 'linkedin' ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <Linkedin className="w-4 h-4 mr-2" />
          )}
          LinkedIn
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => shareWithAI('instagram')}
          disabled={generating !== null}
          className="cursor-pointer"
        >
          {generating === 'instagram' ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <Instagram className="w-4 h-4 mr-2" />
          )}
          Instagram
        </DropdownMenuItem>

        <DropdownMenuSeparator />
        <DropdownMenuLabel className="text-xs font-medium text-muted-foreground">
          Quick share (link only)
        </DropdownMenuLabel>
        <DropdownMenuItem asChild className="cursor-pointer">
          <a
            href={`https://twitter.com/intent/tweet?text=${encodedTitle}&url=${encodedUrl}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            <Twitter className="w-4 h-4 mr-2" /> X / Twitter
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
