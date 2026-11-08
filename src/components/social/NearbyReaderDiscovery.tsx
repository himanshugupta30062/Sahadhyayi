import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  BookOpen,
  CheckCircle2,
  Compass,
  Loader2,
  MapPin,
  ShieldCheck,
  UserPlus,
  Users,
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client-universal';
import { useAuth } from '@/contexts/authHelpers';
import { getCurrentLocation } from '@/lib/locationService';
import { useFriendRequests, useFriends, useSendFriendRequest } from '@/hooks/useFriends';
import { toast } from 'sonner';

interface SelectedBook {
  id: string;
  title: string;
  author?: string;
}

interface NearbyReaderMatch {
  reader_id: string;
  reader_name: string;
  username: string | null;
  profile_photo_url: string | null;
  distance_band: string;
  is_friend: boolean;
}

interface NearbyReaderDiscoveryProps {
  selectedBook: SelectedBook | null;
}

const DISTANCE_OPTIONS = [
  { value: '5', label: 'Within 5 km' },
  { value: '10', label: 'Within 10 km' },
  { value: '25', label: 'Within 25 km' },
  { value: '50', label: 'Within 50 km' },
];

export const NearbyReaderDiscovery = ({ selectedBook }: NearbyReaderDiscoveryProps) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [radiusKm, setRadiusKm] = useState('25');
  const [showConsentDialog, setShowConsentDialog] = useState(false);
  const [isSavingDiscovery, setIsSavingDiscovery] = useState(false);
  const [connectingReaderId, setConnectingReaderId] = useState<string | null>(null);

  const locationQuery = useQuery({
    queryKey: ['reader-discovery-location', user?.id],
    queryFn: async () => {
      if (!user?.id) return false;
      const { data, error } = await supabase
        .from('reader_discovery_locations')
        .select('user_id')
        .eq('user_id', user.id)
        .maybeSingle();
      if (error) throw error;
      return Boolean(data);
    },
    enabled: Boolean(user?.id),
    staleTime: 30_000,
  });

  const discoveryEnabled = locationQuery.data === true;

  const readersQuery = useQuery({
    queryKey: ['nearby-reader-matches', user?.id, selectedBook?.id, radiusKm],
    queryFn: async () => {
      if (!user?.id || !selectedBook?.id) {
        return { isCurrentlyReading: false, readers: [] as NearbyReaderMatch[] };
      }

      const { data: shelfEntry, error: shelfError } = await supabase
        .from('user_bookshelf')
        .select('id')
        .eq('user_id', user.id)
        .eq('book_id', selectedBook.id)
        .eq('status', 'reading')
        .maybeSingle();

      if (shelfError) throw shelfError;
      if (!shelfEntry) {
        return { isCurrentlyReading: false, readers: [] as NearbyReaderMatch[] };
      }

      const { data, error } = await supabase.rpc('get_nearby_reader_matches', {
        book_uuid: selectedBook.id,
        radius_km: Number(radiusKm),
      });
      if (error) throw error;

      return {
        isCurrentlyReading: true,
        readers: (data ?? []) as NearbyReaderMatch[],
      };
    },
    enabled: Boolean(user?.id && discoveryEnabled && selectedBook?.id),
  });

  const { data: friends = [] } = useFriends();
  const { data: friendRequests = [] } = useFriendRequests();
  const sendFriendRequest = useSendFriendRequest();

  const enableDiscovery = async () => {
    if (!user?.id || isSavingDiscovery) return;

    setIsSavingDiscovery(true);
    try {
      // GPS is requested only after the reader accepts the separate
      // nearby-discovery consent dialog.
      const position = await getCurrentLocation();
      const now = new Date().toISOString();
      const { error } = await supabase.from('reader_discovery_locations').upsert(
        {
          user_id: user.id,
          latitude: position.lat,
          longitude: position.lng,
          consented_at: now,
          updated_at: now,
        },
        { onConflict: 'user_id' },
      );

      if (error) throw error;

      await queryClient.invalidateQueries({ queryKey: ['reader-discovery-location', user.id] });
      await queryClient.invalidateQueries({ queryKey: ['nearby-reader-matches', user.id] });
      setShowConsentDialog(false);
      toast.success('Nearby reader discovery is enabled.');
    } catch (error) {
      console.error('Unable to enable nearby reader discovery:', error);
      toast.error(error instanceof Error ? error.message : 'Could not enable nearby reader discovery.');
    } finally {
      setIsSavingDiscovery(false);
    }
  };

  const disableDiscovery = async () => {
    if (!user?.id || isSavingDiscovery) return;

    setIsSavingDiscovery(true);
    try {
      const { error } = await supabase
        .from('reader_discovery_locations')
        .delete()
        .eq('user_id', user.id);
      if (error) throw error;

      queryClient.removeQueries({ queryKey: ['nearby-reader-matches', user.id] });
      await queryClient.invalidateQueries({ queryKey: ['reader-discovery-location', user.id] });
      toast.success('Nearby discovery is off and your saved discovery coordinates were deleted.');
    } catch (error) {
      console.error('Unable to disable nearby reader discovery:', error);
      toast.error(error instanceof Error ? error.message : 'Could not disable nearby discovery.');
    } finally {
      setIsSavingDiscovery(false);
    }
  };

  const connectToReader = async (readerId: string) => {
    setConnectingReaderId(readerId);
    try {
      await sendFriendRequest.mutateAsync({ addresseeId: readerId });
      toast.success('Connection request sent.');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not send connection request.');
    } finally {
      setConnectingReaderId(null);
    }
  };

  const getRelationshipState = (reader: NearbyReaderMatch) => {
    const alreadyFriends =
      reader.is_friend || friends.some((friend) => friend.friend_profile?.id === reader.reader_id);
    if (alreadyFriends) return 'connected' as const;

    const request = friendRequests.find(
      (item) =>
        (item.requester_id === user?.id && item.addressee_id === reader.reader_id) ||
        (item.addressee_id === user?.id && item.requester_id === reader.reader_id),
    );

    if (request?.status === 'pending') {
      return request.requester_id === user?.id ? 'sent' as const : 'incoming' as const;
    }
    return 'none' as const;
  };

  const readers = readersQuery.data?.readers ?? [];

  if (!user) return null;

  return (
    <>
      <Card className="mt-5 border border-[#E8E2D9] bg-white text-[#1C201D] shadow-sm dark:border-[#29332D] dark:bg-[#111614] dark:text-[#F3F0E7]">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Compass className="h-5 w-5 text-[#1C442D] dark:text-[#D5B16D]" />
            Discover Nearby Readers
          </CardTitle>
          <CardDescription className="text-sm leading-relaxed text-[#636B65] dark:text-[#A5ADA6]">
            Find people who are currently reading the same book. Only readers who separately opt in are discoverable.
            We show a broad distance range, never another reader’s exact coordinates.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {locationQuery.isLoading ? (
            <div className="flex items-center gap-2 py-3 text-sm text-muted-foreground" role="status">
              <Loader2 className="h-4 w-4 animate-spin" />
              Checking your nearby-discovery setting…
            </div>
          ) : locationQuery.error ? (
            <div className="rounded-xl border border-red-300/60 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900/60 dark:bg-red-950/20 dark:text-red-300" role="alert">
              Could not verify your discovery setting. Retry before changing it.
              <Button type="button" variant="outline" size="sm" className="mt-2" onClick={() => void locationQuery.refetch()}>
                Retry
              </Button>
            </div>
          ) : !discoveryEnabled ? (
            <div className="flex flex-col gap-3 rounded-xl border border-dashed border-[#E8E2D9] bg-[#FAF7F2] p-4 dark:border-[#29332D] dark:bg-[#0B0D0C] sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-3">
                <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-[#1C442D] dark:text-[#D5B16D]" />
                <div>
                  <p className="text-sm font-semibold">You are not discoverable yet</p>
                  <p className="mt-1 text-xs leading-relaxed text-[#636B65] dark:text-[#A5ADA6]">
                    Turn this on only when you are comfortable being found by other opted-in readers who share your currently-reading books.
                  </p>
                </div>
              </div>
              <Button type="button" className="shrink-0 gap-2" onClick={() => setShowConsentDialog(true)}>
                <MapPin className="h-4 w-4" />
                Enable discovery
              </Button>
            </div>
          ) : (
            <div className="flex flex-col gap-3 rounded-xl border border-[#D8E5D9] bg-[#F2F7F2] p-4 dark:border-[#294333] dark:bg-[#14231A] sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-700 dark:text-emerald-400" />
                <div>
                  <p className="text-sm font-semibold">Nearby discovery is on</p>
                  <p className="mt-1 text-xs leading-relaxed text-[#526357] dark:text-[#A5ADA6]">
                    Your exact coordinates are protected. Other readers see only a distance range for a shared book.
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button type="button" variant="outline" size="sm" disabled={isSavingDiscovery} onClick={() => void enableDiscovery()}>
                  {isSavingDiscovery ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <MapPin className="mr-2 h-4 w-4" />}
                  Refresh location
                </Button>
                <Button type="button" variant="outline" size="sm" disabled={isSavingDiscovery} onClick={() => void disableDiscovery()}>
                  Turn off
                </Button>
              </div>
            </div>
          )}

          {discoveryEnabled && (
            <div className="space-y-3">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-semibold">Same-book readers</p>
                  <p className="text-xs text-muted-foreground">
                    Matches are based on books both readers mark as Currently Reading.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <label htmlFor="nearby-reader-radius" className="text-xs text-muted-foreground">Radius</label>
                  <Select value={radiusKm} onValueChange={setRadiusKm}>
                    <SelectTrigger id="nearby-reader-radius" className="w-[145px]">
                      <SelectValue placeholder="Choose radius" />
                    </SelectTrigger>
                    <SelectContent>
                      {DISTANCE_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {!selectedBook ? (
                <div className="rounded-xl border border-dashed border-[#E8E2D9] px-4 py-6 text-center dark:border-[#29332D]">
                  <BookOpen className="mx-auto mb-2 h-6 w-6 text-muted-foreground" />
                  <p className="text-sm font-medium">Choose a book above</p>
                  <p className="mt-1 text-xs text-muted-foreground">We will look for opted-in readers who are currently reading that title.</p>
                </div>
              ) : readersQuery.isLoading ? (
                <div className="flex items-center justify-center gap-2 py-6 text-sm text-muted-foreground" role="status">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Finding readers near you…
                </div>
              ) : readersQuery.error ? (
                <div className="rounded-xl border border-red-300/60 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900/60 dark:bg-red-950/20 dark:text-red-300" role="alert">
                  Nearby readers could not be loaded.
                  <Button type="button" size="sm" variant="outline" className="mt-2" onClick={() => void readersQuery.refetch()}>
                    Try again
                  </Button>
                </div>
              ) : readersQuery.data && !readersQuery.data.isCurrentlyReading ? (
                <div className="rounded-xl border border-dashed border-[#E8E2D9] px-4 py-6 text-center dark:border-[#29332D]">
                  <BookOpen className="mx-auto mb-2 h-6 w-6 text-muted-foreground" />
                  <p className="text-sm font-medium">Mark this book as Currently Reading</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Nearby matches are shown only for books on your Currently Reading shelf.
                  </p>
                </div>
              ) : readers.length === 0 ? (
                <div className="rounded-xl border border-dashed border-[#E8E2D9] px-4 py-6 text-center dark:border-[#29332D]">
                  <Users className="mx-auto mb-2 h-6 w-6 text-muted-foreground" />
                  <p className="text-sm font-medium">No opted-in readers found yet</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Try a larger radius or invite a friend to enable nearby discovery.
                  </p>
                </div>
              ) : (
                <div className="grid gap-3 sm:grid-cols-2">
                  {readers.map((reader) => {
                    const relationship = getRelationshipState(reader);
                    return (
                      <div key={reader.reader_id} className="flex min-w-0 items-center justify-between gap-3 rounded-xl border border-[#E8E2D9] p-3 dark:border-[#29332D]">
                        <div className="flex min-w-0 items-center gap-3">
                          <Avatar className="h-10 w-10 shrink-0">
                            <AvatarImage src={reader.profile_photo_url || undefined} alt="" />
                            <AvatarFallback>{reader.reader_name.slice(0, 1).toUpperCase()}</AvatarFallback>
                          </Avatar>
                          <div className="min-w-0">
                            <p className="truncate text-sm font-semibold">{reader.reader_name}</p>
                            {reader.username && <p className="truncate text-xs text-muted-foreground">@{reader.username}</p>}
                            <p className="mt-1 text-xs text-[#636B65] dark:text-[#A5ADA6]">{reader.distance_band}</p>
                          </div>
                        </div>
                        {relationship === 'connected' ? (
                          <Button type="button" size="sm" variant="outline" disabled className="shrink-0">Connected</Button>
                        ) : relationship === 'sent' ? (
                          <Button type="button" size="sm" variant="outline" disabled className="shrink-0">Request sent</Button>
                        ) : relationship === 'incoming' ? (
                          <Button asChild type="button" size="sm" variant="outline" className="shrink-0">
                            <Link to="/social?tab=friends">Respond</Link>
                          </Button>
                        ) : (
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            className="shrink-0 gap-1.5"
                            disabled={connectingReaderId === reader.reader_id}
                            onClick={() => void connectToReader(reader.reader_id)}
                          >
                            {connectingReaderId === reader.reader_id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <UserPlus className="h-3.5 w-3.5" />}
                            Connect
                          </Button>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={showConsentDialog} onOpenChange={(open) => !isSavingDiscovery && setShowConsentDialog(open)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-primary" />
              Nearby reader discovery consent
            </DialogTitle>
            <DialogDescription>
              This is separate from your existing Friends Map location-sharing setting.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 text-sm text-muted-foreground">
            <p>When enabled, your profile name, username and photo can appear to other signed-in readers who have also opted in and are currently reading the same book within your selected radius.</p>
            <p>Other readers receive only a broad distance range, such as “5–10 km away”. Your exact coordinates are stored in a protected table and used by the server for matching; they are never returned in the discovery results or shown as a map pin.</p>
            <p>You can turn this off at any time. Turning it off deletes the coordinates saved for nearby discovery. It does not change your separate Friends Map setting.</p>
          </div>
          <DialogFooter className="flex-col gap-2 sm:flex-row">
            <Button type="button" variant="outline" disabled={isSavingDiscovery} onClick={() => setShowConsentDialog(false)}>
              Not now
            </Button>
            <Button type="button" disabled={isSavingDiscovery} onClick={() => void enableDiscovery()}>
              {isSavingDiscovery ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <MapPin className="mr-2 h-4 w-4" />}
              Enable nearby discovery
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default NearbyReaderDiscovery;
