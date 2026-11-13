import React, { useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BookX, BarChart3, Sparkles } from 'lucide-react';
import { BookshelfItem, DNF_REASON_LABELS, DnfReason } from '@/hooks/useUserBookshelf';

interface DnfAnalyticsCardProps {
  dnfBooks: BookshelfItem[];
}

export const DnfAnalyticsCard: React.FC<DnfAnalyticsCardProps> = ({ dnfBooks }) => {
  const analytics = useMemo(() => {
    if (!dnfBooks || dnfBooks.length === 0) return null;

    // Reason frequency
    const reasonCounts: Partial<Record<DnfReason, number>> = {};
    let totalProgressSum = 0;
    let booksWithProgress = 0;

    for (const book of dnfBooks) {
      if (book.dnf_reason) {
        reasonCounts[book.dnf_reason] = (reasonCounts[book.dnf_reason] || 0) + 1;
      }
      const totalPages = book.books_library?.pages;
      if (book.dnf_page && totalPages && totalPages > 0) {
        totalProgressSum += Math.min(100, (book.dnf_page / totalPages) * 100);
        booksWithProgress++;
      }
    }

    const avgAbandonPercent =
      booksWithProgress > 0 ? Math.round(totalProgressSum / booksWithProgress) : null;

    let topReason: { reason: DnfReason; count: number } | null = null;
    for (const [r, count] of Object.entries(reasonCounts)) {
      if (!topReason || (count as number) > topReason.count) {
        topReason = { reason: r as DnfReason, count: count as number };
      }
    }

    return {
      totalDnf: dnfBooks.length,
      avgAbandonPercent,
      topReason,
      reasonCounts,
    };
  }, [dnfBooks]);

  if (!analytics || analytics.totalDnf === 0) return null;

  return (
    <Card className="border-border bg-gradient-to-r from-rose-500/5 via-amber-500/5 to-transparent shadow-xs">
      <CardContent className="p-4 sm:p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400">
              <BookX className="w-4 h-4" />
              <h3 className="font-semibold text-sm text-foreground">
                DNF Insights &amp; Reading Habits
              </h3>
            </div>
            <p className="text-xs text-muted-foreground">
              {analytics.totalDnf} {analytics.totalDnf === 1 ? 'book' : 'books'} set aside · Knowing when to stop protects your reading joy.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {analytics.avgAbandonPercent !== null && (
              <Badge variant="outline" className="text-xs gap-1 py-1 border-rose-500/30 text-foreground">
                <BarChart3 className="w-3.5 h-3.5 text-rose-500" />
                Avg. Stop Point: <span className="font-semibold text-rose-600 dark:text-rose-400">{analytics.avgAbandonPercent}%</span>
              </Badge>
            )}

            {analytics.topReason && (
              <Badge variant="secondary" className="text-xs gap-1 py-1 bg-muted/80 text-foreground">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                Top Reason: <span className="font-medium">{DNF_REASON_LABELS[analytics.topReason.reason]}</span>
              </Badge>
            )}
          </div>
        </div>

        {/* Reasons pills */}
        <div className="flex flex-wrap gap-1.5 mt-3 pt-3 border-t border-border/50">
          {Object.entries(analytics.reasonCounts).map(([key, count]) => (
            <span
              key={key}
              className="text-[11px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground"
            >
              {DNF_REASON_LABELS[key as DnfReason]}: <span className="font-semibold text-foreground">{count}</span>
            </span>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default DnfAnalyticsCard;
