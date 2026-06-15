import { useReadingDna, useGenerateReadingDna } from "@/hooks/useReadingDna";
import { matchScore, type ReadingDna } from "@/lib/readingDna";
import { useAuth } from "@/contexts/authHelpers";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dna, Sparkles, Loader2, RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const DnaStrip = ({ dna }: { dna: ReadingDna }) => {
  const total = dna.genres.reduce((s, g) => s + g.weight, 0) || 1;
  return (
    <div className="flex h-3 rounded-full overflow-hidden border" title={dna.genres.map(g => g.name).join(" · ")}>
      {dna.genres.length === 0 && <div className="flex-1 bg-muted" />}
      {dna.genres.map((g, i) => (
        <div
          key={g.name + i}
          style={{
            width: `${(g.weight / total) * 100}%`,
            background: `hsl(${(i * 53) % 360} 70% 55%)`,
          }}
        />
      ))}
    </div>
  );
};

const DnaCard = ({ dna, mine }: { dna: ReadingDna; mine: boolean }) => (
  <Card className="overflow-hidden">
    <CardContent className="p-5 space-y-4">
      <div className="flex items-start gap-3">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center text-white shrink-0"
          style={{ background: dna.signature_color ?? "#f59e0b" }}
        >
          <Dna className="w-5 h-5" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-semibold">{mine ? "Your Reading DNA" : "Reader DNA"}</p>
          <p className="text-xs text-muted-foreground">{dna.summary ?? "—"}</p>
        </div>
      </div>

      <DnaStrip dna={dna} />

      <div className="grid grid-cols-2 gap-3 text-xs">
        <div>
          <p className="font-medium mb-1">Top genres</p>
          <div className="flex flex-wrap gap-1">
            {dna.genres.slice(0, 5).map(g => (
              <Badge key={g.name} variant="secondary" className="text-[10px]">{g.name}</Badge>
            ))}
            {dna.genres.length === 0 && <span className="text-muted-foreground">—</span>}
          </div>
        </div>
        <div>
          <p className="font-medium mb-1">Moods</p>
          <div className="flex flex-wrap gap-1">
            {dna.moods.slice(0, 5).map(m => (
              <Badge key={m} variant="outline" className="text-[10px]">{m}</Badge>
            ))}
            {dna.moods.length === 0 && <span className="text-muted-foreground">—</span>}
          </div>
        </div>
        <div>
          <p className="font-medium mb-1">Pace</p>
          <p className="text-muted-foreground capitalize">{dna.pace ?? "—"}</p>
        </div>
        <div>
          <p className="font-medium mb-1">Themes</p>
          <div className="flex flex-wrap gap-1">
            {dna.themes.slice(0, 4).map(t => (
              <Badge key={t} variant="outline" className="text-[10px]">{t}</Badge>
            ))}
            {dna.themes.length === 0 && <span className="text-muted-foreground">—</span>}
          </div>
        </div>
      </div>
    </CardContent>
  </Card>
);

const FriendMatches = ({ myDna }: { myDna: ReadingDna }) => {
  const { user } = useAuth();
  const { data } = useQuery({
    queryKey: ["friend-dna", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data: friends } = await supabase.from("friends").select("user1_id, user2_id").or(`user1_id.eq.${user!.id},user2_id.eq.${user!.id}`);
      const ids = (friends ?? []).map(f => (f.user1_id === user!.id ? f.user2_id : f.user1_id));
      if (!ids.length) return [];
      const { data: dnas } = await supabase.from("reading_dna").select("*").in("user_id", ids);
      const { data: profs } = await supabase.from("profiles").select("id, full_name, profile_photo_url").in("id", ids);
      const profMap = new Map((profs ?? []).map(p => [p.id, p]));
      return (dnas ?? []).map((d: any) => ({ dna: d as unknown as ReadingDna, profile: profMap.get(d.user_id) }));
    },
  });

  if (!data || data.length === 0) return null;
  const scored = data
    .map(({ dna, profile }) => ({ dna, profile, score: matchScore(myDna, dna) }))
    .sort((a, b) => b.score - a.score);

  return (
    <Card>
      <CardHeader className="pb-2"><CardTitle className="text-base">Reader matches</CardTitle></CardHeader>
      <CardContent className="space-y-2">
        {scored.map(({ profile, score, dna }) => (
          <div key={dna.user_id} className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-muted overflow-hidden">
              {profile?.profile_photo_url && <img src={profile.profile_photo_url} alt="" className="w-full h-full object-cover" />}
            </div>
            <span className="flex-1 text-sm">{profile?.full_name ?? "Reader"}</span>
            <Badge style={{ background: `hsl(${score * 1.2} 70% 45%)`, color: "white" }} className="text-xs">{score}% match</Badge>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};

const ReadingDnaPanel = () => {
  const { user } = useAuth();
  const { data: dna, isLoading } = useReadingDna();
  const generate = useGenerateReadingDna();
  const { toast } = useToast();

  const run = async () => {
    try {
      await generate.mutateAsync();
      toast({ title: "DNA refreshed" });
    } catch (e: any) {
      toast({ title: "Couldn't generate", description: e.message, variant: "destructive" });
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold flex items-center gap-2"><Dna className="w-4 h-4 text-amber-500" /> Reading DNA</h2>
          <p className="text-sm text-muted-foreground">A taste fingerprint computed from your shelf — share it, compare it.</p>
        </div>
        {user && (
          <Button size="sm" onClick={run} disabled={generate.isPending}>
            {generate.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <RefreshCw className="w-4 h-4 mr-2" />}
            {dna ? "Refresh" : "Generate"}
          </Button>
        )}
      </div>

      {isLoading && <p className="text-sm text-muted-foreground">Loading…</p>}

      {!dna && !isLoading && (
        <Card className="border-dashed">
          <CardContent className="py-10 text-center space-y-2">
            <Sparkles className="w-6 h-6 mx-auto text-amber-500" />
            <p className="text-sm text-muted-foreground">No DNA yet — generate one from your shelf.</p>
          </CardContent>
        </Card>
      )}

      {dna && <DnaCard dna={dna} mine />}
      {dna && <FriendMatches myDna={dna} />}
    </div>
  );
};

export default ReadingDnaPanel;
