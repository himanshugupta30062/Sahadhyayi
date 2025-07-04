
import { useState } from "react";
import { Book, Users, UserPlus, MessageSquare, Facebook, Instagram, MapPin, Plus } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { FloatingChat } from "./FloatingChat";

interface BookshelfItem {
  id: string;
  title: string;
  author: string;
  cover: string;
  status: 'reading' | 'read' | 'want-to-read';
}

interface Friend {
  id: string;
  name: string;
  avatar?: string;
  currentBook: string;
  isOnline: boolean;
  mutualFriends?: number;
  location?: string;
}

interface ReadingGroup {
  id: string;
  name: string;
  coverImage: string;
  description: string;
  memberCount: number;
  isJoined: boolean;
}

const myBooks: BookshelfItem[] = [
  {
    id: '1',
    title: 'Atomic Habits',
    author: 'James Clear',
    cover: 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=200&h=300&fit=crop',
    status: 'reading'
  },
  {
    id: '2',
    title: 'The Midnight Library',
    author: 'Matt Haig',
    cover: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=300&fit=crop',
    status: 'want-to-read'
  },
  {
    id: '3',
    title: 'Sapiens',
    author: 'Yuval Harari',
    cover: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=200&h=300&fit=crop',
    status: 'read'
  }
];

const friends: Friend[] = [
  { 
    id: '1', 
    name: 'Alice Reader', 
    currentBook: 'The Great Gatsby', 
    isOnline: true,
    mutualFriends: 12,
    location: 'New York'
  },
  { 
    id: '2', 
    name: 'Bob Bookworm', 
    currentBook: 'Sapiens', 
    isOnline: true,
    mutualFriends: 8,
    location: 'San Francisco'
  },
  { 
    id: '3', 
    name: 'Carol Pages', 
    currentBook: '1984', 
    isOnline: false,
    mutualFriends: 15,
    location: 'London'
  },
  { 
    id: '4', 
    name: 'Dan Stories', 
    currentBook: 'Pride and Prejudice', 
    isOnline: true,
    mutualFriends: 6,
    location: 'Toronto'
  },
  { 
    id: '5', 
    name: 'Emma Novel', 
    currentBook: 'Dune', 
    isOnline: false,
    mutualFriends: 20,
    location: 'Sydney'
  },
  { 
    id: '6', 
    name: 'Frank Chapter', 
    currentBook: 'The Hobbit', 
    isOnline: true,
    mutualFriends: 4,
    location: 'Berlin'
  }
];

const readingGroups: ReadingGroup[] = [
  {
    id: '1',
    name: 'Classic Literature Club',
    coverImage: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop',
    description: 'Discussing timeless classics',
    memberCount: 234,
    isJoined: true
  },
  {
    id: '2',
    name: 'Sci-Fi Enthusiasts',
    coverImage: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=100&h=100&fit=crop',
    description: 'Exploring the future through books',
    memberCount: 189,
    isJoined: false
  }
];

