import React from 'react';
import { Link } from 'react-router-dom';
import {
  MapPin,
  Compass,
  Radio,
  Quote,
  Users,
  Dna,
  ArrowRight,
  BookOpen,
  Sparkles,
} from 'lucide-react';
import { useMarginNotes, type MarginNote } from '@/hooks/useMarginNotes';

const FALLBACK_MARGIN_NOTES: Partial<MarginNote>[] = [
  {
    id: 'sample-margin-1',
    quote: 'The only true journey would be not to travel toward new landscapes, but to have other eyes...',
    note: 'Proust’s insight on perspective perfectly describes why reading fiction expands empathy.',
    page: 142,
    books_library: {
      title: 'In Search of Lost Time',
      author: 'Marcel Proust',
      cover_image_url: null,
    },
    profiles: {
      full_name: 'Ananya Sharma',
      username: 'ananya_reads',
      profile_photo_url: null,
    },
  },
  {
    id: 'sample-margin-2',
    quote: 'A person who won’t read has no advantage over one who can’t read.',
    note: 'Twain’s wit cutting straight to the heart of intellectual complacency.',
    page: 28,
    books_library: {
      title: 'Essays & Maxims',
      author: 'Mark Twain',
      cover_image_url: null,
    },
    profiles: {
      full_name: 'Vikramaditya Roy',
      username: 'vikram_roy',
      profile_photo_url: null,
    },
  },
];

