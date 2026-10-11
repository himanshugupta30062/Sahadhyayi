import React from 'react';
import type { AccessStatus } from '@/types/bookCatalog';
import { Badge } from '@/components/ui/badge';
import { Sparkles, BookCheck, GraduationCap, Library, Eye, FileText, CheckCircle2 } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface BookQualityBadgeProps {
  status?: AccessStatus;
  qualityScore?: number;
  whyThisEdition?: string;
  size?: 'sm' | 'md';
}

export const BookQualityBadge: React.FC<BookQualityBadgeProps> = ({
  status = 'access_unverified',
  qualityScore,
  whyThisEdition,
  size = 'sm',
}) => {
  const getBadgeConfig = () => {
    switch (status) {
      case 'carefully_edited':
        return {
          label: 'Carefully Edited',
          icon: Sparkles,
          className: 'bg-emerald-600/90 text-white hover:bg-emerald-700 border-emerald-500',
          description: 'Professionally formatted reflowable edition with verified proofreading and structure.',
        };
      case 'open_textbook':
        return {
          label: 'Open Textbook',
          icon: GraduationCap,
          className: 'bg-sky-600/90 text-white hover:bg-sky-700 border-sky-500',
          description: 'Educator-evaluated, openly licensed educational textbook.',
        };
      case 'scholarly_oa':
        return {
          label: 'Scholarly OA',
          icon: Library,
          className: 'bg-indigo-600/90 text-white hover:bg-indigo-700 border-indigo-500',
          description: 'Peer-reviewed scholarly book from an academic press.',
        };
      case 'public_domain':
        return {
          label: 'Public Domain',
          icon: BookCheck,
          className: 'bg-amber-600/90 text-white hover:bg-amber-700 border-amber-500',
          description: 'Verified complete public-domain work with unrestricted access.',
        };
      case 'verified_full_text':
        return {
          label: 'Verified Full Text',
          icon: CheckCircle2,
          className: 'bg-teal-600/90 text-white hover:bg-teal-700 border-teal-500',
          description: 'Complete digital document verified for direct reading.',
        };
      case 'preview_only':
        return {
          label: 'Preview Only',
          icon: Eye,
          className: 'bg-stone-600/80 text-white hover:bg-stone-700 border-stone-500',
          description: 'Publisher authorized limited preview; full download restricted.',
        };
      case 'metadata_only':
        return {
          label: 'Metadata Only',
          icon: FileText,
          className: 'bg-zinc-600/80 text-white hover:bg-zinc-700 border-zinc-500',
          description: 'Bibliographic discovery record; digital file is not directly readable.',
        };
      default:
        return {
          label: 'Open Access',
          icon: BookCheck,
          className: 'bg-slate-700/80 text-white hover:bg-slate-800 border-slate-600',
          description: 'Catalog entry with verified open reading link.',
        };
    }
  };

  const config = getBadgeConfig();
  const Icon = config.icon;
  const tooltipText = whyThisEdition || config.description;

  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="inline-flex items-center gap-1 cursor-help">
            <Badge
              variant="secondary"
              className={`font-semibold shadow-sm transition-colors flex items-center gap-1 ${config.className} ${
                size === 'sm' ? 'text-[10px] px-1.5 py-0.5' : 'text-xs px-2.5 py-1'
              }`}
            >
              <Icon className={size === 'sm' ? 'w-2.5 h-2.5' : 'w-3.5 h-3.5'} />
              <span>{config.label}</span>
              {typeof qualityScore === 'number' && qualityScore > 0 && (
                <span className="opacity-90 pl-0.5 border-l border-white/30 text-[9px]">
                  {qualityScore}
                </span>
              )}
            </Badge>
          </div>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-xs text-xs p-2 bg-popover text-popover-foreground border shadow-md">
          <p className="font-semibold text-primary">{config.label}</p>
          <p className="text-muted-foreground mt-0.5">{tooltipText}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};
