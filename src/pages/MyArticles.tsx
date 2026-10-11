import React, { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useMyArticles, useDeleteArticle } from '@/hooks/useArticles';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PenLine, Trash2, Edit, Eye, ArrowLeft, Search, FileText, CheckCircle2 } from 'lucide-react';
import SEO from '@/components/SEO';
import BookFlipLoader from '@/components/ui/BookFlipLoader';
import { format } from 'date-fns';

type ArticleTab = 'all' | 'published' | 'drafts';

const MyArticles = () => {
  const { data: articles, isLoading } = useMyArticles();
  const deleteArticle = useDeleteArticle();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<ArticleTab>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const stats = useMemo(() => {
    if (!articles) return { all: 0, published: 0, drafts: 0 };
    return {
      all: articles.length,
      published: articles.filter(a => a.is_published).length,
      drafts: articles.filter(a => !a.is_published).length,
    };
  }, [articles]);

  const filteredArticles = useMemo(() => {
    if (!articles) return [];
    let list = articles;

    if (activeTab === 'published') {
      list = list.filter(a => a.is_published);
    } else if (activeTab === 'drafts') {
      list = list.filter(a => !a.is_published);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(a => 
        a.title.toLowerCase().includes(q) ||
        (a.subtitle && a.subtitle.toLowerCase().includes(q))
      );
    }

    return list;
  }, [articles, activeTab, searchQuery]);

  return (
    <>
      <SEO title="My Articles - Sahadhyayi" description="Manage your articles and drafts." />
      <div className="min-h-screen bg-background">
        <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-3">
              <Link to="/articles" className="text-muted-foreground hover:text-foreground">
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-foreground">My Articles</h1>
                <p className="text-xs text-muted-foreground">
                  {stats.all} total · {stats.published} published · {stats.drafts} drafts
                </p>
              </div>
            </div>
            <Button 
              onClick={() => navigate('/articles/write')} 
              className="bg-[hsl(var(--brand-primary))] hover:bg-[hsl(var(--brand-primary)/0.9)] text-white gap-2 shadow-xs"
            >
              <PenLine className="w-4 h-4" /> Write New Article
            </Button>
          </div>

          {/* Search & Tabs */}
          {articles && articles.length > 0 && (
            <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search articles..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 h-9 border-border bg-card text-sm"
                />
              </div>

              <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as ArticleTab)} className="w-full sm:w-auto">
                <TabsList className="grid grid-cols-3 w-full sm:w-auto h-9">
                  <TabsTrigger value="all" className="text-xs">All ({stats.all})</TabsTrigger>
                  <TabsTrigger value="published" className="text-xs">Published ({stats.published})</TabsTrigger>
                  <TabsTrigger value="drafts" className="text-xs">Drafts ({stats.drafts})</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          )}

          {/* Content States */}
          {isLoading ? (
            <div className="flex justify-center py-16">
              <BookFlipLoader size="md" text="Loading your articles..." />
            </div>
          ) : !articles || articles.length === 0 ? (
            <div className="text-center py-16 border border-dashed border-border rounded-2xl bg-card p-6">
              <PenLine className="w-12 h-12 text-muted-foreground/50 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-1">No articles yet</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Share your insights, book critiques, and literary thoughts with the Sahadhyayi community.
              </p>
              <Button 
                onClick={() => navigate('/articles/write')} 
                className="bg-[hsl(var(--brand-primary))] hover:bg-[hsl(var(--brand-primary)/0.9)] text-white"
              >
                Write Your First Article
              </Button>
            </div>
          ) : filteredArticles.length === 0 ? (
            <div className="text-center py-12 border border-border rounded-xl bg-muted/20">
              <Search className="w-10 h-10 text-muted-foreground/50 mx-auto mb-2" />
              <h3 className="text-sm font-semibold text-foreground">No matching articles</h3>
              <p className="text-xs text-muted-foreground mt-1">Try clearing your search query or switching tabs.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredArticles.map((article) => (
                <div
                  key={article.id}
                  className="flex items-start justify-between p-4 border border-border rounded-xl bg-card hover:bg-muted/40 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge 
                        variant={article.is_published ? 'default' : 'secondary'} 
                        className={`text-[10px] ${
                          article.is_published 
                            ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20' 
                            : 'bg-muted text-muted-foreground'
                        }`}
                      >
                        {article.is_published ? (
                          <span className="flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" /> Published
                          </span>
                        ) : (
                          <span className="flex items-center gap-1">
                            <FileText className="w-3 h-3" /> Draft
                          </span>
                        )}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(article.updated_at), 'MMM d, yyyy')}
                      </span>
                    </div>
                    <h3 className="font-semibold text-foreground line-clamp-1">{article.title}</h3>
                    {article.subtitle && (
                      <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">{article.subtitle}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-1 ml-4 shrink-0">
                    {article.is_published && article.slug && (
                      <Button variant="ghost" size="icon" asChild className="h-8 w-8 text-muted-foreground hover:text-foreground">
                        <Link to={`/articles/${article.slug}`} title="View Published Article">
                          <Eye className="w-4 h-4" />
                        </Link>
                      </Button>
                    )}
                    <Button variant="ghost" size="icon" asChild className="h-8 w-8 text-muted-foreground hover:text-foreground">
                      <Link to={`/articles/edit/${article.id}`} title="Edit Article">
                        <Edit className="w-4 h-4" />
                      </Link>
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => deleteArticle.mutate(article.id)}
                      className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                      title="Delete Article"
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
