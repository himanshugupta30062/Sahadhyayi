import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { useArticleBySlug } from '@/hooks/useArticles';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Clock, Heart, Eye, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import SEO from '@/components/SEO';
import BookFlipLoader from '@/components/ui/BookFlipLoader';
import MarkdownPreview from '@/components/articles/MarkdownPreview';
import { format } from 'date-fns';

const ArticleDetail = () => {
  const { slug } = useParams<{ slug: string }>();
  const { data: article, isLoading, error } = useArticleBySlug(slug);

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

  return (
    <>
      <SEO
        title={`${article.title} - Sahadhyayi`}
        description={article.subtitle || article.content.slice(0, 155)}
        canonical={`https://sahadhyayi.com/articles/${article.slug}`}
        url={`https://sahadhyayi.com/articles/${article.slug}`}
      />
      <div className="min-h-screen bg-background">
        <div className="max-w-3xl mx-auto px-4 py-8">
          {/* Back */}
          <Link to="/articles" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-brand-primary mb-8">
            <ArrowLeft className="w-4 h-4" /> Back to Articles
          </Link>

          {/* Cover */}
          {article.cover_image_url && (
            <img
              src={article.cover_image_url}
              alt=""
              className="w-full h-64 md:h-80 object-cover rounded-xl mb-8"
              loading="lazy"
            />
          )}

          {/* Title */}
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-3">
            {article.title}
          </h1>
          {article.subtitle && (
            <p className="text-xl text-muted-foreground mb-6">{article.subtitle}</p>
          )}

          {/* Author & meta */}
          <div className="flex items-center gap-4 mb-8 pb-6 border-b border-border">
            <Avatar className="w-10 h-10">
              <AvatarImage src={article.author_avatar} />
              <AvatarFallback>{article.author_name?.charAt(0) || 'A'}</AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <p className="font-semibold text-foreground">{article.author_name}</p>
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
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
                  <Heart className="w-3 h-3" /> {article.likes_count}
                </span>
                <span className="flex items-center gap-1">
                  <Eye className="w-3 h-3" /> {article.views_count}
                </span>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="prose prose-lg max-w-none text-foreground leading-relaxed whitespace-pre-wrap mb-8">
            {article.content}
          </div>

          {/* Tags */}
          {article.tags && article.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 pt-6 border-t border-border">
              {article.tags.map((tag) => (
                <Badge key={tag} variant="secondary">{tag}</Badge>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default ArticleDetail;
