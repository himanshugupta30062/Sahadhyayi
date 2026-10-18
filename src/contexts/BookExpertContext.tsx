import React, { useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client-universal";
import {
  BOOK_EXPERT_WELCOME_MESSAGE,
  BookExpertContext,
  toBookExpertHistory,
  type BookExpertBook,
  type ChatMessage,
} from "./book-expert.utils";

function initialMessages(): ChatMessage[] {
  return [{ sender: "bot", text: BOOK_EXPERT_WELCOME_MESSAGE }];
}

export const BookExpertProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const requestInFlight = useRef(false);

  const toggleChat = () => setIsOpen((current) => !current);
  const closeChat = () => setIsOpen(false);

  const clearConversation = () => {
    if (requestInFlight.current) return;
    setMessages(initialMessages());
  };

  const sendMessage = async (rawText: string) => {
    const text = rawText.trim();
    if (!text || requestInFlight.current) return;

    requestInFlight.current = true;
    setLoading(true);
    const history = toBookExpertHistory(messages);
    setMessages((current) => [...current, { sender: "user", text }]);

    try {
      const { data, error } = await supabase.functions.invoke("book-expert-gemini", {
        body: { text, history },
      });

      if (error) throw error;
      if (!data || typeof data !== "object" || typeof data.reply !== "string") {
        throw new Error("Invalid Book Expert response");
      }

      const books: BookExpertBook[] = Array.isArray(data.books)
        ? data.books
            .filter((book: any) => book && typeof book.id === "string" && typeof book.title === "string")
            .slice(0, 5)
            .map((book: any) => ({
              id: book.id,
              title: book.title,
              author: typeof book.author === "string" ? book.author : null,
              genre: typeof book.genre === "string" ? book.genre : null,
              description: typeof book.description === "string" ? book.description : null,
              coverImageUrl: typeof book.coverImageUrl === "string" ? book.coverImageUrl : null,
              publicationYear: typeof book.publicationYear === "number" ? book.publicationYear : null,
              language: typeof book.language === "string" ? book.language : null,
              readingUrl: typeof book.readingUrl === "string" ? book.readingUrl : null,
              isDirectPdf: book.isDirectPdf === true,
            }))
        : [];

      setMessages((current) => [
        ...current,
        {
          sender: "bot",
          text: data.reply,
          books,
          requestId: typeof data.requestId === "string" ? data.requestId : undefined,
          model: typeof data.sources?.model === "string" ? data.sources.model : undefined,
        },
      ]);
    } catch (error) {
      // Do not put upstream provider details or secrets into the conversation.
      console.error("Book Expert request failed:", error instanceof Error ? error.name : "UnknownError");
      setMessages((current) => [
        ...current,
        {
          sender: "bot",
          text: "I couldn't complete that answer just now. Please try again in a moment.",
          error: true,
        },
      ]);
    } finally {
      requestInFlight.current = false;
      setLoading(false);
    }
  };

  const sendFeedback = async (requestId: string, rating: -1 | 1) => {
    if (!requestId || (rating !== -1 && rating !== 1)) return;
    try {
      const { error } = await supabase.functions.invoke("book-expert-gemini", {
        body: { feedback: { requestId, rating } },
      });
      if (error) {
        console.error("Book Expert feedback could not be saved.");
      }
    } catch {
      console.error("Book Expert feedback could not be saved.");
    }
  };

  return (
    <BookExpertContext.Provider
      value={{
        isOpen,
        loading,
        messages,
        toggleChat,
        closeChat,
        clearConversation,
        sendMessage,
        sendFeedback,
      }}
    >
      {children}
    </BookExpertContext.Provider>
  );
};

export default BookExpertProvider;
