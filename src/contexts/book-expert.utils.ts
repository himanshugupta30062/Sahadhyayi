import { createContext, useContext } from "react";

export const BOOK_EXPERT_WELCOME_MESSAGE =
  "Welcome to Book Expert. Find your next read, explore an author, or ask about a book.";

export type BookExpertBook = {
  id: string;
  title: string;
  author: string | null;
  genre: string | null;
  description: string | null;
  coverImageUrl: string | null;
  publicationYear: number | null;
  language: string | null;
  pdfUrl: string | null;
};

export interface ChatMessage {
  sender: "user" | "bot";
  text: string;
  books?: BookExpertBook[];
  error?: boolean;
  requestId?: string;
  model?: string;
}

export type BookExpertHistoryItem = {
  role: "user" | "model";
  text: string;
};

export function toBookExpertHistory(messages: ChatMessage[]): BookExpertHistoryItem[] {
  const source = messages.filter((message, index) =>
    !(index === 0 && message.sender === "bot" && message.text === BOOK_EXPERT_WELCOME_MESSAGE)
  ).slice(-8);

  const history: BookExpertHistoryItem[] = [];
  for (const message of source) {
    const text = message.text.trim().slice(0, 1200);
    if (!text) continue;
    const role = message.sender === "user" ? "user" : "model";
    const previous = history[history.length - 1];

    if (previous && previous.role === role) {
      previous.text = (previous.text + "\n" + text).slice(-1200);
    } else {
      history.push({ role, text });
    }
  }

  return history.slice(-8);
}

export interface BookExpertContextType {
  isOpen: boolean;
  loading: boolean;
  messages: ChatMessage[];
  toggleChat: () => void;
  closeChat: () => void;
  clearConversation: () => void;
  sendMessage: (text: string) => Promise<void>;
  sendFeedback: (requestId: string, rating: -1 | 1) => Promise<void>;
}

export const BookExpertContext = createContext<BookExpertContextType | undefined>(undefined);

export const useBookExpert = () => {
  const ctx = useContext(BookExpertContext);
  if (!ctx) {
    throw new Error("useBookExpert must be used within BookExpertProvider");
  }
  return ctx;
};
