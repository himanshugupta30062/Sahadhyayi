import React, { useState } from "react";
import { useMarginNotes } from "@/hooks/useMarginNotes";
import { useAuth } from "@/contexts/authHelpers";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BookOpen, Globe, Users, Loader2 } from "lucide-react";
import { AddMarginNoteDialog } from "./AddMarginNoteDialog";
import { MarginNoteCard } from "./MarginNoteCard";

export const MarginNotesFeed: React.FC = () => {
  const { user } = useAuth();
  const [filter, setFilter] = useState<"all" | "friends">("all");
  const { data: notes = [], isLoading, error } = useMarginNotes({ filter });

  return (
    <div className="space-y-4">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-card p-4 rounded-xl border border-border">
        <div>
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-amber-500" />
            Margin Notes
          </h2>
          <p className="text-xs text-muted-foreground">
            A living margin around books. Highlights, thoughts, and reflections from the community.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          {/* Friends vs Global Toggle */}
          {user && (
            <Tabs value={filter} onValueChange={(v) => setFilter(v as "all" | "friends")} className="h-8">
              <TabsList className="h-8 p-0.5 bg-muted/60">
                <TabsTrigger value="all" className="h-7 text-xs px-2.5 gap-1">
                  <Globe className="w-3 h-3" /> Global
                </TabsTrigger>
                <TabsTrigger value="friends" className="h-7 text-xs px-2.5 gap-1">
                  <Users className="w-3 h-3" /> Friends
                </TabsTrigger>
              </TabsList>
            </Tabs>
          )}

          {user && <AddMarginNoteDialog />}
        </div>
      </div>

      {/* Loading & Error States */}
      {isLoading && (
        <div className="flex justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-brand-primary" />
        </div>
      )}

      {error && (
        <Card className="border-destructive/30">
          <CardContent className="py-6 text-center text-sm text-destructive">
            Failed to load margin notes. Please try again.
          </CardContent>
        </Card>
      )}

      {!isLoading && !error && notes.length === 0 && (
        <Card className="border-dashed bg-card/60">
          <CardContent className="py-12 text-center space-y-3">
            <div className="w-12 h-12 mx-auto rounded-full bg-amber-500/10 flex items-center justify-center text-amber-600">
              <BookOpen className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">
                {filter === "friends" ? "No margin notes from friends yet" : "No margin notes yet"}
              </p>
              <p className="text-xs text-muted-foreground max-w-sm mx-auto mt-1">
                {filter === "friends"
                  ? "When your friends highlight book passages and write margin notes, they will appear here."
                  : "Highlight a meaningful passage in any book and share your thoughts to build the living margin."}
              </p>
            </div>
            {user && (
              <div className="pt-2">
                <AddMarginNoteDialog
                  trigger={
                    <Button size="sm" variant="outline" className="text-xs">
                      Post First Margin Note
                    </Button>
                  }
                />
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Feed of Notes */}
      {!isLoading && notes.length > 0 && (
        <div className="space-y-4">
          {notes.map((note) => (
            <MarginNoteCard key={note.id} note={note} />
          ))}
        </div>
      )}
    </div>
  );
};
export default MarginNotesFeed;
