import React, { useState } from "react";
import {
  useReadingDna,
  useGenerateReadingDna,
  useUpdateReadingDnaVisibility,
  type ReadingDnaVisibility,
} from "@/hooks/useReadingDna";
import { matchScore, type ReadingDna } from "@/lib/readingDna";
import { useAuth } from "@/contexts/authHelpers";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Dna,
  Sparkles,
  Loader2,
  RefreshCw,
  Users,
  ArrowRight,
  Compass,
  Globe,
  Lock,
  UserCheck,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ReadingDnaCard } from "./ReadingDnaCard";
import { DnaCompare } from "./DnaCompare";
import { ReaderDiscoveryList } from "./ReaderDiscoveryList";

const FriendMatchesList: React.FC<{ myDna: ReadingDna }> = ({ myDna }) => {
  const { user } = useAuth();
  const [selectedFriend, setSelectedFriend] = useState<{ dna: ReadingDna; name: string } | null>(null);

  const [matchFilter, setMatchFilter] = useState<"all" | "strong">("all");
  const [search, setSearch] = useState("");

  const { data: friendsWithDna = [], isLoading } = useQuery({
    queryKey: ["friend-dna-matches", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data: friends } = await supabase
        .from("friends")
        .select("user1_id, user2_id")
        .or(`user1_id.eq.${user!.id},user2_id.eq.${user!.id}`);

      const ids = (friends ?? []).map((f) => (f.user1_id === user!.id ? f.user2_id : f.user1_id));
      if (!ids.length) return [];

      const { data: dnas } = await supabase.from("reading_dna").select("*").in("user_id", ids);
      const { data: profs } = await supabase.from("profiles").select("id, full_name, profile_photo_url").in("id", ids);

      const profMap = new Map((profs ?? []).map((p) => [p.id, p]));
      return (dnas ?? []).map((d: any) => ({
        dna: d as unknown as ReadingDna,
        profile: profMap.get(d.user_id),
      }));
    },
    staleTime: 60_000,
  });

  if (isLoading || friendsWithDna.length === 0) return null;

  const scored = friendsWithDna
    .map(({ dna, profile }) => ({
      dna,
      profile,
      score: matchScore(myDna, dna),
    }))
    .sort((a, b) => b.score - a.score);
  const visibleMatches = scored.filter(({ profile, score }) =>
    (matchFilter === "all" || score >= 60) &&
    (profile?.full_name ?? "Reader").toLowerCase().includes(search.trim().toLowerCase())
  );

  return (
    <>
      <Card className="border-border bg-card">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Users className="w-4 h-4 text-brand-primary" />
              Connected Friend Matches
            </span>
            <span className="text-xs font-normal text-muted-foreground">
              {scored.length} friends with DNA
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-col sm:flex-row gap-2">
            <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search friends by name…" aria-label="Search reader matches" className="h-9 flex-1 rounded-md border border-input bg-background px-3 text-sm" />
            <div className="flex gap-1">
              <Button size="sm" variant={matchFilter === "all" ? "default" : "outline"} onClick={() => setMatchFilter("all")}>All</Button>
              <Button size="sm" variant={matchFilter === "strong" ? "default" : "outline"} onClick={() => setMatchFilter("strong")}>60%+ match</Button>
            </div>
          </div>
          <div className="flex items-center justify-between text-xs text-muted-foreground flex-wrap gap-1">
            <span>Showing {visibleMatches.length} of {scored.length} readers · ranked by compatibility</span>
            <span className="italic">Compatibility is estimated from shared reading interests, genres, and reading pace.</span>
          </div>
          {visibleMatches.map(({ profile, score, dna }) => {
            const hue = Math.min(130, Math.max(0, score * 1.3));
            const friendName = profile?.full_name ?? "Reader";
            return (
              <button
                type="button"
                key={dna.user_id}
                onClick={() => setSelectedFriend({ dna, name: friendName })}
                className="w-full text-left flex items-center justify-between p-2.5 rounded-xl border border-border/60 hover:bg-muted/30 transition-all cursor-pointer group"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <Avatar className="w-9 h-9 border border-border/80">
                    <AvatarImage src={profile?.profile_photo_url || ""} />
                    <AvatarFallback className="text-xs bg-brand-primary text-white">
                      {friendName.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-foreground group-hover:text-brand-primary transition-colors truncate">
                      {friendName}
                    </p>
                    <p className="text-xs text-muted-foreground truncate capitalize">
                      {dna.pace ?? "Steady"} · {dna.genres[0]?.name ?? "Eclectic"}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <Badge
                    style={{
                      backgroundColor: `hsl(${hue} 75% 95%)`,
                      borderColor: `hsl(${hue} 75% 65%)`,
                      color: `hsl(${hue} 85% 25%)`,
                    }}
                    className="text-xs px-2.5 py-0.5 border font-semibold"
                  >
                    {score}% match
                  </Badge>
                  <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:translate-x-0.5 transition-transform" />
                </div>
              </button>
            );
          })}
          {visibleMatches.length === 0 && <p className="py-5 text-center text-sm text-muted-foreground">No readers match these filters. Try another name or show all.</p>}
        </CardContent>
      </Card>

      {selectedFriend && (
        <DnaCompare
          friendDna={selectedFriend.dna}
          myDna={myDna}
          friendName={selectedFriend.name}
          open={!!selectedFriend}
          onOpenChange={(open) => !open && setSelectedFriend(null)}
        />
      )}
    </>
  );
};

