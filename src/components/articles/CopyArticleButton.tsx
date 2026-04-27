import React, { useState } from 'react';
import { Copy, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { toast } from 'sonner';

interface CopyArticleButtonProps {
  title: string;
  subtitle?: string | null;
  content: string;
  variant?: 'compact' | 'full';
}

const CopyArticleButton: React.FC<CopyArticleButtonProps> = ({
  title,
  subtitle,
  content,
  variant = 'compact',
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    const parts = [title];
    if (subtitle) parts.push(subtitle);
    parts.push(content);
    const text = parts.join('\n\n');

    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      toast.success('Article copied to clipboard');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Failed to copy article');
    }
  };

  const Icon = copied ? Check : Copy;

  if (variant === 'full') {
    return (
      <Button
        variant="ghost"
        size="sm"
        onClick={handleCopy}
        className="gap-2 text-muted-foreground hover:text-foreground"
      >
        <Icon className="w-4 h-4" />
        <span className="text-sm">{copied ? 'Copied' : 'Copy'}</span>
      </Button>
    );
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleCopy}
            className="text-muted-foreground hover:text-foreground"
            aria-label="Copy article"
          >
            <Icon className="w-4 h-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>{copied ? 'Copied!' : 'Copy article'}</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default CopyArticleButton;
