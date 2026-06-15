import { useState } from "react";
import { useSpoilerThreads, useCreateSpoilerThread } from "@/hooks/useSpoilerThreads";
import { useUserBookshelf } from "@/hooks/useUserBookshelf";
import { useAuth } from "@/contexts/authHelpers";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Lock, Unlock, BookOpen, Plus, Loader2 } from "lucide-react";
import { Link } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";

const NewThreadDialog = () => {
  const { data: shelf = [] } = useUserBookshelf();
  const [open, setOpen] = useState(false);
  const [bookId, setBookId] = useState("");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [minChapter, setMinChapter] = useState(1);
  const create = useCreateSpoilerThread();
  const { toast } = useToast();

  const submit = async () => {
    if (!bookId || !title.trim() || !body.trim()) return;
    try {
      await create.mutateAsync({ book_id: bookId, title: title.trim(), body: body.trim(), min_chapter: minChapter });
      toast({ title: "Thread posted" });
      setOpen(false); setTitle(""); setBody(""); setMinChapter(1);
    } catch (e: any) {
      toast({ title: "Couldn't post", description: e.message, variant: "destructive" });
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="gap-2"><Plus className="w-4 h-4" /> Start thread</Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader><DialogTitle>Spoiler-safe thread</DialogTitle></DialogHeader>
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
            <Label className="text-xs">Unlocks at chapter</Label>
            <Input type="number" min={1} value={minChapter} onChange={(e) => setMinChapter(parseInt(e.target.value || "1"))} />
            <p className="text-xs text-muted-foreground mt-1">Readers only see the body once they've completed this chapter.</p>
          </div>
          <div>
            <Label className="text-xs">Title</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="That ending though…" />
          </div>
          <div>
            <Label className="text-xs">Your thoughts</Label>
            <Textarea value={body} onChange={(e) => setBody(e.target.value)} rows={5} />
          </div>
        </div>
        <DialogFooter>
          <Button onClick={submit} disabled={create.isPending || !bookId || !title || !body}>
            {create.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}Post
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

const SpoilerThreadsFeed = () => {
  const { user } = useAuth();
  const { data: threads = [], isLoading } = useSpoilerThreads();

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Spoiler-safe threads</h2>
          <p className="text-sm text-muted-foreground">Discussions stay locked until you've read far enough. No accidents.</p>
        </div>
        {user && <NewThreadDialog />}
      </div>

      {isLoading && <p className="text-sm text-muted-foreground">Loading threads…</p>}
      {!isLoading && threads.length === 0 && (
        <Card className="border-dashed"><CardContent className="py-10 text-center text-muted-foreground text-sm">
          No threads yet — start one safely.
        </CardContent></Card>
      )}

      <div className="space-y-3">
        {threads.map((t) => (
          <Card key={t.id} className="overflow-hidden">
            <CardContent className="p-4 sm:p-5 space-y-3">
              <div className="flex gap-3">
                <Link to={`/book/${t.book_id}`} className="shrink-0">
                  <div className="w-12 h-16 rounded bg-muted overflow-hidden">
                    {t.books_library?.cover_image_url
                      ? <img src={t.books_library.cover_image_url} alt="" className="w-full h-full object-cover" />
                      : <div className="w-full h-full flex items-center justify-center"><BookOpen className="w-4 h-4 text-muted-foreground" /></div>}
                  </div>
                </Link>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-semibold text-sm truncate">{t.title}</p>
                    <Badge variant={t.is_unlocked ? "secondary" : "outline"} className="gap-1 text-[10px]">
                      {t.is_unlocked ? <Unlock className="w-3 h-3" /> : <Lock className="w-3 h-3" />} Ch. {t.min_chapter}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {t.books_library?.title} · {t.profiles?.full_name ?? "Reader"} · {formatDistanceToNow(new Date(t.created_at), { addSuffix: true })}
                  </p>
                </div>
              </div>

              {t.is_unlocked && t.body ? (
                <p className="text-sm leading-relaxed whitespace-pre-wrap">{t.body}</p>
              ) : (
                <div className="rounded-lg border border-dashed bg-muted/40 p-4 text-center">
                  <Lock className="w-5 h-5 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">Locked — finish chapter {t.min_chapter} to unlock</p>
                  <Link to={`/book/${t.book_id}`}>
                    <Button size="sm" variant="link">Open book</Button>
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default SpoilerThreadsFeed;
