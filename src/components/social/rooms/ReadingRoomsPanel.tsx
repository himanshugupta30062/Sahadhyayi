import { useState } from "react";
import { useReadingRooms, useCreateReadingRoom, useReadingRoomLive } from "@/hooks/useReadingRoom";
import { useUserBookshelf } from "@/hooks/useUserBookshelf";
import { useAuth } from "@/contexts/authHelpers";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BookOpen, Send, ArrowLeft, Sparkles, Loader2, Plus, Users } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const CreateRoom = () => {
  const { data: shelf = [] } = useUserBookshelf();
  const [open, setOpen] = useState(false);
  const [bookId, setBookId] = useState("");
  const [name, setName] = useState("");
  const create = useCreateReadingRoom();
  const { toast } = useToast();

  const submit = async () => {
    if (!bookId || !name.trim()) return;
    try {
      await create.mutateAsync({ book_id: bookId, name: name.trim() });
      toast({ title: "Room ready" });
      setOpen(false); setName("");
    } catch (e: any) {
      toast({ title: "Couldn't create", description: e.message, variant: "destructive" });
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="gap-2"><Plus className="w-4 h-4" /> New room</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Create a reading room</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div>
            <Label className="text-xs">Book</Label>
            <Select value={bookId} onValueChange={setBookId}>
              <SelectTrigger><SelectValue placeholder="Pick a book" /></SelectTrigger>
              <SelectContent>
                {shelf.map((b: any) => (
                  <SelectItem key={b.book_id} value={b.book_id}>{b.books_library?.title ?? "Untitled"}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">Room name</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Sunday slow read" />
          </div>
        </div>
        <DialogFooter>
          <Button onClick={submit} disabled={create.isPending || !bookId || !name}>
            {create.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}Create
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

const RoomView = ({ roomId, name, onBack }: { roomId: string; name: string; onBack: () => void }) => {
  const [sharePage, setSharePage] = useState(false);
  const [page, setPage] = useState<number>(1);
  const [draft, setDraft] = useState("");
  const { messages, presence, pulses, sendMessage } = useReadingRoomLive(roomId, sharePage, page);

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-0">
        <div className="flex items-center gap-3 p-3 border-b">
          <Button size="sm" variant="ghost" onClick={onBack}><ArrowLeft className="w-4 h-4" /></Button>
          <div className="flex-1">
            <p className="font-semibold text-sm">{name}</p>
            <p className="text-xs text-muted-foreground flex items-center gap-1"><Users className="w-3 h-3" />{presence.length} reading now</p>
          </div>
          <div className="flex items-center gap-2">
            <Label htmlFor="share-page" className="text-xs text-muted-foreground">Share page</Label>
            <Switch id="share-page" checked={sharePage} onCheckedChange={setSharePage} />
            {sharePage && (
              <Input type="number" min={1} className="w-16 h-8" value={page} onChange={(e) => setPage(parseInt(e.target.value || "1"))} />
            )}
          </div>
        </div>

        <div className="grid md:grid-cols-[220px_1fr] min-h-[400px]">
          <div className="border-r bg-muted/30 p-3 space-y-2 max-h-[500px] overflow-y-auto">
            <p className="text-xs font-medium text-muted-foreground uppercase">Readers</p>
            {presence.length === 0 && <p className="text-xs text-muted-foreground">Just you so far…</p>}
            {presence.map((p) => (
              <div key={p.user_id} className="flex items-center justify-between text-sm">
                <span className="truncate">{p.name}</span>
                {p.share_page && p.page != null && <Badge variant="outline" className="text-[10px]">p.{p.page}</Badge>}
              </div>
            ))}
            {pulses.length > 0 && (
              <>
                <p className="text-xs font-medium text-muted-foreground uppercase mt-4">Recent pulses</p>
                {pulses.slice().reverse().map((p, i) => (
                  <p key={i} className="text-xs text-amber-700 flex items-center gap-1">
                    <Sparkles className="w-3 h-3" /> Chapter {p.chapter} complete
                  </p>
                ))}
              </>
            )}
          </div>

          <div className="flex flex-col max-h-[500px]">
            <div className="flex-1 overflow-y-auto p-3 space-y-2">
              {messages.length === 0 && <p className="text-xs text-muted-foreground text-center py-6">Say hi — the room is live.</p>}
              {messages.map((m) => (
                <div key={m.id} className="text-sm">
                  <span className="font-medium text-foreground">{m.profiles?.full_name ?? "Reader"}: </span>
                  <span className="text-foreground/90">{m.body}</span>
                </div>
              ))}
            </div>
            <form
              onSubmit={(e) => { e.preventDefault(); sendMessage(draft); setDraft(""); }}
              className="border-t p-2 flex gap-2"
            >
              <Input value={draft} onChange={(e) => setDraft(e.target.value)} placeholder="Type a message…" />
              <Button size="sm" type="submit"><Send className="w-4 h-4" /></Button>
            </form>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

const ReadingRoomsPanel = () => {
  const { user } = useAuth();
  const { data: rooms = [], isLoading } = useReadingRooms();
  const [openRoom, setOpenRoom] = useState<{ id: string; name: string } | null>(null);

  if (openRoom) return <RoomView roomId={openRoom.id} name={openRoom.name} onBack={() => setOpenRoom(null)} />;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Reading Rooms</h2>
          <p className="text-sm text-muted-foreground">Live co-reading spaces. See who's in, chat, watch chapter pulses.</p>
        </div>
        {user && <CreateRoom />}
      </div>

      {isLoading && <p className="text-sm text-muted-foreground">Loading rooms…</p>}
      {!isLoading && rooms.length === 0 && (
        <Card className="border-dashed"><CardContent className="py-10 text-center text-muted-foreground text-sm">
          No rooms yet. Create one for a book on your shelf.
        </CardContent></Card>
      )}

      <div className="grid sm:grid-cols-2 gap-3">
        {rooms.map((r) => (
          <Card key={r.id} className="hover:shadow-md transition-shadow cursor-pointer"
            onClick={() => setOpenRoom({ id: r.id, name: r.name })}>
            <CardContent className="p-4 flex gap-3">
              <div className="w-12 h-16 rounded bg-muted overflow-hidden shrink-0">
                {r.books_library?.cover_image_url
                  ? <img src={r.books_library.cover_image_url} alt="" className="w-full h-full object-cover" />
                  : <div className="w-full h-full flex items-center justify-center"><BookOpen className="w-4 h-4 text-muted-foreground" /></div>}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm truncate">{r.name}</p>
                <p className="text-xs text-muted-foreground truncate">{r.books_library?.title}</p>
                <Badge variant="outline" className="mt-2 text-[10px]">Tap to join</Badge>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default ReadingRoomsPanel;
