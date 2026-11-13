import React from "react";
import { Link } from "react-router-dom";
import {
  ReadingDna,
  getCrossRecommendations,
  getCompatibilityBreakdown,
  matchScore,
} from "@/lib/readingDna";
import { useUserShelfForCompare } from "@/hooks/useReadingDna";
import { useAuth } from "@/contexts/authHelpers";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Dna, Sparkles, BookOpen, ArrowRight, Compass, ShieldCheck } from "lucide-react";
import { DnaStrip } from "./ReadingDnaCard";

interface DnaCompareProps {
  friendDna: ReadingDna;
  myDna: ReadingDna;
  friendName?: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const DnaCompare: React.FC<DnaCompareProps> = ({
  friendDna,
  myDna,
  friendName = "Reader",
  open,
  onOpenChange,
}) => {
  const { user } = useAuth();
  const { data: myShelf = [] } = useUserShelfForCompare(user?.id);
  const { data: friendShelf = [] } = useUserShelfForCompare(friendDna.user_id);

  const breakdown = getCompatibilityBreakdown(myDna, friendDna, myShelf, friendShelf);
  const score = breakdown.score;

  const crossRecs = getCrossRecommendations(myShelf, friendShelf, myDna, 5);
  const friendTasteRecs = getCrossRecommendations(friendShelf, myShelf, friendDna, 5);

  const sharedGenres = breakdown.sharedGenres;
  const sharedMoods = breakdown.sharedMoods;
  const sharedThemes = breakdown.sharedThemes;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg">
            <Dna className="w-5 h-5 text-amber-500" />
            Reading DNA Comparison
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-2">
          {/* Big Match Score Banner */}
          <div className="rounded-2xl p-5 bg-gradient-to-r from-amber-500/15 via-orange-500/15 to-purple-500/15 border border-amber-500/20 flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
            <div className="space-y-1">
              <div className="flex items-center gap-2 justify-center sm:justify-start">
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Compatibility Index
                </span>
                <Badge
                  variant="outline"
                  className="text-[10px] px-1.5 py-0 border-amber-500/40 text-amber-700 dark:text-amber-300"
                >
                  <ShieldCheck className="w-3 h-3 mr-1 inline" />
                  {breakdown.confidence === "high"
                    ? "High Confidence"
                    : breakdown.confidence === "moderate"
                    ? "Moderate Data"
                    : "Emerging Taste Profile"}
                </Badge>
              </div>
              <h3 className="text-xl font-bold text-foreground">
                You and {friendName}
              </h3>
              <p className="text-xs text-foreground/90 max-w-md italic">
                "{breakdown.narrativeExplanation}"
              </p>
            </div>

            <div className="shrink-0 flex flex-col items-center">
              <div
                className="w-16 h-16 rounded-full flex items-center justify-center font-bold text-xl text-white shadow-lg"
                style={{
                  background: `linear-gradient(135deg, hsl(${score * 1.2} 80% 50%), hsl(${score * 1.2 + 40} 80% 40%))`,
                }}
              >
                {score}%
              </div>
              <span className="text-[11px] font-semibold text-muted-foreground mt-1">
                {score >= 80 ? "Literary Soulmates" : score >= 60 ? "Strong Taste Match" : "Diverse Perspectives"}
              </span>
            </div>
          </div>

          {/* Side-by-side DNA Staves */}
          <div className="grid sm:grid-cols-2 gap-4">
            {/* You */}
            <div className="p-3.5 rounded-xl border border-border bg-card space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-xs text-foreground">You</span>
                <span className="text-[11px] text-muted-foreground capitalize">{myDna.pace ?? "Steady"} pace</span>
              </div>
              <DnaStrip dna={myDna} />
              <div className="flex flex-wrap gap-1 pt-1">
                {myDna.genres.slice(0, 4).map((g) => (
                  <Badge key={g.name} variant="secondary" className="text-[10px]">
                    {g.name}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Friend */}
            <div className="p-3.5 rounded-xl border border-border bg-card space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-xs text-foreground">{friendName}</span>
                <span className="text-[11px] text-muted-foreground capitalize">{friendDna.pace ?? "Steady"} pace</span>
              </div>
              <DnaStrip dna={friendDna} />
              <div className="flex flex-wrap gap-1 pt-1">
                {friendDna.genres.slice(0, 4).map((g) => (
                  <Badge key={g.name} variant="secondary" className="text-[10px]">
                    {g.name}
                  </Badge>
                ))}
              </div>
            </div>
          </div>

          {/* Shared reading signals */}
          <Card className="border-amber-500/20 bg-amber-500/5">
            <CardContent className="p-4 space-y-3">
              <div>
                <h4 className="text-sm font-semibold text-foreground">Your shared reading signals</h4>
                <p className="text-xs text-muted-foreground">Interests appearing in both profiles—not a guarantee you will enjoy every same book.</p>
              </div>
              {[
                { label: "Genres", values: sharedGenres },
                { label: "Moods", values: sharedMoods },
                { label: "Themes", values: sharedThemes },
              ].map(({ label, values }) => (
                <div key={label} className="space-y-1.5">
                  <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
                  {values.length ? (
                    <div className="flex flex-wrap gap-1.5">
                      {values.map((value) => <Badge key={value} variant="secondary">{value}</Badge>)}
                    </div>
                  ) : <p className="text-xs text-muted-foreground">No overlap detected yet</p>}
                </div>
              ))}

              {/* Differences in taste / New horizons */}
              {breakdown.differencesInTaste.length > 0 && (
                <div className="space-y-1.5 pt-2 border-t border-amber-500/10">
                  <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground flex items-center gap-1">
                    <Compass className="w-3 h-3 text-amber-600" />
                    Genres to discover from {friendName}
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {breakdown.differencesInTaste.map((genre) => (
                      <Badge key={genre} variant="outline" className="text-xs border-amber-500/30">
                        + {genre}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Overlapping shelf books */}
              {breakdown.overlappingBooks.length > 0 && (
                <div className="space-y-1.5 pt-2 border-t border-amber-500/10">
                  <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground flex items-center gap-1">
                    <BookOpen className="w-3 h-3 text-amber-600" />
                    Books on both your shelves ({breakdown.overlappingBooks.length})
                  </p>
                  <div className="space-y-1">
                    {breakdown.overlappingBooks.slice(0, 3).map((book, idx) => (
                      <div key={book.id || idx} className="text-xs text-foreground flex items-center justify-between">
                        <span className="truncate">{book.title}</span>
                        <span className="text-[10px] text-muted-foreground shrink-0 ml-2">
                          {book.myRating ? `You: ★${book.myRating}` : "On shelf"} · {book.theirRating ? `${friendName}: ★${book.theirRating}` : `${friendName}: Saved`}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* 5 Cross Recommendations */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-semibold text-foreground flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  Books {friendName} Read that Match Your Taste
                </h4>
                <p className="text-xs text-muted-foreground">
                  Cross-recommendations found on {friendName}'s shelf aligned with your reading DNA.
                </p>
              </div>
            </div>

            {crossRecs.length === 0 ? (
              <Card className="border-dashed bg-muted/20">
                <CardContent className="py-6 text-center text-xs text-muted-foreground">
                  No unique cross-recommendations found yet. As you both add more books to your shelves, tailored recommendations will appear here!
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-2">
                {crossRecs.map((b, i) => {
                  const book = b.books_library;
                  const bId = b.book_id || b.id || book?.id;
                  return (
                    <div
                      key={bId || i}
                      className="flex items-center justify-between p-2.5 bg-card border border-border rounded-xl hover:shadow-sm transition-all"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-14 rounded bg-muted overflow-hidden shrink-0 shadow-xs">
                          {book?.cover_image_url ? (
                            <img src={book.cover_image_url} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-brand-primary/10">
                              <BookOpen className="w-3.5 h-3.5 text-brand-primary" />
                            </div>
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-xs sm:text-sm text-foreground truncate">
                            {book?.title ?? "Untitled Book"}
                          </p>
                          <p className="text-[11px] text-muted-foreground truncate">
                            {book?.author ? `by ${book.author}` : "Author Unknown"}
                            {book?.genre && ` · ${book.genre}`}
                          </p>
                        </div>
                      </div>

                      {bId && (
                        <Link to={`/book/${bId}`} onClick={() => onOpenChange(false)}>
                          <Badge variant="outline" className="text-xs gap-1 hover:bg-muted cursor-pointer shrink-0">
                            <span>Details</span>
                            <ArrowRight className="w-3 h-3" />
                          </Badge>
                        </Link>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-foreground flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-violet-500" />
              Books on your shelf {friendName} may enjoy
            </h4>
            <p className="text-xs text-muted-foreground">Your books ranked against {friendName}'s reading DNA.</p>
            {friendTasteRecs.length ? (
              <div className="space-y-2">
                {friendTasteRecs.map((b, i) => {
                  const book = b.books_library;
                  const bId = b.book_id || b.id || book?.id;
                  return (
                    <div key={bId || i} className="flex items-center justify-between gap-3 p-2.5 bg-card border border-border rounded-xl">
                      <div className="min-w-0">
                        <p className="font-semibold text-xs sm:text-sm text-foreground truncate">{book?.title ?? "Untitled Book"}</p>
                        <p className="text-[11px] text-muted-foreground truncate">{book?.author ?? "Author Unknown"}{book?.genre && ` · ${book.genre}`}</p>
                      </div>
                      {bId && <Link to={`/book/${bId}`} onClick={() => onOpenChange(false)}><Badge variant="outline" className="shrink-0 gap-1">Details <ArrowRight className="w-3 h-3" /></Badge></Link>}
                    </div>
                  );
                })}
              </div>
            ) : (
              <Card className="border-dashed bg-muted/20"><CardContent className="py-5 text-center text-xs text-muted-foreground">Add more books to your shelf to unlock recommendations for {friendName}.</CardContent></Card>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
export default DnaCompare;
