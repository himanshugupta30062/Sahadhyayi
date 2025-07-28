
import * as React from 'react';
import { useState, useMemo, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Search, User, MapPin, Calendar, MessageSquare, Clock, AlertCircle, RefreshCw, Star, Users, BookOpen } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ChatWindow } from "@/components/social/ChatWindow";
import { ScheduleSessionDialog } from "@/components/authors/ScheduleSessionDialog";
import { useAuth } from '@/contexts/AuthContext';
import SEO from '@/components/SEO';
import Breadcrumb from '@/components/ui/breadcrumb';
import { useAuthors, type Author } from '@/hooks/useAuthors';
import { useAllLibraryBooks, type Book } from '@/hooks/useLibraryBooks';
import { toast } from '@/hooks/use-toast';
import { generateWebsiteSchema, generateBreadcrumbSchema } from '@/utils/schema';

const slugify = (text: string) =>
  text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

const Authors = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-red-50">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">Authors Directory</h1>
        <p className="text-gray-600">Authors page is temporarily simplified for debugging.</p>
      </div>
    </div>
  );
};

// Author Card Component  
interface AuthorCardProps {
  author: Author;
  books: Book[];
  featured: boolean;
}

const AuthorCard: React.FC<AuthorCardProps> = ({ author, books, featured }) => {
  const [showChat, setShowChat] = useState(false);
  const { user } = useAuth();

  const handleMessageClick = () => {
    if (!user) {
      toast({
        title: 'Authentication Required',
        description: 'Please sign in to message authors.',
        variant: 'destructive'
      });
      return;
    }
    setShowChat(true);
  };
  const getAuthorInitials = (name: string) => {
    return name.split(' ').map(n => n.charAt(0)).join('').toUpperCase().slice(0, 2);
  };

  return (
    <Card className={`group hover:shadow-xl transition-all duration-300 hover:-translate-y-1 bg-white/90 backdrop-blur-sm border-orange-200 ${featured ? 'ring-2 ring-orange-300' : ''}`}>
      <CardContent className={featured ? "p-6" : "p-4"}>
        <div className="text-center mb-4">
          <Avatar className={`${featured ? 'w-20 h-20' : 'w-16 h-16'} mx-auto mb-3 ring-2 ring-orange-200 group-hover:ring-orange-400 transition-all`}>
            <AvatarImage src={author.profile_image_url || ""} alt={author.name} />
            <AvatarFallback className={`${featured ? 'text-lg' : 'text-sm'} font-bold bg-gradient-to-br from-orange-500 to-amber-500 text-white`}>
              {getAuthorInitials(author.name)}
            </AvatarFallback>
          </Avatar>
          <h3 className={`${featured ? 'text-xl' : 'text-lg'} font-semibold text-gray-900 mb-2`}>
            {author.name}
          </h3>
          <div className="flex items-center justify-center gap-1 mb-2">
            <MapPin className="w-3 h-3 text-gray-400" />
            <span className="text-xs text-gray-500">{author.location}</span>
          </div>
          {author.bio && (
            <p className={`text-gray-600 ${featured ? 'text-sm' : 'text-xs'} line-clamp-2 mb-3`}>
              {author.bio}
            </p>
          )}
        </div>

        {/* Author Stats */}
        <div className={`grid grid-cols-2 gap-2 mb-4 ${featured ? 'text-sm' : 'text-xs'}`}>
          <div className="flex items-center justify-between">
            <span className="text-gray-500 flex items-center gap-1">
              <BookOpen className="w-3 h-3" />
              Books
            </span>
            <span className="font-medium">{author.books_count}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-gray-500 flex items-center gap-1">
              <Star className="w-3 h-3" />
              Rating
            </span>
            <span className="font-medium">{author.rating}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-gray-500 flex items-center gap-1">
              <Users className="w-3 h-3" />
              Followers
            </span>
            <span className="font-medium">{author.followers_count.toLocaleString()}</span>
          </div>
          {author.upcoming_events > 0 && (
            <div className="flex items-center justify-between">
              <span className="text-gray-500 flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                Events
              </span>
              <span className="font-medium">{author.upcoming_events}</span>
            </div>
          )}
        </div>

        {books.length > 0 && (
          <div className={`mb-4 ${featured ? 'text-sm' : 'text-xs'} text-left`}>
            <p className="font-medium text-gray-700 mb-1">Books:</p>
            <ul className="list-disc list-inside space-y-1">
              {books.slice(0, 2).map(book => (
                <li key={book.id} className="text-gray-600">{book.title}</li>
              ))}
              {books.length > 2 && (
                <li className="text-gray-500">+{books.length - 2} more</li>
              )}
            </ul>
          </div>
        )}

        {/* Genres */}
        {author.genres.length > 0 && (
          <div className="mb-4">
            <div className="flex flex-wrap gap-1">
              {author.genres.slice(0, featured ? 3 : 2).map((genre, index) => (
                <Badge key={index} variant="outline" className="text-xs border-orange-200 text-orange-700">
                  {genre}
                </Badge>
              ))}
              {author.genres.length > (featured ? 3 : 2) && (
                <Badge variant="outline" className="text-xs border-gray-200 text-gray-500">
                  +{author.genres.length - (featured ? 3 : 2)}
                </Badge>
              )}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="grid grid-cols-1 gap-2">
          <Link to={`/authors/${slugify(author.name)}`}>
            <Button size="sm" className="w-full bg-orange-600 hover:bg-orange-700 text-white">
              View Profile
            </Button>
          </Link>
          <div className="grid grid-cols-2 gap-1">
            <ScheduleSessionDialog
              author={author}
              trigger={
                <Button variant="outline" size="sm" className="text-xs border-blue-300 text-blue-700 hover:bg-blue-50">
                  <Clock className="w-3 h-3 mr-1" />
                  Schedule
                </Button>
              }
            />
            <Button
              variant="outline"
              size="sm"
              className="text-xs border-green-300 text-green-700 hover:bg-green-50"
              onClick={handleMessageClick}
            >
              <MessageSquare className="w-3 h-3 mr-1" />
              Message
            </Button>
            {showChat && (
              <ChatWindow
                friendId={author.id}
                isOpen={showChat}
                onClose={() => setShowChat(false)}
              />
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default Authors;
