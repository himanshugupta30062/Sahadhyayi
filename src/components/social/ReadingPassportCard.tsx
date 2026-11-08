import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/authHelpers';
import { useUserBookshelf } from '@/hooks/useUserBookshelf';
import { useReadingStreak } from '@/hooks/useReadingStreak';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  BookOpen,
  Flame,
  Trophy,
  Dna,
  ArrowRight,
  Sparkles,
  BookMarked,
} from 'lucide-react';
import { SocialSurface } from './SocialSurface';

export const ReadingPassportCard: React.FC = () => {
  const { user } = useAuth();
  const { data: bookshelf = [], isLoading: isLoadingShelf } = useUserBookshelf();
  const { data: streakData } = useReadingStreak();

  if (!user) {
    return (
      <SocialSurface className="p-4 border-[#E8E8E3] dark:border-[#29332D]">
        <div className="flex items-center gap-2 mb-2 text-[#1C442D] dark:text-[#D5B16D]">
          <BookMarked className="w-4 h-4" />
          <h3 className="font-serif text-sm font-bold">Reader Passport</h3>
        </div>
        <p className="text-xs text-[#636B65] dark:text-[#A5ADA6] mb-3 leading-relaxed">
          Sign in to track your reading streaks, share book progress, and build your literary identity.
        </p>
        <Link to="/auth?redirect=/social">
          <Button size="sm" className="w-full text-xs h-8 bg-[#1C442D] hover:bg-[#153522] text-white dark:bg-[#D5B16D] dark:text-[#0B0D0C] dark:hover:bg-[#c49f5c]">
            Create Your Passport
          </Button>
        </Link>
      </SocialSurface>
    );
  }

  const currentReads = bookshelf.filter((b) => b.status === 'reading');
  const completedReads = bookshelf.filter((b) => b.status === 'completed');
  const activeBook = currentReads[0];
  const currentStreak = streakData?.current ?? 0;
  const displayName = user.user_metadata?.full_name || user.email?.split('@')[0] || 'Reader';

  return (
    <SocialSurface className="p-4 border-[#E8E8E3] dark:border-[#29332D] shadow-xs">
      {/* Passport Header */}
      <div className="flex items-center justify-between pb-3 mb-3 border-b border-[#E8E8E3] dark:border-[#29332D]">
        <div className="flex items-center gap-2.5 min-w-0">
          <Avatar className="h-8 w-8 rounded-lg border border-[#E8E8E3] dark:border-[#29332D]">
            <AvatarImage src={user.user_metadata?.avatar_url} alt={displayName} />
            <AvatarFallback className="text-xs bg-[#EBF2EC] text-[#1C442D] dark:bg-[#1C3024] dark:text-[#D5B16D] font-bold">
              {displayName.slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="font-serif text-xs font-bold truncate text-[#1C201D] dark:text-[#F3F0E7]">
                {displayName}
              </span>
              <Badge className="h-4 px-1 text-[9px] font-mono bg-[#EBF2EC] text-[#1C442D] dark:bg-[#1C3024] dark:text-[#D5B16D] border-0">
                Passport
              </Badge>
            </div>
            <p className="text-[10px] text-[#636B65] dark:text-[#A5ADA6]">
              Sahadhyayi Citizen
            </p>
          </div>
        </div>
        <Link
          to="/profile"
          aria-label="View your full reading profile"
          className="text-[11px] font-semibold text-[#1C442D] dark:text-[#D5B16D] hover:underline flex items-center"
        >
          View <ArrowRight className="w-3 h-3 ml-0.5" />
        </Link>
      </div>

      {/* Currently Reading Focus */}
      {activeBook ? (
        <div className="rounded-xl border border-[#E8E8E3] dark:border-[#29332D]/80 bg-[#FAFAF8] dark:bg-[#16211A]/50 p-2.5 mb-3">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-[#8F681C] dark:text-[#D5B16D] flex items-center gap-1">
              <BookOpen className="w-3 h-3" /> Currently Reading
            </span>
            <span className="text-[10px] font-medium text-[#636B65] dark:text-[#A5ADA6]">
              {activeBook.progress || 0}%
            </span>
          </div>
          <p className="text-xs font-semibold text-[#1C201D] dark:text-[#F3F0E7] truncate">
            {activeBook.book?.title || 'Current Book'}
          </p>
          <p className="text-[11px] text-[#636B65] dark:text-[#A5ADA6] truncate mb-2">
            {activeBook.book?.author || 'Unknown Author'}
          </p>
          <Progress value={activeBook.progress || 10} className="h-1.5" />
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-[#E8E8E3] dark:border-[#29332D] p-3 text-center mb-3">
          <p className="text-xs text-[#636B65] dark:text-[#A5ADA6]">No active book selected.</p>
          <Link to="/library" className="mt-1.5 inline-block text-xs font-semibold text-[#1C442D] dark:text-[#D5B16D] hover:underline">
            Choose a book to read →
          </Link>
        </div>
      )}

      {/* Reading Vitality Metrics */}
      <div className="grid grid-cols-3 gap-1.5 text-center pt-1">
        <div className="rounded-lg bg-[#FAFAF8] dark:bg-[#16211A] p-2 border border-[#E8E8E3] dark:border-[#29332D]">
          <div className="flex items-center justify-center gap-1 text-orange-600 dark:text-orange-400 mb-0.5">
            <Flame className="w-3.5 h-3.5" />
            <span className="font-bold text-xs">{currentStreak}</span>
          </div>
          <p className="text-[10px] text-[#636B65] dark:text-[#A5ADA6]">Day Streak</p>
        </div>

        <div className="rounded-lg bg-[#FAFAF8] dark:bg-[#16211A] p-2 border border-[#E8E8E3] dark:border-[#29332D]">
          <div className="flex items-center justify-center gap-1 text-emerald-600 dark:text-emerald-400 mb-0.5">
            <Trophy className="w-3.5 h-3.5" />
            <span className="font-bold text-xs">{completedReads.length}</span>
          </div>
          <p className="text-[10px] text-[#636B65] dark:text-[#A5ADA6]">Finished</p>
        </div>

        <div className="rounded-lg bg-[#FAFAF8] dark:bg-[#16211A] p-2 border border-[#E8E8E3] dark:border-[#29332D]">
          <div className="flex items-center justify-center gap-1 text-purple-600 dark:text-purple-400 mb-0.5">
            <Dna className="w-3.5 h-3.5" />
            <span className="font-bold text-xs">{bookshelf.length}</span>
          </div>
          <p className="text-[10px] text-[#636B65] dark:text-[#A5ADA6]">On Shelf</p>
        </div>
      </div>
    </SocialSurface>
  );
};

export default ReadingPassportCard;

