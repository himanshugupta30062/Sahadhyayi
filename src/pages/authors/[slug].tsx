import { useParams, Link } from 'react-router-dom';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MapPin, BookOpen, Users, Star, Globe, Calendar, ExternalLink, MessageSquare } from 'lucide-react';
import { useAuthorBySlug } from '@/hooks/useAuthorBySlug';
import { useAuthorBooks } from '@/hooks/useAuthorBooks';
import SEO from '@/components/SEO';
import NotFound from '../NotFound';
import { FollowButton } from '@/components/authors/FollowButton';
import { CreatePostForm } from '@/components/authors/CreatePostForm';
import { AuthorPostCard } from '@/components/authors/AuthorPostCard';
import { useAuthorPosts } from '@/hooks/useAuthorPosts';
import { useAuth } from '@/contexts/AuthContext';
import { AskQuestionForm } from '@/components/authors/AskQuestionForm';
import { QuestionAnswerCard } from '@/components/authors/QuestionAnswerCard';
import { EventCard } from '@/components/authors/EventCard';
import { useAuthorQuestions } from '@/hooks/useAuthorQuestions';
import { useAuthorEvents } from '@/hooks/useAuthorEvents';
import { VerificationBadge } from '@/components/authors/VerificationBadge';


const slugify = (text: string) =>
  text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

