import React, { useState } from "react";
import { useCreateSpoilerThread } from "@/hooks/useSpoilerThreads";
import { useUserBookshelf } from "@/hooks/useUserBookshelf";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Lock, Plus, Loader2, ShieldCheck } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface NewSpoilerThreadDialogProps {
  initialBookId?: string;
  trigger?: React.ReactNode;
}

export const NewSpoilerThreadDialog: React.FC<NewSpoilerThreadDialogProps> = ({
  initialBookId,
  trigger,
}) => {
  const { data: shelf = [] } = useUserBookshelf();
  const [open, setOpen] = useState(false);
  const [bookId, setBookId] = useState(initialBookId || "");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [minChapter, setMinChapter] = useState(1);
  const create = useCreateSpoilerThread();
  const { toast } = useToast();

  const handleSubmit = async () => {
    const targetBook = bookId || initialBookId;
    if (!targetBook || !title.trim() || !body.trim()) return;

    try {
      await create.mutateAsync({
        book_id: targetBook,
        title: title.trim(),
        body: body.trim(),
        min_chapter: minChapter,
      });
      toast({
        title: `Spoiler-Safe Thread Posted!`,
        description: `Protected until readers reach Chapter ${minChapter}.`,
      });
      setOpen(false);
      setTitle("");
      setBody("");
      setMinChapter(1);
    } catch (e: any) {
      toast({
        title: "Could not post thread",
        description: e.message || "Failed to submit",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ? (
          trigger
        ) : (
          <Button size="sm" className="gap-2">
            <Plus className="w-4 h-4" /> Start Thread
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Lock className="w-5 h-5 text-indigo-500" />
            Spoiler-Safe Discussion Thread
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-3.5 py-2">
          {!initialBookId && (
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
          )}

          <div>
            <div className="flex items-center justify-between">
              <Label className="text-xs font-semibold">Unlocks at Chapter</Label>
              <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" /> Zero spoilers by design
              </span>
            </div>
            <Input
              type="number"
              min={1}
              value={minChapter}
              onChange={(e) => setMinChapter(parseInt(e.target.value || "1", 10))}
              className="mt-1"
            />
            <p className="text-[11px] text-muted-foreground mt-1">
              Readers will only see the thread content once their recorded progress reaches Chapter {minChapter}.
            </p>
          </div>

          <div>
            <Label className="text-xs font-semibold">Thread Title (Spoiler-free)</Label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. That huge reveal in the throne room…"
              className="mt-1"
            />
          </div>

          <div>
            <Label className="text-xs font-semibold">Thread Discussion Body</Label>
            <Textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Share theories, character reactions, emotional moments without worrying about spoiling other readers…"
              rows={5}
              className="mt-1 leading-relaxed"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={create.isPending || !(bookId || initialBookId) || !title.trim() || !body.trim()}
          >
            {create.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Post Safely
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
export default NewSpoilerThreadDialog;
