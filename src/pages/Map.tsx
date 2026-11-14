import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import SEO from '@/components/SEO';
import { supabase } from '@/integrations/supabase/client-universal';
import { useFriends } from '@/hooks/useFriends';
import { BookFilterDropdown } from '@/components/social/BookFilterDropdown';
import { MapplsMap, type MapplsPoint } from '@/components/maps/MapplsMap';
import { BitmojiCreator } from '@/components/social/BitmojiCreator';
import { useUserAvatar } from '@/hooks/useUserAvatar';
import { MAPPLS_API_KEY } from '@/config/mappls';
import { getMyLocationSharingState } from '@/lib/locationSharingService';
import { useAuth } from '@/contexts/authHelpers';
import {
  BookOpen,
  Compass,
  Eye,
  EyeOff,
  MapPin,
  MessageCircle,
  Palette,
  Radio,
  Sparkles,
  Users,
  Zap,
} from 'lucide-react';

interface ReaderLocation {
  latitude: number | null;
  longitude: number | null;
  user_id: string;
  profiles?: {
    full_name: string | null;
    username: string | null;
  };
  avatar_img_url?: string | null;
  distance?: number;
  reading_since?: string | null;
}

interface BookOption {
  id: string;
  title: string;
  author?: string;
  cover_image_url?: string;
}

