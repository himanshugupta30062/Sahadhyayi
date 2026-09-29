import React, { useState } from "react";
import { Link } from "react-router-dom";
import {
  SafeSpoilerThread,
  useSpoilerThreadComments,
  useCreateSpoilerThreadComment,
  useUnlockChapter,
} from "@/hooks/useSpoilerThreads";
import { useAuth } from "@/contexts/authHelpers";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import {
  Lock,
  Unlock,
  BookOpen,
  MessageSquare,
  CheckCircle2,
  ExternalLink,
  Send,
  Loader2,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { DnaMatchChip } from "../dna/DnaMatchChip";

interface SpoilerThreadCardProps {
  thread: SafeSpoilerThread;
}

export const SpoilerThreadCard: React.FC<SpoilerThreadCardProps> = ({ thread }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState("");

  const unlockMutation = useUnlockChapter();
  const commentMutation = useCreateSpoilerThreadComment();
  const { data: comments = [], isLoading: isLoadingComments } = useSpoilerThreadComments(
    showComments ? thread.id : undefined,
    thread.is_unlocked
  );

  const handleQuickUnlock = async () => {
    try {
      await unlockMutation.mutateAsync({
        bookId: thread.book_id,
        chapter: thread.min_chapter,
      });
      toast({
        title: `Chapter ${thread.min_chapter} completed!`,
        description: "Thread unlocked. Enjoy the discussion!",
      });
    } catch {
      toast({
        title: "Could not update progress",
        variant: "destructive",
      });
    }
  };

  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    try {
      await commentMutation.mutateAsync({
        thread_id: thread.id,
        body: commentText.trim(),
        min_chapter: thread.min_chapter,
      });
      setCommentText("");
      toast({ title: "Comment posted!" });
    } catch {
      toast({ title: "Failed to post comment", variant: "destructive" });
    }
  };

  return (
    <Card className="overflow-hidden bg-card border-border hover:shadow-sm transition-all">
      <CardContent className="p-4 sm:p-5 space-y-3.5">
        {/* Thread Header: Book Cover, Title, Min Chapter Badge */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex gap-3 min-w-0">
            <Link to={`/book/${thread.book_id}`} className="shrink-0 group">
              <div className="w-12 h-16 rounded bg-muted overflow-hidden shadow-sm group-hover:ring-2 ring-indigo-500/40 transition-all">
                {thread.books_library?.cover_image_url ? (
                  <img src={thread.books_library.cover_image_url} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-indigo-500/10">
                    <BookOpen className="w-4 h-4 text-indigo-500" />
                  </div>
                )}
              </div>
            </Link>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-semibold text-sm sm:text-base text-foreground leading-tight">
                  {thread.title}
                </h3>
                <Badge
                  variant={thread.is_unlocked ? "secondary" : "outline"}
                  className={`gap-1 text-[10px] px-2 py-0.5 ${
                    thread.is_unlocked
                      ? "bg-emerald-500/10 text-emerald-700 border-emerald-500/30 dark:text-emerald-300"
                      : "bg-amber-500/10 text-amber-700 border-amber-500/30 dark:text-amber-300"
                  }`}
                >
                  {thread.is_unlocked ? <Unlock className="w-3 h-3 text-emerald-500" /> : <Lock className="w-3 h-3 text-amber-500" />}
                  Unlocks at Ch. {thread.min_chapter}
                </Badge>
              </div>

              <div className="flex items-center gap-2 mt-1.5 text-xs text-muted-foreground flex-wrap">
                <span className="font-medium text-foreground">{thread.books_library?.title ?? "Book"}</span>
                <span>·</span>
                <div className="flex items-center gap-1">
                  <Avatar className="w-3.5 h-3.5">
                    <AvatarImage src={thread.profiles?.profile_photo_url || ""} />
                    <AvatarFallback className="text-[7px]">
                      {thread.profiles?.full_name?.charAt(0) || "U"}
                    </AvatarFallback>
                  </Avatar>
                  <span>{thread.profiles?.full_name ?? "Reader"}</span>
                  {user?.id !== thread.user_id && (
                    <DnaMatchChip userId={thread.user_id} userName={thread.profiles?.full_name ?? "Reader"} />
                  )}
                </div>
                <span>·</span>
                <span>{formatDistanceToNow(new Date(thread.created_at), { addSuffix: true })}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Content Body: Unlocked vs Locked state */}
        {thread.is_unlocked && thread.body ? (
          <div className="space-y-3">
            <p className="text-sm leading-relaxed text-foreground/90 whitespace-pre-wrap bg-muted/20 p-3.5 rounded-lg border border-border/60">
              {thread.body}
            </p>

            {/* Footer with Comments Toggle */}
            <div className="flex items-center justify-between pt-1">
              <Button
                size="sm"
                variant="ghost"
                className="h-8 px-2.5 text-xs text-muted-foreground hover:text-foreground gap-1.5"
                onClick={() => setShowComments((prev) => !prev)}
              >
                <MessageSquare className="w-3.5 h-3.5 text-indigo-500" />
                <span>{showComments ? "Hide Discussion" : "Join Discussion"}</span>
              </Button>

              <Link to={`/book/${thread.book_id}?tab=read`}>
                <Button size="sm" variant="ghost" className="h-8 px-2 text-xs text-muted-foreground gap-1">
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Reader</span>
                </Button>
              </Link>
            </div>

            {/* Comments Thread */}
            {showComments && (
              <div className="pt-3 border-t border-border space-y-3 bg-muted/10 p-3 rounded-lg">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Spoiler-Safe Discussion ({comments.length})
                </p>

                {isLoadingComments ? (
                  <div className="py-2 text-center text-xs text-muted-foreground">Loading comments…</div>
                ) : comments.length === 0 ? (
                  <p className="text-xs text-muted-foreground italic">
                    No comments yet. Share your reaction to Chapter {thread.min_chapter}!
                  </p>
                ) : (
                  <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                    {comments.map((c) => (
                      <div key={c.id} className="text-xs space-y-1 bg-card p-2.5 rounded border border-border/60">
                        <div className="flex items-center justify-between text-muted-foreground">
                          <div className="flex items-center gap-1.5">
                            <Avatar className="w-4 h-4">
                              <AvatarImage src={c.profiles?.profile_photo_url || ""} />
                              <AvatarFallback className="text-[7px]">
                                {c.profiles?.full_name?.charAt(0) || "U"}
                              </AvatarFallback>
                            </Avatar>
                            <span className="font-semibold text-foreground">{c.profiles?.full_name ?? "Reader"}</span>
                            {user?.id !== c.user_id && (
                              <DnaMatchChip userId={c.user_id} userName={c.profiles?.full_name ?? "Reader"} />
                            )}
                          </div>
                          <span>{formatDistanceToNow(new Date(c.created_at), { addSuffix: true })}</span>
                        </div>
                        <p className="text-foreground pl-5 leading-relaxed">{c.body}</p>
                      </div>
                    ))}
                  </div>
                )}

                {/* Comment Input */}
                {user ? (
                  <form onSubmit={handleCommentSubmit} className="flex gap-2 pt-1">
                    <Input
                      value={commentText}
                      onChange={(e) => setCommentText(e.target.value)}
                      placeholder="Comment without spoiling earlier readers…"
                      className="h-8 text-xs bg-background"
                    />
                    <Button
                      size="sm"
                      type="submit"
                      disabled={commentMutation.isPending || !commentText.trim()}
                      className="h-8 px-3 text-xs gap-1"
                    >
                      {commentMutation.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <Send className="w-3 h-3" />}
                      Reply
                    </Button>
                  </form>
                ) : (
                  <p className="text-[11px] text-muted-foreground text-center">Sign in to participate.</p>
                )}
              </div>
            )}
          </div>
        ) : (
          /* Locked State with blurred backdrop */
          <div className="relative rounded-xl border border-dashed border-amber-500/30 bg-muted/40 p-6 overflow-hidden text-center">
            {/* Blurred placeholder text behind */}
            <div className="select-none blur-[6px] opacity-40 text-xs text-foreground space-y-1 pointer-events-none" aria-hidden="true">
              <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.</p>
              <p>Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur excepteur sint occaecat.</p>
            </div>

            {/* Lock Overlay */}
            <div className="absolute inset-0 flex flex-col items-center justify-center p-4 bg-background/70 backdrop-blur-[2px]">
              <div className="w-9 h-9 rounded-full bg-amber-500/10 flex items-center justify-center text-amber-600 mb-2">
                <Lock className="w-4 h-4" />
              </div>
              <p className="text-xs font-semibold text-foreground">
                Read up to Chapter {thread.min_chapter} to unlock
              </p>
              <p className="text-[11px] text-muted-foreground max-w-xs mt-0.5">
                This discussion contains spoilers for Chapter {thread.min_chapter} of {thread.books_library?.title ?? "this book"}.
              </p>

              <div className="flex items-center gap-2 mt-3 flex-wrap justify-center">
                <Link to={`/book/${thread.book_id}?tab=read`}>
                  <Button size="sm" variant="outline" className="h-7 text-xs gap-1">
                    <BookOpen className="w-3 h-3" />
                    Read in Reader
                  </Button>
                </Link>

                {user && (
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={handleQuickUnlock}
                    disabled={unlockMutation.isPending}
                    className="h-7 text-xs gap-1 bg-amber-100 text-amber-900 hover:bg-amber-200 dark:bg-amber-950 dark:text-amber-200"
                  >
                    {unlockMutation.isPending ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : (
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                    )}
                    Mark Ch. {thread.min_chapter} Complete
                  </Button>
                )}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
export default SpoilerThreadCard;
