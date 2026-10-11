import React, { useState, Suspense, lazy } from 'react';
import { useAuth } from '@/contexts/authHelpers';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  MessageCircle,
  MapPin,
  UsersIcon,
  Users,
  Sparkles,
  BookOpen,
  Radio,
  Lock,
  Quote,
  Dna,
  Loader2,
  ArrowRight,
  Star,
  TrendingUp,
  Compass,
  ChevronRight,
} from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';
import SignInLink from '@/components/SignInLink';
import SEO from '@/components/SEO';
import { SocialSurface } from '@/components/social/SocialSurface';
import { EnhancedSocialFeed } from '@/components/social/EnhancedSocialFeed';
import { EnhancedReadingMap } from '@/components/social/EnhancedReadingMap';
import { FriendsLocationMap } from '@/components/social/FriendsLocationMap';
import { ReadingGroups } from '@/components/social/ReadingGroups';
import { EnhancedFriendsManager } from '@/components/social/EnhancedFriendsManager';
import { BookPulseBar } from '@/components/social/BookPulseBar';
import { useReadingRooms } from '@/hooks/useReadingRoom';
import { useMarginNotes } from '@/hooks/useMarginNotes';
import { useSpoilerThreads } from '@/hooks/useSpoilerThreads';
import { ErrorBoundary } from '@/components/ErrorBoundary';

// Lazy-load the 4 book-native feature panels
const MarginNotesFeed = lazy(() => import('@/components/social/margins/MarginNotesFeed'));
const SpoilerThreadsFeed = lazy(() => import('@/components/social/threads/SpoilerThreadsFeed'));
const ReadingRoomsPanel = lazy(() => import('@/components/social/rooms/ReadingRoomsPanel'));
const ReadingDnaPanel = lazy(() => import('@/components/social/dna/ReadingDnaPanel'));

const VALID_SOCIAL_TABS = ['feed', 'rooms', 'threads', 'margins', 'dna', 'friends', 'map', 'groups'] as const;

// Reusable lazy-load fallback
const TabLoader = () => (
  <div className="flex flex-col items-center justify-center py-16 gap-3 text-[#A5ADA6]">
    <Loader2 className="w-6 h-6 animate-spin text-[#D5B16D]" />
    <span className="text-xs tracking-wide">Loading community data…</span>
  </div>
);

// Feature pillar card data for guest landing
const PILLARS = [
  {
    icon: Radio,
    color: 'emerald',
    title: 'Live Reading Rooms',
    desc: 'Join synchronous silent reading sprints and co-read pages with readers worldwide in real-time.',
    tab: 'rooms',
    cta: 'Open a Room',
  },
  {
    icon: Quote,
    color: 'amber',
    title: 'Public Marginalia',
    desc: 'Highlight quotes and write margin notes visible to others reading the same page.',
    tab: 'margins',
    cta: 'Browse Margins',
  },
  {
    icon: Lock,
    color: 'indigo',
    title: 'Spoiler-Safe Threads',
    desc: 'Debate plot twists in chapter-locked discussions — nobody gets spoiled by construction.',
    tab: 'threads',
    cta: 'Join Threads',
  },
  {
    icon: Dna,
    color: 'fuchsia',
    title: 'Reading DNA Match',
    desc: 'Discover readers with overlapping literary taste and find your book twin.',
    tab: 'dna',
    cta: 'Match DNA',
  },
] as const;

const colorMap = {
  emerald: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 hover:border-emerald-500/50',
  amber: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20 hover:border-amber-500/50',
  indigo: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20 hover:border-indigo-500/50',
  fuchsia: 'bg-fuchsia-500/10 text-fuchsia-600 dark:text-fuchsia-400 border-fuchsia-500/20 hover:border-fuchsia-500/50',
};

const iconColorMap = {
  emerald: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
  amber: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
  indigo: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400',
  fuchsia: 'bg-fuchsia-500/10 text-fuchsia-600 dark:text-fuchsia-400',
};

