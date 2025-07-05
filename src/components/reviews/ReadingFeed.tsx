import { useState } from "react";
import { Heart, MessageCircle, Share2, Users, MapPin, BookOpen, UserPlus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import UserProfileModal from "@/components/profile/UserProfileModal";

interface ReadingPost {
  id: number;
  username: string;
  userAvatar?: string;
  userLocation: string;
  bookCover: string;
  bookTitle: string;
  bookAuthor: string;
  genre: string;
  mood: string;
  review: string;
  likes: number;
  comments: number;
  shares: number;
  liked: boolean;
  timeAgo: string;
  readingStatus: 'reading' | 'finished' | 'want-to-read';
  nearbyReaders: number;
  user?: {
    id: string;
    name?: string;
    username?: string;
    email?: string;
    bio?: string;
    profile_picture_url?: string;
    location?: string;
    joined_at?: string;
    stories_written_count?: number;
    stories_read_count?: number;
    life_tags?: string[];
  };
}

const socialPosts: ReadingPost[] = [
  {
    id: 1,
    username: "bookworm_sarah",
    userLocation: "New York, USA",
    bookCover: "https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=400&h=600&fit=crop",
    bookTitle: "The Seven Husbands of Evelyn Hugo",
    bookAuthor: "Taylor Jenkins Reid",
    genre: "Fiction",
    mood: "Emotional",
    review: "Lost in the pages of this incredible story! Can't put it down. The character development is absolutely phenomenal 📚✨",
    likes: 124,
    comments: 23,
    shares: 12,
    liked: false,
    timeAgo: "2 hours ago",
    readingStatus: "reading",
    nearbyReaders: 15
  },
  {
    id: 2,
    username: "readingwithraj",
    userLocation: "Mumbai, India",
    bookCover: "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=400&h=600&fit=crop",
    bookTitle: "Atomic Habits",
    bookAuthor: "James Clear",
    genre: "Self-Help",
    mood: "Motivated",
    review: "My cozy reading corner is ready for tonight's chapter marathon. This book is changing my perspective on habit formation! 🌙",
    likes: 89,
    comments: 15,
    shares: 8,
    liked: true,
    timeAgo: "4 hours ago",
    readingStatus: "reading",
    nearbyReaders: 32
  },
  {
    id: 3,
    username: "litlover_anna",
    userLocation: "London, UK",
    bookCover: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=600&fit=crop",
    bookTitle: "The Midnight Library",
    bookAuthor: "Matt Haig",
    genre: "Philosophy",
    mood: "Contemplative",
    review: "Nothing beats a good book and a cup of coffee on a rainy day. This book is making me think about life choices in a whole new way ☕",
    likes: 156,
    comments: 31,
    shares: 19,
    liked: false,
    timeAgo: "6 hours ago",
    readingStatus: "finished",
    nearbyReaders: 8
  }
];

export const ReadingFeed = () => {
  const [posts, setPosts] = useState(socialPosts);
  const [selectedUser, setSelectedUser] = useState<ReadingPost['user'] | null>(null);
  const { toast } = useToast();

  const handleLike = (postId: number) => {
    setPosts(posts.map(post => 
      post.id === postId 
        ? { 
            ...post, 
            liked: !post.liked, 
            likes: post.liked ? post.likes - 1 : post.likes + 1 
          }
        : post
    ));
  };

  const handleComment = (postId: number) => {
    toast({
      title: "Comments",
      description: "Comment feature coming soon!",
    });
  };

  const handleShare = (post: ReadingPost, platform?: string) => {
    if (platform) {
      toast({
        title: `Shared to ${platform}`,
        description: `"${post.bookTitle}" has been shared to ${platform}!`,
      });
    } else {
      toast({
        title: "Share Options",
        description: "Choose your preferred platform to share this book!",
      });
    }
  };

  const handleJoinReadingGroup = (bookTitle: string) => {
    toast({
      title: "Reading Group",
      description: `Joining reading group for "${bookTitle}"!`,
    });
  };

  const handleFindNearbyReaders = (post: ReadingPost) => {
    toast({
      title: "Nearby Readers",
      description: `Found ${post.nearbyReaders} readers near ${post.userLocation} reading "${post.bookTitle}"`,
    });
  };

  const handleUserClick = (post: ReadingPost) => {
    // Mock user data for demonstration
    const mockUser = {
      id: `user_${post.id}`,
      name: post.username,
      username: post.username,
      email: `${post.username}@example.com`,
      bio: `Passionate reader from ${post.userLocation}. Love exploring new genres and sharing book recommendations!`,
      profile_picture_url: post.userAvatar,
      location: post.userLocation,
      joined_at: '2023-01-15T00:00:00.000Z',
      stories_written_count: Math.floor(Math.random() * 50),
      stories_read_count: Math.floor(Math.random() * 200) + 50,
      life_tags: ['Reading', 'Travel', 'Coffee Lover'],
    };
    setSelectedUser(mockUser);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'reading': return 'bg-blue-100 text-blue-800';
      case 'finished': return 'bg-green-100 text-green-800';
      case 'want-to-read': return 'bg-amber-100 text-amber-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'reading': return 'Currently Reading';
      case 'finished': return 'Finished';
      case 'want-to-read': return 'Want to Read';
      default: return status;
    }
  };

  return (
    <div className="space-y-6 relative z-10">
      {posts.map((post) => (
        <Card key={post.id} className="bg-white/95 backdrop-blur-sm border-amber-200 hover:shadow-lg transition-all duration-300 relative z-10">
          <CardContent className="p-6">
            {/* User Header */}
            <div className="flex items-center justify-between mb-4">
              <div 
                className="flex items-center space-x-3 cursor-pointer hover:bg-gray-50 rounded-lg p-2 -m-2 transition-colors"
                onClick={() => handleUserClick(post)}
              >
                <Avatar className="w-12 h-12">
                  <AvatarFallback className="bg-gradient-to-r from-amber-400 to-orange-500 text-white font-bold">
                    {post.username.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="font-semibold text-gray-900 hover:text-amber-600 transition-colors">{post.username}</h3>
                  <div className="flex items-center text-sm text-gray-500">
                    <MapPin className="w-3 h-3 mr-1" />
                    {post.userLocation} • {post.timeAgo}
                  </div>
                </div>
              </div>
              <Badge className={`${getStatusColor(post.readingStatus)} border-0`}>
                {getStatusLabel(post.readingStatus)}
              </Badge>
            </div>

            {/* Book Information */}
            <div className="flex gap-4 mb-4">
              <div className="flex-shrink-0">
                <img
                  src={post.bookCover}
                  alt={post.bookTitle}
                  className="w-24 h-32 object-cover rounded-lg shadow-md"
                />
              </div>
              <div className="flex-1">
                <h4 className="font-bold text-lg text-gray-900 mb-1">{post.bookTitle}</h4>
                <p className="text-gray-600 mb-2">by {post.bookAuthor}</p>
                <div className="flex gap-2 mb-3">
                  <Badge variant="outline" className="border-amber-300 text-amber-700">
                    {post.genre}
                  </Badge>
                  <Badge variant="outline" className="border-blue-300 text-blue-700">
                    {post.mood}
                  </Badge>
                </div>
                <p className="text-gray-700 text-sm leading-relaxed">{post.review}</p>
              </div>
            </div>

            {/* Action Buttons Row 1 */}
            <div className="flex flex-wrap gap-2 mb-4">
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleJoinReadingGroup(post.bookTitle)}
                className="border-amber-300 text-amber-700 hover:bg-amber-50"
              >
                <Users className="w-4 h-4 mr-1" />
                Join Reading Group
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleFindNearbyReaders(post)}
                className="border-blue-300 text-blue-700 hover:bg-blue-50"
              >
                <MapPin className="w-4 h-4 mr-1" />
                {post.nearbyReaders} nearby readers
              </Button>
            </div>

            {/* Social Sharing Options */}
            <div className="flex flex-wrap gap-2 mb-4 p-3 bg-gray-50 rounded-lg">
              <span className="text-sm text-gray-600 mr-2">Share to:</span>
              <Button size="sm" variant="ghost" onClick={() => handleShare(post, 'Facebook')} className="text-blue-600 hover:bg-blue-50">
                Facebook
              </Button>
              <Button size="sm" variant="ghost" onClick={() => handleShare(post, 'Instagram')} className="text-pink-600 hover:bg-pink-50">
                Instagram
              </Button>
              <Button size="sm" variant="ghost" onClick={() => handleShare(post, 'WhatsApp')} className="text-green-600 hover:bg-green-50">
                WhatsApp
              </Button>
              <Button size="sm" variant="ghost" onClick={() => handleShare(post, 'Snapchat')} className="text-yellow-600 hover:bg-yellow-50">
                Snapchat
              </Button>
            </div>

            {/* Engagement Stats and Actions */}
            <div className="flex items-center justify-between pt-3 border-t border-gray-100">
              <div className="flex items-center space-x-6">
                <button
                  onClick={() => handleLike(post.id)}
                  className={`flex items-center space-x-2 transition-colors ${
                    post.liked ? 'text-red-500' : 'text-gray-500 hover:text-red-500'
                  }`}
                >
                  <Heart className={`w-5 h-5 ${post.liked ? 'fill-current' : ''}`} />
                  <span className="font-medium">{post.likes}</span>
                </button>
                
                <button
                  onClick={() => handleComment(post.id)}
                  className="flex items-center space-x-2 text-gray-500 hover:text-amber-600 transition-colors"
                >
                  <MessageCircle className="w-5 h-5" />
                  <span className="font-medium">{post.comments}</span>
                </button>

                <button
                  onClick={() => handleShare(post)}
                  className="flex items-center space-x-2 text-gray-500 hover:text-blue-600 transition-colors"
                >
                  <Share2 className="w-5 h-5" />
                  <span className="font-medium">{post.shares}</span>
                </button>
              </div>
              
              <Button size="sm" variant="ghost" className="text-amber-600 hover:bg-amber-50">
                <BookOpen className="w-4 h-4 mr-1" />
                View Book Details
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}

      {/* User Profile Modal */}
      <UserProfileModal
        isOpen={!!selectedUser}
        onClose={() => setSelectedUser(null)}
        user={selectedUser || {
          id: '',
          name: '',
          username: '',
          email: '',
        }}
      />
    </div>
  );
};
