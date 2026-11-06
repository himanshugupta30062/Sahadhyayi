import React, { useEffect, useState, Suspense, lazy } from 'react';
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
  UserRound,
} from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';
import { Star } from 'lucide-react';
import SignInLink from '@/components/SignInLink';
import SEO from '@/components/SEO';
import { SocialSurface } from '@/components/social/SocialSurface';
import { BookPulseBar } from '@/components/social/BookPulseBar';
import { useReadingRooms } from '@/hooks/useReadingRoom';
import { useGroups } from '@/hooks/useGroupManagement';
import { useAllUsers } from '@/hooks/useUserSearch';
import { useSendFriendRequest } from '@/hooks/useFriends';
import { useReadingProgress } from '@/hooks/useReadingProgress';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { toast } from 'sonner';

// Lazy-load social feature panels so the active tab determines what JavaScript is fetched
const MarginNotesFeed = lazy(() => import('@/components/social/margins/MarginNotesFeed'));
const EnhancedSocialFeed = lazy(() => import('@/components/social/EnhancedSocialFeed').then(({ EnhancedSocialFeed }) => ({ default: EnhancedSocialFeed })));
const EnhancedReadingMap = lazy(() => import('@/components/social/EnhancedReadingMap').then(({ EnhancedReadingMap }) => ({ default: EnhancedReadingMap })));
const FriendsLocationMap = lazy(() => import('@/components/social/FriendsLocationMap').then(({ FriendsLocationMap }) => ({ default: FriendsLocationMap })));
const ReadingGroups = lazy(() => import('@/components/social/ReadingGroups').then(({ ReadingGroups }) => ({ default: ReadingGroups })));
const EnhancedFriendsManager = lazy(() => import('@/components/social/EnhancedFriendsManager').then(({ EnhancedFriendsManager }) => ({ default: EnhancedFriendsManager })));
const SpoilerThreadsFeed = lazy(() => import('@/components/social/threads/SpoilerThreadsFeed'));
const ReadingRoomsPanel = lazy(() => import('@/components/social/rooms/ReadingRoomsPanel'));
const ReadingDnaPanel = lazy(() => import('@/components/social/dna/ReadingDnaPanel'));
const BookReviewsFeed = lazy(() => import('@/components/social/BookReviewsFeed'));

const VALID_SOCIAL_TABS = ['feed', 'reviews', 'rooms', 'threads', 'margins', 'dna', 'friends', 'map', 'groups'] as const;
const SOCIAL_TAB_LABELS: Record<string, string> = {
  feed: 'Community Feed',
  reviews: 'Book Reviews',
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
  emerald: 'bg-emerald-50 text-emerald-800 border border-emerald-200 dark:bg-emerald-500/15 dark:text-emerald-400 dark:border-emerald-500/30',
  amber: 'bg-amber-50 text-amber-800 border border-amber-200 dark:bg-amber-500/15 dark:text-amber-400 dark:border-amber-500/30',
  indigo: 'bg-indigo-50 text-indigo-800 border border-indigo-200 dark:bg-indigo-500/15 dark:text-indigo-400 dark:border-indigo-500/30',
  fuchsia: 'bg-fuchsia-50 text-fuchsia-800 border border-fuchsia-200 dark:bg-fuchsia-500/15 dark:text-fuchsia-400 dark:border-fuchsia-500/30',
};

