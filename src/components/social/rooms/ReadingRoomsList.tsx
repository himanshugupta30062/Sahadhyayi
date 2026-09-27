import React, { useState } from "react";
import { ReadingRoom, useCreateReadingRoom } from "@/hooks/useReadingRoom";
import { useUserBookshelf } from "@/hooks/useUserBookshelf";
import { useAuth } from "@/contexts/authHelpers";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { BookOpen, Radio, Users, Plus, Loader2, Sparkles } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ReadingRoomsListProps {
  rooms: ReadingRoom[];
  isLoading: boolean;
  onSelectRoom: (room: ReadingRoom) => void;
}

export const ReadingRoomsList: React.FC<ReadingRoomsListProps> = ({
  rooms,
  isLoading,
  onSelectRoom,
}) => {
  const { user } = useAuth();
  const { data: shelf = [] } = useUserBookshelf();
  const [createOpen, setCreateOpen] = useState(false);
  const [bookId, setBookId] = useState("");
  const [roomName, setRoomName] = useState("");
  const create = useCreateReadingRoom();
  const { toast } = useToast();

  const handleCreateSubmit = async () => {
    if (!bookId || !roomName.trim()) return;
    try {
      const newRoom = await create.mutateAsync({ book_id: bookId, name: roomName.trim() });
      toast({ title: "Reading room created! 🎉" });
      setCreateOpen(false);
      setRoomName("");
      setBookId("");
      if (newRoom) {
        onSelectRoom(newRoom as unknown as ReadingRoom);
      }
    } catch (e: any) {
      toast({
        title: "Could not create room",
        description: e.message || "Failed to create",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-4">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-card p-4 rounded-xl border border-border">
        <div>
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Radio className="w-5 h-5 text-emerald-500" />
            Reading Rooms
          </h2>
          <p className="text-xs text-muted-foreground">
            Live co-reading spaces. See who's reading, track chapters, and chat in real-time.
          </p>
        </div>

        {user && (
          <Dialog open={createOpen} onOpenChange={setCreateOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="gap-2 self-start sm:self-auto">
                <Plus className="w-4 h-4" /> New Room
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create a Reading Room</DialogTitle>
              </DialogHeader>
              <div className="space-y-3 py-2">
                <div>
                  <Label className="text-xs font-semibold">Book</Label>
                  <Select value={bookId} onValueChange={setBookId}>
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Pick a book from your shelf" />
                    </SelectTrigger>
                    <SelectContent>
                      {shelf.map((b: any) => (
                        <SelectItem key={b.book_id} value={b.book_id}>
                          {b.books_library?.title ?? "Untitled"}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs font-semibold">Room Name</Label>
                  <Input
                    value={roomName}
                    onChange={(e) => setRoomName(e.target.value)}
                    placeholder="e.g. Sunday Slow Read, Chapter 4 Deep Dive"
                    className="mt-1"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setCreateOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreateSubmit} disabled={create.isPending || !bookId || !roomName.trim()}>
                  {create.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Open Room
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Loading state */}
      {isLoading && (
        <div className="flex justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-brand-primary" />
        </div>
      )}

      {/* Empty state */}
      {!isLoading && rooms.length === 0 && (
        <Card className="border-dashed bg-card/60">
          <CardContent className="py-12 text-center space-y-3">
            <div className="w-12 h-12 mx-auto rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-600">
              <Radio className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">No active reading rooms</p>
              <p className="text-xs text-muted-foreground max-w-sm mx-auto mt-1">
                Be the first to open a live reading room for a book on your shelf. Friends and community members can join and co-read!
              </p>
            </div>
            {user && (
              <Button size="sm" variant="outline" className="text-xs" onClick={() => setCreateOpen(true)}>
                Start First Room
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Rooms Grid */}
      {!isLoading && rooms.length > 0 && (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {rooms.map((room) => (
            <Card
              key={room.id}
              className="hover:shadow-md hover:border-emerald-500/40 transition-all cursor-pointer group bg-card"
              onClick={() => onSelectRoom(room)}
            >
              <CardContent className="p-4 flex gap-3">
                <div className="w-14 h-20 rounded bg-muted overflow-hidden shrink-0 shadow-sm relative group-hover:scale-105 transition-transform">
                  {room.books_library?.cover_image_url ? (
                    <img
                      src={room.books_library.cover_image_url}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-brand-primary/10">
                      <BookOpen className="w-5 h-5 text-brand-primary" />
                    </div>
                  )}
                  <div className="absolute top-1 right-1 w-2.5 h-2.5 rounded-full bg-emerald-500 border border-white" />
                </div>

                <div className="flex-1 min-w-0 flex flex-col justify-between">
                  <div>
                    <h3 className="font-semibold text-sm truncate group-hover:text-emerald-600 transition-colors">
                      {room.name}
                    </h3>
                    <p className="text-xs text-muted-foreground truncate mt-0.5">
                      {room.books_library?.title ?? "Untitled Book"}
                    </p>
                    {room.books_library?.author && (
                      <p className="text-[11px] text-muted-foreground/80 truncate">
                        by {room.books_library.author}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center justify-between pt-2 mt-2 border-t border-border/50">
                    <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                      <Users className="w-3 h-3 text-emerald-500" />
                      Live co-read
                    </span>
                    <Badge variant="outline" className="text-[10px] group-hover:bg-emerald-50 group-hover:text-emerald-700 transition-colors">
                      Join Room →
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
export default ReadingRoomsList;