// ─── Guest (unauthenticated) landing ─────────────────────────────────────────
const GuestLanding: React.FC = () => (
  <>
    <SEO
      title="Social Reading Community | Sahadhyayi"
      description="Join Sahadhyayi's social reading community. Experience live reading rooms, book margins, spoiler-free chapter threads, and reader taste matching."
      canonical="https://sahadhyayi.com/social"
      url="https://sahadhyayi.com/social"
    />

    <div className="min-h-screen bg-[#0B0D0C] text-[#F3F0E7]">
      {/* ── Hero ── */}
      <section className="relative overflow-hidden border-b border-[#29332D] bg-gradient-to-b from-[#111614] via-[#0B0D0C] to-[#0B0D0C] py-20 px-4">
        {/* Background glow decoration */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-emerald-950/20 blur-3xl" />
          <div className="absolute -bottom-16 -left-16 w-64 h-64 rounded-full bg-[#D5B16D]/5 blur-3xl" />
        </div>

        <div className="relative max-w-4xl mx-auto text-center">
          {/* Tag */}
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#111614] border border-[#29332D] text-xs font-semibold text-[#D5B16D] mb-6 shadow-sm">
            <Sparkles className="w-3.5 h-3.5" />
            Book-Native Social Community
          </div>

          <h1 className="text-4xl md:text-5xl lg:text-6xl font-serif font-bold text-[#F3F0E7] mb-5 tracking-tight leading-tight">
            Where Readers Connect{' '}
            <span className="text-[#D5B16D]">Around Books</span>
          </h1>

          <p className="text-base md:text-lg text-[#A5ADA6] max-w-2xl mx-auto mb-10 leading-relaxed">
            Beyond timelines and likes — co-read in live rooms, annotate chapters, debate
            plot twists spoiler-free, and discover readers who share your literary DNA.
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center mb-12">
            <SignInLink>
              <Button className="w-full sm:w-auto bg-[#1C3024] text-[#F3F0E7] hover:bg-[#254231] border border-[#315C43] px-8 h-11 text-sm font-semibold shadow-md gap-2">
                Sign In to Join
                <ArrowRight className="w-4 h-4 text-[#D5B16D]" />
              </Button>
            </SignInLink>
            <Link to="/signup">
              <Button
                variant="outline"
                className="w-full sm:w-auto border-[#29332D] bg-[#111614] text-[#F3F0E7] hover:bg-[#1B241E] px-8 h-11 text-sm font-medium"
              >
                Create Free Account
              </Button>
            </Link>
          </div>

          {/* Live Pulse bar */}
          <div className="max-w-3xl mx-auto">
            <ErrorBoundary fallback={null}>
              <BookPulseBar />
            </ErrorBoundary>
          </div>

          {/* Social proof */}
          <div className="flex flex-wrap justify-center items-center gap-6 mt-10 text-xs text-[#A5ADA6]">
            <div className="flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-[#D5B16D]" />
              <span>50K+ Active Readers</span>
            </div>
            <div className="flex items-center gap-1.5">
              <BookOpen className="w-3.5 h-3.5 text-[#D5B16D]" />
              <span>Reading 1M+ Books</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Star className="w-3.5 h-3.5 text-[#D5B16D] fill-[#D5B16D]" />
              <span>95% User Satisfaction</span>
            </div>
          </div>
        </div>
      </section>

      {/* ── Feature Pillars ── */}
      <section className="max-w-5xl mx-auto px-4 py-20">
        <div className="text-center max-w-xl mx-auto mb-12">
          <h2 className="text-2xl md:text-3xl font-serif font-bold text-[#F3F0E7] mb-3">
            Built for Deep Reading Culture
          </h2>
          <p className="text-sm text-[#A5ADA6] leading-relaxed">
            Every interaction is anchored to a specific book and chapter — no empty scrolling, just meaningful literary connection.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {PILLARS.map(({ icon: Icon, color, title, desc, cta, tab }) => (
            <Card
              key={tab}
              className={`border border-[#29332D] bg-[#111614] hover:bg-[#161D19] transition-all shadow-xs hover:shadow-md group cursor-pointer`}
            >
              <CardContent className="p-5 flex flex-col h-full text-[#F3F0E7]">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-4 ${iconColorMap[color]}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <h3 className="text-sm font-semibold text-[#F3F0E7] mb-2">{title}</h3>
                <p className="text-xs text-[#A5ADA6] leading-relaxed flex-1">{desc}</p>
                <SignInLink>
                  <button className={`mt-4 text-xs font-semibold flex items-center gap-1 text-[#D5B16D] group-hover:underline`}>
                    {cta} <ArrowRight className="w-3 h-3" />
                  </button>
                </SignInLink>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* ── How It Works ── */}
      <section className="bg-[#111614] border-t border-[#29332D] py-16 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 mb-4 text-xs font-semibold text-[#D5B16D]">
            <TrendingUp className="w-4 h-4" />
            How It Works
          </div>
          <h2 className="text-xl font-serif font-bold text-[#F3F0E7] mb-10">Get started in 3 steps</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
            {[
              { step: '1', title: 'Create an Account', body: 'Sign up free — no credit card needed. Your reading data stays private.' },
              { step: '2', title: 'Add Books You\'re Reading', body: 'Pick from our library of 1M+ books or add your own.' },
              { step: '3', title: 'Join the Community', body: 'Open a reading room, annotate a passage, or match your literary DNA.' },
            ].map(({ step, title, body }) => (
              <div key={step} className="flex flex-col items-center text-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#1C3024] border border-[#315C43] text-[#D5B16D] flex items-center justify-center text-base font-bold shadow-md">
                  {step}
                </div>
                <h3 className="text-sm font-semibold text-[#F3F0E7]">{title}</h3>
                <p className="text-xs text-[#A5ADA6] leading-relaxed">{body}</p>
              </div>
            ))}
          </div>
          <div className="mt-10">
            <Link to="/signup">
              <Button className="bg-[#1C3024] text-[#F3F0E7] hover:bg-[#254231] border border-[#315C43] px-8 h-10 text-sm font-semibold gap-2 shadow-md">
                Join for Free <ArrowRight className="w-4 h-4 text-[#D5B16D]" />
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  </>
);

// ─── Authenticated view ───────────────────────────────────────────────────────
const SocialMedia = () => {
  const { user, loading } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const tabParam = searchParams.get('tab');
  const activeTab = VALID_SOCIAL_TABS.includes(tabParam as (typeof VALID_SOCIAL_TABS)[number])
    ? (tabParam as string)
    : 'feed';
  const [mapView, setMapView] = useState<'readers' | 'friends'>('readers');

  const { data: rooms = [] } = useReadingRooms();
  const { data: marginNotes = [] } = useMarginNotes({ filter: 'all' });
  const { data: spoilerThreads = [] } = useSpoilerThreads();

  const handleTabChange = (value: string) => {
    setSearchParams(
      prev => {
        const next = new URLSearchParams(prev);
        if (value === 'feed') {
          next.delete('tab');
        } else {
          next.set('tab', value);
        }
        return next;
      },
      { replace: true }
    );
  };

  // Full-screen skeleton while auth loads
  if (loading) {
    return (
      <div className="min-h-screen bg-[#0B0D0C] flex items-center justify-center text-[#F3F0E7]">
        <Loader2 className="w-7 h-7 animate-spin text-[#D5B16D]" />
      </div>
    );
  }

  // Always show the guest experience when signed out.
  // A direct URL such as /social?tab=rooms must not bypass it.
  if (!user) return <GuestLanding />;

  const tabs = [
    { value: 'feed', label: 'Feed', icon: MessageCircle },
    {
      value: 'rooms',
      label: 'Rooms',
      icon: Radio,
      badge: rooms.length > 0 ? rooms.length : undefined,
      isLive: rooms.length > 0,
      color: 'text-emerald-400',
    },
    {
      value: 'threads',
      label: 'Threads',
      icon: Lock,
      badge: spoilerThreads.length > 0 ? spoilerThreads.length : undefined,
      color: 'text-indigo-400',
    },
    {
      value: 'margins',
      label: 'Margins',
      icon: Quote,
      badge: marginNotes.length > 0 ? marginNotes.length : undefined,
      color: 'text-amber-400',
    },
    { value: 'dna', label: 'DNA', icon: Dna, color: 'text-fuchsia-400' },
    { value: 'friends', label: 'Friends', icon: Users },
    { value: 'map', label: 'Map', icon: MapPin },
    { value: 'groups', label: 'Groups', icon: UsersIcon },
  ];

  return (
    <>
      <SEO
        title="Social Reading Community | Sahadhyayi"
        description="Connect with fellow readers, co-read in live rooms, share margin notes, and discover book discussions."
        canonical="https://sahadhyayi.com/social"
        url="https://sahadhyayi.com/social"
      />

      <div className="social-experience min-h-screen bg-[#0B0D0C] text-[#F3F0E7]">
        {/* ── Social Header ── */}
        <header className="sticky top-0 z-30 border-b border-[#29332D] bg-[#0B0D0C]/90 backdrop-blur-xl">
          <div className="mx-auto flex max-w-[1600px] items-center justify-between gap-4 px-4 py-3.5 lg:px-8">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#1C3024] border border-[#315C43]/60 text-[#D5B16D]">
                <Sparkles className="h-4 w-4" />
              </div>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#D5B16D]">
                  SAHADHYAYI
                </p>
                <h1 className="text-lg font-serif font-bold tracking-tight text-[#F3F0E7] leading-tight">
                  Your reading world
                </h1>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <p className="hidden text-xs text-[#A5ADA6] md:block tracking-wide">
                Read together. Grow together.
              </p>
              {/* Quick Jump Action Pills */}
              <div className="flex items-center gap-1.5">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleTabChange('rooms')}
                  className={`h-7 text-xs gap-1.5 border-[#29332D] bg-[#111614] text-[#F3F0E7] hover:bg-[#1B241E] hover:text-[#D5B16D] ${activeTab === 'rooms' ? 'border-[#315C43] bg-[#1C3024]' : ''}`}
                >
                  <Radio className="w-3 h-3 text-emerald-400 animate-pulse" />
                  <span className="hidden sm:inline">Rooms</span>
                  {rooms.length > 0 && (
                    <span className="ml-0.5 min-w-[16px] h-4 rounded-full bg-emerald-600 text-white text-[9px] font-bold flex items-center justify-center px-1">
                      {rooms.length}
                    </span>
                  )}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleTabChange('threads')}
                  className={`h-7 text-xs gap-1.5 border-[#29332D] bg-[#111614] text-[#F3F0E7] hover:bg-[#1B241E] hover:text-[#D5B16D] ${activeTab === 'threads' ? 'border-[#315C43] bg-[#1C3024]' : ''}`}
                >
                  <Lock className="w-3 h-3 text-indigo-400" />
                  <span className="hidden sm:inline">Threads</span>
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleTabChange('margins')}
                  className={`h-7 text-xs gap-1.5 border-[#29332D] bg-[#111614] text-[#F3F0E7] hover:bg-[#1B241E] hover:text-[#D5B16D] ${activeTab === 'margins' ? 'border-[#315C43] bg-[#1C3024]' : ''}`}
                >
                  <Quote className="w-3 h-3 text-amber-400" />
                  <span className="hidden sm:inline">Margins</span>
                </Button>
              </div>
            </div>
          </div>
        </header>

        {/* ── Main Responsive Content ── */}
        <main className="mx-auto max-w-[1600px] px-4 py-6 lg:px-8">
          <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
            {/* Mobile & Tablet Horizontal Tab Navigation */}
            <div className="xl:hidden overflow-x-auto scrollbar-none pb-2 mb-6 -mx-1 px-1">
              <TabsList
                className="flex h-auto w-max min-w-full items-center justify-start gap-2 rounded-xl border border-[#29332D] bg-[#111614] p-1.5"
              >
                {tabs.map(tab => (
                  <TabsTrigger
                    key={tab.value}
                    value={tab.value}
                    className="
                      relative flex shrink-0 items-center gap-2 rounded-lg
                      border border-transparent px-3.5 py-2 text-xs
                      text-[#A5ADA6] transition-colors
                      hover:bg-[#1B241E] hover:text-[#F3F0E7]
                      focus-visible:outline-none focus-visible:ring-2
                      focus-visible:ring-[#D5B16D]
                      data-[state=active]:border-[#315C43]
                      data-[state=active]:bg-[#1C3024]
                      data-[state=active]:text-[#F3F0E7]
                      data-[state=active]:shadow-sm
                    "
                  >
                    <tab.icon className="h-3.5 w-3.5 shrink-0" />
                    <span>{tab.label}</span>
                    {/* Live dot */}
                    {'isLive' in tab && tab.isLive && (
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    )}
                    {/* Count badge */}
                    {'badge' in tab && tab.badge !== undefined && (
                      <Badge
                        variant="secondary"
                        className="text-[9px] px-1 h-3.5 bg-[#29332D] text-[#D5B16D] border-none font-bold leading-none"
                      >
                        {tab.badge}
                      </Badge>
                    )}
                  </TabsTrigger>
                ))}
              </TabsList>
            </div>

            {/* Three-Column Composition */}
            <div className="grid grid-cols-1 gap-6 xl:grid-cols-[230px_minmax(0,1fr)_310px]">
              {/* Left Column: Literary Navigation Rail (Desktop) */}
              <aside className="hidden xl:block">
                <div className="sticky top-24 space-y-4">
                  <SocialSurface className="p-3">
                    <p className="px-3 pt-2 pb-1 text-[11px] font-semibold tracking-wider text-[#A5ADA6] uppercase">
                      Navigation
                    </p>
                    <nav className="flex flex-col gap-1 mt-1">
                      {tabs.map(tab => {
                        const isActive = activeTab === tab.value;
                        const Icon = tab.icon;
                        return (
                          <button
                            key={tab.value}
                            type="button"
                            onClick={() => handleTabChange(tab.value)}
                            className={`flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-xs font-medium transition-all ${
                              isActive
                                ? 'bg-[#1C3024] border border-[#315C43] text-[#F3F0E7] shadow-sm'
                                : 'text-[#A5ADA6] hover:bg-[#1B241E] hover:text-[#F3F0E7]'
                            }`}
                          >
                            <div className="flex items-center gap-2.5">
                              <Icon className={`h-4 w-4 shrink-0 ${isActive ? 'text-[#D5B16D]' : 'text-[#A5ADA6]'}`} />
                              <span>{tab.label}</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              {'isLive' in tab && tab.isLive && (
                                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                              )}
                              {'badge' in tab && tab.badge !== undefined && (
                                <span className="rounded-full bg-[#111614] border border-[#29332D] px-1.5 py-0.5 text-[10px] font-semibold text-[#D5B16D]">
                                  {tab.badge}
                                </span>
                              )}
                            </div>
                          </button>
                        );
                      })}
                    </nav>
                  </SocialSurface>

                  {/* Atmospheric Community Card */}
                  <SocialSurface className="p-4 bg-gradient-to-br from-[#111614] to-[#18231C]">
                    <div className="flex items-center gap-2 text-xs font-semibold text-[#D5B16D] mb-1">
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Reading Sanctuary</span>
                    </div>
                    <p className="text-xs text-[#A5ADA6] leading-relaxed">
                      Every note, discussion, and sprint is anchored directly to books.
                    </p>
                    <div className="mt-3 pt-3 border-t border-[#29332D] flex items-center justify-between text-[11px] text-[#A5ADA6]">
                      <span>Live rooms: <strong className="text-[#F3F0E7]">{rooms.length}</strong></span>
                      <span>Margins: <strong className="text-[#F3F0E7]">{marginNotes.length}</strong></span>
                    </div>
                  </SocialSurface>
                </div>
              </aside>

              {/* Center Column: Literary Hero & Selected Feature Content */}
              <section className="min-w-0 space-y-6">
                {/* Literary Hero Welcome Card */}
                {activeTab === 'feed' && (
                  <SocialSurface className="overflow-hidden p-6 relative bg-gradient-to-r from-[#111614] via-[#16211A] to-[#111614]">
                    <div className="relative z-10 max-w-xl">
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-[#1C3024] border border-[#315C43] px-2.5 py-1 text-[11px] font-semibold text-[#D5B16D] mb-3">
                        <BookOpen className="w-3 h-3" />
                        Community Stream
                      </span>
                      <h2 className="text-2xl font-serif font-bold text-[#F3F0E7] tracking-tight">
                        Welcome to your literary circle
                      </h2>
                      <p className="mt-2 text-xs sm:text-sm text-[#A5ADA6] leading-relaxed">
                        Share what you are reading, discuss pivotal plot turns with chapter locks, or leave margin notes for future readers.
                      </p>
                    </div>
                  </SocialSurface>
                )}

                {/* ── Feed Tab ── */}
                <TabsContent value="feed" className="mt-0 space-y-6">
                  <ErrorBoundary
                    fallback={
                      <SocialSurface className="p-8 text-center">
                        <p className="text-sm font-semibold mb-2">Unable to display social feed</p>
                        <p className="text-xs text-[#A5ADA6] mb-4">A temporary error occurred while rendering the community feed.</p>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => window.location.reload()}
                          className="border-[#29332D] bg-[#111614] text-[#F3F0E7]"
                        >
                          Reload Feed
                        </Button>
                      </SocialSurface>
                    }
                  >
                    <EnhancedSocialFeed />
                  </ErrorBoundary>
                </TabsContent>

                {/* ── Reading Rooms Tab ── */}
                <TabsContent value="rooms" className="mt-0 space-y-6">
                  <div className="flex items-start gap-3 bg-[#16211A] border border-[#315C43]/50 rounded-xl p-4 text-sm text-[#F3F0E7]">
                    <Radio className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0 animate-pulse" />
                    <div>
                      <p className="font-medium text-xs text-[#F3F0E7]">Live Reading Rooms</p>
                      <p className="text-xs text-[#A5ADA6] mt-0.5">
                        Co-read in real-time with other readers. Focus timers and chapter sync keep everyone on the same page.
                      </p>
                    </div>
                  </div>
                  <Suspense fallback={<TabLoader />}>
                    <ReadingRoomsPanel />
                  </Suspense>
                </TabsContent>

                {/* ── Spoiler Threads Tab ── */}
                <TabsContent value="threads" className="mt-0 space-y-6">
                  <div className="flex items-start gap-3 bg-[#181C26] border border-indigo-500/30 rounded-xl p-4 text-sm text-[#F3F0E7]">
                    <Lock className="w-4 h-4 text-indigo-400 mt-0.5 shrink-0" />
                    <div>
                      <p className="font-medium text-xs text-[#F3F0E7]">Chapter-Locked Threads</p>
                      <p className="text-xs text-[#A5ADA6] mt-0.5">
                        Discussions unlock as you advance through chapters — zero spoiler risk by design.
                      </p>
                    </div>
                  </div>
                  <Suspense fallback={<TabLoader />}>
                    <SpoilerThreadsFeed />
                  </Suspense>
                </TabsContent>

                {/* ── Margin Notes Tab ── */}
                <TabsContent value="margins" className="mt-0 space-y-6">
                  <div className="flex items-start gap-3 bg-[#241E14] border border-amber-500/30 rounded-xl p-4 text-sm text-[#F3F0E7]">
                    <Quote className="w-4 h-4 text-amber-400 mt-0.5 shrink-0" />
                    <div>
                      <p className="font-medium text-xs text-[#F3F0E7]">Public Marginalia</p>
                      <p className="text-xs text-[#A5ADA6] mt-0.5">
                        Highlight passages and write notes that appear in the margins for all readers of the same book.
                      </p>
                    </div>
                  </div>
                  <Suspense fallback={<TabLoader />}>
                    <MarginNotesFeed />
                  </Suspense>
                </TabsContent>

                {/* ── Reading DNA Tab ── */}
                <TabsContent value="dna" className="mt-0 space-y-6">
                  <div className="flex items-start gap-3 bg-[#231422] border border-fuchsia-500/30 rounded-xl p-4 text-sm text-[#F3F0E7]">
                    <Dna className="w-4 h-4 text-fuchsia-400 mt-0.5 shrink-0" />
                    <div>
                      <p className="font-medium text-xs text-[#F3F0E7]">Reading DNA</p>
                      <p className="text-xs text-[#A5ADA6] mt-0.5">
                        Your taste fingerprint across genres, pacing, and themes. Find readers who match your literary DNA.
                      </p>
                    </div>
                  </div>
                  <Suspense fallback={<TabLoader />}>
                    <ReadingDnaPanel />
                  </Suspense>
                </TabsContent>

                {/* ── Friends Tab ── */}
                <TabsContent value="friends" className="mt-0">
                  <EnhancedFriendsManager />
                </TabsContent>

                {/* ── Map Tab ── */}
                <TabsContent value="map" className="mt-0 space-y-4">
                  <div className="flex items-center gap-1 p-1 bg-[#111614] rounded-xl border border-[#29332D] w-fit">
                    <Button
                      size="sm"
                      variant={mapView === 'readers' ? 'default' : 'ghost'}
                      className={
                        mapView === 'readers'
                          ? 'h-8 px-3 text-xs bg-[#1C3024] border border-[#315C43] text-[#F3F0E7] shadow-xs'
                          : 'h-8 px-3 text-xs text-[#A5ADA6] hover:text-[#F3F0E7] hover:bg-[#1B241E]'
                      }
                      onClick={() => setMapView('readers')}
                    >
                      <MapPin className="w-3.5 h-3.5 mr-1.5 text-emerald-400" />
                      Readers Near Me
                    </Button>
                    <Button
                      size="sm"
                      variant={mapView === 'friends' ? 'default' : 'ghost'}
                      className={
                        mapView === 'friends'
                          ? 'h-8 px-3 text-xs bg-[#1C3024] border border-[#315C43] text-[#F3F0E7] shadow-xs'
                          : 'h-8 px-3 text-xs text-[#A5ADA6] hover:text-[#F3F0E7] hover:bg-[#1B241E]'
                      }
                      onClick={() => setMapView('friends')}
                    >
                      <Users className="w-3.5 h-3.5 mr-1.5 text-[#D5B16D]" />
                      Friends on Map
                    </Button>
                  </div>

                  <Card className="border-[#29332D] bg-[#111614] overflow-hidden text-[#F3F0E7]">
                    {mapView === 'readers' ? <EnhancedReadingMap /> : <FriendsLocationMap />}
                  </Card>
                </TabsContent>

                {/* ── Groups Tab ── */}
                <TabsContent value="groups" className="mt-0">
                  <ReadingGroups />
                </TabsContent>
              </section>

              {/* Right Column: Real Discovery Rail (Desktop) */}
              <aside className="hidden space-y-5 xl:block">
                <div className="sticky top-24 space-y-5">
                  {/* Real Reading Rooms Module */}
                  <SocialSurface className="p-4">
                    <div className="flex items-center justify-between pb-2 mb-3 border-b border-[#29332D]">
                      <div className="flex items-center gap-2">
                        <Radio className="w-4 h-4 text-emerald-400 animate-pulse" />
                        <h3 className="text-xs font-semibold text-[#F3F0E7] uppercase tracking-wider">
                          Active Rooms
                        </h3>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleTabChange('rooms')}
                        className="text-[11px] font-semibold text-[#D5B16D] hover:underline flex items-center gap-0.5"
                      >
                        All ({rooms.length}) <ChevronRight className="w-3 h-3" />
                      </button>
                    </div>

                    {rooms.length === 0 ? (
                      <div className="py-4 text-center">
                        <p className="text-xs text-[#A5ADA6]">No live rooms right now.</p>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleTabChange('rooms')}
                          className="mt-3 text-xs h-7 border-[#29332D] bg-[#16211A] text-[#F3F0E7] hover:border-[#315C43]"
                        >
                          Start a Room
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-2.5">
                        {rooms.slice(0, 3).map((room) => {
                          const bookTitle = room.books_library?.title || 'Current Book';
                          const author = room.books_library?.author;
                          return (
                            <div
                              key={room.id}
                              onClick={() => handleTabChange('rooms')}
                              className="group cursor-pointer rounded-xl border border-[#29332D]/70 bg-[#16211A]/50 p-2.5 transition-colors hover:border-[#315C43] hover:bg-[#16211A]"
                            >
                              <div className="flex items-start gap-2.5">
                                {room.books_library?.cover_image_url ? (
                                  <img
                                    src={room.books_library.cover_image_url}
                                    alt={bookTitle}
                                    className="h-10 w-7 shrink-0 rounded object-cover shadow-xs"
                                  />
                                ) : (
                                  <div className="flex h-10 w-7 shrink-0 items-center justify-center rounded bg-[#1C3024] text-[#D5B16D]">
                                    <BookOpen className="h-3.5 w-3.5" />
                                  </div>
                                )}
                                <div className="min-w-0 flex-1">
                                  <p className="truncate text-xs font-medium text-[#F3F0E7] group-hover:text-[#D5B16D]">
                                    {room.name}
                                  </p>
                                  <p className="truncate text-[11px] text-[#A5ADA6]">
                                    {bookTitle}{author ? ` · ${author}` : ''}
                                  </p>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </SocialSurface>

                  {/* Real Recent Marginalia Module */}
                  <SocialSurface className="p-4">
                    <div className="flex items-center justify-between pb-2 mb-3 border-b border-[#29332D]">
                      <div className="flex items-center gap-2">
                        <Quote className="w-4 h-4 text-amber-400" />
                        <h3 className="text-xs font-semibold text-[#F3F0E7] uppercase tracking-wider">
                          Recent Notes
                        </h3>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleTabChange('margins')}
                        className="text-[11px] font-semibold text-[#D5B16D] hover:underline flex items-center gap-0.5"
                      >
                        Browse ({marginNotes.length}) <ChevronRight className="w-3 h-3" />
                      </button>
                    </div>

                    {marginNotes.length === 0 ? (
                      <div className="py-4 text-center">
                        <p className="text-xs text-[#A5ADA6]">No margin notes created yet.</p>
                        <p className="text-[11px] text-[#A5ADA6]/70 mt-1">Annotate passages inside the reader.</p>
                      </div>
                    ) : (
                      <div className="space-y-2.5">
                        {marginNotes.slice(0, 3).map((note) => {
                          const bookTitle = note.books_library?.title || 'Book note';
                          return (
                            <div
                              key={note.id}
                              onClick={() => handleTabChange('margins')}
                              className="group cursor-pointer rounded-xl border border-[#29332D]/70 bg-[#1A1813]/50 p-2.5 transition-colors hover:border-amber-500/40 hover:bg-[#1A1813]"
                            >
                              <p className="line-clamp-2 text-xs italic text-[#F3F0E7] group-hover:text-amber-200">
                                &ldquo;{note.quote || note.note}&rdquo;
                              </p>
                              <div className="mt-2 flex items-center justify-between text-[10px] text-[#A5ADA6]">
                                <span className="truncate max-w-[160px]">{bookTitle}</span>
                                <span>p. {note.page}</span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </SocialSurface>

                  {/* Real Spoiler-Safe Threads Module */}
                  <SocialSurface className="p-4">
                    <div className="flex items-center justify-between pb-2 mb-3 border-b border-[#29332D]">
                      <div className="flex items-center gap-2">
                        <Lock className="w-4 h-4 text-indigo-400" />
                        <h3 className="text-xs font-semibold text-[#F3F0E7] uppercase tracking-wider">
                          Chapter Threads
                        </h3>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleTabChange('threads')}
                        className="text-[11px] font-semibold text-[#D5B16D] hover:underline flex items-center gap-0.5"
                      >
                        All ({spoilerThreads.length}) <ChevronRight className="w-3 h-3" />
                      </button>
                    </div>

                    {spoilerThreads.length === 0 ? (
                      <div className="py-4 text-center">
                        <p className="text-xs text-[#A5ADA6]">No chapter discussions yet.</p>
                      </div>
                    ) : (
                      <div className="space-y-2.5">
                        {spoilerThreads.slice(0, 3).map((thread) => (
                          <div
                            key={thread.id}
                            onClick={() => handleTabChange('threads')}
                            className="group cursor-pointer rounded-xl border border-[#29332D]/70 bg-[#161822]/50 p-2.5 transition-colors hover:border-indigo-500/40 hover:bg-[#161822]"
                          >
                            <p className="truncate text-xs font-medium text-[#F3F0E7] group-hover:text-indigo-200">
                              {thread.title}
                            </p>
                            <div className="mt-1 flex items-center justify-between text-[10px] text-[#A5ADA6]">
                              <span className="truncate max-w-[150px]">
                                {thread.books_library?.title || 'Book'}
                              </span>
                              <span className="rounded bg-[#202538] px-1.5 py-0.5 text-indigo-300 font-semibold">
                                Ch. {thread.min_chapter}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </SocialSurface>
                </div>
              </aside>
            </div>
          </Tabs>
        </main>
      </div>
    </>
  );
};

export default SocialMedia;