export const ReadingDnaPanel: React.FC = () => {
  const { user } = useAuth();
  const { data: dna, isLoading, error } = useReadingDna();
  const generate = useGenerateReadingDna();
  const updateVisibility = useUpdateReadingDnaVisibility();
  const { toast } = useToast();

  const [activeTab, setActiveTab] = useState<"discover" | "friends">("discover");

  const handleGenerate = async () => {
    try {
      await generate.mutateAsync();
      toast({
        title: "Reading DNA Generated! 🧬",
        description: "Your taste spectrum and reader fingerprint have been updated.",
      });
    } catch (e: any) {
      toast({
        title: "Couldn't generate DNA",
        description: e.message || "Rate limit reached or generation failed. Try again in a minute.",
        variant: "destructive",
      });
    }
  };

  const handleVisibilityChange = async (newVisibility: ReadingDnaVisibility) => {
    try {
      await updateVisibility.mutateAsync(newVisibility);
      toast({
        title: "Privacy setting updated",
        description:
          newVisibility === "public"
            ? "Your Reading DNA is now public and discoverable by the community."
            : newVisibility === "friends"
            ? "Your Reading DNA is visible only to your confirmed friends."
            : "Your Reading DNA is strictly private and hidden from other readers.",
      });
    } catch (err: any) {
      toast({
        title: "Could not update privacy",
        description: err.message || "An error occurred.",
        variant: "destructive",
      });
    }
  };

  const currentVisibility: ReadingDnaVisibility = (dna?.visibility as ReadingDnaVisibility) || "public";

  return (
    <div className="space-y-5">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-card p-4 rounded-xl border border-border">
        <div>
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Dna className="w-5 h-5 text-amber-500" />
            Reading DNA & Taste Matching
          </h2>
          <p className="text-xs text-muted-foreground">
            A taste fingerprint computed from your reading habits. Discover kindred readers, compare compatibility, and exchange cross-shelf recommendations.
          </p>
        </div>

        {user && (
          <Button
            size="sm"
            onClick={handleGenerate}
            disabled={generate.isPending}
            className="gap-2 self-start sm:self-auto shrink-0"
          >
            {generate.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <RefreshCw className="w-4 h-4" />
            )}
            {dna ? "Refresh DNA" : "Generate My DNA"}
          </Button>
        )}
      </div>

      {isLoading && (
        <div className="flex justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-brand-primary" />
        </div>
      )}

      {error && (
        <Card className="border-destructive/30">
          <CardContent className="py-6 text-center text-sm text-destructive">
            Failed to load Reading DNA.
          </CardContent>
        </Card>
      )}

      {!isLoading && !dna && !error && (
        <Card className="border-dashed bg-card/60">
          <CardContent className="py-12 text-center space-y-3">
            <div className="w-12 h-12 mx-auto rounded-full bg-amber-500/10 flex items-center justify-center text-amber-600">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">No Reading DNA yet</p>
              <p className="text-xs text-muted-foreground max-w-sm mx-auto mt-1">
                Generate your personalized Reading DNA profile from the books on your shelf, ratings, and reading history.
              </p>
            </div>
            {user && (
              <Button size="sm" onClick={handleGenerate} disabled={generate.isPending} className="text-xs gap-1.5">
                {generate.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                Analyze My Shelf & Generate DNA
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Robust 3-Way Privacy Controls */}
      {dna && user && (
        <Card className="border-border bg-card">
          <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <p className="text-sm font-medium flex items-center gap-1.5">
                {currentVisibility === "public" ? (
                  <Globe className="w-4 h-4 text-emerald-600" />
                ) : currentVisibility === "friends" ? (
                  <UserCheck className="w-4 h-4 text-brand-primary" />
                ) : (
                  <Lock className="w-4 h-4 text-amber-600" />
                )}
                DNA Visibility:{" "}
                <span className="capitalize font-semibold">{currentVisibility}</span>
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {currentVisibility === "public"
                  ? "Public: Visible to all signed-in readers; allows other book lovers to discover you via shared taste."
                  : currentVisibility === "friends"
                  ? "Friends Only: Only confirmed friends can view and compare your reading taste."
                  : "Private: Strictly confidential; only you can see your taste fingerprint."}
              </p>
            </div>

            <div className="flex items-center gap-1 shrink-0 bg-muted/50 p-1 rounded-lg border border-border/60">
              <Button
                size="sm"
                variant={currentVisibility === "public" ? "default" : "ghost"}
                disabled={updateVisibility.isPending}
                onClick={() => handleVisibilityChange("public")}
                className="text-xs h-7 px-2.5"
              >
                Public
              </Button>
              <Button
                size="sm"
                variant={currentVisibility === "friends" ? "default" : "ghost"}
                disabled={updateVisibility.isPending}
                onClick={() => handleVisibilityChange("friends")}
                className="text-xs h-7 px-2.5"
              >
                Friends
              </Button>
              <Button
                size="sm"
                variant={currentVisibility === "private" ? "default" : "ghost"}
                disabled={updateVisibility.isPending}
                onClick={() => handleVisibilityChange("private")}
                className="text-xs h-7 px-2.5"
              >
                Private
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {dna && <ReadingDnaCard dna={dna} mine />}

      {/* Tabs between Community Discovery and Friends */}
      {dna && (
        <div className="space-y-4">
          <div className="flex border-b border-border pb-1 gap-2">
            <button
              type="button"
              onClick={() => setActiveTab("discover")}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-sm font-semibold rounded-md transition-colors ${
                activeTab === "discover"
                  ? "bg-brand-primary/10 text-brand-primary"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Compass className="w-4 h-4" />
              Discover Readers
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("friends")}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-sm font-semibold rounded-md transition-colors ${
                activeTab === "friends"
                  ? "bg-brand-primary/10 text-brand-primary"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Users className="w-4 h-4" />
              Friend Matches
            </button>
          </div>

          {activeTab === "discover" ? (
            <ReaderDiscoveryList myDna={dna} />
          ) : (
            <FriendMatchesList myDna={dna} />
          )}
        </div>
      )}
    </div>
  );
};

export default ReadingDnaPanel;
