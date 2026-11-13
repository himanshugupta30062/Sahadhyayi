import React, { useMemo, useState } from "react";
import { CalendarDays, BookCheck, Star, TrendingUp, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { BookshelfItem } from "@/hooks/useUserBookshelf";

type Props = { books: BookshelfItem[] };

const ReadingYearReview: React.FC<Props> = ({ books }) => {
  const years = useMemo(() => {
    const values = books.filter((book) => book.status === "completed" && book.completed_at)
      .map((book) => new Date(book.completed_at as string).getFullYear())
      .filter(Number.isFinite);
    return [...new Set(values)].sort((a, b) => b - a);
  }, [books]);
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const { toast } = useToast();
  const yearBooks = useMemo(() => books.filter((book) => {
    if (book.status !== "completed" || !book.completed_at) return false;
    const date = new Date(book.completed_at);
    return Number.isFinite(date.getTime()) && date.getFullYear() === selectedYear;
  }), [books, selectedYear]);
  const monthly = Array.from({ length: 12 }, (_, index) => ({
    month: new Date(selectedYear, index, 1).toLocaleString("en", { month: "short" }),
    count: yearBooks.filter((book) => new Date(book.completed_at as string).getMonth() === index).length,
  }));
  const maxMonth = Math.max(1, ...monthly.map((item) => item.count));
  const rated = yearBooks.filter((book) => typeof book.rating === "number" && book.rating > 0);
  const average = rated.length ? (rated.reduce((sum, book) => sum + (book.rating || 0), 0) / rated.length).toFixed(1) : "—";
  const topGenre = Object.entries(yearBooks.reduce<Record<string, number>>((acc, book) => {
    const genre = book.books_library?.genre?.trim() || "Uncategorized";
    acc[genre] = (acc[genre] || 0) + 1;
    return acc;
  }, {})).sort((a, b) => b[1] - a[1])[0];
  const shareSummary = `My ${selectedYear} reading year on Sahadhyayi: ${yearBooks.length} books completed${average !== "—" ? `, average rating ${average}/5` : ""}${topGenre?.[0] ? `, favorite genre ${topGenre[0]}` : ""}. Discover your reading journey at sahadhyayi.com`;
  const shareYear = async () => {
    try {
      if (typeof navigator.share === "function") await navigator.share({ title: `${selectedYear} Reading Year`, text: shareSummary, url: "https://sahadhyayi.com" });
      else if (navigator.clipboard?.writeText) { await navigator.clipboard.writeText(shareSummary); toast({ title: "Reading recap copied", description: "Share it with fellow readers." }); }
      else toast({ title: "Sharing unavailable", description: "Your browser does not support sharing or clipboard access.", variant: "destructive" });
    } catch (error) { if (error instanceof Error && error.name !== "AbortError") toast({ title: "Could not share recap", description: error.message, variant: "destructive" }); }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-3">
        <CardTitle className="flex items-center gap-2"><CalendarDays className="h-5 w-5 text-primary" />Year in Reading</CardTitle>
        <div className="flex items-center gap-2"><Button type="button" variant="outline" size="sm" onClick={shareYear}><Share2 className="mr-1 h-4 w-4" />Share recap</Button><select aria-label="Reading year" className="rounded-md border bg-background px-2 py-1 text-sm" value={selectedYear} onChange={(event) => setSelectedYear(Number(event.target.value))}>
          {[...new Set([new Date().getFullYear(), ...years])].sort((a, b) => b - a).map((year) => <option key={year} value={year}>{year}</option>)}
        </select></div>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="grid grid-cols-3 gap-2">
          <div className="rounded-xl bg-muted/50 p-3"><BookCheck className="mb-1 h-4 w-4 text-primary" /><p className="text-2xl font-bold">{yearBooks.length}</p><p className="text-xs text-muted-foreground">Finished</p></div>
          <div className="rounded-xl bg-muted/50 p-3"><Star className="mb-1 h-4 w-4 text-amber-500" /><p className="text-2xl font-bold">{average}</p><p className="text-xs text-muted-foreground">Avg rating</p></div>
          <div className="rounded-xl bg-muted/50 p-3"><TrendingUp className="mb-1 h-4 w-4 text-primary" /><p className="truncate text-lg font-bold">{topGenre?.[0] || "—"}</p><p className="text-xs text-muted-foreground">Top genre</p></div>
        </div>
        <div>
          <p className="mb-3 text-sm font-medium">Monthly completions</p>
          <div className="grid grid-cols-6 gap-2 sm:grid-cols-12">
            {monthly.map((item) => <div key={item.month} className="flex flex-col items-center gap-1" title={item.count + " books"}>
              <div className="flex h-20 w-full items-end rounded bg-muted/40 p-1"><div className="w-full rounded-sm bg-primary/80" style={{ height: item.count ? `${Math.max(8, item.count / maxMonth * 100)}%` : "3px" }} /></div>
              <span className="text-[10px] text-muted-foreground">{item.month}</span><span className="text-xs font-medium">{item.count || ""}</span>
            </div>)}
          </div>
        </div>
        {yearBooks.length ? <div className="border-t pt-3"><p className="mb-2 text-sm font-medium">Books you finished</p><div className="space-y-2">{yearBooks.slice().sort((a,b)=>new Date(b.completed_at as string).getTime()-new Date(a.completed_at as string).getTime()).slice(0,5).map((book)=><div key={book.id} className="flex items-center justify-between gap-3 text-sm"><span className="truncate">{book.books_library?.title || "Untitled book"}</span><span className="shrink-0 text-muted-foreground">{new Date(book.completed_at as string).toLocaleDateString(undefined,{month:"short",day:"numeric"})}</span></div>)}</div></div> : <p className="text-sm text-muted-foreground">No completion dates recorded for {selectedYear} yet. Mark books complete to build your yearly recap.</p>}
      </CardContent>
    </Card>
  );
};

export default ReadingYearReview;
