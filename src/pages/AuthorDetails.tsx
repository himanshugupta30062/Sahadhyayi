import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuthorBySlug } from '@/hooks/useAuthorBySlug';
import { useAuthorBooks } from '@/hooks/useAuthorBooks';
import { useAuth } from '@/contexts/authHelpers';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  BookOpen, Download, MessageCircle, User, ExternalLink,
  MapPin, Star, Users, Calendar, ChevronDown, ChevronUp, ArrowLeft,
} from 'lucide-react';
import { FollowButton } from '@/components/authors/FollowButton';
import { VerificationBadge } from '@/components/authors/VerificationBadge';
import SEO from '@/components/SEO';
import BookFlipLoader from '@/components/ui/BookFlipLoader';
import { useToast } from '@/hooks/use-toast';

const AuthorDetails = () => {
  const { slug } = useParams<{ slug: string }>();
  const { user } = useAuth();
  const { toast } = useToast();
  const [bioExpanded, setBioExpanded] = useState(false);

  const { data: author, isLoading, error } = useAuthorBySlug(slug);
  const { data: books = [], isLoading: booksLoading } = useAuthorBooks(author?.id || '');

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <BookFlipLoader size="md" text="Loading author..." />
      </div>
    );
  }

  if (error || !author) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center max-w-md px-4">
          <User className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-foreground mb-2">Author Not Found</h1>
          <p className="text-muted-foreground mb-6">The author you're looking for doesn't exist.</p>
          <Link to="/authors">
            <Button className="bg-gradient-button text-white">Browse Authors</Button>
          </Link>
        </div>
      </div>
    );
  }

  const initials = author.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

  return (
    <>
      <SEO
        title={`${author.name} - Author Profile | Sahadhyayi`}
        description={author.bio || `Discover books by ${author.name} on Sahadhyayi.`}
      />

      <div className="min-h-screen bg-background">
        {/* Hero/Profile Header */}
        <div className="relative bg-gradient-to-br from-brand-primary/8 via-background to-brand-secondary/5">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_80%,hsl(var(--brand-primary)/0.06),transparent_50%)]" />
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-8 relative">
            <Link to="/authors" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-brand-primary mb-6 transition-colors">
              <ArrowLeft className="w-4 h-4" /> Back to Authors
            </Link>

            <div className="flex flex-col md:flex-row gap-6 items-start">
              {/* Avatar */}
              <Avatar className="w-28 h-28 ring-4 ring-background shadow-[var(--shadow-elevated)]">
                <AvatarImage src={author.profile_image_url || ''} alt={author.name} />
                <AvatarFallback className="text-3xl font-bold bg-gradient-button text-white">{initials}</AvatarFallback>
              </Avatar>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-3">
                  <div className="flex items-center gap-2">
                    <h1 className="text-3xl font-bold text-foreground">{author.name}</h1>
                    <VerificationBadge verified={author.verified || false} verificationType={author.verification_type} />
                  </div>
                  <div className="flex items-center gap-2">
                    <FollowButton authorId={author.id} size="sm" />
                    {author.website_url && (
                      <Button variant="outline" size="sm" asChild className="border-border">
                        <a href={author.website_url} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="w-4 h-4 mr-1" /> Website
                        </a>
                      </Button>
                    )}
                  </div>
                </div>

                {author.location && (
                  <p className="text-sm text-muted-foreground flex items-center gap-1 mb-3">
                    <MapPin className="w-4 h-4" /> {author.location}
                  </p>
                )}

                {/* Stats */}
                <div className="flex flex-wrap gap-5 mb-4">
                  <div className="flex items-center gap-1.5 text-sm">
                    <BookOpen className="w-4 h-4 text-brand-primary" />
                    <span className="font-semibold text-foreground">{author.books_count || books.length}</span>
                    <span className="text-muted-foreground">Books</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-sm">
                    <Users className="w-4 h-4 text-brand-primary" />
                    <span className="font-semibold text-foreground">{(author.followers_count || 0).toLocaleString()}</span>
                    <span className="text-muted-foreground">Followers</span>
                  </div>
                  {author.rating && (
                    <div className="flex items-center gap-1.5 text-sm">
                      <Star className="w-4 h-4 text-amber-500" />
                      <span className="font-semibold text-foreground">{author.rating}/5</span>
                    </div>
                  )}
                  {author.upcoming_events > 0 && (
                    <div className="flex items-center gap-1.5 text-sm">
                      <Calendar className="w-4 h-4 text-brand-primary" />
                      <span className="font-semibold text-foreground">{author.upcoming_events}</span>
                      <span className="text-muted-foreground">Events</span>
                    </div>
                  )}
                </div>

                {/* Genres */}
                {author.genres && author.genres.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-4">
                    {author.genres.map((genre, i) => (
                      <Badge key={i} variant="secondary" className="bg-brand-primary/10 text-brand-primary border-0">{genre}</Badge>
                    ))}
                  </div>
                )}

                {/* Bio */}
                {author.bio && (
                  <div>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {bioExpanded ? author.bio : `${author.bio.substring(0, 250)}${author.bio.length > 250 ? '...' : ''}`}
                    </p>
                    {author.bio.length > 250 && (
                      <button
                        onClick={() => setBioExpanded(!bioExpanded)}
                        className="text-brand-primary hover:underline text-sm font-medium mt-1 flex items-center gap-1"
                      >
                        {bioExpanded ? <>Show Less <ChevronUp className="w-3 h-3" /></> : <>Read More <ChevronDown className="w-3 h-3" /></>}
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Content Tabs */}
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Tabs defaultValue="books" className="w-full">
            <TabsList className="w-full max-w-md bg-muted/50 rounded-xl p-1 mb-8">
              <TabsTrigger value="books" className="flex-1 rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm">
                <BookOpen className="w-4 h-4 mr-1.5" /> Books
              </TabsTrigger>
              <TabsTrigger value="about" className="flex-1 rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm">
                <User className="w-4 h-4 mr-1.5" /> About
              </TabsTrigger>
            </TabsList>

            <TabsContent value="books">
              {booksLoading ? (
                <div className="flex justify-center py-12">
                  <BookFlipLoader size="sm" text="Loading books..." />
                </div>
              ) : books.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                  {books.map(book => (
                    <Card key={book.id} className="group border-border hover:shadow-[var(--shadow-card)] transition-all duration-300 overflow-hidden">
                      <div className="aspect-[3/4] bg-gradient-to-br from-brand-primary to-brand-secondary relative overflow-hidden">
                        {book.cover_image_url ? (
                          <img
                            src={book.cover_image_url}
                            alt={book.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            loading="lazy"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <BookOpen className="w-12 h-12 text-white/60" />
                          </div>
                        )}
                      </div>
                      <CardContent className="p-4">
                        <h3 className="font-semibold text-foreground line-clamp-2 mb-1">{book.title}</h3>
                        {book.genre && (
                          <Badge variant="outline" className="text-[10px] border-border text-muted-foreground mb-2">{book.genre}</Badge>
                        )}
                        {book.description && (
                          <p className="text-xs text-muted-foreground line-clamp-2 mb-3">{book.description}</p>
                        )}
                        {book.pdf_url ? (
                          <Button
                            size="sm"
                            className="w-full bg-gradient-button text-white"
                            onClick={() => window.open(book.pdf_url!, '_blank')}
                          >
                            <Download className="w-4 h-4 mr-1" /> Read / Download
                          </Button>
                        ) : (
                          <Button size="sm" variant="outline" className="w-full border-border" disabled>
                            Coming Soon
                          </Button>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-16">
                  <BookOpen className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
                  <p className="text-muted-foreground">No books available yet.</p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="about">
              <div className="max-w-2xl space-y-6">
                <Card className="border-border">
                  <CardHeader>
                    <CardTitle className="text-lg text-foreground">Biography</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground leading-relaxed">
                      {author.bio || 'Bio will be updated by the author.'}
                    </p>
                  </CardContent>
                </Card>

                {author.genres && author.genres.length > 0 && (
                  <Card className="border-border">
                    <CardHeader>
                      <CardTitle className="text-lg text-foreground">Genres</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-wrap gap-2">
                        {author.genres.map((g, i) => (
                          <Badge key={i} className="bg-brand-primary/10 text-brand-primary border-0">{g}</Badge>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                <Card className="border-border">
                  <CardHeader>
                    <CardTitle className="text-lg text-foreground">Stats</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                      <div className="text-center p-3 rounded-xl bg-muted/50">
                        <span className="text-2xl font-bold text-foreground block">{author.books_count || books.length}</span>
                        <span className="text-xs text-muted-foreground">Books</span>
                      </div>
                      <div className="text-center p-3 rounded-xl bg-muted/50">
                        <span className="text-2xl font-bold text-foreground block">{(author.followers_count || 0).toLocaleString()}</span>
                        <span className="text-xs text-muted-foreground">Followers</span>
                      </div>
                      <div className="text-center p-3 rounded-xl bg-muted/50">
                        <span className="text-2xl font-bold text-foreground block">{author.rating || '—'}</span>
                        <span className="text-xs text-muted-foreground">Rating</span>
                      </div>
                      <div className="text-center p-3 rounded-xl bg-muted/50">
                        <span className="text-2xl font-bold text-foreground block">{author.upcoming_events || 0}</span>
                        <span className="text-xs text-muted-foreground">Events</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </>
  );
};

export default AuthorDetails;
