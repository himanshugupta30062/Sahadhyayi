import { useEffect, useRef, useState } from "react";
import type { FormEvent, KeyboardEvent } from "react";
import {
  BookOpen,
  Check,
  Copy,
  ExternalLink,
  LoaderCircle,
  RotateCcw,
  Send,
  Sparkles,
  ThumbsDown,
  ThumbsUp,
  X,
} from "lucide-react";
import { useBookExpert } from "@/contexts/book-expert.utils";
import type { BookExpertBook, BookExpertCitation } from "@/contexts/book-expert.utils";
import { cn } from "@/lib/utils";

const bookIcon = new URL("./Sahadhyayi_Book_optimized.webp", import.meta.url).href;

const suggestedPrompts = [
  "Find my next read",
  "Recommend a beginner-friendly philosophy book",
  "Help me explore a new author",
  "Compare two books",
];

function validHttpUrl(value: string | null | undefined): string | null {
  if (!value) return null;
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:" ? url.toString() : null;
  } catch {
    return null;
  }
}

function RagCitationCard({ citation }: { citation: BookExpertCitation }) {
  const externalUrl = validHttpUrl(citation.url);
  const href = citation.bookId
    ? "/book/" + encodeURIComponent(citation.bookId)
    : externalUrl;
  const sourceLabel: Record<string, string> = {
    book_metadata: "Catalog record",
    book_summary: "Book summary",
    approved_text: "Approved text",
    site_article: "Sahadhyayi article",
  };

  return (
    <details className="group rounded-xl border border-border bg-background px-3 py-2.5">
      <summary className="flex cursor-pointer list-none items-start gap-2 text-sm">
        <span className="shrink-0 rounded-md bg-primary/10 px-1.5 py-0.5 text-[10px] font-semibold text-primary">
          [{citation.id}]
        </span>
        <span className="min-w-0 flex-1">
          <span className="block line-clamp-2 font-medium">{citation.title}</span>
          <span className="mt-0.5 block text-[11px] text-muted-foreground">
            {sourceLabel[citation.sourceType] ?? "Indexed source"}
            {citation.author ? " · " + citation.author : ""}
            {citation.similarity ? " · relevance " + Math.round(citation.similarity * 100) + "%" : ""}
          </span>
        </span>
        <ExternalLink className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground transition-transform group-open:rotate-45" aria-hidden="true" />
      </summary>
      <div className="mt-2 space-y-2 border-t border-border/70 pt-2">
        <p className="whitespace-pre-wrap break-words text-xs leading-relaxed text-muted-foreground">{citation.excerpt}</p>
        {citation.sourceLicense && (
          <p className="text-[10px] text-muted-foreground">Source licence: {citation.sourceLicense}</p>
        )}
        {href && (
          <a
            href={href}
            target={citation.bookId ? undefined : "_blank"}
            rel={citation.bookId ? undefined : "noopener noreferrer"}
            className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
          >
            {citation.bookId ? "Open book page" : "Open source"} <ExternalLink className="h-3 w-3" aria-hidden="true" />
          </a>
        )}
      </div>
    </details>
  );
}

