import React, { useState, Suspense, lazy } from 'react';
import { useAuth } from '@/contexts/authHelpers';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
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
} from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';
import SignInLink from '@/components/SignInLink';
import SEO from '@/components/SEO';
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
  <div className="flex flex-col items-center justify-center py-16 gap-3 text-muted-foreground">
    <Loader2 className="w-6 h-6 animate-spin text-brand-primary" />
    <span className="text-xs">Loading…</span>
  </div>
);

// Feature pillar card data
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

    <div className="min-h-screen bg-background">
      {/* ── Hero ── */}
      <section className="relative overflow-hidden border-b border-border bg-gradient-to-br from-brand-primary/8 via-background to-brand-secondary/8 py-20 px-4">
        {/* Background decoration */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-brand-primary/5 blur-3xl" />
          <div className="absolute -bottom-16 -left-16 w-64 h-64 rounded-full bg-brand-secondary/5 blur-3xl" />
        </div>

        <div className="relative max-w-4xl mx-auto text-center">
          {/* Tag */}
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-card/90 backdrop-blur-sm border border-border text-xs font-semibold text-brand-primary mb-6 shadow-sm">
            <Sparkles className="w-3.5 h-3.5" />
            Book-Native Social Community
          </div>

          <h1 className="text-4xl md:text-5xl lg:text-6xl font-serif font-bold text-foreground mb-5 tracking-tight leading-tight">
            Where Readers Connect{' '}
            <span className="text-brand-primary">Around Books</span>
          </h1>

          <p className="text-base md:text-lg text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed">
            Beyond timelines and likes — co-read in live rooms, annotate chapters, debate
            plot twists spoiler-free, and discover readers who share your literary DNA.
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center mb-12">
            <SignInLink>
              <Button className="w-full sm:w-auto bg-brand-primary text-white hover:bg-brand-primary/90 px-8 h-11 text-sm font-semibold shadow-md shadow-brand-primary/25 gap-2">
                Sign In to Join
                <ArrowRight className="w-4 h-4" />
              </Button>
            </SignInLink>
            <Link to="/signup">
              <Button
                variant="outline"
                className="w-full sm:w-auto border-border hover:bg-muted px-8 h-11 text-sm font-medium"
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
          <div className="flex flex-wrap justify-center items-center gap-6 mt-10 text-xs text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-brand-primary" />
              <span>50K+ Active Readers</span>
            </div>
            <div className="flex items-center gap-1.5">
              <BookOpen className="w-3.5 h-3.5 text-brand-primary" />
              <span>Reading 1M+ Books</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Star className="w-3.5 h-3.5 text-brand-primary fill-brand-primary" />
              <span>95% User Satisfaction</span>
            </div>
          </div>
        </div>
      </section>

      {/* ── Feature Pillars ── */}
      <section className="max-w-5xl mx-auto px-4 py-20">
        <div className="text-center max-w-xl mx-auto mb-12">
          <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-3">
            Built for Deep Reading Culture
          </h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Every interaction is anchored to a specific book and chapter — no empty scrolling, just meaningful literary connection.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {PILLARS.map(({ icon: Icon, color, title, desc, cta, tab }) => (
            <Card
              key={tab}
              className={`border bg-card/50 hover:bg-card transition-all shadow-xs hover:shadow-md group cursor-pointer ${colorMap[color].split(' ').filter(c => c.startsWith('border')).join(' ')}`}
            >
              <CardContent className="p-5 flex flex-col h-full">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-4 ${iconColorMap[color]}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <h3 className="text-sm font-semibold text-foreground mb-2">{title}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed flex-1">{desc}</p>
                <SignInLink>
                  <button className={`mt-4 text-xs font-semibold flex items-center gap-1 ${iconColorMap[color].split(' ').filter(c => c.startsWith('text')).join(' ')} group-hover:underline`}>
                    {cta} <ArrowRight className="w-3 h-3" />
                  </button>
                </SignInLink>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* ── How It Works ── */}
      <section className="bg-muted/30 border-t border-border py-16 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 mb-4 text-xs font-semibold text-brand-primary">
            <TrendingUp className="w-4 h-4" />
            How It Works
          </div>
          <h2 className="text-xl font-bold text-foreground mb-10">Get started in 3 steps</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
            {[
              { step: '1', title: 'Create an Account', body: 'Sign up free — no credit card needed. Your reading data stays private.' },
              { step: '2', title: 'Add Books You\'re Reading', body: 'Pick from our library of 1M+ books or add your own.' },
              { step: '3', title: 'Join the Community', body: 'Open a reading room, annotate a passage, or match your literary DNA.' },
            ].map(({ step, title, body }) => (
              <div key={step} className="flex flex-col items-center text-center gap-3">
                <div className="w-10 h-10 rounded-full bg-brand-primary text-white flex items-center justify-center text-base font-bold shadow-md shadow-brand-primary/30">
                  {step}
                </div>
                <h3 className="text-sm font-semibold text-foreground">{title}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">{body}</p>
              </div>
            ))}
          </div>
          <div className="mt-10">
            <Link to="/signup">
              <Button className="bg-brand-primary text-white hover:bg-brand-primary/90 px-8 h-10 text-sm font-semibold gap-2 shadow-md shadow-brand-primary/25">
                Join for Free <ArrowRight className="w-4 h-4" />
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
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-7 h-7 animate-spin text-brand-primary" />
      </div>
    );
  }

  // Guest view - show landing page if no specific tab is selected
  if (!user && !tabParam) return <GuestLanding />;

  const tabs = [
    { value: 'feed', label: 'Feed', icon: MessageCircle },
    {
      value: 'rooms',
      label: 'Rooms',
      icon: Radio,
      badge: rooms.length > 0 ? rooms.length : undefined,
      isLive: rooms.length > 0,
      color: 'text-emerald-600 dark:text-emerald-400',
    },
    {
      value: 'threads',
      label: 'Threads',
      icon: Lock,
      badge: spoilerThreads.length > 0 ? spoilerThreads.length : undefined,
      color: 'text-indigo-600 dark:text-indigo-400',
    },
    {
      value: 'margins',
      label: 'Margins',
      icon: Quote,
      badge: marginNotes.length > 0 ? marginNotes.length : undefined,
      color: 'text-amber-600 dark:text-amber-400',
    },
    { value: 'dna', label: 'DNA', icon: Dna, color: 'text-fuchsia-600 dark:text-fuchsia-400' },
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

      <div className="min-h-screen bg-background">
        {/* ── Page Header ── */}
        <div className="sticky top-0 z-20 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 border-b border-border shadow-xs">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 py-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              {/* Title */}
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-brand-primary/10 flex items-center justify-center shrink-0">
                  <Sparkles className="w-4 h-4 text-brand-primary" />
                </div>
                <div>
                  <h1 className="text-base font-bold text-foreground leading-none">Sahadhyayi Social</h1>
                  <p className="text-[11px] text-muted-foreground mt-0.5 hidden sm:block">
                    Live Rooms · Marginalia · Spoiler Threads · Reading DNA
                  </p>
                </div>
              </div>

              {/* Quick-jump pills */}
              <div className="flex items-center gap-1.5 flex-wrap">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleTabChange('rooms')}
                  className={`h-7 text-xs gap-1.5 border-emerald-500/30 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500/10 ${activeTab === 'rooms' ? 'bg-emerald-500/10' : ''}`}
                >
                  <Radio className="w-3 h-3 animate-pulse" />
                  Rooms
                  {rooms.length > 0 && (
                    <span className="ml-0.5 min-w-[16px] h-4 rounded-full bg-emerald-500 text-white text-[9px] font-bold flex items-center justify-center px-1">
                      {rooms.length}
                    </span>
                  )}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleTabChange('threads')}
                  className={`h-7 text-xs gap-1.5 border-indigo-500/30 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-500/10 ${activeTab === 'threads' ? 'bg-indigo-500/10' : ''}`}
                >
                  <Lock className="w-3 h-3" />
                  Threads
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleTabChange('margins')}
                  className={`h-7 text-xs gap-1.5 border-amber-500/30 text-amber-700 dark:text-amber-300 hover:bg-amber-500/10 ${activeTab === 'margins' ? 'bg-amber-500/10' : ''}`}
                >
                  <Quote className="w-3 h-3" />
                  Margins
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* ── Main Tabs ── */}
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6">
          <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
            {/* Scrollable tab bar */}
            <div className="overflow-x-auto scrollbar-none pb-1 mb-6 -mx-1 px-1">
              <TabsList className="bg-muted/60 rounded-xl p-1 inline-flex w-auto min-w-full sm:min-w-0 justify-start gap-0.5">
                {tabs.map(tab => (
                  <TabsTrigger
                    key={tab.value}
                    value={tab.value}
                    className="rounded-lg gap-1.5 text-xs sm:text-sm whitespace-nowrap data-[state=active]:bg-background data-[state=active]:shadow-sm data-[state=active]:text-brand-primary transition-all px-3 py-1.5 relative"
                  >
                    <tab.icon className="w-3.5 h-3.5 shrink-0" />
                    <span>{tab.label}</span>
                    {/* Live dot */}
                    {'isLive' in tab && tab.isLive && (
                      <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    )}
                    {/* Count badge */}
                    {'badge' in tab && tab.badge !== undefined && (
                      <Badge
                        variant="secondary"
                        className="text-[9px] px-1 h-3.5 bg-brand-primary/15 text-brand-primary border-none font-bold ml-0.5 leading-none"
                      >
                        {tab.badge}
                      </Badge>
                    )}
                  </TabsTrigger>
                ))}
              </TabsList>
            </div>

            {/* ── Feed ── */}
            <TabsContent value="feed" className="mt-0">
              <div className="max-w-2xl mx-auto">
                <ErrorBoundary
                  fallback={
                    <Card className="bg-card border-border rounded-2xl p-8 text-center">
                      <p className="text-sm font-semibold mb-2">Unable to display social feed</p>
                      <p className="text-xs text-muted-foreground mb-4">A temporary error occurred while rendering the community feed.</p>
                      <Button variant="outline" size="sm" onClick={() => window.location.reload()}>
                        Reload Feed
                      </Button>
                    </Card>
                  }
                >
                  <EnhancedSocialFeed />
                </ErrorBoundary>
              </div>
            </TabsContent>

            {/* ── Reading Rooms ── */}
            <TabsContent value="rooms" className="mt-0">
              <div className="max-w-3xl mx-auto">
                {/* Rooms context banner */}
                <div className="flex items-start gap-3 bg-emerald-500/8 border border-emerald-500/20 rounded-xl p-3.5 mb-5 text-sm">
                  <Radio className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0 animate-pulse" />
                  <div>
                    <p className="font-medium text-foreground text-xs">Live Reading Rooms</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Co-read in real-time with other readers. Focus timers and chapter sync keep everyone on the same page.
                    </p>
                  </div>
                </div>
                <Suspense fallback={<TabLoader />}>
                  <ReadingRoomsPanel />
                </Suspense>
              </div>
            </TabsContent>

            {/* ── Spoiler Threads ── */}
            <TabsContent value="threads" className="mt-0">
              <div className="max-w-2xl mx-auto">
                <div className="flex items-start gap-3 bg-indigo-500/8 border border-indigo-500/20 rounded-xl p-3.5 mb-5 text-sm">
                  <Lock className="w-4 h-4 text-indigo-600 mt-0.5 shrink-0" />
                  <div>
                    <p className="font-medium text-foreground text-xs">Chapter-Locked Threads</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Discussions unlock as you advance through chapters — zero spoiler risk by design.
                    </p>
                  </div>
                </div>
                <Suspense fallback={<TabLoader />}>
                  <SpoilerThreadsFeed />
                </Suspense>
              </div>
            </TabsContent>

            {/* ── Margin Notes ── */}
            <TabsContent value="margins" className="mt-0">
              <div className="max-w-2xl mx-auto">
                <div className="flex items-start gap-3 bg-amber-500/8 border border-amber-500/20 rounded-xl p-3.5 mb-5 text-sm">
                  <Quote className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
                  <div>
                    <p className="font-medium text-foreground text-xs">Public Marginalia</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Highlight passages and write notes that appear in the margins for all readers of the same book.
                    </p>
                  </div>
                </div>
                <Suspense fallback={<TabLoader />}>
                  <MarginNotesFeed />
                </Suspense>
              </div>
            </TabsContent>

            {/* ── Reading DNA ── */}
            <TabsContent value="dna" className="mt-0">
              <div className="max-w-2xl mx-auto">
                <div className="flex items-start gap-3 bg-fuchsia-500/8 border border-fuchsia-500/20 rounded-xl p-3.5 mb-5 text-sm">
                  <Dna className="w-4 h-4 text-fuchsia-600 mt-0.5 shrink-0" />
                  <div>
                    <p className="font-medium text-foreground text-xs">Reading DNA</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Your taste fingerprint across genres, pacing, and themes. Find readers who match your literary DNA.
                    </p>
                  </div>
                </div>
                <Suspense fallback={<TabLoader />}>
                  <ReadingDnaPanel />
                </Suspense>
              </div>
            </TabsContent>

            {/* ── Friends ── */}
            <TabsContent value="friends" className="mt-0">
              <EnhancedFriendsManager />
            </TabsContent>

            {/* ── Map ── */}
            <TabsContent value="map" className="mt-0">
              <div className="space-y-4">
                {/* Toggle */}
                <div className="flex items-center gap-1 p-1 bg-muted/60 rounded-xl border border-border w-fit">
                  <Button
                    size="sm"
                    variant={mapView === 'readers' ? 'default' : 'ghost'}
                    className={
                      mapView === 'readers'
                        ? 'h-8 px-3 text-xs bg-brand-primary text-white shadow-xs'
                        : 'h-8 px-3 text-xs text-muted-foreground hover:text-foreground'
                    }
                    onClick={() => setMapView('readers')}
                  >
                    <MapPin className="w-3.5 h-3.5 mr-1.5" />
                    Readers Near Me
                  </Button>
                  <Button
                    size="sm"
                    variant={mapView === 'friends' ? 'default' : 'ghost'}
                    className={
                      mapView === 'friends'
                        ? 'h-8 px-3 text-xs bg-brand-primary text-white shadow-xs'
                        : 'h-8 px-3 text-xs text-muted-foreground hover:text-foreground'
                    }
                    onClick={() => setMapView('friends')}
                  >
                    <Users className="w-3.5 h-3.5 mr-1.5" />
                    Friends on Map
                  </Button>
                </div>

                <Card className="border-border overflow-hidden">
                  {mapView === 'readers' ? <EnhancedReadingMap /> : <FriendsLocationMap />}
                </Card>
              </div>
            </TabsContent>

            {/* ── Groups ── */}
            <TabsContent value="groups" className="mt-0">
              <ReadingGroups />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </>
  );
};

export default SocialMedia;