export const LeftSidebar = () => {
  const [bookshelf, setBookshelf] = useState(myBooks);
  const [groups, setGroups] = useState(readingGroups);
  const { toast } = useToast();

  const handleStatusChange = (bookId: string, newStatus: BookshelfItem['status']) => {
    setBookshelf(bookshelf.map(book => 
      book.id === bookId ? { ...book, status: newStatus } : book
    ));
    toast({
      title: "Book Status Updated",
      description: "Your reading progress has been updated!",
    });
  };

  const handleJoinGroup = (groupId: string) => {
    setGroups(groups.map(group => 
      group.id === groupId ? { ...group, isJoined: !group.isJoined } : group
    ));
    toast({
      title: "Reading Group",
      description: "Successfully joined the reading group!",
    });
  };

  const handleFriendClick = (friendId: string, friendName: string) => {
    // Navigate to friend's profile
    toast({
      title: "Profile",
      description: `Opening ${friendName}'s profile...`,
    });
    // In a real app, this would navigate to: /profile/${friendId}
  };

  const handleConnectAccount = (platform: string) => {
    toast({
      title: `Connect ${platform}`,
      description: `${platform} account connection coming soon!`,
    });
  };

  const getStatusColor = (status: BookshelfItem['status']) => {
    switch (status) {
      case 'reading': return 'bg-blue-100 text-blue-800';
      case 'read': return 'bg-green-100 text-green-800';
      case 'want-to-read': return 'bg-amber-100 text-amber-800';
    }
  };

  const getStatusLabel = (status: BookshelfItem['status']) => {
    switch (status) {
      case 'reading': return 'Reading';
      case 'read': return 'Read';
      case 'want-to-read': return 'Want to Read';
    }
  };

  return (
    <div className="space-y-6">
      {/* Book Friends Section - Facebook Style */}
      <Card className="bg-white/90 backdrop-blur-sm border-amber-200">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg text-gray-900 flex items-center gap-2">
            <Users className="w-5 h-5 text-amber-600" />
            Book Friends
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {friends.map((friend) => (
            <div 
              key={friend.id} 
              onClick={() => handleFriendClick(friend.id, friend.name)}
              className="flex items-center space-x-3 p-3 hover:bg-amber-50 rounded-lg transition-all duration-200 cursor-pointer group border border-transparent hover:border-amber-200"
            >
              <div className="relative">
                <Avatar className="w-12 h-12 border-2 border-white shadow-sm">
                  <AvatarFallback className="bg-gradient-to-br from-amber-400 to-orange-500 text-white font-semibold">
                    {friend.name.split(' ').map(n => n[0]).join('')}
                  </AvatarFallback>
                </Avatar>
                {friend.isOnline && (
                  <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-white rounded-full"></div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-semibold text-sm text-gray-900 truncate group-hover:text-amber-700 transition-colors">
                    {friend.name}
                  </p>
                  {friend.isOnline && (
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  )}
                </div>
                <p className="text-xs text-gray-600 truncate">
                  Reading: {friend.currentBook}
                </p>
                <div className="flex items-center gap-2 mt-1">
                  {friend.location && (
                    <p className="text-xs text-gray-500 flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      {friend.location}
                    </p>
                  )}
                  {friend.mutualFriends && (
                    <p className="text-xs text-gray-500">
                      {friend.mutualFriends} mutual friends
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))}
          <Button size="sm" variant="outline" className="w-full border-amber-300 text-amber-700 hover:bg-amber-50 mt-3">
            <UserPlus className="w-4 h-4 mr-1" />
            Find More Friends
          </Button>
        </CardContent>
      </Card>

      {/* My Bookshelf */}
      <Card className="bg-white/90 backdrop-blur-sm border-amber-200">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg text-gray-900 flex items-center gap-2">
            <Book className="w-5 h-5 text-amber-600" />
            My Bookshelf
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {bookshelf.map((book) => (
            <div key={book.id} className="flex items-center space-x-3 p-2 hover:bg-amber-50 rounded-lg transition-colors">
              <img
                src={book.cover}
                alt={book.title}
                className="w-12 h-16 object-cover rounded shadow-sm"
              />
              <div className="flex-1 min-w-0">
                <h4 className="font-semibold text-sm text-gray-900 truncate">{book.title}</h4>
                <p className="text-xs text-gray-600 truncate">{book.author}</p>
                <Badge className={`${getStatusColor(book.status)} text-xs mt-1`}>
                  {getStatusLabel(book.status)}
                </Badge>
              </div>
            </div>
          ))}
          <Button size="sm" variant="outline" className="w-full border-amber-300 text-amber-700 hover:bg-amber-50">
            <Plus className="w-4 h-4 mr-1" />
            Add Book
          </Button>
        </CardContent>
      </Card>

      {/* Reading Groups */}
      <Card className="bg-white/90 backdrop-blur-sm border-amber-200">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg text-gray-900 flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-amber-600" />
            Reading Groups
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {groups.map((group) => (
            <div key={group.id} className="p-3 border border-gray-200 rounded-lg hover:border-amber-300 transition-colors">
              <div className="flex items-start space-x-3 mb-2">
                <img
                  src={group.coverImage}
                  alt={group.name}
                  className="w-12 h-12 object-cover rounded-lg"
                />
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-sm text-gray-900">{group.name}</h4>
                  <p className="text-xs text-gray-600 mb-1">{group.description}</p>
                  <p className="text-xs text-gray-500">{group.memberCount} members</p>
                </div>
              </div>
              <Button
                size="sm"
                variant={group.isJoined ? "outline" : "default"}
                onClick={() => handleJoinGroup(group.id)}
                className={`w-full ${group.isJoined 
                  ? "border-green-300 text-green-700 hover:bg-green-50" 
                  : "bg-amber-600 hover:bg-amber-700 text-white"
                }`}
              >
                {group.isJoined ? "Joined" : "Join Group"}
              </Button>
            </div>
          ))}
          <Button size="sm" variant="outline" className="w-full border-amber-300 text-amber-700 hover:bg-amber-50">
            <Plus className="w-4 h-4 mr-1" />
            Create Group
          </Button>
        </CardContent>
      </Card>

      {/* Connect Accounts */}
      <Card className="bg-white/90 backdrop-blur-sm border-amber-200">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg text-gray-900">Connect Accounts</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleConnectAccount('Facebook')}
            className="w-full justify-start border-blue-300 text-blue-700 hover:bg-blue-50"
          >
            <Facebook className="w-4 h-4 mr-2" />
            Connect Facebook
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleConnectAccount('Instagram')}
            className="w-full justify-start border-pink-300 text-pink-700 hover:bg-pink-50"
          >
            <Instagram className="w-4 h-4 mr-2" />
            Connect Instagram
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleConnectAccount('WhatsApp')}
            className="w-full justify-start border-green-300 text-green-700 hover:bg-green-50"
          >
            <MessageSquare className="w-4 h-4 mr-2" />
            Connect WhatsApp
          </Button>
        </CardContent>
      </Card>

      {/* Messages Section */}
      <Card className="bg-white/90 backdrop-blur-sm border-amber-200">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg text-gray-900">Messages</CardTitle>
        </CardHeader>
        <CardContent>
          <FloatingChat />
        </CardContent>
      </Card>
    </div>
  );
};
