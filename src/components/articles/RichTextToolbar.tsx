import React from 'react';
import { Button } from '@/components/ui/button';
import {
  Bold, Italic, Heading1, Heading2, Heading3, List, ListOrdered,
  Quote, Code, Link2, Minus, Image,
} from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface RichTextToolbarProps {
  textareaRef: React.RefObject<HTMLTextAreaElement>;
  onInsert: (before: string, after: string, placeholder?: string) => void;
  onWrapLines: (prefix: string) => void;
}

const RichTextToolbar = ({ textareaRef, onInsert, onWrapLines }: RichTextToolbarProps) => {
  const tools = [
    { icon: Bold, label: 'Bold', action: () => onInsert('**', '**', 'bold text'), shortcut: 'Ctrl+B' },
    { icon: Italic, label: 'Italic', action: () => onInsert('*', '*', 'italic text'), shortcut: 'Ctrl+I' },
    { type: 'sep' as const },
    { icon: Heading1, label: 'Heading 1', action: () => onWrapLines('# ') },
    { icon: Heading2, label: 'Heading 2', action: () => onWrapLines('## ') },
    { icon: Heading3, label: 'Heading 3', action: () => onWrapLines('### ') },
    { type: 'sep' as const },
    { icon: List, label: 'Bullet List', action: () => onWrapLines('- ') },
    { icon: ListOrdered, label: 'Numbered List', action: () => onWrapLines('1. ') },
    { icon: Quote, label: 'Blockquote', action: () => onWrapLines('> ') },
    { type: 'sep' as const },
    { icon: Code, label: 'Code Block', action: () => onInsert('\n```\n', '\n```\n', 'code here') },
    { icon: Link2, label: 'Link', action: () => onInsert('[', '](url)', 'link text') },
    { icon: Image, label: 'Image', action: () => onInsert('![', '](url)', 'alt text') },
    { icon: Minus, label: 'Divider', action: () => onInsert('\n\n---\n\n', '', '') },
  ];

  return (
    <TooltipProvider delayDuration={300}>
      <div className="flex items-center gap-0.5 flex-wrap p-2 border border-border rounded-t-lg bg-muted/30">
        {tools.map((tool, i) => {
          if ('type' in tool && tool.type === 'sep') {
            return <div key={i} className="w-px h-6 bg-border mx-1" />;
          }
          const t = tool as { icon: React.ElementType; label: string; action: () => void; shortcut?: string };
          return (
            <Tooltip key={t.label}>
              <TooltipTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground hover:bg-accent"
                  onClick={(e) => {
                    e.preventDefault();
                    t.action();
                    textareaRef.current?.focus();
                  }}
                >
                  <t.icon className="w-4 h-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="text-xs">
                {t.label}{t.shortcut ? ` (${t.shortcut})` : ''}
              </TooltipContent>
            </Tooltip>
          );
        })}
      </div>
    </TooltipProvider>
  );
};

export default RichTextToolbar;
