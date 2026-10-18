import React, { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { usePublishedArticles } from '@/hooks/useArticles';
import { useAuth } from '@/contexts/authHelpers';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import {
  PenLine,
  Search,
  Clock,
  Heart,
  Eye,
  TrendingUp,
  Sparkles,
  BookOpen,
  ArrowRight,
  X,
} from 'lucide-react';
import SEO from '@/components/SEO';
import BookFlipLoader from '@/components/ui/BookFlipLoader';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

type SortMode = 'latest' | 'popular';

const Articles = () => {
  const { data: articles, isLoading } = usePublishedArticles();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [activeTag, setActiveTag] = useState<string | null>(null);
  const [sortMode, setSortMode] = useState<SortMode>('latest');

  const articleWritePath = user ? '/articles/write' : '/signin?redirect=%2Farticles%2Fwrite';

  // Normalize tags (strip leading # so we don't double-prefix when rendering)
  const cleanTag = (t: string) => t.replace(/^#+/, '').trim();

  // Top tags by frequency
  const topTags = useMemo(() => {
    const counts = new Map<string, number>();
    (articles || []).forEach((a) =>
      (a.tags || []).forEach((t) => {
        const c = cleanTag(t);
        if (c) counts.set(c, (counts.get(c) || 0) + 1);
      }),
    );
    return [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 10).map(([t]) => t);
  }, [articles]);

  const filtered = useMemo(() => {
    let list = articles || [];
    const q = search.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (a) =>
          a.title.toLowerCase().includes(q) ||
          a.subtitle?.toLowerCase().includes(q) ||
          a.author_name?.toLowerCase().includes(q) ||
          a.tags?.some((t) => t.toLowerCase().includes(q)),
      );
    }
    if (activeTag) {
      list = list.filter((a) => a.tags?.some((t) => cleanTag(t) === activeTag));
    }
    if (sortMode === 'popular') {
      list = [...list].sort(
        (a, b) =>
          (b.likes_count || 0) * 3 + (b.views_count || 0) -
          ((a.likes_count || 0) * 3 + (a.views_count || 0)),
      );
    }
    return list;
  }, [articles, search, activeTag, sortMode]);

  const featured = sortMode === 'latest' && !search && !activeTag ? filtered[0] : null;
  const rest = featured ? filtered.slice(1) : filtered;

  return (
    <>
      <SEO
        title="Essays, Stories & Book Reflections | Sahadhyayi"
        description="Explore thoughtful essays, book reflections, and stories from the Sahadhyayi reading community. Find an idea worth carrying into your next chapter."
        canonical="https://sahadhyayi.com/articles"
        url="https://sahadhyayi.com/articles"
      />
      <div className="min-h-screen bg-[#FAF7F2] text-[#1C201D] transition-colors duration-200 dark:bg-[#0B0D0C] dark:text-[#F3F0E7]">
        {/* Editorial article hero */}
        <section className="relative isolate overflow-hidden border-b border-[#DCD5C9] bg-[#FAF7F2] text-[#1C201D] transition-colors duration-300 dark:border-[#26352C] dark:bg-[#101711] dark:text-white">
          <div
            aria-hidden="true"
            className="absolute inset-0 bg-cover bg-center"
            style={{
              backgroundImage: "url('https://images.unsplash.com/photo-1455390582262-044cdead277a?auto=format&fit=crop&w=2400&q=85')",
              backgroundPosition: 'center 48%',
            }}
          />
          <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-r from-[#FAF7F2]/95 via-[#FAF7F2]/83 to-[#FAF7F2]/48 dark:from-[#09120D]/95 dark:via-[#09120D]/82 dark:to-[#09120D]/42" />
          <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-t from-[#FAF7F2]/70 via-transparent to-[#FAF7F2]/12 dark:from-[#09120D]/75 dark:via-transparent dark:to-[#09120D]/25" />
          <div aria-hidden="true" className="pointer-events-none absolute inset-0 opacity-[0.10] [background-image:linear-gradient(rgba(28,68,45,0.12)_1px,transparent_1px),linear-gradient(90deg,rgba(28,68,45,0.12)_1px,transparent_1px)] [background-size:56px_56px] [mask-image:linear-gradient(to_right,black,transparent_78%)] dark:opacity-[0.13] dark:[background-image:linear-gradient(rgba(255,255,255,0.14)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.14)_1px,transparent_1px)] />

          <div className="relative mx-auto max-w-7xl px-4 py-14 sm:px-6 sm:py-18 lg:px-8 lg:py-24">
            <div className="max-w-3xl">
              <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-[#C8DBCB] bg-white/75 px-3.5 py-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#1C442D] shadow-sm backdrop-blur-sm sm:mb-6 dark:border-[#D5B16D]/35 dark:bg-black/25 dark:text-[#E8CC91]">
                <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
                The Sahadhyayi Journal
              </div>
              <h1 className="max-w-3xl font-serif text-4xl font-bold leading-[1.08] tracking-tight text-[#1C201D] sm:text-5xl md:text-6xl lg:text-7xl dark:text-[#FBF7EF]">
                Ideas worth turning
                <span className="block text-[#8F681C] dark:text-[#E4C17B]">a page for.</span>
              </h1>
              <p className="mt-5 max-w-2xl text-base leading-7 text-[#4F5D53] sm:mt-6 sm:text-lg sm:leading-8 dark:text-white/80">
                Thoughtful essays, book reflections, and stories to spark your next idea — written by readers who have something to say.
              </p>

              <div className="mt-8 flex w-full max-w-2xl flex-col gap-3 sm:mt-9 sm:flex-row">
                <div className="relative min-w-0 flex-1">
                  <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#69756D]" aria-hidden="true" />
                  <Input
                    placeholder="Search ideas, authors, or topics…"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="h-12 rounded-xl border border-white/25 bg-white/95 pl-11 pr-11 text-[#1C201D] shadow-xl placeholder:text-[#798179] focus-visible:ring-2 focus-visible:ring-[#D5B16D] sm:h-14"
                    aria-label="Search articles, authors, or tags"
                  />
                  {search && (
                    <button
                      type="button"
                      onClick={() => setSearch('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1.5 text-[#69756D] transition hover:bg-black/5 hover:text-[#1C201D] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1C442D]"
                      aria-label="Clear article search"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>
                <Button
                  onClick={() => navigate(articleWritePath)}
                  className="h-12 shrink-0 rounded-xl bg-[#1C442D] px-5 font-semibold text-white shadow-lg transition hover:bg-[#143221] sm:h-14 sm:px-6 dark:bg-[#D5B16D] dark:text-[#171C17] dark:hover:bg-[#E4C17B] dark:sm:h-14 dark:sm:px-6"
                >
                  <PenLine className="mr-2 h-4 w-4" aria-hidden="true" />
                  Write a story
                </Button>
              </div>

              {user && (
                <Link
                  to="/articles/my"
                  className="mt-4 inline-flex items-center gap-1.5 rounded-md text-sm font-medium text-[#785715] transition hover:text-[#1C442D] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8F681C] focus-visible:ring-offset-4 focus-visible:ring-offset-[#FAF7F2] dark:text-[#E4C17B] dark:hover:text-white dark:focus-visible:ring-[#D5B16D] dark:focus-visible:ring-offset-[#101711]"
                >
                  My articles & drafts <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                </Link>
              )}
            </div>
          </div>
        </section>

        {/* Tag filter bar */}
        {topTags.length > 0 && (
          <div className="border-b border-border bg-background/80 sticky top-16 z-20 backdrop-blur-md">
            <div className="max-w-6xl mx-auto px-4 py-3 flex items-center gap-2 overflow-x-auto scrollbar-hide">
              <Button
                variant={!activeTag ? 'default' : 'outline'}
                size="sm"
                onClick={() => setActiveTag(null)}
                className={cn(
                  'shrink-0 rounded-full',
                  !activeTag && 'bg-brand-primary text-white hover:bg-brand-primary/90',
                )}
              >
                All Topics
              </Button>
              {topTags.map((tag) => (
                <Button
                  key={tag}
                  variant={activeTag === tag ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setActiveTag(activeTag === tag ? null : tag)}
                  className={cn(
                    'shrink-0 rounded-full capitalize',
                    activeTag === tag && 'bg-brand-primary text-white hover:bg-brand-primary/90',
                  )}
                >
                  #{tag}
                </Button>
              ))}
            </div>
          </div>
        )}

        {/* Articles List */}
        <div className="max-w-6xl mx-auto px-4 py-10">
          {/* Sort tabs */}
          <div className="flex items-center justify-between mb-8 flex-wrap gap-3">
            <div className="inline-flex items-center gap-1 p-1 bg-muted rounded-full">
              <button
                onClick={() => setSortMode('latest')}
                className={cn(
                  'px-4 py-1.5 rounded-full text-sm font-medium transition-all flex items-center gap-1.5',
                  sortMode === 'latest'
                    ? 'bg-card text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground',
                )}
              >
                <Sparkles className="w-3.5 h-3.5" /> Latest
              </button>
              <button
                onClick={() => setSortMode('popular')}
                className={cn(
                  'px-4 py-1.5 rounded-full text-sm font-medium transition-all flex items-center gap-1.5',
                  sortMode === 'popular'
                    ? 'bg-card text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground',
                )}
              >
                <TrendingUp className="w-3.5 h-3.5" /> Popular
              </button>
            </div>
            <p className="text-sm text-muted-foreground">
              {filtered.length} {filtered.length === 1 ? 'article' : 'articles'}
              {activeTag && ` in #${activeTag}`}
            </p>
          </div>

          {isLoading ? (
            <div className="flex justify-center py-20">
              <BookFlipLoader size="md" text="Loading articles..." />
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-20 max-w-md mx-auto">
              <div className="w-16 h-16 mx-auto rounded-2xl bg-amber-100 flex items-center justify-center mb-4">
                <BookOpen className="w-8 h-8 text-brand-primary" />
              </div>
              <h3 className="text-xl font-bold text-foreground mb-2">
                {search || activeTag ? 'No matching articles' : 'No articles yet'}
              </h3>
              <p className="text-muted-foreground mb-6">
                {search || activeTag
                  ? 'Try a different search term or clear the filters.'
                  : 'Be the first to share your thoughts with the community!'}
              </p>
              {search || activeTag ? (
                <Button
                  variant="outline"
                  onClick={() => {
                    setSearch('');
                    setActiveTag(null);
                  }}
                >
                  Clear filters
                </Button>
              ) : (
                <Button
                  onClick={() => navigate(articleWritePath)}
                  className="bg-brand-primary hover:bg-brand-primary/90 text-white gap-2"
                >
                  <PenLine className="w-4 h-4" /> Write Your First Article
                </Button>
              )}
            </div>
          ) : (
            <>
              {/* Featured */}
              {featured && (
                <Link
                  to={`/articles/${featured.slug}`}
                  className="group block mb-12 rounded-3xl overflow-hidden border border-border bg-card hover:shadow-xl hover:border-brand-primary/40 transition-all"
                >
                  <div className="grid md:grid-cols-2 gap-0">
                    <div className="relative aspect-[16/10] md:aspect-auto md:min-h-[320px] bg-gradient-to-br from-brand-primary/10 via-muted to-brand-secondary/10 overflow-hidden">
                      {featured.cover_image_url ? (
                        <img
                          src={featured.cover_image_url}
                          alt=""
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          loading="eager"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <BookOpen className="w-20 h-20 text-brand-primary/40" />
                        </div>
                      )}
                      <div className="absolute top-4 left-4">
                        <Badge className="bg-brand-primary text-white border-0 gap-1 px-3 py-1 shadow-lg">
                          <Sparkles className="w-3 h-3" /> Featured
                        </Badge>
                      </div>
                    </div>
                    <div className="p-6 md:p-10 flex flex-col justify-center">
                      {featured.tags && featured.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mb-4">
                          {featured.tags.slice(0, 3).map((tag) => (
                            <Badge
                              key={tag}
                              variant="secondary"
                              className="text-[10px] uppercase tracking-wider font-semibold"
                            >
                              #{cleanTag(tag)}
                            </Badge>
                          ))}
                        </div>
                      )}
                      <h2 className="font-serif text-2xl md:text-3xl font-bold text-foreground group-hover:text-brand-primary transition-colors leading-tight mb-3 line-clamp-3">
                        {featured.title}
                      </h2>
                      {featured.subtitle && (
                        <p className="text-muted-foreground line-clamp-3 mb-5 leading-relaxed">
                          {featured.subtitle}
                        </p>
                      )}
                      <div className="flex items-center gap-3 mt-auto">
                        <Avatar className="w-9 h-9">
                          <AvatarImage src={featured.author_avatar} />
                          <AvatarFallback className="text-xs bg-brand-primary/10 text-brand-primary">
                            {featured.author_name?.charAt(0) || 'A'}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-foreground truncate">
                            {featured.author_name}
                          </p>
                          <div className="flex items-center gap-3 text-xs text-muted-foreground">
                            {featured.published_at && (
                              <span>{format(new Date(featured.published_at), 'MMM d, yyyy')}</span>
                            )}
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" /> {featured.reading_time_minutes || 5} min
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>
              )}

              {/* Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {rest.map((article) => (
                  <Link
                    key={article.id}
                    to={`/articles/${article.slug}`}
                    className="group block rounded-2xl border border-border bg-card overflow-hidden hover:shadow-lg hover:border-brand-primary/40 hover:-translate-y-0.5 transition-all"
                  >
                    {/* Cover */}
                    <div className="relative aspect-[16/9] bg-gradient-to-br from-brand-primary/10 via-muted to-brand-secondary/10 overflow-hidden">
                      {article.cover_image_url ? (
                        <img
                          src={article.cover_image_url}
                          alt=""
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          loading="lazy"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <BookOpen className="w-12 h-12 text-brand-primary/40" />
                        </div>
                      )}
                    </div>

                    <div className="p-5">
                      {/* Tags */}
                      {article.tags && article.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mb-3">
                          {article.tags.slice(0, 2).map((tag) => (
                            <Badge
                              key={tag}
                              variant="secondary"
                              className="text-[10px] uppercase tracking-wider font-semibold"
                            >
                              #{cleanTag(tag)}
                            </Badge>
                          ))}
                        </div>
                      )}

                      {/* Title */}
                      <h2 className="font-serif text-xl font-bold text-foreground group-hover:text-brand-primary transition-colors line-clamp-2 mb-2 leading-snug">
                        {article.title}
                      </h2>
                      {article.subtitle && (
                        <p className="text-sm text-muted-foreground line-clamp-2 mb-4 leading-relaxed">
                          {article.subtitle}
                        </p>
                      )}

                      {/* Author + meta */}
                      <div className="flex items-center justify-between gap-3 pt-3 border-t border-border/60">
                        <div className="flex items-center gap-2 min-w-0">
                          <Avatar className="w-7 h-7 shrink-0">
                            <AvatarImage src={article.author_avatar} />
                            <AvatarFallback className="text-[10px] bg-brand-primary/10 text-brand-primary">
                              {article.author_name?.charAt(0) || 'A'}
                            </AvatarFallback>
                          </Avatar>
                          <div className="min-w-0">
                            <p className="text-xs font-semibold text-foreground truncate">
                              {article.author_name}
                            </p>
                            <p className="text-[10px] text-muted-foreground">
                              {article.published_at
                                ? format(new Date(article.published_at), 'MMM d')
                                : ''}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground shrink-0">
                          <span className="flex items-center gap-0.5">
                            <Clock className="w-3 h-3" /> {article.reading_time_minutes || 5}m
                          </span>
                          <span className="flex items-center gap-0.5">
                            <Heart className="w-3 h-3" /> {article.likes_count || 0}
                          </span>
                          <span className="flex items-center gap-0.5">
                            <Eye className="w-3 h-3" /> {article.views_count || 0}
                          </span>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>

              {/* Library Spotlight Bridge */}
              <div className="mt-16 p-8 rounded-3xl bg-gradient-to-r from-brand-primary/10 via-card to-brand-secondary/10 border border-border flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="space-y-2 text-center md:text-left">
                  <div className="inline-flex items-center gap-2 text-xs font-semibold text-brand-primary">
                    <BookOpen className="w-4 h-4" /> Digital Library
                  </div>
                  <h3 className="text-2xl font-bold text-foreground">Inspired by these articles?</h3>
                  <p className="text-sm text-muted-foreground max-w-xl">
                    Discover and read thousands of classics, non-fiction, and literature titles in Sahadhyayi's distraction-free online reader.
                  </p>
                </div>
                <Link to="/library">
                  <Button className="bg-brand-primary text-white hover:bg-brand-primary/90 gap-2 shrink-0 px-6 h-11">
                    Explore 12,500+ Books <ArrowRight className="w-4 h-4" />
                  </Button>
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
};

export default Articles;
