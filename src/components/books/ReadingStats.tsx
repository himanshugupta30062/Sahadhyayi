
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Users, BookOpen, Eye, Share2 } from 'lucide-react';
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
      <Card>
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
    <Card className="bg-gradient-to-br from-orange-50 to-yellow-50 border-orange-200">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-orange-900">
          <Users className="w-5 h-5" />
          Reading Community
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center p-3 bg-white rounded-lg border border-orange-200">
            <div className="flex items-center justify-center gap-1 mb-1">
              <BookOpen className="w-4 h-4 text-green-600" />
              <span className="text-2xl font-bold text-green-600">{stats.currentReaders}</span>
            </div>
            <p className="text-sm text-gray-600">Currently Reading</p>
          </div>
          <div className="text-center p-3 bg-white rounded-lg border border-orange-200">
            <div className="flex items-center justify-center gap-1 mb-1">
              <Eye className="w-4 h-4 text-blue-600" />
              <span className="text-2xl font-bold text-blue-600">{stats.pastReaders}</span>
            </div>
            <p className="text-sm text-gray-600">Have Read</p>
          </div>
        </div>

        <div>
          <h4 className="font-semibold mb-3 flex items-center gap-2">
            <Users className="w-4 h-4" />
            Recent Readers
          </h4>
          <div className="space-y-2 mb-3">
            {stats.readers.slice(0, showAllReaders ? stats.readers.length : 3).map((reader) => (
              <div key={reader.id} className="flex items-center justify-between bg-white px-3 py-2 rounded border border-orange-100">
                <div className="flex items-center gap-2">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={reader.avatar || ''} alt={reader.name} />
                    <AvatarFallback>{reader.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <span className="text-sm font-medium">{reader.name}</span>
                </div>
                <Badge variant={reader.status === 'reading' ? 'default' : 'secondary'} className="text-xs">
                  {reader.status === 'reading' ? 'Reading' : 'Completed'}
                </Badge>
              </div>
            ))}
          </div>
          
          <div className="flex gap-2">
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
            <Link to="/reviews">
              <Button size="sm" className="bg-orange-600 hover:bg-orange-700">
                <Share2 className="w-4 h-4 mr-1" />
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
