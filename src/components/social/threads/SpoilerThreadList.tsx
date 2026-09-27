import React from "react";
import { SafeSpoilerThread } from "@/hooks/useSpoilerThreads";
import { SpoilerThreadCard } from "./SpoilerThreadCard";
import { Card, CardContent } from "@/components/ui/card";
import { Lock, BookOpen } from "lucide-react";

interface SpoilerThreadListProps {
  threads: SafeSpoilerThread[];
  isLoading: boolean;
  onStartThread?: () => void;
}

export const SpoilerThreadList: React.FC<SpoilerThreadListProps> = ({
  threads,
  isLoading,
  onStartThread,
}) => {
  if (isLoading) {
    return null;
  }

  if (threads.length === 0) {
    return (
      <Card className="border-dashed bg-card/60">
        <CardContent className="py-12 text-center space-y-3">
          <div className="w-12 h-12 mx-auto rounded-full bg-indigo-500/10 flex items-center justify-center text-indigo-600">
            <Lock className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">No spoiler-safe threads yet</p>
            <p className="text-xs text-muted-foreground max-w-sm mx-auto mt-1">
              Start a thread tagged with a specific chapter. Only readers who have read up to that point will be able to see the body and join the discussion.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Group threads by book_id
  const threadsByBook = new Map<string, { book: any; threads: SafeSpoilerThread[] }>();
  threads.forEach((t) => {
    const key = t.book_id;
    if (!threadsByBook.has(key)) {
      threadsByBook.set(key, { book: t.books_library, threads: [] });
    }
    threadsByBook.get(key)!.threads.push(t);
  });

  return (
    <div className="space-y-6">
      {Array.from(threadsByBook.entries()).map(([bookId, group]) => (
        <div key={bookId} className="space-y-3">
          <div className="flex items-center gap-2 px-1">
            <BookOpen className="w-4 h-4 text-indigo-500" />
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {group.book?.title || "Book Discussion"}
            </h3>
            <span className="text-[11px] text-muted-foreground">({group.threads.length})</span>
          </div>

          <div className="space-y-3">
            {group.threads.map((t) => (
              <SpoilerThreadCard key={t.id} thread={t} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};
export default SpoilerThreadList;
