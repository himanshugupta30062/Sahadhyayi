
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { MapPin, Users, BookOpen, MessageCircle } from 'lucide-react';
import { ModernGoogleMap } from './ModernGoogleMap';

interface Reader {
  id: string;
  name: string;
  location: string;
  avatar: string;
  currentBook: string;
  genre: string;
  distance: string;
  isOnline: boolean;
  mutualFriends: number;
}

const mockReaders: Reader[] = [
  {
    id: '1',
    name: 'Alex Kumar',
    location: 'New York, NY',
    avatar: 'https://via.placeholder.com/40/40/orange/white?text=A',
    currentBook: 'The Seven Husbands of Evelyn Hugo',
    genre: 'Fiction',
    distance: '2.3 km away',
    isOnline: true,
    mutualFriends: 3
  },
  {
    id: '2',
    name: 'Emma Wilson',
    location: 'Brooklyn, NY',
    avatar: 'https://via.placeholder.com/40/40/orange/white?text=E',
    currentBook: 'Atomic Habits',
    genre: 'Self-Help',
    distance: '5.1 km away',
    isOnline: false,
    mutualFriends: 1
  },
  {
    id: '3',
    name: 'David Chen',
    location: 'Manhattan, NY',
    avatar: 'https://via.placeholder.com/40/40/orange/white?text=D',
    currentBook: 'Dune',
    genre: 'Sci-Fi',
    distance: '8.7 km away',
    isOnline: true,
    mutualFriends: 0
  }
];

export const ReadingMap = () => {
  const [readers, setReaders] = useState<Reader[]>(mockReaders);
  const [selectedGenre, setSelectedGenre] = useState<string>('all');

  const genres = ['all', 'Fiction', 'Self-Help', 'Sci-Fi', 'Mystery', 'Romance', 'History'];

  const filteredReaders = selectedGenre === 'all' 
    ? readers 
    : readers.filter(reader => reader.genre === selectedGenre);

  const handleReaderClick = (reader: any) => {
    console.log('Reader clicked:', reader);
    // Handle reader click - could open a modal or navigate to profile
  };

  return (
    <div className="space-y-6">
      {/* Modern Google Maps Integration */}
      <ModernGoogleMap />

      {/* Genre Filter */}
      <Card className="bg-white shadow-sm border-0 rounded-xl">
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-2">
            <span className="flex items-center text-sm text-gray-600 mr-3">
              <BookOpen className="w-4 h-4 mr-1" />
              Filter by genre:
            </span>
            {genres.map((genre) => (
              <Button
                key={genre}
                variant={selectedGenre === genre ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedGenre(genre)}
                className={selectedGenre === genre 
                  ? "bg-orange-600 hover:bg-orange-700 rounded-xl" 
                  : "border-orange-300 text-orange-700 hover:bg-orange-50 rounded-xl"
                }
              >
                {genre === 'all' ? 'All Genres' : genre}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Readers List */}
      <div className="space-y-3">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <Users className="w-5 h-5 text-orange-600" />
          Book Lovers in Your Area ({filteredReaders.length})
        </h3>
        {filteredReaders.map((reader) => (
          <Card key={reader.id} className="bg-white shadow-sm border-0 rounded-xl">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="relative">
                    <Avatar className="w-12 h-12">
                      <AvatarImage src={reader.avatar} />
                      <AvatarFallback className="bg-gradient-to-r from-orange-400 to-amber-500 text-white">
                        {reader.name.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    {reader.isOnline && (
                      <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-white rounded-full"></div>
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium text-gray-900">{reader.name}</h4>
                      {reader.mutualFriends > 0 && (
                        <Badge variant="outline" className="text-xs">
                          <Users className="w-3 h-3 mr-1" />
                          {reader.mutualFriends} mutual
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-gray-500 flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      {reader.location} • {reader.distance}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <BookOpen className="w-3 h-3 text-orange-600" />
                      <span className="text-sm text-gray-700">{reader.currentBook}</span>
                      <Badge variant="secondary" className="text-xs">
                        {reader.genre}
                      </Badge>
                    </div>
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  <Button size="sm" className="bg-orange-600 hover:bg-orange-700 rounded-xl">
                    Connect
                  </Button>
                  <Button size="sm" variant="outline" className="border-orange-300 text-orange-700 rounded-xl">
                    <MessageCircle className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredReaders.length === 0 && (
        <Card className="bg-white shadow-sm border-0 rounded-xl">
          <CardContent className="p-8 text-center">
            <MapPin className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="font-medium text-gray-900 mb-2">No readers found</h3>
            <p className="text-gray-500">
              Try adjusting your genre filter or check back later for new readers in your area.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
