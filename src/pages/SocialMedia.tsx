import React, { useState, Suspense, lazy } from 'react';
import { useAuth } from '@/contexts/authHelpers';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
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
  TrendingUp,
  Search,
  Plus,
  Calendar,
  BookUser,
  ChevronRight,
  Compass,
} from 'lucide-react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import SignInLink from '@/components/SignInLink';
import SEO from '@/components/SEO';
import { SocialSurface } from '@/components/social/SocialSurface';
import { EnhancedSocialFeed } from '@/components/social/EnhancedSocialFeed';
import { EnhancedReadingMap } from '@/components/social/EnhancedReadingMap';
import { FriendsLocationMap } from '@/components/social/FriendsLocationMap';
import { ReadingGroups } from '@/components/social/ReadingGroups';
import { EnhancedFriendsManager } from '@/components/social/EnhancedFriendsManager';
import { BookPulseBar } from '@/components/social/BookPulseBar';
import { NotificationDropdown } from '@/components/notifications/NotificationDropdown';
import { useReadingRooms } from '@/hooks/useReadingRoom';
import { useMarginNotes } from '@/hooks/useMarginNotes';
import { useSpoilerThreads } from '@/hooks/useSpoilerThreads';
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

// Reusable lazy-load fallback
const TabLoader = () => (
  <div className="flex flex-col items-center justify-center py-16 gap-3 text-[#A5ADA6]">
    <Loader2 className="w-6 h-6 animate-spin text-[#D5B16D]" />
    <span className="text-xs tracking-wide">Loading community data…</span>
  </div>
);

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
const GuestLanding: React.FC = () => (
  <>
    <SEO
      title="Where Readers Connect Around Books | Sahadhyayi"
      description="Join Sahadhyayi's reading community. Experience live reading rooms, public marginalia, spoiler-free chapter threads, and reader taste matching."
      canonical="https://sahadhyayi.com/social"
      url="https://sahadhyayi.com/social"
    />

    <div className="min-h-screen bg-[#0B0D0C] text-[#F3F0E7]">
      {/* ── Guest Navigation Bar ── */}
      <header className="border-b border-[#29332D] bg-[#0B0D0C]/90 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-lg bg-[#1C3024] border border-[#315C43] flex items-center justify-center text-[#D5B16D] group-hover:border-[#D5B16D] transition-colors">
              <BookOpen className="w-4 h-4" />
            </div>
            <span className="font-serif font-bold text-lg text-[#F3F0E7] tracking-tight group-hover:text-[#D5B16D] transition-colors">
              Sahadhyayi
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-6 text-xs font-medium text-[#A5ADA6]">
            <Link to="/" className="hover:text-[#F3F0E7] transition-colors">Home</Link>
            <Link to="/library" className="hover:text-[#F3F0E7] transition-colors">Library</Link>
            <Link to="/groups" className="hover:text-[#F3F0E7] transition-colors">Groups</Link>
            <Link to="/authors" className="hover:text-[#F3F0E7] transition-colors">Authors</Link>
            <Link to="/articles" className="hover:text-[#F3F0E7] transition-colors">Articles</Link>
            <Link to="/discovery" className="hover:text-[#F3F0E7] transition-colors">AI Assistant</Link>
          </nav>

          <div className="flex items-center gap-3">
            <SignInLink redirectPath="/social">
              <Button
                variant="outline"
                size="sm"
                className="border-[#29332D] bg-[#111614] text-[#F3F0E7] hover:bg-[#1B241E] hover:text-[#D5B16D] text-xs h-9 px-4"
              >
                Sign in
              </Button>
            </SignInLink>
            <Link to="/signup">
              <Button
                size="sm"
                className="bg-[#D5B16D] hover:bg-[#c49f5c] text-[#0B0D0C] font-semibold text-xs h-9 px-4 shadow-sm"
              >
                Create Account
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* ── Hero Section ── */}
      <section className="relative overflow-hidden border-b border-[#29332D] bg-gradient-to-b from-[#111614] via-[#0B0D0C] to-[#0B0D0C] py-20 px-4 sm:px-6 lg:px-8">
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -top-32 -right-32 w-[32rem] h-[32rem] rounded-full bg-emerald-950/20 blur-3xl" />
          <div className="absolute -bottom-24 -left-24 w-80 h-80 rounded-full bg-[#D5B16D]/5 blur-3xl" />
        </div>

        <div className="relative max-w-4xl mx-auto text-center">
          {/* Eyebrow Label */}
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#111614] border border-[#29332D] text-[11px] font-semibold uppercase tracking-widest text-[#D5B16D] mb-6 shadow-xs">
            <Sparkles className="w-3.5 h-3.5" />
            A Reading Community
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-serif font-bold text-[#F3F0E7] mb-6 tracking-tight leading-[1.15]">
            Where readers connect{' '}
            <span className="text-[#D5B16D]">around books.</span>
          </h1>

          <p className="text-base sm:text-lg text-[#A5ADA6] max-w-2xl mx-auto mb-10 leading-relaxed font-normal">
            Share what you're reading, explore ideas, join reading rooms, and find people who see the world through books.
          </p>

          {/* Action CTAs */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center mb-12">
            <Link to="/signup">
              <Button className="w-full sm:w-auto bg-[#D5B16D] hover:bg-[#c49f5c] text-[#0B0D0C] font-semibold px-7 h-11 text-sm shadow-md gap-2">
                Create an account
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
            <SignInLink redirectPath="/social">
              <Button
                variant="outline"
                className="w-full sm:w-auto border-[#29332D] bg-[#111614] text-[#F3F0E7] hover:bg-[#1B241E] px-7 h-11 text-sm font-medium"
              >
                Sign in
              </Button>
            </SignInLink>
          </div>

          {/* Live Activity Pulse bar */}
          <div className="max-w-3xl mx-auto">
            <ErrorBoundary fallback={null}>
              <BookPulseBar />
            </ErrorBoundary>
          </div>
        </div>
      </section>

      {/* ── 4 Feature Pillar Cards ── */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center max-w-xl mx-auto mb-12">
          <h2 className="text-2xl sm:text-3xl font-serif font-bold text-[#F3F0E7] mb-3">
            Built for Deep Reading Culture
          </h2>
          <p className="text-sm text-[#A5ADA6] leading-relaxed">
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
              <Card className="h-full border border-[#29332D] bg-[#111614] hover:bg-[#161D19] hover:border-[#315C43] transition-all duration-200 shadow-xs hover:shadow-md cursor-pointer">
                <CardContent className="p-5 flex flex-col h-full text-[#F3F0E7]">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-4 ${iconColorMap[color]}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <h3 className="text-sm font-semibold text-[#F3F0E7] mb-2 group-hover:text-[#D5B16D] transition-colors">
                    {title}
                  </h3>
                  <p className="text-xs text-[#A5ADA6] leading-relaxed flex-1">
                    {desc}
                  </p>
                  <div className="mt-4 text-xs font-semibold flex items-center gap-1.5 text-[#D5B16D] group-hover:underline">
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
      <section className="bg-[#111614] border-t border-[#29332D] py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 mb-3 text-xs font-semibold text-[#D5B16D]">
            <TrendingUp className="w-4 h-4" />
            How It Works
          </div>
          <h2 className="text-xl sm:text-2xl font-serif font-bold text-[#F3F0E7] mb-12">
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
              <div key={step} className="flex flex-col gap-3 p-4 rounded-xl bg-[#0B0D0C]/50 border border-[#29332D]/60">
                <div className="w-9 h-9 rounded-full bg-[#1C3024] border border-[#315C43] text-[#D5B16D] flex items-center justify-center text-sm font-bold shadow-xs">
                  {step}
                </div>
                <h3 className="text-sm font-semibold text-[#F3F0E7]">{title}</h3>
                <p className="text-xs text-[#A5ADA6] leading-relaxed">{body}</p>
              </div>
            ))}
          </div>
          <div className="mt-12 flex justify-center gap-3">
            <Link to="/signup">
              <Button className="bg-[#D5B16D] hover:bg-[#c49f5c] text-[#0B0D0C] font-semibold px-8 h-10 text-sm gap-2 shadow-sm">
                Join for Free <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  </>
);

