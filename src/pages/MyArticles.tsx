import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useMyArticles, useDeleteArticle } from '@/hooks/useArticles';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { PenLine, Trash2, Edit, Eye, ArrowLeft } from 'lucide-react';
import SEO from '@/components/SEO';
import BookFlipLoader from '@/components/ui/BookFlipLoader';
import { format } from 'date-fns';

const MyArticles = () => {
  const { data: articles, isLoading } = useMyArticles();
  const deleteArticle = useDeleteArticle();
  const navigate = useNavigate();

  return (
    <>
      <SEO title="My Articles - Sahadhyayi" description="Manage your articles and drafts." />
      <div className="min-h-screen bg-background">
        <div className="max-w-3xl mx-auto px-4 py-8">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <Link to="/articles" className="text-muted-foreground hover:text-foreground">
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <h1 className="text-2xl font-bold text-foreground">My Articles</h1>
            </div>
            <Button onClick={() => navigate('/articles/write')} className="bg-brand-primary text-white gap-2">
              <PenLine className="w-4 h-4" /> Write New
            </Button>
          </div>

          {isLoading ? (
            <div className="flex justify-center py-16">
              <BookFlipLoader size="md" text="Loading..." />
            </div>
          ) : !articles || articles.length === 0 ? (
            <div className="text-center py-16">
              <PenLine className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No articles yet</h3>
              <p className="text-muted-foreground mb-4">Start writing your first article!</p>
              <Button onClick={() => navigate('/articles/write')} className="bg-brand-primary text-white">
                Write Article
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {articles.map((article) => (
                <div
                  key={article.id}
                  className="flex items-start justify-between p-4 border border-border rounded-xl hover:bg-accent/30 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant={article.is_published ? 'default' : 'secondary'} className="text-[10px]">
                        {article.is_published ? 'Published' : 'Draft'}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(article.updated_at), 'MMM d, yyyy')}
                      </span>
                    </div>
                    <h3 className="font-semibold text-foreground line-clamp-1">{article.title}</h3>
                    {article.subtitle && (
                      <p className="text-sm text-muted-foreground line-clamp-1">{article.subtitle}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-1 ml-4 shrink-0">
                    {article.is_published && article.slug && (
                      <Button variant="ghost" size="icon" asChild>
                        <Link to={`/articles/${article.slug}`}>
                          <Eye className="w-4 h-4" />
                        </Link>
                      </Button>
                    )}
                    <Button variant="ghost" size="icon" asChild>
                      <Link to={`/articles/edit/${article.id}`}>
                        <Edit className="w-4 h-4" />
                      </Link>
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() =>
                        deleteArticle.mutate(article.id)
                      }
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default MyArticles;