function BookResultCard({ book }: { book: BookExpertBook }) {
  const coverUrl = validHttpUrl(book.coverImageUrl);
  const readingUrl = validHttpUrl(book.readingUrl);

  return (
    <article className="flex min-w-0 gap-3 rounded-xl border border-border bg-background p-2.5">
      <div className="flex h-24 w-[68px] shrink-0 items-center justify-center overflow-hidden rounded-md bg-muted">
        {coverUrl ? (
          <img
            src={coverUrl}
            alt={"Cover of " + book.title}
            loading="lazy"
            decoding="async"
            className="h-full w-full object-cover"
          />
        ) : (
          <BookOpen className="h-7 w-7 text-muted-foreground" aria-hidden="true" />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <h4 className="line-clamp-2 text-sm font-semibold leading-snug">{book.title}</h4>
        {book.author && <p className="mt-1 line-clamp-1 text-xs text-muted-foreground">{book.author}</p>}
        <div className="mt-1 flex flex-wrap gap-x-2 text-[11px] text-muted-foreground">
          {book.genre && <span>{book.genre}</span>}
          {book.publicationYear && <span>{book.publicationYear}</span>}
          {book.language && <span>{book.language}</span>}
        </div>
        {book.description && (
          <p className="mt-1.5 line-clamp-2 text-xs leading-relaxed text-muted-foreground">{book.description}</p>
        )}
        <div className="mt-2 flex flex-wrap gap-2">
          <a
            href={"/book/" + encodeURIComponent(book.id)}
            className="inline-flex items-center gap-1 rounded-md bg-primary px-2 py-1 text-xs font-medium text-primary-foreground hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            View book <ExternalLink className="h-3 w-3" aria-hidden="true" />
          </a>
          {readingUrl && (
            <a
              href={readingUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 rounded-md border border-border px-2 py-1 text-xs font-medium hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              {book.isDirectPdf ? "Open PDF" : "Open reading link"} <ExternalLink className="h-3 w-3" aria-hidden="true" />
            </a>
          )}
        </div>
      </div>
    </article>
  );
}

const BookExpert = () => {
  const {
    isOpen,
    toggleChat,
    closeChat,
    clearConversation,
    messages,
    loading,
    sendMessage,
    sendFeedback,
  } = useBookExpert();
  const [input, setInput] = useState("");
  const [feedback, setFeedback] = useState<Record<string, -1 | 1>>({});
  const [copiedMessageIndex, setCopiedMessageIndex] = useState<number | null>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView?.({ behavior: "smooth", block: "end" });
  }, [messages, loading, isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (event: globalThis.KeyboardEvent) => {
      if (event.key === "Escape") closeChat();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, closeChat]);

  const handleSend = (prompt?: string) => {
    const text = (prompt ?? input).trim();
    if (!text || loading) return;
    void sendMessage(text);
    setInput("");
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    handleSend();
  };

  const handleInputKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      handleSend();
    }
  };

  const handleFeedback = async (requestId: string, rating: -1 | 1) => {
    if (feedback[requestId]) return;
    setFeedback((current) => ({ ...current, [requestId]: rating }));
    await sendFeedback(requestId, rating);
  };

  const copyAnswer = async (text: string, index: number) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedMessageIndex(index);
    } catch {
      // Clipboard permissions vary by browser; never block the chat on copy failure.
      setCopiedMessageIndex(null);
    }
  };

  if (!isOpen) {
    return (
      <button
        type="button"
        onClick={toggleChat}
        aria-label="Open AI Book Expert"
        aria-expanded={false}
        aria-controls="book-expert-panel"
        className="fixed bottom-5 right-4 z-50 flex h-16 w-16 items-center justify-center overflow-hidden rounded-full border border-border bg-background shadow-xl transition-transform hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:bottom-6 sm:right-6 sm:h-[76px] sm:w-[76px]"
      >
        <img
          src={bookIcon}
          alt=""
          loading="eager"
          decoding="async"
          className="h-full w-full object-cover"
          draggable={false}
        />
      </button>
    );
  }

  return (
    <section
      id="book-expert-panel"
      role="dialog"
      aria-modal="false"
      aria-labelledby="book-expert-title"
      className="fixed inset-x-2 bottom-2 z-50 flex h-[min(720px,calc(100dvh-1rem))] min-h-0 max-h-[calc(100dvh-1rem)] flex-col overflow-hidden rounded-2xl border border-border bg-background text-foreground shadow-2xl sm:inset-x-auto sm:bottom-24 sm:h-[min(720px,calc(100dvh-7rem))] sm:w-[420px] sm:right-6 md:w-[460px]"
    >
      <header className="flex shrink-0 items-center justify-between gap-3 border-b border-border bg-card px-4 py-3">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-border bg-background">
            <img src={bookIcon} alt="" className="h-full w-full object-cover" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h2 id="book-expert-title" className="truncate text-sm font-semibold sm:text-base">AI Book Expert</h2>
              <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">
                <Sparkles className="h-3 w-3" aria-hidden="true" />
                Reading companion
              </span>
            </div>
            <p className="mt-0.5 truncate text-xs text-muted-foreground">Discover books from Sahadhyayi's library</p>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <button
            type="button"
            onClick={clearConversation}
            disabled={loading || messages.length <= 1}
            aria-label="Start a new conversation"
            title="Start a new conversation"
            className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:cursor-not-allowed disabled:opacity-40"
          >
            <RotateCcw className="h-4 w-4" aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={closeChat}
            aria-label="Close Book Expert"
            className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
      </header>

      <div
        className="min-h-0 flex-1 space-y-4 overflow-x-hidden overflow-y-auto overscroll-contain px-3 py-4 sm:px-4"
        aria-live="polite"
        aria-relevant="additions text"
      >
        {messages.map((message, index) => {
          const isUser = message.sender === "user";
          return (
            <div key={index} className={cn("flex w-full", isUser ? "justify-end" : "justify-start")}>
              <div className={cn("min-w-0 space-y-2", isUser ? "max-w-[88%]" : "w-full max-w-full")}>
                <div
                  className={cn(
                    "rounded-2xl px-3.5 py-3 text-sm leading-relaxed shadow-sm",
                    isUser
                      ? "rounded-br-md bg-primary text-primary-foreground"
                      : "rounded-bl-md border border-border bg-muted/60 text-foreground",
                    message.error && "border-destructive/50"
                  )}
                >
                  {!isUser && (
                    <div className="mb-1.5 flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground">
                      <Sparkles className="h-3 w-3 text-primary" aria-hidden="true" />
                      Book Expert
                    </div>
                  )}
                  <p className="whitespace-pre-wrap break-words">{message.text}</p>
                  {!isUser && (
                    <div className="mt-2 flex justify-end border-t border-border/60 pt-1.5">
                      <button
                        type="button"
                        onClick={() => void copyAnswer(message.text, index)}
                        aria-label="Copy answer"
                        title="Copy answer"
                        className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-[11px] text-muted-foreground transition-colors hover:bg-background hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      >
                        {copiedMessageIndex === index
                          ? <Check className="h-3.5 w-3.5" aria-hidden="true" />
                          : <Copy className="h-3.5 w-3.5" aria-hidden="true" />}
                        {copiedMessageIndex === index ? "Copied" : "Copy"}
                      </button>
                    </div>
                  )}
                </div>

                {!isUser && message.books && message.books.length > 0 && (
                  <div className="space-y-2 pl-1">
                    <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">From Sahadhyayi library</p>
                    {message.books.map((book) => <BookResultCard key={book.id} book={book} />)}
                  </div>
                )}

                {!isUser && message.citations && message.citations.length > 0 && (
                  <div className="space-y-2 pl-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Sources used</p>
                      <span className="text-[10px] text-muted-foreground">Answers cite these as [S1], [S2]…</span>
                    </div>
                    <div className="space-y-1.5">
                      {message.citations.map((citation) => (
                        <RagCitationCard key={citation.id} citation={citation} />
                      ))}
                    </div>
                  </div>
                )}

                {!isUser && message.requestId && (
                  <div className="flex items-center gap-2 px-1 text-muted-foreground">
                    <span className="text-[11px]">Was this helpful?</span>
                    <button
                      type="button"
                      aria-label="This answer was helpful"
                      aria-pressed={feedback[message.requestId] === 1}
                      disabled={Boolean(feedback[message.requestId])}
                      onClick={() => void handleFeedback(message.requestId!, 1)}
                      className={cn("rounded-md p-1.5 hover:bg-muted disabled:cursor-default", feedback[message.requestId] === 1 && "text-primary")}
                    >
                      {feedback[message.requestId] === 1 ? <Check className="h-4 w-4" /> : <ThumbsUp className="h-4 w-4" />}
                    </button>
                    <button
                      type="button"
                      aria-label="This answer was not helpful"
                      aria-pressed={feedback[message.requestId] === -1}
                      disabled={Boolean(feedback[message.requestId])}
                      onClick={() => void handleFeedback(message.requestId!, -1)}
                      className={cn("rounded-md p-1.5 hover:bg-muted disabled:cursor-default", feedback[message.requestId] === -1 && "text-primary")}
                    >
                      {feedback[message.requestId] === -1 ? <Check className="h-4 w-4" /> : <ThumbsDown className="h-4 w-4" />}
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {messages.length === 1 && !loading && (
          <div className="space-y-2 pt-1">
            <p className="px-1 text-xs font-medium text-muted-foreground">Try asking</p>
            <div className="flex flex-wrap gap-2">
              {suggestedPrompts.map((prompt) => (
                <button
                  key={prompt}
                  type="button"
                  onClick={() => handleSend(prompt)}
                  className="rounded-full border border-border bg-card px-3 py-2 text-left text-xs transition-colors hover:border-primary/50 hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        )}

        {loading && (
          <div className="flex justify-start">
            <div className="inline-flex items-center gap-2 rounded-2xl rounded-bl-md border border-border bg-muted/60 px-3.5 py-3 text-sm text-muted-foreground">
              <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" />
              Finding context and thinking…
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <form onSubmit={handleSubmit} className="shrink-0 border-t border-border bg-card p-3 sm:p-4">
        <label htmlFor="book-expert-input" className="sr-only">Your question for Book Expert</label>
        <div className="flex items-end gap-2 rounded-2xl border border-input bg-background p-2 shadow-sm focus-within:ring-2 focus-within:ring-ring">
          <textarea
            id="book-expert-input"
            ref={inputRef}
            value={input}
            onChange={(event) => setInput(event.target.value.slice(0, 2000))}
            onKeyDown={handleInputKeyDown}
            placeholder="Ask about a book, author, or your next read…"
            rows={2}
            maxLength={2000}
            disabled={loading}
            className="max-h-28 min-h-[44px] flex-1 resize-none bg-transparent px-2 py-2 text-sm text-foreground outline-none placeholder:text-muted-foreground disabled:opacity-60"
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            aria-label="Send message"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {loading ? <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Send className="h-4 w-4" aria-hidden="true" />}
          </button>
        </div>
        <div className="mt-2 flex items-center justify-between gap-2 px-1">
          <span className="text-[10px] text-muted-foreground">Library matches are shown only when retrieved from real records.</span>
          <span className="shrink-0 text-[10px] tabular-nums text-muted-foreground">{input.length}/2000</span>
        </div>
      </form>
    </section>
  );
};

export default BookExpert;