// ─── Authenticated View ───────────────────────────────────────────────────────
const SocialMedia: React.FC = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const tabParam = searchParams.get('tab');
  const activeTab = VALID_SOCIAL_TABS.includes(tabParam as (typeof VALID_SOCIAL_TABS)[number])
    ? (tabParam as string)
    : 'feed';

  const [mapView, setMapView] = useState<'readers' | 'friends'>('readers');
  const [topSearch, setTopSearch] = useState('');
  const [showMobileSearch, setShowMobileSearch] = useState(false);

  // Fetch community data
  const { data: rooms = [] } = useReadingRooms();
  const { data: marginNotes = [] } = useMarginNotes({ filter: 'all' });
  const { data: spoilerThreads = [] } = useSpoilerThreads();
  const { data: groups = [] } = useGroups();
  const { data: allUsers = [] } = useAllUsers();
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

  const handleTopSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (topSearch.trim()) {
      navigate(`/library?search=${encodeURIComponent(topSearch.trim())}`);
    }
  };

  const handleSendRequest = async (userId: string, name: string) => {
    try {
      await sendFriendRequest.mutateAsync({ addresseeId: userId });
      toast.success(`Friend request sent to ${name}!`);
    } catch {
      toast.error('Unable to send friend request. Please try again.');
    }
  };

  // Full-screen loader while authentication state is resolving
  if (loading) {
    return (
      <div className="min-h-screen bg-[#0B0D0C] flex items-center justify-center text-[#F3F0E7]">
        <Loader2 className="w-7 h-7 animate-spin text-[#D5B16D]" />
      </div>
    );
  }

  // Always show the guest experience when signed out
  if (!user) return <GuestLanding />;

  const navItems = [
    { value: 'feed', label: 'Feed', icon: MessageCircle },
    {
      value: 'rooms',
      label: 'Reading Rooms',
      icon: Radio,
      badge: rooms.length > 0 ? rooms.length : undefined,
      isLive: rooms.length > 0,
    },
    {
      value: 'threads',
      label: 'Discussions',
      icon: Lock,
      badge: spoilerThreads.length > 0 ? spoilerThreads.length : undefined,
    },
    {
      value: 'margins',
      label: 'Marginalia',
      icon: Quote,
      badge: marginNotes.length > 0 ? marginNotes.length : undefined,
    },
    { value: 'dna', label: 'Reading DNA', icon: Dna },
    { value: 'friends', label: 'Friends', icon: Users },
    { value: 'map', label: 'Readers Near Me', icon: MapPin },
    {
      value: 'groups',
      label: 'Groups',
      icon: UsersIcon,
      badge: groups.length > 0 ? groups.length : undefined,
    },
  ];

  // Active user name and avatar
  const userName = user.user_metadata?.full_name || user.email?.split('@')[0] || 'Reader';
  const userAvatar = user.user_metadata?.avatar_url || user.user_metadata?.profile_photo_url;
  const currentProgress = readingProgress[0];

  return (
    <>
      <SEO
        title="Social Reading Community | Sahadhyayi"
        description="Connect with fellow readers, co-read in live rooms, share margin notes, and discover book discussions."
        canonical="https://sahadhyayi.com/social"
        url="https://sahadhyayi.com/social"
      />

      <div className="social-experience min-h-screen bg-[#0B0D0C] text-[#F3F0E7]">
        {/* ── Compact Top Bar matching reference design ── */}
        <header className="sticky top-0 z-30 border-b border-[#29332D] bg-[#0B0D0C]/95 backdrop-blur-xl">
          <div className="mx-auto flex max-w-[1600px] items-center justify-between gap-4 px-4 py-2.5 sm:px-6 lg:px-8">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2.5 shrink-0 group">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#1C3024] border border-[#315C43] text-[#D5B16D] group-hover:border-[#D5B16D] transition-colors">
                <BookOpen className="h-4 w-4" />
              </div>
              <span className="font-serif font-bold text-base text-[#F3F0E7] tracking-tight group-hover:text-[#D5B16D] transition-colors">
                Sahadhyayi
              </span>
            </Link>

            {/* Centered Global Search */}
            <form
              onSubmit={handleTopSearchSubmit}
              className="relative hidden sm:flex items-center flex-1 max-w-md mx-4"
            >
              <Search className="absolute left-3 w-4 h-4 text-[#A5ADA6] pointer-events-none" />
              <Input
                type="text"
                placeholder="Search books, authors, discussions…"
                value={topSearch}
                onChange={(e) => setTopSearch(e.target.value)}
                className="w-full pl-9 pr-3 h-9 bg-[#111614] border-[#29332D] text-xs text-[#F3F0E7] placeholder:text-[#A5ADA6]/70 rounded-xl focus-visible:ring-1 focus-visible:ring-[#D5B16D]"
              />
            </form>

            {/* Right Tools: Notification Dropdown & Profile Pill */}
            <div className="flex items-center gap-2.5">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowMobileSearch(prev => !prev)}
                aria-label="Toggle search"
                className="sm:hidden p-1.5 h-8 w-8 text-[#A5ADA6] hover:text-[#F3F0E7] hover:bg-[#1C3024] rounded-lg"
              >
                <Search className="h-4 w-4" />
              </Button>
              <NotificationDropdown />
              <Link
                to="/profile"
                className="flex items-center gap-2 p-1 pl-1.5 pr-2.5 rounded-full bg-[#111614] border border-[#29332D] hover:border-[#315C43] transition-colors"
              >
                <Avatar className="w-6 h-6 border border-[#29332D]">
                  <AvatarImage src={userAvatar} alt={userName} />
                  <AvatarFallback className="bg-[#1C3024] text-[#D5B16D] text-[10px] font-bold">
                    {userName.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <span className="text-xs font-medium text-[#F3F0E7] hidden sm:inline max-w-[100px] truncate">
                  {userName}
                </span>
              </Link>
            </div>
          </div>

          {/* Mobile Search Input Drawer */}
          {showMobileSearch && (
            <div className="px-4 pb-3 pt-1 sm:hidden border-t border-[#29332D]/70 bg-[#0B0D0C]">
              <form onSubmit={handleTopSearchSubmit} className="relative flex items-center">
                <Search className="absolute left-3 w-4 h-4 text-[#A5ADA6] pointer-events-none" />
                <Input
                  type="text"
                  placeholder="Search books, authors, discussions…"
                  value={topSearch}
                  onChange={(e) => setTopSearch(e.target.value)}
                  autoFocus
                  className="w-full pl-9 pr-3 h-9 bg-[#111614] border-[#29332D] text-xs text-[#F3F0E7] placeholder:text-[#A5ADA6]/70 rounded-xl focus-visible:ring-1 focus-visible:ring-[#D5B16D]"
                />
              </form>
            </div>
          )}
        </header>

        {/* ── Main Viewport Content ── */}
        <main className="mx-auto max-w-[1600px] px-4 py-6 sm:px-6 lg:px-8">
          <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
            {/* Tablet & Mobile Horizontal Tab Navigation */}
            <div className="xl:hidden overflow-x-auto scrollbar-none pb-2 mb-6 -mx-1 px-1">
              <TabsList className="flex h-auto w-max min-w-full items-center justify-start gap-1.5 rounded-xl border border-[#29332D] bg-[#111614] p-1.5">
                {navItems.map(tab => (
                  <TabsTrigger
                    key={tab.value}
                    value={tab.value}
                    className="
                      relative flex shrink-0 items-center gap-2 rounded-lg
                      border border-transparent px-3 py-1.5 text-xs
                      text-[#A5ADA6] transition-colors
                      hover:bg-[#1B241E] hover:text-[#F3F0E7]
                      focus-visible:outline-none focus-visible:ring-2
                      focus-visible:ring-[#D5B16D]
                      data-[state=active]:border-[#315C43]
                      data-[state=active]:bg-[#1C3024]
                      data-[state=active]:text-[#F3F0E7]
                      data-[state=active]:shadow-xs
                    "
                  >
                    <tab.icon className="h-3.5 w-3.5 shrink-0" />
                    <span>{tab.label}</span>
                    {'isLive' in tab && tab.isLive && (
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    )}
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

            {/* 3-Column Desktop Composition matching design mockup */}
            <div className="grid grid-cols-1 gap-6 xl:grid-cols-[240px_minmax(0,1fr)_320px]">
              {/* ── Left Column: Literary Navigation Rail (Desktop) ── */}
              <aside className="hidden xl:block">
                <div className="sticky top-20 space-y-4">
                  {/* + Create Post Primary Action Button */}
                  <Button
                    onClick={() => {
                      handleTabChange('feed');
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                      setTimeout(() => {
                        const el = document.getElementById('feed-composer-textarea');
                        if (el) el.focus();
                      }, 100);
                    }}
                    className="w-full h-10 bg-[#D5B16D] hover:bg-[#c49f5c] text-[#0B0D0C] font-semibold text-xs rounded-xl shadow-xs gap-2 transition-all justify-center"
                  >
                    <Plus className="w-4 h-4" />
                    Create Post
                  </Button>

                  {/* Vertical Navigation Rail */}
                  <SocialSurface className="p-2.5">
                    <nav className="flex flex-col gap-0.5">
                      {navItems.map(tab => {
                        const isActive = activeTab === tab.value;
                        const Icon = tab.icon;
                        return (
                          <button
                            key={tab.value}
                            type="button"
                            onClick={() => handleTabChange(tab.value)}
                            className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-xs font-medium transition-all ${
                              isActive
                                ? 'bg-[#1C3024] border border-[#315C43] text-[#F3F0E7] shadow-xs'
                                : 'text-[#A5ADA6] hover:bg-[#1B241E] hover:text-[#F3F0E7]'
                            }`}
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <Icon
                                className={`h-4 w-4 shrink-0 ${
                                  isActive ? 'text-[#D5B16D]' : 'text-[#A5ADA6]'
                                }`}
                              />
                              <span className="truncate">{tab.label}</span>
                            </div>
                            <div className="flex items-center gap-1.5 shrink-0">
                              {'isLive' in tab && tab.isLive && (
                                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
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

                    {/* EXPLORE Section */}
                    <div className="mt-4 pt-3 border-t border-[#29332D]">
                      <p className="px-3 pb-1.5 text-[10px] font-semibold tracking-wider text-[#A5ADA6]/70 uppercase">
                        Explore
                      </p>
                      <div className="flex flex-col gap-0.5">
                        <Link
                          to="/authors"
                          className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-medium text-[#A5ADA6] hover:bg-[#1B241E] hover:text-[#F3F0E7] transition-colors"
                        >
                          <BookUser className="h-4 w-4 text-[#A5ADA6]" />
                          <span>Authors</span>
                        </Link>
                        <Link
                          to="/events"
                          className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-medium text-[#A5ADA6] hover:bg-[#1B241E] hover:text-[#F3F0E7] transition-colors"
                        >
                          <Calendar className="h-4 w-4 text-[#A5ADA6]" />
                          <span>Events</span>
                        </Link>
                      </div>
                    </div>
                  </SocialSurface>

                  {/* Atmospheric Community Card */}
                  <SocialSurface className="p-3.5 bg-gradient-to-br from-[#111614] to-[#18231C]">
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-[#D5B16D] mb-1">
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Reading Sanctuary</span>
                    </div>
                    <p className="text-[11px] text-[#A5ADA6] leading-relaxed">
                      Every note, discussion, and sprint is anchored directly to books.
                    </p>
                  </SocialSurface>
                </div>
              </aside>

              {/* ── Center Column: Community Stream & Feature Content ── */}
              <section className="min-w-0 space-y-6">
                {/* ── Feed Tab ── */}
                <TabsContent value="feed" className="mt-0 space-y-6">
                  {/* Clean Editorial Feed Header */}
                  <div className="pb-1">
                    <h1 className="text-2xl font-serif font-bold text-[#F3F0E7] tracking-tight">
                      Community Feed
                    </h1>
                    <p className="text-xs text-[#A5ADA6] mt-1 leading-relaxed">
                      Share what you're reading, exchange ideas, and connect with fellow readers.
                    </p>
                  </div>

                  <ErrorBoundary
                    fallback={
                      <SocialSurface className="p-8 text-center">
                        <p className="text-sm font-semibold mb-2">Unable to display social feed</p>
                        <p className="text-xs text-[#A5ADA6] mb-4">
                          A temporary error occurred while rendering the community feed.
                        </p>
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
                      <p className="font-semibold text-xs text-[#F3F0E7]">Live Reading Rooms</p>
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
                      <p className="font-semibold text-xs text-[#F3F0E7]">Chapter-Locked Discussions</p>
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
                      <p className="font-semibold text-xs text-[#F3F0E7]">Public Marginalia</p>
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
                      <p className="font-semibold text-xs text-[#F3F0E7]">Reading DNA</p>
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

              {/* ── Right Column: Discovery Sidebar (Desktop) ── */}
              <aside className="hidden space-y-5 xl:block">
                <div className="sticky top-20 space-y-5">
                  {/* Card 1: Live Reading Rooms */}
                  <SocialSurface className="p-4">
                    <div className="flex items-center justify-between pb-2 mb-3 border-b border-[#29332D]">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-xs text-[#F3F0E7]">Live Reading Rooms</span>
                        {rooms.length > 0 && (
                          <Badge className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 text-[9px] px-1.5 py-0 h-4 font-bold">
                            Live
                          </Badge>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => handleTabChange('rooms')}
                        className="text-[11px] font-semibold text-[#D5B16D] hover:underline flex items-center gap-0.5"
                      >
                        See all <ChevronRight className="w-3 h-3" />
                      </button>
                    </div>

                    {rooms.length === 0 ? (
                      <div className="py-4 text-center">
                        <p className="text-xs text-[#A5ADA6]">No live reading rooms right now.</p>
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
                        {rooms.slice(0, 2).map((room) => {
                          const bookTitle = room.books_library?.title || 'Current Book';
                          return (
                            <div
                              key={room.id}
                              className="rounded-xl border border-[#29332D]/70 bg-[#16211A]/50 p-2.5 flex items-center justify-between gap-2.5 transition-colors hover:border-[#315C43] hover:bg-[#16211A]"
                            >
                              <div className="flex items-center gap-2.5 min-w-0 flex-1">
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
                                  <p className="truncate text-xs font-medium text-[#F3F0E7]">
                                    {room.name}
                                  </p>
                                  <p className="text-[11px] text-[#A5ADA6]">
                                    {typeof ((room as any).participants_count ?? (room as any).active_readers_count) === 'number'
                                      ? `${(room as any).participants_count ?? (room as any).active_readers_count} in room`
                                      : 'Active now'}
                                  </p>
                                </div>
                              </div>
                              <Button
                                size="sm"
                                onClick={() => handleTabChange('rooms')}
                                className="h-7 text-xs px-2.5 border-[#29332D] bg-[#111614] hover:bg-[#1C3024] text-[#F3F0E7] shrink-0"
                              >
                                Join
                              </Button>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </SocialSurface>

                  {/* Card 2: Popular Groups */}
                  <SocialSurface className="p-4">
                    <div className="flex items-center justify-between pb-2 mb-3 border-b border-[#29332D]">
                      <span className="font-semibold text-xs text-[#F3F0E7]">Popular Groups</span>
                      <button
                        type="button"
                        onClick={() => handleTabChange('groups')}
                        className="text-[11px] font-semibold text-[#D5B16D] hover:underline flex items-center gap-0.5"
                      >
                        See all <ChevronRight className="w-3 h-3" />
                      </button>
                    </div>

                    {groups.length === 0 ? (
                      <div className="py-4 text-center">
                        <p className="text-xs text-[#A5ADA6]">No reading groups found.</p>
                      </div>
                    ) : (
                      <div className="space-y-2.5">
                        {groups.slice(0, 3).map((group) => {
                          const memberCount = group.group_members?.[0]?.count ?? group.member_count ?? 1;
                          return (
                            <div
                              key={group.id}
                              className="rounded-xl border border-[#29332D]/70 bg-[#111614] p-2.5 flex items-center justify-between gap-2.5 transition-colors hover:border-[#315C43]"
                            >
                              <div className="flex items-center gap-2.5 min-w-0 flex-1">
                                {group.image_url ? (
                                  <img
                                    src={group.image_url}
                                    alt={group.name}
                                    className="h-9 w-9 shrink-0 rounded-lg object-cover"
                                  />
                                ) : (
                                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#1C3024] text-[#D5B16D]">
                                    <UsersIcon className="h-4 w-4" />
                                  </div>
                                )}
                                <div className="min-w-0 flex-1">
                                  <p className="truncate text-xs font-medium text-[#F3F0E7]">
                                    {group.name}
                                  </p>
                                  <p className="text-[11px] text-[#A5ADA6]">
                                    {memberCount} {memberCount === 1 ? 'member' : 'members'}
                                  </p>
                                </div>
                              </div>
                              <Button
                                size="sm"
                                onClick={() => handleTabChange('groups')}
                                className="h-7 text-xs px-2.5 border-[#29332D] bg-[#16211A] hover:bg-[#1C3024] text-[#F3F0E7] shrink-0"
                              >
                                Join
                              </Button>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </SocialSurface>

                  {/* Card 3: Suggested Readers */}
                  <SocialSurface className="p-4">
                    <div className="flex items-center justify-between pb-2 mb-3 border-b border-[#29332D]">
                      <span className="font-semibold text-xs text-[#F3F0E7]">Suggested Readers</span>
                      <button
                        type="button"
                        onClick={() => handleTabChange('friends')}
                        className="text-[11px] font-semibold text-[#D5B16D] hover:underline flex items-center gap-0.5"
                      >
                        See all <ChevronRight className="w-3 h-3" />
                      </button>
                    </div>

                    {allUsers.length === 0 ? (
                      <div className="py-4 text-center">
                        <p className="text-xs text-[#A5ADA6]">Connect with friends on Sahadhyayi.</p>
                      </div>
                    ) : (
                      <div className="space-y-2.5">
                        {allUsers.slice(0, 3).map((reader) => (
                          <div
                            key={reader.id}
                            className="rounded-xl border border-[#29332D]/70 bg-[#111614] p-2.5 flex items-center justify-between gap-2.5 transition-colors hover:border-[#315C43]"
                          >
                            <div className="flex items-center gap-2.5 min-w-0 flex-1">
                              <Avatar className="h-8 w-8 border border-[#29332D] shrink-0">
                                <AvatarImage src={reader.profile_photo_url} alt={reader.full_name} />
                                <AvatarFallback className="bg-[#1C3024] text-[#D5B16D] text-xs font-bold">
                                  {reader.full_name?.charAt(0) || 'R'}
                                </AvatarFallback>
                              </Avatar>
                              <div className="min-w-0 flex-1">
                                <p className="truncate text-xs font-medium text-[#F3F0E7]">
                                  {reader.full_name}
                                </p>
                                <p className="truncate text-[10px] text-[#A5ADA6]">
                                  Reads · {reader.username ? `@${reader.username}` : 'Literature'}
                                </p>
                              </div>
                            </div>
                            <Button
                              size="sm"
                              onClick={() => handleSendRequest(reader.id, reader.full_name)}
                              className="h-7 text-xs px-2.5 border-[#29332D] bg-[#16211A] hover:bg-[#1C3024] text-[#D5B16D] shrink-0"
                            >
                              Follow
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </SocialSurface>

                  {/* Card 4: Your Reading Progress (if active) */}
                  {currentProgress && (
                    <SocialSurface className="p-4">
                      <div className="flex items-center justify-between pb-2 mb-3 border-b border-[#29332D]">
                        <span className="font-semibold text-xs text-[#F3F0E7]">Your Reading Progress</span>
                        <Link
                          to="/dashboard"
                          className="text-[11px] font-semibold text-[#D5B16D] hover:underline flex items-center gap-0.5"
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
                          <div className="flex h-14 w-10 shrink-0 items-center justify-center rounded bg-[#1C3024] text-[#D5B16D]">
                            <BookOpen className="h-5 w-5" />
                          </div>
                        )}
                        <div className="min-w-0 flex-1 space-y-1.5">
                          <p className="truncate text-xs font-semibold text-[#F3F0E7]">
                            {currentProgress.book_title}
                          </p>
                          <div className="flex items-center justify-between text-[11px] text-[#A5ADA6]">
                            <span>Progress</span>
                            <span className="text-[#D5B16D] font-bold">
                              {currentProgress.total_pages > 0
                                ? Math.round((currentProgress.current_page / currentProgress.total_pages) * 100)
                                : 0}%
                            </span>
                          </div>
                          <div className="w-full bg-[#1C3024] h-1.5 rounded-full overflow-hidden">
                            <div
                              className="bg-[#D5B16D] h-full rounded-full transition-all duration-300"
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
                              className="inline-block mt-1 text-[11px] font-semibold text-[#D5B16D] hover:underline"
                            >
                              Continue Reading →
                            </Link>
                          )}
                        </div>
                      </div>
                    </SocialSurface>
                  )}

                  {/* Card 5: Literary Quote Widget (from design mockup) */}
                  <SocialSurface className="p-4 bg-gradient-to-br from-[#111614] via-[#141A16] to-[#0E1210] border-[#29332D]">
                    <Quote className="w-5 h-5 text-[#D5B16D]/60 mb-2" />
                    <p className="text-xs italic text-[#F3F0E7] font-serif leading-relaxed">
                      &ldquo;A room full of readers is a room full of friends.&rdquo;
                    </p>
                    <p className="text-[11px] text-[#A5ADA6] mt-2 font-medium">
                      — Unknown
                    </p>
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
