import React, { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  CalendarDays,
  BrainCircuit,
  CheckCircle2,
  ChevronRight,
  Flame,
  Gamepad2,
  Globe,
  Loader2,
  MapPin,
  Medal,
  Plus,
  Radio,
  Search,
  Sparkles,
  Star,
  Target,
  Trophy,
  Users,
  Zap,
} from 'lucide-react';
import SEO from '@/components/SEO';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/contexts/authHelpers';
import { useChallenges, useJoinChallenge, useUserChallenges } from '@/hooks/useReadingChallenges';
import { useUserJoinedGroups } from '@/hooks/useUserGroups';
import { supabase } from '@/integrations/supabase/client-universal';
import { safeFormatDistanceToNow } from '@/lib/dateUtils';
import SignInLink from '@/components/SignInLink';
import { ErrorBoundary } from '@/components/ErrorBoundary';

type ActivityCategory = 'all' | 'clubs-events' | 'challenges' | 'games' | 'brain-science';

export default function Activity() {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const requestedTab = searchParams.get('tab');
  // Normalize old links into the consolidated Activity destinations.
  const legacyTabMap: Record<string, ActivityCategory> = { events: 'clubs-events', meetups: 'clubs-events', groups: 'clubs-events', 'iq-test': 'brain-science' };
  const initialTab = requestedTab ? legacyTabMap[requestedTab] || requestedTab : null;
  const [activeCategory, setActiveCategory] = useState<ActivityCategory>(
    initialTab === 'groups' ? 'all' : (initialTab as ActivityCategory) || 'all'
  );
  const [searchQuery, setSearchQuery] = useState('');



  // Sync tab state when URL changes (e.g. from nav clicks)
  useEffect(() => {
    const rawTab = searchParams.get('tab');
    if (rawTab && legacyTabMap[rawTab]) {
      setSearchParams((prev) => { const next = new URLSearchParams(prev); next.set('tab', legacyTabMap[rawTab]); return next; }, { replace: true });
      setActiveCategory(legacyTabMap[rawTab]);
    } else if (rawTab && rawTab !== activeCategory && ['clubs-events', 'challenges', 'games', 'brain-science'].includes(rawTab)) {
      setActiveCategory(rawTab as ActivityCategory);
    }
  }, [searchParams, activeCategory]);

  // 1. Reading Challenges
  const { data: challenges = [], isLoading: isLoadingChallenges } = useChallenges();
  const { data: userChallenges = [] } = useUserChallenges();
  const joinChallenge = useJoinChallenge();
  const joinedChallengeIds = new Set(userChallenges.map((uc) => uc.challenge_id));
  const userChallengeMap = new Map(userChallenges.map((uc) => [uc.challenge_id, uc]));

  // 2. User Joined Circles
  const { data: joinedGroups = [] } = useUserJoinedGroups();

  // 3. Events & Meetups from Supabase
  const [events, setEvents] = useState<any[]>([]);
  const [isLoadingEvents, setIsLoadingEvents] = useState(true);

  useEffect(() => {
    let active = true;
    const fetchEvents = async () => {
      setIsLoadingEvents(true);
      try {
        const { data, error } = await supabase
          .from('events')
          .select('*')
          .order('start_at', { ascending: true })
          .limit(20);

        if (!error && active && data) {
          setEvents(data);
        }
      } catch (err) {
        console.warn('Could not load events for activity hub:', err);
      } finally {
        if (active) setIsLoadingEvents(false);
      }
    };

    void fetchEvents();
    return () => {
      active = false;
    };
  }, []);

  const handleTabChange = (cat: ActivityCategory) => {
    setActiveCategory(cat);
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        if (cat === 'all') next.delete('tab');
        else next.set('tab', cat);
        return next;
      },
      { replace: true },
    );
  };

  return (
    <>
      <SEO
        title="Activity Hub - Clubs, Literary Events, Challenges, Games & Brain Science | Sahadhyayi"
        description="Join reading clubs and literary gatherings, discover festivals, take reading challenges, play book games, and explore reasoning and everyday science."
        canonical="https://sahadhyayi.com/activity"
      />

      <div className="min-h-screen bg-[#FAFAF8] text-[#1C201D] dark:bg-[#0B0D0C] dark:text-[#F3F0E7]">
        {/* ── Photo-Led Activity Hero ── */}
        <section className="relative isolate overflow-hidden border-b border-[#E8E8E3] bg-[#F4EFEA] px-4 py-14 dark:border-[#29332D] dark:bg-[#111614] sm:px-6 sm:py-20 lg:px-8">
          <img
            src="https://images.unsplash.com/photo-1529148482759-b35b2825750f?auto=format&fit=crop&w=2200&q=85"
            alt=""
            aria-hidden="true"
            className="absolute inset-y-0 right-0 h-full w-full object-cover object-center sm:w-[65%]"
            loading="eager"
          />
          <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-b from-[#FAF7F2]/95 via-[#FAF7F2]/88 to-[#FAF7F2]/80 dark:from-[#0B0D0C]/95 dark:via-[#0B0D0C]/88 dark:to-[#0B0D0C]/80 sm:hidden" />
          <div aria-hidden="true" className="hidden sm:block absolute inset-0 bg-gradient-to-r from-[#FAF7F2] via-[#FAF7F2]/85 to-[#FAF7F2]/15 dark:from-[#0B0D0C] dark:via-[#0B0D0C]/85 dark:to-[#0B0D0C]/20" />

          <div className="relative z-10 mx-auto max-w-7xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white dark:bg-[#111614] border border-[#E8E8E3] dark:border-[#29332D] text-[11px] font-semibold uppercase tracking-widest text-[#1C442D] dark:text-[#D5B16D] mb-4 shadow-xs">
              <Zap className="w-3.5 h-3.5 text-amber-500" />
              Interactive Reading Hub
            </div>

            <h1 className="max-w-2xl font-serif text-3xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-[#1C201D] dark:text-[#F3F0E7] leading-tight">
              Read, play, and connect <span className="block text-[#1C442D] dark:text-[#D5B16D]">through literature.</span>
            </h1>

            <p className="mt-4 max-w-xl text-sm sm:text-base leading-relaxed text-[#636B65] dark:text-[#A5ADA6]">
              Join reading clubs and literary gatherings, discover festivals, take reading challenges, play book games, and explore IQ, reasoning and everyday science.
            </p>

            {/* Quick Action Navigation Buttons */}
            <div className="mt-8 flex flex-wrap gap-2.5">
              <Link to="/activity?tab=clubs-events">
                <Button variant="outline" className="gap-2 rounded-xl bg-white dark:bg-[#111614] text-xs h-10 border-[#E8E2D9] dark:border-[#29332D]">
                  <CalendarDays className="h-4 w-4 text-[#1C442D] dark:text-[#D5B16D]" />
                  Clubs & Events
                </Button>
              </Link>
              <Link to="/games">
                <Button variant="outline" className="gap-2 rounded-xl bg-white dark:bg-[#111614] text-xs h-10 border-[#E8E2D9] dark:border-[#29332D]">
                  <Gamepad2 className="h-4 w-4 text-[#1C442D] dark:text-[#D5B16D]" />
                  Book Games
                </Button>
              </Link>
              <Link to="/brain">
                <Button variant="outline" className="gap-2 rounded-xl bg-white dark:bg-[#111614] text-xs h-10 border-[#E8E2D9] dark:border-[#29332D]">
                  <BrainCircuit className="h-4 w-4 text-[#1C442D] dark:text-[#D5B16D]" />
                  Brain & Science
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* ── Main Activity Workspace ── */}
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8 space-y-10">
          {/* ── Category Quick Jump Cards ── */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {[
              {
                id: 'clubs-events',
                title: 'Clubs & Events',
                desc: 'Club hubs, gatherings, events & festivals',
                icon: CalendarDays,
                count: events.length || 'Explore',
              },
              {
                id: 'challenges',
                title: 'Challenges',
                desc: 'Reading goals & badges',
                icon: Target,
                count: challenges.length || '5+',
              },
              {
                id: 'games',
                title: 'Book Games',
                desc: 'Quizzes & trivia',
                icon: Gamepad2,
                count: '4 Games',
              },
              {
                id: 'brain-science',
                title: 'Brain & Science',
                desc: 'IQ, reasoning & everyday science',
                icon: BrainCircuit,
                count: 'Explore',
              },
            ].map(({ id, title, desc, icon: Icon, count }) => {
              const isSelected = activeCategory === id;
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => handleTabChange(id as ActivityCategory)}
                  className={`group flex flex-col text-left rounded-2xl border p-4 sm:p-5 transition-all duration-200 hover:-translate-y-1 hover:shadow-lg ${
                    isSelected
                      ? 'border-[#1C442D] bg-[#FAF7F2] shadow-sm dark:border-[#D5B16D] dark:bg-[#161D19]'
                      : 'border-[#E8E2D9] bg-white dark:border-[#29332D] dark:bg-[#111614]'
                  }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#EBF2EC] text-[#1C442D] transition-transform group-hover:scale-110 dark:bg-[#1C3024] dark:text-[#D5B16D]">
                      <Icon className="h-4 w-4" />
                    </span>
                    <Badge variant="secondary" className="text-[10px] font-mono">
                      {count}
                    </Badge>
                  </div>
                  <h3 className="font-serif text-base font-bold text-[#1C201D] dark:text-[#F3F0E7]">
                    {title}
                  </h3>
                  <p className="mt-1 text-[11px] text-[#636B65] dark:text-[#A5ADA6] line-clamp-1">
                    {desc}
                  </p>
                </button>
              );
            })}
          </div>

          {/* ── User Participation / Recently Joined (When signed in) ── */}
          {user && (userChallenges.length > 0 || joinedGroups.length > 0) && (
            <div className="rounded-2xl border border-[#E8E2D9] bg-[#FAF7F2] p-5 sm:p-6 dark:border-[#29332D] dark:bg-[#111713] space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="flex items-center gap-2 font-serif text-lg font-bold text-[#1C201D] dark:text-[#F3F0E7]">
                    <Trophy className="h-5 w-5 text-amber-500" />
                    Your Active Reading Activities
                  </h3>
                  <p className="text-xs text-[#636B65] dark:text-[#A5ADA6]">
                    Track your joined reading goals and club memberships.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {/* Joined Challenges */}
                {userChallenges.map((uc) => {
                  const ch = challenges.find((c) => c.id === uc.challenge_id);
                  if (!ch) return null;
                  const pct = ch.goal > 0 ? Math.min(100, Math.round((uc.progress / ch.goal) * 100)) : 0;
                  return (
                    <Card key={uc.id} className="rounded-xl border-[#E8E2D9] dark:border-[#29332D] bg-white dark:bg-[#111614] p-3.5 shadow-xs">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-semibold text-[#1C201D] dark:text-[#F3F0E7] truncate">
                          {ch.name}
                        </span>
                        <Badge className="bg-emerald-600/10 text-emerald-700 dark:text-emerald-400 text-[10px] border-0">
                          {uc.completed ? 'Completed' : `${pct}% done`}
                        </Badge>
                      </div>
                      <Progress value={pct} className="h-1.5" />
                      <p className="mt-2 text-[11px] text-[#636B65] dark:text-[#A5ADA6]">
                        {uc.progress} of {ch.goal} books read
                      </p>
                    </Card>
                  );
                })}

                {/* Joined Groups */}
                {joinedGroups.slice(0, 3).map((member) => {
                  const group = member.groups || { id: member.group_id, name: 'Reading Group', description: '' };
                  const groupId = member.group_id || group.id;
                  return (
                    <Card key={member.id} className="rounded-xl border-[#E8E2D9] dark:border-[#29332D] bg-white dark:bg-[#111614] p-3.5 shadow-xs">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-semibold text-[#1C201D] dark:text-[#F3F0E7] truncate">
                          {group.name}
                        </span>
                        <Badge variant="outline" className="text-[10px]">
                          Joined
                        </Badge>
                      </div>
                      <p className="line-clamp-1 text-[11px] text-[#636B65] dark:text-[#A5ADA6]">
                        {group.description || 'Active reading group'}
                      </p>
                      <Link to={`/groups/${groupId}`} className="mt-2 block text-xs font-semibold text-[#1C442D] dark:text-[#D5B16D] hover:underline">
                        Open Club Discussion →
                      </Link>
                    </Card>
                  );
                })}
              </div>
            </div>
          )}

          {/* ── Categorized Content Stream ── */}
          <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#E8E2D9] pb-4 dark:border-[#29332D]">
              <div className="flex flex-wrap gap-1.5">
                {[
                  { id: 'all', label: 'All Activities' },
                  { id: 'clubs-events', label: 'Clubs & Events' }, 
                  { id: 'challenges', label: 'Reading Challenges' },
                  { id: 'games', label: 'Book Games' },
                  { id: 'brain-science', label: 'Brain & Science' }, 
                ].map(({ id, label }) => {
                  const isCurrent = activeCategory === id;
                  return (
                    <button
                      key={id}
                      type="button"
                      onClick={() => handleTabChange(id as ActivityCategory)}
                      className={`rounded-xl px-3.5 py-1.5 text-xs font-medium transition-colors ${
                        isCurrent
                          ? 'bg-[#1C442D] text-white font-semibold dark:bg-[#D5B16D] dark:text-[#0B0D0C]'
                          : 'text-[#636B65] hover:bg-[#FAF7F2] hover:text-[#1C201D] dark:text-[#A5ADA6] dark:hover:bg-[#161D19] dark:hover:text-white'
                      }`}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>

              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  placeholder="Filter activities..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-9 pl-9 rounded-xl border-[#E8E2D9] dark:border-[#29332D] text-xs"
                />
              </div>
            </div>

            <ErrorBoundary
              fallback={
                <div className="rounded-2xl border border-border/70 bg-card p-8 text-center">
                  <p className="text-sm font-semibold text-foreground">Activities could not be loaded</p>
                  <p className="mt-1 text-xs text-muted-foreground">A temporary error occurred while rendering this section.</p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.location.reload()}
                    className="mt-4 text-xs"
                  >
                    Reload Activities
                  </Button>
                </div>
              }
            >
            {/* 1. READING CHALLENGES SECTION */}
            {(activeCategory === 'all' || activeCategory === 'challenges') && (
              <section className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="flex items-center gap-2 font-serif text-xl font-bold text-[#1C201D] dark:text-[#F3F0E7]">
                      <Target className="h-5 w-5 text-amber-600 dark:text-amber-500" />
                      Reading Challenges & Streaks
                    </h2>
                    <p className="text-xs text-[#636B65] dark:text-[#A5ADA6]">
                      Set goals, earn badges, and motivate yourself with community reading milestones.
                    </p>
                  </div>
                  <Link to="/bookshelf">
                    <Button variant="ghost" size="sm" className="text-xs font-semibold text-[#1C442D] dark:text-[#D5B16D]">
                      View Bookshelf Goals →
                    </Button>
                  </Link>
                </div>

                <div className="relative overflow-hidden rounded-2xl border border-amber-200/70 bg-gradient-to-r from-amber-50 via-orange-50/70 to-white p-4 sm:p-5 dark:border-amber-900/40 dark:from-amber-950/25 dark:via-orange-950/15 dark:to-[#111614]">
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300"><Flame className="h-5 w-5" /></div>
                    <div className="min-w-0 flex-1"><p className="text-sm font-semibold text-foreground">Small goals. Meaningful momentum.</p><p className="mt-0.5 text-xs text-muted-foreground">Choose a pace that fits your life, then celebrate every book finished.</p></div>
                    <Badge variant="outline" className="hidden sm:inline-flex border-amber-300/70 text-amber-800 dark:text-amber-300">Your next milestone</Badge>
                  </div>
                </div>
                {isLoadingChallenges ? (
                  <div className="py-8 text-center text-xs text-muted-foreground">Loading challenges…</div>
                ) : challenges.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-[#E8E2D9] p-6 text-center text-xs text-muted-foreground dark:border-[#29332D]">
                    No challenges available right now.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {challenges
                      .filter((c) => !searchQuery || c.name.toLowerCase().includes(searchQuery.toLowerCase()))
                      .map((challenge) => {
                        const participation = userChallengeMap.get(challenge.id);
                        const progress = participation?.progress ?? 0;
                        const percent = challenge.goal > 0 ? Math.min(100, Math.round((progress / challenge.goal) * 100)) : 0;
                        const joined = joinedChallengeIds.has(challenge.id);

                        return (
                          <Card key={challenge.id} className="rounded-2xl border-[#E8E2D9] bg-white p-5 shadow-xs dark:border-[#29332D] dark:bg-[#111614] flex flex-col justify-between">
                            <div>
                              <div className="flex items-center justify-between gap-2 mb-2">
                                <Badge className="bg-amber-500/10 text-amber-700 dark:text-amber-400 text-[10px] border-0">
                                  {challenge.challenge_type || 'Annual Goal'}
                                </Badge>
                                {joined && (
                                  <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                                    <CheckCircle2 className="h-3 w-3" /> {participation?.completed ? 'Completed' : 'Enrolled'}
                                  </span>
                                )}
                              </div>
                              <h3 className="font-serif text-base font-bold text-[#1C201D] dark:text-[#F3F0E7]">
                                {challenge.name}
                              </h3>
                              <p className="mt-1 text-xs text-[#636B65] dark:text-[#A5ADA6] leading-relaxed">
                                {challenge.description}
                              </p>
                            </div>

                            <div className="mt-4 pt-4 border-t border-[#E8E2D9] dark:border-[#29332D]">
                              {joined ? (
                                <div className="space-y-1.5">
                                  <div className="flex justify-between text-xs font-semibold">
                                    <span>{progress} / {challenge.goal} books</span>
                                    <span>{percent}%</span>
                                  </div>
                                  <Progress value={percent} className="h-2" />
                                </div>
                              ) : (
                                <div className="flex items-center justify-between">
                                  <span className="text-xs font-medium text-muted-foreground">
                                    Target: {challenge.goal} books
                                  </span>
                                  {user ? (
                                    <Button
                                      size="sm"
                                      onClick={() => joinChallenge.mutate(challenge.id)}
                                      disabled={joinChallenge.isPending}
                                      className="rounded-xl bg-[#1C442D] text-white hover:bg-[#143221] dark:bg-[#D5B16D] dark:text-[#0B0D0C] text-xs h-8 px-4"
                                    >
                                      Join Goal
                                    </Button>
                                  ) : (
                                    <SignInLink redirectPath="/activity">
                                      <Button size="sm" variant="outline" className="rounded-xl text-xs h-8">
                                        Sign in to join
                                      </Button>
                                    </SignInLink>
                                  )}
                                </div>
                              )}
                            </div>
                          </Card>
                        );
                      })}
                  </div>
                )}
              </section>
            )}

            {/* 2. BOOK GAMES SECTION */}
            {(activeCategory === 'all' || activeCategory === 'games') && (
              <section className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="flex items-center gap-2 font-serif text-xl font-bold text-[#1C201D] dark:text-[#F3F0E7]">
                      <Gamepad2 className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                      Book Games & Quizzes
                    </h2>
                    <p className="text-xs text-[#636B65] dark:text-[#A5ADA6]">
                      Test your literary knowledge, play bookish trivia, and challenge your friends.
                    </p>
                  </div>
                  <Link to="/games">
                    <Button variant="ghost" size="sm" className="text-xs font-semibold text-[#1C442D] dark:text-[#D5B16D]">
                      Open Games Arcade →
                    </Button>
                  </Link>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  {[
                    {
                      id: 'quiz',
                      title: 'Literary Trivia Quest',
                      desc: 'Answer questions across world literature and Indian classics.',
                      badge: 'Popular',
                      color: 'from-emerald-500/10 to-teal-500/5',
                    },
                    {
                      id: 'daily',
                      title: 'Daily Book Challenge',
                      desc: 'A fresh literary riddle every morning to keep your streak alive.',
                      badge: 'Daily',
                      color: 'from-amber-500/10 to-orange-500/5',
                    },
                    {
                      id: 'friend',
                      title: 'Reader vs Reader',
                      desc: 'Challenge a reading partner to a real-time literary showdown.',
                      badge: 'Multiplayer',
                      color: 'from-indigo-500/10 to-purple-500/5',
                    },
                    {
                      id: 'leaderboard',
                      title: 'Hall of Fame',
                      desc: 'See the top literary minds and rank up with every quiz solved.',
                      badge: 'Ranks',
                      color: 'from-rose-500/10 to-pink-500/5',
                    },
                  ].map(({ id, title, desc, badge, color }) => (
                    <Card key={id} className="rounded-2xl border-[#E8E2D9] bg-white p-5 shadow-xs dark:border-[#29332D] dark:bg-[#111614] flex flex-col justify-between">
                      <div>
                        <Badge variant="secondary" className="text-[10px] mb-2 font-mono">
                          {badge}
                        </Badge>
                        <h3 className="font-serif text-base font-bold text-[#1C201D] dark:text-[#F3F0E7]">
                          {title}
                        </h3>
                        <p className="mt-1 text-xs text-[#636B65] dark:text-[#A5ADA6] leading-relaxed">
                          {desc}
                        </p>
                      </div>

                      <Link to="/games" className="mt-4 pt-3 border-t border-[#E8E2D9] dark:border-[#29332D]">
                        <Button className="w-full rounded-xl bg-[#1C442D] text-white hover:bg-[#143221] dark:bg-[#D5B16D] dark:text-[#0B0D0C] dark:hover:bg-[#c49f5c] text-xs h-9 font-semibold">
                          Play Now →
                        </Button>
                      </Link>
                    </Card>
                  ))}
                </div>
              </section>
            )}

            {/* 3. BRAIN LAB SECTION */}
            {(activeCategory === 'all' || activeCategory === 'brain-science') && (
              <section className="space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h2 className="flex items-center gap-2 font-serif text-xl font-bold text-[#1C201D] dark:text-[#F3F0E7]">
                      <BrainCircuit className="h-5 w-5 text-violet-600 dark:text-violet-400" />
                      Brain, Reasoning & Everyday Science
                    </h2>
                    <p className="text-xs text-[#636B65] dark:text-[#A5ADA6]">
                      Test your reasoning, practise visual puzzles, and explain the science behind everyday things.
                    </p>
                  </div>
                  <Link to="/brain">
                    <Button variant="ghost" size="sm" className="text-xs font-semibold text-[#1C442D] dark:text-[#D5B16D]">
                      Explore Everyday Science →
                    </Button>
                  </Link>
                </div>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  <Card className="rounded-2xl border-violet-200/70 bg-gradient-to-br from-violet-50 to-white p-5 shadow-xs dark:border-violet-900/40 dark:from-violet-950/20 dark:to-[#111614]">
                    <div className="flex items-center gap-3">
                      <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-violet-500/10 text-violet-600 dark:text-violet-300"><BrainCircuit className="h-5 w-5" /></span>
                      <div><Badge variant="secondary" className="text-[10px]">IQ Test</Badge><h3 className="mt-1 font-serif text-base font-bold">Reasoning playground</h3></div>
                    </div>
                    <p className="mt-3 text-xs leading-relaxed text-[#636B65] dark:text-[#A5ADA6]">Practise patterns, logic and problem-solving with original learning activities.</p>
                    <Link to="/brain" className="mt-4 block"><Button className="w-full rounded-xl text-xs">Open IQ Test →</Button></Link>
                  </Card>
                  <Card className="rounded-2xl border-[#E8E2D9] bg-white p-5 shadow-xs dark:border-[#29332D] dark:bg-[#111614]">
                    <div className="flex items-center gap-3"><span className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-300"><Sparkles className="h-5 w-5" /></span><div><Badge variant="outline" className="text-[10px]">Fresh puzzles</Badge><h3 className="mt-1 font-serif text-base font-bold">Visual matrix practice</h3></div></div>
                    <p className="mt-3 text-xs leading-relaxed text-[#636B65] dark:text-[#A5ADA6]">Complete 3 × 3 shape patterns and learn the rules behind each answer.</p>
                    <Link to="/brain/matrices" className="mt-4 block"><Button variant="outline" className="w-full rounded-xl text-xs">Practise matrices →</Button></Link>
                  </Card>
                  <Card className="rounded-2xl border-[#E8E2D9] bg-white p-5 shadow-xs dark:border-[#29332D] dark:bg-[#111614]">
                    <div className="flex items-center gap-3"><span className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-300"><Target className="h-5 w-5" /></span><div><Badge variant="outline" className="text-[10px]">Timed practice</Badge><h3 className="mt-1 font-serif text-base font-bold">Reasoning assessment</h3></div></div>
                    <p className="mt-3 text-xs leading-relaxed text-[#636B65] dark:text-[#A5ADA6]">Try a broader practice set covering logic, numbers, words and visual patterns.</p>
                    <Link to="/brain/iq-test" className="mt-4 block"><Button variant="outline" className="w-full rounded-xl text-xs">Start assessment →</Button></Link>
                  </Card>
                  <Card className="rounded-2xl border-emerald-200/70 bg-gradient-to-br from-emerald-50 to-white p-5 shadow-xs dark:border-emerald-900/40 dark:from-emerald-950/20 dark:to-[#111614]">
                    <div className="flex items-center gap-3"><span className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-300"><Sparkles className="h-5 w-5" /></span><div><Badge variant="secondary" className="text-[10px]">Everyday Science</Badge><h3 className="mt-1 font-serif text-base font-bold">Explain Science Around You</h3></div></div>
                    <p className="mt-3 text-xs leading-relaxed text-[#636B65] dark:text-[#A5ADA6]">Explain how familiar things work—fans, air conditioners, buses and more—and get an AI-assisted evaluation of your understanding.</p>
                    <Link to="/science-around-you" className="mt-4 block"><Button className="w-full rounded-xl text-xs">Try Everyday Science →</Button></Link>
                  </Card>
                </div>
              </section>
            )}

            {/* 4. CLUBS, GATHERINGS & LITERARY EVENTS SECTION */}
            {(activeCategory === 'all' || activeCategory === 'clubs-events') && (
              <section id="activity-meetups-section" className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="flex items-center gap-2 font-serif text-xl font-bold text-[#1C201D] dark:text-[#F3F0E7]">
                      <CalendarDays className="h-5 w-5 text-rose-600 dark:text-rose-400" />
                      Clubs, Gatherings & Literary Events
                    </h2>
                    <p className="text-xs text-[#636B65] dark:text-[#A5ADA6]">
                      Discover reading club hubs, meet fellow readers at gatherings, and find book fairs, author sessions and literary festivals.
                    </p>
                  </div>
                  <Link to="/events">
                    <Button variant="ghost" size="sm" className="text-xs font-semibold text-[#1C442D] dark:text-[#D5B16D]">
                      Explore Events & Festivals →
                    </Button>
                  </Link>
                </div>

                <div className="grid gap-3 sm:grid-cols-2 mb-2">
                  <Card className="rounded-xl border-[#E8E2D9] bg-white p-4 shadow-xs dark:border-[#29332D] dark:bg-[#111614]">
                    <div className="flex items-center gap-2"><Users className="h-4 w-4 text-[#1C442D] dark:text-[#D5B16D]" /><h3 className="font-serif text-sm font-bold">Club Hubs</h3></div>
                    <p className="mt-1 text-xs text-[#636B65] dark:text-[#A5ADA6]">Find reading clubs, explore group discussions and join a circle around books you love.</p>
                    <Link to="/groups" className="mt-3 inline-flex text-xs font-semibold text-[#1C442D] dark:text-[#D5B16D]">Explore Club Hubs →</Link>
                  </Card>
                  <Card className="rounded-xl border-[#E8E2D9] bg-white p-4 shadow-xs dark:border-[#29332D] dark:bg-[#111614]">
                    <div className="flex items-center gap-2"><CalendarDays className="h-4 w-4 text-rose-600 dark:text-rose-400" /><h3 className="font-serif text-sm font-bold">Gatherings, Events & Festivals</h3></div>
                    <p className="mt-1 text-xs text-[#636B65] dark:text-[#A5ADA6]">Browse online and in-person meetups, author conversations, book fairs and literary festivals.</p>
                    <Link to="/events" className="mt-3 inline-flex text-xs font-semibold text-[#1C442D] dark:text-[#D5B16D]">Browse the calendar →</Link>
                  </Card>
                </div>
                {isLoadingEvents ? (
                  <div className="py-8 text-center text-xs text-muted-foreground">Loading events…</div>
                ) : events.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-[#E8E2D9] p-6 text-center text-xs text-muted-foreground dark:border-[#29332D]">
                    No upcoming events scheduled right now. Check back soon!
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {events
                      .filter((e) => !searchQuery || e.title.toLowerCase().includes(searchQuery.toLowerCase()))
                      .slice(0, 6)
                      .map((event) => (
                        <Card key={event.id} className="group overflow-hidden rounded-2xl border-[#E8E2D9] bg-white shadow-xs transition-all hover:-translate-y-1 hover:shadow-md dark:border-[#29332D] dark:bg-[#111614] flex flex-col justify-between">
                          <div>
                            <div className="relative aspect-[16/9] w-full overflow-hidden bg-muted">
                              {event.image_url ? (
                                <img
                                  src={event.image_url}
                                  alt={event.title}
                                  loading="lazy"
                                  className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                                />
                              ) : (
                                <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-[#1C442D]/20 via-muted to-transparent">
                                  <CalendarDays className="h-10 w-10 text-[#1C442D]/40 dark:text-[#D5B16D]/40" />
                                </div>
                              )}
                              <Badge className="absolute left-3 top-3 text-[10px] bg-white/90 text-[#1C201D] dark:bg-[#0B0D0C]/90 dark:text-[#F3F0E7]">
                                {event.is_online ? 'Online' : event.city || 'In-Person'}
                              </Badge>
                            </div>

                            <div className="p-4 sm:p-5">
                              <span className="text-[11px] font-semibold text-[#1C442D] dark:text-[#D5B16D] block mb-1">
                                {event.start_at ? new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(event.start_at)) : 'Upcoming'}
                              </span>
                              <h3 className="line-clamp-2 font-serif text-base font-bold text-[#1C201D] dark:text-[#F3F0E7]">
                                {event.title}
                              </h3>
                              <p className="mt-1 line-clamp-2 text-xs text-[#636B65] dark:text-[#A5ADA6]">
                                {event.description || 'Join this literary event on Sahadhyayi.'}
                              </p>
                            </div>
                          </div>

                          <div className="px-4 pb-4 sm:px-5 sm:pb-5">
                            <Link to={`/events/${event.slug || event.id}`}>
                              <Button variant="outline" size="sm" className="w-full rounded-xl text-xs h-9">
                                View Details & RSVP →
                              </Button>
                            </Link>
                          </div>
                        </Card>
                      ))}
                  </div>
                )}
              </section>
            )}
            </ErrorBoundary>
          </div>
        </div>
      </div>
    </>
  );
}
