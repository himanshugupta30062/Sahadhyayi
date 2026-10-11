import React from 'react';
import { Link } from 'react-router-dom';
import { Users, Radio, Quote, ArrowRight, MessageCircle, BookOpen, Clock, Heart } from 'lucide-react';
import { useGroups, type GroupChat } from '@/hooks/useGroupManagement';
import { useReadingRooms, type ReadingRoom } from '@/hooks/useReadingRoom';
import { useMarginNotes, type MarginNote } from '@/hooks/useMarginNotes';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';

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
      className="py-16 sm:py-20 lg:py-24 px-4 sm:px-6 lg:px-8 bg-[#0B0D0C] border-b border-[#29332D] text-[#F3F0E7]"
      aria-label="Community Preview"
    >
      <div className="max-w-7xl mx-auto">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-12">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#161D19] border border-[#29332D] text-xs font-semibold text-[#D5B16D] mb-4">
              <Users className="w-3.5 h-3.5" />
              <span>Living Reader Network</span>
            </div>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-serif font-bold text-[#F3F0E7] tracking-tight">
              Reading is better together
            </h2>
            <p className="mt-2.5 text-sm sm:text-base text-[#A5ADA6] leading-relaxed">
              Share what you're reading, exchange ideas, and find people who see the world through books.
            </p>
          </div>

          <Link
            to="/social"
            className="inline-flex items-center gap-2 text-xs sm:text-sm font-semibold text-[#D5B16D] hover:text-[#e4c688] transition-colors self-start md:self-end group"
          >
            <span>Explore full community</span>
            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>

        {/* 3-Column Editorial Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Pillar 1: Reading Groups */}
          <div className="flex flex-col rounded-2xl bg-[#111614] border border-[#29332D] p-6 sm:p-7 shadow-xs">
            <div className="flex items-center justify-between pb-4 border-b border-[#29332D]/70 mb-5">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-[#1A251E] text-[#D5B16D] border border-[#2B3F32] flex items-center justify-center">
                  <Users className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#F3F0E7] leading-tight">Reading Groups</h3>
                  <p className="text-xs text-[#A5ADA6]">Book circles & clubs</p>
                </div>
              </div>
              <Link
                to="/groups"
                className="text-xs font-semibold text-[#D5B16D] hover:text-[#e4c688] transition-colors"
              >
                Browse all
              </Link>
            </div>

            {/* List / Loading / Empty */}
            <div className="flex-1 flex flex-col justify-between space-y-3.5">
              {loadingGroups ? (
                <div className="space-y-3">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="p-3.5 rounded-xl bg-[#161D19] border border-[#29332D]/60 animate-pulse space-y-2">
                      <div className="h-4 bg-[#212C24] rounded w-3/5" />
                      <div className="h-3 bg-[#212C24] rounded w-4/5" />
                    </div>
                  ))}
                </div>
              ) : groups.length === 0 ? (
                <div className="py-8 px-4 text-center rounded-xl bg-[#161D19]/40 border border-dashed border-[#29332D]">
                  <Users className="w-8 h-8 text-[#A5ADA6]/60 mx-auto mb-2.5" />
                  <p className="text-xs font-medium text-[#F3F0E7]">No groups created yet</p>
                  <p className="text-[11px] text-[#A5ADA6] mt-1 mb-4">
                    Be the first reader to start a discussion circle for your favorite genre.
                  </p>
                  <Link to="/groups">
                    <Button size="sm" variant="outline" className="text-xs border-[#29332D] bg-[#161D19] text-[#F3F0E7] hover:bg-[#1C2620]">
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
                        className="group block p-3.5 rounded-xl bg-[#161D19]/60 hover:bg-[#1B251F] border border-[#29332D] hover:border-[#334E3C] transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D5B16D]"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <h4 className="text-sm font-semibold text-[#F3F0E7] group-hover:text-[#D5B16D] transition-colors line-clamp-1">
                            {group.name}
                          </h4>
                          <span className="shrink-0 text-[10px] font-medium text-[#A5ADA6] bg-[#111614] px-2 py-0.5 rounded-full border border-[#29332D]">
                            {memberCount} {memberCount === 1 ? 'member' : 'members'}
                          </span>
                        </div>
                        {group.description && (
                          <p className="text-xs text-[#A5ADA6] mt-1.5 line-clamp-2 leading-relaxed">
                            {group.description}
                          </p>
                        )}
                        <div className="flex items-center justify-between mt-2.5 pt-2 border-t border-[#29332D]/40">
                          <span className="text-[11px] text-[#A5ADA6]/70">Discussion circle</span>
                          <span className="text-[11px] font-semibold text-[#D5B16D] group-hover:text-[#e4c688] flex items-center gap-1">
                            View group <ArrowRight className="w-3 h-3 transition-transform group-hover:translate-x-0.5" />
                          </span>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              )}

              <div className="pt-3 border-t border-[#29332D]/40">
                <Link
                  to="/groups"
                  className="inline-flex items-center gap-1.5 text-xs font-medium text-[#A5ADA6] hover:text-[#F3F0E7] transition-colors group"
                >
                  <span>Explore reading groups</span>
                  <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
                </Link>
              </div>
            </div>
          </div>

          {/* Pillar 2: Live Reading Rooms */}
          <div className="flex flex-col rounded-2xl bg-[#111614] border border-[#29332D] p-6 sm:p-7 shadow-xs">
            <div className="flex items-center justify-between pb-4 border-b border-[#29332D]/70 mb-5">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-[#14261B] text-emerald-400 border border-[#254A34] flex items-center justify-center relative">
                  <Radio className="w-4 h-4" />
                  <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#F3F0E7] leading-tight">Live Reading Sprints</h3>
                  <p className="text-xs text-[#A5ADA6]">Silent co-reading rooms</p>
                </div>
              </div>
              <Link
                to="/social?tab=rooms"
                className="text-xs font-semibold text-[#D5B16D] hover:text-[#e4c688] transition-colors"
              >
                Join sprint
              </Link>
            </div>

            {/* List / Loading / Empty */}
            <div className="flex-1 flex flex-col justify-between space-y-3.5">
              {loadingRooms ? (
                <div className="space-y-3">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="p-3.5 rounded-xl bg-[#161D19] border border-[#29332D]/60 animate-pulse space-y-2">
                      <div className="h-4 bg-[#212C24] rounded w-3/5" />
                      <div className="h-3 bg-[#212C24] rounded w-4/5" />
                    </div>
                  ))}
                </div>
              ) : rooms.length === 0 ? (
                <div className="py-8 px-4 text-center rounded-xl bg-[#161D19]/40 border border-dashed border-[#29332D]">
                  <Clock className="w-8 h-8 text-[#A5ADA6]/60 mx-auto mb-2.5" />
                  <p className="text-xs font-medium text-[#F3F0E7]">No live sprint running right now</p>
                  <p className="text-[11px] text-[#A5ADA6] mt-1 mb-4">
                    Open a room for any book in your library and invite fellow readers to sprint with you.
                  </p>
                  <Link to="/social?tab=rooms">
                    <Button size="sm" variant="outline" className="text-xs border-[#29332D] bg-[#161D19] text-[#F3F0E7] hover:bg-[#1C2620]">
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
                        className="group block p-3.5 rounded-xl bg-[#161D19]/60 hover:bg-[#1B251F] border border-[#29332D] hover:border-[#334E3C] transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D5B16D]"
                      >
                        <div className="flex items-center gap-2 mb-1.5">
                          <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" />
                          <h4 className="text-sm font-semibold text-[#F3F0E7] group-hover:text-[#D5B16D] transition-colors truncate">
                            {room.name}
                          </h4>
                        </div>
                        {book ? (
                          <div className="flex items-center gap-2 text-xs text-[#A5ADA6]">
                            <BookOpen className="w-3.5 h-3.5 text-[#D5B16D] shrink-0" />
                            <span className="truncate">{book.title}</span>
                            {book.author && <span className="text-[#A5ADA6]/60 shrink-0">· {book.author}</span>}
                          </div>
                        ) : (
                          <p className="text-xs text-[#A5ADA6]">Open co-reading sprint</p>
                        )}
                      </Link>
                    );
                  })}
                </div>
              )}

              <div className="pt-3 border-t border-[#29332D]/40">
                <Link
                  to="/social?tab=rooms"
                  className="inline-flex items-center gap-1.5 text-xs font-medium text-[#A5ADA6] hover:text-[#F3F0E7] transition-colors group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D5B16D] rounded"
                >
                  <span>See all reading rooms</span>
                  <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
                </Link>
              </div>
            </div>
          </div>

          {/* Pillar 3: Reader Marginalia */}
          <div className="flex flex-col rounded-2xl bg-[#111614] border border-[#29332D] p-6 sm:p-7 shadow-xs">
            <div className="flex items-center justify-between pb-4 border-b border-[#29332D]/70 mb-5">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-[#262117] text-[#D5B16D] border border-[#483B25] flex items-center justify-center">
                  <Quote className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#F3F0E7] leading-tight">Public Marginalia</h3>
                  <p className="text-xs text-[#A5ADA6]">Notes from the margins</p>
                </div>
              </div>
              <Link
                to="/social?tab=margins"
                className="text-xs font-semibold text-[#D5B16D] hover:text-[#e4c688] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D5B16D] rounded"
              >
                View notes
              </Link>
            </div>

            {/* List / Loading / Empty */}
            <div className="flex-1 flex flex-col justify-between space-y-3.5">
              {loadingMargins ? (
                <div className="space-y-3">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="p-3.5 rounded-xl bg-[#161D19] border border-[#29332D]/60 animate-pulse space-y-2">
                      <div className="h-4 bg-[#212C24] rounded w-3/5" />
                      <div className="h-3 bg-[#212C24] rounded w-4/5" />
                    </div>
                  ))}
                </div>
              ) : margins.length === 0 ? (
                <div className="py-8 px-4 text-center rounded-xl bg-[#161D19]/40 border border-dashed border-[#29332D]">
                  <Quote className="w-8 h-8 text-[#A5ADA6]/60 mx-auto mb-2.5" />
                  <p className="text-xs font-medium text-[#F3F0E7]">No public margin notes yet</p>
                  <p className="text-[11px] text-[#A5ADA6] mt-1 mb-4">
                    Leave your impressions and highlighted quotes as you read through books.
                  </p>
                  <Link to="/social?tab=margins">
                    <Button size="sm" variant="outline" className="text-xs border-[#29332D] bg-[#161D19] text-[#F3F0E7] hover:bg-[#1C2620]">
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
                        className="group block p-3.5 rounded-xl bg-[#161D19]/60 hover:bg-[#1B251F] border border-[#29332D] hover:border-[#334E3C] transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D5B16D]"
                      >
                        <p className="text-xs italic font-serif text-[#F3F0E7]/90 line-clamp-2 leading-relaxed border-l-2 border-[#D5B16D]/50 pl-2.5 mb-2">
                          "{note.quote}"
                        </p>
                        <div className="flex items-center justify-between text-[11px] text-[#A5ADA6]">
                          <span className="truncate text-[#D5B16D]">
                            {note.books_library?.title || 'Book note'}
                            {note.page ? ` · p. ${note.page}` : ''}
                          </span>
                          <span className="text-[#A5ADA6]/70 shrink-0 ml-2">by {authorName}</span>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              )}

              <div className="pt-3 border-t border-[#29332D]/40">
                <Link
                  to="/social?tab=margins"
                  className="inline-flex items-center gap-1.5 text-xs font-medium text-[#A5ADA6] hover:text-[#F3F0E7] transition-colors group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D5B16D] rounded"
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

