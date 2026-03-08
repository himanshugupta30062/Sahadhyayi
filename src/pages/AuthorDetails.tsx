import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuthorBySlug } from '@/hooks/useAuthorBySlug';
import { useAuthorBooks } from '@/hooks/useAuthorBooks';
import { useAuth } from '@/contexts/authHelpers';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import {
  BookOpen, Download, User, ExternalLink,
  MapPin, Star, Users, Calendar, ChevronDown, ChevronUp, ArrowLeft,
} from 'lucide-react';
import { FollowButton } from '@/components/authors/FollowButton';
import { VerificationBadge } from '@/components/authors/VerificationBadge';
import SEO from '@/components/SEO';
import BookFlipLoader from '@/components/ui/BookFlipLoader';

const AuthorDetails = () => {
  const { slug } = useParams<{ slug: string }>();
  const { user } = useAuth();
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
  const bioTruncated = author.bio && author.bio.length > 300;

  return (
    <>
      <SEO
        title={`${author.name} - Author Profile | Sahadhyayi`}
        description={author.bio || `Discover books by ${author.name} on Sahadhyayi.`}
      />

      <div className="min-h-screen bg-background">
        {/* Profile Header */}
        <div className="relative bg-gradient-to-br from-brand-primary/8 via-background to-brand-secondary/5">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_80%,hsl(var(--brand-primary)/0.06),transparent_50%)]" />
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-8 relative">
            <Link to="/authors" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-brand-primary mb-6 transition-colors">
              <ArrowLeft className="w-4 h-4" /> Back to Authors
            </Link>

            <div className="flex flex-col sm:flex-row gap-6 items-start">
              {/* Avatar */}
              <Avatar className="w-28 h-28 sm:w-32 sm:h-32 ring-4 ring-background shadow-[var(--shadow-elevated)] flex-shrink-0">
                <AvatarImage src={author.profile_image_url || ''} alt={author.name} className="object-cover" />
                <AvatarFallback className="text-3xl font-bold bg-gradient-button text-white">{initials}</AvatarFallback>
              </Avatar>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h1 className="text-2xl sm:text-3xl font-bold text-foreground">{author.name}</h1>
                    <VerificationBadge verified={author.verified || false} verificationType={author.verification_type} />
                  </div>
                </div>

                {author.location && (
                  <p className="text-sm text-muted-foreground flex items-center gap-1 mb-3">
                    <MapPin className="w-4 h-4" /> {author.location}
                  </p>
                )}

                {/* Quick stats */}
                <div className="flex flex-wrap gap-4 mb-4">
                  <StatPill icon={<BookOpen className="w-4 h-4 text-brand-primary" />} value={author.books_count || books.length} label="Books" />
                  <StatPill icon={<Users className="w-4 h-4 text-brand-primary" />} value={(author.followers_count || 0).toLocaleString()} label="Followers" />
                  {author.rating && <StatPill icon={<Star className="w-4 h-4 text-amber-500" />} value={`${author.rating}/5`} label="Rating" />}
                  {author.upcoming_events > 0 && <StatPill icon={<Calendar className="w-4 h-4 text-brand-primary" />} value={author.upcoming_events} label="Events" />}
                </div>

                {/* Genres */}
                {author.genres && author.genres.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-4">
                    {author.genres.map((genre, i) => (
                      <Badge key={i} variant="secondary" className="bg-brand-primary/10 text-brand-primary border-0">{genre}</Badge>
                    ))}
                  </div>
                )}

                {/* Actions */}
                <div className="flex items-center gap-2 flex-wrap">
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
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-10">
          {/* Bio Section */}
          {author.bio && (
            <section>
              <h2 className="text-lg font-semibold text-foreground mb-3">About</h2>
              <Card className="border-border">
                <CardContent className="p-5">
                  <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
                    {bioExpanded || !bioTruncated ? author.bio : `${author.bio.substring(0, 300)}...`}
                  </p>
                  {bioTruncated && (
                    <button
                      onClick={() => setBioExpanded(!bioExpanded)}
                      className="text-brand-primary hover:underline text-sm font-medium mt-2 flex items-center gap-1"
                    >
                      {bioExpanded ? <>Show Less <ChevronUp className="w-3 h-3" /></> : <>Read More <ChevronDown className="w-3 h-3" /></>}
                    </button>
                  )}
                </CardContent>
              </Card>
            </section>
          )}

          {/* Books Section */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-brand-primary" />
                Books by {author.name}
                <span className="text-sm font-normal text-muted-foreground">({books.length})</span>
              </h2>
            </div>

            {booksLoading ? (
              <div className="flex justify-center py-12">
                <BookFlipLoader size="sm" text="Loading books..." />
              </div>
            ) : books.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                {books.map(book => (
                  <BookCard key={book.id} book={book} />
                ))}
              </div>
            ) : (
              <Card className="border-border">
                <CardContent className="py-12 text-center">
                  <BookOpen className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
                  <p className="text-muted-foreground text-sm">No books available yet.</p>
                </CardContent>
              </Card>
            )}
          </section>

          {/* Stats Card */}
          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">Stats Overview</h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <StatsCard label="Books" value={author.books_count || books.length} />
              <StatsCard label="Followers" value={(author.followers_count || 0).toLocaleString()} />
              <StatsCard label="Rating" value={author.rating ? `${author.rating}/5` : '—'} />
              <StatsCard label="Events" value={author.upcoming_events || 0} />
            </div>
          </section>
        </div>
      </div>
    </>
  );
};

/* ─── Sub-components ─── */

const StatPill = ({ icon, value, label }: { icon: React.ReactNode; value: string | number; label: string }) => (
  <div className="flex items-center gap-1.5 text-sm">
    {icon}
    <span className="font-semibold text-foreground">{value}</span>
    <span className="text-muted-foreground">{label}</span>
  </div>
);

const StatsCard = ({ label, value }: { label: string; value: string | number }) => (
  <Card className="border-border">
    <CardContent className="p-4 text-center">
      <span className="text-2xl font-bold text-foreground block">{value}</span>
      <span className="text-xs text-muted-foreground">{label}</span>
    </CardContent>
  </Card>
);

const BookCard = ({ book }: { book: any }) => (
  <Card className="group border-border hover:shadow-[var(--shadow-card)] transition-all duration-300 overflow-hidden h-full flex flex-col">
    <div className="aspect-[3/4] bg-gradient-to-br from-brand-primary/10 to-brand-secondary/10 relative overflow-hidden">
      {book.cover_image_url ? (
        <img
          src={book.cover_image_url}
          alt={book.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          loading="lazy"
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center">
          <BookOpen className="w-10 h-10 text-muted-foreground/30" />
        </div>
      )}
    </div>
    <CardContent className="p-3 flex-1 flex flex-col">
      <h3 className="text-sm font-semibold text-foreground line-clamp-2 mb-1">{book.title}</h3>
      {book.genre && (
        <Badge variant="outline" className="text-[10px] border-border text-muted-foreground w-fit mb-2">{book.genre}</Badge>
      )}
      <div className="mt-auto pt-2">
        {book.pdf_url ? (
          <Button
            size="sm"
            className="w-full bg-gradient-button text-white text-xs h-8"
            onClick={() => window.open(book.pdf_url!, '_blank')}
          >
            <Download className="w-3 h-3 mr-1" /> Read / Download
          </Button>
        ) : (
          <Button size="sm" variant="outline" className="w-full border-border text-xs h-8" disabled>
            Coming Soon
          </Button>
        )}
      </div>
    </CardContent>
  </Card>
);

export default AuthorDetails;
