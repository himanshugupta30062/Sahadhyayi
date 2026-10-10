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
  Flame,
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

// Lazy-load the 4 book-native feature panels
const MarginNotesFeed = lazy(() => import('@/components/social/margins/MarginNotesFeed'));
const SpoilerThreadsFeed = lazy(() => import('@/components/social/threads/SpoilerThreadsFeed'));
const ReadingRoomsPanel = lazy(() => import('@/components/social/rooms/ReadingRoomsPanel'));
const ReadingDnaPanel = lazy(() => import('@/components/social/dna/ReadingDnaPanel'));

const VALID_SOCIAL_TABS = ['feed', 'rooms', 'threads', 'margins', 'dna', 'friends', 'map', 'groups'] as const;

const SocialMedia = () => {
  const { user, loading } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const tabParam = searchParams.get('tab');
  const activeTab = VALID_SOCIAL_TABS.includes(tabParam as any) ? (tabParam as string) : 'feed';
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

  if (loading) {
    return <div className="min-h-screen bg-background" aria-hidden />;
  }

  if (!user) {
    return (
      <>
        <SEO
          title="Social Reading Community | Sahadhyayi"
          description="Join Sahadhyayi's social reading community. Experience live reading rooms, book margins, spoiler-free chapter threads, and reader taste matching."
          canonical="https://sahadhyayi.com/social"
          url="https://sahadhyayi.com/social"
        />
        <div className="min-h-screen bg-background">
          {/* Guest Hero */}
          <div className="relative overflow-hidden bg-gradient-to-br from-brand-primary/10 via-background to-brand-secondary/10 border-b border-border py-16 px-4">
            <div className="max-w-4xl mx-auto text-center">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-card/80 backdrop-blur-sm border border-border text-xs font-semibold text-brand-primary mb-6 shadow-xs">
                <Sparkles className="w-3.5 h-3.5" />
                Book-Native Social Community
              </div>
              <h1 className="text-4xl md:text-5xl font-serif font-bold text-foreground mb-4 tracking-tight">
                Where Readers Connect Around Books
              </h1>
              <p className="text-base md:text-lg text-muted-foreground max-w-2xl mx-auto mb-8 leading-relaxed">
                Step beyond traditional social networks. Join silent reading rooms, annotate chapter margins, debate plot twists spoiler-free, and discover book twins with matching literary DNA.
              </p>

              <div className="flex flex-col sm:flex-row gap-3 justify-center mb-10">
                <SignInLink>
                  <Button className="w-full sm:w-auto bg-brand-primary text-white hover:bg-brand-primary/90 px-8 h-11 text-sm font-medium shadow-md shadow-brand-primary/20">
                    Sign In
                  </Button>
                </SignInLink>
                <Link to="/signup">
                  <Button variant="outline" className="w-full sm:w-auto border-border hover:bg-muted px-8 h-11 text-sm font-medium">
                    Create Account
                  </Button>
                </Link>
              </div>

              {/* Live activity preview bar */}
              <div className="max-w-3xl mx-auto text-left">
                <BookPulseBar />
              </div>
            </div>
          </div>

          {/* Pillars of Book Social */}
          <div className="max-w-5xl mx-auto px-4 py-16">
            <div className="text-center max-w-xl mx-auto mb-10">
              <h2 className="text-2xl font-bold text-foreground mb-2">Built for Deep Reading Culture</h2>
              <p className="text-sm text-muted-foreground">Every interaction is tied directly to the books and chapters you read.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              <Card className="border-border/80 bg-card/50 hover:bg-card hover:border-brand-primary/40 transition-all shadow-xs">
                <CardContent className="p-5">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-4">
                    <Radio className="w-5 h-5 animate-pulse" />
                  </div>
                  <h3 className="text-base font-semibold text-foreground mb-1">Live Reading Rooms</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Join synchronous silent reading sprints and co-read pages with readers worldwide.
                  </p>
                </CardContent>
              </Card>

              <Card className="border-border/80 bg-card/50 hover:bg-card hover:border-brand-primary/40 transition-all shadow-xs">
                <CardContent className="p-5">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center mb-4">
                    <Quote className="w-5 h-5" />
                  </div>
                  <h3 className="text-base font-semibold text-foreground mb-1">Public Marginalia</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Underline quotes, write margin notes, and see annotations left by other readers on identical pages.
                  </p>
                </CardContent>
              </Card>

              <Card className="border-border/80 bg-card/50 hover:bg-card hover:border-brand-primary/40 transition-all shadow-xs">
                <CardContent className="p-5">
                  <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mb-4">
                    <Lock className="w-5 h-5" />
                  </div>
                  <h3 className="text-base font-semibold text-foreground mb-1">Spoiler-Safe Threads</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Debate mid-book plot twists locked by chapter number so nobody gets spoiled.
                  </p>
                </CardContent>
              </Card>

              <Card className="border-border/80 bg-card/50 hover:bg-card hover:border-brand-primary/40 transition-all shadow-xs">
                <CardContent className="p-5">
                  <div className="w-10 h-10 rounded-xl bg-fuchsia-500/10 text-fuchsia-600 dark:text-fuchsia-400 flex items-center justify-center mb-4">
                    <Dna className="w-5 h-5" />
                  </div>
                  <h3 className="text-base font-semibold text-foreground mb-1">Reading DNA Match</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Automatically computes taste compatibility and pairs you with readers who share your favorite genres.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </>
    );
  }

  const tabs = [
    { value: 'feed', label: 'Feed', icon: MessageCircle },
    {
      value: 'rooms',
      label: 'Rooms',
      icon: Radio,
      badge: rooms.length > 0 ? rooms.length : undefined,
      isLive: rooms.length > 0,
    },
    {
      value: 'threads',
      label: 'Threads',
      icon: Lock,
      badge: spoilerThreads.length > 0 ? spoilerThreads.length : undefined,
    },
    {
      value: 'margins',
      label: 'Margins',
      icon: Quote,
      badge: marginNotes.length > 0 ? marginNotes.length : undefined,
    },
    { value: 'dna', label: 'DNA', icon: Dna },
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
        {/* Header */}
        <div className="bg-gradient-to-br from-brand-primary/10 via-background to-brand-secondary/10 border-b border-border">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-brand-primary/10 flex items-center justify-center shrink-0">
                  <Sparkles className="w-5 h-5 text-brand-primary" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-foreground">Sahadhyayi Social</h1>
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    Book-native community: Live Rooms, Marginalia, Spoiler-Safe Threads &amp; Reading DNA
                  </p>
                </div>
              </div>

              {/* Quick Jump Action Pills */}
              <div className="flex items-center gap-1.5 flex-wrap">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleTabChange('rooms')}
                  className="h-8 text-xs border-emerald-500/30 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10 gap-1.5"
                >
                  <Radio className="w-3.5 h-3.5 animate-pulse" />
                  Live Rooms
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleTabChange('threads')}
                  className="h-8 text-xs border-indigo-500/30 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-500/10 gap-1.5"
                >
                  <Lock className="w-3.5 h-3.5" />
                  Threads
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleTabChange('margins')}
                  className="h-8 text-xs border-amber-500/30 text-amber-600 dark:text-amber-400 hover:bg-amber-500/10 gap-1.5"
                >
                  <Quote className="w-3.5 h-3.5" />
                  Margins
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
            <div className="overflow-x-auto scrollbar-none pb-2 mb-6">
              <TabsList className="bg-muted/50 rounded-xl p-1 inline-flex w-auto min-w-full sm:min-w-0 justify-start gap-1">
                {tabs.map(tab => (
                  <TabsTrigger
                    key={tab.value}
                    value={tab.value}
                    className="rounded-lg gap-1.5 text-xs sm:text-sm whitespace-nowrap data-[state=active]:bg-background data-[state=active]:shadow-xs data-[state=active]:text-brand-primary transition-all px-3 py-1.5"
                  >
                    <tab.icon className="w-4 h-4 shrink-0" />
                    <span>{tab.label}</span>
                    {tab.isLive && (
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse ml-0.5" />
                    )}
                    {tab.badge !== undefined && (
                      <Badge
                        variant="secondary"
                        className="text-[10px] px-1.5 py-0 h-4 bg-brand-primary/10 text-brand-primary border-none font-medium ml-0.5"
                      >
                        {tab.badge}
                      </Badge>
                    )}
                  </TabsTrigger>
                ))}
              </TabsList>
            </div>

            <TabsContent value="feed" className="mt-0">
              <div className="max-w-2xl mx-auto">
                <EnhancedSocialFeed />
              </div>
            </TabsContent>

            <TabsContent value="rooms" className="mt-0">
              <div className="max-w-3xl mx-auto">
                <Suspense fallback={<div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-brand-primary" /></div>}>
                  <ReadingRoomsPanel />
                </Suspense>
              </div>
            </TabsContent>

            <TabsContent value="threads" className="mt-0">
              <div className="max-w-2xl mx-auto">
                <Suspense fallback={<div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-brand-primary" /></div>}>
                  <SpoilerThreadsFeed />
                </Suspense>
              </div>
            </TabsContent>

            <TabsContent value="margins" className="mt-0">
              <div className="max-w-2xl mx-auto">
                <Suspense fallback={<div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-brand-primary" /></div>}>
                  <MarginNotesFeed />
                </Suspense>
              </div>
            </TabsContent>

            <TabsContent value="dna" className="mt-0">
              <div className="max-w-2xl mx-auto">
                <Suspense fallback={<div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-brand-primary" /></div>}>
                  <ReadingDnaPanel />
                </Suspense>
              </div>
            </TabsContent>

            <TabsContent value="friends" className="mt-0">
              <EnhancedFriendsManager />
            </TabsContent>

            <TabsContent value="map" className="mt-0">
              <div className="space-y-4">
                <div className="flex items-center gap-1.5 p-1 bg-muted/60 rounded-xl border border-border w-fit">
                  <Button
                    size="sm"
                    variant={mapView === 'readers' ? 'default' : 'ghost'}
                    className={mapView === 'readers' ? 'h-8 px-3 text-xs bg-brand-primary text-white shadow-xs' : 'h-8 px-3 text-xs text-muted-foreground'}
                    onClick={() => setMapView('readers')}
                  >
                    <MapPin className="w-3.5 h-3.5 mr-1.5" />
                    Readers Near Me
                  </Button>
                  <Button
                    size="sm"
                    variant={mapView === 'friends' ? 'default' : 'ghost'}
                    className={mapView === 'friends' ? 'h-8 px-3 text-xs bg-brand-primary text-white shadow-xs' : 'h-8 px-3 text-xs text-muted-foreground'}
                    onClick={() => setMapView('friends')}
                  >
                    <Users className="w-3.5 h-3.5 mr-1.5" />
                    Friends on Map
                  </Button>
                </div>

                {mapView === 'readers' ? (
                  <Card className="border-border overflow-hidden">
                    <EnhancedReadingMap />
                  </Card>
                ) : (
                  <Card className="border-border overflow-hidden">
                    <FriendsLocationMap />
                  </Card>
                )}
              </div>
            </TabsContent>

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
