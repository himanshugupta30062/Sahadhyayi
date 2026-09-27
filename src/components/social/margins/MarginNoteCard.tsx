import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Quote,
  Heart,
  BookOpen,
  MessageCircle,
  ExternalLink,
  Trash2,
  Send,
  Loader2,
  Lock,
  Globe,
} from "lucide-react";
import {
  MarginNote,
  useToggleMarginReaction,
  useMarginNoteReplies,
  useCreateMarginNoteReply,
  useDeleteMarginNote,
} from "@/hooks/useMarginNotes";
import { useAuth } from "@/contexts/authHelpers";
import { formatDistanceToNow } from "date-fns";
import { useToast } from "@/hooks/use-toast";

const EMOJIS = ["❤️", "👏", "🤔", "🔥"];

interface MarginNoteCardProps {
  note: MarginNote;
}

export const MarginNoteCard: React.FC<MarginNoteCardProps> = ({ note }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const react = useToggleMarginReaction();
  const deleteNote = useDeleteMarginNote();
  const createReply = useCreateMarginNoteReply();

  const [showReplies, setShowReplies] = useState(false);
  const [replyText, setReplyText] = useState("");
  const { data: replies = [], isLoading: isLoadingReplies } = useMarginNoteReplies(showReplies ? note.id : undefined);

  const isOwner = user?.id === note.user_id;

  const handleReplySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim()) return;
    try {
      await createReply.mutateAsync({ noteId: note.id, body: replyText.trim() });
      setReplyText("");
      toast({ title: "Reply added!" });
    } catch (err: any) {
      toast({ title: "Failed to reply", description: err.message, variant: "destructive" });
    }
  };

  const handleDelete = async () => {
    if (!confirm("Delete this margin note?")) return;
    try {
      await deleteNote.mutateAsync(note.id);
      toast({ title: "Note deleted" });
    } catch (err: any) {
      toast({ title: "Error deleting note", description: err.message, variant: "destructive" });
    }
  };

  const userReactions = new Set(note.user_reactions || []);

  return (
    <Card className="overflow-hidden bg-card border-border hover:shadow-md transition-all">
      <CardContent className="p-4 sm:p-5 space-y-3">
        {/* Book & Author Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex gap-3 min-w-0">
            <Link to={`/book/${note.book_id}?tab=read&page=${note.page}`} className="shrink-0 group">
              <div className="w-12 h-16 rounded bg-muted overflow-hidden relative shadow-sm group-hover:ring-2 ring-brand-primary transition-all">
                {note.books_library?.cover_image_url ? (
                  <img src={note.books_library.cover_image_url} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-brand-primary/10">
                    <BookOpen className="w-4 h-4 text-brand-primary" />
                  </div>
                )}
              </div>
            </Link>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <Link to={`/book/${note.book_id}`} className="font-semibold text-sm hover:underline truncate">
                  {note.books_library?.title ?? "Untitled Book"}
                </Link>
                <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4">
                  p. {note.page}
                </Badge>
                {note.visibility === "friends" ? (
                  <Badge variant="secondary" className="text-[9px] px-1 py-0 h-4 gap-0.5 text-muted-foreground">
                    <Lock className="w-2.5 h-2.5" /> Friends
                  </Badge>
                ) : (
                  <Badge variant="secondary" className="text-[9px] px-1 py-0 h-4 gap-0.5 text-muted-foreground">
                    <Globe className="w-2.5 h-2.5" /> Public
                  </Badge>
                )}
              </div>

              <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                <Avatar className="w-4 h-4">
                  <AvatarImage src={note.profiles?.profile_photo_url || ""} />
                  <AvatarFallback className="text-[8px] bg-brand-primary text-white">
                    {note.profiles?.full_name?.charAt(0) || "R"}
                  </AvatarFallback>
                </Avatar>
                <span className="font-medium text-foreground truncate">{note.profiles?.full_name ?? "Reader"}</span>
                <span>·</span>
                <span>{formatDistanceToNow(new Date(note.created_at), { addSuffix: true })}</span>
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-1 shrink-0">
            <Link to={`/book/${note.book_id}?tab=read&page=${note.page}`}>
              <Button size="sm" variant="ghost" className="h-8 px-2 text-xs text-brand-primary gap-1">
                <ExternalLink className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Open at page</span>
              </Button>
            </Link>
            {isOwner && (
              <Button size="icon" variant="ghost" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={handleDelete}>
                <Trash2 className="w-3.5 h-3.5" />
              </Button>
            )}
          </div>
        </div>

        {/* Quoted Passage */}
        <blockquote className="border-l-4 border-amber-400 bg-amber-50/70 dark:bg-amber-950/20 px-3.5 py-2.5 italic text-sm text-foreground/90 rounded-r font-serif leading-relaxed">
          <Quote className="w-3.5 h-3.5 inline mr-1.5 text-amber-500 fill-amber-500/20 align-text-top" />
          "{note.quote}"
        </blockquote>

        {/* Reader Note */}
        <p className="text-sm leading-relaxed text-foreground whitespace-pre-wrap">{note.note}</p>

        {/* Reactions & Reply Toggle Footer */}
        <div className="flex items-center justify-between pt-2 border-t border-border/60">
          <div className="flex items-center gap-1">
            {EMOJIS.map((e) => {
              const active = userReactions.has(e);
              return (
                <Button
                  key={e}
                  size="sm"
                  variant={active ? "secondary" : "ghost"}
                  className={`h-7 px-2 text-xs rounded-full transition-all ${
                    active ? "bg-amber-100 text-amber-900 border border-amber-300 dark:bg-amber-950 dark:text-amber-200" : ""
                  }`}
                  onClick={() => react.mutate({ noteId: note.id, emoji: e })}
                  disabled={!user}
                >
                  <span className="mr-0.5">{e}</span>
                </Button>
              );
            })}
            {note.reactions_count > 0 && (
              <span className="text-xs text-muted-foreground ml-1.5 flex items-center gap-1">
                <Heart className="w-3 h-3 text-red-500 fill-red-500" />
                {note.reactions_count}
              </span>
            )}
          </div>

          <Button
            size="sm"
            variant="ghost"
            className="h-7 px-2.5 text-xs text-muted-foreground hover:text-foreground gap-1.5"
            onClick={() => setShowReplies((prev) => !prev)}
          >
            <MessageCircle className="w-3.5 h-3.5" />
            <span>{note.replies_count || 0} replies</span>
          </Button>
        </div>

        {/* Inline Replies Section */}
        {showReplies && (
          <div className="mt-3 pt-3 border-t border-border/40 space-y-3 bg-muted/20 p-3 rounded-lg">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Replies ({replies.length})
            </p>

            {isLoadingReplies ? (
              <div className="py-2 text-center text-xs text-muted-foreground">Loading replies…</div>
            ) : replies.length === 0 ? (
              <p className="text-xs text-muted-foreground italic">No replies yet. Start the conversation!</p>
            ) : (
              <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
                {replies.map((r) => (
                  <div key={r.id} className="text-xs space-y-1 bg-background/80 p-2 rounded border border-border/50">
                    <div className="flex items-center justify-between text-muted-foreground">
                      <div className="flex items-center gap-1.5">
                        <Avatar className="w-3.5 h-3.5">
                          <AvatarImage src={r.profiles?.profile_photo_url || ""} />
                          <AvatarFallback className="text-[7px]">
                            {r.profiles?.full_name?.charAt(0) || "U"}
                          </AvatarFallback>
                        </Avatar>
                        <span className="font-medium text-foreground">{r.profiles?.full_name ?? "Reader"}</span>
                      </div>
                      <span>{formatDistanceToNow(new Date(r.created_at), { addSuffix: true })}</span>
                    </div>
                    <p className="text-foreground pl-5">{r.body}</p>
                  </div>
                ))}
              </div>
            )}

            {/* Reply Input Form */}
            {user ? (
              <form onSubmit={handleReplySubmit} className="flex gap-2 pt-1">
                <Input
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder="Write a margin reply…"
                  className="h-8 text-xs bg-background"
                />
                <Button size="sm" type="submit" className="h-8 px-3 text-xs gap-1" disabled={createReply.isPending || !replyText.trim()}>
                  {createReply.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <Send className="w-3 h-3" />}
                  Reply
                </Button>
              </form>
            ) : (
              <p className="text-[11px] text-muted-foreground text-center">Sign in to join the conversation.</p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
export default MarginNoteCard;
