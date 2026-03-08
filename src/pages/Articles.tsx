import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { usePublishedArticles } from '@/hooks/useArticles';
import { useAuth } from '@/contexts/authHelpers';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { PenLine, Search, Clock, Heart, Eye } from 'lucide-react';
import SEO from '@/components/SEO';
import BookFlipLoader from '@/components/ui/BookFlipLoader';
import { format } from 'date-fns';

const Articles = () => {
  const { data: articles, isLoading } = usePublishedArticles();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');

  const filtered = (articles || []).filter(
    (a) =>
      a.title.toLowerCase().includes(search.toLowerCase()) ||
      a.tags?.some((t) => t.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <>
      <SEO
        title="Articles - Sahadhyayi"
        description="Read and write articles on books, reading, and more. Share your thoughts with the Sahadhyayi community."
        canonical="https://sahadhyayi.com/articles"
        url="https://sahadhyayi.com/articles"
      />
      <div className="min-h-screen bg-background">
        {/* Hero */}
        <div className="bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50 border-b border-border">
          <div className="max-w-4xl mx-auto px-4 py-12 md:py-16 text-center">
            <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
              Articles
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8">
              Share your thoughts, book reviews, and stories with the community. Write freely, just like on Medium.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center items-center max-w-lg mx-auto">
              <div className="relative flex-1 w-full">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search articles..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Button
                onClick={() => user ? navigate('/articles/write') : navigate('/articles/write')}
                className="bg-brand-primary hover:bg-brand-primary/90 text-white gap-2 w-full sm:w-auto"
              >
                <PenLine className="w-4 h-4" />
                Write Article
              </Button>
            </div>
          </div>
        </div>

        {/* Articles List */}
        <div className="max-w-4xl mx-auto px-4 py-8">
          {user && (
            <div className="mb-6 flex justify-end">
              <Link to="/articles/my" className="text-sm text-brand-primary hover:underline font-medium">
                My Articles & Drafts →
              </Link>
            </div>
          )}

          {isLoading ? (
            <div className="flex justify-center py-16">
              <BookFlipLoader size="md" text="Loading articles..." />
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-16">
              <PenLine className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">No articles yet</h3>
              <p className="text-muted-foreground mb-4">Be the first to share your thoughts!</p>
              <Button onClick={() => navigate('/articles/write')} className="bg-brand-primary text-white">
                  Write Your First Article
              </Button>
            </div>
          ) : (
            <div className="space-y-8">
              {filtered.map((article) => (
                <Link
                  key={article.id}
                  to={`/articles/${article.slug}`}
                  className="block group"
                >
                  <article className="flex gap-6 p-4 rounded-xl hover:bg-accent/50 transition-colors">
                    <div className="flex-1 min-w-0">
                      {/* Author */}
                      <div className="flex items-center gap-2 mb-2">
                        <Avatar className="w-6 h-6">
                          <AvatarImage src={article.author_avatar} />
                          <AvatarFallback className="text-xs">
                            {article.author_name?.charAt(0) || 'A'}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-sm font-medium text-foreground">{article.author_name}</span>
                        <span className="text-xs text-muted-foreground">
                          · {article.published_at ? format(new Date(article.published_at), 'MMM d, yyyy') : ''}
                        </span>
                      </div>

                      {/* Title & subtitle */}
                      <h2 className="text-xl font-bold text-foreground group-hover:text-brand-primary transition-colors line-clamp-2 mb-1">
                        {article.title}
                      </h2>
                      {article.subtitle && (
                        <p className="text-muted-foreground text-sm line-clamp-2 mb-3">
                          {article.subtitle}
                        </p>
                      )}

                      {/* Meta */}
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" /> {article.reading_time_minutes} min read
                        </span>
                        <span className="flex items-center gap-1">
                          <Heart className="w-3 h-3" /> {article.likes_count}
                        </span>
                        <span className="flex items-center gap-1">
                          <Eye className="w-3 h-3" /> {article.views_count}
                        </span>
                        {article.tags?.slice(0, 2).map((tag) => (
                          <Badge key={tag} variant="secondary" className="text-[10px] px-2 py-0">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    {/* Cover image */}
                    {article.cover_image_url && (
                      <div className="hidden sm:block w-32 h-24 rounded-lg overflow-hidden flex-shrink-0">
                        <img
                          src={article.cover_image_url}
                          alt=""
                          className="w-full h-full object-cover"
                          loading="lazy"
                        />
                      </div>
                    )}
                  </article>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default Articles;
