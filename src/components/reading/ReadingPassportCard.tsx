import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Compass,
  BookMarked,
  FileText,
  Flame,
  Award,
  Share2,
  Check,
  Sparkles,
} from 'lucide-react';
import { toast } from '@/components/ui/use-toast';

interface ReadingPassportCardProps {
  displayName: string;
  avatarUrl?: string;
  completedBooksCount: number;
  totalLoggedPages: number;
  currentStreakDays: number;
  topGenres: string[];
  badgesCount: number;
  className?: string;
}

export const ReadingPassportCard: React.FC<ReadingPassportCardProps> = ({
  displayName,
  avatarUrl,
  completedBooksCount,
  totalLoggedPages,
  currentStreakDays,
  topGenres,
  badgesCount,
  className = '',
}) => {
  const [copied, setCopied] = useState<boolean>(false);

  const passportSummary = `🛂 Sahadhyayi Reading Passport for ${displayName}:
📚 ${completedBooksCount} books finished
📄 ${totalLoggedPages.toLocaleString()} pages read
🔥 ${currentStreakDays}-day streak
🏆 ${badgesCount} reading achievements
✨ Genres: ${topGenres.slice(0, 3).join(', ') || 'Discovering'}
Join my reading journey on https://sahadhyayi.com`;

  const handleCopy = async () => {
    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(passportSummary);
        setCopied(true);
        toast({ title: 'Passport Copied!', description: 'Your reading passport summary is ready to share.' });
        setTimeout(() => setCopied(false), 2500);
      }
    } catch {
      toast({ title: 'Copy failed', description: 'Could not copy to clipboard.' });
    }
  };

  return (
    <Card className={`overflow-hidden border-2 border-primary/30 bg-gradient-to-br from-card via-primary/5 to-amber-500/10 shadow-md ${className}`}>
      {/* Top Passport Ribbon */}
      <div className="bg-primary px-4 py-2 text-primary-foreground flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Compass className="w-4 h-4" />
          <span className="text-xs font-bold uppercase tracking-widest">
            Official Reader Passport
          </span>
        </div>
        <span className="text-[10px] font-semibold opacity-90">
          Sahadhyayi Reading Community
        </span>
      </div>

      <CardContent className="p-5 space-y-4">
        {/* User identification */}
        <div className="flex items-center gap-3">
          <div className="w-14 h-14 rounded-full overflow-hidden border-2 border-primary/40 bg-muted shrink-0 flex items-center justify-center font-bold text-lg text-primary shadow-xs">
            {avatarUrl ? (
              <img src={avatarUrl} alt={displayName} className="w-full h-full object-cover" />
            ) : (
              <span>{displayName.slice(0, 2).toUpperCase()}</span>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="font-bold text-base text-foreground truncate">{displayName}</h3>
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-amber-500" />
              Verified Community Reader
            </p>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={handleCopy}
            className="h-8 gap-1.5 text-xs border-primary/30 text-foreground shrink-0"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Share2 className="w-3.5 h-3.5 text-primary" />}
            {copied ? 'Copied' : 'Share Passport'}
          </Button>
        </div>

        {/* 4 Visa-style metric stamps */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          <div className="rounded-xl border border-dashed border-primary/40 bg-card p-3 text-center">
            <div className="flex items-center justify-center text-primary mb-1">
              <BookMarked className="w-4 h-4" />
            </div>
            <p className="text-lg font-bold text-foreground">{completedBooksCount}</p>
            <p className="text-[10px] text-muted-foreground uppercase font-semibold">Books Read</p>
          </div>

          <div className="rounded-xl border border-dashed border-primary/40 bg-card p-3 text-center">
            <div className="flex items-center justify-center text-emerald-500 mb-1">
              <FileText className="w-4 h-4" />
            </div>
            <p className="text-lg font-bold text-foreground">{totalLoggedPages.toLocaleString()}</p>
            <p className="text-[10px] text-muted-foreground uppercase font-semibold">Pages Read</p>
          </div>

          <div className="rounded-xl border border-dashed border-primary/40 bg-card p-3 text-center">
            <div className="flex items-center justify-center text-amber-500 mb-1">
              <Flame className="w-4 h-4 fill-current" />
            </div>
            <p className="text-lg font-bold text-foreground">{currentStreakDays}d</p>
            <p className="text-[10px] text-muted-foreground uppercase font-semibold">Active Streak</p>
          </div>

          <div className="rounded-xl border border-dashed border-primary/40 bg-card p-3 text-center">
            <div className="flex items-center justify-center text-purple-500 mb-1">
              <Award className="w-4 h-4" />
            </div>
            <p className="text-lg font-bold text-foreground">{badgesCount}</p>
            <p className="text-[10px] text-muted-foreground uppercase font-semibold">Badges Earned</p>
          </div>
        </div>

        {/* Top Genre Visa Stamps */}
        {topGenres.length > 0 && (
          <div className="pt-2 border-t border-border/50">
            <span className="text-[11px] font-semibold text-muted-foreground block mb-2">
              Explored Territories (Top Genres):
            </span>
            <div className="flex flex-wrap gap-1.5">
              {topGenres.slice(0, 5).map((genre) => (
                <Badge
                  key={genre}
                  variant="secondary"
                  className="text-xs px-2.5 py-0.5 rounded-md border border-primary/20 bg-primary/10 text-primary font-medium"
                >
                  {genre}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ReadingPassportCard;