export const HomeReadingPeopleSection: React.FC = () => {
  const { data: rawMargins = [] } = useMarginNotes({ filter: 'all' });
  const marginNotes: Partial<MarginNote>[] =
    rawMargins && rawMargins.length > 0 ? rawMargins.slice(0, 2) : FALLBACK_MARGIN_NOTES;

  return (
    <section
      className="home-reading-people relative isolate py-16 sm:py-20 lg:py-24 px-4 sm:px-6 lg:px-8 bg-[#F4F3EF] dark:bg-[#0B0D0C] text-[#1C201D] dark:text-[#F3F0E7] transition-colors duration-300"
      aria-label="Find Your Reading People"
    >
      <div className="relative z-10 max-w-7xl mx-auto">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-12 sm:mb-14">
          <div className="max-w-2xl">
            <div className="flex items-center gap-2.5 text-[10px] sm:text-[11px] font-bold uppercase tracking-[0.22em] text-[#8F681C] dark:text-[#D5B16D] mb-3">
              <span aria-hidden="true" className="h-px w-7 bg-[#8F681C] dark:bg-[#D5B16D]" />
              <span>07 / Connections</span>
            </div>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-serif font-bold text-[#1C201D] dark:text-[#F3F0E7] tracking-tight">
              Find your reading people
            </h2>
            <p className="mt-2.5 text-sm sm:text-base text-[#636B65] dark:text-[#A5ADA6] leading-relaxed">
              Books are solitary to read, but deeply communal to share. Locate fellow readers in your city, find readers immersed in the same book, match your literary taste, or join live reading rooms.
            </p>
          </div>

          <Link
            to="/social?tab=friends"
            className="inline-flex items-center gap-2 text-xs sm:text-sm font-semibold text-[#1C442D] hover:text-[#2D5A40] dark:text-[#D5B16D] dark:hover:text-[#e4c688] transition-colors self-start md:self-end group"
          >
            <span>Discover friends & readers</span>
            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>

        {/* 4 Connection Pillars Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {/* Pillar 1: Reader Map */}
          <Link
            to="/map"
            className="group flex flex-col justify-between rounded-2xl bg-white dark:bg-[#111413] border border-[#E8E8E3] hover:border-[#BDA56B]/60 dark:border-[#222824] dark:hover:border-[#D5B16D]/50 p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-md"
          >
            <div>
              <div className="w-11 h-11 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/60 flex items-center justify-center mb-4 transition-transform group-hover:scale-105">
                <MapPin className="w-5 h-5" />
              </div>
              <h3 className="font-serif text-lg font-bold text-[#1C201D] dark:text-[#F3F0E7] group-hover:text-[#1C442D] dark:group-hover:text-[#D5B16D] transition-colors">
                Local Reader Map
              </h3>
              <p className="text-xs font-semibold text-[#8F681C] dark:text-[#D5B16D] mt-0.5 mb-2">
                Readers in your city
              </p>
              <p className="text-xs text-[#636B65] dark:text-[#A5ADA6] leading-relaxed">
                Explore local readers nearby, discover popular books in your region, and build real-life literary connections.
              </p>
            </div>
            <div className="mt-5 pt-3 border-t border-[#E8E8E3] dark:border-[#222824] flex items-center text-xs font-semibold text-[#1C442D] dark:text-[#D5B16D]">
              <span>Open Reader Map</span>
              <ArrowRight className="w-3.5 h-3.5 ml-1 transition-transform group-hover:translate-x-1" />
            </div>
          </Link>

          {/* Pillar 2: Reader Map by Book */}
          <Link
            to="/reader-map"
            className="group flex flex-col justify-between rounded-2xl bg-white dark:bg-[#111413] border border-[#E8E8E3] hover:border-[#BDA56B]/60 dark:border-[#222824] dark:hover:border-[#D5B16D]/50 p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-md"
          >
            <div>
              <div className="w-11 h-11 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-800/60 flex items-center justify-center mb-4 transition-transform group-hover:scale-105">
                <BookOpen className="w-5 h-5" />
              </div>
              <h3 className="font-serif text-lg font-bold text-[#1C201D] dark:text-[#F3F0E7] group-hover:text-[#1C442D] dark:group-hover:text-[#D5B16D] transition-colors">
                Reader Map by Book
              </h3>
              <p className="text-xs font-semibold text-[#8F681C] dark:text-[#D5B16D] mt-0.5 mb-2">
                Same-book readers
              </p>
              <p className="text-xs text-[#636B65] dark:text-[#A5ADA6] leading-relaxed">
                Select any book from the library to see who else in the world is turning the same pages right now.
              </p>
            </div>
            <div className="mt-5 pt-3 border-t border-[#E8E8E3] dark:border-[#222824] flex items-center text-xs font-semibold text-[#1C442D] dark:text-[#D5B16D]">
              <span>Find Book Mates</span>
              <ArrowRight className="w-3.5 h-3.5 ml-1 transition-transform group-hover:translate-x-1" />
            </div>
          </Link>

          {/* Pillar 3: Reading DNA */}
          <Link
            to="/social?tab=dna"
            className="group flex flex-col justify-between rounded-2xl bg-white dark:bg-[#111413] border border-[#E8E8E3] hover:border-[#BDA56B]/60 dark:border-[#222824] dark:hover:border-[#D5B16D]/50 p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-md"
          >
            <div>
              <div className="w-11 h-11 rounded-xl bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-400 border border-purple-200 dark:border-purple-800/60 flex items-center justify-center mb-4 transition-transform group-hover:scale-105">
                <Dna className="w-5 h-5" />
              </div>
              <h3 className="font-serif text-lg font-bold text-[#1C201D] dark:text-[#F3F0E7] group-hover:text-[#1C442D] dark:group-hover:text-[#D5B16D] transition-colors">
                Reading DNA
              </h3>
              <p className="text-xs font-semibold text-[#8F681C] dark:text-[#D5B16D] mt-0.5 mb-2">
                Literary compatibility
              </p>
              <p className="text-xs text-[#636B65] dark:text-[#A5ADA6] leading-relaxed">
                Compute your reading fingerprint across genres, themes, and pace, and discover high-compatibility reading soulmates.
              </p>
            </div>
            <div className="mt-5 pt-3 border-t border-[#E8E8E3] dark:border-[#222824] flex items-center text-xs font-semibold text-[#1C442D] dark:text-[#D5B16D]">
              <span>Explore Reading DNA</span>
              <ArrowRight className="w-3.5 h-3.5 ml-1 transition-transform group-hover:translate-x-1" />
            </div>
          </Link>

          {/* Pillar 4: Reading Rooms & Sprints */}
          <Link
            to="/social?tab=rooms"
            className="group flex flex-col justify-between rounded-2xl bg-white dark:bg-[#111413] border border-[#E8E8E3] hover:border-[#BDA56B]/60 dark:border-[#222824] dark:hover:border-[#D5B16D]/50 p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-md"
          >
            <div>
              <div className="w-11 h-11 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800/60 flex items-center justify-center mb-4 transition-transform group-hover:scale-105">
                <Radio className="w-5 h-5" />
              </div>
              <h3 className="font-serif text-lg font-bold text-[#1C201D] dark:text-[#F3F0E7] group-hover:text-[#1C442D] dark:group-hover:text-[#D5B16D] transition-colors">
                Reading Rooms
              </h3>
              <p className="text-xs font-semibold text-[#8F681C] dark:text-[#D5B16D] mt-0.5 mb-2">
                Silent co-reading sprints
              </p>
              <p className="text-xs text-[#636B65] dark:text-[#A5ADA6] leading-relaxed">
                Join focused 25-minute Pomodoro reading rooms, share your live reading page, and sprint alongside fellow book lovers.
              </p>
            </div>
            <div className="mt-5 pt-3 border-t border-[#E8E8E3] dark:border-[#222824] flex items-center text-xs font-semibold text-[#1C442D] dark:text-[#D5B16D]">
              <span>Join Live Sprint</span>
              <ArrowRight className="w-3.5 h-3.5 ml-1 transition-transform group-hover:translate-x-1" />
            </div>
          </Link>
        </div>

        {/* Feature Spotlight: Shared Marginalia */}
        <div className="rounded-2xl bg-white dark:bg-[#111413] border border-[#E8E8E3] dark:border-[#222824] p-6 sm:p-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#FBF4E6] dark:bg-[#1D1B16] text-[#8F681C] dark:text-[#D5B16D] border border-[#E8D9BF] dark:border-[#383020] flex items-center justify-center shrink-0">
                <Quote className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-base sm:text-lg font-bold text-[#1C201D] dark:text-[#F3F0E7]">
                  Shared Marginalia: Thoughts from the Margins
                </h4>
                <p className="text-xs text-[#636B65] dark:text-[#A5ADA6]">
                  Passages highlighted by fellow readers with personal impressions and notes left in the margins.
                </p>
              </div>
            </div>

            <Link
              to="/social?tab=margins"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-[#1C442D] hover:bg-[#EBF2EC] dark:text-[#D5B16D] dark:hover:bg-[#18201B] transition-colors shrink-0"
            >
              <span>Explore all margin notes</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {marginNotes.map((note, index) => {
              const authorName = note.profiles?.full_name || note.profiles?.username || 'Reader';
              return (
                <div
                  key={note.id || index}
                  className="p-4 rounded-xl bg-[#F8F7F3] dark:bg-[#161D19] border border-[#E8E2D9] dark:border-[#29332D]"
                >
                  <p className="text-xs font-serif italic text-[#1C201D] dark:text-[#F3F0E7] border-l-2 border-[#8F681C] dark:border-[#D5B16D] pl-3 mb-2.5 leading-relaxed">
                    "{note.quote}"
                  </p>
                  {note.note && (
                    <p className="text-xs text-[#636B65] dark:text-[#A5ADA6] mb-3 leading-relaxed">
                      💬 <span className="font-medium text-[#1C201D] dark:text-[#E2DFD8]">{note.note}</span>
                    </p>
                  )}
                  <div className="flex items-center justify-between text-[11px] text-[#636B65] dark:text-[#A5ADA6] pt-2 border-t border-[#E8E2D9]/60 dark:border-[#29332D]/60">
                    <span className="font-semibold text-[#1C442D] dark:text-[#D5B16D] truncate max-w-[200px]">
                      {note.books_library?.title || 'Book note'} {note.page ? `· p. ${note.page}` : ''}
                    </span>
                    <span>By {authorName}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
};

export default HomeReadingPeopleSection;

