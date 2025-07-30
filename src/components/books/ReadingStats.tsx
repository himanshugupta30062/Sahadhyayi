
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Users, BookOpen, Eye, Share2, TrendingUp } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useBookStats } from '@/hooks/useBookStats';

interface ReadingStatsProps {
  bookId: string;
  bookTitle: string;
}

const ReadingStats: React.FC<ReadingStatsProps> = ({ bookId, bookTitle }) => {
  const { data: stats, isLoading } = useBookStats(bookId);
  const [showAllReaders, setShowAllReaders] = useState(false);

  if (isLoading) {
    return (
      <Card className="border-0 shadow-none">
        <CardContent className="p-6">
          <div className="animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-1/3 mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!stats) return null;

  return (
    <Card className="border-0 shadow-none">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-orange-900">
          <Users className="w-6 h-6 text-orange-600" />
          Reading Community
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Stats Grid */}
        <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp className="w-4 h-4 text-orange-600" />
            <span className="text-sm font-medium text-orange-800">Reading Statistics</span>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-4 bg-white rounded-lg border border-green-200">
              <div className="flex items-center justify-center gap-1 mb-2">
                <BookOpen className="w-5 h-5 text-green-600" />
                <span className="text-3xl font-bold text-green-600">{stats.currentReaders}</span>
              </div>
              <p className="text-sm text-gray-600 font-medium">Currently Reading</p>
            </div>
            <div className="text-center p-4 bg-white rounded-lg border border-blue-200">
              <div className="flex items-center justify-center gap-1 mb-2">
                <Eye className="w-5 h-5 text-blue-600" />
                <span className="text-3xl font-bold text-blue-600">{stats.pastReaders}</span>
              </div>
              <p className="text-sm text-gray-600 font-medium">Have Read</p>
            </div>
          </div>
        </div>

        {/* Recent Readers */}
        <div>
          <h4 className="font-semibold mb-4 flex items-center gap-2 text-gray-800">
            <Users className="w-5 h-5 text-orange-600" />
            Recent Readers
          </h4>
          <div className="space-y-3 mb-4">
            {stats.readers.slice(0, showAllReaders ? stats.readers.length : 3).map((reader) => (
              <div key={reader.id} className="flex items-center justify-between bg-gradient-to-r from-gray-50 to-orange-50 px-4 py-3 rounded-lg border border-orange-100">
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10 border-2 border-orange-200">
                    <AvatarImage src={reader.avatar || ''} alt={reader.name} />
                    <AvatarFallback className="bg-orange-100 text-orange-700 font-semibold">
                      {reader.name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-sm font-medium text-gray-800">{reader.name}</span>
                </div>
                <Badge 
                  variant={reader.status === 'reading' ? 'default' : 'secondary'} 
                  className={`text-xs ${reader.status === 'reading' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'}`}
                >
                  {reader.status === 'reading' ? 'Reading' : 'Completed'}
                </Badge>
              </div>
            ))}
          </div>
          
          <div className="flex gap-3">
            {stats.readers.length > 3 && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowAllReaders(!showAllReaders)}
                className="text-orange-700 border-orange-300 hover:bg-orange-50"
              >
                {showAllReaders ? 'Show Less' : `View All ${stats.readers.length} Readers`}
              </Button>
            )}
            <Link to="/social" className="flex-1">
              <Button size="sm" className="bg-orange-600 hover:bg-orange-700 w-full">
                <Share2 className="w-4 h-4 mr-2" />
                Connect with Readers
              </Button>
            </Link>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ReadingStats;
