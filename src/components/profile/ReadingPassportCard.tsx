import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { BookOpen, Sparkles, Star, Trophy } from "lucide-react";
import type { BookshelfItem } from "@/hooks/useUserBookshelf";

type Props = { name?: string | null; username?: string | null; books: BookshelfItem[]; badgeCount?: number };

export function ReadingPassportCard({ name, username, books, badgeCount = 0 }: Props) {
  const completed = books.filter((b) => b.status === "completed").length;
  const favorites = books.filter((b) => b.is_favorite).slice(0, 3);
  const rated = books.filter((b) => typeof b.rating === "number" && b.rating >= 1 && b.rating <= 5);
  const average = rated.length ? (rated.reduce((sum, b) => sum + (b.rating ?? 0), 0) / rated.length).toFixed(1) : "—";

  return (
    <Card className="overflow-hidden border-[hsl(var(--brand-primary)/0.25)] bg-gradient-to-br from-[hsl(var(--brand-primary)/0.08)] via-card to-[hsl(var(--brand-secondary)/0.08)]">
      <CardContent className="p-5 sm:p-6">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Reader passport</p>
            <h3 className="mt-1 text-xl font-semibold">{name || "A Sahadhyayi reader"}</h3>
            {username && <p className="text-sm text-muted-foreground">@{username}</p>}
          </div>
          <div className="rounded-2xl bg-[hsl(var(--brand-primary)/0.12)] p-3"><BookOpen className="h-6 w-6 text-[hsl(var(--brand-primary))]" /></div>
        </div>
        <div className="mt-5 grid grid-cols-3 gap-2 text-center">
          <div className="rounded-xl bg-background/70 p-3"><BookOpen className="mx-auto mb-1 h-4 w-4 text-muted-foreground"/><div className="text-lg font-semibold">{completed}</div><div className="text-xs text-muted-foreground">Finished</div></div>
          <div className="rounded-xl bg-background/70 p-3"><Star className="mx-auto mb-1 h-4 w-4 text-muted-foreground"/><div className="text-lg font-semibold">{average}</div><div className="text-xs text-muted-foreground">Avg rating</div></div>
          <div className="rounded-xl bg-background/70 p-3"><Trophy className="mx-auto mb-1 h-4 w-4 text-muted-foreground"/><div className="text-lg font-semibold">{badgeCount}</div><div className="text-xs text-muted-foreground">Badges</div></div>
        </div>
        {favorites.length > 0 && <div className="mt-4"><p className="mb-2 flex items-center gap-1 text-xs font-medium text-muted-foreground"><Sparkles className="h-3 w-3"/> Favorite reads</p><div className="flex flex-wrap gap-2">{favorites.map((book) => <span key={book.id} className="max-w-full truncate rounded-full border border-border bg-background/70 px-3 py-1 text-xs">{book.books_library?.title ?? book.book?.title ?? "Untitled book"}</span>)}</div></div>}
      </CardContent>
    </Card>
  );
}
export default ReadingPassportCard;
