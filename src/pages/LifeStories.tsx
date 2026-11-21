import React, { useMemo, useState, useEffect, useRef } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowRight,
  Bookmark,
  BookOpen,
  Check,
  Compass,
  ExternalLink,
  Feather,
  Heart,
  Pause,
  Play,
  Plus,
  Search,
  Share2,
  ShieldCheck,
  Sparkles,
  Users,
  Volume2,
} from 'lucide-react';
import SEO from '@/components/SEO';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { SuggestLifeStoryDialog } from '@/components/stories/SuggestLifeStoryDialog';
import { WriteLifeStoryDialog } from '@/components/stories/WriteLifeStoryDialog';
import { useStories } from '@/hooks/useStories';
import { toast } from 'sonner';
import type { LifeStory } from '@/data/lifeStories';
import { generateBreadcrumbSchema } from '@/utils/schema';


const categories = [
  'All stories',
  'Saved',
  'Science & discovery',
  'Courage & resilience',
  'Service & society',
  'Literature & arts',
];

const LifeStories = () => {
  const { slug } = useParams<{ slug?: string }>();
  const [stories, setStories] = useState<LifeStory[]>([]);
  const [storiesLoading, setStoriesLoading] = useState(true);
  const [storiesError, setStoriesError] = useState(false);
  const [storyScope, setStoryScope] = useState<'legends' | 'community'>('legends');
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('All stories');
  const [isSuggestOpen, setIsSuggestOpen] = useState(false);
  const [isWriteOpen, setIsWriteOpen] = useState(false);
  const [savedSlugs, setSavedSlugs] = useState<string[]>([]);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  // Keep the editorial biography corpus out of the route's JavaScript bundle.
  useEffect(() => {
    const controller = new AbortController();
    fetch('/data/life-stories.json', { signal: controller.signal })
      .then((response) => {
        if (!response.ok) throw new Error('Unable to load life stories');
        return response.json() as Promise<LifeStory[]>;
      })
      .then((data) => {
        if (!Array.isArray(data)) throw new Error('Invalid life story data');
        setStories(data);
      })
      .catch((error: unknown) => {
        if (error instanceof Error && error.name !== 'AbortError') setStoriesError(true);
      })
      .finally(() => {
        if (!controller.signal.aborted) setStoriesLoading(false);
      });
    return () => controller.abort();
  }, []);

  // Fetch community life stories & memoirs
  const { data: communityStories = [], refetch: refetchCommunityStories } = useStories({
    genre: 'Biography & Memoir',
  });

  // Restore saved bookmarks from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem('sahadhyayi_saved_life_stories');
      if (stored) {
        setSavedSlugs(JSON.parse(stored));
      }
    } catch {
      // Ignore storage error
    }
  }, []);

  // Cleanup speech on story change or unmount
  useEffect(() => {
    return () => {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, [slug]);

  const toggleBookmark = (storySlug: string, e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    setSavedSlugs((prev) => {
      const exists = prev.includes(storySlug);
      const next = exists ? prev.filter((s) => s !== storySlug) : [...prev, storySlug];
      try {
        localStorage.setItem('sahadhyayi_saved_life_stories', JSON.stringify(next));
      } catch {
        // Ignore storage error
      }
      if (exists) {
        toast.info('Removed from saved stories.');
      } else {
        toast.success('Story saved to your collection!');
      }
      return next;
    });
  };

  const handleToggleVoice = (storyItem: LifeStory) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      toast.error('Voice narration is not supported on this browser.');
      return;
    }

    if (isSpeaking && !isPaused) {
      window.speechSynthesis.pause();
      setIsPaused(true);
      return;
    }

    if (isSpeaking && isPaused) {
      window.speechSynthesis.resume();
      setIsPaused(false);
      return;
    }

    window.speechSynthesis.cancel();
    const narrationText = `${storyItem.name}. ${storyItem.role}. ${storyItem.summary}. ${storyItem.story.join(' ')}. Lesson to carry forward: ${storyItem.lesson}`;
    const utterance = new SpeechSynthesisUtterance(narrationText);
    utterance.rate = 0.95;

    utterance.onend = () => {
      setIsSpeaking(false);
      setIsPaused(false);
    };
    utterance.onerror = () => {
      setIsSpeaking(false);
      setIsPaused(false);
    };

    window.speechSynthesis.speak(utterance);
    setIsSpeaking(true);
    setIsPaused(false);
  };

  const handleShareStory = (storyItem: LifeStory) => {
    const url = `${window.location.origin}/life-stories/${storyItem.slug}`;
    if (navigator.share) {
      navigator.share({ title: `${storyItem.name} — Life Story`, url }).catch(() => {});
    } else {
      void navigator.clipboard.writeText(url).then(() => {
        toast.success('Story link copied to clipboard!');
      }).catch(() => {});
    }
  };

  const selectedStory = slug ? stories.find((story) => story.slug === slug) : undefined;
  const currentIndex = slug ? stories.findIndex((s) => s.slug === slug) : -1;
  const prevStory = currentIndex > 0 ? stories[currentIndex - 1] : undefined;
  const nextStory = currentIndex >= 0 && currentIndex < stories.length - 1 ? stories[currentIndex + 1] : undefined;

  const filteredStories = useMemo(() => {
    const term = search.trim().toLocaleLowerCase();
    return stories.filter((story) => {
      const matchesCategory =
        activeCategory === 'All stories' ||
        (activeCategory === 'Saved'
          ? savedSlugs.includes(story.slug)
          : story.category === activeCategory);
      const matchesSearch =
        !term ||
        [story.name, story.role, story.category, story.location, story.summary].some((value) =>
          value.toLocaleLowerCase().includes(term)
        );
      return matchesCategory && matchesSearch;
    });
  }, [stories, search, activeCategory, savedSlugs]);

  const filteredCommunityStories = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return communityStories;
    return communityStories.filter((s) =>
      [s.title, s.author_name, s.description].some((v) =>
        v?.toLowerCase().includes(term)
      )
    );
  }, [communityStories, search]);

  if (storiesLoading) {
    return (
      <main className="min-h-[70vh] flex items-center justify-center bg-[#FAF7F2] px-4 dark:bg-[#0B0D0C]" aria-live="polite">
        <p className="text-sm text-[#687067] dark:text-[#A5ADA6]">Loading life stories…</p>
      </main>
    );
  }

  if (storiesError) {
    return (
      <main className="min-h-[70vh] flex items-center justify-center bg-[#FAF7F2] px-4 text-center dark:bg-[#0B0D0C]">
        <div>
          <h1 className="font-serif text-2xl font-bold text-[#202820] dark:text-[#F3F0E7]">Unable to load life stories</h1>
          <p className="mt-3 text-sm text-[#687067] dark:text-[#A5ADA6]">Please refresh the page and try again.</p>
        </div>
      </main>
    );
  }

  if (slug) {
    if (!selectedStory) {
      return (
        <main className="min-h-[70vh] bg-[#FAF7F2] px-4 py-20 text-center dark:bg-[#0B0D0C]">
          <h1 className="font-serif text-3xl font-bold text-[#202820] dark:text-[#F3F0E7]">
            Story not found
          </h1>
          <p className="mt-3 text-sm text-[#687067] dark:text-[#A5ADA6]">
            This life story may have moved or is not available yet.
          </p>
          <Link
            to="/life-stories"
            className="mt-6 inline-flex items-center gap-2 font-semibold text-[#1C442D] dark:text-[#D5B16D]"
          >
            <ArrowLeft className="h-4 w-4" /> Back to Life Stories
          </Link>
        </main>
      );
    }

    const isSaved = savedSlugs.includes(selectedStory.slug);

    return (
      <>
        <SEO
          title={`${selectedStory.name} — Life Story | Sahadhyayi`}
          description={selectedStory.summary}
          canonical={`https://sahadhyayi.com/life-stories/${selectedStory.slug}`}
          keywords={[
            selectedStory.name,
            selectedStory.role,
            'biography',
            'Indian history',
            'real life journeys',
            'inspiration',
          ]}
        />
        <article className="min-h-screen bg-[#FAF7F2] text-[#202820] dark:bg-[#0B0D0C] dark:text-[#F3F0E7]">
          <header className={`relative isolate overflow-hidden bg-gradient-to-br ${selectedStory.accent} text-white`}>
            <div className="absolute inset-0 opacity-15 [background-image:radial-gradient(rgba(255,255,255,0.8)_0.8px,transparent_0.8px)] [background-size:18px_18px]" />
            <div className="relative mx-auto max-w-4xl px-4 py-16 sm:px-6 sm:py-24">
              <div className="flex items-center justify-between">
                <Link
                  to="/life-stories"
                  className="inline-flex items-center gap-2 text-sm text-white/80 transition hover:text-white"
                >
                  <ArrowLeft className="h-4 w-4" /> All life stories
                </Link>

                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleToggleVoice(selectedStory)}
                    className="rounded-full bg-white/10 text-white border-white/20 hover:bg-white/20 text-xs gap-1.5 backdrop-blur-sm"
                  >
                    {isSpeaking ? (
                      isPaused ? (
                        <>
                          <Play className="h-3.5 w-3.5 fill-current" />
                          <span>Resume Voice</span>
                        </>
                      ) : (
                        <>
                          <Pause className="h-3.5 w-3.5 fill-current" />
                          <span>Pause Voice</span>
                        </>
                      )
                    ) : (
                      <>
                        <Volume2 className="h-3.5 w-3.5" />
                        <span>Listen to Story</span>
                      </>
                    )}
                  </Button>

                  <button
                    type="button"
                    onClick={() => toggleBookmark(selectedStory.slug)}
                    className={`rounded-full p-2 border transition ${
                      isSaved
                        ? 'border-amber-400 bg-amber-400 text-stone-950'
                        : 'border-white/20 bg-white/10 text-white hover:bg-white/20'
                    }`}
                    title={isSaved ? 'Saved to favorites' : 'Save to favorites'}
                    aria-label="Save story"
                  >
                    <Bookmark className={`h-4 w-4 ${isSaved ? 'fill-current' : ''}`} />
                  </button>

                  <button
                    type="button"
                    onClick={() => handleShareStory(selectedStory)}
                    className="rounded-full p-2 border border-white/20 bg-white/10 text-white hover:bg-white/20 transition"
                    title="Share story"
                    aria-label="Share story"
                  >
                    <Share2 className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <div className="mt-8 flex flex-wrap items-center gap-2">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/70">
                  {selectedStory.category} · {selectedStory.years}
                </p>
                <span className="text-white/40">·</span>
                <span className="text-xs text-white/70">{selectedStory.readingMinutes} min read</span>
              </div>

              <h1 className="mt-4 max-w-3xl font-serif text-4xl font-bold leading-tight sm:text-6xl">
                {selectedStory.name}
              </h1>
              <p className="mt-4 text-lg text-white/85 font-medium">{selectedStory.role}</p>
              <p className="mt-5 max-w-2xl text-base leading-8 text-white/80">{selectedStory.summary}</p>
              <p className="mt-6 text-sm text-white/65 flex items-center gap-1.5">
                <Compass className="h-4 w-4" /> {selectedStory.location}
              </p>
            </div>
          </header>

          <div className="mx-auto grid max-w-6xl gap-10 px-4 py-12 sm:px-6 lg:grid-cols-[minmax(0,1fr)_280px] lg:py-16">
            <div className="space-y-6">
              {selectedStory.story.map((paragraph, index) => (
                <p
                  key={index}
                  className="font-serif text-lg leading-9 text-[#414B43] dark:text-[#C8D0C8]"
                >
                  {paragraph}
                </p>
              ))}

              <section className="rounded-2xl border border-[#DCD5C9] bg-white p-6 dark:border-[#29332D] dark:bg-[#111614] shadow-xs">
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-[#98733A] dark:text-[#D5B16D]">
                  <Sparkles className="h-4 w-4" /> A thought to carry forward
                </div>
                <p className="mt-3 font-serif text-xl leading-8 text-[#202820] dark:text-[#F3F0E7]">
                  {selectedStory.lesson}
                </p>
              </section>

              <div className="rounded-xl border border-[#DCD5C9] bg-[#F3EFE7] p-5 dark:border-[#29332D] dark:bg-[#111614]">
                <div className="flex items-center gap-2 text-sm font-semibold">
                  <ShieldCheck className="h-4 w-4 text-[#1C7A4A] dark:text-[#8EC9A4]" /> Read the verified source
                </div>
                <p className="mt-2 text-sm leading-6 text-[#687067] dark:text-[#A5ADA6]">
                  This introduction is curated by the Sahadhyayi editorial team. Explore the full biographical archives and official documents:
                </p>
                <a
                  href={selectedStory.sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-3 inline-flex items-center gap-2 text-sm font-semibold text-[#1C442D] hover:underline dark:text-[#D5B16D]"
                >
                  {selectedStory.sourceLabel} <ExternalLink className="h-3.5 w-3.5" />
                </a>
              </div>

              {/* Prev / Next Story Navigation */}
              <div className="mt-12 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-[#E8E2D9] dark:border-[#29332D] pt-6">
                {prevStory ? (
                  <Link
                    to={`/life-stories/${prevStory.slug}`}
                    className="flex flex-col items-start gap-1 text-left group"
                  >
                    <span className="text-xs text-muted-foreground flex items-center gap-1 group-hover:text-primary transition">
                      <ArrowLeft className="h-3.5 w-3.5" /> Previous Story
                    </span>
                    <span className="font-serif font-bold text-sm sm:text-base group-hover:underline">
                      {prevStory.name}
                    </span>
                  </Link>
                ) : (
                  <div />
                )}

                {nextStory && (
                  <Link
                    to={`/life-stories/${nextStory.slug}`}
                    className="flex flex-col items-end gap-1 text-right group ml-auto"
                  >
                    <span className="text-xs text-muted-foreground flex items-center gap-1 group-hover:text-primary transition">
                      Next Story <ArrowRight className="h-3.5 w-3.5" />
                    </span>
                    <span className="font-serif font-bold text-sm sm:text-base group-hover:underline">
                      {nextStory.name}
                    </span>
                  </Link>
                )}
              </div>
            </div>

            <aside className="h-fit rounded-2xl border border-[#DCD5C9] bg-white p-5 dark:border-[#29332D] dark:bg-[#111614] space-y-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#98733A] dark:text-[#D5B16D]">
                  At a glance
                </p>
                <p className="mt-2 font-serif text-xl font-bold">{selectedStory.name}</p>
                <p className="mt-1 text-sm text-[#687067] dark:text-[#A5ADA6]">{selectedStory.years}</p>
              </div>

              <div className="h-px bg-[#E9E3D9] dark:bg-[#29332D]" />

              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-[#687067] dark:text-[#A5ADA6]">
                  Known for
                </p>
                <p className="mt-1 text-sm leading-6">{selectedStory.role}</p>
              </div>

              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-[#687067] dark:text-[#A5ADA6]">
                  From
                </p>
                <p className="mt-1 text-sm leading-6">{selectedStory.location}</p>
              </div>

              <div className="pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => toggleBookmark(selectedStory.slug)}
                  className="w-full rounded-xl gap-2 text-xs"
                >
                  <Bookmark className={`h-3.5 w-3.5 ${isSaved ? 'fill-current text-amber-500' : ''}`} />
                  {isSaved ? 'Saved in Collection' : 'Save Story'}
                </Button>
              </div>

              <Link
                to="/life-stories"
                className="inline-flex items-center gap-2 text-sm font-semibold text-[#1C442D] hover:underline dark:text-[#D5B16D] pt-2"
              >
                Discover more stories <ArrowRight className="h-4 w-4" />
              </Link>
            </aside>
          </div>
        </article>
      </>
    );
  }

  const breadcrumbItems = [
        { name: 'Home', url: 'https://sahadhyayi.com/' },
        { name: 'Life Stories', url: 'https://sahadhyayi.com/life-stories' }
      ];

      const collectionSchema = {
        "@context": "https://schema.org",
        "@type": "CollectionPage",
        "name": "Inspiring Life Stories & Biographies",
        "description": "Discover true stories of remarkable people from India and around the world: their lives, challenges, achievements, and the lessons they leave behind.",
        "url": "https://sahadhyayi.com/life-stories",
        "mainEntity": {
          "@type": "ItemList",
          "name": "Life Stories Collection",
          "description": "Curated biographies and life stories of remarkable individuals",
          "numberOfItems": stories.length
        },
        "breadcrumb": generateBreadcrumbSchema(breadcrumbItems)
      };

      return (
    <>
      <SEO
        title="Life Stories — Real People, Remarkable Journeys | Sahadhyayi"
        description="Discover true stories of remarkable people from India and around the world: their lives, challenges, achievements, and the lessons they leave behind."
        canonical="https://sahadhyayi.com/life-stories"
        keywords={[
          'real life stories',
          'inspiring biographies',
          'Indian personalities',
          'human stories',
          'life journeys',
          'Rabindranath Tagore',
          'Kalpana Chawla',
          'Ramanujan',
          'Dr Ambedkar',
        ]}
        schema={collectionSchema}
      />
      <div className="min-h-screen bg-[#FAF7F2] text-[#202820] dark:bg-[#0B0D0C] dark:text-[#F3F0E7]">
        <section className="relative isolate overflow-hidden border-b border-[#29332D] bg-[#101711] text-white">
          <img
            src="https://images.unsplash.com/photo-1497633762265-9d179a990aa6?auto=format&fit=crop&w=2400&q=85"
            alt=""
            aria-hidden="true"
            className="absolute right-0 top-0 z-0 h-full w-full object-cover object-[center_35%] sm:w-[65%] lg:w-[60%]"
            loading="eager"
          />
          {/* Mobile scrim for crisp text legibility */}
          <div
            aria-hidden="true"
            className="absolute inset-0 z-0 bg-gradient-to-b from-[#101711]/94 via-[#101711]/88 to-[#101711]/82 sm:hidden"
          />
          {/* Desktop gradient blend */}
          <div
            aria-hidden="true"
            className="hidden sm:block absolute inset-0 z-0 bg-gradient-to-r from-[#101711] via-[#101711]/88 to-[#101711]/20"
          />
          <div
            aria-hidden="true"
            className="hidden sm:block absolute inset-0 z-0 bg-gradient-to-t from-[#101711]/80 via-transparent to-transparent"
          />
          <div className="pointer-events-none absolute inset-0 z-0 bg-[radial-gradient(ellipse_at_80%_15%,rgba(213,177,109,0.22),transparent_42%),radial-gradient(ellipse_at_10%_90%,rgba(63,111,79,0.3),transparent_45%)]" />
          <div className="pointer-events-none absolute inset-0 z-0 opacity-[0.12] [background-image:radial-gradient(rgba(255,255,255,0.65)_0.7px,transparent_0.7px)] [background-size:18px_18px]" />

          <div className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
            <div className="max-w-3xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-[#D5B16D]/35 bg-white/5 px-3.5 py-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#E8CC91]">
                <Heart className="h-3.5 w-3.5" /> Real lives. Real journeys.
              </div>
              <h1 className="mt-6 font-serif text-4xl font-bold leading-[1.08] tracking-tight sm:text-6xl lg:text-7xl">
                Every life has a story.
                <span className="block text-[#E4C17B]">Some change how we see the world.</span>
              </h1>
              <p className="mt-6 max-w-2xl text-base leading-8 text-white/75 sm:text-lg">
                Meet people who questioned the impossible, stood through adversity, served their communities, and left the world a little different.
              </p>
              <div className="mt-8 flex flex-wrap gap-4 text-xs text-white/70">
                <span className="inline-flex items-center gap-2">
                  <BookOpen className="h-4 w-4 text-[#E4C17B]" /> 12 curated biographies
                </span>
                <span className="inline-flex items-center gap-2">
                  <Volume2 className="h-4 w-4 text-[#E4C17B]" /> Audio listen enabled
                </span>
                <span className="inline-flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-[#E4C17B]" /> Verified source archives
                </span>
              </div>
            </div>
          </div>
        </section>

        <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
          {/* ── Scope Switcher: Legends vs Community Memoirs ── */}
          <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-[#E5DED2] dark:border-[#29332D] pb-6">
            <div className="inline-flex p-1 rounded-2xl bg-[#EFECE6] dark:bg-[#161D19] border border-[#DCD5C9] dark:border-[#29332D]">
              <button
                type="button"
                onClick={() => setStoryScope('legends')}
                className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                  storyScope === 'legends'
                    ? 'bg-white dark:bg-[#1C442D] text-[#1C442D] dark:text-[#F3F0E7] shadow-sm'
                    : 'text-[#687067] dark:text-[#A5ADA6] hover:text-[#202820] dark:hover:text-[#F3F0E7]'
                }`}
              >
                <Sparkles className="w-4 h-4 text-amber-500" />
                Historical Icons & Legends ({stories.length})
              </button>
              <button
                type="button"
                onClick={() => setStoryScope('community')}
                className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                  storyScope === 'community'
                    ? 'bg-white dark:bg-[#1C442D] text-[#1C442D] dark:text-[#F3F0E7] shadow-sm'
                    : 'text-[#687067] dark:text-[#A5ADA6] hover:text-[#202820] dark:hover:text-[#F3F0E7]'
                }`}
              >
                <Users className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                Everyday People Memoirs ({communityStories.length})
              </button>
            </div>

            <div className="flex items-center gap-2">
              <Button
                onClick={() => setIsWriteOpen(true)}
                className="rounded-xl gap-2 font-semibold bg-[#1C442D] text-white hover:bg-[#143221] dark:bg-[#D5B16D] dark:text-[#101711] text-xs h-10 shadow-sm"
              >
                <Plus className="h-4 w-4" />
                Write Your Life Story
              </Button>
              <Button
                variant="outline"
                onClick={() => setIsSuggestOpen(true)}
                className="rounded-xl gap-2 font-semibold text-xs h-10 border-[#DCD5C9] dark:border-[#29332D]"
              >
                Nominate a Legend
              </Button>
            </div>
          </div>

          <section
            aria-label="Search and filter life stories"
            className="mb-9 rounded-2xl border border-[#E5DED2] bg-white p-4 shadow-sm dark:border-[#29332D] dark:bg-[#111614] sm:p-5"
          >
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="relative w-full lg:max-w-md">
                <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#788076]" />
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder={storyScope === 'legends' ? "Search historical legends, journeys, or themes…" : "Search everyday memoirs and life lessons…"}
                  aria-label="Search life stories"
                  className="h-12 w-full rounded-xl border border-[#DCD5C9] bg-[#FAF7F2] pl-11 pr-4 text-sm text-[#202820] outline-none transition focus:border-[#1C442D] focus:ring-2 focus:ring-[#1C442D]/15 dark:border-[#34443A] dark:bg-[#0B0D0C] dark:text-[#F3F0E7]"
                />
              </div>

              {storyScope === 'legends' && (
                <div
                  className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
                  aria-label="Story categories"
                >
                  {categories.map((category) => {
                    const isSavedTab = category === 'Saved';
                    const countLabel = isSavedTab && savedSlugs.length > 0 ? ` (${savedSlugs.length})` : '';
                    return (
                      <button
                        key={category}
                        type="button"
                        onClick={() => setActiveCategory(category)}
                        aria-pressed={activeCategory === category}
                        className={`shrink-0 rounded-full border px-3.5 py-2 text-xs font-semibold transition ${
                          activeCategory === category
                            ? 'border-[#1C442D] bg-[#1C442D] text-white dark:border-[#D5B16D] dark:bg-[#D5B16D] dark:text-[#101711]'
                            : 'border-[#DCD5C9] text-[#687067] hover:border-[#1C442D] dark:border-[#34443A] dark:text-[#A5ADA6]'
                        }`}
                      >
                        {category}
                        {countLabel}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </section>

          {storyScope === 'legends' ? (
            <>
              <div className="mb-5 flex items-end justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#98733A] dark:text-[#D5B16D]">
                    Historical Legends
                  </p>
                  <h2 className="mt-1 font-serif text-2xl font-bold sm:text-3xl">Pioneers, Thinkers & Trailblazers</h2>
                </div>
                <span className="text-xs text-[#788076] dark:text-[#A5ADA6]">
                  {filteredStories.length} {filteredStories.length === 1 ? 'story' : 'stories'}
                </span>
              </div>

              {filteredStories.length ? (
                <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                  {filteredStories.map((story) => {
                    const isSaved = savedSlugs.includes(story.slug);
                    return (
                      <article
                        key={story.slug}
                        className="group flex h-full flex-col overflow-hidden rounded-2xl border border-[#E5DED2] bg-white shadow-[0_6px_24px_rgba(28,32,29,0.035)] transition duration-300 hover:-translate-y-1 hover:border-[#B68A35]/50 hover:shadow-[0_18px_45px_rgba(28,32,29,0.09)] dark:border-[#29332D] dark:bg-[#111614] dark:shadow-none"
                      >
                        <div
                          className={`relative flex h-44 items-end overflow-hidden bg-gradient-to-br ${story.accent} p-5 text-white`}
                        >
                          <div className="absolute -right-8 -top-12 h-40 w-40 rounded-full border border-white/15" />
                          <div className="absolute -right-1 -top-5 h-28 w-28 rounded-full border border-white/15" />

                          <span className="relative rounded-xl border border-white/20 bg-black/20 px-3 py-2 text-2xl font-serif font-bold backdrop-blur-sm">
                            {story.initials}
                          </span>

                          <div className="relative ml-auto flex items-center gap-2">
                            <button
                              type="button"
                              onClick={(e) => toggleBookmark(story.slug, e)}
                              className={`rounded-full p-1.5 border transition ${
                                isSaved
                                  ? 'border-amber-400 bg-amber-400 text-stone-950'
                                  : 'border-white/20 bg-black/20 text-white hover:bg-black/40'
                              }`}
                              title={isSaved ? 'Saved' : 'Save story'}
                              aria-label="Save story"
                            >
                              <Bookmark className={`h-3.5 w-3.5 ${isSaved ? 'fill-current' : ''}`} />
                            </button>
                            <span className="rounded-full border border-white/25 bg-black/20 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide backdrop-blur-sm">
                              {story.years}
                            </span>
                          </div>
                        </div>

                        <div className="flex flex-1 flex-col p-5">
                          <div className="flex items-center justify-between">
                            <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-[#98733A] dark:text-[#D5B16D]">
                              {story.category}
                            </p>
                            <span className="text-[10px] text-muted-foreground">{story.readingMinutes} min read</span>
                          </div>

                          <h3 className="mt-2 font-serif text-xl font-bold">{story.name}</h3>
                          <p className="mt-1 text-xs text-[#788076] dark:text-[#A5ADA6]">{story.role}</p>
                          <p className="mt-4 flex-1 text-sm leading-6 text-[#59635B] dark:text-[#B8C1B9]">
                            {story.summary}
                          </p>

                          <div className="mt-5 flex items-center justify-between border-t border-[#EDE7DE] pt-4 dark:border-[#29332D]">
                            <span className="inline-flex items-center gap-1.5 text-[11px] text-[#788076] dark:text-[#A5ADA6]">
                              <Compass className="h-3.5 w-3.5" /> {story.location.split(',')[0]}
                            </span>
                            <Link
                              to={`/life-stories/${story.slug}`}
                              className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#1C442D] transition group-hover:gap-2.5 dark:text-[#D5B16D]"
                            >
                              Read story <ArrowRight className="h-4 w-4" />
                            </Link>
                          </div>
                        </div>
                      </article>
                    );
                  })}
                </div>
              ) : (
                <div className="rounded-2xl border border-dashed border-[#DCD5C9] px-5 py-16 text-center dark:border-[#34443A]">
                  <Search className="mx-auto h-8 w-8 text-[#98733A]" />
                  <h3 className="mt-4 font-serif text-xl font-bold">
                    {activeCategory === 'Saved' ? 'No saved stories yet' : 'No stories found'}
                  </h3>
                  <p className="mt-2 text-sm text-[#788076] dark:text-[#A5ADA6]">
                    {activeCategory === 'Saved'
                      ? 'Click the bookmark icon on any biography to save it for offline and quick reading.'
                      : 'Try another name or choose a different category.'}
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setSearch('');
                      setActiveCategory('All stories');
                    }}
                    className="mt-4 text-sm font-semibold text-[#1C442D] underline dark:text-[#D5B16D]"
                  >
                    Clear filters
                  </button>
                </div>
              )}
            </>
          ) : (
            /* ── COMMUNITY & EVERYDAY PEOPLE MEMOIRS ── */
            <>
              <div className="mb-5 flex items-end justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#98733A] dark:text-[#D5B16D]">
                    Community Voices
                  </p>
                  <h2 className="mt-1 font-serif text-2xl font-bold sm:text-3xl">Everyday Lives, Extraordinary Journeys</h2>
                </div>
                <Button
                  size="sm"
                  onClick={() => setIsWriteOpen(true)}
                  className="rounded-xl gap-1.5 text-xs font-semibold bg-[#1C442D] text-white hover:bg-[#143221] dark:bg-[#D5B16D] dark:text-[#101711]"
                >
                  <Plus className="h-3.5 w-3.5" /> Share Your Story
                </Button>
              </div>

              {filteredCommunityStories.length ? (
                <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                  {filteredCommunityStories.map((story) => {
                    const initials = (story.author_name || 'Member')
                      .split(' ')
                      .map((p) => p[0])
                      .join('')
                      .toUpperCase()
                      .slice(0, 2);
                    return (
                      <article
                        key={story.id}
                        className="group flex h-full flex-col overflow-hidden rounded-2xl border border-[#E5DED2] bg-white shadow-[0_6px_24px_rgba(28,32,29,0.035)] transition duration-300 hover:-translate-y-1 hover:border-[#1C442D]/40 hover:shadow-lg dark:border-[#29332D] dark:bg-[#111614]"
                      >
                        <div className="relative flex h-36 items-end overflow-hidden bg-gradient-to-br from-[#1C442D] via-[#2A5C3F] to-[#162B1F] p-5 text-white">
                          <span className="relative rounded-xl border border-white/20 bg-black/20 px-3 py-1.5 text-xl font-serif font-bold backdrop-blur-sm">
                            {initials}
                          </span>
                          <span className="relative ml-auto rounded-full border border-white/20 bg-black/20 px-2.5 py-0.5 text-[10px] font-semibold uppercase backdrop-blur-sm">
                            Community Memoir
                          </span>
                        </div>

                        <div className="flex flex-1 flex-col p-5">
                          <h3 className="font-serif text-lg font-bold leading-snug text-[#1C201D] dark:text-[#F3F0E7]">
                            {story.title}
                          </h3>
                          <p className="mt-1 text-xs font-medium text-[#98733A] dark:text-[#D5B16D]">
                            By {story.author_name || 'Community Member'}
                          </p>
                          <p className="mt-3 flex-1 text-sm leading-6 text-[#59635B] dark:text-[#B8C1B9] line-clamp-3">
                            {story.description || 'A personal memoir shared on Sahadhyayi.'}
                          </p>

                          <div className="mt-5 flex items-center justify-between border-t border-[#EDE7DE] pt-4 dark:border-[#29332D]">
                            <span className="text-[11px] text-[#788076] dark:text-[#A5ADA6]">
                              {story.reading_time_minutes || 3} min read
                            </span>
                            <Link
                              to={`/stories/${story.id}`}
                              className="inline-flex items-center gap-1.5 text-xs font-bold text-[#1C442D] hover:underline dark:text-[#D5B16D]"
                            >
                              Read memoir <ArrowRight className="h-3.5 w-3.5" />
                            </Link>
                          </div>
                        </div>
                      </article>
                    );
                  })}
                </div>
              ) : (
                <div className="rounded-2xl border border-dashed border-[#DCD5C9] p-10 text-center dark:border-[#34443A] space-y-3">
                  <Feather className="mx-auto h-10 w-10 text-[#98733A] opacity-80" />
                  <h3 className="font-serif text-xl font-bold">Be the First to Share Your Life Story</h3>
                  <p className="text-sm text-[#788076] dark:text-[#A5ADA6] max-w-md mx-auto">
                    Every journey holds wisdom worth passing on. Write about your defining moments, lessons learned, and the values that guide you.
                  </p>
                  <div className="pt-2">
                    <Button
                      onClick={() => setIsWriteOpen(true)}
                      className="rounded-xl font-semibold bg-[#1C442D] text-white hover:bg-[#143221] dark:bg-[#D5B16D] dark:text-[#101711]"
                    >
                      <Plus className="h-4 w-4 mr-1.5" /> Write Your Story Now
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}

          <section className="mt-12 rounded-2xl border border-[#DCD5C9] bg-[#F3EFE7] p-6 dark:border-[#29332D] dark:bg-[#111614] sm:p-8">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#1C442D] text-[#F3E5C4] dark:bg-[#D5B16D] dark:text-[#101711]">
                  <Sparkles className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="font-serif text-xl font-bold">A growing collection of human journeys</h2>
                  <p className="mt-1 max-w-2xl text-sm leading-6 text-[#687067] dark:text-[#A5ADA6]">
                    Know someone whose courage, discoveries, or public service deserve to be preserved? Share your nomination with our editorial team.
                  </p>
                </div>
              </div>
              <Button
                onClick={() => setIsSuggestOpen(true)}
                className="shrink-0 rounded-xl gap-2 font-semibold bg-[#1C442D] text-white hover:bg-[#143221] dark:bg-[#D5B16D] dark:text-[#101711]"
              >
                <Plus className="h-4 w-4" /> Suggest a Story
              </Button>
            </div>
          </section>
        </main>
      </div>

      {/* Suggest Life Story Dialog */}
      <SuggestLifeStoryDialog
        open={isSuggestOpen}
        onOpenChange={setIsSuggestOpen}
      />

      {/* Write Personal Life Story / Memoir Dialog */}
      <WriteLifeStoryDialog
        open={isWriteOpen}
        onOpenChange={setIsWriteOpen}
        onSuccess={() => {
          void refetchCommunityStories();
          setStoryScope('community');
        }}
      />
    </>
  );
};

export default LifeStories;
