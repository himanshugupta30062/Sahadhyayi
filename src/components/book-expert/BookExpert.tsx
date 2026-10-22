import { Fragment, useCallback, useEffect, useRef, useState } from "react";
import type { FormEvent, KeyboardEvent, ReactNode } from "react";
import {
  BookOpen,
  BookMarked,
  Check,
  Copy,
  ExternalLink,
  LoaderCircle,
  MessageCircle,
  RotateCcw,
  Send,
  Sparkles,
  ThumbsDown,
  ThumbsUp,
  Volume2,
  VolumeX,
  X,
} from "lucide-react";
import { useBookExpert } from "@/contexts/book-expert.utils";
import type { BookExpertBook, BookExpertCitation } from "@/contexts/book-expert.utils";
import { cn } from "@/lib/utils";

const bookIcon = new URL("./Sahadhyayi_Book_optimized.webp", import.meta.url).href;

function validHttpUrl(value: string | null | undefined): string | null {
  if (!value) return null;
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:" ? url.toString() : null;
  } catch {
    return null;
  }
}

function renderInlineMarkdown(line: string): ReactNode[] {
  const tokens = line.split(/(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`|\[S\d+\])/g).filter(Boolean);
  return tokens.map((token, index) => {
    if (/^\*\*[^*]+\*\*$/.test(token)) {
      return <strong key={index} className="font-semibold text-foreground">{token.slice(2, -2)}</strong>;
    }
    if (/^\*[^*]+\*$/.test(token)) {
      return <em key={index}>{token.slice(1, -1)}</em>;
    }
    if (/^`[^`]+`$/.test(token)) {
      return <code key={index} className="rounded bg-muted px-1 py-0.5 text-[0.9em]">{token.slice(1, -1)}</code>;
    }
    if (/^\[S\d+\]$/.test(token)) {
      return <span key={index} className="mx-0.5 inline-flex rounded-md bg-primary/10 px-1.5 py-0.5 align-baseline text-[0.8em] font-semibold text-primary">{token}</span>;
    }
    return <Fragment key={index}>{token}</Fragment>;
  });
}

function AnswerText({ text }: { text: string }) {
  const blocks = text.trim().split(/\n{2,}/).filter(Boolean);
  return (
    <div className="space-y-3 break-words">
      {blocks.map((block, blockIndex) => {
        const lines = block.split("\n");
        const heading = lines[0].match(/^#{1,3}\s+(.+)$/);
        const bulletLines = lines.every((line) => /^\s*[-*]\s+/.test(line));
        const numberedLines = lines.every((line) => /^\s*\d+[.)]\s+/.test(line));

        if (heading && lines.length === 1) {
          return <h4 key={blockIndex} className="text-sm font-semibold tracking-tight text-foreground">{renderInlineMarkdown(heading[1])}</h4>;
        }
        if (bulletLines) {
          return (
            <ul key={blockIndex} className="list-disc space-y-1.5 pl-5 marker:text-primary">
              {lines.map((line, lineIndex) => <li key={lineIndex} className="pl-0.5">{renderInlineMarkdown(line.replace(/^\s*[-*]\s+/, ""))}</li>)}
            </ul>
          );
        }
        if (numberedLines) {
          return (
            <ol key={blockIndex} className="list-decimal space-y-1.5 pl-5 marker:font-medium marker:text-primary">
              {lines.map((line, lineIndex) => <li key={lineIndex} className="pl-0.5">{renderInlineMarkdown(line.replace(/^\s*\d+[.)]\s+/, ""))}</li>)}
            </ol>
          );
        }
        return (
          <p key={blockIndex} className="whitespace-pre-wrap leading-relaxed">
            {lines.map((line, lineIndex) => <Fragment key={lineIndex}>{lineIndex > 0 && <br />}{renderInlineMarkdown(line)}</Fragment>)}
          </p>
        );
      })}
    </div>
  );
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

