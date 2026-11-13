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
      className="home-reading-people relative isolate py-16 sm:py-20 lg:py-24 px-4 sm:px-6 lg:px-8 bg-[#F5F3EC] dark:bg-[#0B0D0C] text-[#1C201D] dark:text-[#F3F0E7] transition-colors duration-300"
      aria-label="Find Your Reading People"
    >
      <div className="relative z-10 max-w-7xl mx-auto">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-12 sm:mb-14">
          <div className="max-w-2xl">
            <div className="flex items-center gap-2.5 text-[10px] sm:text-[11px] font-bold uppercase tracking-[0.24em] text-[#8F681C] dark:text-[#D5B16D] mb-3">
              <span aria-hidden="true" className="h-px w-7 bg-[#8F681C] dark:bg-[#D5B16D]" />
              <span>02 / Connections</span>
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

        {/* Signature feature: readers map */}
        <div className="group relative mb-8 block overflow-hidden rounded-[2rem] border border-[#DFD8CC] bg-gradient-to-br from-[#EEF4ED] via-[#F8F6F0] to-[#E9F1E9] p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl dark:border-[#243329] dark:from-[#132219] dark:via-[#0F1412] dark:to-[#16201A] sm:p-10 lg:p-12">
          <div className="pointer-events-none absolute -right-12 -top-20 h-72 w-72 rounded-full border border-[#5B8064]/20 dark:border-[#A6C9A8]/20" aria-hidden="true"/>
          <div className="pointer-events-none absolute right-8 top-8 h-52 w-52 rounded-full border border-dashed border-[#5B8064]/25 dark:border-[#A6C9A8]/20" aria-hidden="true"/>
          <div className="relative z-10 grid items-center gap-8 lg:grid-cols-[1.05fr_.95fr]">
            <div className="max-w-xl">
              <span className="inline-flex items-center gap-2 rounded-full border border-[#C8D9C8] bg-white/80 px-3 py-1 text-[10px] font-bold uppercase tracking-[.18em] text-[#315A3D] dark:border-[#36513C] dark:bg-white/[.07] dark:text-[#B8D7B7]"><MapPin size={13}/> Sahadhyayi signature feature</span>
              <h3 className="mt-5 font-serif text-3xl font-bold leading-tight text-[#1C3423] dark:text-[#E9F2E7] sm:text-4xl lg:text-5xl">Books connect us.<br/><span className="text-[#315A3D] dark:text-[#B8D7B7]">See readers around you.</span></h3>
              <p className="mt-4 max-w-lg text-sm leading-7 text-[#536657] dark:text-[#A8B9AA] sm:text-base">Discover fellow readers by city, find people reading the same book, and turn shared shelves into real connections—without revealing anyone’s exact location.</p>
              <div className="mt-7 flex flex-wrap gap-3"><Link to="/map" className="inline-flex items-center gap-2 rounded-full bg-[#1C442D] px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#143221] dark:bg-[#D5B16D] dark:text-stone-950 dark:hover:bg-[#E4C688]">Explore Readers Map <ArrowRight size={16}/></Link><Link to="/reader-map" className="inline-flex items-center gap-2 rounded-full border border-[#C8D9C8] bg-white/80 px-5 py-3 text-sm font-semibold text-[#1C442D] transition-colors hover:bg-white dark:border-[#36513C] dark:bg-white/[.06] dark:text-[#B8D7B7] dark:hover:bg-white/[.1]">Find readers by book <BookOpen size={16}/></Link></div>
            </div>
            <div className="relative mx-auto aspect-[4/3] w-full max-w-[520px] overflow-hidden rounded-3xl border border-white/70 bg-[#DCE9DC]/80 shadow-inner dark:border-white/10 dark:bg-[#1B2C20]/60" aria-hidden="true">
              <div className="absolute inset-0 opacity-50" style={{backgroundImage:"linear-gradient(rgba(75,110,80,.12) 1px,transparent 1px),linear-gradient(90deg,rgba(75,110,80,.12) 1px,transparent 1px)",backgroundSize:"26px 26px"}}/>
              <svg viewBox="0 0 520 340" className="absolute inset-0 h-full w-full" fill="none">
                <path d="M-20 90 C80 40 120 145 205 100 S360 45 540 120 M-10 240 C100 190 145 290 250 220 S390 190 530 280 M90 -20 C120 80 60 170 130 360 M340 -20 C300 100 390 180 330 360" stroke="#9AB59C" strokeWidth="2" opacity=".45"/>
                <path d="M100 95 Q220 55 310 145 T430 245 M125 260 Q230 170 380 95" stroke="#648B6A" strokeDasharray="5 7" strokeWidth="2" opacity=".65"/>
                {[[100,95],[205,100],[310,145],[430,245],[125,260],[230,205],[380,95]].map(([x,y],i)=><g key={i}><circle cx={x} cy={y} r="18" fill="#6F9875" opacity=".16"/><circle cx={x} cy={y} r="8" fill="#47734F" stroke="#F7FBF5" strokeWidth="3"/><circle cx={x} cy={y} r="3" fill="#F7FBF5"/></g>)}
                <g transform="translate(252 156)"><rect x="-32" y="-19" width="64" height="38" rx="12" fill="#244B31"/><path d="M-8 -9V9L0 5L8 9V-9" stroke="#F7FBF5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></g>
              </svg>
              <div className="absolute bottom-3 left-3 rounded-full border border-white/70 bg-white/85 px-3 py-1.5 text-[10px] font-semibold text-[#47664A] shadow-sm dark:border-white/10 dark:bg-[#101A13]/85 dark:text-[#B8D7B7]">Illustrative map preview · not live user locations</div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {/* Pillar 1: Reader Map */}
          <Link to="/map" className="group flex flex-col justify-between rounded-2xl bg-white dark:bg-[#131715] border border-[#E5E0D8] hover:border-[#8F681C]/60 dark:border-[#242E28] dark:hover:border-[#D5B16D]/50 p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-md">
            <div><div className="w-11 h-11 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/60 flex items-center justify-center mb-4"><MapPin className="w-5 h-5"/></div><h3 className="font-serif text-lg font-bold">Local Reader Map</h3><p className="text-xs font-semibold text-[#8F681C] mt-1 mb-2">Readers in your city</p><p className="text-xs text-[#636B65] dark:text-[#A5ADA6] leading-relaxed">Meet nearby readers and discover books popular in your region.</p></div><div className="mt-5 pt-3 border-t border-[#E5E0D8] dark:border-[#242E28] flex items-center text-xs font-semibold text-[#1C442D] dark:text-[#D5B16D]">Open map <ArrowRight className="w-3.5 h-3.5 ml-1"/></div>
          </Link>
          <Link to="/reader-map" className="group flex flex-col justify-between rounded-2xl bg-white dark:bg-[#131715] border border-[#E5E0D8] hover:border-[#8F681C]/60 dark:border-[#242E28] dark:hover:border-[#D5B16D]/50 p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-md">
            <div><div className="w-11 h-11 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-800/60 flex items-center justify-center mb-4"><BookOpen className="w-5 h-5"/></div><h3 className="font-serif text-lg font-bold">Same-book readers</h3><p className="text-xs font-semibold text-[#8F681C] mt-1 mb-2">Find your book mates</p><p className="text-xs text-[#636B65] dark:text-[#A5ADA6] leading-relaxed">Find readers across the world who share the book you are reading.</p></div><div className="mt-5 pt-3 border-t border-[#E5E0D8] dark:border-[#242E28] flex items-center text-xs font-semibold text-[#1C442D] dark:text-[#D5B16D]">Explore book map <ArrowRight className="w-3.5 h-3.5 ml-1"/></div>
          </Link>

          {/* Pillar 3: Reading DNA */}
          <Link
            to="/social?tab=dna"
            className="group flex flex-col justify-between rounded-2xl bg-white dark:bg-[#131715] border border-[#E5E0D8] hover:border-[#8F681C]/60 dark:border-[#242E28] dark:hover:border-[#D5B16D]/50 p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-md"
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
            <div className="mt-5 pt-3 border-t border-[#E5E0D8] dark:border-[#242E28] flex items-center text-xs font-semibold text-[#1C442D] dark:text-[#D5B16D]">
              <span>Explore Reading DNA</span>
              <ArrowRight className="w-3.5 h-3.5 ml-1 transition-transform group-hover:translate-x-1" />
            </div>
          </Link>

          {/* Pillar 4: Reading Rooms & Sprints */}
          <Link
            to="/social?tab=rooms"
            className="group flex flex-col justify-between rounded-2xl bg-white dark:bg-[#131715] border border-[#E5E0D8] hover:border-[#8F681C]/60 dark:border-[#242E28] dark:hover:border-[#D5B16D]/50 p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-md"
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
            <div className="mt-5 pt-3 border-t border-[#E5E0D8] dark:border-[#242E28] flex items-center text-xs font-semibold text-[#1C442D] dark:text-[#D5B16D]">
              <span>Join Live Sprint</span>
              <ArrowRight className="w-3.5 h-3.5 ml-1 transition-transform group-hover:translate-x-1" />
            </div>
          </Link>
        </div>

        {/* Feature Spotlight: Shared Marginalia */}
        <div className="rounded-2xl bg-white dark:bg-[#131715] border border-[#E5E0D8] dark:border-[#242E28] p-6 sm:p-8">
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
                  className="p-4 rounded-xl bg-[#FAF8F3] dark:bg-[#171D1A] border border-[#EBE4D8] dark:border-[#26312B]"
                >
                  <p className="text-xs font-serif italic text-[#1C201D] dark:text-[#F3F0E7] border-l-2 border-[#8F681C] dark:border-[#D5B16D] pl-3 mb-2.5 leading-relaxed">
                    "{note.quote}"
                  </p>
                  {note.note && (
                    <p className="text-xs text-[#636B65] dark:text-[#A5ADA6] mb-3 leading-relaxed">
                      💬 <span className="font-medium text-[#1C201D] dark:text-[#E2DFD8]">{note.note}</span>
                    </p>
                  )}
                  <div className="flex items-center justify-between text-[11px] text-[#636B65] dark:text-[#A5ADA6] pt-2 border-t border-[#EBE4D8]/80 dark:border-[#26312B]/80">
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

