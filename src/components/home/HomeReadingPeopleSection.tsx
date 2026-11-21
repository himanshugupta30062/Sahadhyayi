import React, { useEffect, useRef, useState } from 'react';
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
  ShieldCheck,
  Navigation,
  MessageCircle,
} from 'lucide-react';
import { useMarginNotes, type MarginNote } from '@/hooks/useMarginNotes';
import { CommunityPulseBar } from './CommunityPulseBar';

interface MapPreviewReader {
  id: string;
  name: string;
  username: string;
  area: string;
  distance: string;
  bookTitle: string;
  bookAuthor: string;
  page?: number;
  progressPercent: number;
  avatarBg: string;
  avatarColor: string;
  initials: string;
  status: string;
  compatibility?: string;
  mode: 'city' | 'book';
  coords: { x: number; y: number };
}

const PREVIEW_READERS: MapPreviewReader[] = [
  {
    id: 'reader-1',
    name: 'Aarav Sharma',
    username: 'aarav_reads',
    area: 'South Delhi, DL',
    distance: '3.4 km away',
    bookTitle: 'Gunaho Ka Devta',
    bookAuthor: 'Dharamvir Bharati',
    page: 118,
    progressPercent: 62,
    avatarBg: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-300 dark:border-emerald-700',
    avatarColor: '#10B981',
    initials: 'AS',
    status: 'Reading Chapter 7 · 42m streak',
    compatibility: '94% Literary Taste Match',
    mode: 'city',
    coords: { x: 38, y: 32 },
  },
  {
    id: 'reader-2',
    name: 'Priya Menon',
    username: 'priya_lit',
    area: 'Connaught Place, DL',
    distance: '5.2 km away',
    bookTitle: 'In Search of Lost Time',
    bookAuthor: 'Marcel Proust',
    page: 142,
    progressPercent: 35,
    avatarBg: 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 border-blue-300 dark:border-blue-700',
    avatarColor: '#3B82F6',
    initials: 'PM',
    status: 'Left 3 margin notes today',
    compatibility: 'Shared 6 favorite authors',
    mode: 'city',
    coords: { x: 65, y: 24 },
  },
  {
    id: 'reader-3',
    name: 'Rohan Verma',
    username: 'rohan_books',
    area: 'Bengaluru (Online)',
    distance: 'Same book mate',
    bookTitle: 'Gunaho Ka Devta',
    bookAuthor: 'Dharamvir Bharati',
    page: 135,
    progressPercent: 71,
    avatarBg: 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border-amber-300 dark:border-amber-700',
    avatarColor: '#F59E0B',
    initials: 'RV',
    status: 'In Silent Sprint (18m remaining)',
    compatibility: 'Co-reading right now',
    mode: 'book',
    coords: { x: 74, y: 56 },
  },
  {
    id: 'reader-4',
    name: 'Meera Kulkarni',
    username: 'meera_reads',
    area: 'Noida Sector 62',
    distance: '7.8 km away',
    bookTitle: 'Atomic Habits',
    bookAuthor: 'James Clear',
    page: 94,
    progressPercent: 45,
    avatarBg: 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300 border-purple-300 dark:border-purple-700',
    avatarColor: '#8B5CF6',
    initials: 'MK',
    status: 'Reading daily streak: 14 days',
    compatibility: '88% Book DNA Match',
    mode: 'city',
    coords: { x: 24, y: 66 },
  },
  {
    id: 'reader-5',
    name: 'Vikramaditya Roy',
    username: 'vikram_roy',
    area: 'Mumbai (Online)',
    distance: 'Same book mate',
    bookTitle: 'Gunaho Ka Devta',
    bookAuthor: 'Dharamvir Bharati',
    page: 112,
    progressPercent: 58,
    avatarBg: 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 border-rose-300 dark:border-rose-700',
    avatarColor: '#F43F5E',
    initials: 'VR',
    status: 'Finished Ch. 6 · Shared a quote',
    compatibility: 'Co-reading right now',
    mode: 'book',
    coords: { x: 48, y: 76 },
  },
];

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
  const sectionRef = useRef<HTMLElement>(null);
  const { data: rawMargins = [] } = useMarginNotes({ filter: 'all' });
  const marginNotes: Partial<MarginNote>[] =
    rawMargins && rawMargins.length > 0 ? rawMargins.slice(0, 2) : FALLBACK_MARGIN_NOTES;

  const [mapMode, setMapMode] = useState<'city' | 'book'>('city');
  const [selectedReaderId, setSelectedReaderId] = useState<string>('reader-1');

  const visibleReaders = PREVIEW_READERS.filter(
    (reader) => mapMode === 'city' ? reader.mode === 'city' || reader.id === 'reader-1' : reader.mode === 'book' || reader.id === 'reader-1'
  );

  const activeReader = PREVIEW_READERS.find((r) => r.id === selectedReaderId) || PREVIEW_READERS[0];

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;
    const revealTargets = Array.from(section.querySelectorAll<HTMLElement>('[data-people-reveal]'));
    const revealAll = () => revealTargets.forEach((element) => element.classList.add('people-revealed'));

    if (
      typeof window === 'undefined' ||
      !('IntersectionObserver' in window) ||
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    ) {
      revealAll();
      return;
    }

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('people-revealed');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.08, rootMargin: '0px 0px -6% 0px' });
    revealTargets.forEach((element) => observer.observe(element));
    return () => observer.disconnect();
  }, []);

  return (
    <section
      ref={sectionRef}
      className="home-reading-people relative isolate py-12 sm:py-16 lg:py-20 px-4 sm:px-6 lg:px-8 bg-[#F5F3EC] dark:bg-[#0B0D0C] text-[#1C201D] dark:text-[#F3F0E7] transition-colors duration-300"
      aria-label="Find Your Reading People"
    >
      <style>{`.home-reading-people [data-people-reveal]{opacity:0;transform:translate3d(0,14px,0);transition:opacity 560ms ease,transform 560ms cubic-bezier(.2,.7,.2,1)}.home-reading-people [data-people-reveal].people-revealed{opacity:1;transform:translate3d(0,0,0)}.home-reading-people .people-card-reveal:nth-child(1){transition-delay:40ms}.home-reading-people .people-card-reveal:nth-child(2){transition-delay:100ms}.home-reading-people .people-card-reveal:nth-child(3){transition-delay:160ms}.home-reading-people .people-card-reveal:nth-child(4){transition-delay:220ms}@media(prefers-reduced-motion:reduce){.home-reading-people [data-people-reveal]{opacity:1!important;transition:none!important;transform:none!important}}`}</style>
      <div className="relative z-10 max-w-7xl mx-auto">
        {/* Section Header */}
        <div data-people-reveal className="people-reveal people-reveal-1 flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-12 sm:mb-14">
          <div className="max-w-2xl">
            <div className="flex items-center gap-2.5 text-[10px] sm:text-[11px] font-bold uppercase tracking-[0.24em] text-[#8F681C] dark:text-[#D5B16D] mb-3">
              <span aria-hidden="true" className="h-px w-7 bg-[#8F681C] dark:bg-[#D5B16D]" />
              <span>Connect with Readers</span>
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

        {/* Live Community Pulse Bar */}
        <div data-people-reveal className="people-reveal people-reveal-2"><CommunityPulseBar className="mb-8" /></div>

        {/* Signature feature: readers map */}
        <div data-people-reveal className="people-reveal people-reveal-3 group relative mb-10 block overflow-hidden rounded-[2.5rem] border border-[#DFD8CC] bg-gradient-to-br from-[#EEF4ED] via-[#F8F6F0] to-[#E9F1E9] p-6 shadow-sm transition-all duration-300 hover:shadow-xl dark:border-[#243329] dark:from-[#132219] dark:via-[#0F1412] dark:to-[#16201A] sm:p-9 lg:p-11">
          <div className="pointer-events-none absolute -right-12 -top-20 h-72 w-72 rounded-full border border-[#5B8064]/20 dark:border-[#A6C9A8]/20" aria-hidden="true"/>
          <div className="pointer-events-none absolute right-8 top-8 h-52 w-52 rounded-full border border-dashed border-[#5B8064]/25 dark:border-[#A6C9A8]/20" aria-hidden="true"/>
          
          <div className="relative z-10 grid items-center gap-8 lg:grid-cols-[1.02fr_.98fr] lg:gap-10">
            {/* Left Content Column */}
            <div className="max-w-xl">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-[#C8D9C8] bg-white/90 px-3.5 py-1 text-[10px] font-bold uppercase tracking-[.18em] text-[#315A3D] dark:border-[#36513C] dark:bg-white/[.07] dark:text-[#B8D7B7] shadow-2xs">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                  </span>
                  <MapPin size={12} className="ml-0.5" /> Sahadhyayi signature feature
                </span>
                <span className="text-[11px] font-medium text-[#536657] dark:text-[#A8B9AA]">
                  Live Reader Radar
                </span>
              </div>

              <h3 className="mt-4 font-serif text-3xl font-bold leading-tight text-[#1C3423] dark:text-[#E9F2E7] sm:text-4xl lg:text-[2.75rem]">
                Books connect us.<br/><span className="text-[#315A3D] dark:text-[#B8D7B7]">See readers around you.</span>
              </h3>

              <p className="mt-3.5 max-w-lg text-sm leading-relaxed text-[#536657] dark:text-[#A8B9AA] sm:text-base">
                Discover fellow readers in your city, see who is turning the exact same page, and turn shared shelves into real friendships—protected by privacy-first fuzzy geolocation.
              </p>

              {/* 3 Core Functionality Callouts */}
              <div className="mt-5 grid grid-cols-1 gap-2.5 sm:grid-cols-3">
                <div className="rounded-2xl border border-[#C8D9C8]/80 bg-white/70 p-3 dark:border-[#36513C]/70 dark:bg-white/[.04] shadow-2xs transition-transform hover:scale-[1.02]">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-[#1C442D] dark:text-[#D5B16D]">
                    <Compass className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" /> City Radar
                  </div>
                  <p className="mt-1 text-[11px] leading-snug text-[#536657] dark:text-[#A8B9AA]">
                    Spot nearby readers and quiet reading-friendly cafes.
                  </p>
                </div>
                <div className="rounded-2xl border border-[#C8D9C8]/80 bg-white/70 p-3 dark:border-[#36513C]/70 dark:bg-white/[.04] shadow-2xs transition-transform hover:scale-[1.02]">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-[#1C442D] dark:text-[#D5B16D]">
                    <BookOpen className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" /> Book Mates
                  </div>
                  <p className="mt-1 text-[11px] leading-snug text-[#536657] dark:text-[#A8B9AA]">
                    Find readers on the same chapter across the world.
                  </p>
                </div>
                <div className="rounded-2xl border border-[#C8D9C8]/80 bg-white/70 p-3 dark:border-[#36513C]/70 dark:bg-white/[.04] shadow-2xs transition-transform hover:scale-[1.02]">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-[#1C442D] dark:text-[#D5B16D]">
                    <ShieldCheck className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" /> Zero Risk
                  </div>
                  <p className="mt-1 text-[11px] leading-snug text-[#536657] dark:text-[#A8B9AA]">
                    Fuzzy 3–5 km radius. Your exact address is never shared.
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-6 flex flex-wrap items-center gap-3">
                <Link
                  to="/map"
                  className="inline-flex items-center gap-2 rounded-full bg-[#1C442D] px-5 py-3 text-sm font-semibold text-white transition-all hover:bg-[#143221] hover:shadow-md dark:bg-[#D5B16D] dark:text-stone-950 dark:hover:bg-[#E4C688]"
                >
                  Explore Readers Map <ArrowRight size={16}/>
                </Link>
                <Link
                  to="/reader-map"
                  className="inline-flex items-center gap-2 rounded-full border border-[#C8D9C8] bg-white/85 px-5 py-3 text-sm font-semibold text-[#1C442D] transition-colors hover:bg-white dark:border-[#36513C] dark:bg-white/[.06] dark:text-[#B8D7B7] dark:hover:bg-white/[.1]"
                >
                  Find readers by book <BookOpen size={16}/>
                </Link>
              </div>

              <p className="mt-3 flex items-center gap-1.5 text-[11px] text-[#536657] dark:text-[#8D9E90]">
                <ShieldCheck size={13} className="text-emerald-600 dark:text-emerald-400" />
                <span>Protected by differential privacy · Optional one-click ghost mode</span>
              </p>
            </div>

            {/* Right Column: Realistic, Interactive Map Radar Simulator */}
            <div className="relative mx-auto flex w-full max-w-[540px] flex-col overflow-hidden rounded-3xl border border-white/80 bg-white/60 p-3 shadow-lg backdrop-blur-md dark:border-white/10 dark:bg-[#111A14]/80 sm:p-4">
              {/* Radar Simulator Top Bar with View Mode Toggles */}
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2 border-b border-black/5 pb-2.5 dark:border-white/10">
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      setMapMode('city');
                      setSelectedReaderId('reader-1');
                    }}
                    className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition-all ${
                      mapMode === 'city'
                        ? 'bg-[#1C442D] text-white shadow-xs dark:bg-[#D5B16D] dark:text-stone-950'
                        : 'text-[#536657] hover:bg-black/5 dark:text-[#A8B9AA] dark:hover:bg-white/5'
                    }`}
                  >
                    📍 Readers in City
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setMapMode('book');
                      setSelectedReaderId('reader-3');
                    }}
                    className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition-all ${
                      mapMode === 'book'
                        ? 'bg-[#1C442D] text-white shadow-xs dark:bg-[#D5B16D] dark:text-stone-950'
                        : 'text-[#536657] hover:bg-black/5 dark:text-[#A8B9AA] dark:hover:bg-white/5'
                    }`}
                  >
                    📖 By Book: Gunaho Ka Devta
                  </button>
                </div>

                <div className="flex items-center gap-1.5 text-[10px] font-medium text-emerald-700 dark:text-emerald-400">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span>{mapMode === 'city' ? '4 active nearby' : '3 reading same book'}</span>
                </div>
              </div>

              {/* Map Surface View */}
              <div className="relative aspect-[16/10] w-full overflow-hidden rounded-2xl border border-black/5 bg-[#E6EFE5] dark:border-white/10 dark:bg-[#0D1610] shadow-inner select-none">
                {/* Cartographic grid and topographical contours */}
                <div
                  className="absolute inset-0 opacity-40 dark:opacity-20"
                  style={{
                    backgroundImage:
                      'linear-gradient(rgba(75,110,80,.16) 1px,transparent 1px),linear-gradient(90deg,rgba(75,110,80,.16) 1px,transparent 1px)',
                    backgroundSize: '24px 24px',
                  }}
                />

                {/* Simulated Geographic Rivers, Greenways, and City Hubs */}
                <svg viewBox="0 0 540 340" className="absolute inset-0 h-full w-full pointer-events-none" fill="none">
                  {/* Gentle river curve */}
                  <path
                    d="M-20 60 C90 80 150 160 270 140 S410 80 560 110"
                    stroke="#94B999"
                    strokeWidth="14"
                    strokeLinecap="round"
                    className="opacity-40 dark:opacity-25"
                  />
                  {/* Highway transit artery */}
                  <path
                    d="M100 -20 Q240 180 340 360 M-20 220 Q200 200 560 260"
                    stroke="#A8C4AD"
                    strokeWidth="3"
                    className="opacity-50 dark:opacity-30"
                  />
                  {/* Dashed connectivity bridge */}
                  <path
                    d="M150 170 Q280 110 390 190"
                    stroke="#648B6A"
                    strokeDasharray="4 6"
                    strokeWidth="2"
                    className="opacity-60 dark:opacity-40"
                  />
                  {/* Range radar rings centered around "You" */}
                  <circle cx="270" cy="170" r="75" stroke="#47734F" strokeWidth="1" strokeDasharray="3 4" opacity="0.25" />
                  <circle cx="270" cy="170" r="140" stroke="#47734F" strokeWidth="1" strokeDasharray="4 6" opacity="0.18" />
                </svg>

                {/* Center marker: "You" */}
                <div
                  className="absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center pointer-events-none"
                  style={{ left: '50%', top: '50%' }}
                >
                  <div className="relative flex h-8 w-8 items-center justify-center">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-500 opacity-40" />
                    <span className="relative flex h-5 w-5 items-center justify-center rounded-full bg-[#1C442D] text-[9px] font-bold text-white shadow-md ring-2 ring-white dark:ring-stone-900">
                      You
                    </span>
                  </div>
                  <span className="mt-0.5 rounded-full bg-white/90 px-1.5 py-0.5 text-[9px] font-semibold text-[#1C442D] shadow-xs backdrop-blur dark:bg-stone-900/90 dark:text-[#B8D7B7]">
                    Current Area
                  </span>
                </div>

                {/* Interactive Reader Pins */}
                {visibleReaders.map((reader) => {
                  const isSelected = reader.id === activeReader.id;
                  return (
                    <button
                      key={reader.id}
                      type="button"
                      onClick={() => setSelectedReaderId(reader.id)}
                      className={`group absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer transition-all focus:outline-none ${
                        isSelected ? 'z-20 scale-110' : 'z-10 hover:scale-105'
                      }`}
                      style={{ left: `${reader.coords.x}%`, top: `${reader.coords.y}%` }}
                      title={`Click to view ${reader.name}`}
                    >
                      <div className="relative flex flex-col items-center">
                        {/* Glow halo on selection */}
                        {isSelected && (
                          <span
                            className="absolute -inset-1.5 rounded-full animate-pulse opacity-60"
                            style={{ backgroundColor: reader.avatarColor }}
                          />
                        )}

                        {/* Pin Avatar Badge */}
                        <div
                          className={`relative flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-full border-2 text-[10px] font-bold shadow-md transition-all ${
                            isSelected
                              ? 'border-white bg-[#1C442D] text-white ring-2 ring-[#1C442D] dark:ring-[#D5B16D]'
                              : 'border-white bg-white/90 text-stone-800 dark:border-stone-800 dark:bg-stone-900 dark:text-stone-200'
                          }`}
                        >
                          {reader.initials}
                          <span
                            className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border border-white dark:border-stone-900"
                            style={{ backgroundColor: reader.avatarColor }}
                          />
                        </div>

                        {/* Miniature Title Label under Pin */}
                        <span
                          className={`mt-1 whitespace-nowrap rounded-md px-1.5 py-0.5 text-[9px] font-medium shadow-xs transition-colors ${
                            isSelected
                              ? 'bg-[#1C442D] text-white dark:bg-[#D5B16D] dark:text-stone-950 font-semibold'
                              : 'bg-white/80 text-stone-700 backdrop-blur dark:bg-stone-900/80 dark:text-stone-300'
                          }`}
                        >
                          {reader.name.split(' ')[0]} · {mapMode === 'city' ? reader.distance : `p. ${reader.page}`}
                        </span>
                      </div>
                    </button>
                  );
                })}

                {/* Subtle Interactive Instruction Chip */}
                <div className="absolute top-2.5 left-2.5 rounded-full border border-white/80 bg-white/85 px-2.5 py-1 text-[9px] font-semibold text-[#47664A] shadow-xs backdrop-blur dark:border-white/10 dark:bg-[#101A13]/90 dark:text-[#B8D7B7]">
                  👆 Tap any reader pin to preview shelf
                </div>
              </div>

              {/* Dynamic Bottom Reader Card Overlay */}
              <div className="mt-3 rounded-2xl border border-black/5 bg-white/95 p-3.5 shadow-sm dark:border-white/10 dark:bg-[#152119]/95 transition-all">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border text-xs font-bold shadow-2xs ${activeReader.avatarBg}`}
                    >
                      {activeReader.initials}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-xs font-bold text-foreground truncate">{activeReader.name}</p>
                        <span className="rounded-full bg-emerald-500/15 px-1.5 py-0.2 text-[9px] font-medium text-emerald-700 dark:text-emerald-400">
                          {activeReader.distance}
                        </span>
                      </div>
                      <p className="text-[11px] text-muted-foreground truncate">{activeReader.area}</p>
                    </div>
                  </div>

                  <span className="rounded-md border border-[#C8D9C8] bg-[#EEF4ED] px-2 py-0.5 text-[10px] font-semibold text-[#1C442D] dark:border-[#36513C] dark:bg-white/[.06] dark:text-[#B8D7B7] shrink-0">
                    {activeReader.compatibility}
                  </span>
                </div>

                {/* Active Book Shelf Detail */}
                <div className="mt-2.5 rounded-xl border border-black/5 bg-[#F9FAF8] p-2.5 dark:border-white/5 dark:bg-[#1B2920]/60">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5 truncate">
                      <BookOpen size={13} className="text-[#1C442D] dark:text-[#D5B16D] shrink-0" />
                      <span className="font-semibold text-foreground truncate">{activeReader.bookTitle}</span>
                      <span className="text-[10px] text-muted-foreground truncate">by {activeReader.bookAuthor}</span>
                    </div>
                    {activeReader.page && (
                      <span className="text-[10px] font-medium tabular-nums text-muted-foreground shrink-0 ml-1">
                        Page {activeReader.page} ({activeReader.progressPercent}%)
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-[10px] text-[#536657] dark:text-[#A8B9AA]">{activeReader.status}</p>
                </div>

                {/* Connect CTA inside card */}
                <div className="mt-2.5 flex items-center justify-between pt-1 text-[11px]">
                  <span className="text-[10px] text-muted-foreground">
                    🔒 Protected approximate location
                  </span>
                  <Link
                    to="/map"
                    className="inline-flex items-center gap-1 font-semibold text-[#1C442D] hover:underline dark:text-[#D5B16D]"
                  >
                    <span>Connect on live map</span>
                    <ArrowRight size={12} />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div data-people-reveal className="people-reveal people-reveal-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {/* Pillar 1: Reader Map */}
          <Link
            to="/map"
            data-people-reveal className="people-card-reveal group flex flex-col justify-between rounded-3xl bg-white dark:bg-[#131715] border border-[#E5E0D8] hover:border-[#8F681C]/60 dark:border-[#242E28] dark:hover:border-[#D5B16D]/50 p-6 sm:p-7 transition-all duration-300 hover:-translate-y-1.5 hover:shadow-xl"
          >
            <div>
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/60 flex items-center justify-center mb-5 transition-transform group-hover:scale-105 shadow-2xs">
                <MapPin className="w-5 h-5"/>
              </div>
              <h3 className="font-serif text-xl font-bold text-[#1C201D] dark:text-[#F3F0E7] group-hover:text-[#1C442D] dark:group-hover:text-[#D5B16D] transition-colors">
                Local Reader Map
              </h3>
              <p className="text-xs font-semibold text-[#8F681C] dark:text-[#D5B16D] mt-1 mb-2">
                Readers in your city
              </p>
              <p className="text-xs text-[#636B65] dark:text-[#A5ADA6] leading-relaxed">
                Meet nearby readers and discover books popular in your region.
              </p>
            </div>
            <div className="mt-6 pt-3.5 border-t border-[#E5E0D8] dark:border-[#242E28] flex items-center text-xs font-semibold text-[#1C442D] dark:text-[#D5B16D]">
              <span>Open map</span>
              <ArrowRight className="w-3.5 h-3.5 ml-1 transition-transform group-hover:translate-x-1"/>
            </div>
          </Link>

          {/* Pillar 2: Reader Map by Book */}
          <Link
            to="/reader-map"
            className="people-card-reveal group flex flex-col justify-between rounded-3xl bg-white dark:bg-[#131715] border border-[#E5E0D8] hover:border-[#8F681C]/60 dark:border-[#242E28] dark:hover:border-[#D5B16D]/50 p-6 sm:p-7 transition-all duration-300 hover:-translate-y-1.5 hover:shadow-xl"
          >
            <div>
              <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-800/60 flex items-center justify-center mb-5 transition-transform group-hover:scale-105 shadow-2xs">
                <BookOpen className="w-5 h-5"/>
              </div>
              <h3 className="font-serif text-xl font-bold text-[#1C201D] dark:text-[#F3F0E7] group-hover:text-[#1C442D] dark:group-hover:text-[#D5B16D] transition-colors">
                Reader Map by Book
              </h3>
              <p className="text-xs font-semibold text-[#8F681C] dark:text-[#D5B16D] mt-1 mb-2">
                Find your book mates
              </p>
              <p className="text-xs text-[#636B65] dark:text-[#A5ADA6] leading-relaxed">
                Find readers across the world who share the book you are reading.
              </p>
            </div>
            <div className="mt-6 pt-3.5 border-t border-[#E5E0D8] dark:border-[#242E28] flex items-center text-xs font-semibold text-[#1C442D] dark:text-[#D5B16D]">
              <span>Explore book map</span>
              <ArrowRight className="w-3.5 h-3.5 ml-1 transition-transform group-hover:translate-x-1"/>
            </div>
          </Link>

          {/* Pillar 3: Reading DNA */}
          <Link
            to="/social?tab=dna"
            className="people-card-reveal group flex flex-col justify-between rounded-3xl bg-white dark:bg-[#131715] border border-[#E5E0D8] hover:border-[#8F681C]/60 dark:border-[#242E28] dark:hover:border-[#D5B16D]/50 p-6 sm:p-7 transition-all duration-300 hover:-translate-y-1.5 hover:shadow-xl"
          >
            <div>
              <div className="w-12 h-12 rounded-2xl bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-400 border border-purple-200 dark:border-purple-800/60 flex items-center justify-center mb-5 transition-transform group-hover:scale-105 shadow-2xs">
                <Dna className="w-5 h-5" />
              </div>
              <h3 className="font-serif text-xl font-bold text-[#1C201D] dark:text-[#F3F0E7] group-hover:text-[#1C442D] dark:group-hover:text-[#D5B16D] transition-colors">
                Reading DNA
              </h3>
              <p className="text-xs font-semibold text-[#8F681C] dark:text-[#D5B16D] mt-1 mb-2">
                Literary compatibility
              </p>
              <p className="text-xs text-[#636B65] dark:text-[#A5ADA6] leading-relaxed">
                Compute your reading fingerprint across genres, themes, and pace, and discover high-compatibility reading soulmates.
              </p>
            </div>
            <div className="mt-6 pt-3.5 border-t border-[#E5E0D8] dark:border-[#242E28] flex items-center text-xs font-semibold text-[#1C442D] dark:text-[#D5B16D]">
              <span>Explore Reading DNA</span>
              <ArrowRight className="w-3.5 h-3.5 ml-1 transition-transform group-hover:translate-x-1" />
            </div>
          </Link>

          {/* Pillar 4: Reading Rooms & Sprints */}
          <Link
            to="/social?tab=rooms"
            className="people-card-reveal group flex flex-col justify-between rounded-3xl bg-white dark:bg-[#131715] border border-[#E5E0D8] hover:border-[#8F681C]/60 dark:border-[#242E28] dark:hover:border-[#D5B16D]/50 p-6 sm:p-7 transition-all duration-300 hover:-translate-y-1.5 hover:shadow-xl"
          >
            <div>
              <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800/60 flex items-center justify-center mb-5 transition-transform group-hover:scale-105 shadow-2xs">
                <Radio className="w-5 h-5" />
              </div>
              <h3 className="font-serif text-xl font-bold text-[#1C201D] dark:text-[#F3F0E7] group-hover:text-[#1C442D] dark:group-hover:text-[#D5B16D] transition-colors">
                Reading Rooms
              </h3>
              <p className="text-xs font-semibold text-[#8F681C] dark:text-[#D5B16D] mt-1 mb-2">
                Silent co-reading sprints
              </p>
              <p className="text-xs text-[#636B65] dark:text-[#A5ADA6] leading-relaxed">
                Join focused 25-minute Pomodoro reading rooms, share your live reading page, and sprint alongside fellow book lovers.
              </p>
            </div>
            <div className="mt-6 pt-3.5 border-t border-[#E5E0D8] dark:border-[#242E28] flex items-center text-xs font-semibold text-[#1C442D] dark:text-[#D5B16D]">
              <span>Join Live Sprint</span>
              <ArrowRight className="w-3.5 h-3.5 ml-1 transition-transform group-hover:translate-x-1" />
            </div>
          </Link>
        </div>

        {/* Feature Spotlight: Shared Marginalia */}
        <div data-people-reveal className="people-reveal people-reveal-4 rounded-3xl bg-white dark:bg-[#131715] border border-[#E5E0D8] dark:border-[#242E28] p-6 sm:p-8 shadow-xs">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-6">
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-2xl bg-[#FBF4E6] dark:bg-[#1D1B16] text-[#8F681C] dark:text-[#D5B16D] border border-[#E8D9BF] dark:border-[#383020] flex items-center justify-center shrink-0 shadow-2xs">
                <Quote className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-base sm:text-lg font-serif font-bold text-[#1C201D] dark:text-[#F3F0E7]">
                  Shared Marginalia: Thoughts from the Margins
                </h4>
                <p className="text-xs text-[#636B65] dark:text-[#A5ADA6] mt-0.5">
                  Passages highlighted by fellow readers with personal impressions and notes left in the margins.
                </p>
              </div>
            </div>

            <Link
              to="/social?tab=margins"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-semibold text-[#1C442D] bg-[#EBF2EC]/70 hover:bg-[#EBF2EC] dark:text-[#D5B16D] dark:bg-[#18201B] dark:hover:bg-[#202923] transition-colors shrink-0"
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
                  className="p-5 rounded-2xl bg-[#FAF8F3] dark:bg-[#171D1A] border border-[#EBE4D8] dark:border-[#26312B] transition-colors hover:border-[#8F681C]/40"
                >
                  <p className="text-xs sm:text-sm font-serif italic text-[#1C201D] dark:text-[#F3F0E7] border-l-2 border-[#8F681C] dark:border-[#D5B16D] pl-3.5 mb-3 leading-relaxed">
                    "{note.quote}"
                  </p>
                  {note.note && (
                    <p className="text-xs text-[#636B65] dark:text-[#A5ADA6] mb-3.5 leading-relaxed pl-3.5">
                      💬 <span className="font-medium text-[#1C201D] dark:text-[#E2DFD8]">{note.note}</span>
                    </p>
                  )}
                  <div className="flex items-center justify-between text-[11px] text-[#636B65] dark:text-[#A5ADA6] pt-2.5 border-t border-[#EBE4D8]/80 dark:border-[#26312B]/80">
                    <span className="font-semibold text-[#1C442D] dark:text-[#D5B16D] truncate max-w-[200px]">
                      {note.books_library?.title || 'Book note'} {note.page ? `· p. ${note.page}` : ''}
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <span className="w-4 h-4 rounded-full bg-[hsl(var(--brand-primary)/0.15)] text-[hsl(var(--brand-primary))] text-[9px] font-bold flex items-center justify-center">
                        {authorName.charAt(0).toUpperCase()}
                      </span>
                      <span>By {authorName}</span>
                    </span>
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
