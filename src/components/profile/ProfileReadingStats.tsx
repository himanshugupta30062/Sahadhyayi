import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BookOpen, BookMarked, BookCheck, Star, Compass } from "lucide-react";
import type { BookshelfItem } from "@/hooks/useUserBookshelf";

type Props = { books: BookshelfItem[] };

export const ProfileReadingStats: React.FC<Props> = ({ books }) => {
  const completed = books.filter((b) => b.status === "completed");
  const reading = books.filter((b) => b.status === "reading");
  const wantToRead = books.filter((b) => b.status === "want_to_read");
  const ratings = books.map((b) => b.rating).filter((r): r is number => typeof r === "number" && r >= 1 && r <= 5);
  const average = ratings.length ? ratings.reduce((sum, r) => sum + r, 0) / ratings.length : null;
  const tracked = books.length;
  const completionRate = tracked ? Math.round((completed.length / tracked) * 100) : 0;
  const progressBooks = reading.filter((book) => typeof book.progress === "number" && book.progress >= 0 && book.progress <= 100);
  const averageProgress = progressBooks.length ? Math.round(progressBooks.reduce((sum, book) => sum + (book.progress ?? 0), 0) / progressBooks.length) : null;
  const genres = books.flatMap((b) => (b.books_library?.genre ?? "").split(/[,/|]/).map((g) => g.trim()).filter(Boolean));
  const genreCounts = genres.reduce<Record<string, number>>((acc, genre) => {
    acc[genre] = (acc[genre] ?? 0) + 1;
    return acc;
  }, {});
  const topGenres = Object.entries(genreCounts).sort((a, b) => b[1] - a[1]).slice(0, 3);
  const metrics = [
    { label: "Completed", value: completed.length, icon: BookCheck },
    { label: "Reading now", value: reading.length, icon: BookOpen },
    { label: "Want to read", value: wantToRead.length, icon: BookMarked },
    { label: "Avg. rating", value: average === null ? "—" : average.toFixed(1), icon: Star },
  ];

  return (
    <Card className="border-border/70">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base"><Compass className="h-4 w-4 text-[hsl(var(--brand-primary))]" /> Reading snapshot</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {metrics.map(({ label, value, icon: Icon }) => (
            <div key={label} className="rounded-xl bg-muted/40 p-3 text-center">
              <Icon className="mx-auto mb-1 h-4 w-4 text-muted-foreground" />
              <div className="text-xl font-semibold tabular-nums">{value}</div>
              <div className="text-xs text-muted-foreground">{label}</div>
            </div>
          ))}
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs"><span className="font-medium">Shelf completion</span><span className="text-muted-foreground">{completed.length} of {tracked} books · {completionRate}%</span></div>
          <div className="h-2 overflow-hidden rounded-full bg-muted" role="progressbar" aria-label="Shelf completion" aria-valuemin={0} aria-valuemax={100} aria-valuenow={completionRate}><div className="h-full rounded-full bg-[hsl(var(--brand-primary))] transition-all" style={{width:`${completionRate}%`}} /></div>
          <p className="text-xs text-muted-foreground">{tracked === 0 ? "Add books to your shelf to start your reading snapshot." : `${tracked - completed.length} ${tracked - completed.length === 1 ? "book is" : "books are"} still in your reading journey.`}</p>
        </div>
        {reading.length > 0 && <div className="rounded-lg bg-muted/40 px-3 py-2.5">
          <div className="flex items-center justify-between text-xs"><span className="font-medium">Reading momentum</span><span className="text-muted-foreground">{averageProgress === null ? "Progress not tracked" : `${averageProgress}% average`}</span></div>
          {averageProgress !== null && <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-[hsl(var(--brand-primary))]" style={{width:`${averageProgress}%`}} /></div>}
          <p className="mt-1 text-xs text-muted-foreground">{progressBooks.length} of {reading.length} currently-reading books have progress recorded.</p>
        </div>}
        {topGenres.length > 0 && (
          <div>
            <p className="mb-2 text-xs font-medium text-muted-foreground">Most-read genres on your shelf</p>
            <div className="flex flex-wrap gap-2">
              {topGenres.map(([genre, count]) => <span key={genre} className="rounded-full border px-2.5 py-1 text-xs">{genre} · {count}</span>)}
            {genres.length === 0 && <span className="text-xs text-muted-foreground">Add genres to book entries to see your reading mix.</span>}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ProfileReadingStats;
