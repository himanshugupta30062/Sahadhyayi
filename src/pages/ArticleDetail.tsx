import React, { useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { useArticleBySlug } from '@/hooks/useArticles';
import { supabase } from '@/integrations/supabase/client';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Clock, Eye, Calendar, Pencil } from 'lucide-react';
import { useAuth } from '@/contexts/authHelpers';
import { Button } from '@/components/ui/button';
import SEO from '@/components/SEO';
import BookFlipLoader from '@/components/ui/BookFlipLoader';
import MarkdownPreview from '@/components/articles/MarkdownPreview';
import ArticleLikeButton from '@/components/articles/ArticleLikeButton';
import ArticleComments from '@/components/articles/ArticleComments';
import FollowAuthorButton from '@/components/articles/FollowAuthorButton';
import BookmarkButton from '@/components/articles/BookmarkButton';
import ShareButton from '@/components/articles/ShareButton';
import CopyArticleButton from '@/components/articles/CopyArticleButton';
import ReadingProgress from '@/components/articles/ReadingProgress';
import TableOfContents from '@/components/articles/TableOfContents';
import RelatedArticles from '@/components/articles/RelatedArticles';
import { format } from 'date-fns';

const ArticleDetail = () => {
  const { slug } = useParams<{ slug: string }>();
  const { data: article, isLoading, error } = useArticleBySlug(slug);
  const articleRef = useRef<HTMLElement>(null);
  const queryClient = useQueryClient();

  // Increment view count once per article load (deduped per session)
  useEffect(() => {
    if (!article?.id) return;
    const key = `article-viewed-${article.id}`;
    if (sessionStorage.getItem(key)) return;
    sessionStorage.setItem(key, '1');
    (supabase as any)
      .rpc('increment_article_views', { _article_id: article.id })
      .then(() => {
        queryClient.invalidateQueries({ queryKey: ['article', slug] });
        queryClient.invalidateQueries({ queryKey: ['articles'] });
      });
  }, [article?.id, slug, queryClient]);

  if (isLoading) {
    return (
      <div className="flex justify-center py-24">
        <BookFlipLoader size="md" text="Loading article..." />
      </div>
    );
  }

  if (error || !article) {
    return (
      <div className="text-center py-24">
        <h2 className="text-2xl font-bold text-foreground mb-2">Article not found</h2>
        <p className="text-muted-foreground mb-4">This article may have been removed or unpublished.</p>
        <Link to="/articles">
          <Button variant="outline">Back to Articles</Button>
        </Link>
      </div>
    );
  }

  const articleUrl = `/articles/${article.slug}`;

  return (
    <>
      <SEO
        title={`${article.title} - Sahadhyayi`}
        description={article.subtitle || article.content.slice(0, 155)}
        canonical={`https://sahadhyayi.com/articles/${article.slug}`}
        url={`https://sahadhyayi.com/articles/${article.slug}`}
      />

      {/* Reading progress bar across the top */}
      <ReadingProgress targetRef={articleRef} />

      <div className="min-h-screen bg-background">
        <div className="max-w-7xl mx-auto px-4 py-8">
          {/* Back */}
          <Link
            to="/articles"
            className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-[hsl(var(--brand-primary))] mb-6"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Articles
          </Link>

          <div className="lg:grid lg:grid-cols-[1fr_minmax(0,720px)_1fr] lg:gap-8">
            {/* Left rail (desktop) — empty for breathing room */}
            <div className="hidden lg:block" />

            {/* Article body */}
            <article ref={articleRef} className="min-w-0">
              {/* Cover */}
              {article.cover_image_url && (
                <img
                  src={article.cover_image_url}
                  alt=""
                  className="w-full h-64 md:h-96 object-cover rounded-2xl mb-8 shadow-sm"
                  loading="lazy"
                />
              )}

              {/* Tags above title (Substack-ish) */}
              {article.tags && article.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-4">
                  {article.tags.map((tag) => (
                    <Badge
                      key={tag}
                      variant="secondary"
                      className="text-xs uppercase tracking-wider font-medium"
                    >
                      {tag}
                    </Badge>
                  ))}
                </div>
              )}

              {/* Title */}
              <h1 className="font-serif text-4xl md:text-5xl font-bold text-foreground mb-4 leading-tight tracking-tight">
                {article.title}
              </h1>
              {article.subtitle && (
                <p className="font-serif text-xl md:text-2xl text-muted-foreground mb-8 leading-relaxed">
                  {article.subtitle}
                </p>
              )}

              {/* Author & meta */}
              <div className="flex items-center gap-4 mb-8 pb-6 border-b border-border">
                <Avatar className="w-12 h-12">
                  <AvatarImage src={article.author_avatar} />
                  <AvatarFallback>{article.author_name?.charAt(0) || 'A'}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 flex-wrap">
                    <p className="font-semibold text-foreground">{article.author_name}</p>
                    <FollowAuthorButton
                      authorUserId={article.user_id}
                      authorName={article.author_name}
                    />
                  </div>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1 flex-wrap">
                    {article.published_at && (
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {format(new Date(article.published_at), 'MMM d, yyyy')}
                      </span>
                    )}
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" /> {article.reading_time_minutes} min read
                    </span>
                    <span className="flex items-center gap-1">
                      <Eye className="w-3 h-3" /> {article.views_count} views
                    </span>
                  </div>
                </div>
              </div>

              {/* TOC — visible on mobile/tablet only (desktop uses sticky right rail) */}
              <div className="lg:hidden mb-8 p-4 bg-muted/30 rounded-xl">
                <TableOfContents content={article.content} />
              </div>

              {/* Content — rendered as markdown */}
              <MarkdownPreview content={article.content} className="mb-10" />

              {/* Action bar */}
              <div className="flex items-center justify-between flex-wrap gap-3 py-4 border-t border-b border-border mb-10">
                <div className="flex items-center gap-1">
                  <ArticleLikeButton articleId={article.id} />
                  <BookmarkButton articleId={article.id} variant="full" />
                  <ShareButton
                    url={articleUrl}
                    title={article.title}
                    subtitle={article.subtitle}
                    content={article.content}
                    variant="full"
                  />
                  <CopyArticleButton
                    title={article.title}
                    subtitle={article.subtitle}
                    content={article.content}
                    variant="full"
                  />
                </div>
                <span className="text-xs text-muted-foreground">
                  {article.reading_time_minutes} min read
                </span>
              </div>

              {/* Author footer card */}
              <div className="rounded-2xl bg-muted/30 p-6 mb-12 flex items-start gap-4">
                <Avatar className="w-14 h-14 shrink-0">
                  <AvatarImage src={article.author_avatar} />
                  <AvatarFallback>{article.author_name?.charAt(0) || 'A'}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1">
                    Written by
                  </p>
                  <p className="font-semibold text-foreground text-lg mb-3">
                    {article.author_name}
                  </p>
                  <FollowAuthorButton
                    authorUserId={article.user_id}
                    authorName={article.author_name}
                  />
                </div>
              </div>

              {/* Comments */}
              <ArticleComments articleId={article.id} />

              {/* Related articles */}
              <RelatedArticles
                article={{ id: article.id, tags: article.tags, user_id: article.user_id }}
              />
            </article>

            {/* Right rail (desktop) — sticky TOC + actions */}
            <aside className="hidden lg:block">
              <div className="sticky top-24 space-y-6">
                <TableOfContents content={article.content} />
                <div className="flex items-center gap-1 pt-4 border-t border-border">
                  <ArticleLikeButton articleId={article.id} variant="compact" />
                  <BookmarkButton articleId={article.id} />
                  <ShareButton
                    url={articleUrl}
                    title={article.title}
                    subtitle={article.subtitle}
                    content={article.content}
                  />
                  <CopyArticleButton
                    title={article.title}
                    subtitle={article.subtitle}
                    content={article.content}
                  />
                </div>
              </div>
            </aside>
          </div>
        </div>
      </div>
    </>
  );
};

export default ArticleDetail;
