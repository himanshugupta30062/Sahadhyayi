import React, { useState, Suspense, lazy } from 'react';
import { useAuth } from '@/contexts/authHelpers';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
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
  TrendingUp,
  Plus,
  ArrowLeft,
  ChevronRight,
} from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';
import SignInLink from '@/components/SignInLink';
import SEO from '@/components/SEO';
import { SocialSurface } from '@/components/social/SocialSurface';
const EnhancedSocialFeed = lazy(() => import('@/components/social/EnhancedSocialFeed').then((module) => ({ default: module.EnhancedSocialFeed })));
const EnhancedReadingMap = lazy(() => import('@/components/social/EnhancedReadingMap').then((module) => ({ default: module.EnhancedReadingMap })));
const FriendsLocationMap = lazy(() => import('@/components/social/FriendsLocationMap').then((module) => ({ default: module.FriendsLocationMap })));
const ReadingGroups = lazy(() => import('@/components/social/ReadingGroups').then((module) => ({ default: module.ReadingGroups })));
const EnhancedFriendsManager = lazy(() => import('@/components/social/EnhancedFriendsManager').then((module) => ({ default: module.EnhancedFriendsManager })));
const BookPulseBar = lazy(() => import('@/components/social/BookPulseBar').then((module) => ({ default: module.BookPulseBar })));
import { useReadingRooms } from '@/hooks/useReadingRoom';
import { useGroups } from '@/hooks/useGroupManagement';
import { useAllUsers } from '@/hooks/useUserSearch';
import { useSendFriendRequest } from '@/hooks/useFriends';
import { useReadingProgress } from '@/hooks/useReadingProgress';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { toast } from 'sonner';

// Lazy-load the 4 book-native feature panels
const MarginNotesFeed = lazy(() => import('@/components/social/margins/MarginNotesFeed'));
const SpoilerThreadsFeed = lazy(() => import('@/components/social/threads/SpoilerThreadsFeed'));
const ReadingRoomsPanel = lazy(() => import('@/components/social/rooms/ReadingRoomsPanel'));
const ReadingDnaPanel = lazy(() => import('@/components/social/dna/ReadingDnaPanel'));

const VALID_SOCIAL_TABS = ['feed', 'rooms', 'threads', 'margins', 'dna', 'friends', 'map', 'groups'] as const;
const SOCIAL_TAB_LABELS: Record<string, string> = {
  feed: 'Community Feed',
  rooms: 'Reading Rooms',
  threads: 'Book Discussions',
  margins: 'Shared Marginalia',
  dna: 'Reading DNA',
  friends: 'Friends',
  map: 'Reader Map',
  groups: 'Reading Groups',
};

// Reusable lazy-load fallback
const TabLoader = () => (
  <div className="flex flex-col items-center justify-center py-16 gap-3 text-[#A5ADA6]">
    <Loader2 className="w-6 h-6 animate-spin text-[#D5B16D]" />
    <span className="text-xs tracking-wide">Loading community data…</span>
  </div>
);

const SocialFeatureLoader = () => <TabLoader />;

// Feature pillar cards for guest landing (matching design mockups)
const PILLARS = [
  {
    icon: Radio,
    color: 'emerald',
    title: 'Live Reading Rooms',
    desc: 'Join real-time book discussions with fellow readers.',
    tab: 'rooms',
    cta: 'Open a Room',
  },
  {
    icon: Quote,
    color: 'amber',
    title: 'Public Marginalia',
    desc: 'Explore highlights and notes from the community.',
    tab: 'margins',
    cta: 'Browse Margins',
  },
  {
    icon: Lock,
    color: 'indigo',
    title: 'Spoiler-Safe Threads',
    desc: 'Discuss books freely with spoiler tags.',
    tab: 'threads',
    cta: 'Join Threads',
  },
  {
    icon: Dna,
    color: 'fuchsia',
    title: 'Reading DNA Match',
    desc: 'Find readers with similar tastes and interests.',
    tab: 'dna',
    cta: 'Match DNA',
  },
] as const;

const iconColorMap = {
  emerald: 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30',
  amber: 'bg-amber-500/15 text-amber-400 border border-amber-500/30',
  indigo: 'bg-indigo-500/15 text-indigo-400 border border-indigo-500/30',
  fuchsia: 'bg-fuchsia-500/15 text-fuchsia-400 border border-fuchsia-500/30',
};

