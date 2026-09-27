import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useReadingRoomLive, ReadingRoom as RoomType } from "@/hooks/useReadingRoom";
import { RoomChat } from "./RoomChat";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  ArrowLeft,
  Users,
  Sparkles,
  BookOpen,
  Radio,
  ExternalLink,
  CheckCircle2,
} from "lucide-react";
import { useAuth } from "@/contexts/authHelpers";
import { useToast } from "@/hooks/use-toast";

interface ReadingRoomProps {
  room: RoomType;
  onLeave: () => void;
}

export const ReadingRoom: React.FC<ReadingRoomProps> = ({ room, onLeave }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [sharePage, setSharePage] = useState(false);
  const [page, setPage] = useState<number>(1);
  const [pulseChapter, setPulseChapter] = useState(1);

  const { messages, presence, pulses, sendMessage, emitPulse } = useReadingRoomLive(
    room,
    sharePage,
    page
  );

  const handlePulse = async () => {
    try {
      await emitPulse(pulseChapter);
      toast({
        title: `Chapter ${pulseChapter} completed! 🎉`,
        description: "Your chapter pulse was shared with the room.",
      });
      setPulseChapter((prev) => prev + 1);
    } catch {
      toast({ title: "Failed to broadcast chapter pulse", variant: "destructive" });
    }
  };

  return (
    <Card className="overflow-hidden border-border bg-card shadow-lg">
      <CardContent className="p-0">
        {/* Top Room Banner / Header */}
        <div className="flex flex-wrap items-center justify-between gap-3 p-4 bg-muted/40 border-b border-border">
          <div className="flex items-center gap-3">
            <Button size="sm" variant="ghost" onClick={onLeave} className="h-8 px-2 gap-1">
              <ArrowLeft className="w-4 h-4" />
              <span className="text-xs">Leave</span>
            </Button>
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <div>
                <h3 className="font-semibold text-sm sm:text-base leading-tight flex items-center gap-2">
                  {room.name}
                </h3>
                <p className="text-xs text-muted-foreground flex items-center gap-1.5 mt-0.5">
                  <BookOpen className="w-3 h-3" />
                  <span>{room.books_library?.title ?? "Book"}</span>
                  <span>·</span>
                  <Users className="w-3 h-3 text-brand-primary" />
                  <span className="font-medium text-foreground">{presence.length} reading now</span>
                </p>
              </div>
            </div>
          </div>

          {/* Reader Controls: Page Sharing & Reader shortcut */}
          <div className="flex items-center gap-3">
            <Link to={`/reader/${room.book_id}?page=${page}`}>
              <Button size="sm" variant="outline" className="h-8 text-xs gap-1 border-brand-primary/30">
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Open Reader</span>
              </Button>
            </Link>

            {user && (
              <div className="flex items-center gap-2 bg-background/80 px-2.5 py-1 rounded-lg border border-border">
                <Label htmlFor="share-page-switch" className="text-xs text-muted-foreground cursor-pointer">
                  Share page
                </Label>
                <Switch
                  id="share-page-switch"
                  checked={sharePage}
                  onCheckedChange={setSharePage}
                  className="scale-90"
                />
                {sharePage && (
                  <div className="flex items-center gap-1">
                    <span className="text-xs font-semibold">p.</span>
                    <Input
                      type="number"
                      min={1}
                      className="w-14 h-7 text-xs px-1.5 py-0"
                      value={page}
                      onChange={(e) => setPage(parseInt(e.target.value || "1", 10))}
                    />
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Split Layout: Left = Participants & Pulses, Right = Chat */}
        <div className="grid md:grid-cols-[260px_1fr] divide-y md:divide-y-0 md:divide-x divide-border">
          {/* Left Column: Presence & Pulses */}
          <div className="bg-muted/20 p-4 space-y-5">
            {/* Participants */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                  <Radio className="w-3 h-3 text-emerald-500" />
                  Live Readers ({presence.length})
                </p>
              </div>

              <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                {presence.length === 0 ? (
                  <p className="text-xs text-muted-foreground italic">Connecting to room…</p>
                ) : (
                  presence.map((p, idx) => (
                    <div
                      key={p.user_id + idx}
                      className="flex items-center justify-between bg-card p-2 rounded-lg border border-border/60 text-xs"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <Avatar className="w-6 h-6">
                          <AvatarFallback className="text-[9px] bg-brand-primary text-white">
                            {p.name.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <span className="font-medium truncate max-w-[110px]">{p.name}</span>
                      </div>

                      {p.share_page && p.page != null ? (
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 font-mono bg-background">
                          p. {p.page}
                        </Badge>
                      ) : (
                        <span className="text-[10px] text-muted-foreground">Reading</span>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Chapter Pulses Stream */}
            <div className="space-y-2.5 pt-2 border-t border-border">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  Chapter Pulses
                </p>
              </div>

              <div className="space-y-1.5 max-h-44 overflow-y-auto pr-1">
                {pulses.length === 0 ? (
                  <p className="text-xs text-muted-foreground italic">
                    Pulses appear when readers finish chapters.
                  </p>
                ) : (
                  pulses.slice().reverse().map((pulse, i) => (
                    <div
                      key={i}
                      className="text-xs p-2 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-900 dark:text-amber-200 flex items-center gap-2"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                      <span className="font-medium">
                        {pulse.user_name || "A reader"} completed Chapter {pulse.chapter}
                      </span>
                    </div>
                  ))
                )}
              </div>

              {/* Trigger Pulse Action */}
              {user && (
                <div className="pt-2">
                  <div className="flex items-center gap-2 bg-card p-2 rounded-lg border border-border">
                    <span className="text-[11px] text-muted-foreground shrink-0">Ch.</span>
                    <Input
                      type="number"
                      min={1}
                      value={pulseChapter}
                      onChange={(e) => setPulseChapter(parseInt(e.target.value || "1", 10))}
                      className="h-7 w-12 text-xs px-1"
                    />
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={handlePulse}
                      className="h-7 text-xs flex-1 gap-1"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                      Pulse Complete
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Realtime Room Chat */}
          <div>
            <RoomChat messages={messages} onSendMessage={sendMessage} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
export default ReadingRoom;
