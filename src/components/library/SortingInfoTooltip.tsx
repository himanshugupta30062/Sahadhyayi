
import React from 'react';
import { Info } from 'lucide-react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
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
    <Popover>
      <PopoverTrigger asChild>
        <button
          className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
          aria-label="How books are sorted"
        >
          <Info className="w-4 h-4" />
          <span className="hidden sm:inline">How are books sorted?</span>
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-4" align="start">
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
          Books with cover images are always prioritized to ensure the best browsing experience.
        </p>
      </PopoverContent>
    </Popover>
  );
};

export default SortingInfoTooltip;
