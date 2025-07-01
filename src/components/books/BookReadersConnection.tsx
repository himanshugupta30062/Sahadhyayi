
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Users, MapPin, MessageCircle, Heart, Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface BookReadersConnectionProps {
  bookId: string;
  bookTitle: string;
}

const BookReadersConnection = ({ bookId, bookTitle }: BookReadersConnectionProps) => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'reading' | 'completed' | 'want-to-read'>('reading');

  // Mock data for readers
  const readers = {
    reading: [
      {
        id: '1',
        username: 'sarah_bookworm',
        avatar: 'https://images.unsplash.com/photo-1494790108755-2616b69be66a?w=400&h=400&fit=crop',
        location: 'New York, USA',
        progress: 65,
        lastActive: '2 hours ago',
        currentChapter: 'Chapter 8: The Revelation',
        readingTime: '3h 45m today'
      },
      {
        id: '2',
        username: 'alex_reader',
        avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop',
        location: 'London, UK',
        progress: 42,
        lastActive: '1 day ago',
        currentChapter: 'Chapter 5: New Beginnings',
        readingTime: '2h 12m today'
      },
      {
        id: '3',
        username: 'bookish_maya',
        avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&h=400&fit=crop',
        location: 'Mumbai, India',
        progress: 78,
        lastActive: '5 hours ago',
        currentChapter: 'Chapter 10: Final Thoughts',
        readingTime: '1h 23m today'
      }
    ],
    completed: [
      {
        id: '4',
        username: 'literature_lover',
        avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=400&fit=crop',
        location: 'Paris, France',
        completedDate: '3 days ago',
        rating: 5,
        favoriteQuote: 'A beautiful story that touched my heart'
      },
      {
        id: '5',
        username: 'novel_ninja',
        avatar: 'https://images.unsplash.com/photo-1544723795-3fb6469f5b39?w=400&h=400&fit=crop',
        location: 'Tokyo, Japan',
        completedDate: '1 week ago',
        rating: 4,
        favoriteQuote: 'Incredible character development throughout'
      }
    ],
    'want-to-read': [
      {
        id: '6',
        username: 'future_reader',
        avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&h=400&fit=crop',
        location: 'Sydney, Australia',
        addedDate: '2 days ago',
        reason: 'Heard amazing reviews from friends'
      },
      {
        id: '7',
        username: 'next_chapter',
        avatar: 'https://images.unsplash.com/photo-1502685104226-ee32379fefbe?w=400&h=400&fit=crop',
        location: 'Toronto, Canada',
        addedDate: '1 day ago',
        reason: 'Love this author\'s previous works'
      }
    ]
  };

  const handleConnectWithCommunity = () => {
    navigate('/reviews');
  };

  const handleStartConversation = (username: string) => {
    navigate('/reviews', { state: { highlightUser: username } });
  };

  const getProgressColor = (progress: number) => {
    if (progress < 30) return 'bg-red-500';
    if (progress < 70) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const renderCurrentlyReading = () => (
    <div className="space-y-4">
      {readers.reading.map((reader) => (
        <div key={reader.id} className="bg-white/50 rounded-lg p-4 border border-amber-100">
          <div className="flex items-start gap-3">
            <Avatar className="w-12 h-12">
              <AvatarImage src={reader.avatar} alt={reader.username} />
              <AvatarFallback>{reader.username.charAt(0).toUpperCase()}</AvatarFallback>
            </Avatar>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-semibold text-gray-900">{reader.username}</h4>
                <Badge variant="secondary" className="text-xs">
                  {reader.progress}% complete
                </Badge>
              </div>
              
              <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                <MapPin className="w-3 h-3" />
                <span>{reader.location}</span>
                <span>•</span>
                <Clock className="w-3 h-3" />
                <span>{reader.lastActive}</span>
              </div>
              
              <div className="mb-3">
                <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                  <span>Reading Progress</span>
                  <span>{reader.progress}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full ${getProgressColor(reader.progress)}`}
                    style={{ width: `${reader.progress}%` }}
                  ></div>
                </div>
              </div>
              
              <div className="text-sm text-gray-600 mb-2">
                <div className="font-medium">{reader.currentChapter}</div>
                <div className="text-xs">📖 {reader.readingTime}</div>
              </div>
              
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleStartConversation(reader.username)}
                className="w-full border-amber-200 hover:border-amber-300 text-amber-700"
              >
                <MessageCircle className="w-3 h-3 mr-1" />
                Start Reading Discussion
              </Button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );

  const renderCompleted = () => (
    <div className="space-y-4">
      {readers.completed.map((reader) => (
        <div key={reader.id} className="bg-white/50 rounded-lg p-4 border border-green-100">
          <div className="flex items-start gap-3">
            <Avatar className="w-12 h-12">
              <AvatarImage src={reader.avatar} alt={reader.username} />
              <AvatarFallback>{reader.username.charAt(0).toUpperCase()}</AvatarFallback>
            </Avatar>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-semibold text-gray-900">{reader.username}</h4>
                <div className="flex items-center gap-1">
                  {[...Array(reader.rating)].map((_, i) => (
                    <Heart key={i} className="w-3 h-3 fill-red-500 text-red-500" />
                  ))}
                </div>
              </div>
              
              <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                <MapPin className="w-3 h-3" />
                <span>{reader.location}</span>
                <span>•</span>
                <span>Finished {reader.completedDate}</span>
              </div>
              
              <div className="text-sm text-gray-600 mb-3 italic">
                "{reader.favoriteQuote}"
              </div>
              
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleStartConversation(reader.username)}
                className="w-full border-green-200 hover:border-green-300 text-green-700"
              >
                <MessageCircle className="w-3 h-3 mr-1" />
                Discuss the Book
              </Button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );

  const renderWantToRead = () => (
    <div className="space-y-4">
      {readers['want-to-read'].map((reader) => (
        <div key={reader.id} className="bg-white/50 rounded-lg p-4 border border-blue-100">
          <div className="flex items-start gap-3">
            <Avatar className="w-12 h-12">
              <AvatarImage src={reader.avatar} alt={reader.username} />
              <AvatarFallback>{reader.username.charAt(0).toUpperCase()}</AvatarFallback>
            </Avatar>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-semibold text-gray-900">{reader.username}</h4>
                <Badge variant="outline" className="text-xs border-blue-200 text-blue-700">
                  Planning to read
                </Badge>
              </div>
              
              <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                <MapPin className="w-3 h-3" />
                <span>{reader.location}</span>
                <span>•</span>
                <span>Added {reader.addedDate}</span>
              </div>
              
              <div className="text-sm text-gray-600 mb-3">
                <span className="font-medium">Why they want to read:</span>
                <div className="italic">"{reader.reason}"</div>
              </div>
              
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleStartConversation(reader.username)}
                className="w-full border-blue-200 hover:border-blue-300 text-blue-700"
              >
                <MessageCircle className="w-3 h-3 mr-1" />
                Start Reading Together
              </Button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <Card className="bg-gradient-to-br from-amber-50 to-orange-50 border-amber-200">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-gray-900">
          <Users className="w-5 h-5 text-amber-600" />
          Connect with Fellow Readers
        </CardTitle>
        <p className="text-gray-600 text-sm">
          Find and connect with other readers who are enjoying "{bookTitle}"
        </p>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Tab Navigation */}
        <div className="flex flex-wrap gap-2 bg-white/60 p-1 rounded-lg">
          {[
            { key: 'reading', label: 'Currently Reading', count: readers.reading.length },
            { key: 'completed', label: 'Completed', count: readers.completed.length },
            { key: 'want-to-read', label: 'Want to Read', count: readers['want-to-read'].length }
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`flex-1 text-xs sm:text-sm px-3 py-2 rounded-md font-medium transition-colors ${
                activeTab === tab.key
                  ? 'bg-amber-600 text-white shadow-sm'
                  : 'text-gray-600 hover:text-amber-600 hover:bg-white/50'
              }`}
            >
              {tab.label} ({tab.count})
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="max-h-96 overflow-y-auto">
          {activeTab === 'reading' && renderCurrentlyReading()}
          {activeTab === 'completed' && renderCompleted()}
          {activeTab === 'want-to-read' && renderWantToRead()}
        </div>

        {/* Connect with Community Button */}
        <div className="pt-4 border-t border-amber-200">
          <Button
            onClick={handleConnectWithCommunity}
            className="w-full bg-amber-600 hover:bg-amber-700 text-white"
          >
            <Users className="w-4 h-4 mr-2" />
            Join Reading Community
          </Button>
          <p className="text-center text-xs text-gray-500 mt-2">
            Discover more readers and share your reading journey
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default BookReadersConnection;