const AuthorSlugPage = () => {
  const { slug } = useParams<{ slug: string }>();
  const { user } = useAuth();
  const { data: author, isLoading } = useAuthorBySlug(slug);
  const { data: authorBooks, isLoading: booksLoading } = useAuthorBooks(author?.id || '');
  const { data: authorPosts, isLoading: postsLoading } = useAuthorPosts(author?.id);
  const { data: questions, isLoading: questionsLoading } = useAuthorQuestions(author?.id);
  const { data: events, isLoading: eventsLoading } = useAuthorEvents(author?.id);

  // Check if current user is the author
  const isCurrentAuthor = user?.id === author?.id;

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">Loading author...</div>
    );
  }

  if (!author) {
    return <NotFound />;
  }

  const initials = author.name
    .split(' ')
    .map(n => n[0])
    .join('');

  const social = (author as any).social_links || {};

  return (
    <>
      <SEO
        title={`Author Profile - ${author.name} | Sahadhyayi`}
        description={author.bio || `Learn more about ${author.name}`}
        canonical={`https://sahadhyayi.com/authors/${slug}`}
        url={`https://sahadhyayi.com/authors/${slug}`}
        type="profile"
        author={author.name}
      />
      <div className="min-h-screen bg-gradient-to-br from-background via-muted/50 to-muted pt-16">
        <div className="container mx-auto px-4 py-8 max-w-6xl">
          {/* Author Header Section */}
          <div className="relative mb-8">
            <div className="bg-gradient-to-r from-primary/10 to-primary/20 rounded-2xl p-8">
              <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
                <div className="relative">
                  <Avatar className="w-32 h-32 ring-4 ring-background shadow-lg">
                    <AvatarImage src={author.profile_image_url || ''} alt={author.name} className="object-cover" />
                    <AvatarFallback className="text-3xl font-bold bg-primary text-primary-foreground">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                </div>
                
                <div className="flex-1 text-center md:text-left">
                  <div className="flex items-center justify-center md:justify-start gap-3 mb-2">
                    <h1 className="text-4xl md:text-5xl font-bold text-foreground">{author.name}</h1>
                    <VerificationBadge 
                      verified={author.verified || false} 
                      verificationType={author.verification_type} 
                    />
                  </div>
                  <div className="flex flex-wrap justify-center md:justify-start gap-2 mb-4">
                    {author.genres?.map(genre => (
                      <Badge key={genre} variant="secondary" className="text-sm">
                        {genre}
                      </Badge>
                    ))}
                  </div>
                  
                   {/* Quick Stats */}
                   <div className="flex flex-wrap justify-center md:justify-start gap-6 text-sm text-muted-foreground">
                     <div className="flex items-center gap-1">
                       <BookOpen className="w-4 h-4" />
                       <span>{author.books_count} Books</span>
                     </div>
                     <div className="flex items-center gap-1">
                       <Users className="w-4 h-4" />
                       <span>{author.followers_count.toLocaleString()} Followers</span>
                     </div>
                     <div className="flex items-center gap-1">
                       <Star className="w-4 h-4 text-yellow-500 fill-current" />
                       <span>{author.rating}</span>
                     </div>
                   </div>
                   
                   {/* Follow Button */}
                   <div className="mt-4 flex justify-center md:justify-start">
                     <FollowButton authorId={author.id} size="lg" />
                   </div>
                </div>
              </div>
            </div>
          </div>

          {/* Content Tabs */}
          <Tabs defaultValue="about" className="w-full">
            <TabsList className="grid w-full grid-cols-6 mb-6">
              <TabsTrigger value="about">About</TabsTrigger>
              <TabsTrigger value="books">Bibliography</TabsTrigger>
              <TabsTrigger value="updates">Updates</TabsTrigger>
              <TabsTrigger value="qa">Q&A</TabsTrigger>
              <TabsTrigger value="events">Events</TabsTrigger>
              <TabsTrigger value="connect">Connect</TabsTrigger>
            </TabsList>

            <TabsContent value="about" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="w-5 h-5" />
                    About {author.name}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="prose prose-gray dark:prose-invert max-w-none">
                    <p className="text-muted-foreground leading-relaxed text-base">
                      {author.bio || `${author.name} is a distinguished author with ${author.books_count} published works. Their writing spans across ${author.genres?.join(', ') || 'various genres'}, captivating readers with compelling narratives and insightful perspectives.`}
                    </p>
                  </div>
                  
                  <div className="mt-6 pt-6 border-t">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <div className="font-medium text-foreground">Location</div>
                        <div className="text-muted-foreground flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {author.location}
                        </div>
                      </div>
                      <div>
                        <div className="font-medium text-foreground">Published Works</div>
                        <div className="text-muted-foreground">{author.books_count} Books</div>
                      </div>
                      <div>
                        <div className="font-medium text-foreground">Rating</div>
                        <div className="text-muted-foreground flex items-center gap-1">
                          <Star className="w-3 h-3 text-yellow-500 fill-current" />
                          {author.rating}/5.0
                        </div>
                      </div>
                      <div>
                        <div className="font-medium text-foreground">Upcoming Events</div>
                        <div className="text-muted-foreground">{author.upcoming_events} Events</div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="books" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BookOpen className="w-5 h-5" />
                    Complete Bibliography
                  </CardTitle>
                  <p className="text-muted-foreground">
                    Explore all {author.books_count} books by {author.name}
                  </p>
                </CardHeader>
                <CardContent>
                  {booksLoading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {[...Array(6)].map((_, i) => (
                        <div key={i} className="animate-pulse">
                          <div className="bg-muted rounded-lg h-48 mb-3"></div>
                          <div className="h-4 bg-muted rounded mb-2"></div>
                          <div className="h-3 bg-muted rounded w-3/4"></div>
                        </div>
                      ))}
                    </div>
                  ) : authorBooks && authorBooks.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {authorBooks.map((book) => (
                        <Card key={book.id} className="group hover:shadow-lg transition-all duration-300 overflow-hidden">
                          <div className="aspect-[3/4] bg-gradient-to-br from-primary/20 to-primary/30 relative overflow-hidden">
                            {book.cover_image_url ? (
                              <img
                                src={book.cover_image_url}
                                alt={book.title}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                onError={(e) => {
                                  e.currentTarget.style.display = 'none';
                                  e.currentTarget.nextElementSibling?.classList.remove('hidden');
                                }}
                              />
                            ) : null}
                            
                            <div className={`w-full h-full flex items-center justify-center text-muted-foreground p-4 ${book.cover_image_url ? 'hidden' : ''}`}>
                              <div className="text-center">
                                <BookOpen className="w-12 h-12 mx-auto mb-2 opacity-60" />
                                <div className="text-sm font-medium leading-tight">
                                  {book.title.length > 30 ? book.title.substring(0, 30) + '...' : book.title}
                                </div>
                              </div>
                            </div>
                          </div>

                          <CardContent className="p-4 space-y-2">
                            <div>
                              <h3 className="font-semibold text-base line-clamp-2 group-hover:text-primary transition-colors duration-200">
                                {book.title}
                              </h3>
                              <p className="text-muted-foreground text-sm">{book.author}</p>
                            </div>

                            <div className="flex items-center justify-between text-xs">
                              <div className="flex gap-2">
                                {book.genre && (
                                  <Badge variant="secondary" className="text-xs">
                                    {book.genre}
                                  </Badge>
                                )}
                                {book.language && book.language !== 'English' && (
                                  <Badge variant="outline" className="text-xs">
                                    {book.language}
                                  </Badge>
                                )}
                              </div>
                              {book.publication_year && (
                                <span className="text-muted-foreground">{book.publication_year}</span>
                              )}
                            </div>

                            <div className="pt-2">
                              <Link to={`/book-details/${book.id}`}>
                                <Button variant="outline" size="sm" className="w-full">
                                  <BookOpen className="w-3 h-3 mr-1" />
                                  View Details
                                </Button>
                              </Link>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <BookOpen className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground">No books found for this author.</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="updates" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="w-5 h-5" />
                    Author Updates
                  </CardTitle>
                  <p className="text-muted-foreground">
                    Latest news and updates from {author.name}
                  </p>
                </CardHeader>
                <CardContent>
                  {/* Show create post form only to the author themselves */}
                  {isCurrentAuthor && (
                    <CreatePostForm 
                      authorId={author.id} 
                      onPostCreated={() => {
                        // Optionally refresh posts
                      }} 
                    />
                  )}

                  {/* Posts feed */}
                  {postsLoading ? (
                    <div className="space-y-4">
                      {[...Array(3)].map((_, i) => (
                        <div key={i} className="animate-pulse">
                          <div className="bg-muted rounded-lg h-32 mb-3"></div>
                        </div>
                      ))}
                    </div>
                  ) : authorPosts && authorPosts.length > 0 ? (
                    <div className="space-y-6">
                      {authorPosts.map((post) => (
                        <AuthorPostCard key={post.id} post={post} />
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground">
                        {isCurrentAuthor 
                          ? "Share your first update with your followers!" 
                          : `${author.name} hasn't posted any updates yet.`
                        }
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="qa" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-1">
                  <AskQuestionForm authorId={author.id} authorName={author.name} />
                </div>
                <div className="lg:col-span-2">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <MessageSquare className="w-5 h-5" />
                        Questions & Answers
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {questionsLoading ? (
                        <div className="space-y-4">
                          {[...Array(3)].map((_, i) => (
                            <div key={i} className="animate-pulse">
                              <div className="bg-muted rounded-lg h-32 mb-3"></div>
                            </div>
                          ))}
                        </div>
                      ) : questions && questions.length > 0 ? (
                        <div className="space-y-4">
                          {questions.map((qa) => (
                            <QuestionAnswerCard key={qa.id} qa={qa} />
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-12">
                          <MessageSquare className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                          <p className="text-muted-foreground">No questions answered yet.</p>
                          <p className="text-sm text-muted-foreground mt-1">
                            Be the first to ask {author.name} a question!
                          </p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="events" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="w-5 h-5" />
                    Upcoming Events
                  </CardTitle>
                  <p className="text-muted-foreground">
                    Don't miss {author.name}'s upcoming appearances and events
                  </p>
                </CardHeader>
                <CardContent>
                  {eventsLoading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {[...Array(4)].map((_, i) => (
                        <div key={i} className="animate-pulse">
                          <div className="bg-muted rounded-lg h-48 mb-3"></div>
                        </div>
                      ))}
                    </div>
                  ) : events && events.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {events.map((event) => (
                        <EventCard key={event.id} event={event} />
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground">No upcoming events scheduled.</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        Follow {author.name} to be notified when new events are announced!
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="connect" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Globe className="w-5 h-5" />
                    Connect with {author.name}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {author.website_url && (
                      <a 
                        href={author.website_url} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="flex items-center gap-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                      >
                        <Globe className="w-5 h-5 text-primary" />
                        <div>
                          <div className="font-medium">Official Website</div>
                          <div className="text-sm text-muted-foreground">{author.website_url}</div>
                        </div>
                        <ExternalLink className="w-4 h-4 ml-auto" />
                      </a>
                    )}
                    
                    {social.goodreads && (
                      <a 
                        href={social.goodreads} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="flex items-center gap-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                      >
                        <Globe className="w-5 h-5 text-primary" />
                        <div>
                          <div className="font-medium">Goodreads Profile</div>
                          <div className="text-sm text-muted-foreground">Follow on Goodreads</div>
                        </div>
                        <ExternalLink className="w-4 h-4 ml-auto" />
                      </a>
                    )}
                    
                    {social.wikipedia && (
                      <a 
                        href={social.wikipedia} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="flex items-center gap-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                      >
                        <Globe className="w-5 h-5 text-primary" />
                        <div>
                          <div className="font-medium">Wikipedia</div>
                          <div className="text-sm text-muted-foreground">Learn more about the author</div>
                        </div>
                        <ExternalLink className="w-4 h-4 ml-auto" />
                      </a>
                    )}
                    
                    {/* Social media links from social_links field */}
                    {social.twitter && (
                      <a 
                        href={social.twitter} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="flex items-center gap-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                      >
                        <Globe className="w-5 h-5 text-primary" />
                        <div>
                          <div className="font-medium">Twitter</div>
                          <div className="text-sm text-muted-foreground">Follow on Twitter</div>
                        </div>
                        <ExternalLink className="w-4 h-4 ml-auto" />
                      </a>
                    )}
                    
                    {social.instagram && (
                      <a 
                        href={social.instagram} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="flex items-center gap-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                      >
                        <Globe className="w-5 h-5 text-primary" />
                        <div>
                          <div className="font-medium">Instagram</div>
                          <div className="text-sm text-muted-foreground">Follow on Instagram</div>
                        </div>
                        <ExternalLink className="w-4 h-4 ml-auto" />
                      </a>
                    )}
                    
                    {social.facebook && (
                      <a 
                        href={social.facebook} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="flex items-center gap-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                      >
                        <Globe className="w-5 h-5 text-primary" />
                        <div>
                          <div className="font-medium">Facebook</div>
                          <div className="text-sm text-muted-foreground">Follow on Facebook</div>
                        </div>
                        <ExternalLink className="w-4 h-4 ml-auto" />
                      </a>
                    )}
                    
                    {!author.website_url && !social.goodreads && !social.wikipedia && !social.twitter && !social.instagram && !social.facebook && (
                      <div className="text-center py-8">
                        <Globe className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                        <p className="text-muted-foreground">No public profiles available for this author.</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          <div className="mt-8 text-center">
            <Link to="/authors">
              <Button variant="outline" size="lg">
                ← Back to Authors
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </>
  );
};

export default AuthorSlugPage;
