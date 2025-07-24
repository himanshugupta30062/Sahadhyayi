import { Facebook, Twitter } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface SocialShareProps {
  text: string;
  url?: string;
}

const SocialShare: React.FC<SocialShareProps> = ({ text, url }) => {
  const shareUrl = encodeURIComponent(url || window.location.href);
  const shareText = encodeURIComponent(text);

  const shareTwitter = () => {
    window.open(
      `https://twitter.com/intent/tweet?url=${shareUrl}&text=${shareText}`,
      '_blank',
      'noopener,noreferrer'
    );
  };

  const shareFacebook = () => {
    window.open(
      `https://www.facebook.com/sharer/sharer.php?u=${shareUrl}&quote=${shareText}`,
      '_blank',
      'noopener,noreferrer'
    );
  };

  return (
    <div className="flex gap-2">
      <Button variant="ghost" size="sm" onClick={shareTwitter} aria-label="Share on Twitter">
        <Twitter className="w-4 h-4" />
      </Button>
      <Button variant="ghost" size="sm" onClick={shareFacebook} aria-label="Share on Facebook">
        <Facebook className="w-4 h-4" />
      </Button>
    </div>
  );
};

export default SocialShare;