const MapPage = () => {
  const [tab, setTab] = useState<'readers' | 'friends'>('readers');
  const [readers, setReaders] = useState<ReaderLocation[]>([]);
  const [readersLoading, setReadersLoading] = useState(false);
  const [readersError, setReadersError] = useState<string | null>(null);
  const [selectedBook, setSelectedBook] = useState<BookOption | null>(null);
  const [currentLocation, setCurrentLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locationSharingEnabled, setLocationSharingEnabled] = useState(false);
  const [locationConsentChecked, setLocationConsentChecked] = useState(false);
  const [showBitmojiCreator, setShowBitmojiCreator] = useState(false);
  const { user } = useAuth();
  const { data: userAvatar } = useUserAvatar();

  const friendsQuery = useFriends();

  // Use only the location the signed-in user has already chosen to share.
  // Opening this page must never trigger a new GPS permission prompt.
  useEffect(() => {
    let active = true;
    const loadSharingState = async () => {
      setLocationConsentChecked(false);
      setLocationSharingEnabled(false);
      setCurrentLocation(null);
      if (!user?.id) {
        setLocationConsentChecked(true);
        return;
      }
      const locationState = await getMyLocationSharingState(user.id);
      if (!active) return;
      setLocationSharingEnabled(locationState.isSharing && locationState.location !== null);
      setCurrentLocation(locationState.isSharing ? locationState.location : null);
      setLocationConsentChecked(true);
    };
    void loadSharingState().catch((error) => {
      console.error('Failed to check saved location-sharing state', { errorName: error instanceof Error ? error.name : 'UnknownError' });
      if (active) setLocationConsentChecked(true);
    });
    return () => { active = false; };
  }, [user?.id]);

  useEffect(() => {
    let cancelled = false;

    if (!selectedBook?.id || !locationSharingEnabled) {
      setReaders([]);
      setReadersError(null);
      setReadersLoading(false);
      return;
    }

    const fetchReaders = async () => {
      setReadersLoading(true);
      setReadersError(null);
      try {
        const { data, error } = await supabase.rpc('get_nearby_book_readers', {
          book_uuid: selectedBook.id,
          radius_km: 10,
        });

        if (cancelled) return;
        if (error) {
          console.error('Failed to fetch nearby readers', { errorName: error.name });
          setReadersError('Unable to load nearby readers. Check location-sharing permissions and try again.');
          setReaders([]);
          return;
        }

        // The RPC returns coarse coordinates and avatar URLs only for mutually
        // consenting friends, so map pins never expose exact peer locations.
        const readerList = (data || []).map((reader: any) => ({
          user_id: reader.reader_id,
          latitude: reader.approximate_latitude == null ? null : Number(reader.approximate_latitude),
          longitude: reader.approximate_longitude == null ? null : Number(reader.approximate_longitude),
          avatar_img_url: reader.avatar_img_url ?? null,
          profiles: {
            full_name: reader.reader_name ?? null,
            username: (reader.reader_name || 'reader').toLowerCase().replace(/\\s+/g, '_'),
          },
          distance: reader.distance_km,
          reading_since: reader.reading_since,
        }));
        setReaders(readerList);
        if (readerList.length === 0) {
          setReadersError(null);
        }
      } catch (error) {
        if (cancelled) return;
        console.error('Nearby readers request failed', { errorName: error instanceof Error ? error.name : 'UnknownError' });
        setReadersError('Failed to fetch readers. Please try again.');
        setReaders([]);
      } finally {
        if (!cancelled) setReadersLoading(false);
      }
    };

    void fetchReaders();
    return () => {
      cancelled = true;
    };
  }, [selectedBook?.id, locationSharingEnabled]);

  // Sync reader book location so other users reading this book can discover this reader
  useEffect(() => {
    if (!user?.id || !selectedBook?.id || !locationSharingEnabled || !currentLocation) return;
    let active = true;
    const syncBookLocation = async () => {
      try {
        await supabase.rpc('share_book_location', {
          book_uuid: selectedBook.id,
          lat: currentLocation.lat,
          lng: currentLocation.lng,
        });
      } catch (err) {
        if (active) console.warn('Could not register book location for reader discovery:', err);
      }
    };
    void syncBookLocation();
    return () => {
      active = false;
    };
  }, [user?.id, selectedBook?.id, locationSharingEnabled, currentLocation]);

  const readerPoints = useMemo<MapplsPoint[]>(() => {
    const points: MapplsPoint[] = [];
    if (locationSharingEnabled && currentLocation) {
      points.push({
        id: 'self',
        lat: currentLocation.lat,
        lng: currentLocation.lng,
        title: 'You (Your location)',
        description: selectedBook ? `Reading: ${selectedBook.title}` : 'Your shared location',
        avatarUrl: userAvatar?.avatar_img_url ?? null,
      });
    }
    readers
      .filter(
        (reader) =>
          reader.latitude != null &&
          reader.longitude != null &&
          Number.isFinite(reader.latitude) &&
          Number.isFinite(reader.longitude) &&
          !(reader.latitude === 0 && reader.longitude === 0),
      )
      .forEach((reader) => {
        points.push({
          id: reader.user_id,
          lat: reader.latitude!,
          lng: reader.longitude!,
          title: reader.profiles?.full_name || reader.profiles?.username || 'Reader',
          description: reader.distance == null ? 'Reading this book' : `${reader.distance.toFixed(1)} km away`,
          avatarUrl: reader.avatar_img_url ?? null,
        });
      });
    return points;
  }, [readers, locationSharingEnabled, currentLocation, selectedBook, userAvatar?.avatar_img_url]);

  const friendPoints = useMemo<MapplsPoint[]>(() => {
    const points: MapplsPoint[] = [];
    if (locationSharingEnabled && currentLocation) {
      points.push({
        id: 'self',
        lat: currentLocation.lat,
        lng: currentLocation.lng,
        title: 'You (Your location)',
        description: 'Your shared location',
        avatarUrl: userAvatar?.avatar_img_url ?? null,
      });
    }
    const friends = friendsQuery.data || [];
    if (!Array.isArray(friends)) return points;
    friends.forEach((friend: any) => {
      const profile = friend?.friend_profile;
      if (
        !profile?.location_sharing ||
        profile.location_lat == null ||
        profile.location_lng == null
      ) {
        return;
      }

      const lat = Number(profile.location_lat);
      const lng = Number(profile.location_lng);
      if (!Number.isFinite(lat) || !Number.isFinite(lng) || (lat === 0 && lng === 0)) return;

      points.push({
        id: String(friend.id ?? profile.id ?? `${lat},${lng}`),
        lat,
        lng,
        title: profile.full_name || profile.username || 'Friend',
        description: 'Friend who has enabled location sharing',
        avatarUrl: profile.avatar_img_url ?? profile.profile_photo_url ?? null,
      });
    });
    return points;
  }, [friendsQuery.data, locationSharingEnabled, currentLocation, userAvatar?.avatar_img_url]);

  return (
    <>
      <SEO title="Reader Snap Map — Live Reader Community | Sahadhyayi" description="Discover readers and friends reading near you in real-time with customizable reading Bitmojis and book sharing." canonical="https://sahadhyayi.com/map" url="https://sahadhyayi.com/map" />
      <main className="min-h-screen px-4 pb-16 pt-6 bg-[#FAF7F2] dark:bg-[#0B0D0C] text-[#202820] dark:text-[#F3F0E7]">
        <div className="mx-auto max-w-5xl space-y-5">
          {/* ── Snapchat Style Top Header HUD ── */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white/80 dark:bg-[#111614]/80 backdrop-blur-md border border-[#E5DED2] dark:border-[#29332D] rounded-2xl p-4 shadow-sm">
            <div className="space-y-1">
              <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-[11px] font-bold text-amber-800 dark:text-amber-300">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                Snap Map for Readers
              </div>
              <h1 className="text-xl sm:text-2xl font-serif font-bold tracking-tight">
                Live Reader Map
              </h1>
              <p className="text-xs text-[#687067] dark:text-[#A5ADA6]">
                See what fellow book lovers are reading around your city with custom Bitmojis.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {/* Ghost Mode Pill */}
              <div
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border ${
                  locationSharingEnabled
                    ? 'border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-300'
                    : 'border-slate-200 bg-slate-50 text-slate-700 dark:border-slate-800 dark:bg-slate-900/40 dark:text-slate-300'
                }`}
                title={locationSharingEnabled ? 'Your approximate location is visible to fellow readers' : 'Ghost mode: you are browsing privately'}
              >
                {locationSharingEnabled ? (
                  <>
                    <Eye className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Sharing Active</span>
                  </>
                ) : (
                  <>
                    <EyeOff className="w-3.5 h-3.5 text-slate-500" />
                    <span>Ghost Mode</span>
                  </>
                )}
              </div>

              {/* Bitmoji Creator Button */}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowBitmojiCreator(true)}
                className="rounded-xl gap-1.5 text-xs h-9 border-[#DCD5C9] dark:border-[#29332D] hover:bg-[#F3EFE7] dark:hover:bg-[#1C3024]"
              >
                {userAvatar?.avatar_img_url ? (
                  <img src={userAvatar.avatar_img_url} alt="" className="w-4 h-4 rounded-full object-cover" />
                ) : (
                  <Palette className="w-3.5 h-3.5 text-[#98733A] dark:text-[#D5B16D]" />
                )}
                <span>Customize Bitmoji</span>
              </Button>
            </div>
          </div>

          <Tabs value={tab} onValueChange={(value) => setTab(value as 'readers' | 'friends')} className="w-full">
            <TabsList className="mb-4 grid w-full grid-cols-2 rounded-xl p-1 bg-[#EFECE6] dark:bg-[#161D19] border border-[#DCD5C9] dark:border-[#29332D]">
              <TabsTrigger value="readers" className="rounded-lg text-xs font-bold data-[state=active]:bg-white dark:data-[state=active]:bg-[#1C442D] data-[state=active]:shadow-xs">
                📚 Readers Map {readers.length > 0 && `(${readers.length})`}
              </TabsTrigger>
              <TabsTrigger value="friends" className="rounded-lg text-xs font-bold data-[state=active]:bg-white dark:data-[state=active]:bg-[#1C442D] data-[state=active]:shadow-xs">
                🧑‍🤝‍🧑 Friends Map
              </TabsTrigger>
            </TabsList>

            <TabsContent value="readers" className="space-y-4">
              <Card className="rounded-2xl border-[#E5DED2] dark:border-[#29332D] shadow-xs">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-semibold flex items-center gap-2">
                      <BookOpen className="w-4 h-4 text-[#1C442D] dark:text-[#D5B16D]" />
                      Filter Map by Book
                    </CardTitle>
                    {selectedBook && (
                      <Badge variant="outline" className="text-xs font-serif">
                        {selectedBook.title}
                      </Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <BookFilterDropdown
                    selectedBookId={selectedBook?.id || null}
                    onBookSelect={setSelectedBook}
                  />
                </CardContent>
              </Card>

              {!user && <p className="text-sm text-muted-foreground" role="status">Sign in to discover readers near you.</p>}
              {user && !locationConsentChecked && <p className="text-sm text-muted-foreground" role="status">Checking your saved location-sharing settings…</p>}
              {user && locationConsentChecked && !locationSharingEnabled && (
                <div className="rounded-xl border border-amber-200 dark:border-amber-800/60 bg-amber-50/70 dark:bg-amber-950/20 p-3.5 text-xs text-amber-900 dark:text-amber-200 flex items-center justify-between gap-3">
                  <p role="status">
                    Enable location sharing in your social settings to discover nearby readers. Your location is not requested automatically.
                  </p>
                  <Link to="/social?tab=map">
                    <Button size="sm" variant="outline" className="text-xs h-7 shrink-0 border-amber-300 dark:border-amber-700 bg-white dark:bg-amber-950 text-amber-900 dark:text-amber-100">
                      Enable in Social →
                    </Button>
                  </Link>
                </div>
              )}
              {readersLoading && (
                <p className="text-sm text-muted-foreground" role="status">Finding readers for this book…</p>
              )}
              {readersError && !readersLoading && (
                <p className="text-sm text-muted-foreground" role="status">{readersError}</p>
              )}

              {/* Map Canvas with Snapchat-style rounded frame */}
              <div className="overflow-hidden rounded-2xl border border-[#E5DED2] dark:border-[#29332D] shadow-md bg-white dark:bg-[#111614]">
                <MapplsMap
                  apiKey={MAPPLS_API_KEY}
                  points={readerPoints}
                  center={currentLocation}
                  emptyMessage={!selectedBook ? 'Choose a book above to discover active readers.' : !locationSharingEnabled ? 'Enable location sharing to discover nearby readers on Snap Map.' : 'No nearby readers are sharing this book location yet.'}
                />
              </div>

              {/* Snapchat Bottom Drawer of Active Readers */}
              {readers.length > 0 && (
                <div className="space-y-2 pt-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-[#98733A] dark:text-[#D5B16D]">
                      Active Readers Nearby ({readers.length})
                    </span>
                    <span className="text-[11px] text-muted-foreground">Approximate distances</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                    {readers.map((reader) => (
                      <div
                        key={reader.user_id}
                        className="rounded-xl border border-[#E5DED2] dark:border-[#29332D] bg-white dark:bg-[#111614] p-3 flex items-center justify-between gap-3 shadow-xs hover:border-[#1C442D]/40 transition"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <Avatar className="h-9 w-9 border border-amber-400 shrink-0">
                            <AvatarFallback className="bg-[#1C442D] text-white text-xs font-bold">
                              {(reader.profiles?.full_name || 'R')[0]}
                            </AvatarFallback>
                          </Avatar>
                          <div className="min-w-0">
                            <p className="text-xs font-bold truncate text-[#1C201D] dark:text-[#F3F0E7]">
                              {reader.profiles?.full_name || 'Reader'}
                            </p>
                            <p className="text-[11px] text-[#636B65] dark:text-[#A5ADA6]">
                              {reader.distance != null ? `${reader.distance.toFixed(1)} km away` : 'Active nearby'}
                            </p>
                          </div>
                        </div>
                        <Link to={`/messages?recipient=${reader.user_id}`}>
                          <Button size="sm" variant="ghost" className="h-8 w-8 p-0 rounded-full text-[#1C442D] dark:text-[#D5B16D]">
                            <MessageCircle className="w-4 h-4" />
                          </Button>
                        </Link>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <p className="text-xs text-muted-foreground">
                This map shows friends who share the selected book and have both enabled location sharing. Pins use approximate coordinates; exact reader coordinates are never displayed.
              </p>
            </TabsContent>

            <TabsContent value="friends" className="space-y-4">
              {friendsQuery.isLoading && (
                <p className="text-sm text-muted-foreground" role="status">Loading friends…</p>
              )}
              <div className="overflow-hidden rounded-2xl border border-[#E5DED2] dark:border-[#29332D] shadow-md bg-white dark:bg-[#111614]">
                <MapplsMap
                  apiKey={MAPPLS_API_KEY}
                  points={friendPoints}
                  center={currentLocation}
                  emptyMessage="No friends have shared a mappable location with you yet."
                />
              </div>

              <p className="text-xs text-muted-foreground">
                Only friends whose location-sharing setting is enabled are shown.
              </p>
            </TabsContent>
          </Tabs>
        </div>
      </main>

      {/* Snap Map Bitmoji Creator Dialog */}
      <BitmojiCreator
        isOpen={showBitmojiCreator}
        onClose={() => setShowBitmojiCreator(false)}
        onSave={() => setShowBitmojiCreator(false)}
        initialFeatures={userAvatar?.avatar_json as Record<string, string> | null}
      />
    </>
  );
};

export default MapPage;