// ─── Guest (unauthenticated) landing ─────────────────────────────────────────
const GuestLanding: React.FC = () => {

  return (
    <>
      <SEO
        title="Where Readers Connect Around Books | Sahadhyayi"
        description="Join Sahadhyayi's reading community. Experience live reading rooms, public marginalia, spoiler-free chapter threads, and reader taste matching."
        canonical="https://sahadhyayi.com/social"
        url="https://sahadhyayi.com/social"
      />

      <div className="min-h-screen bg-[#FAF7F2] dark:bg-[#0B0D0C] text-[#1C201D] dark:text-[#F3F0E7] transition-colors duration-200">
        {/* ── Hero Section ── */}
        <section className="relative overflow-hidden border-b border-[#E8E2D9] dark:border-[#29332D] bg-gradient-to-b from-[#F4EFEA] via-[#FAF7F2] to-[#FAF7F2] dark:from-[#111614] dark:via-[#0B0D0C] dark:to-[#0B0D0C] py-20 px-4 sm:px-6 lg:px-8">
          <div className="pointer-events-none absolute inset-0 overflow-hidden">
            <div className="absolute -top-32 -right-32 w-[32rem] h-[32rem] rounded-full bg-emerald-500/10 dark:bg-emerald-950/20 blur-3xl" />
            <div className="absolute -bottom-24 -left-24 w-80 h-80 rounded-full bg-[#B68A35]/10 dark:bg-[#D5B16D]/5 blur-3xl" />
          </div>

          <div className="relative max-w-4xl mx-auto text-center">
            {/* Eyebrow Label */}
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white dark:bg-[#111614] border border-[#E8E2D9] dark:border-[#29332D] text-[11px] font-semibold uppercase tracking-widest text-[#1C442D] dark:text-[#D5B16D] mb-6 shadow-xs">
              <Sparkles className="w-3.5 h-3.5" />
              A Reading Community
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-serif font-bold text-[#1C201D] dark:text-[#F3F0E7] mb-6 tracking-tight leading-[1.15]">
              Where readers connect{' '}
              <span className="text-[#1C442D] dark:text-[#D5B16D]">around books.</span>
            </h1>

            <p className="text-base sm:text-lg text-[#636B65] dark:text-[#A5ADA6] max-w-2xl mx-auto mb-10 leading-relaxed font-normal">
              Share what you're reading, explore ideas, join reading rooms, and find people who see the world through books.
            </p>

            {/* Action CTAs */}
            <div className="flex flex-col sm:flex-row gap-3 justify-center mb-12">
              <Link to="/signup">
                <Button className="w-full sm:w-auto bg-[#1C442D] hover:bg-[#143221] text-white dark:bg-[#D5B16D] dark:hover:bg-[#c49f5c] dark:text-[#0B0D0C] font-semibold px-7 h-11 text-sm shadow-md gap-2">
                  Create an account
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
              <SignInLink redirectPath="/social">
                <Button
                  variant="outline"
                  className="w-full sm:w-auto border-[#E8E2D9] dark:border-[#29332D] bg-white dark:bg-[#111614] text-[#1C201D] dark:text-[#F3F0E7] hover:bg-[#F4EFEA] dark:hover:bg-[#1B241E] px-7 h-11 text-sm font-medium"
                >
                  Sign in
                </Button>
              </SignInLink>
            </div>

            {/* Live Activity Pulse bar */}
            <div className="max-w-3xl mx-auto">
              <ErrorBoundary fallback={null}>
                <Suspense fallback={<div className="h-24 animate-pulse rounded-xl bg-[#EBF2EC]/60 dark:bg-[#1C3024]/40" aria-label="Loading community pulse" />}>
                  <BookPulseBar />
                </Suspense>
              </ErrorBoundary>
            </div>
          </div>
        </section>

        {/* ── 4 Feature Pillar Cards ── */}
        <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center max-w-xl mx-auto mb-12">
            <h2 className="text-2xl sm:text-3xl font-serif font-bold text-[#1C201D] dark:text-[#F3F0E7] mb-3">
              Built for Deep Reading Culture
            </h2>
            <p className="text-sm text-[#636B65] dark:text-[#A5ADA6] leading-relaxed">
              Every interaction is anchored to a specific book and chapter — no empty scrolling, just meaningful literary connection.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {PILLARS.map(({ icon: Icon, color, title, desc, cta, tab }) => (
              <SignInLink
                key={tab}
                redirectPath={`/social?tab=${tab}`}
                className="block group"
              >
                <Card className="h-full border border-[#E8E2D9] dark:border-[#29332D] bg-white dark:bg-[#111614] hover:bg-[#F4EFEA] dark:hover:bg-[#161D19] hover:border-[#1C442D]/40 dark:hover:border-[#315C43] transition-all duration-200 shadow-[0_2px_8px_rgba(28,32,29,0.04)] dark:shadow-xs hover:shadow-md cursor-pointer">
                  <CardContent className="p-5 flex flex-col h-full text-[#1C201D] dark:text-[#F3F0E7]">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-4 ${iconColorMap[color]}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <h3 className="text-sm font-semibold text-[#1C201D] dark:text-[#F3F0E7] mb-2 group-hover:text-[#1C442D] dark:group-hover:text-[#D5B16D] transition-colors">
                      {title}
                    </h3>
                    <p className="text-xs text-[#636B65] dark:text-[#A5ADA6] leading-relaxed flex-1">
                      {desc}
                    </p>
                    <div className="mt-4 text-xs font-semibold flex items-center gap-1.5 text-[#1C442D] dark:text-[#D5B16D] group-hover:underline">
                      <span>{cta}</span>
                      <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
                    </div>
                  </CardContent>
                </Card>
              </SignInLink>
            ))}
          </div>
        </section>

        {/* ── How It Works (3 Steps, Honest) ── */}
        <section className="bg-[#F4EFEA] dark:bg-[#111614] border-t border-[#E8E2D9] dark:border-[#29332D] py-16 px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 mb-3 text-xs font-semibold text-[#1C442D] dark:text-[#D5B16D]">
              <TrendingUp className="w-4 h-4" />
              How It Works
            </div>
            <h2 className="text-xl sm:text-2xl font-serif font-bold text-[#1C201D] dark:text-[#F3F0E7] mb-12">
              Get started in 3 steps
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 text-left">
              {[
                {
                  step: '1',
                  title: 'Create an Account',
                  body: 'Sign up free — no credit card needed. Your reading data stays private.',
                },
                {
                  step: '2',
                  title: 'Add Books You’re Reading',
                  body: 'Search books in our catalog or start your personal digital shelf.',
                },
                {
                  step: '3',
                  title: 'Join the Community',
                  body: 'Open a reading room, annotate a passage, or match your literary DNA.',
                },
              ].map(({ step, title, body }) => (
                <div key={step} className="flex flex-col gap-3 p-4 rounded-xl bg-white dark:bg-[#0B0D0C]/50 border border-[#E8E2D9] dark:border-[#29332D]/60 shadow-[0_2px_8px_rgba(28,32,29,0.04)] dark:shadow-none">
                  <div className="w-9 h-9 rounded-full bg-[#EBF2EC] dark:bg-[#1C3024] border border-[#C8DBCB] dark:border-[#315C43] text-[#1C442D] dark:text-[#D5B16D] flex items-center justify-center text-sm font-bold shadow-xs">
                    {step}
                  </div>
                  <h3 className="text-sm font-semibold text-[#1C201D] dark:text-[#F3F0E7]">{title}</h3>
                  <p className="text-xs text-[#636B65] dark:text-[#A5ADA6] leading-relaxed">{body}</p>
                </div>
              ))}
            </div>
            <div className="mt-12 flex justify-center gap-3">
              <Link to="/signup">
                <Button className="bg-[#1C442D] hover:bg-[#143221] text-white dark:bg-[#D5B16D] dark:hover:bg-[#c49f5c] dark:text-[#0B0D0C] font-semibold px-8 h-10 text-sm gap-2 shadow-sm">
                  Join for Free <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </div>
    </>
  );
};

// ─── Authenticated View ───────────────────────────────────────────────────────
const AuthenticatedSocialMedia: React.FC<{ user: NonNullable<ReturnType<typeof useAuth>['user']> }> = ({ user }) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const tabParam = searchParams.get('tab');
  const activeTab = VALID_SOCIAL_TABS.includes(tabParam as (typeof VALID_SOCIAL_TABS)[number])
    ? (tabParam as string)
    : 'feed';

  const [mapView, setMapView] = useState<'readers' | 'friends'>('readers');

  // Fetch community data
  const { data: rooms = [], isLoading: isLoadingRooms, error: roomsError, refetch: refetchRooms } = useReadingRooms();
  const { data: groups = [], isLoading: isLoadingGroups, error: groupsError, refetch: refetchGroups } = useGroups();
  const { data: allUsers = [], isLoading: isLoadingUsers, error: usersError, refetch: refetchUsers } = useAllUsers();
  const { data: readingProgress = [] } = useReadingProgress();
  const sendFriendRequest = useSendFriendRequest();

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

  const handleSendRequest = async (userId: string, name: string) => {
    try {
      await sendFriendRequest.mutateAsync({ addresseeId: userId });
      toast.success(`Friend request sent to ${name}!`);
    } catch {
      toast.error('Unable to send friend request. Please try again.');
    }
  };

  const currentProgress = readingProgress[0];

  return (
    <>
      <SEO
        title="Social Reading Community | Sahadhyayi"
        description="Connect with fellow readers, co-read in live rooms, share margin notes, and discover book discussions."
        canonical="https://sahadhyayi.com/social"
        url="https://sahadhyayi.com/social"
      />

      <div className="social-experience min-h-screen bg-[#FAF7F2] dark:bg-[#0B0D0C] text-[#1C201D] dark:text-[#F3F0E7] transition-colors duration-200">
        {/* ── Main Viewport Content ── */}
        <div className="mx-auto max-w-[1440px] px-4 py-8 sm:px-6 lg:px-8">
          <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
            {/* Content-first community layout: feed plus contextual discovery */}
            <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
              {/* ── Community Stream & Feature Content ── */}
              <section className="min-w-0 space-y-6">
                {activeTab !== 'feed' && (
                  <div className="flex flex-wrap items-center gap-2 text-sm">
                    <button
                      type="button"
                      onClick={() => handleTabChange('feed')}
                      className="inline-flex items-center gap-2 rounded-lg py-1.5 font-medium text-[#1C442D] transition-colors hover:text-[#143221] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1C442D] dark:text-[#D5B16D] dark:hover:text-[#E4C78F] dark:focus-visible:ring-[#D5B16D]"
                    >
                      <ArrowLeft className="h-4 w-4" />
                      Community feed
                    </button>
                    <span aria-hidden="true" className="text-[#A5ADA6]">/</span>
                    <span className="font-medium text-[#636B65] dark:text-[#A5ADA6]">
                      {SOCIAL_TAB_LABELS[activeTab] || 'Community'}
                    </span>
                  </div>
                )}
                {/* ── Feed Tab ── */}
                <TabsContent value="feed" className="mt-0 space-y-6">
                  {/* Editorial community heading and primary action */}
                  <div className="flex flex-col gap-4 border-b border-[#E8E2D9] dark:border-[#29332D] pb-5 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                      <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#1C442D] dark:text-[#D5B16D]">
                        Your reading life, together
                      </p>
                      <h1 className="text-2xl sm:text-3xl font-serif font-bold tracking-tight text-[#1C201D] dark:text-[#F3F0E7]">
                        Your Reading Community
                      </h1>
                      <p className="mt-2 max-w-2xl text-sm leading-relaxed text-[#636B65] dark:text-[#A5ADA6]">
                        Discover what readers are thinking, share a passage that stayed with you, and find your next bookish conversation.
                      </p>
                    </div>
                    <Button
                      onClick={() => {
                        handleTabChange('feed');
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                        window.setTimeout(() => {
                          const el = document.getElementById('feed-composer-textarea');
                          if (el) el.focus();
                        }, 100);
                      }}
                      className="h-10 shrink-0 gap-2 rounded-xl bg-[#1C442D] px-4 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-[#143221] dark:bg-[#D5B16D] dark:text-[#0B0D0C] dark:hover:bg-[#c49f5c]"
                    >
                      <Plus className="h-4 w-4" />
                      Start a conversation
                    </Button>
                  </div>

                  {/* Feature shortcuts, not a second navigation bar */}
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 2xl:grid-cols-4" aria-label="Community shortcuts">
                    {[
                      {
                        value: 'rooms',
                        title: 'Read together',
                        description: 'Join a live reading room and make reading a shared ritual.',
                        icon: Radio,
                      },
                      {
                        value: 'threads',
                        title: 'Book discussions',
                        description: 'Talk through chapters with spoiler-aware conversations.',
                        icon: Lock,
                      },
                      {
                        value: 'margins',
                        title: 'Shared marginalia',
                        description: 'Discover notes and passages readers have saved.',
                        icon: Quote,
                      },
                      {
                        value: 'friends',
                        title: 'Discover readers',
                        description: 'Meet readers who might become your next book friends.',
                        icon: Users,
                      },
                    ].map(({ value, title, description, icon: Icon }) => (
                      <button
                        key={value}
                        type="button"
                        onClick={() => handleTabChange(value)}
                        className="group flex min-h-[112px] w-full items-start gap-3 rounded-2xl border border-[#E8E2D9] bg-white p-4 text-left shadow-[0_2px_8px_rgba(28,32,29,0.03)] transition-all hover:-translate-y-0.5 hover:border-[#C8DBCB] hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1C442D] dark:border-[#29332D] dark:bg-[#111614] dark:hover:border-[#315C43] dark:focus-visible:ring-[#D5B16D]"
                      >
                        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[#C8DBCB] bg-[#EBF2EC] text-[#1C442D] transition-colors group-hover:bg-[#DDEADF] dark:border-[#315C43] dark:bg-[#1C3024] dark:text-[#D5B16D] dark:group-hover:bg-[#243D2C]">
                          <Icon className="h-5 w-5" aria-hidden="true" />
                        </span>
                        <span className="min-w-0">
                          <span className="block text-sm font-semibold tracking-tight text-[#1C201D] dark:text-[#F3F0E7]">
                            {title}
                          </span>
                          <span className="mt-1.5 block text-xs leading-relaxed text-[#636B65] dark:text-[#A5ADA6]">
                            {description}
                          </span>
                        </span>
                      </button>
                    ))}
                  </div>

                  <div className="flex flex-wrap items-center gap-2 border-b border-[#E8E2D9] pb-5 text-xs dark:border-[#29332D]">
                    <span className="mr-1 font-medium text-[#636B65] dark:text-[#A5ADA6]">More to explore</span>
                    {[
                      { value: 'dna', label: 'Reading DNA' },
                      { value: 'map', label: 'Reader map' },
                      { value: 'groups', label: 'Reading groups' },
                    ].map((item) => (
                      <button
                        key={item.value}
                        type="button"
                        onClick={() => handleTabChange(item.value)}
                        className="rounded-full border border-[#E8E2D9] bg-white px-3 py-1.5 font-medium text-[#1C442D] transition-colors hover:border-[#C8DBCB] hover:bg-[#EBF2EC] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1C442D] dark:border-[#29332D] dark:bg-[#111614] dark:text-[#D5B16D] dark:hover:border-[#315C43] dark:hover:bg-[#1C3024] dark:focus-visible:ring-[#D5B16D]"
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>

                  <Suspense fallback={<SocialFeatureLoader />}>
                  <ErrorBoundary
                    fallback={
                      <SocialSurface className="p-8 text-center">
                        <p className="text-sm font-semibold mb-2">Unable to display social feed</p>
                        <p className="text-xs text-[#636B65] dark:text-[#A5ADA6] mb-4">
                          A temporary error occurred while rendering the community feed.
                        </p>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => window.location.reload()}
                          className="border-[#E8E2D9] dark:border-[#29332D] bg-[#FAF7F2] dark:bg-[#111614] text-[#1C201D] dark:text-[#F3F0E7]"
                        >
                          Reload Feed
                        </Button>
                      </SocialSurface>
                    }
                  >
                    <EnhancedSocialFeed />
                  </ErrorBoundary>
                  </Suspense>
                </TabsContent>

                {/* ── Reading Rooms Tab ── */}
                <TabsContent value="rooms" className="mt-0 space-y-6">
                  <div className="flex items-start gap-3 bg-[#EBF2EC] dark:bg-[#16211A] border border-[#C8DBCB] dark:border-[#315C43]/50 rounded-xl p-4 text-sm text-[#1C201D] dark:text-[#F3F0E7]">
                    <Radio className="w-4 h-4 text-emerald-600 dark:text-emerald-400 mt-0.5 shrink-0 animate-pulse" />
                    <div>
                      <p className="font-semibold text-xs text-[#1C201D] dark:text-[#F3F0E7]">Live Reading Rooms</p>
                      <p className="text-xs text-[#636B65] dark:text-[#A5ADA6] mt-0.5">
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
                  <div className="flex items-start gap-3 bg-[#EEF2FF] dark:bg-[#181C26] border border-[#C7D2FE] dark:border-indigo-500/30 rounded-xl p-4 text-sm text-[#1C201D] dark:text-[#F3F0E7]">
                    <Lock className="w-4 h-4 text-indigo-600 dark:text-indigo-400 mt-0.5 shrink-0" />
                    <div>
                      <p className="font-semibold text-xs text-[#1C201D] dark:text-[#F3F0E7]">Chapter-Locked Discussions</p>
                      <p className="text-xs text-[#636B65] dark:text-[#A5ADA6] mt-0.5">
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
                  <div className="flex items-start gap-3 bg-[#FEF9EE] dark:bg-[#241E14] border border-[#FDE68A] dark:border-amber-500/30 rounded-xl p-4 text-sm text-[#1C201D] dark:text-[#F3F0E7]">
                    <Quote className="w-4 h-4 text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
                    <div>
                      <p className="font-semibold text-xs text-[#1C201D] dark:text-[#F3F0E7]">Public Marginalia</p>
                      <p className="text-xs text-[#636B65] dark:text-[#A5ADA6] mt-0.5">
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
                  <div className="flex items-start gap-3 bg-[#FDF4FF] dark:bg-[#231422] border border-[#F5D0FE] dark:border-fuchsia-500/30 rounded-xl p-4 text-sm text-[#1C201D] dark:text-[#F3F0E7]">
                    <Dna className="w-4 h-4 text-fuchsia-600 dark:text-fuchsia-400 mt-0.5 shrink-0" />
                    <div>
                      <p className="font-semibold text-xs text-[#1C201D] dark:text-[#F3F0E7]">Reading DNA</p>
                      <p className="text-xs text-[#636B65] dark:text-[#A5ADA6] mt-0.5">
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
                  <Suspense fallback={<TabLoader />}>
                    <EnhancedFriendsManager />
                  </Suspense>
                </TabsContent>

                {/* ── Map Tab ── */}
                <TabsContent value="map" className="mt-0 space-y-4">
                  <div className="flex items-center gap-1 p-1 bg-white dark:bg-[#111614] rounded-xl border border-[#E8E2D9] dark:border-[#29332D] shadow-[0_2px_8px_rgba(28,32,29,0.04)] w-fit">
                    <Button
                      size="sm"
                      variant={mapView === 'readers' ? 'default' : 'ghost'}
                      className={
                        mapView === 'readers'
                          ? 'h-8 px-3 text-xs bg-[#1C442D] text-white dark:bg-[#1C3024] dark:border dark:border-[#315C43] dark:text-[#F3F0E7] shadow-xs'
                          : 'h-8 px-3 text-xs text-[#636B65] hover:text-[#1C201D] hover:bg-[#FAF7F2] dark:text-[#A5ADA6] dark:hover:text-[#F3F0E7] dark:hover:bg-[#1B241E]'
                      }
                      onClick={() => setMapView('readers')}
                    >
                      <MapPin className="w-3.5 h-3.5 mr-1.5 text-emerald-600 dark:text-emerald-400" />
                      Readers Near Me
                    </Button>
                    <Button
                      size="sm"
                      variant={mapView === 'friends' ? 'default' : 'ghost'}
                      className={
                        mapView === 'friends'
                          ? 'h-8 px-3 text-xs bg-[#1C442D] text-white dark:bg-[#1C3024] dark:border dark:border-[#315C43] dark:text-[#F3F0E7] shadow-xs'
                          : 'h-8 px-3 text-xs text-[#636B65] hover:text-[#1C201D] hover:bg-[#FAF7F2] dark:text-[#A5ADA6] dark:hover:text-[#F3F0E7] dark:hover:bg-[#1B241E]'
                      }
                      onClick={() => setMapView('friends')}
                    >
                      <Users className="w-3.5 h-3.5 mr-1.5 text-[#1C442D] dark:text-[#D5B16D]" />
                      Friends on Map
                    </Button>
                  </div>

                  <Card className="border-[#E8E2D9] dark:border-[#29332D] bg-white dark:bg-[#111614] overflow-hidden text-[#1C201D] dark:text-[#F3F0E7] shadow-[0_2px_8px_rgba(28,32,29,0.04)] dark:shadow-none">
                    <Suspense fallback={<TabLoader />}>
                      {mapView === 'readers' ? <EnhancedReadingMap /> : <FriendsLocationMap />}
                    </Suspense>
                  </Card>
                </TabsContent>

                {/* ── Groups Tab ── */}
                <TabsContent value="groups" className="mt-0">
                  <Suspense fallback={<TabLoader />}>
                    <ReadingGroups />
                  </Suspense>
                </TabsContent>
              </section>

              {/* ── Right Column: Discovery Sidebar (Desktop) ── */}
              <aside className="hidden space-y-5 xl:block">
                <div className="sticky top-20 space-y-5">
                  {/* Card 1: Live Reading Rooms */}
                  <SocialSurface className="p-4">
                    <div className="flex items-center justify-between pb-2 mb-3 border-b border-[#E8E2D9] dark:border-[#29332D]">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-xs text-[#1C201D] dark:text-[#F3F0E7]">Reading Rooms</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleTabChange('rooms')}
                        className="text-[11px] font-semibold text-[#1C442D] dark:text-[#D5B16D] hover:underline flex items-center gap-0.5"
                      >
                        See all <ChevronRight className="w-3 h-3" />
                      </button>
                    </div>

                    {isLoadingRooms ? (
                      <div className="flex items-center justify-center gap-2 py-5 text-xs text-[#636B65] dark:text-[#A5ADA6]" role="status">
                        <Loader2 className="h-4 w-4 animate-spin" /> Loading rooms…
                      </div>
                    ) : roomsError ? (
                      <div className="py-4 text-center">
                        <p className="text-xs text-red-700 dark:text-red-300">Reading rooms could not be loaded.</p>
                        <button type="button" onClick={() => void refetchRooms()} className="mt-2 text-xs font-semibold text-[#1C442D] hover:underline dark:text-[#D5B16D]">Retry</button>
                      </div>
                    ) : rooms.length === 0 ? (
                      <div className="py-4 text-center">
                        <p className="text-xs text-[#636B65] dark:text-[#A5ADA6]">No reading rooms to show right now.</p>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleTabChange('rooms')}
                          className="mt-3 text-xs h-7 border-[#E8E2D9] dark:border-[#29332D] bg-[#F4EFEA] dark:bg-[#16211A] text-[#1C201D] dark:text-[#F3F0E7] hover:border-[#1C442D]/40 dark:hover:border-[#315C43]"
                        >
                          Explore rooms
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-2.5">
                        {rooms.slice(0, 2).map((room) => {
                          const bookTitle = room.books_library?.title || 'Current Book';
                          return (
                            <div
                              key={room.id}
                              className="rounded-xl border border-[#E8E2D9] dark:border-[#29332D]/70 bg-[#FAF7F2] dark:bg-[#16211A]/50 p-2.5 flex items-center justify-between gap-2.5 transition-colors hover:border-[#1C442D]/40 dark:hover:border-[#315C43] hover:bg-[#F4EFEA] dark:hover:bg-[#16211A]"
                            >
                              <div className="flex items-center gap-2.5 min-w-0 flex-1">
                                {room.books_library?.cover_image_url ? (
                                  <img
                                    src={room.books_library.cover_image_url}
                                    alt={bookTitle}
                                    className="h-10 w-7 shrink-0 rounded object-cover shadow-xs"
                                  />
                                ) : (
                                  <div className="flex h-10 w-7 shrink-0 items-center justify-center rounded bg-[#EBF2EC] dark:bg-[#1C3024] text-[#1C442D] dark:text-[#D5B16D]">
                                    <BookOpen className="h-3.5 w-3.5" />
                                  </div>
                                )}
                                <div className="min-w-0 flex-1">
                                  <p className="truncate text-xs font-medium text-[#1C201D] dark:text-[#F3F0E7]">
                                    {room.name}
                                  </p>
                                  <p className="text-[11px] text-[#636B65] dark:text-[#A5ADA6]">
                                    {typeof ((room as any).participants_count ?? (room as any).active_readers_count) === 'number'
                                      ? `${(room as any).participants_count ?? (room as any).active_readers_count} in room`
                                      : 'Room available'}
                                  </p>
                                </div>
                              </div>
                              <Button
                                size="sm"
                                onClick={() => handleTabChange('rooms')}
                                className="h-7 text-xs px-2.5 border-[#E8E2D9] dark:border-[#29332D] bg-white dark:bg-[#111614] hover:bg-[#FAF7F2] dark:hover:bg-[#1C3024] text-[#1C201D] dark:text-[#F3F0E7] shrink-0"
                              >
                                Explore
                              </Button>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </SocialSurface>

                  {/* Card 2: Popular Groups */}
                  <SocialSurface className="p-4">
                    <div className="flex items-center justify-between pb-2 mb-3 border-b border-[#E8E2D9] dark:border-[#29332D]">
                      <span className="font-semibold text-xs text-[#1C201D] dark:text-[#F3F0E7]">Popular Groups</span>
                      <button
                        type="button"
                        onClick={() => handleTabChange('groups')}
                        className="text-[11px] font-semibold text-[#1C442D] dark:text-[#D5B16D] hover:underline flex items-center gap-0.5"
                      >
                        See all <ChevronRight className="w-3 h-3" />
                      </button>
                    </div>

                    {isLoadingGroups ? (
                      <div className="flex items-center justify-center gap-2 py-5 text-xs text-[#636B65] dark:text-[#A5ADA6]" role="status">
                        <Loader2 className="h-4 w-4 animate-spin" /> Loading groups…
                      </div>
                    ) : groupsError ? (
                      <div className="py-4 text-center">
                        <p className="text-xs text-red-700 dark:text-red-300">Reading groups could not be loaded.</p>
                        <button type="button" onClick={() => void refetchGroups()} className="mt-2 text-xs font-semibold text-[#1C442D] hover:underline dark:text-[#D5B16D]">Retry</button>
                      </div>
                    ) : groups.length === 0 ? (
                      <div className="py-4 text-center">
                        <p className="text-xs text-[#636B65] dark:text-[#A5ADA6]">No reading groups found.</p>
                      </div>
                    ) : (
                      <div className="space-y-2.5">
                        {groups.slice(0, 3).map((group) => {
                          const memberCount = group.group_members?.[0]?.count ?? group.member_count ?? null;
                          return (
                            <div
                              key={group.id}
                              className="rounded-xl border border-[#E8E2D9] dark:border-[#29332D]/70 bg-[#FAF7F2] dark:bg-[#111614] p-2.5 flex items-center justify-between gap-2.5 transition-colors hover:border-[#1C442D]/40 dark:hover:border-[#315C43] hover:bg-[#F4EFEA] dark:hover:bg-[#161D19]"
                            >
                              <div className="flex items-center gap-2.5 min-w-0 flex-1">
                                {group.image_url ? (
                                  <img
                                    src={group.image_url}
                                    alt={group.name}
                                    className="h-9 w-9 shrink-0 rounded-lg object-cover"
                                  />
                                ) : (
                                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#EBF2EC] dark:bg-[#1C3024] text-[#1C442D] dark:text-[#D5B16D]">
                                    <UsersIcon className="h-4 w-4" />
                                  </div>
                                )}
                                <div className="min-w-0 flex-1">
                                  <p className="truncate text-xs font-medium text-[#1C201D] dark:text-[#F3F0E7]">
                                    {group.name}
                                  </p>
                                  <p className="text-[11px] text-[#636B65] dark:text-[#A5ADA6]">
                                    {memberCount === null ? 'Member count unavailable' : `${memberCount} ${memberCount === 1 ? 'member' : 'members'}`}
                                  </p>
                                </div>
                              </div>
                              <Button
                                size="sm"
                                onClick={() => handleTabChange('groups')}
                                className="h-7 text-xs px-2.5 border-[#E8E2D9] dark:border-[#29332D] bg-white dark:bg-[#16211A] hover:bg-[#FAF7F2] dark:hover:bg-[#1C3024] text-[#1C201D] dark:text-[#F3F0E7] shrink-0"
                              >
                                Open
                              </Button>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </SocialSurface>

                  {/* Card 3: Suggested Readers */}
                  <SocialSurface className="p-4">
                    <div className="flex items-center justify-between pb-2 mb-3 border-b border-[#E8E2D9] dark:border-[#29332D]">
                      <span className="font-semibold text-xs text-[#1C201D] dark:text-[#F3F0E7]">Suggested Readers</span>
                      <button
                        type="button"
                        onClick={() => handleTabChange('friends')}
                        className="text-[11px] font-semibold text-[#1C442D] dark:text-[#D5B16D] hover:underline flex items-center gap-0.5"
                      >
                        See all <ChevronRight className="w-3 h-3" />
                      </button>
                    </div>

                    {isLoadingUsers ? (
                      <div className="flex items-center justify-center gap-2 py-5 text-xs text-[#636B65] dark:text-[#A5ADA6]" role="status">
                        <Loader2 className="h-4 w-4 animate-spin" /> Finding readers…
                      </div>
                    ) : usersError ? (
                      <div className="py-4 text-center">
                        <p className="text-xs text-red-700 dark:text-red-300">Reader suggestions could not be loaded.</p>
                        <button type="button" onClick={() => void refetchUsers()} className="mt-2 text-xs font-semibold text-[#1C442D] hover:underline dark:text-[#D5B16D]">Retry</button>
                      </div>
                    ) : allUsers.length === 0 ? (
                      <div className="py-4 text-center">
                        <p className="text-xs text-[#636B65] dark:text-[#A5ADA6]">Connect with friends on Sahadhyayi.</p>
                      </div>
                    ) : (
                      <div className="space-y-2.5">
                        {allUsers.slice(0, 3).map((reader) => (
                          <div
                            key={reader.id}
                            className="rounded-xl border border-[#E8E2D9] dark:border-[#29332D]/70 bg-[#FAF7F2] dark:bg-[#111614] p-2.5 flex items-center justify-between gap-2.5 transition-colors hover:border-[#1C442D]/40 dark:hover:border-[#315C43] hover:bg-[#F4EFEA] dark:hover:bg-[#161D19]"
                          >
                            <div className="flex items-center gap-2.5 min-w-0 flex-1">
                              <Avatar className="h-8 w-8 border border-[#E8E2D9] dark:border-[#29332D] shrink-0">
                                <AvatarImage src={reader.profile_photo_url} alt={reader.full_name} />
                                <AvatarFallback className="bg-[#EBF2EC] text-[#1C442D] dark:bg-[#1C3024] dark:text-[#D5B16D] text-xs font-bold">
                                  {reader.full_name?.charAt(0) || 'R'}
                                </AvatarFallback>
                              </Avatar>
                              <div className="min-w-0 flex-1">
                                <p className="truncate text-xs font-medium text-[#1C201D] dark:text-[#F3F0E7]">
                                  {reader.full_name}
                                </p>
                                <p className="truncate text-[10px] text-[#636B65] dark:text-[#A5ADA6]">
                                  Reads · {reader.username ? `@${reader.username}` : 'Sahadhyayi reader'}
                                </p>
                              </div>
                            </div>
                            <Button
                              size="sm"
                              onClick={() => handleSendRequest(reader.id, reader.full_name)}
                              disabled={sendFriendRequest.isPending}
                              className="h-7 text-xs px-2.5 border-[#E8E2D9] dark:border-[#29332D] bg-white dark:bg-[#16211A] hover:bg-[#FAF7F2] dark:hover:bg-[#1C3024] text-[#1C442D] dark:text-[#D5B16D] shrink-0"
                            >
                              Add friend
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </SocialSurface>

                  {/* Card 4: Your Reading Progress (if active) */}
                  {currentProgress && (
                    <SocialSurface className="p-4">
                      <div className="flex items-center justify-between pb-2 mb-3 border-b border-[#E8E2D9] dark:border-[#29332D]">
                        <span className="font-semibold text-xs text-[#1C201D] dark:text-[#F3F0E7]">Your Reading Progress</span>
                        <Link
                          to="/dashboard"
                          className="text-[11px] font-semibold text-[#1C442D] dark:text-[#D5B16D] hover:underline flex items-center gap-0.5"
                        >
                          See all <ChevronRight className="w-3 h-3" />
                        </Link>
                      </div>
                      <div className="flex items-start gap-3">
                        {currentProgress.cover_image_url ? (
                          <img
                            src={currentProgress.cover_image_url}
                            alt={currentProgress.book_title}
                            className="h-14 w-10 shrink-0 rounded object-cover shadow-sm"
                          />
                        ) : (
                          <div className="flex h-14 w-10 shrink-0 items-center justify-center rounded bg-[#EBF2EC] dark:bg-[#1C3024] text-[#1C442D] dark:text-[#D5B16D]">
                            <BookOpen className="h-5 w-5" />
                          </div>
                        )}
                        <div className="min-w-0 flex-1 space-y-1.5">
                          <p className="truncate text-xs font-semibold text-[#1C201D] dark:text-[#F3F0E7]">
                            {currentProgress.book_title}
                          </p>
                          <div className="flex items-center justify-between text-[11px] text-[#636B65] dark:text-[#A5ADA6]">
                            <span>Progress</span>
                            <span className="text-[#1C442D] dark:text-[#D5B16D] font-bold">
                              {currentProgress.total_pages > 0
                                ? Math.round((currentProgress.current_page / currentProgress.total_pages) * 100)
                                : 0}%
                            </span>
                          </div>
                          <div className="w-full bg-[#E8E2D9] dark:bg-[#1C3024] h-1.5 rounded-full overflow-hidden">
                            <div
                              className="bg-[#1C442D] dark:bg-[#D5B16D] h-full rounded-full transition-all duration-300"
                              style={{
                                width: `${
                                  currentProgress.total_pages > 0
                                    ? Math.min(100, Math.round((currentProgress.current_page / currentProgress.total_pages) * 100))
                                    : 0
                                }%`,
                              }}
                            />
                          </div>
                          {currentProgress.book_id && (
                            <Link
                              to={`/book/${currentProgress.book_id}`}
                              className="inline-block mt-1 text-[11px] font-semibold text-[#1C442D] dark:text-[#D5B16D] hover:underline"
                            >
                              Continue Reading →
                            </Link>
                          )}
                        </div>
                      </div>
                    </SocialSurface>
                  )}

                  {/* Card 5: Literary Quote Widget (from design mockup) */}
                  <SocialSurface className="p-4 bg-gradient-to-br from-[#F4EFEA] via-[#FAF7F2] to-[#EBF2EC] dark:from-[#111614] dark:via-[#141A16] dark:to-[#0E1210] border-[#E8E2D9] dark:border-[#29332D]">
                    <Quote className="w-5 h-5 text-[#1C442D]/60 dark:text-[#D5B16D]/60 mb-2" />
                    <p className="text-xs italic text-[#1C201D] dark:text-[#F3F0E7] font-serif leading-relaxed">
                      &ldquo;A room full of readers is a room full of friends.&rdquo;
                    </p>
                    <p className="text-[11px] text-[#636B65] dark:text-[#A5ADA6] mt-2 font-medium">
                      — Unknown
                    </p>
                  </SocialSurface>
                </div>
              </aside>
            </div>
          </Tabs>
        </div>
      </div>
    </>
  );
};

// Keep guest landing completely separate from authenticated social queries.
// This avoids kicking off friends, groups, reading-room, and profile discovery
// requests for signed-out visitors and preserves the requested deep link at login.
const SocialMedia: React.FC = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAF7F2] dark:bg-[#0B0D0C] flex items-center justify-center text-[#1C201D] dark:text-[#F3F0E7]" role="status" aria-label="Loading social community">
        <Loader2 className="w-7 h-7 animate-spin text-[#1C442D] dark:text-[#D5B16D]" />
      </div>
    );
  }

  if (!user) return <GuestLanding />;
  return <AuthenticatedSocialMedia user={user} />;
};

export default SocialMedia;
