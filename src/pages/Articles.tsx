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

  // Top tags by frequency
  const topTags = useMemo(() => {
    const counts = new Map<string, number>();
    (articles || []).forEach((a) =>
      (a.tags || []).forEach((t) => counts.set(t, (counts.get(t) || 0) + 1)),
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
      list = list.filter((a) => a.tags?.includes(activeTag));
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
        title="Articles - Sahadhyayi"
        description="Read and write articles on books, reading, and stories. Discover writing from the Sahadhyayi community."
        canonical="https://sahadhyayi.com/articles"
        url="https://sahadhyayi.com/articles"
      />
      <div className="min-h-screen bg-background">
        {/* Hero */}
        <div className="relative overflow-hidden bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50 border-b border-border">
          <div className="absolute inset-0 opacity-40 pointer-events-none [background-image:radial-gradient(circle_at_1px_1px,hsl(var(--brand-primary)/0.15)_1px,transparent_0)] [background-size:24px_24px]" />
          <div className="relative max-w-6xl mx-auto px-4 py-14 md:py-20">
            <div className="flex flex-col items-center text-center max-w-3xl mx-auto">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/70 backdrop-blur-sm border border-amber-200 text-xs font-semibold text-brand-primary mb-5">
                <Sparkles className="w-3.5 h-3.5" />
                Stories worth reading, by readers like you
              </div>
              <h1 className="font-serif text-4xl md:text-6xl font-bold text-foreground mb-4 leading-tight tracking-tight">
                Articles on Sahadhyayi
              </h1>
              <p className="text-base md:text-lg text-muted-foreground max-w-2xl mb-8 leading-relaxed">
                Reviews, essays, and stories from a community that loves books. Read, write, and share your ideas in a clean, distraction-free space.
              </p>

              {/* Search + CTA */}
              <div className="flex flex-col sm:flex-row gap-3 w-full max-w-2xl">
                <div className="relative flex-1">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Search articles, authors, or tags…"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-11 h-12 bg-white/80 backdrop-blur-sm border-amber-200 focus-visible:ring-brand-primary"
                  />
                  {search && (
                    <button
                      onClick={() => setSearch('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-muted text-muted-foreground"
                      aria-label="Clear search"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
                <Button
                  onClick={() => navigate(articleWritePath)}
                  className="h-12 px-6 bg-brand-primary hover:bg-brand-primary/90 text-white gap-2 shadow-md shadow-amber-200/50"
                >
                  <PenLine className="w-4 h-4" />
                  Start Writing
                </Button>
              </div>

              {user && (
                <Link
                  to="/articles/my"
                  className="mt-4 inline-flex items-center gap-1 text-sm text-brand-primary hover:underline font-medium"
                >
                  My articles & drafts <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              )}
            </div>
          </div>
        </div>

        {/* Tag filter bar */}
        {topTags.length > 0 && (
          <div className="border-b border-border bg-white/50 sticky top-16 z-20 backdrop-blur-md">
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
                All
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
                    ? 'bg-white text-foreground shadow-sm'
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
                    ? 'bg-white text-foreground shadow-sm'
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
                  className="group block mb-12 rounded-3xl overflow-hidden border border-border bg-card hover:shadow-xl hover:shadow-amber-100/50 hover:border-amber-200 transition-all"
                >
                  <div className="grid md:grid-cols-2 gap-0">
                    <div className="relative aspect-[16/10] md:aspect-auto md:min-h-[320px] bg-gradient-to-br from-amber-100 to-orange-100 overflow-hidden">
                      {featured.cover_image_url ? (
                        <img
                          src={featured.cover_image_url}
                          alt=""
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          loading="eager"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <BookOpen className="w-20 h-20 text-amber-300" />
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
                              {tag}
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
                          <AvatarFallback className="text-xs bg-amber-100 text-brand-primary">
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
                              <Clock className="w-3 h-3" /> {featured.reading_time_minutes} min
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
                    className="group block rounded-2xl border border-border bg-card overflow-hidden hover:shadow-lg hover:shadow-amber-100/40 hover:border-amber-200 hover:-translate-y-0.5 transition-all"
                  >
                    {/* Cover */}
                    <div className="relative aspect-[16/9] bg-gradient-to-br from-amber-100 to-orange-100 overflow-hidden">
                      {article.cover_image_url ? (
                        <img
                          src={article.cover_image_url}
                          alt=""
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          loading="lazy"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <BookOpen className="w-12 h-12 text-amber-300" />
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
                              {tag}
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
                            <AvatarFallback className="text-[10px] bg-amber-100 text-brand-primary">
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
                            <Clock className="w-3 h-3" /> {article.reading_time_minutes}m
                          </span>
                          <span className="flex items-center gap-0.5">
                            <Heart className="w-3 h-3" /> {article.likes_count}
                          </span>
                          <span className="flex items-center gap-0.5">
                            <Eye className="w-3 h-3" /> {article.views_count}
                          </span>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
};

export default Articles;
