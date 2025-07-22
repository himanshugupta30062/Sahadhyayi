
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MapPin, Users, BookOpen, Navigation, Share2, Check } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { getCurrentLocation, calculateDistance } from '@/lib/locationService';
import { useLocationSharing } from '@/hooks/useLocationSharing';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface Reader {
  id: string;
  name: string;
  book: string;
  lat: number;
  lng: number;
  updated_at: string;
  user_id?: string;
  distance?: number;
}

export const ImprovedReadersMap = () => {
  const { user } = useAuth();
  const { shareLocationForBook, isSharing } = useLocationSharing();
  const [readers, setReaders] = useState<Reader[]>([]);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [isLocationShared, setIsLocationShared] = useState(false);
  const [selectedBook, setSelectedBook] = useState('');
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);

  useEffect(() => {
    fetchReaders();
    checkLocationStatus();
  }, []);

  const fetchReaders = async () => {
    try {
      const { data, error } = await supabase
        .from('readers')
        .select('*')
        .order('updated_at', { ascending: false });

      if (error) {
        console.error('Error fetching readers:', error);
        return;
      }

      setReaders(data || []);
    } catch (error) {
      console.error('Error in fetchReaders:', error);
    }
  };

  const checkLocationStatus = async () => {
    if (!user) return;

    try {
      const { data } = await supabase
        .from('readers')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      setIsLocationShared(!!data);
      if (data) {
        setSelectedBook(data.book);
        setUserLocation({ lat: data.lat, lng: data.lng });
      }
    } catch (error) {
      console.error('Error checking location status:', error);
    }
  };

  const handleShareLocation = async () => {
    if (!selectedBook.trim()) {
      toast.error('Please enter the book you\'re reading');
      return;
    }

    setIsLoadingLocation(true);
    try {
      const location = await getCurrentLocation();
      
      const { error } = await supabase
        .from('readers')
        .upsert({
          user_id: user?.id,
          name: user?.user_metadata?.full_name || user?.email || 'Anonymous Reader',
          book: selectedBook,
          lat: location.lat,
          lng: location.lng,
          updated_at: new Date().toISOString(),
        });

      if (error) throw error;

      setUserLocation(location);
      setIsLocationShared(true);
      fetchReaders();
      toast.success('Location shared successfully!');
    } catch (error: any) {
      console.error('Error sharing location:', error);
      if (error.code === 1) {
        toast.error('Location access denied. Please enable location services.');
      } else {
        toast.error('Failed to share location. Please try again.');
      }
    } finally {
      setIsLoadingLocation(false);
    }
  };

  const handleStopSharing = async () => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('readers')
        .delete()
        .eq('user_id', user.id);

      if (error) throw error;

      setIsLocationShared(false);
      setUserLocation(null);
      setSelectedBook('');
      fetchReaders();
      toast.success('Stopped sharing location');
    } catch (error) {
      console.error('Error stopping location share:', error);
      toast.error('Failed to stop sharing location');
    }
  };

  const calculateReadersWithDistance = () => {
    if (!userLocation) return readers;

    return readers.map(reader => ({
      ...reader,
      distance: calculateDistance(userLocation, { lat: reader.lat, lng: reader.lng })
    })).sort((a, b) => (a.distance || 0) - (b.distance || 0));
  };

  const formatDistance = (distance?: number) => {
    if (!distance) return '';
    if (distance < 1) return `${Math.round(distance * 1000)}m away`;
    return `${distance.toFixed(1)}km away`;
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));

    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return date.toLocaleDateString();
  };

  const readersWithDistance = calculateReadersWithDistance();

  return (
    <div className="space-y-6">
      {/* Location Sharing Card */}
      <Card className="bg-gradient-to-r from-blue-50 to-cyan-50 border-blue-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-blue-800">
            <MapPin className="w-5 h-5" />
            Share Your Reading Location
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {!isLocationShared ? (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  What book are you reading?
                </label>
                <input
                  type="text"
                  value={selectedBook}
                  onChange={(e) => setSelectedBook(e.target.value)}
                  placeholder="Enter the book title..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div className="bg-blue-100 border border-blue-200 rounded-lg p-3">
                <p className="text-sm text-blue-700">
                  📍 Share your location to connect with nearby readers and discover reading communities in your area.
                </p>
              </div>
              <Button 
                onClick={handleShareLocation}
                disabled={isLoadingLocation || !selectedBook.trim()}
                className="w-full bg-blue-600 hover:bg-blue-700"
              >
                {isLoadingLocation ? (
                  <>
                    <Navigation className="w-4 h-4 mr-2 animate-spin" />
                    Getting Location...
                  </>
                ) : (
                  <>
                    <Share2 className="w-4 h-4 mr-2" />
                    Share My Location
                  </>
                )}
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-green-700 bg-green-100 p-3 rounded-lg">
                <Check className="w-5 h-5" />
                <div>
                  <p className="font-medium">Location shared successfully!</p>
                  <p className="text-sm">Reading: {selectedBook}</p>
                </div>
              </div>
              <Button 
                onClick={handleStopSharing}
                variant="outline"
                className="w-full border-red-300 text-red-700 hover:bg-red-50"
              >
                Stop Sharing Location
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Readers List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Readers Near You ({readersWithDistance.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {readersWithDistance.length > 0 ? (
            <div className="space-y-4">
              {readersWithDistance.map((reader) => (
                <div key={reader.id} className="flex items-start gap-4 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                  <div className="w-12 h-12 bg-gradient-to-r from-orange-400 to-amber-500 rounded-full flex items-center justify-center text-white font-semibold">
                    {reader.name.charAt(0).toUpperCase()}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900 truncate">
                          {reader.name}
                        </h4>
                        <div className="flex items-center gap-2 mt-1">
                          <BookOpen className="w-4 h-4 text-gray-500" />
                          <p className="text-sm text-gray-600 truncate">
                            {reader.book}
                          </p>
                        </div>
                        <div className="flex items-center gap-4 mt-2">
                          {reader.distance && (
                            <Badge variant="secondary" className="text-xs">
                              <MapPin className="w-3 h-3 mr-1" />
                              {formatDistance(reader.distance)}
                            </Badge>
                          )}
                          <span className="text-xs text-gray-500">
                            {formatTimeAgo(reader.updated_at)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <MapPin className="w-16 h-16 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                No Readers Found
              </h3>
              <p className="text-gray-600 mb-4">
                Be the first to share your reading location in this area!
              </p>
              {!isLocationShared && (
                <p className="text-sm text-gray-500">
                  Share your location above to connect with nearby readers.
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