// ─── Guest posts-first community preview ─────────────────────────────────────
const SAMPLE_READER_POSTS = [
  { name: 'Priya Sharma', handle: '@priya_reads_late', initials: 'PS', tone: 'bg-rose-100 text-rose-700', book: 'The Song of Achilles', author: 'Madeline Miller', kind: 'Currently feeling', text: "Finished this at 2:47 AM and I’m still not okay. That ending is going to live in my head for a very long time. 😭", prompt: 'What book emotionally wrecked you?' },
  { name: 'Aarav Mehta', handle: '@aarav_pages', initials: 'AM', tone: 'bg-amber-100 text-amber-800', book: 'Atomic Habits', author: 'James Clear', kind: 'A small reading win', text: 'Phone in another room, 20 pages before bed. Somehow that turned into 40—and I finally got out of my reading slump. Tiny wins count ☕', prompt: 'What helps you read consistently?' },
  { name: 'Kabir D.', handle: '@kabir_in_the_margins', initials: 'KD', tone: 'bg-emerald-100 text-emerald-800', book: 'The God of Small Things', author: 'Arundhati Roy', kind: 'Book discovery', text: 'Found a second-hand copy at Daryaganj for ₹80. There’s a handwritten note in the margin: “Read this when you miss home.” Whoever owned this before me, thank you.', prompt: 'Have you ever found a note inside a used book?' },
  { name: 'Sneha Rao', handle: '@sneha_bookish', initials: 'SR', tone: 'bg-violet-100 text-violet-800', book: 'Before the Coffee Gets Cold', author: 'Toshikazu Kawaguchi', kind: 'Need to discuss', text: 'I thought this would be a cute café read. Now I’m rethinking every conversation I’ve ever left unfinished. Can we talk about the second story?!', prompt: 'Which story stayed with you most?' },
  { name: 'Rohan Verma', handle: '@rohanbetweenpages', initials: 'RV', tone: 'bg-sky-100 text-sky-800', book: 'The Midnight Library', author: 'Matt Haig', kind: 'Unpopular opinion', text: 'Unpopular opinion: sometimes a book doesn’t need to change your life. It can just keep you company on a difficult Tuesday—and that’s enough.', prompt: 'What is your comfort read?' },
  { name: 'Ananya Iyer', handle: '@ananya.turns.pages', initials: 'AI', tone: 'bg-pink-100 text-pink-800', book: 'Pride and Prejudice', author: 'Jane Austen', kind: 'Reading mood', text: 'Re-reading this for the fifth time. I know exactly what happens and still kick my feet at the same scenes. No regrets.', prompt: 'Which book do you happily re-read?' },
];

