import React, { useMemo } from "react";
import { BarChart3, Gauge, Star } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { BookshelfItem } from "@/hooks/useUserBookshelf";

type Props = { books: BookshelfItem[] };

const ReadingInsights: React.FC<Props> = ({ books }) => {
  const completed = books.filter((book) => book.status === "completed");
  const reading = books.filter((book) => book.status === "reading");
  const ratings = useMemo(() => [1, 2, 3, 4, 5].map((rating) => ({
    rating,
    count: completed.filter((book) => book.rating === rating).length,
  })), [completed]);
  const maxRating = Math.max(1, ...ratings.map((item) => item.count));
  const yearCounts = useMemo(() => {
    const counts = completed.reduce<Record<string, number>>((acc, book) => {
      if (!book.completed_at) return acc;
      const year = new Date(book.completed_at).getFullYear();
      if (Number.isFinite(year)) acc[String(year)] = (acc[String(year)] || 0) + 1;
      return acc;
    }, {});
    return Object.entries(counts).sort(([a], [b]) => Number(a) - Number(b)).slice(-5);
  }, [completed]);
  const maxYear = Math.max(1, ...yearCounts.map(([, count]) => count));
  const progressValues = reading.map((book) => Number(book.progress)).filter((value) => Number.isFinite(value) && value >= 0 && value <= 100);
  const averageProgress = progressValues.length ? Math.round(progressValues.reduce((sum, value) => sum + value, 0) / progressValues.length) : null;
  const mostCommonRating = ratings.slice().sort((a, b) => b.count - a.count)[0];

  return <div className="grid gap-4 md:grid-cols-2">
    <Card><CardHeader><CardTitle className="flex items-center gap-2"><Star className="h-5 w-5 text-amber-500"/>Rating patterns</CardTitle></CardHeader><CardContent className="space-y-3">
      {ratings.slice().reverse().map(({ rating, count }) => <div key={rating} className="flex items-center gap-3 text-sm"><span className="w-10 shrink-0">{rating} ★</span><div className="h-2 flex-1 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-amber-400" style={{ width: `${count / maxRating * 100}%` }}/></div><span className="w-6 text-right text-muted-foreground">{count}</span></div>)}
      <p className="text-xs text-muted-foreground">{completed.filter((book) => book.rating && book.rating > 0).length} completed books rated{mostCommonRating?.count ? ` · Most common: ${mostCommonRating.rating} stars` : ""}</p>
    </CardContent></Card>
    <Card><CardHeader><CardTitle className="flex items-center gap-2"><BarChart3 className="h-5 w-5 text-primary"/>Completion trend</CardTitle></CardHeader><CardContent>
      {yearCounts.length ? <div className="flex h-32 items-end gap-3">{yearCounts.map(([year, count])=><div key={year} className="flex flex-1 flex-col items-center gap-1"><span className="text-xs font-medium">{count}</span><div className="w-full rounded-t-md bg-primary/80" style={{height:`${Math.max(8,count/maxYear*88)}px`}}/><span className="text-xs text-muted-foreground">{year}</span></div>)}</div> : <p className="text-sm text-muted-foreground">Completion dates will reveal your reading trend here.</p>}
      <p className="mt-3 text-xs text-muted-foreground">Based on recorded completion dates.</p>
    </CardContent></Card>
    <Card className="md:col-span-2"><CardHeader><CardTitle className="flex items-center gap-2"><Gauge className="h-5 w-5 text-primary"/>Reading pace right now</CardTitle></CardHeader><CardContent>
      {averageProgress !== null ? <><div className="mb-2 flex items-baseline justify-between"><span className="text-3xl font-bold">{averageProgress}%</span><span className="text-sm text-muted-foreground">average progress · {progressValues.length} of {reading.length} books</span></div><div className="h-3 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-primary" style={{width:`${averageProgress}%`}}/></div></> : <p className="text-sm text-muted-foreground">Add progress to books you are currently reading to see your pace snapshot.</p>}
    </CardContent></Card>
  </div>;
};

export default ReadingInsights;
