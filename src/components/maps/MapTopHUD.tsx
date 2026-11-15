import React from 'react';
import { Eye, EyeOff, Search, Sparkles, UserRound, Compass, Users, BookOpen } from 'lucide-react';
import type { MapMode } from '@/types/mapExplore';

interface MapTopHUDProps {
  mode: MapMode;
  onModeChange: (mode: MapMode) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  isSharing: boolean;
  onToggleSharing: () => void;
  onOpenAvatarModal: () => void;
  userAvatarUrl?: string | null;
  readersCount?: number;
  friendsCount?: number;
  exploreCount?: number;
}

export const MapTopHUD: React.FC<MapTopHUDProps> = ({
  mode,
  onModeChange,
  searchQuery,
  onSearchChange,
  isSharing,
  onToggleSharing,
  onOpenAvatarModal,
  userAvatarUrl,
  readersCount = 0,
  friendsCount = 0,
  exploreCount = 0,
}) => {
  return (
    <header className="flex flex-col gap-2.5 w-full max-w-4xl mx-auto px-2 pointer-events-auto select-none" role="banner">
      {/* Top Bar: Search + Ghost Mode + Bitmoji Avatar */}
      <div className="flex items-center gap-2 bg-white/90 dark:bg-[#111614]/90 backdrop-blur-md border border-[#E5DED2] dark:border-[#29332D] rounded-2xl p-2 shadow-sm">
        {/* Search Field */}
        <div className="relative flex-1 min-w-0">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
          <input
            type="search"
            aria-label="Search map"
            placeholder={
              mode === 'explore'
                ? 'Search libraries, bookstores, events...'
                : mode === 'readers'
                  ? 'Filter by book title or author...'
                  : 'Search friends...'
            }
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs sm:text-sm bg-transparent border-0 rounded-xl focus:outline-none focus:ring-1 focus:ring-[#1C442D] dark:focus:ring-[#D5B16D] placeholder:text-muted-foreground"
          />
        </div>

        {/* Ghost Mode Toggle Pill */}
        <button
          type="button"
          onClick={onToggleSharing}
          title={isSharing ? 'Sharing is active. Click to switch to Ghost Mode.' : 'Ghost Mode is active. Click to enable location sharing.'}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-semibold border transition shrink-0 cursor-pointer ${
            isSharing
              ? 'border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-300'
              : 'border-slate-200 bg-slate-50 text-slate-700 dark:border-slate-800 dark:bg-slate-900/40 dark:text-slate-300'
          }`}
        >
          {isSharing ? (
            <>
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span className="hidden sm:inline">Sharing</span>
              <Eye className="w-3.5 h-3.5 sm:hidden text-emerald-600" />
            </>
          ) : (
            <>
              <EyeOff className="w-3.5 h-3.5 text-slate-500" />
              <span className="hidden sm:inline">Ghost Mode</span>
            </>
          )}
        </button>

        {/* User Avatar / Bitmoji Button */}
        <button
          type="button"
          onClick={onOpenAvatarModal}
          title="Customize your reading Bitmoji or photo"
          className="relative h-8 w-8 sm:h-9 sm:w-9 rounded-full overflow-hidden border-2 border-[#D5B16D] bg-[#E8EFE9] dark:bg-[#1C3024] shrink-0 transition-transform active:scale-95 shadow-xs cursor-pointer"
        >
          {userAvatarUrl ? (
            <img src={userAvatarUrl} alt="Your reading avatar" className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-[#1C442D] dark:text-[#D5B16D]">
              <UserRound className="w-4 h-4" />
            </div>
          )}
        </button>
      </div>

      {/* Segmented Mode Selector: Explore | Readers | Friends */}
      <nav aria-label="Map discovery modes" className="grid grid-cols-3 gap-1 bg-white/80 dark:bg-[#111614]/80 backdrop-blur-md border border-[#E5DED2] dark:border-[#29332D] rounded-xl p-1 shadow-xs">
        <button
          type="button"
          onClick={() => onModeChange('explore')}
          className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg text-xs font-bold transition ${
            mode === 'explore'
              ? 'bg-[#1C442D] text-white shadow-xs'
              : 'text-[#687067] dark:text-[#A5ADA6] hover:bg-black/5 dark:hover:bg-white/5'
          }`}
        >
          <Compass className="w-3.5 h-3.5" />
          <span>Explore</span>
          {exploreCount > 0 && <span className="opacity-75 text-[10px]">({exploreCount})</span>}
        </button>

        <button
          type="button"
          onClick={() => onModeChange('readers')}
          className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg text-xs font-bold transition ${
            mode === 'readers'
              ? 'bg-[#1C442D] text-white shadow-xs'
              : 'text-[#687067] dark:text-[#A5ADA6] hover:bg-black/5 dark:hover:bg-white/5'
          }`}
        >
          <BookOpen className="w-3.5 h-3.5" />
          <span>Readers</span>
          {readersCount > 0 && <span className="opacity-75 text-[10px]">({readersCount})</span>}
        </button>

        <button
          type="button"
          onClick={() => onModeChange('friends')}
          className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg text-xs font-bold transition ${
            mode === 'friends'
              ? 'bg-[#1C442D] text-white shadow-xs'
              : 'text-[#687067] dark:text-[#A5ADA6] hover:bg-black/5 dark:hover:bg-white/5'
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          <span>Friends</span>
          {friendsCount > 0 && <span className="opacity-75 text-[10px]">({friendsCount})</span>}
        </button>
      </nav>
    </header>
  );
};