const SampleReaderPost: React.FC<{ post: typeof SAMPLE_READER_POSTS[number] }> = ({ post }) => (
  <article className="rounded-2xl border border-[#E8E2D9] bg-white p-5 shadow-[0_3px_14px_rgba(28,32,29,0.035)] transition hover:border-[#D5C8B7] dark:border-[#29332D] dark:bg-[#111614] dark:hover:border-[#3C5143] sm:p-6">
    <div className="flex items-start gap-3">
      <Avatar className="h-11 w-11 shrink-0"><AvatarFallback className={post.tone + " font-semibold"}>{post.initials}</AvatarFallback></Avatar>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <span className="font-semibold text-[#202620] dark:text-[#F3F0E7]">{post.name}</span>
          <span className="text-sm text-[#7C827C] dark:text-[#A5ADA6]">{post.handle}</span>
          <span className="rounded-full bg-[#F4F1EB] px-2 py-0.5 text-[10px] font-medium text-[#746650] dark:bg-[#24271F] dark:text-[#D5B16D]">Sample reader</span>
        </div>
        <p className="mt-1 text-xs text-[#858B85] dark:text-[#8D988F]">{post.kind} · just now</p>
      </div>
      <BookOpen className="h-4 w-4 shrink-0 text-[#9B8664]" aria-label="Book post" />
    </div>
    <p className="mt-4 whitespace-pre-wrap text-[15px] leading-7 text-[#303630] dark:text-[#E4E5DC]">{post.text}</p>
    <div className="mt-4 inline-flex max-w-full items-center gap-2 rounded-xl border border-[#E9E1D5] bg-[#FAF7F2] px-3 py-2.5 dark:border-[#34372D] dark:bg-[#191D18]">
      <span aria-hidden="true">📚</span><span className="min-w-0"><span className="block truncate text-sm font-semibold text-[#45483F] dark:text-[#E6D9BD]">{post.book}</span><span className="block truncate text-xs text-[#858477] dark:text-[#A5ADA6]">{post.author}</span></span>
    </div>
    <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-[#F0ECE6] pt-3 dark:border-[#29332D]">
      <span className="text-xs text-[#8A8E87] dark:text-[#929A92]">💬 {post.prompt}</span>
      <Link to="/signup" className="text-xs font-semibold text-[#1C442D] hover:underline dark:text-[#D5B16D]">Join the conversation →</Link>
    </div>
  </article>
);

const GuestLanding: React.FC = () => {
  const [searchParams] = useSearchParams();
  const queryString = searchParams.toString();
  const signInRedirect = `/social${queryString ? `?${queryString}` : ''};

  return (
    <>
      <SEO title="Bookish conversations & reader posts | Sahadhyayi" description="Read everyday book thoughts, recommendations, reading updates and conversations from fellow readers." canonical="https://sahadhyayi.com/social" url="https://sahadhyayi.com/social" />
      <main className="min-h-screen bg-[#FAFAF8] text-[#202620] dark:bg-[#0B0D0C] dark:text-[#F3F0E7]">
        <div className="mx-auto max-w-3xl px-4 pb-16 pt-8 sm:px-6">
          <header className="mb-7">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#8A7656]">Sahadhyayi · Social</p>
            <h1 className="mt-2 font-serif text-3xl font-semibold tracking-tight sm:text-4xl">Readers talking about books.</h1>
            <p className="mt-2 max-w-xl text-sm leading-6 text-[#737A73] dark:text-[#A5ADA6]">Reading updates, honest reactions, recommendations and the little things only book people understand.</p>
          </header>
          <section className="mb-6 rounded-2xl border border-[#E8E2D9] bg-[#F4EFEA] p-4 dark:border-[#29332D] dark:bg-[#141915] sm:p-5">
            <div className="flex items-center gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-lg dark:bg-[#222820]">✍️</div><div className="flex-1"><p className="font-medium">What’s on your mind about books?</p><p className="text-xs text-[#7C827C] dark:text-[#A5ADA6]">Share a thought, a quote, or your current read.</p></div></div>
            <div className="mt-3 flex flex-wrap gap-2"><Link to="/signup"><Button className="rounded-xl bg-[#1C442D] text-white hover:bg-[#143221] dark:bg-[#D5B16D] dark:text-[#0B0D0C]">Write your first post</Button></Link><SignInLink redirectPath={signInRedirect}><Button variant="outline" className="rounded-xl">Sign in</Button></SignInLink></div>
          </section>
          <div className="mb-4 flex items-center justify-between"><h2 className="font-serif text-xl font-semibold">Around the bookshelf</h2><span className="text-xs text-[#8A8E87]">Community preview</span></div>
          <div className="space-y-4">{SAMPLE_READER_POSTS.map((post) => <SampleReaderPost key={post.handle} post={post} />)}</div>
          <div className="mt-8 rounded-2xl border border-dashed border-[#D8D0C4] p-6 text-center dark:border-[#394238]"><p className="font-medium">Your reading life belongs here.</p><p className="mt-1 text-sm text-[#737A73] dark:text-[#A5ADA6]">Join in and share what you’re reading with fellow book lovers.</p><Link to="/signup" className="mt-3 inline-block text-sm font-semibold text-[#1C442D] hover:underline dark:text-[#D5B16D]">Create a free account →</Link></div>
        </div>
      </main>
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
  const [isDesktopSidebarVisible, setIsDesktopSidebarVisible] = useState(() =>
    typeof window !== 'undefined' &&
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(min-width: 1280px)').matches
  );

  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return;

    const sidebarMedia = window.matchMedia('(min-width: 1280px)');
    const updateSidebarVisibility = () => setIsDesktopSidebarVisible(sidebarMedia.matches);
    updateSidebarVisibility();
    sidebarMedia.addEventListener('change', updateSidebarVisibility);

    return () => sidebarMedia.removeEventListener('change', updateSidebarVisibility);
  }, []);

  // The desktop discovery rail is hidden below xl. Avoid its requests and live
  // subscriptions on mobile while leaving each feature page's own queries intact.
  const { data: rooms = [], isLoading: isLoadingRooms, error: roomsError, refetch: refetchRooms } =
    useReadingRooms(undefined, { enabled: isDesktopSidebarVisible });
  const { data: groups = [], isLoading: isLoadingGroups, error: groupsError, refetch: refetchGroups } =
    useGroups({ enabled: isDesktopSidebarVisible });
  const { data: allUsers = [], isLoading: isLoadingUsers, error: usersError, refetch: refetchUsers } =
    useAllUsers({ enabled: isDesktopSidebarVisible });
  const { data: readingProgress = [] } = useReadingProgress({ enabled: isDesktopSidebarVisible });
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

      <div className="social-experience min-h-screen bg-[#FAFAF8] dark:bg-[#0B0D0C] text-[#1C201D] dark:text-[#F3F0E7] transition-colors duration-200">
        {/* ── Main Viewport Content ── */}
        <div className="mx-auto max-w-[1440px] px-4 py-8 sm:px-6 lg:px-8">
          <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
            <nav aria-label="Social navigation" className="mb-6 flex flex-wrap items-center gap-2 rounded-2xl border border-[#E8E8E3] bg-white p-2 shadow-[0_2px_8px_rgba(28,32,29,0.03)] dark:border-[#29332D] dark:bg-[#111614]">
              <button
                type="button"
                aria-pressed={activeTab === 'feed'}
                onClick={() => handleTabChange('feed')}
                className={`inline-flex min-h-10 items-center gap-2 rounded-xl px-3 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1C442D] dark:focus-visible:ring-[#D5B16D] ${activeTab === 'feed' ? 'bg-[#EBF2EC] text-[#1C442D] dark:bg-[#1C3024] dark:text-[#D5B16D]' : 'text-[#636B65] hover:bg-[#FAFAF8] hover:text-[#1C201D] dark:text-[#A5ADA6] dark:hover:bg-[#1B241E] dark:hover:text-[#F3F0E7]'}`}
              >
                <BookOpen className="h-4 w-4" aria-hidden="true" />
                Home
              </button>
              <button
                type="button"
                aria-pressed={activeTab === 'reviews'}
                onClick={() => handleTabChange('reviews')}
                className={`inline-flex min-h-10 items-center gap-2 rounded-xl px-3 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1C442D] dark:focus-visible:ring-[#D5B16D] ${activeTab === 'reviews' ? 'bg-[#EBF2EC] text-[#1C442D] dark:bg-[#1C3024] dark:text-[#D5B16D]' : 'text-[#636B65] hover:bg-[#FAFAF8] hover:text-[#1C201D] dark:text-[#A5ADA6] dark:hover:bg-[#1B241E] dark:hover:text-[#F3F0E7]'}`}
              >
                <Star className="h-4 w-4" aria-hidden="true" />
                Book Reviews
              </button>
              <button
                type="button"
                aria-pressed={activeTab === 'friends'}
                onClick={() => handleTabChange('friends')}
                className={`inline-flex min-h-10 items-center gap-2 rounded-xl px-3 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1C442D] dark:focus-visible:ring-[#D5B16D] ${activeTab === 'friends' ? 'bg-[#EBF2EC] text-[#1C442D] dark:bg-[#1C3024] dark:text-[#D5B16D]' : 'text-[#636B65] hover:bg-[#FAFAF8] hover:text-[#1C201D] dark:text-[#A5ADA6] dark:hover:bg-[#1B241E] dark:hover:text-[#F3F0E7]'}`}
              >
                <Users className="h-4 w-4" aria-hidden="true" />
                Discover
              </button>
              <button
                type="button"
                aria-pressed={activeTab === 'groups'}
                onClick={() => handleTabChange('groups')}
                className={`inline-flex min-h-10 items-center gap-2 rounded-xl px-3 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1C442D] dark:focus-visible:ring-[#D5B16D] ${activeTab === 'groups' ? 'bg-[#EBF2EC] text-[#1C442D] dark:bg-[#1C3024] dark:text-[#D5B16D]' : 'text-[#636B65] hover:bg-[#FAFAF8] hover:text-[#1C201D] dark:text-[#A5ADA6] dark:hover:bg-[#1B241E] dark:hover:text-[#F3F0E7]'}`}
              >
                <UsersIcon className="h-4 w-4" aria-hidden="true" />
                Groups
              </button>
              <details className="group relative">
                <summary className="flex min-h-10 cursor-pointer list-none items-center gap-2 rounded-xl px-3 text-sm font-medium text-[#636B65] transition-colors hover:bg-[#FAFAF8] hover:text-[#1C201D] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1C442D] dark:text-[#A5ADA6] dark:hover:bg-[#1B241E] dark:hover:text-[#F3F0E7] dark:focus-visible:ring-[#D5B16D]">
                  <BookOpen className="h-4 w-4" aria-hidden="true" />
                  Reading spaces
                  <ChevronRight className="h-3.5 w-3.5 transition-transform group-open:rotate-90" aria-hidden="true" />
                </summary>
                <div className="mt-2 flex flex-wrap gap-2 rounded-xl border border-[#E8E8E3] bg-[#FAFAF8] p-2 dark:border-[#29332D] dark:bg-[#0B0D0C] sm:absolute sm:left-0 sm:z-30 sm:min-w-64 sm:shadow-lg">
                  {[
                    { value: 'rooms', label: 'Live reading rooms' },
                    { value: 'threads', label: 'Chapter discussions' },
                    { value: 'margins', label: 'Shared margin notes' },
                    { value: 'dna', label: 'Reading DNA' },
                    { value: 'map', label: 'Reader map' },
                  ].map((item) => (
                    <button
                      key={item.value}
                      type="button"
                      onClick={() => handleTabChange(item.value)}
                      className="min-h-9 rounded-lg border border-[#E8E8E3] bg-white px-3 py-2 text-left text-xs font-medium text-[#1C442D] hover:border-[#C8DBCB] hover:bg-[#EBF2EC] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1C442D] dark:border-[#29332D] dark:bg-[#111614] dark:text-[#D5B16D] dark:hover:border-[#315C43] dark:hover:bg-[#1C3024] dark:focus-visible:ring-[#D5B16D]"
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </details>
              <div className="ml-auto flex items-center gap-2">
                <Button
                  type="button"
                  onClick={() => {
                    handleTabChange('feed');
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                    window.setTimeout(() => document.getElementById('feed-composer-textarea')?.focus(), 100);
                  }}
                  className="min-h-10 gap-2 rounded-xl bg-[#1C442D] px-3 text-sm font-semibold text-white hover:bg-[#143221] dark:bg-[#D5B16D] dark:text-[#0B0D0C] dark:hover:bg-[#c49f5c]"
                >
                  <Plus className="h-4 w-4" aria-hidden="true" />
                  Create
                </Button>
                <Link
                  to="/profile"
                  aria-label="Your profile"
                  className="inline-flex min-h-10 items-center gap-2 rounded-xl px-3 text-sm font-medium text-[#636B65] transition-colors hover:bg-[#FAFAF8] hover:text-[#1C201D] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1C442D] dark:text-[#A5ADA6] dark:hover:bg-[#1B241E] dark:hover:text-[#F3F0E7] dark:focus-visible:ring-[#D5B16D]"
                >
                  <UserRound className="h-4 w-4" aria-hidden="true" />
                  <span className="hidden sm:inline">Profile</span>
                </Link>
              </div>
            </nav>
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
                  <div className="flex flex-col gap-4 border-b border-[#E8E8E3] dark:border-[#29332D] pb-5 sm:flex-row sm:items-end sm:justify-between">
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

                  <details className="group rounded-xl border border-[#E8E8E3] bg-white dark:border-[#29332D] dark:bg-[#111614]">
                    <summary className="flex cursor-pointer list-none items-center justify-between gap-3 rounded-xl px-4 py-3 text-sm font-semibold text-[#1C442D] outline-none focus-visible:ring-2 focus-visible:ring-[#1C442D] dark:text-[#D5B16D] dark:focus-visible:ring-[#D5B16D]">
                      <span>Explore reading spaces</span>
                      <span className="flex items-center gap-2 text-xs font-normal text-[#636B65] dark:text-[#A5ADA6]">
                        Rooms, discussions, notes and reader discovery
                        <ChevronRight className="h-4 w-4 transition-transform group-open:rotate-90" aria-hidden="true" />
                      </span>
                    </summary>
                    <nav aria-label="Reading spaces" className="flex flex-wrap gap-2 border-t border-[#E8E8E3] px-3 py-3 dark:border-[#29332D]">
                      {[
                        { value: 'rooms', label: 'Reading rooms' },
                        { value: 'threads', label: 'Chapter discussions' },
                        { value: 'margins', label: 'Margin notes' },
                        { value: 'friends', label: 'Discover readers' },
                        { value: 'dna', label: 'Reading DNA' },
                        { value: 'map', label: 'Reader map' },
                      ].map((item) => (
                        <button
                          key={item.value}
                          type="button"
                          onClick={() => handleTabChange(item.value)}
                          className="rounded-full border border-[#E8E8E3] bg-[#FAFAF8] px-3 py-2 text-xs font-medium text-[#1C442D] transition-colors hover:border-[#C8DBCB] hover:bg-[#EBF2EC] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1C442D] dark:border-[#29332D] dark:bg-[#0B0D0C] dark:text-[#D5B16D] dark:hover:border-[#315C43] dark:hover:bg-[#1C3024] dark:focus-visible:ring-[#D5B16D]"
                        >
                          {item.label}
                        </button>
                      ))}
                    </nav>
                  </details>

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
                          className="border-[#E8E8E3] dark:border-[#29332D] bg-[#FAFAF8] dark:bg-[#111614] text-[#1C201D] dark:text-[#F3F0E7]"
                        >
                          Reload Feed
                        </Button>
                      </SocialSurface>
                    }
                  >
                    <Suspense fallback={<TabLoader />}>
                      <EnhancedSocialFeed />
                    </Suspense>
                  </ErrorBoundary>
                </TabsContent>

                <TabsContent value="reviews" className="mt-0 space-y-6">
                  <section className="rounded-2xl border border-[#E8E8E3] bg-white p-6 dark:border-[#29332D] dark:bg-[#111614] sm:p-8">
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#1C442D] dark:text-[#D5B16D]">Read · Reflect · Recommend</p>
                    <h2 className="mt-1 font-serif text-2xl font-bold">Reviews from across the Library</h2>
                    <p className="mt-2 text-sm leading-6 text-muted-foreground">Honest reader experiences, connected to each book. Spoiler warnings stay visible.</p>
                    <div className="mt-4 flex flex-wrap gap-2"><Button asChild variant="outline"><Link to="/reviewers-critics">Discover reviewers & critics</Link></Button><Button asChild><Link to="/library">Find a book to review</Link></Button></div>
                  </section>
                  <Suspense fallback={<TabLoader />}><BookReviewsFeed /></Suspense>
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
                  <div className="flex items-center gap-1 p-1 bg-white dark:bg-[#111614] rounded-xl border border-[#E8E8E3] dark:border-[#29332D] shadow-[0_2px_8px_rgba(28,32,29,0.04)] w-fit">
                    <Button
                      size="sm"
                      variant={mapView === 'readers' ? 'default' : 'ghost'}
                      className={
                        mapView === 'readers'
                          ? 'h-8 px-3 text-xs bg-[#1C442D] text-white dark:bg-[#1C3024] dark:border dark:border-[#315C43] dark:text-[#F3F0E7] shadow-xs'
                          : 'h-8 px-3 text-xs text-[#636B65] hover:text-[#1C201D] hover:bg-[#FAFAF8] dark:text-[#A5ADA6] dark:hover:text-[#F3F0E7] dark:hover:bg-[#1B241E]'
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
                          : 'h-8 px-3 text-xs text-[#636B65] hover:text-[#1C201D] hover:bg-[#FAFAF8] dark:text-[#A5ADA6] dark:hover:text-[#F3F0E7] dark:hover:bg-[#1B241E]'
                      }
                      onClick={() => setMapView('friends')}
                    >
                      <Users className="w-3.5 h-3.5 mr-1.5 text-[#1C442D] dark:text-[#D5B16D]" />
                      Friends on Map
                    </Button>
                  </div>

                  <Card className="border-[#E8E8E3] dark:border-[#29332D] bg-white dark:bg-[#111614] overflow-hidden text-[#1C201D] dark:text-[#F3F0E7] shadow-[0_2px_8px_rgba(28,32,29,0.04)] dark:shadow-none">
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
                    <div className="flex items-center justify-between pb-2 mb-3 border-b border-[#E8E8E3] dark:border-[#29332D]">
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
                          className="mt-3 text-xs h-7 border-[#E8E8E3] dark:border-[#29332D] bg-[#F4F3EF] dark:bg-[#16211A] text-[#1C201D] dark:text-[#F3F0E7] hover:border-[#1C442D]/40 dark:hover:border-[#315C43]"
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
                              className="rounded-xl border border-[#E8E8E3] dark:border-[#29332D]/70 bg-[#FAFAF8] dark:bg-[#16211A]/50 p-2.5 flex items-center justify-between gap-2.5 transition-colors hover:border-[#1C442D]/40 dark:hover:border-[#315C43] hover:bg-[#F4F3EF] dark:hover:bg-[#16211A]"
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
                                className="h-7 text-xs px-2.5 border-[#E8E8E3] dark:border-[#29332D] bg-white dark:bg-[#111614] hover:bg-[#FAFAF8] dark:hover:bg-[#1C3024] text-[#1C201D] dark:text-[#F3F0E7] shrink-0"
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
                    <div className="flex items-center justify-between pb-2 mb-3 border-b border-[#E8E8E3] dark:border-[#29332D]">
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
                              className="rounded-xl border border-[#E8E8E3] dark:border-[#29332D]/70 bg-[#FAFAF8] dark:bg-[#111614] p-2.5 flex items-center justify-between gap-2.5 transition-colors hover:border-[#1C442D]/40 dark:hover:border-[#315C43] hover:bg-[#F4F3EF] dark:hover:bg-[#161D19]"
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
                                className="h-7 text-xs px-2.5 border-[#E8E8E3] dark:border-[#29332D] bg-white dark:bg-[#16211A] hover:bg-[#FAFAF8] dark:hover:bg-[#1C3024] text-[#1C201D] dark:text-[#F3F0E7] shrink-0"
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
                    <div className="flex items-center justify-between pb-2 mb-3 border-b border-[#E8E8E3] dark:border-[#29332D]">
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
                            className="rounded-xl border border-[#E8E8E3] dark:border-[#29332D]/70 bg-[#FAFAF8] dark:bg-[#111614] p-2.5 flex items-center justify-between gap-2.5 transition-colors hover:border-[#1C442D]/40 dark:hover:border-[#315C43] hover:bg-[#F4F3EF] dark:hover:bg-[#161D19]"
                          >
                            <div className="flex items-center gap-2.5 min-w-0 flex-1">
                              <Avatar className="h-8 w-8 border border-[#E8E8E3] dark:border-[#29332D] shrink-0">
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
                              className="h-7 text-xs px-2.5 border-[#E8E8E3] dark:border-[#29332D] bg-white dark:bg-[#16211A] hover:bg-[#FAFAF8] dark:hover:bg-[#1C3024] text-[#1C442D] dark:text-[#D5B16D] shrink-0"
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
                      <div className="flex items-center justify-between pb-2 mb-3 border-b border-[#E8E8E3] dark:border-[#29332D]">
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
                  <SocialSurface className="p-4 bg-gradient-to-br from-[#F4EFEA] via-[#FAF7F2] to-[#EBF2EC] dark:from-[#111614] dark:via-[#141A16] dark:to-[#0E1210] border-[#E8E8E3] dark:border-[#29332D]">
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
      <div className="min-h-screen bg-[#FAFAF8] dark:bg-[#0B0D0C] flex items-center justify-center text-[#1C201D] dark:text-[#F3F0E7]" role="status" aria-label="Loading social community">
        <Loader2 className="w-7 h-7 animate-spin text-[#1C442D] dark:text-[#D5B16D]" />
      </div>
    );
  }

  if (!user) return <GuestLanding />;
  return <AuthenticatedSocialMedia user={user} />;
};

export default SocialMedia;
