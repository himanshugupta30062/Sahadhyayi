import React, { useState, useRef, useEffect } from "react";
import { RoomMessage } from "@/hooks/useReadingRoom";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { useAuth } from "@/contexts/authHelpers";

interface RoomChatProps {
  messages: RoomMessage[];
  onSendMessage: (body: string) => Promise<void> | void;
}

export const RoomChat: React.FC<RoomChatProps> = ({ messages, onSendMessage }) => {
  const { user } = useAuth();
  const [draft, setDraft] = useState("");
  const [isSending, setIsSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!draft.trim() || isSending) return;
    const text = draft;
    setDraft("");
    setIsSending(true);
    try {
      await onSendMessage(text);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="flex flex-col h-[520px] bg-background">
      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground p-6">
            <p className="text-sm font-medium">Say hi — the room is live!</p>
            <p className="text-xs mt-1">Discuss the book, share thoughts on the current chapter, or read in quiet company.</p>
          </div>
        ) : (
          messages.map((m) => {
            const isMe = user?.id === m.user_id;
            return (
              <div key={m.id} className={`flex items-start gap-2.5 ${isMe ? "flex-row-reverse" : "flex-row"}`}>
                <Avatar className="w-7 h-7 mt-0.5 shrink-0">
                  <AvatarImage src={m.profiles?.profile_photo_url || ""} />
                  <AvatarFallback className="text-[9px] bg-brand-primary text-white">
                    {m.profiles?.full_name?.charAt(0) || "R"}
                  </AvatarFallback>
                </Avatar>

                <div className={`max-w-[75%] space-y-1 ${isMe ? "items-end" : "items-start"}`}>
                  <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground px-1">
                    <span className="font-semibold text-foreground">
                      {isMe ? "You" : m.profiles?.full_name || "Reader"}
                    </span>
                    <span>·</span>
                    <span>{formatDistanceToNow(new Date(m.created_at), { addSuffix: true })}</span>
                  </div>

                  <div
                    className={`px-3 py-2 rounded-2xl text-xs sm:text-sm leading-relaxed ${
                      isMe
                        ? "bg-brand-primary text-white rounded-tr-none"
                        : "bg-muted text-foreground rounded-tl-none border border-border/50"
                    }`}
                  >
                    {m.body}
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input Composer */}
      {user ? (
        <form onSubmit={handleSubmit} className="border-t border-border p-3 bg-card/60 flex items-center gap-2">
          <Input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Share a thought with the room…"
            className="text-xs sm:text-sm bg-background"
          />
          <Button size="sm" type="submit" disabled={!draft.trim() || isSending} className="shrink-0 gap-1.5">
            <Send className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Send</span>
          </Button>
        </form>
      ) : (
        <div className="p-3 border-t border-border text-center text-xs text-muted-foreground bg-muted/30">
          Sign in to participate in the chat.
        </div>
      )}
    </div>
  );
};
export default RoomChat;
