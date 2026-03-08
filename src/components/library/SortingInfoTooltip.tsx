
import React from 'react';
import { Info } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { SORTING_RULES } from '@/hooks/useLibraryBooks';

const priorityColors: Record<string, string> = {
  highest: 'text-green-600 bg-green-50 dark:bg-green-950/40 dark:text-green-400',
  high: 'text-blue-600 bg-blue-50 dark:bg-blue-950/40 dark:text-blue-400',
  medium: 'text-amber-600 bg-amber-50 dark:bg-amber-950/40 dark:text-amber-400',
  low: 'text-muted-foreground bg-muted',
  demoted: 'text-red-600 bg-red-50 dark:bg-red-950/40 dark:text-red-400',
  info: 'text-muted-foreground bg-muted',
};

const SortingInfoTooltip: React.FC = () => {
  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            className="inline-flex items-center justify-center w-5 h-5 rounded-full border border-border text-muted-foreground hover:text-foreground hover:border-foreground/40 transition-colors"
            aria-label="How books are sorted"
          >
            <Info className="w-3.5 h-3.5" />
          </button>
        </TooltipTrigger>
        <TooltipContent className="w-80 p-4" align="start" side="bottom">
          <h4 className="font-semibold text-sm mb-3 text-foreground">📚 Book Sorting Rules</h4>
          <p className="text-xs text-muted-foreground mb-3">
            Books are ranked by a completeness score. Higher scores appear first.
          </p>
          <div className="space-y-1.5">
            {SORTING_RULES.map((rule, i) => (
              <div key={i} className="flex items-center justify-between gap-2 text-xs">
                <span className="text-foreground truncate flex-1">{rule.label}</span>
                <span className={`px-1.5 py-0.5 rounded font-mono text-[10px] font-medium whitespace-nowrap ${priorityColors[rule.priority]}`}>
                  {rule.points}
                </span>
              </div>
            ))}
          </div>
          <p className="text-[10px] text-muted-foreground mt-3 border-t border-border pt-2">
            Books with high-quality cover images are always prioritized for the best browsing experience.
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default SortingInfoTooltip;
