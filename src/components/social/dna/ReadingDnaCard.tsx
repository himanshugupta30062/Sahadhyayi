import React from "react";
import { ReadingDna } from "@/lib/readingDna";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dna, Compass, Zap, Tag } from "lucide-react";

interface ReadingDnaCardProps {
  dna: ReadingDna;
  mine?: boolean;
}

export const DnaStrip: React.FC<{ dna: ReadingDna }> = ({ dna }) => {
  const total = dna.genres.reduce((s, g) => s + g.weight, 0) || 1;
  return (
    <div
      className="flex h-3.5 rounded-full overflow-hidden border border-border shadow-inner bg-muted"
      title={dna.genres.map((g) => `${g.name} (${Math.round((g.weight / total) * 100)}%)`).join(" · ")}
    >
      {dna.genres.length === 0 && <div className="flex-1 bg-muted" />}
      {dna.genres.map((g, i) => (
        <div
          key={g.name + i}
          style={{
            width: `${(g.weight / total) * 100}%`,
            background: `hsl(${(i * 58 + 25) % 360} 75% 55%)`,
          }}
          className="transition-all hover:opacity-90"
        />
      ))}
    </div>
  );
};

export const ReadingDnaCard: React.FC<ReadingDnaCardProps> = ({ dna, mine = false }) => {
  return (
    <Card className="overflow-hidden border-border bg-card shadow-sm">
      <CardContent className="p-5 sm:p-6 space-y-4">
        {/* Header with Signature Color and Summary */}
        <div className="flex items-start gap-3.5">
          <div
            className="w-12 h-12 rounded-2xl flex items-center justify-center text-white shrink-0 shadow-md"
            style={{ background: dna.signature_color ?? "#f59e0b" }}
          >
            <Dna className="w-6 h-6" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="text-base font-semibold text-foreground">
                {mine ? "Your Reading DNA" : "Reader DNA Profile"}
              </h3>
              <Badge variant="outline" className="text-[10px] uppercase font-mono">
                {dna.pace ?? "Steady"}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
              {dna.summary ?? "A unique literary profile shaped by read books and favorites."}
            </p>
          </div>
        </div>

        {/* Colorful Taste Strip */}
        <div className="space-y-1.5 pt-1">
          <div className="flex justify-between items-center text-[11px] text-muted-foreground">
            <span className="font-semibold uppercase tracking-wider">Taste Spectrum</span>
            <span>{dna.genres.length} genres identified</span>
          </div>
          <DnaStrip dna={dna} />
        </div>

        {/* Detailed DNA Traits Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-2 text-xs">
          {/* Top Genres */}
          <div className="bg-muted/30 p-3 rounded-xl border border-border/50 space-y-1.5">
            <p className="font-semibold text-foreground flex items-center gap-1.5 text-xs">
              <Compass className="w-3.5 h-3.5 text-brand-primary" />
              Dominant Genres
            </p>
            <div className="flex flex-wrap gap-1">
              {dna.genres.slice(0, 5).map((g) => (
                <Badge
                  key={g.name}
                  variant="secondary"
                  className="text-[10px] px-2 py-0.5 font-normal bg-background"
                >
                  {g.name} <span className="text-[9px] text-muted-foreground ml-1">{Math.round(g.weight * 100)}%</span>
                </Badge>
              ))}
              {dna.genres.length === 0 && <span className="text-muted-foreground text-xs">—</span>}
            </div>
          </div>

          {/* Moods */}
          <div className="bg-muted/30 p-3 rounded-xl border border-border/50 space-y-1.5">
            <p className="font-semibold text-foreground flex items-center gap-1.5 text-xs">
              <Zap className="w-3.5 h-3.5 text-amber-500" />
              Dominant Moods
            </p>
            <div className="flex flex-wrap gap-1">
              {dna.moods.slice(0, 5).map((m) => (
                <Badge
                  key={m}
                  variant="outline"
                  className="text-[10px] px-2 py-0.5 font-normal border-amber-500/30 text-amber-800 dark:text-amber-200"
                >
                  {m}
                </Badge>
              ))}
              {dna.moods.length === 0 && <span className="text-muted-foreground text-xs">—</span>}
            </div>
          </div>

          {/* Pace */}
          <div className="bg-muted/30 p-3 rounded-xl border border-border/50 space-y-1">
            <p className="font-semibold text-foreground text-xs">Reading Pace</p>
            <p className="text-xs text-muted-foreground capitalize font-medium">{dna.pace ?? "Steady"}</p>
          </div>

          {/* Themes */}
          <div className="bg-muted/30 p-3 rounded-xl border border-border/50 space-y-1.5">
            <p className="font-semibold text-foreground flex items-center gap-1.5 text-xs">
              <Tag className="w-3.5 h-3.5 text-indigo-500" />
              Recurring Themes
            </p>
            <div className="flex flex-wrap gap-1">
              {dna.themes.slice(0, 4).map((t) => (
                <Badge key={t} variant="outline" className="text-[10px] px-1.5 py-0 font-normal">
                  {t}
                </Badge>
              ))}
              {dna.themes.length === 0 && <span className="text-muted-foreground text-xs">—</span>}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
export default ReadingDnaCard;
