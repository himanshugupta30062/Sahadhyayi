
import React, { useState, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, MapPin, Calendar, Clock, Users, BookOpen, Star, ExternalLink, MessageSquare, Video, Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ChatWindow } from "@/components/social/ChatWindow";
import { ScheduleSessionDialog } from "@/components/authors/ScheduleSessionDialog";
import SEO from '@/components/SEO';
import { useAllLibraryBooks } from '@/hooks/useLibraryBooks';

interface AuthorProfileType {
  id: string;
  name: string;
  bio: string;
  location: string;
  website: string;
  social: {
    twitter: string;
    instagram: string;
    facebook: string;
  };
  followers: number;
  rating: number;
  totalBooks: number;
  genres: string[];
  availableSlots: string[];
}

const AuthorProfile = () => {
  const { authorName } = useParams<{ authorName: string }>();
  const { data: books, isLoading } = useAllLibraryBooks();
  const [showFullBio, setShowFullBio] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const chatId = authorName || 'author-profile';

  // Find author and their books
  const { author, authorBooks } = useMemo(() => {
    if (!books || !authorName) return { author: null, authorBooks: [] };
    
    const authorBooks = books.filter(book => 
      book.author && book.author.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') === authorName
    );
    
    if (authorBooks.length === 0) return { author: null, authorBooks: [] };
    
    const firstBook = authorBooks[0];
    const author: AuthorProfileType = {
      id: chatId,
      name: firstBook.author!,
      bio: firstBook.author_bio || `${firstBook.author} is a distinguished author whose literary works have captivated readers around the world. With a unique voice and compelling storytelling, they continue to contribute meaningfully to contemporary literature.`,
      location: 'New York, USA', // Mock data
      website: 'https://author-website.com',
      social: {
        twitter: '@authorhandle',
        instagram: '@authorhandle',
        facebook: 'AuthorPage'
      },
      followers: Math.floor(Math.random() * 50000 + 10000),
      rating: parseFloat((4.2 + Math.random() * 0.8).toFixed(1)),
      totalBooks: authorBooks.length,
      genres: [...new Set(authorBooks.map(book => book.genre).filter(Boolean))],
      availableSlots: [] // Add this property
    };
    
    return { author, authorBooks };
  }, [books, authorName]);

  // Mock upcoming events
  const upcomingEvents = [
    {
      id: 1,
      title: 'Literary Evening: Discussion on Modern Fiction',
      type: 'In-Person',
      date: '2024-02-15',
      time: '7:00 PM',
      location: 'Barnes & Noble, Manhattan',
      description: 'Join us for an intimate discussion about the evolution of modern fiction.'
    },
    {
      id: 2,
      title: 'Virtual Book Reading Session',
      type: 'Online',
      date: '2024-02-20',
      time: '3:00 PM',
      location: 'Zoom Webinar',
      description: 'Online reading session from the latest published work.'
    },
    {
      id: 3,
      title: 'Writing Workshop',
      type: 'In-Person',
      date: '2024-02-28',
      time: '10:00 AM',
      location: 'Community Center, Brooklyn',
      description: 'Learn writing techniques and get your questions answered.'
    }
  ];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center pt-16">
        <div className="animate-pulse text-center">
          <div className="w-16 h-16 bg-blue-200 rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600">Loading author profile...</p>
        </div>
      </div>
    );
  }

  if (!author) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center pt-16">
        <div className="text-center">
          <div className="w-16 h-16 bg-red-200 rounded-full mx-auto mb-4 flex items-center justify-center">
            <Users className="w-8 h-8 text-red-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Author Not Found</h1>
          <p className="text-gray-600 mb-4">Sorry, we couldn't find the author you're looking for.</p>
          <Link to="/authors">
            <Button variant="outline">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Authors
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const getAuthorInitials = (name: string) => {
    return name.split(' ').map(n => n.charAt(0)).join('').toUpperCase();
  };

  const shortBio = author.bio.length > 300 ? author.bio.substring(0, 300) + '...' : author.bio;

  return (
    <>
      <SEO
        title={`About ${author.name} | Sahadhyayi`}
        description={`Discover ${author.name}'s biography, books, and upcoming events. Connect with this talented author on Sahadhyayi.`}
        canonical={`https://sahadhyayi.com/author/${authorName}`}
        url={`https://sahadhyayi.com/author/${authorName}`}
        type="profile"
        author={author.name}
      />

      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 pt-16">
        {/* Header */}
        <div className="bg-white/80 backdrop-blur-sm border-b border-blue-200 sticky top-16 z-10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <Link to="/authors">
              <Button variant="ghost" className="hover:bg-blue-100">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Authors
              </Button>
            </Link>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Author Header */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
            {/* Author Info */}
            <div className="lg:col-span-2">
              <Card className="bg-white/80 backdrop-blur-sm border-blue-200">
                <CardContent className="p-8">
                  <div className="flex flex-col sm:flex-row items-start gap-6">
                    <Avatar className="w-32 h-32 ring-4 ring-blue-200">
                      <AvatarImage src="" alt={author.name} />
                      <AvatarFallback className="text-3xl font-bold bg-gradient-to-br from-blue-500 to-purple-500 text-white">
                        {getAuthorInitials(author.name)}
                      </AvatarFallback>
                    </Avatar>
                    
                    <div className="flex-1">
                      <h1 className="text-4xl font-bold text-gray-900 mb-2">{author.name}</h1>
                      <div className="flex items-center gap-2 mb-4">
                        <MapPin className="w-5 h-5 text-gray-500" />
                        <span className="text-gray-600">{author.location}</span>
                      </div>
                      
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
                        <div className="text-center">
                          <div className="text-2xl font-bold text-blue-600">{author.totalBooks}</div>
                          <div className="text-sm text-gray-600">Books</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-green-600">{author.rating}</div>
                          <div className="text-sm text-gray-600">Rating</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-purple-600">{author.followers.toLocaleString()}</div>
                          <div className="text-sm text-gray-600">Followers</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-orange-600">{upcomingEvents.length}</div>
                          <div className="text-sm text-gray-600">Events</div>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2 mb-6">
                        {author.genres.map(genre => (
                          <Badge key={genre} variant="secondary" className="bg-blue-100 text-blue-800">
                            {genre}
                          </Badge>
                        ))}
                      </div>

                      <div className="flex flex-wrap gap-3">
                        <Button className="bg-blue-600 hover:bg-blue-700">
                          <Users className="w-4 h-4 mr-2" />
                          Follow Author
                        </Button>
                        <Button
                          variant="outline"
                          className="border-green-300 text-green-700 hover:bg-green-50"
                          onClick={() => setShowChat(true)}
                        >
                          <MessageSquare className="w-4 h-4 mr-2" />
                          Message
                        </Button>
                        <ScheduleSessionDialog
                          author={author}
                          trigger={
                            <Button variant="outline" className="border-purple-300 text-purple-700 hover:bg-purple-50">
                              <Calendar className="w-4 h-4 mr-2" />
                              Schedule Session
                            </Button>
                          }
                        />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Quick Stats & Links */}
            <div className="space-y-6">
              <Card className="bg-white/80 backdrop-blur-sm border-blue-200">
                <CardHeader>
                  <CardTitle className="text-lg">Connect</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <a href={author.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 transition-colors">
                    <Globe className="w-5 h-5 text-blue-600" />
                    <span className="text-sm">Website</span>
                    <ExternalLink className="w-4 h-4 ml-auto text-gray-400" />
                  </a>
                  <a href={`https://twitter.com/${author.social.twitter.replace('@', '')}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 transition-colors">
                    <div className="w-5 h-5 bg-blue-400 rounded"></div>
                    <span className="text-sm">Twitter</span>
                    <ExternalLink className="w-4 h-4 ml-auto text-gray-400" />
                  </a>
                  <a href={`https://instagram.com/${author.social.instagram.replace('@', '')}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 transition-colors">
                    <div className="w-5 h-5 bg-pink-400 rounded"></div>
                    <span className="text-sm">Instagram</span>
                    <ExternalLink className="w-4 h-4 ml-auto text-gray-400" />
                  </a>
                </CardContent>
              </Card>

              <Card className="bg-white/80 backdrop-blur-sm border-blue-200">
                <CardHeader>
                  <CardTitle className="text-lg">Location</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="bg-gradient-to-br from-blue-100 to-purple-100 rounded-lg h-48 flex items-center justify-center">
                    <div className="text-center">
                      <MapPin className="w-12 h-12 text-blue-600 mx-auto mb-2" />
                      <p className="text-sm text-gray-600">Interactive map</p>
                      <p className="text-xs text-gray-500">Coming soon</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Main Content Tabs */}
          <Tabs defaultValue="about" className="w-full">
            <TabsList className="grid w-full grid-cols-1 sm:grid-cols-4 mb-6 bg-white/80 backdrop-blur-sm border border-gray-200 rounded-xl h-auto p-2">
              <TabsTrigger value="about" className="py-3 rounded-lg data-[state=active]:bg-blue-100 data-[state=active]:text-blue-800">
                About
              </TabsTrigger>
              <TabsTrigger value="books" className="py-3 rounded-lg data-[state=active]:bg-green-100 data-[state=active]:text-green-800">
                Books ({authorBooks.length})
              </TabsTrigger>
              <TabsTrigger value="events" className="py-3 rounded-lg data-[state=active]:bg-purple-100 data-[state=active]:text-purple-800">
                Events ({upcomingEvents.length})
              </TabsTrigger>
              <TabsTrigger value="contact" className="py-3 rounded-lg data-[state=active]:bg-orange-100 data-[state=active]:text-orange-800">
                Contact
              </TabsTrigger>
            </TabsList>

            <TabsContent value="about">
              <Card className="bg-white/80 backdrop-blur-sm border-blue-200">
                <CardContent className="p-8">
                  <h3 className="text-2xl font-bold mb-4">Biography</h3>
                  <div className="prose max-w-none">
                    <p className="text-gray-700 leading-relaxed mb-4">
                      {showFullBio ? author.bio : shortBio}
                    </p>
                    {author.bio.length > 300 && (
                      <Button 
                        variant="ghost" 
                        onClick={() => setShowFullBio(!showFullBio)}
                        className="text-blue-600 hover:text-blue-800 p-0 h-auto"
                      >
                        {showFullBio ? 'Show Less' : 'Read More'}
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="books">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {authorBooks.map(book => (
                  <Card key={book.id} className="group hover:shadow-lg transition-all duration-300 bg-white/80 backdrop-blur-sm border-blue-200">
                    <CardContent className="p-6">
                      <div className="flex gap-4">
                        <div className="w-16 h-20 bg-gradient-to-br from-blue-200 to-purple-200 rounded-lg flex items-center justify-center flex-shrink-0">
                          <BookOpen className="w-8 h-8 text-blue-600" />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-900 mb-2 line-clamp-2">{book.title}</h4>
                          {book.genre && (
                            <Badge variant="outline" className="mb-2 text-xs">
                              {book.genre}
                            </Badge>
                          )}
                          <div className="flex items-center gap-2 mb-3">
                            <Star className="w-4 h-4 text-yellow-500 fill-current" />
                            <span className="text-sm text-gray-600">4.2 (120 reviews)</span>
                          </div>
                          <Link to={`/book/${book.id}`}>
                            <Button size="sm" className="w-full bg-blue-600 hover:bg-blue-700">
                              View Book
                            </Button>
                          </Link>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="events">
              <div className="space-y-6">
                {upcomingEvents.map(event => (
                  <Card key={event.id} className="bg-white/80 backdrop-blur-sm border-blue-200">
                    <CardContent className="p-6">
                      <div className="flex flex-col sm:flex-row gap-4">
                        <div className="flex-1">
                          <div className="flex items-start justify-between mb-3">
                            <h4 className="text-lg font-semibold text-gray-900">{event.title}</h4>
                            <Badge variant={event.type === 'Online' ? 'default' : 'secondary'} className="ml-2">
                              {event.type === 'Online' ? (
                                <Video className="w-3 h-3 mr-1" />
                              ) : (
                                <MapPin className="w-3 h-3 mr-1" />
                              )}
                              {event.type}
                            </Badge>
                          </div>
                          
                          <div className="space-y-2 mb-4">
                            <div className="flex items-center gap-2 text-gray-600">
                              <Calendar className="w-4 h-4" />
                              <span>{new Date(event.date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
                            </div>
                            <div className="flex items-center gap-2 text-gray-600">
                              <Clock className="w-4 h-4" />
                              <span>{event.time}</span>
                            </div>
                            <div className="flex items-center gap-2 text-gray-600">
                              <MapPin className="w-4 h-4" />
                              <span>{event.location}</span>
                            </div>
                          </div>
                          
                          <p className="text-gray-700 text-sm mb-4">{event.description}</p>
                          
                          <div className="flex gap-2">
                            <Button size="sm" className="bg-purple-600 hover:bg-purple-700">
                              Register
                            </Button>
                            {event.type === 'Online' && (
                              <Button variant="outline" size="sm">
                                Join Webinar
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="contact">
              <Card className="bg-white/80 backdrop-blur-sm border-blue-200">
                <CardContent className="p-8">
                  <h3 className="text-2xl font-bold mb-6">Get in Touch</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div>
                      <h4 className="text-lg font-semibold mb-4">Consultation Services</h4>
                      <p className="text-gray-700 mb-4">
                        Available for writing consultations, manuscript reviews, and literary guidance sessions.
                      </p>
                      <ScheduleSessionDialog
                        author={author}
                        trigger={
                          <Button className="w-full bg-orange-600 hover:bg-orange-700">
                            <Calendar className="w-4 h-4 mr-2" />
                            Schedule Consultation
                          </Button>
                        }
                      />
                    </div>
                    <div>
                      <h4 className="text-lg font-semibold mb-4">Direct Messaging</h4>
                      <p className="text-gray-700 mb-4">
                        Send a message for collaboration opportunities, interviews, or general inquiries.
                      </p>
                      <Button
                        variant="outline"
                        className="w-full border-green-300 text-green-700 hover:bg-green-50"
                        onClick={() => setShowChat(true)}
                      >
                        <MessageSquare className="w-4 h-4 mr-2" />
                        Send Message
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
  <ChatWindow friendId={chatId} isOpen={showChat} onClose={() => setShowChat(false)} />
    </>
  );
};

export default AuthorProfile;
