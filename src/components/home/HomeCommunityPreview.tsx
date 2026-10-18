import React from 'react';
import { Link } from 'react-router-dom';
import { Users, Radio, Quote, ArrowRight, MessageCircle, BookOpen, Clock, Heart } from 'lucide-react';
import { useGroups, type GroupChat } from '@/hooks/useGroupManagement';
import { useReadingRooms, type ReadingRoom } from '@/hooks/useReadingRoom';
import { useMarginNotes, type MarginNote } from '@/hooks/useMarginNotes';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import HomeFloatingBooks from './HomeFloatingBooks';

export const HomeCommunityPreview: React.FC = () => {
  const { data: rawGroups = [], isLoading: loadingGroups } = useGroups();
  const { data: readingRooms = [], isLoading: loadingRooms } = useReadingRooms();
  const { data: marginNotes = [], isLoading: loadingMargins } = useMarginNotes({ filter: 'all' });

  // Take up to 3 active items each
  const groups = React.useMemo(() => {
    return (rawGroups as GroupChat[]).slice(0, 3);
  }, [rawGroups]);

  const rooms = React.useMemo(() => {
    return (readingRooms as ReadingRoom[]).slice(0, 3);
  }, [readingRooms]);

  const margins = React.useMemo(() => {
    return (marginNotes as MarginNote[]).slice(0, 3);
  }, [marginNotes]);

  return (
    <section
      className="home-community-preview relative isolate py-16 sm:py-20 lg:py-24 px-4 sm:px-6 lg:px-8 bg-[#F8F8F2] dark:bg-[#0B0D0C] text-[#1C201D] dark:text-[#F3F0E7] transition-colors duration-300 overflow-hidden"
      aria-label="Community Preview"
    >
      <HomeFloatingBooks placement="section" />
      <style>{`
        @keyframes homeCommunityGlowDrift {
          0%, 100% { transform: translate3d(0, 0, 0) scale(1); }
          50% { transform: translate3d(20px, -12px, 0) scale(1.06); }
        }
        .home-community-glow { animation: homeCommunityGlowDrift 24s ease-in-out infinite; }
        .home-community-glow-delayed { animation-delay: -12s; }
        @media (prefers-reduced-motion: reduce) { .home-community-glow { animation: none; } }
      `}</style>
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden dark:hidden">
        <div className="home-community-glow absolute -right-24 top-8 h-80 w-80 rounded-full bg-[#C9DCF5]/60 blur-[95px]" />
        <div className="home-community-glow home-community-glow-delayed absolute -left-24 bottom-[-9rem] h-72 w-72 rounded-full bg-[#E4D6F5]/40 blur-[90px]" />
      </div>
      <div className="relative z-10 max-w-7xl mx-auto">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-12">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white dark:bg-[#161D19] border border-[#D8E3F0] dark:border-[#29332D] text-xs font-semibold text-[#1C442D] dark:text-[#D5B16D] mb-4 shadow-2xs">
              <Users className="w-3.5 h-3.5 text-[#1C442D] dark:text-[#D5B16D]" />
              <span>Living Reader Network</span>
            </div>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-serif font-bold text-[#1C201D] dark:text-[#F3F0E7] tracking-tight">
              Reading is better together
            </h2>
            <p className="mt-2.5 text-sm sm:text-base text-[#636B65] dark:text-[#A5ADA6] leading-relaxed">
              Share what you're reading, exchange ideas, and find people who see the world through books.
            </p>
          </div>

          <Link
            to="/social"
            className="inline-flex items-center gap-2 text-xs sm:text-sm font-semibold text-[#1C442D] hover:text-[#2D5A40] dark:text-[#D5B16D] dark:hover:text-[#e4c688] transition-colors self-start md:self-end group"
          >
            <span>Explore full community</span>
            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>

        {/* 3-Column Editorial Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
          {/* Pillar 1: Reading Groups */}
          <div className="flex flex-col rounded-2xl bg-white dark:bg-[#111413] border border-[#D8E3F0] dark:border-[#26302A] p-6 sm:p-7 shadow-[0_2px_12px_rgba(28,32,29,0.04)] dark:shadow-xs transition-colors duration-200">
            <div className="flex items-center justify-between pb-4 border-b border-[#D8E3F0] dark:border-[#26302A] mb-5">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-[#EBF2EC] dark:bg-[#181C1A] text-[#1C442D] dark:text-[#D5B16D] border border-[#C8DBCB] dark:border-[#2B352E] flex items-center justify-center">
                  <Users className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#1C201D] dark:text-[#F3F0E7] leading-tight">Reading Groups</h3>
                  <p className="text-xs text-[#636B65] dark:text-[#A5ADA6]">Book circles & clubs</p>
                </div>
              </div>
              <Link
                to="/groups"
                className="text-xs font-semibold text-[#1C442D] dark:text-[#D5B16D] hover:underline transition-colors"
              >
                Browse all
              </Link>
            </div>

            {/* List / Loading / Empty */}
            <div className="flex-1 flex flex-col justify-between space-y-3.5">
              {loadingGroups ? (
                <div className="space-y-3">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="p-3.5 rounded-xl bg-[#F1F6FC] dark:bg-[#161D19] border border-[#D8E3F0] dark:border-[#29332D]/60 animate-pulse space-y-2">
                      <div className="h-4 bg-[#E8E2D9] dark:bg-[#212C24] rounded w-3/5" />
                      <div className="h-3 bg-[#E8E2D9] dark:bg-[#212C24] rounded w-4/5" />
                    </div>
                  ))}
                </div>
              ) : groups.length === 0 ? (
                <div className="py-8 px-4 text-center rounded-xl bg-[#F1F6FC] dark:bg-[#161D19]/40 border border-dashed border-[#D8E3F0] dark:border-[#29332D]">
                  <Users className="w-8 h-8 text-[#636B65]/60 dark:text-[#A5ADA6]/60 mx-auto mb-2.5" />
                  <p className="text-xs font-medium text-[#1C201D] dark:text-[#F3F0E7]">No groups created yet</p>
                  <p className="text-[11px] text-[#636B65] dark:text-[#A5ADA6] mt-1 mb-4">
                    Be the first reader to start a discussion circle for your favorite genre.
                  </p>
                  <Link to="/groups">
                    <Button size="sm" variant="outline" className="text-xs border-[#D8E3F0] dark:border-[#29332D] bg-white dark:bg-[#161D19] text-[#1C201D] dark:text-[#F3F0E7] hover:bg-[#E8F0F9] dark:hover:bg-[#1C2620]">
                      Explore Groups
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="space-y-3">
                  {groups.map((group) => {
                    const memberCount = (group as any).group_members?.[0]?.count ?? group.member_count ?? 1;
                    return (
                      <Link
                        key={group.id}
                        to={`/groups`}
                        className="group block p-3.5 rounded-xl bg-[#F1F6FC] hover:bg-[#E8F0F9] dark:bg-[#161D19]/60 dark:hover:bg-[#1B251F] border border-[#D8E3F0] hover:border-[#B7CBE3] dark:border-[#29332D] dark:hover:border-[#334E3C] transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B68A35] dark:focus-visible:ring-[#D5B16D]"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <h4 className="text-sm font-semibold text-[#1C201D] dark:text-[#F3F0E7] group-hover:text-[#1C442D] dark:group-hover:text-[#D5B16D] transition-colors line-clamp-1">
                            {group.name}
                          </h4>
                          <span className="shrink-0 text-[10px] font-medium text-[#636B65] dark:text-[#A5ADA6] bg-white dark:bg-[#111614] px-2 py-0.5 rounded-full border border-[#D8E3F0] dark:border-[#29332D]">
                            {memberCount} {memberCount === 1 ? 'member' : 'members'}
                          </span>
                        </div>
                        {group.description && (
                          <p className="text-xs text-[#636B65] dark:text-[#A5ADA6] mt-1.5 line-clamp-2 leading-relaxed">
                            {group.description}
                          </p>
                        )}
                        <div className="flex items-center justify-between mt-2.5 pt-2 border-t border-[#D8E3F0] dark:border-[#29332D]/40">
                          <span className="text-[11px] text-[#636B65]/70 dark:text-[#A5ADA6]/70">Discussion circle</span>
                          <span className="text-[11px] font-semibold text-[#1C442D] dark:text-[#D5B16D] group-hover:underline flex items-center gap-1">
                            View group <ArrowRight className="w-3 h-3 transition-transform group-hover:translate-x-0.5" />
                          </span>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              )}

              <div className="pt-3 border-t border-[#D8E3F0] dark:border-[#29332D]/40">
                <Link
                  to="/groups"
                  className="inline-flex items-center gap-1.5 text-xs font-medium text-[#636B65] hover:text-[#1C201D] dark:text-[#A5ADA6] dark:hover:text-[#F3F0E7] transition-colors group"
                >
                  <span>Explore reading groups</span>
                  <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
                </Link>
              </div>
            </div>
          </div>

          {/* Pillar 2: Live Reading Rooms */}
          <div className="flex flex-col rounded-2xl bg-white dark:bg-[#111413] border border-[#D8E3F0] dark:border-[#26302A] p-6 sm:p-7 shadow-[0_2px_12px_rgba(28,32,29,0.04)] dark:shadow-xs transition-colors duration-200">
            <div className="flex items-center justify-between pb-4 border-b border-[#D8E3F0] dark:border-[#26302A] mb-5">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-[#EBF2EC] dark:bg-[#181C1A] text-emerald-600 dark:text-emerald-400 border border-[#C8DBCB] dark:border-[#26382E] flex items-center justify-center relative">
                  <Radio className="w-4 h-4" />
                  <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#1C201D] dark:text-[#F3F0E7] leading-tight">Live Reading Sprints</h3>
                  <p className="text-xs text-[#636B65] dark:text-[#A5ADA6]">Silent co-reading rooms</p>
                </div>
              </div>
              <Link
                to="/social?tab=rooms"
                className="text-xs font-semibold text-[#1C442D] dark:text-[#D5B16D] hover:underline transition-colors"
              >
                Join sprint
              </Link>
            </div>

            {/* List / Loading / Empty */}
            <div className="flex-1 flex flex-col justify-between space-y-3.5">
              {loadingRooms ? (
                <div className="space-y-3">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="p-3.5 rounded-xl bg-[#F1F6FC] dark:bg-[#161D19] border border-[#D8E3F0] dark:border-[#29332D]/60 animate-pulse space-y-2">
                      <div className="h-4 bg-[#E8E2D9] dark:bg-[#212C24] rounded w-3/5" />
                      <div className="h-3 bg-[#E8E2D9] dark:bg-[#212C24] rounded w-4/5" />
                    </div>
                  ))}
                </div>
              ) : rooms.length === 0 ? (
                <div className="py-8 px-4 text-center rounded-xl bg-[#F1F6FC] dark:bg-[#141816]/60 border border-dashed border-[#D8E3F0] dark:border-[#26302A]">
                  <Clock className="w-8 h-8 text-[#636B65]/60 dark:text-[#A5ADA6]/60 mx-auto mb-2.5" />
                  <p className="text-xs font-medium text-[#1C201D] dark:text-[#F3F0E7]">No live sprint running right now</p>
                  <p className="text-[11px] text-[#636B65] dark:text-[#A5ADA6] mt-1 mb-4">
                    Open a room for any book in your library and invite fellow readers to sprint with you.
                  </p>
                  <Link to="/social?tab=rooms">
                    <Button size="sm" variant="outline" className="text-xs border-[#D8E3F0] dark:border-[#26302A] bg-white dark:bg-[#141816] text-[#1C201D] dark:text-[#F3F0E7] hover:bg-[#E8F0F9] dark:hover:bg-[#1C221F]">
                      Open Reading Room
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="space-y-3">
                  {rooms.map((room) => {
                    const book = room.books_library;
                    return (
                      <Link
                        key={room.id}
                        to={`/social?tab=rooms`}
                        className="group block p-3.5 rounded-xl bg-[#F1F6FC] hover:bg-[#E8F0F9] dark:bg-[#141816] dark:hover:bg-[#19201C] border border-[#D8E3F0] hover:border-[#B7CBE3] dark:border-[#26302A] dark:hover:border-[#38483D] transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B68A35] dark:focus-visible:ring-[#D5B16D]"
                      >
                        <div className="flex items-center gap-2 mb-1.5">
                          <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                          <h4 className="text-sm font-semibold text-[#1C201D] dark:text-[#F3F0E7] group-hover:text-[#1C442D] dark:group-hover:text-[#D5B16D] transition-colors truncate">
                            {room.name}
                          </h4>
                        </div>
                        {book ? (
                          <div className="flex items-center gap-2 text-xs text-[#636B65] dark:text-[#A5ADA6]">
                            <BookOpen className="w-3.5 h-3.5 text-[#B68A35] dark:text-[#D5B16D] shrink-0" />
                            <span className="truncate">{book.title}</span>
                            {book.author && <span className="text-[#636B65]/70 dark:text-[#A5ADA6]/60 shrink-0">· {book.author}</span>}
                          </div>
                        ) : (
                          <p className="text-xs text-[#636B65] dark:text-[#A5ADA6]">Open co-reading sprint</p>
                        )}
                      </Link>
                    );
                  })}
                </div>
              )}

              <div className="pt-3 border-t border-[#D8E3F0] dark:border-[#26302A]">
                <Link
                  to="/social?tab=rooms"
                  className="inline-flex items-center gap-1.5 text-xs font-medium text-[#636B65] hover:text-[#1C201D] dark:text-[#A5ADA6] dark:hover:text-[#F3F0E7] transition-colors group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B68A35] dark:focus-visible:ring-[#D5B16D] rounded"
                >
                  <span>See all reading rooms</span>
                  <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
                </Link>
              </div>
            </div>
          </div>

          {/* Pillar 3: Reader Marginalia */}
          <div className="flex flex-col rounded-2xl bg-white dark:bg-[#111413] border border-[#D8E3F0] dark:border-[#26302A] p-6 sm:p-7 shadow-[0_2px_12px_rgba(28,32,29,0.04)] dark:shadow-xs transition-colors duration-200">
            <div className="flex items-center justify-between pb-4 border-b border-[#D8E3F0] dark:border-[#26302A] mb-5">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-[#FBF4E6] dark:bg-[#1D1B16] text-[#B68A35] dark:text-[#D5B16D] border border-[#E8D9BF] dark:border-[#383020] flex items-center justify-center">
                  <Quote className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#1C201D] dark:text-[#F3F0E7] leading-tight">Public Marginalia</h3>
                  <p className="text-xs text-[#636B65] dark:text-[#A5ADA6]">Notes from the margins</p>
                </div>
              </div>
              <Link
                to="/social?tab=margins"
                className="text-xs font-semibold text-[#1C442D] dark:text-[#D5B16D] hover:underline transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B68A35] dark:focus-visible:ring-[#D5B16D] rounded"
              >
                View notes
              </Link>
            </div>

            {/* List / Loading / Empty */}
            <div className="flex-1 flex flex-col justify-between space-y-3.5">
              {loadingMargins ? (
                <div className="space-y-3">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="p-3.5 rounded-xl bg-[#F1F6FC] dark:bg-[#161D19] border border-[#D8E3F0] dark:border-[#29332D]/60 animate-pulse space-y-2">
                      <div className="h-4 bg-[#E8E2D9] dark:bg-[#212C24] rounded w-3/5" />
                      <div className="h-3 bg-[#E8E2D9] dark:bg-[#212C24] rounded w-4/5" />
                    </div>
                  ))}
                </div>
              ) : margins.length === 0 ? (
                <div className="py-8 px-4 text-center rounded-xl bg-[#F1F6FC] dark:bg-[#141816]/60 border border-dashed border-[#D8E3F0] dark:border-[#26302A]">
                  <Quote className="w-8 h-8 text-[#636B65]/60 dark:text-[#A5ADA6]/60 mx-auto mb-2.5" />
                  <p className="text-xs font-medium text-[#1C201D] dark:text-[#F3F0E7]">No public margin notes yet</p>
                  <p className="text-[11px] text-[#636B65] dark:text-[#A5ADA6] mt-1 mb-4">
                    Leave your impressions and highlighted quotes as you read through books.
                  </p>
                  <Link to="/social?tab=margins">
                    <Button size="sm" variant="outline" className="text-xs border-[#D8E3F0] dark:border-[#26302A] bg-white dark:bg-[#141816] text-[#1C201D] dark:text-[#F3F0E7] hover:bg-[#E8F0F9] dark:hover:bg-[#1C221F]">
                      Browse Margins
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="space-y-3">
                  {margins.map((note) => {
                    const authorName = note.profiles?.full_name || note.profiles?.username || 'Reader';
                    return (
                      <Link
                        key={note.id}
                        to={`/social?tab=margins`}
                        className="group block p-3.5 rounded-xl bg-[#F1F6FC] hover:bg-[#E8F0F9] dark:bg-[#141816] dark:hover:bg-[#1C1813] border border-[#D8E3F0] hover:border-[#B7CBE3] dark:border-[#26302A] dark:hover:border-[#D5B16D]/40 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B68A35] dark:focus-visible:ring-[#D5B16D]"
                      >
                        <p className="text-xs italic font-serif text-[#1C201D]/90 dark:text-[#F3F0E7]/90 line-clamp-2 leading-relaxed border-l-2 border-[#B68A35] dark:border-[#D5B16D]/50 pl-2.5 mb-2">
                          "{note.quote}"
                        </p>
                        <div className="flex items-center justify-between text-[11px] text-[#636B65] dark:text-[#A5ADA6]">
                          <span className="truncate text-[#1C442D] dark:text-[#D5B16D]">
                            {note.books_library?.title || 'Book note'}
                            {note.page ? ` · p. ${note.page}` : ''}
                          </span>
                          <span className="text-[#636B65]/70 dark:text-[#A5ADA6]/70 shrink-0 ml-2">by {authorName}</span>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              )}

              <div className="pt-3 border-t border-[#D8E3F0] dark:border-[#26302A]">
                <Link
                  to="/social?tab=margins"
                  className="inline-flex items-center gap-1.5 text-xs font-medium text-[#636B65] hover:text-[#1C201D] dark:text-[#A5ADA6] dark:hover:text-[#F3F0E7] transition-colors group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B68A35] dark:focus-visible:ring-[#D5B16D] rounded"
                >
                  <span>Explore all margin notes</span>
                  <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HomeCommunityPreview;

