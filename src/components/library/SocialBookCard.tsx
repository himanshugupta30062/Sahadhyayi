
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { slugify } from '@/utils/slugify';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { 
  BookOpen, 
  Star, 
  MessageCircle, 
  MapPin, 
  Users, 
  Heart, 
  Share2, 
  Headphones,
  Send
} from 'lucide-react';
import ReadingCirclePanel from './ReadingCirclePanel';

interface SocialBookCardProps {
  book: {
    id: string;
    title: string;
    author: string;
    cover_url: string;
    rating: number;
    readingFriends: Array<{
      name: string;
      avatar: string;
      status: 'reading' | 'completed' | 'want_to_read';
    }>;
    comments: Array<{
      user: string;
      text: string;
      time: string;
    }>;
    locations: Array<{
      city: string;
      country: string;
      readers: number;
    }>;
    podcastUrl?: string | null;
  };
}

const SocialBookCard: React.FC<SocialBookCardProps> = ({ book }) => {
  const [showReadingCircle, setShowReadingCircle] = useState(false);
  const [userRating, setUserRating] = useState(0);
  const [newComment, setNewComment] = useState('');
  const [isLiked, setIsLiked] = useState(false);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'reading': return 'bg-blue-100 text-blue-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'want_to_read': return 'bg-amber-100 text-amber-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const renderStars = (rating: number, interactive = false) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`w-4 h-4 ${
          i < rating 
            ? 'fill-amber-400 text-amber-400' 
            : 'text-gray-300'
        } ${interactive ? 'cursor-pointer hover:text-amber-400' : ''}`}
        onClick={interactive ? () => setUserRating(i + 1) : undefined}
      />
    ));
  };

  const handleAddComment = () => {
    if (newComment.trim()) {
      // In a real app, this would call an API
      console.log('Adding comment:', newComment);
      setNewComment('');
    }
  };

  return (
    <Card className="bg-white/90 backdrop-blur-sm border-amber-200 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
      <CardHeader className="pb-3">
        <div className="flex space-x-4">
          {book.cover_url ? (
            <img
              src={book.cover_url}
              alt={`Cover of ${book.title}`}
              loading="lazy"
              className="w-20 h-28 object-cover rounded-lg shadow-md"
            />
          ) : (
            <div className="w-20 h-28 bg-gradient-to-br from-amber-100 to-orange-100 rounded-lg flex items-center justify-center">
              <BookOpen className="w-10 h-10 text-amber-600" />
            </div>
          )}
          
          <div className="flex-1 min-w-0">
            <CardTitle className="text-lg text-gray-900 mb-1 line-clamp-2">
              {book.title}
            </CardTitle>
            <p className="text-gray-600 text-sm mb-2">
              by <Link to={`/authors/${slugify(book.author)}`}>{book.author}</Link>
            </p>
            
            {/* Rating */}
            <div className="flex items-center gap-2 mb-2">
              <div className="flex">{renderStars(Math.floor(book.rating))}</div>
              <span className="text-sm text-gray-600">({book.rating})</span>
            </div>

            {/* Reading Friends Avatars */}
            <div className="flex items-center gap-2">
              <div className="flex -space-x-2">
                {book.readingFriends.slice(0, 3).map((friend, index) => (
                  <Avatar key={index} className="w-6 h-6 border-2 border-white">
                    <AvatarImage src={friend.avatar} alt={friend.name} />
                    <AvatarFallback className="text-xs">{friend.name[0]}</AvatarFallback>
                  </Avatar>
                ))}
              </div>
              {book.readingFriends.length > 3 && (
                <span className="text-xs text-gray-500">
                  +{book.readingFriends.length - 3} more
                </span>
              )}
            </div>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="pt-0">
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="community">Community</TabsTrigger>
            <TabsTrigger value="locations">Locations</TabsTrigger>
          </TabsList>
          
          <TabsContent value="overview" className="space-y-4">
            {/* Podcast Section */}
            {book.podcastUrl && (
              <div className="bg-amber-50 p-3 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Headphones className="w-4 h-4 text-amber-600" />
                  <span className="text-sm font-medium">Related Podcast</span>
                </div>
                <Button 
                  size="sm" 
                  variant="outline"
                  className="w-full"
                  onClick={() => window.open(book.podcastUrl!, '_blank')}
                >
                  Listen Now
                </Button>
              </div>
            )}

            {/* Your Rating */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Your Rating</label>
              <div className="flex gap-1">
                {renderStars(userRating, true)}
              </div>
            </div>
            
            {/* Action Buttons */}
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsLiked(!isLiked)}
                className={isLiked ? 'text-red-600 border-red-200' : ''}
              >
                <Heart className={`w-4 h-4 mr-1 ${isLiked ? 'fill-red-600' : ''}`} />
                {isLiked ? 'Liked' : 'Like'}
              </Button>
              <Button variant="outline" size="sm">
                <Share2 className="w-4 h-4 mr-1" />
                Share
              </Button>
              <Dialog open={showReadingCircle} onOpenChange={setShowReadingCircle}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Users className="w-4 h-4 mr-1" />
                    Circle
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Reading Circle - {book.title}</DialogTitle>
                  </DialogHeader>
                  <ReadingCirclePanel book={book} />
                </DialogContent>
              </Dialog>
            </div>
          </TabsContent>
          
          <TabsContent value="community" className="space-y-4">
            {/* Comments Section */}
            <div className="space-y-3">
              <h4 className="font-medium">Comments</h4>
              <div className="space-y-2 max-h-32 overflow-y-auto">
                {book.comments.map((comment, index) => (
                  <div key={index} className="bg-gray-50 p-2 rounded text-sm">
                    <div className="flex justify-between items-start">
                      <span className="font-medium text-gray-900">{comment.user}</span>
                      <span className="text-xs text-gray-500">{comment.time}</span>
                    </div>
                    <p className="text-gray-700 mt-1">{comment.text}</p>
                  </div>
                ))}
              </div>
              
              {/* Add Comment */}
              <div className="flex gap-2">
                <Textarea
                  placeholder="Add your thoughts..."
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  className="flex-1 min-h-[40px] max-h-[80px]"
                />
                <Button size="sm" onClick={handleAddComment}>
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="locations" className="space-y-3">
            <h4 className="font-medium">Reader Locations</h4>
            <div className="space-y-2">
              {book.locations.map((location, index) => (
                <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-gray-600" />
                    <span className="text-sm">{location.city}, {location.country}</span>
                  </div>
                  <Badge variant="secondary">{location.readers} readers</Badge>
                </div>
              ))}
            </div>
            <Button variant="outline" size="sm" className="w-full">
              <MapPin className="w-4 h-4 mr-2" />
              View on Map
            </Button>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default SocialBookCard;
