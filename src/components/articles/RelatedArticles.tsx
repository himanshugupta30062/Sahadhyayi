import React from 'react';
import { Link } from 'react-router-dom';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Clock } from 'lucide-react';
import { useRelatedArticles } from '@/hooks/useRelatedArticles';
import type { Article } from '@/hooks/useArticles';

interface Props {
  article: Pick<Article, 'id' | 'tags' | 'user_id'>;
  limit?: number;
}

const RelatedArticles: React.FC<Props> = ({ article, limit = 3 }) => {
  const { data: related = [], isLoading } = useRelatedArticles(article, limit);

  if (isLoading) {
    return (
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: limit }).map((_, i) => (
          <div key={i} className="rounded-xl border border-border p-4 animate-pulse">
            <div className="h-4 bg-muted rounded mb-3 w-3/4" />
            <div className="h-3 bg-muted rounded mb-2" />
            <div className="h-3 bg-muted rounded w-2/3" />
          </div>
        ))}
      </div>
    );
  }

  if (related.length === 0) return null;

  return (
    <section className="mt-16 pt-10 border-t border-border">
      <h2 className="text-2xl font-serif font-bold text-foreground mb-6">More to read</h2>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {related.map((a) => (
          <Link
            key={a.id}
            to={`/articles/${a.slug}`}
            className="group rounded-xl border border-border bg-card p-5 hover:shadow-md hover:border-[hsl(var(--brand-primary)/0.3)] transition-all"
          >
            {a.cover_image_url && (
              <div className="aspect-[16/9] -mx-5 -mt-5 mb-4 overflow-hidden rounded-t-xl">
                <img
                  src={a.cover_image_url}
                  alt=""
                  loading="lazy"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              </div>
            )}
            <h3 className="font-serif font-semibold text-foreground line-clamp-2 mb-2 group-hover:text-[hsl(var(--brand-primary))] transition-colors">
              {a.title}
            </h3>
            {a.subtitle && (
              <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{a.subtitle}</p>
            )}
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <div className="flex items-center gap-1.5 min-w-0">
                <Avatar className="w-5 h-5 shrink-0">
                  <AvatarImage src={a.author_avatar} />
                  <AvatarFallback className="text-[10px]">
                    {a.author_name?.charAt(0) || 'A'}
                  </AvatarFallback>
                </Avatar>
                <span className="truncate">{a.author_name}</span>
              </div>
              <span className="flex items-center gap-1 shrink-0">
                <Clock className="w-3 h-3" /> {a.reading_time_minutes}m
              </span>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
};

export default RelatedArticles;
