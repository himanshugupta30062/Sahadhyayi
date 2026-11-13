import React, { useState, useMemo } from "react";
import { useAuth } from "@/contexts/authHelpers";
import {
  useDiscoverableReaders,
  type DiscoverableReader,
  type ReadingDna,
} from "@/hooks/useReadingDna";
import { useSendFriendRequest, useFriendRequests } from "@/hooks/useFriends";
import { matchScore, getCompatibilityBreakdown } from "@/lib/readingDna";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Compass,
  Search,
  Sparkles,
  UserPlus,
  Check,
  Clock,
  Dna,
  User,
  Filter,
  Loader2,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { DnaCompare } from "./DnaCompare";
import UserProfileModal from "@/components/profile/UserProfileModal";

interface ReaderDiscoveryListProps {
  myDna: ReadingDna;
}

export const ReaderDiscoveryList: React.FC<ReaderDiscoveryListProps> = ({ myDna }) => {
  const { user } = useAuth();
  const { toast } = useToast();

  const [search, setSearch] = useState("");
  const [matchFilter, setMatchFilter] = useState<"all" | "70" | "50">("all");
  const [selectedGenre, setSelectedGenre] = useState<string>("all");
  const [selectedPace, setSelectedPace] = useState<string>("all");
  const [page, setPage] = useState(1);
  const pageSize = 12;

  // Selected modals state
  const [compareTarget, setCompareTarget] = useState<{
    dna: ReadingDna;
    name: string;
  } | null>(null);

  const [profileTarget, setProfileTarget] = useState<any | null>(null);

  // Queries & Mutations
  const { data: rawReaders = [], isLoading, isError } = useDiscoverableReaders({
    search: search.trim(),
    limit: 50,
  });

  const { data: friendRequests = [] } = useFriendRequests();
  const sendFriendRequest = useSendFriendRequest();

  // Pending request user ID set
  const pendingUserIds = useMemo(() => {
    const ids = new Set<string>();
    friendRequests.forEach((req) => {
      if (req.status === "pending") {
        if (req.requester_id === user?.id) ids.add(req.addressee_id);
        if (req.addressee_id === user?.id) ids.add(req.requester_id);
      }
    });
    return ids;
  }, [friendRequests, user?.id]);

  // Compute scores and breakdowns
  const scoredReaders = useMemo(() => {
    return rawReaders
      .map((reader) => {
        const theirDna: ReadingDna = {
          user_id: reader.user_id,
          genres: reader.genres || [],
          moods: reader.moods || [],
          pace: reader.pace || null,
          themes: reader.themes || [],
          summary: reader.summary || null,
          signature_color: reader.signature_color || null,
          generated_at: reader.generated_at,
          visibility: "public",
        };

        const breakdown = getCompatibilityBreakdown(myDna, theirDna);
        const score = breakdown.score;

        return {
          reader,
          theirDna,
          breakdown,
          score,
        };
      })
      .sort((a, b) => b.score - a.score);
  }, [rawReaders, myDna]);

  // Collect available genres for filtering
  const availableGenres = useMemo(() => {
    const set = new Set<string>();
    scoredReaders.forEach(({ reader }) => {
      (reader.genres || []).forEach((g) => {
        if (g.name && g.name.trim()) set.add(g.name.trim());
      });
    });
    return Array.from(set).slice(0, 10);
  }, [scoredReaders]);

  // Filtered readers
  const filteredReaders = useMemo(() => {
    const query = search.trim().toLowerCase();
    return scoredReaders.filter(({ reader, score, theirDna }) => {
      // Search term filter
      if (query) {
        const matchesName = (reader.full_name || "").toLowerCase().includes(query);
        const matchesUsername = (reader.username || "").toLowerCase().includes(query);
        if (!matchesName && !matchesUsername) return false;
      }

      // Compatibility filter
      if (matchFilter === "70" && score < 70) return false;
      if (matchFilter === "50" && score < 50) return false;

      // Pace filter
      if (selectedPace !== "all") {
        if (!theirDna.pace || theirDna.pace.toLowerCase() !== selectedPace.toLowerCase()) {
          return false;
        }
      }

      // Genre filter
      if (selectedGenre !== "all") {
        const hasGenre = (reader.genres || []).some(
          (g) => g.name.toLowerCase() === selectedGenre.toLowerCase()
        );
        if (!hasGenre) return false;
      }

      return true;
    });
  }, [scoredReaders, search, matchFilter, selectedPace, selectedGenre]);

  // Pagination
  const paginatedReaders = useMemo(() => {
    return filteredReaders.slice(0, page * pageSize);
  }, [filteredReaders, page, pageSize]);

  const hasMore = paginatedReaders.length < filteredReaders.length;

  const handleSendRequest = async (readerId: string, readerName: string) => {
    try {
      await sendFriendRequest.mutateAsync({ addresseeId: readerId });
      toast({
        title: "Friend request sent!",
        description: `We notified ${readerName}. You can read and share together once accepted.`,
      });
    } catch (e: any) {
      toast({
        title: "Could not send friend request",
        description: e.message || "An unexpected error occurred.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-4">
      {/* Top Search & Filter Bar */}
      <Card className="border-border bg-card">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Compass className="w-4 h-4 text-brand-primary" />
              Discover Compatible Readers
            </span>
            <span className="text-xs font-normal text-muted-foreground">
              {filteredReaders.length} public readers found
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-muted-foreground" />
              <input
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                placeholder="Search readers by name or handle…"
                aria-label="Search discoverable readers"
                className="h-9 w-full rounded-md border border-input bg-background pl-9 pr-3 text-sm focus:outline-none focus:ring-1 focus:ring-brand-primary"
              />
            </div>

            {/* Match threshold filter buttons */}
            <div className="flex gap-1 shrink-0">
              <Button
                size="sm"
                variant={matchFilter === "all" ? "default" : "outline"}
                onClick={() => setMatchFilter("all")}
                className="text-xs h-9"
              >
                All Matches
              </Button>
              <Button
                size="sm"
                variant={matchFilter === "50" ? "default" : "outline"}
                onClick={() => setMatchFilter("50")}
                className="text-xs h-9"
              >
                50%+
              </Button>
              <Button
                size="sm"
                variant={matchFilter === "70" ? "default" : "outline"}
                onClick={() => setMatchFilter("70")}
                className="text-xs h-9"
              >
                70%+ Top
              </Button>
            </div>
          </div>

          {/* Quick secondary filters (Genres & Pace) */}
          <div className="flex flex-wrap items-center gap-1.5 pt-1 text-xs">
            <span className="text-muted-foreground flex items-center gap-1 mr-1">
              <Filter className="w-3 h-3" />
              Genre:
            </span>
            <button
              type="button"
              onClick={() => setSelectedGenre("all")}
              className={`px-2 py-0.5 rounded-full border text-xs transition-colors ${
                selectedGenre === "all"
                  ? "bg-brand-primary text-white border-brand-primary"
                  : "bg-muted/50 border-border text-foreground hover:bg-muted"
              }`}
            >
              All
            </button>
            {availableGenres.map((genre) => (
              <button
                type="button"
                key={genre}
                onClick={() => setSelectedGenre(genre)}
                className={`px-2 py-0.5 rounded-full border text-xs transition-colors ${
                  selectedGenre.toLowerCase() === genre.toLowerCase()
                    ? "bg-brand-primary text-white border-brand-primary"
                    : "bg-muted/50 border-border text-foreground hover:bg-muted"
                }`}
              >
                {genre}
              </button>
            ))}

            {/* Reading pace filter */}
            <span className="text-muted-foreground ml-3 mr-1">Pace:</span>
            {["all", "fast", "steady", "relaxed"].map((pace) => (
              <button
                type="button"
                key={pace}
                onClick={() => setSelectedPace(pace)}
                className={`px-2 py-0.5 rounded-full border text-xs capitalize transition-colors ${
                  selectedPace.toLowerCase() === pace.toLowerCase()
                    ? "bg-brand-primary text-white border-brand-primary"
                    : "bg-muted/50 border-border text-foreground hover:bg-muted"
                }`}
              >
                {pace}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Reader Cards Grid */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-brand-primary" />
        </div>
      ) : isError ? (
        <Card className="border-destructive/30">
          <CardContent className="py-8 text-center text-sm text-destructive">
            Could not load reader discovery. Please try again.
          </CardContent>
        </Card>
      ) : paginatedReaders.length === 0 ? (
        <Card className="border-dashed bg-muted/20">
          <CardContent className="py-12 text-center space-y-2">
            <Compass className="w-8 h-8 mx-auto text-muted-foreground/60" />
            <p className="font-semibold text-sm">No discoverable readers found</p>
            <p className="text-xs text-muted-foreground max-w-sm mx-auto">
              Try broadening your filters or searching for another reader name. Only readers who have made their Reading DNA public appear here.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3.5 sm:grid-cols-2">
          {paginatedReaders.map(({ reader, theirDna, score, breakdown }) => {
            const displayName = reader.full_name || reader.username || "Fellow Reader";
            const hue = Math.min(130, Math.max(0, score * 1.3));
            const isPending =
              pendingUserIds.has(reader.user_id) ||
              reader.friend_request_status === "pending";

            return (
              <Card
                key={reader.user_id}
                className="border-border hover:shadow-md transition-all flex flex-col justify-between"
              >
                <CardContent className="p-4 space-y-3.5">
                  {/* Top user header */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <Avatar className="w-11 h-11 border border-border shadow-xs shrink-0">
                        <AvatarImage src={reader.profile_photo_url || ""} />
                        <AvatarFallback className="bg-brand-primary text-white font-semibold text-sm">
                          {displayName.charAt(0)}
                        </AvatarFallback>
                      </Avatar>

                      <div className="min-w-0">
                        <p className="font-semibold text-sm text-foreground truncate">
                          {displayName}
                        </p>
                        {reader.username && (
                          <p className="text-xs text-muted-foreground truncate">
                            @{reader.username}
                          </p>
                        )}
                        <p className="text-[11px] text-muted-foreground capitalize mt-0.5">
                          {theirDna.pace ?? "Steady"} pace
                          {reader.bio ? ` · ${reader.bio}` : ""}
                        </p>
                      </div>
                    </div>

                    {/* Compatibility Badge */}
                    <div className="shrink-0 flex flex-col items-end gap-1">
                      <Badge
                        style={{
                          backgroundColor: `hsl(${hue} 75% 95%)`,
                          borderColor: `hsl(${hue} 75% 65%)`,
                          color: `hsl(${hue} 85% 25%)`,
                        }}
                        className="text-xs px-2.5 py-0.5 border font-bold"
                      >
                        {score}% match
                      </Badge>
                      <span className="text-[10px] text-muted-foreground capitalize">
                        {breakdown.confidence} data
                      </span>
                    </div>
                  </div>

                  {/* Narrative compatibility explanation */}
                  <div className="rounded-lg bg-muted/40 p-2.5 text-xs text-muted-foreground space-y-1">
                    <p className="line-clamp-2 italic">"{breakdown.narrativeExplanation}"</p>
                    {breakdown.sharedGenres.length > 0 && (
                      <div className="flex items-center gap-1 flex-wrap pt-0.5">
                        <span className="font-medium text-foreground text-[11px]">
                          Shared:
                        </span>
                        {breakdown.sharedGenres.slice(0, 3).map((g) => (
                          <Badge
                            key={g}
                            variant="secondary"
                            className="text-[10px] px-1.5 py-0"
                          >
                            {g}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Top genres */}
                  {theirDna.genres.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {theirDna.genres.slice(0, 4).map((g) => (
                        <Badge
                          key={g.name}
                          variant="outline"
                          className="text-[10px] border-border text-muted-foreground"
                        >
                          {g.name}
                        </Badge>
                      ))}
                    </div>
                  )}

                  {/* Action buttons */}
                  <div className="pt-2 border-t border-border/60 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() =>
                          setProfileTarget({
                            id: reader.user_id,
                            full_name: displayName,
                            username: reader.username,
                            profile_photo_url: reader.profile_photo_url,
                            bio: reader.bio,
                          })
                        }
                        className="text-xs h-8 px-2.5 gap-1 text-muted-foreground hover:text-foreground"
                      >
                        <User className="w-3.5 h-3.5" />
                        Profile
                      </Button>

                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          setCompareTarget({
                            dna: theirDna,
                            name: displayName,
                          })
                        }
                        className="text-xs h-8 px-2.5 gap-1"
                      >
                        <Dna className="w-3.5 h-3.5 text-amber-500" />
                        Compare
                      </Button>
                    </div>

                    {isPending ? (
                      <Badge variant="secondary" className="text-xs gap-1 py-1">
                        <Clock className="w-3 h-3" />
                        Pending
                      </Badge>
                    ) : (
                      <Button
                        size="sm"
                        onClick={() => handleSendRequest(reader.user_id, displayName)}
                        disabled={sendFriendRequest.isPending}
                        className="text-xs h-8 px-3 gap-1.5"
                      >
                        {sendFriendRequest.isPending ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <UserPlus className="w-3.5 h-3.5" />
                        )}
                        Connect
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Pagination Load More */}
      {hasMore && (
        <div className="flex justify-center pt-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => p + 1)}
            className="text-xs px-6"
          >
            Load more readers ({filteredReaders.length - paginatedReaders.length} remaining)
          </Button>
        </div>
      )}

      {/* Compare Modal */}
      {compareTarget && (
        <DnaCompare
          friendDna={compareTarget.dna}
          myDna={myDna}
          friendName={compareTarget.name}
          open={!!compareTarget}
          onOpenChange={(open) => !open && setCompareTarget(null)}
        />
      )}

      {/* Profile Modal */}
      {profileTarget && (
        <UserProfileModal
          isOpen={!!profileTarget}
          onClose={() => setProfileTarget(null)}
          user={profileTarget}
        />
      )}
    </div>
  );
};
