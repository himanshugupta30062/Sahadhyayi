import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuthorBySlug } from '@/hooks/useAuthorBySlug';
import { useAuthorBooks } from '@/hooks/useAuthorBooks';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  BookOpen, 
  Download, 
  MessageCircle, 
  ChevronDown, 
  ChevronUp,
  User,
  ExternalLink
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import SEO from '@/components/SEO';
import LoadingSpinner from '@/components/LoadingSpinner';

// Legacy author details page accessed via /author/:slug
const AuthorDetails = () => {
  const { slug } = useParams<{ slug: string }>();
  const { user } = useAuth();
  const { toast } = useToast();
  const [isFullBioExpanded, setIsFullBioExpanded] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [showMessageForm, setShowMessageForm] = useState(false);
  const [messageText, setMessageText] = useState('');

  const { data: author, isLoading: authorLoading, error: authorError } = useAuthorBySlug(slug);
  const { data: books = [], isLoading: booksLoading } = useAuthorBooks(author?.id || '');

  const handleDownloadPDF = (book: any) => {
    if (book.pdf_url) {
      window.open(book.pdf_url, '_blank');
      toast({
        title: "Download Started",
        description: `Downloading ${book.title}`,
      });
    } else {
      toast({
        title: "PDF Not Available",
        description: "This book doesn't have a PDF version available.",
        variant: "destructive",
      });
    }
  };

  const handleSubmitComment = () => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to leave a comment.",
        variant: "destructive",
      });
      return;
    }

    if (newComment.trim()) {
      // In a real app, this would submit to the backend
      toast({
        title: "Comment Added",
        description: "Your comment has been posted successfully.",
      });
      setNewComment('');
    }
  };

  const handleSendMessage = () => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to message the author.",
        variant: "destructive",
      });
      return;
    }

    if (messageText.trim()) {
      // In a real app, this would send the message to the author
      toast({
        title: "Message Sent",
        description: "Your message has been sent to the author.",
      });
      setMessageText('');
      setShowMessageForm(false);
    }
  };

  if (authorLoading) {
    return <LoadingSpinner />;
  }

  if (authorError || !author) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-white to-orange-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <Card>
            <CardContent className="p-12 text-center">
              <User className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Author Not Found</h3>
              <p className="text-gray-600 mb-4">
                The author you're looking for doesn't exist or has been removed.
              </p>
              <Link to="/authors">
                <Button>Browse All Authors</Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <>
      <SEO
        title={`${author.name} - Author Profile | Sahadhyayi`}
        description={author.bio || `Discover books and content by ${author.name}. Read author biography, explore published works, and connect with the reading community.`}
        keywords={['author', author.name, 'books', 'biography', 'reading']}
      />
      
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-white to-orange-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          {/* Author Profile Header */}
          <Card className="mb-8">
            <CardContent className="p-8">
              <div className="flex flex-col md:flex-row gap-6">
                <div className="flex-shrink-0">
                  <Avatar className="w-32 h-32 border-4 border-amber-200">
                    <AvatarImage 
                      src={author.profile_image_url || ''} 
                      alt={author.name}
                    />
                    <AvatarFallback className="text-2xl bg-gradient-to-br from-amber-500 to-orange-600 text-white">
                      {author.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                </div>
                
                <div className="flex-1">
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                    <div>
                      <h1 className="text-3xl font-bold text-gray-900 mb-2">
                        {author.name}
                      </h1>
                      {author.location && (
                        <p className="text-gray-600 mb-2">📍 {author.location}</p>
                      )}
                      
                      {/* Author Stats */}
                      <div className="flex flex-wrap gap-4 mb-4">
                        <div className="flex items-center gap-2">
                          <BookOpen className="w-4 h-4 text-amber-600" />
                          <span className="text-sm font-medium">
                            {author.books_count || books.length} Books
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4 text-blue-600" />
                          <span className="text-sm font-medium">
                            {author.followers_count || 0} Followers
                          </span>
                        </div>
                        {author.rating && (
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium">
                              ⭐ {author.rating}/5
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Genres */}
                      {author.genres && author.genres.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-4">
                          {author.genres.map((genre, index) => (
                            <Badge key={index} variant="secondary" className="bg-amber-100 text-amber-800">
                              {genre}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-col gap-2">
                      {author.website_url && (
                        <Button 
                          variant="outline" 
                          size="sm"
                          asChild
                        >
                          <a href={author.website_url} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="w-4 h-4 mr-2" />
                            Website
                          </a>
                        </Button>
                      )}
                      
                      {user && (
                        <Button 
                          size="sm"
                          onClick={() => setShowMessageForm(!showMessageForm)}
                        >
                          <MessageCircle className="w-4 h-4 mr-2" />
                          Message Author
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* Short Bio */}
                  {author.bio && (
                    <div className="mt-4">
                      <p className="text-gray-700 leading-relaxed">
                        {isFullBioExpanded 
                          ? author.bio 
                          : `${author.bio.substring(0, 200)}${author.bio.length > 200 ? '...' : ''}`
                        }
                      </p>
                      {author.bio.length > 200 && (
                        <button
                          onClick={() => setIsFullBioExpanded(!isFullBioExpanded)}
                          className="text-amber-600 hover:text-amber-700 text-sm font-medium mt-2 flex items-center gap-1"
                        >
                          {isFullBioExpanded ? (
                            <>Show Less <ChevronUp className="w-4 h-4" /></>
                          ) : (
                            <>Read More <ChevronDown className="w-4 h-4" /></>
                          )}
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Message Form */}
              {showMessageForm && (
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <h3 className="text-lg font-semibold mb-3">Send Message to {author.name}</h3>
                  <Textarea
                    value={messageText}
                    onChange={(e) => setMessageText(e.target.value)}
                    placeholder="Write your message here..."
                    className="mb-3"
                    rows={4}
                  />
                  <div className="flex gap-2">
                    <Button onClick={handleSendMessage} disabled={!messageText.trim()}>
                      Send Message
                    </Button>
                    <Button variant="outline" onClick={() => setShowMessageForm(false)}>
                      Cancel
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Author's Books */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-amber-600" />
                Books by {author.name}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {booksLoading ? (
                <div className="text-center py-8">
                  <LoadingSpinner />
                </div>
              ) : books.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {books.map((book) => (
                    <Card key={book.id} className="group hover:shadow-lg transition-all duration-300">
                      <div className="aspect-[3/4] bg-gradient-to-br from-amber-500 to-orange-600 relative overflow-hidden">
                        {book.cover_image_url ? (
                          <img
                            src={book.cover_image_url}
                            alt={book.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            onError={(e) => {
                              e.currentTarget.src = '/default-cover.jpg';
                            }}
                          />
                        ) : (
                          <img
                            src="/default-cover.jpg"
                            alt={book.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        )}
                      </div>
                      
                      <CardContent className="p-4">
                        <h3 className="font-semibold text-lg text-gray-900 line-clamp-2 mb-2">
                          {book.title}
                        </h3>
                        
                        {book.genre && (
                          <Badge variant="secondary" className="mb-2">
                            {book.genre}
                          </Badge>
                        )}
                        
                        {book.description && (
                          <p className="text-gray-600 text-sm line-clamp-3 mb-3">
                            {book.description}
                          </p>
                        )}
                        
                        <div className="flex gap-2">
                          {book.pdf_url ? (
                            <Button 
                              size="sm" 
                              onClick={() => handleDownloadPDF(book)}
                              className="flex-1"
                            >
                              <Download className="w-4 h-4 mr-2" />
                              Download
                            </Button>
                          ) : (
                            <Button 
                              size="sm" 
                              variant="outline" 
                              disabled
                              className="flex-1"
                            >
                              PDF Not Available
                            </Button>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">No books available for this author yet.</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Reader Comments Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageCircle className="w-5 h-5 text-blue-600" />
                Reader Comments
              </CardTitle>
            </CardHeader>
            <CardContent>
              {user ? (
                <div className="mb-6">
                  <Textarea
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Share your thoughts about this author..."
                    className="mb-3"
                    rows={3}
                  />
                  <Button onClick={handleSubmitComment} disabled={!newComment.trim()}>
                    Post Comment
                  </Button>
                </div>
              ) : (
                <div className="mb-6 p-4 bg-amber-50 rounded-lg border border-amber-200">
                  <p className="text-amber-800">
                    <Link to="/signin" className="font-medium hover:underline">
                      Sign in
                    </Link>{' '}
                    to leave a comment about this author.
                  </p>
                </div>
              )}

              <Separator className="mb-6" />

              {/* Sample comments - in a real app, these would come from the database */}
              <div className="space-y-4">
                <div className="text-center py-8 text-gray-500">
                  <MessageCircle className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>No comments yet. Be the first to share your thoughts!</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
};

export default AuthorDetails;