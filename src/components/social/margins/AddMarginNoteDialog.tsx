import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useCreateMarginNote } from "@/hooks/useMarginNotes";
import { useUserBookshelf } from "@/hooks/useUserBookshelf";
import { Plus, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface AddMarginNoteDialogProps {
  initialBookId?: string;
  initialBookTitle?: string;
  initialPage?: number;
  initialQuote?: string;
  trigger?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  onDone?: () => void;
}

export const AddMarginNoteDialog: React.FC<AddMarginNoteDialogProps> = ({
  initialBookId,
  initialBookTitle,
  initialPage = 1,
  initialQuote = "",
  trigger,
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange,
  onDone,
}) => {
  const [internalOpen, setInternalOpen] = useState(false);
  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : internalOpen;
  const setOpen = isControlled ? (controlledOnOpenChange ?? (() => {})) : setInternalOpen;

  const { data: shelf = [] } = useUserBookshelf();
  const [bookId, setBookId] = useState(initialBookId || "");
  const [page, setPage] = useState(initialPage);
  const [quote, setQuote] = useState(initialQuote);
  const [note, setNote] = useState("");
  const [visibility, setVisibility] = useState<"public" | "friends">("public");
  const create = useCreateMarginNote();
  const { toast } = useToast();

  // Reset when dialog opens
  const handleOpenChange = (nextOpen: boolean) => {
    if (nextOpen) {
      if (initialBookId) setBookId(initialBookId);
      if (initialPage) setPage(initialPage);
      if (initialQuote) setQuote(initialQuote);
    }
    setOpen(nextOpen);
  };

  const submit = async () => {
    const targetBookId = bookId || initialBookId;
    if (!targetBookId || !quote.trim() || !note.trim()) {
      toast({
        title: "Missing fields",
        description: "Please specify book, quote, and your thought.",
        variant: "destructive",
      });
      return;
    }

    try {
      await create.mutateAsync({
        book_id: targetBookId,
        page: page || 1,
        quote: quote.trim(),
        note: note.trim(),
        visibility,
      });
      toast({ title: "Margin note posted!" });
      setOpen(false);
      setNote("");
      if (!initialQuote) setQuote("");
      onDone?.();
    } catch (e: any) {
      toast({
        title: "Couldn't post margin note",
        description: e.message || "Failed to create note",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      {trigger !== undefined ? (
        <DialogTrigger asChild>{trigger}</DialogTrigger>
      ) : (
        <DialogTrigger asChild>
          <Button size="sm" className="gap-2">
            <Plus className="w-4 h-4" /> Margin note
          </Button>
        </DialogTrigger>
      )}
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Share a margin note</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 py-2">
          {!initialBookId ? (
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
          ) : (
            <div>
              <Label className="text-xs font-semibold text-muted-foreground">Book</Label>
              <p className="text-sm font-medium text-foreground mt-0.5">{initialBookTitle || "Selected Book"}</p>
            </div>
          )}

          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-1">
              <Label className="text-xs font-semibold">Page / Loc</Label>
              <Input
                type="number"
                min={1}
                value={page}
                onChange={(e) => setPage(parseInt(e.target.value || "1", 10))}
                className="mt-1"
              />
            </div>
            <div className="col-span-2">
              <Label className="text-xs font-semibold">Visibility</Label>
              <Select value={visibility} onValueChange={(v: "public" | "friends") => setVisibility(v)}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="public">Public (Everyone)</SelectItem>
                  <SelectItem value="friends">Friends only</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label className="text-xs font-semibold">Quoted passage</Label>
            <Textarea
              placeholder="Highlight or paste the exact sentence or passage…"
              value={quote}
              onChange={(e) => setQuote(e.target.value)}
              rows={3}
              className="mt-1 font-serif text-sm"
            />
          </div>

          <div>
            <Label className="text-xs font-semibold">Your thought / margin annotation</Label>
            <Textarea
              placeholder="What struck you about this? An observation, insight, or feeling…"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={3}
              className="mt-1"
            />
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={submit} disabled={create.isPending || !(bookId || initialBookId) || !quote || !note}>
            {create.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Post Note
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
export default AddMarginNoteDialog;
