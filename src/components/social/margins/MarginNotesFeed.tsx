import { useState } from "react";
import { useMarginNotes, useCreateMarginNote, useToggleMarginReaction } from "@/hooks/useMarginNotes";
import { useAuth } from "@/contexts/authHelpers";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useUserBookshelf } from "@/hooks/useUserBookshelf";
import { Quote, Heart, BookOpen, Plus, Loader2 } from "lucide-react";
import { Link } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";

const EMOJIS = ["❤️", "👏", "🤔", "🔥"];

const AddDialog = ({ onDone }: { onDone?: () => void }) => {
  const { data: shelf = [] } = useUserBookshelf();
  const [open, setOpen] = useState(false);
  const [bookId, setBookId] = useState("");
  const [page, setPage] = useState(1);
  const [quote, setQuote] = useState("");
  const [note, setNote] = useState("");
  const [visibility, setVisibility] = useState<"public" | "friends">("public");
  const create = useCreateMarginNote();
  const { toast } = useToast();

  const submit = async () => {
    if (!bookId || !quote.trim() || !note.trim()) return;
    try {
      await create.mutateAsync({ book_id: bookId, page, quote: quote.trim(), note: note.trim(), visibility });
      toast({ title: "Margin note posted" });
      setOpen(false); setQuote(""); setNote(""); setPage(1);
      onDone?.();
    } catch (e: any) {
      toast({ title: "Couldn't post", description: e.message, variant: "destructive" });
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="gap-2"><Plus className="w-4 h-4" /> Margin note</Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader><DialogTitle>Share a margin note</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div>
            <Label className="text-xs">Book</Label>
            <Select value={bookId} onValueChange={setBookId}>
              <SelectTrigger><SelectValue placeholder="Pick a book from your shelf" /></SelectTrigger>
              <SelectContent>
                {shelf.map((b: any) => (
                  <SelectItem key={b.book_id} value={b.book_id}>{b.books_library?.title ?? "Untitled"}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-1">
              <Label className="text-xs">Page</Label>
              <Input type="number" min={1} value={page} onChange={(e) => setPage(parseInt(e.target.value || "1"))} />
            </div>
            <div className="col-span-2">
              <Label className="text-xs">Visibility</Label>
              <Select value={visibility} onValueChange={(v: any) => setVisibility(v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="public">Public</SelectItem>
                  <SelectItem value="friends">Friends only</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <Label className="text-xs">Quoted passage</Label>
            <Textarea placeholder="Type or paste the passage…" value={quote} onChange={(e) => setQuote(e.target.value)} rows={3} />
          </div>
          <div>
            <Label className="text-xs">Your thought</Label>
            <Textarea placeholder="What struck you about this?" value={note} onChange={(e) => setNote(e.target.value)} rows={3} />
          </div>
        </div>
        <DialogFooter>
          <Button onClick={submit} disabled={create.isPending || !bookId || !quote || !note}>
            {create.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}Post note
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

const MarginNotesFeed = () => {
  const { user } = useAuth();
  const { data: notes = [], isLoading } = useMarginNotes();
  const react = useToggleMarginReaction();

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Margins</h2>
          <p className="text-sm text-muted-foreground">Passages that struck other readers — react, reply, build a living margin.</p>
        </div>
        {user && <AddDialog />}
      </div>

      {isLoading && <p className="text-sm text-muted-foreground">Loading notes…</p>}
      {!isLoading && notes.length === 0 && (
        <Card className="border-dashed"><CardContent className="py-10 text-center text-muted-foreground text-sm">
          No margin notes yet. Be the first to post one.
        </CardContent></Card>
      )}

      <div className="space-y-3">
        {notes.map((n) => (
          <Card key={n.id} className="overflow-hidden hover:shadow-md transition-shadow">
            <CardContent className="p-4 sm:p-5 space-y-3">
              <div className="flex gap-3">
                <Link to={`/book/${n.book_id}`} className="shrink-0">
                  <div className="w-12 h-16 rounded bg-muted overflow-hidden">
                    {n.books_library?.cover_image_url
                      ? <img src={n.books_library.cover_image_url} alt="" className="w-full h-full object-cover" />
                      : <div className="w-full h-full flex items-center justify-center"><BookOpen className="w-4 h-4 text-muted-foreground" /></div>}
                  </div>
                </Link>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm truncate">{n.books_library?.title ?? "Book"}</p>
                  <p className="text-xs text-muted-foreground">
                    {n.profiles?.full_name ?? "Reader"} · p.{n.page} · {formatDistanceToNow(new Date(n.created_at), { addSuffix: true })}
                  </p>
                </div>
              </div>

              <blockquote className="border-l-4 border-amber-400 bg-amber-50/60 px-3 py-2 italic text-sm text-foreground/90 rounded-r">
                <Quote className="w-3 h-3 inline mr-1 text-amber-500" />{n.quote}
              </blockquote>
              <p className="text-sm leading-relaxed">{n.note}</p>

              <div className="flex items-center gap-2 pt-1">
                {EMOJIS.map((e) => (
                  <Button key={e} size="sm" variant="ghost" className="h-7 px-2 text-sm"
                    onClick={() => react.mutate({ noteId: n.id, emoji: e })}>
                    <span className="mr-1">{e}</span>
                  </Button>
                ))}
                <span className="text-xs text-muted-foreground ml-auto flex items-center gap-1">
                  <Heart className="w-3 h-3" /> {n.reactions_count}
                </span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default MarginNotesFeed;