function BookResultCard({ book, onTalk }: { book: BookExpertBook; onTalk: (book: BookExpertBook) => void }) {
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
          <button
            type="button"
            onClick={() => onTalk(book)}
            className="inline-flex items-center gap-1 rounded-md bg-primary px-2 py-1 text-xs font-medium text-primary-foreground hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <MessageCircle className="h-3 w-3" aria-hidden="true" /> Talk to this book
          </button>
          <a
            href={"/book/" + encodeURIComponent(book.id)}
            className="inline-flex items-center gap-1 rounded-md border border-border px-2 py-1 text-xs font-medium hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
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
  const [speakingMessageIndex, setSpeakingMessageIndex] = useState<number | null>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const launcherRef = useRef<HTMLButtonElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const wasOpenRef = useRef(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const speechRef = useRef<SpeechSynthesisUtterance | null>(null);
  const welcomeOnly = messages.length === 1 && messages[0]?.sender === "bot";
  const visibleMessages = welcomeOnly ? [] : messages;

  const stopSpeech = useCallback(() => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) window.speechSynthesis.cancel();
    speechRef.current = null;
    setSpeakingMessageIndex(null);
  }, []);

  const toggleSpeech = (text: string, index: number) => {
    if (!("speechSynthesis" in window)) return;
    if (speakingMessageIndex === index) {
      stopSpeech();
      return;
    }
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.96;
    utterance.onend = () => {
      speechRef.current = null;
      setSpeakingMessageIndex(null);
    };
    utterance.onerror = () => {
      speechRef.current = null;
      setSpeakingMessageIndex(null);
    };
    speechRef.current = utterance;
    setSpeakingMessageIndex(index);
    window.speechSynthesis.speak(utterance);
  };

  useEffect(() => {
    bottomRef.current?.scrollIntoView?.({ behavior: "smooth", block: "end" });
  }, [messages, loading, isOpen]);

  useEffect(() => {
    if (isOpen) {
      wasOpenRef.current = true;
      // Avoid opening the mobile keyboard automatically; focus only on larger screens.
      if (typeof window !== "undefined" && typeof window.matchMedia === "function" && window.matchMedia("(min-width: 640px)").matches) {
        inputRef.current?.focus();
      } else {
        closeButtonRef.current?.focus();
      }
      return;
    }
    stopSpeech();
    if (wasOpenRef.current) {
      launcherRef.current?.focus();
      wasOpenRef.current = false;
    }
  }, [isOpen, stopSpeech]);

  useEffect(() => () => {
    if ("speechSynthesis" in window) window.speechSynthesis.cancel();
  }, []);

  const handleClose = useCallback(() => {
    stopSpeech();
    closeChat();
  }, [closeChat, stopSpeech]);

  useEffect(() => {
    if (!isOpen) return;

    const previousBodyOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    // Make sibling page content inert while the dialog is open, preserving
    // the backdrop so pointer users can still dismiss the reader.
    const inertedElements: HTMLElement[] = [];
    let current: HTMLElement | null = document.getElementById("book-expert-panel");
    while (current && current.parentElement && current.parentElement !== document.body) {
      const activeElement = current;
      const parent = activeElement.parentElement;
      Array.from(parent.children).forEach((child) => {
        const sibling = child as HTMLElement;
        if (sibling === activeElement || sibling.classList.contains("reader-room-backdrop-enter")) return;
        if (!sibling.inert) {
          sibling.inert = true;
          sibling.setAttribute("inert", "");
          inertedElements.push(sibling);
        }
      });
      current = parent;
    }

    const handleKeyDown = (event: globalThis.KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        handleClose();
        return;
      }

      if (event.key !== "Tab") return;
      const dialog = document.getElementById("book-expert-panel");
      if (!dialog) return;
      const focusable = Array.from(
        dialog.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
        )
      ).filter((element) => {
        const isDesktop = typeof window.matchMedia === "function" && window.matchMedia("(min-width: 640px)").matches;
        return isDesktop || !element.classList.contains("hidden");
      });
      if (focusable.length === 0) {
        event.preventDefault();
        dialog.focus();
        return;
      }

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && (document.activeElement === first || !dialog.contains(document.activeElement))) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && (document.activeElement === last || !dialog.contains(document.activeElement))) {
        event.preventDefault();
        first.focus();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      inertedElements.forEach((element) => { element.inert = false; element.removeAttribute("inert"); });
      document.body.style.overflow = previousBodyOverflow;
    };
  }, [isOpen, handleClose]);

  const handleSend = (prompt?: string) => {
    const text = (prompt ?? input).trim();
    if (!text || loading) return;
    stopSpeech();
    void sendMessage(text);
    setInput("");
  };

  const handleTalkToBook = (book: BookExpertBook) => {
    const author = book.author ? " by " + book.author : "";
    handleSend(
      "Let's talk about the book \"" + book.title + "\"" + author + ". Speak as a warm, distinctive first-person book companion, but do not claim to literally be the author or invent plot details. Start with a short, engaging introduction grounded in the book details available in Sahadhyayi, then ask me what I would like to explore."
    );
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
      setCopiedMessageIndex(null);
    }
  };


  if (!isOpen) {
    return (
      <button
        ref={launcherRef}
        type="button"
        onClick={toggleChat}
        aria-label="Open the Sahadhyayi Reading Room"
        aria-expanded={false}
        aria-controls="book-expert-panel"
        className="fixed bottom-5 right-4 z-50 flex items-center gap-3 rounded-full border border-border/80 bg-background/95 p-2 pr-4 text-foreground shadow-xl shadow-black/10 backdrop-blur transition duration-200 hover:-translate-y-0.5 hover:shadow-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:bottom-6 sm:right-6"
      >
        <span className="reader-room-launcher-icon relative flex h-12 w-12 items-center justify-center overflow-hidden rounded-full bg-primary/10">
          <img src={bookIcon} alt="" loading="eager" decoding="async" className="h-full w-full object-cover" draggable={false} />
          <span className="absolute bottom-0.5 right-0.5 h-2.5 w-2.5 rounded-full border-2 border-background bg-emerald-500" aria-hidden="true" />
        </span>
        <span className="text-left">
          <span className="block text-sm font-semibold leading-tight">Reading Room</span>
          <span className="mt-0.5 block text-[11px] text-muted-foreground">Talk books with us</span>
        </span>
        <MessageCircle className="ml-1 h-4 w-4 text-primary" aria-hidden="true" />
      </button>
    );
  }

  return (
    <>
    <button
      type="button"
      tabIndex={-1}
      aria-label="Close Reading Room"
      title="Close Reading Room"
      onClick={handleClose}
      className="reader-room-backdrop-enter fixed inset-0 z-40 cursor-default bg-black/30 backdrop-blur-[2px] focus-visible:outline-none sm:cursor-pointer sm:bg-black/10 sm:backdrop-blur-sm"
    />
    <section
      id="book-expert-panel"
      role="dialog"
      aria-modal="true"
      aria-describedby="book-expert-description"
      aria-labelledby="book-expert-title"
      tabIndex={-1}
      className="reader-room-panel-enter fixed inset-x-2 bottom-[calc(env(safe-area-inset-bottom,0px)_+_0.5rem)] z-50 flex h-[min(70dvh,600px)] min-h-0 flex-col overflow-hidden rounded-2xl border border-border/80 bg-background text-foreground shadow-2xl shadow-black/25 sm:inset-x-auto sm:bottom-5 sm:right-5 sm:h-[min(680px,calc(100dvh-3rem))] sm:w-[min(420px,calc(100vw-3rem))] sm:rounded-2xl"
    >
      <header className="relative shrink-0 overflow-hidden border-b border-border/70 bg-card">
        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-amber-500 via-primary to-emerald-500" aria-hidden="true" />
        <div className="flex items-center justify-between gap-2 px-3 pb-2.5 pt-3 sm:px-4">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-border/70 bg-background shadow-sm">
              <img src={bookIcon} alt="" className="h-full w-full object-cover" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h2 id="book-expert-title" className="truncate text-sm font-semibold tracking-tight">The Reading Room</h2>
                <span className="hidden shrink-0 items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-1 text-[10px] font-medium text-emerald-700 dark:text-emerald-300 sm:inline-flex">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" aria-hidden="true" />
                  Here for readers
                </span>
              </div>
              <p id="book-expert-description" className="sr-only text-xs text-muted-foreground sm:not-sr-only sm:mt-0.5 sm:block">A little curiosity can open a whole world.</p>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-1">
            <button
              type="button"
              onClick={() => { stopSpeech(); clearConversation(); }}
              disabled={loading || messages.length <= 1}
              aria-label="Start a new conversation"
              title="New conversation"
              className="hidden rounded-xl p-2 text-muted-foreground transition-colors hover:bg-background hover:text-foreground disabled:cursor-not-allowed disabled:opacity-40 sm:inline-flex"
            >
              <RotateCcw className="h-4 w-4" aria-hidden="true" />
            </button>
            <button
              type="button"
              ref={closeButtonRef}
              onClick={handleClose}
              aria-label="Close Reading Room"
              title="Close Reading Room"
              className="inline-flex min-h-10 shrink-0 items-center gap-1.5 rounded-xl border border-border bg-background px-2.5 text-sm font-semibold text-foreground shadow-sm transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <X className="h-4 w-4" aria-hidden="true" />
              <span>Close</span>
            </button>
          </div>
        </div>
      </header>

      <div
        className="min-h-0 flex-1 overflow-x-hidden overflow-y-auto overscroll-contain bg-gradient-to-b from-amber-500/[0.045] via-background to-background px-4 py-4 sm:px-5 sm:py-5"
        aria-live="polite"
        aria-relevant="additions text"
      >
        {welcomeOnly ? (
          <div className="flex min-h-full flex-col">
            <div className="reader-room-welcome-enter relative overflow-hidden rounded-[1.4rem] border border-amber-500/20 bg-gradient-to-br from-amber-500/10 via-primary/[0.06] to-emerald-500/[0.07] p-5 sm:p-6">
              <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full border border-amber-500/20" aria-hidden="true" />
              <div className="absolute -right-3 top-0 h-24 w-24 rounded-full border border-amber-500/15" aria-hidden="true" />
              <div className="relative flex items-start gap-3">
                <div className="reader-room-book-glow flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-amber-500/20 bg-background/80 shadow-sm">
                  <BookMarked className="h-6 w-6 text-primary" aria-hidden="true" />
                </div>
                <div className="min-w-0">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-primary">Welcome, reader</p>
                  <h3 className="mt-2 max-w-xs text-2xl font-semibold leading-tight tracking-tight sm:text-[1.75rem]">
                    Every great conversation starts with a page.
                  </h3>
                  <p className="mt-3 max-w-sm text-sm leading-relaxed text-muted-foreground">
                    Meet a book, find your next read, or follow a question wherever it leads. Let's see what the shelves have for you.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => handleSend("Introduce me to a real book from the Sahadhyayi library. Speak in a playful first-person voice, use only verified catalog details, and invite me to explore it.")}
                className="mt-5 inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <Sparkles className="h-4 w-4" aria-hidden="true" />
                Let a book introduce itself
              </button>
            </div>

            <div className="mt-6">
              <div className="mb-3 flex items-end justify-between gap-3">
                <div>
                  <h4 className="text-sm font-semibold">Where shall we begin?</h4>
                  <p className="mt-1 text-xs text-muted-foreground">Choose a starting point, or ask in your own words.</p>
                </div>
                <BookOpen className="mb-1 h-5 w-5 text-muted-foreground/70" aria-hidden="true" />
              </div>
              <div className="reader-room-suggestions grid grid-cols-1 gap-2 sm:grid-cols-2">
                {[
                  { title: "Find my next read", detail: "Books for your mood or interests", prompt: "Help me find my next read. Ask me one or two questions about my mood and interests, then recommend real titles where possible.", icon: Sparkles },
                  { title: "Meet a book", detail: "Let a real book speak first", prompt: "Introduce me to a real book from the Sahadhyayi library in a distinct, playful first-person voice using only verified catalog details.", icon: BookOpen },
                  { title: "Explore an author", detail: "Discover a writer and their work", prompt: "Help me explore an author and recommend relevant works. Clearly distinguish verified catalog records from general knowledge.", icon: BookMarked },
                  { title: "Compare two books", detail: "Find the right fit for you", prompt: "Help me compare two books. Ask which titles I have in mind if I haven't named them yet.", icon: MessageCircle },
                ].map((item) => {
                  const PromptIcon = item.icon;
                  return (
                    <button
                      key={item.title}
                      type="button"
                      onClick={() => handleSend(item.prompt)}
                      className="group flex min-w-0 items-center gap-3 rounded-2xl border border-border/80 bg-background/80 p-3.5 text-left transition duration-150 hover:-translate-y-0.5 hover:border-primary/40 hover:bg-card hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary transition group-hover:bg-primary group-hover:text-primary-foreground">
                        <PromptIcon className="h-4 w-4" aria-hidden="true" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-sm font-semibold">{item.title}</span>
                        <span className="mt-0.5 block text-xs leading-snug text-muted-foreground">{item.detail}</span>
                      </span>
                      <span className="text-lg text-muted-foreground transition-transform group-hover:translate-x-0.5" aria-hidden="true">›</span>
                    </button>
                  );
                })}
              </div>
            </div>
            <p className="mt-auto pt-6 text-center text-[11px] text-muted-foreground">
              Rooted in Sahadhyayi's library · Curious questions always welcome
            </p>
          </div>
        ) : (
          <div className="space-y-5">
            {visibleMessages.map((message, index) => {
              const isUser = message.sender === "user";
              return (
                <div key={message.requestId ?? index} className={cn("flex w-full gap-2.5", isUser ? "justify-end" : "justify-start")}>
                  {!isUser && (
                    <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-border/70 bg-card">
                      <img src={bookIcon} alt="" className="h-full w-full object-cover" />
                    </div>
                  )}
                  <div className={cn("min-w-0 space-y-2", isUser ? "max-w-[88%]" : "w-full max-w-[calc(100%-2.5rem)]")}>
                    <div className={cn(
                      "rounded-2xl px-4 py-3.5 text-sm leading-relaxed",
                      isUser
                        ? "rounded-br-md bg-primary text-primary-foreground shadow-sm"
                        : "rounded-tl-md border border-border/80 bg-card shadow-sm",
                      message.error && "border-destructive/50"
                    )}>
                      {!isUser && (
                        <div className="mb-2 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-primary">
                          <Sparkles className="h-3 w-3" aria-hidden="true" />
                          From the reading room
                        </div>
                      )}
                      {isUser ? (
                        <p className="whitespace-pre-wrap break-words">{message.text}</p>
                      ) : (
                        <AnswerText text={message.text} />
                      )}
                      {message.error && (
                        <button
                          type="button"
                          onClick={() => {
                            const previousMessage = visibleMessages[index - 1];
                            if (previousMessage?.sender === "user") handleSend(previousMessage.text);
                          }}
                          disabled={loading || visibleMessages[index - 1]?.sender !== "user"}
                          className="mt-3 inline-flex items-center gap-1.5 rounded-lg border border-destructive/30 bg-background px-3 py-1.5 text-xs font-semibold text-foreground transition hover:bg-muted disabled:opacity-50"
                        >
                          <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
                          Try again
                        </button>
                      )}
                      {!isUser && (
                        <div className="mt-3 flex flex-wrap items-center justify-end gap-1 border-t border-border/70 pt-2">
                          {"speechSynthesis" in window && (
                            <button
                              type="button"
                              onClick={() => toggleSpeech(message.text, index)}
                              aria-label={speakingMessageIndex === index ? "Stop reading answer aloud" : "Read answer aloud"}
                              title={speakingMessageIndex === index ? "Stop reading" : "Listen"}
                              className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-[11px] text-muted-foreground transition hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                            >
                              {speakingMessageIndex === index ? <VolumeX className="h-3.5 w-3.5" aria-hidden="true" /> : <Volume2 className="h-3.5 w-3.5" aria-hidden="true" />}
                              {speakingMessageIndex === index ? "Stop" : "Listen"}
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => void copyAnswer(message.text, index)}
                            aria-label="Copy answer"
                            title="Copy answer"
                            className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-[11px] text-muted-foreground transition hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                          >
                            {copiedMessageIndex === index ? <Check className="h-3.5 w-3.5" aria-hidden="true" /> : <Copy className="h-3.5 w-3.5" aria-hidden="true" />}
                            {copiedMessageIndex === index ? "Copied" : "Copy"}
                          </button>
                        </div>
                      )}
                    </div>

                    {!isUser && message.books && message.books.length > 0 && (
                      <div className="space-y-2.5">
                        <div className="flex items-center gap-2 px-1">
                          <span className="h-px flex-1 bg-border" aria-hidden="true" />
                          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">On our shelves</p>
                          <span className="h-px flex-1 bg-border" aria-hidden="true" />
                        </div>
                        {message.books.map((book) => <BookResultCard key={book.id} book={book} onTalk={handleTalkToBook} />)}
                      </div>
                    )}

                    {!isUser && message.citations && message.citations.length > 0 && (
                      <details className="group rounded-xl border border-border/70 bg-card/70 px-3 py-2.5">
                        <summary className="flex cursor-pointer list-none items-center justify-between gap-2 text-xs font-medium">
                          <span className="inline-flex items-center gap-2"><BookMarked className="h-3.5 w-3.5 text-primary" aria-hidden="true" /> Sources & reading notes ({message.citations.length})</span>
                          <span className="text-muted-foreground transition-transform group-open:rotate-180" aria-hidden="true">⌄</span>
                        </summary>
                        <div className="mt-3 space-y-2 border-t border-border/70 pt-3">
                          <p className="text-[10px] text-muted-foreground">Evidence used to shape this answer. Open a source for its excerpt and details.</p>
                          {message.citations.map((citation) => <RagCitationCard key={citation.id} citation={citation} />)}
                        </div>
                      </details>
                    )}

                    {!isUser && index === visibleMessages.length - 1 && !loading && (
                      <div className="space-y-2 px-1">
                        <p className="text-[10px] font-medium text-muted-foreground">Keep exploring</p>
                        <div className="flex flex-wrap gap-2">
                          {[
                            { label: "Go deeper", prompt: "Go deeper into your previous answer with useful detail, and cite relevant Sahadhyayi sources when available." },
                            { label: "Explain simply", prompt: "Explain the key idea from your previous answer in simpler language and include a brief example." },
                            { label: "Reflect on it", prompt: "Give me one thoughtful reflection question based on your previous answer, then briefly explain why it matters to a reader." },
                          ].map((suggestion) => (
                            <button
                              key={suggestion.label}
                              type="button"
                              onClick={() => handleSend(suggestion.prompt)}
                              className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background px-3 py-1.5 text-xs font-medium text-muted-foreground transition hover:border-primary/40 hover:bg-primary/5 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                            >
                              <Sparkles className="h-3 w-3 text-primary" aria-hidden="true" />
                              {suggestion.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {!isUser && message.requestId && (
                      <div className="flex items-center gap-2 px-1 text-muted-foreground">
                        <span className="text-[11px]">Was this useful?</span>
                        <button
                          type="button"
                          aria-label="This answer was helpful"
                          aria-pressed={feedback[message.requestId] === 1}
                          disabled={Boolean(feedback[message.requestId])}
                          onClick={() => void handleFeedback(message.requestId!, 1)}
                          className={cn("rounded-lg p-1.5 transition hover:bg-muted disabled:cursor-default", feedback[message.requestId] === 1 && "text-primary")}
                        >
                          {feedback[message.requestId] === 1 ? <Check className="h-4 w-4" /> : <ThumbsUp className="h-4 w-4" />}
                        </button>
                        <button
                          type="button"
                          aria-label="This answer was not helpful"
                          aria-pressed={feedback[message.requestId] === -1}
                          disabled={Boolean(feedback[message.requestId])}
                          onClick={() => void handleFeedback(message.requestId!, -1)}
                          className={cn("rounded-lg p-1.5 transition hover:bg-muted disabled:cursor-default", feedback[message.requestId] === -1 && "text-primary")}
                        >
                          {feedback[message.requestId] === -1 ? <Check className="h-4 w-4" /> : <ThumbsDown className="h-4 w-4" />}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
            {loading && (
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-border/70 bg-card">
                  <img src={bookIcon} alt="" className="h-full w-full object-cover" />
                </div>
                <div className="inline-flex items-center gap-2 rounded-2xl border border-border bg-card px-4 py-3 text-sm text-muted-foreground shadow-sm">
                  <LoaderCircle className="h-4 w-4 animate-spin text-primary" aria-hidden="true" />
                  Turning pages and finding context…
                </div>
              </div>
            )}
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <form onSubmit={handleSubmit} className="shrink-0 border-t border-border/80 bg-card/95 p-3 backdrop-blur sm:p-4">
        <label htmlFor="book-expert-input" className="sr-only">Your question for the Reading Room</label>
        <div className="rounded-2xl border border-input bg-background p-2 shadow-sm transition focus-within:border-primary/50 focus-within:ring-2 focus-within:ring-primary/15">
          <textarea
            ref={inputRef}
            id="book-expert-input"
            value={input}
            onChange={(event) => setInput(event.target.value)}
            onKeyDown={handleInputKeyDown}
            placeholder="Ask about a book, an author, or an idea…"
            rows={Math.min(4, Math.max(2, input.split("\n").length))}
            maxLength={2000}
            disabled={loading}
            className="max-h-28 min-h-12 w-full resize-none bg-transparent px-2 py-1.5 text-sm outline-none placeholder:text-muted-foreground/80 disabled:opacity-60"
          />
          <div className="flex items-center justify-between gap-2 border-t border-border/70 px-1 pt-2">
            <span className="text-[10px] text-muted-foreground">Enter to send · Shift + Enter for a new line</span>
            <button
              type="submit"
              disabled={!input.trim() || loading}
              aria-label="Send message"
              className="inline-flex h-9 items-center gap-2 rounded-xl bg-primary px-3.5 text-sm font-semibold text-primary-foreground transition hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-40"
            >
              {loading ? <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Send className="h-4 w-4" aria-hidden="true" />}
              <span className="hidden sm:inline">Send</span>
            </button>
          </div>
        </div>
        <p className="mt-2 text-center text-[10px] text-muted-foreground">Thoughtful answers, grounded in the library when sources are available.</p>
      </form>
    </section>
    </>
  );
};

export default BookExpert;
