
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { MapPin, Globe, Eye, EyeOff, Users } from 'lucide-react';

interface ReadingData {
  country: string;
  readers: number;
  percentage: number;
}

const mockReadingData: ReadingData[] = [
  { country: 'United States', readers: 1250, percentage: 35.2 },
  { country: 'United Kingdom', readers: 890, percentage: 25.1 },
  { country: 'Canada', readers: 567, percentage: 16.0 },
  { country: 'Australia', readers: 423, percentage: 11.9 },
  { country: 'India', readers: 312, percentage: 8.8 }
];

const mockFriendsReading = [
  { name: 'Sarah Johnson', location: 'New York, USA', books: ['Atomic Habits', 'The Seven Husbands'] },
  { name: 'Mike Chen', location: 'Toronto, Canada', books: ['The Midnight Library'] }
];

export const ReadingMap = () => {
  const [selectedBook, setSelectedBook] = useState('atomic-habits');
  const [mapView, setMapView] = useState('world');
  const [showMyLocation, setShowMyLocation] = useState(true);

  const totalReaders = mockReadingData.reduce((sum, data) => sum + data.readers, 0);

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Controls */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-white shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Select Book</CardTitle>
          </CardHeader>
          <CardContent>
            <Select value={selectedBook} onValueChange={setSelectedBook}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="atomic-habits">Atomic Habits</SelectItem>
                <SelectItem value="seven-husbands">The Seven Husbands of Evelyn Hugo</SelectItem>
                <SelectItem value="midnight-library">The Midnight Library</SelectItem>
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        <Card className="bg-white shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Map View</CardTitle>
          </CardHeader>
          <CardContent>
            <Select value={mapView} onValueChange={setMapView}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="world">World</SelectItem>
                <SelectItem value="country">Country</SelectItem>
                <SelectItem value="city">City</SelectItem>
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        <Card className="bg-white shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Privacy</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              <Switch
                checked={showMyLocation}
                onCheckedChange={setShowMyLocation}
              />
              <div className="flex items-center gap-1">
                {showMyLocation ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                <span className="text-sm">Show my location</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Map Visualization */}
      <Card className="bg-white shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="w-5 h-5" />
            Global Reading Map
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-96 bg-gradient-to-br from-blue-50 to-green-50 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center relative overflow-hidden">
            <div className="text-center">
              <Globe className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 font-medium">Interactive World Map</p>
              <p className="text-sm text-gray-500">Showing readers of "Atomic Habits"</p>
            </div>
            
            {/* Mock Map Points */}
            <div className="absolute inset-0">
              {mockReadingData.map((data, index) => (
                <div
                  key={data.country}
                  className="absolute w-4 h-4 bg-red-500 rounded-full cursor-pointer transition-all hover:scale-150"
                  style={{
                    left: `${20 + index * 15}%`,
                    top: `${30 + index * 10}%`,
                  }}
                  title={`${data.country}: ${data.readers} readers`}
                />
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Reading Statistics */}
        <Card className="bg-white shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              Reading Statistics
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center p-4 bg-amber-50 rounded-lg">
              <div className="text-3xl font-bold text-amber-800">{totalReaders.toLocaleString()}</div>
              <div className="text-sm text-amber-600">Total Readers Globally</div>
            </div>
            
            <div className="space-y-3">
              <h4 className="font-medium text-gray-900">Top 5 Countries</h4>
              {mockReadingData.map((data, index) => (
                <div key={data.country} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Badge variant="outline" className="w-6 h-6 p-0 justify-center">
                      {index + 1}
                    </Badge>
                    <span className="font-medium">{data.country}</span>
                  </div>
                  <div className="text-right">
                    <div className="font-medium">{data.readers.toLocaleString()}</div>
                    <div className="text-sm text-gray-500">{data.percentage}%</div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Friends Reading */}
        <Card className="bg-white shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="w-5 h-5" />
              Friends Reading This Book
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {mockFriendsReading.map((friend, index) => (
                <div key={index} className="p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-gray-900">{friend.name}</h4>
                    <span className="text-sm text-gray-500">{friend.location}</span>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {friend.books.map((book) => (
                      <Badge key={book} variant="outline" className="text-xs">
                        {book}
                      </Badge>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
