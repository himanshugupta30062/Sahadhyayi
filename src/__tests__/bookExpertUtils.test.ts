import { describe, expect, it } from "vitest";
import {
  BOOK_EXPERT_WELCOME_MESSAGE,
  toBookExpertHistory,
  type ChatMessage,
} from "@/contexts/book-expert.utils";

describe("Book Expert conversation history", () => {
  it("omits the initial greeting and maps messages to Gemini roles", () => {
    const messages: ChatMessage[] = [
      { sender: "bot", text: BOOK_EXPERT_WELCOME_MESSAGE },
      { sender: "user", text: "Recommend a fantasy book." },
      { sender: "bot", text: "I found a few titles." },
    ];

    expect(toBookExpertHistory(messages)).toEqual([
      { role: "user", text: "Recommend a fantasy book." },
      { role: "model", text: "I found a few titles." },
    ]);
  });

  it("keeps history bounded to the latest eight messages", () => {
    const messages: ChatMessage[] = Array.from({ length: 12 }, (_, index) => ({
      sender: index % 2 === 0 ? "user" : "bot",
      text: "message " + index,
    })) as ChatMessage[];

    const history = toBookExpertHistory(messages);

    expect(history.length).toBeLessThanOrEqual(8);
    expect(history[history.length - 1]?.text).toBe("message 11");
    expect(history.some((item) => item.text === "message 0")).toBe(false);
  });

  it("truncates an individual history message to 1200 characters", () => {
    const history = toBookExpertHistory([
      { sender: "user", text: "x".repeat(1400) },
    ]);

    expect(history[0]?.text).toHaveLength(1200);
  });

  it("merges adjacent messages with the same role to preserve a valid turn sequence", () => {
    const history = toBookExpertHistory([
      { sender: "user", text: "First question" },
      { sender: "bot", text: "First answer" },
      { sender: "bot", text: "Additional context" },
      { sender: "user", text: "Follow-up" },
    ]);

    expect(history).toEqual([
      { role: "user", text: "First question" },
      { role: "model", text: "First answer\nAdditional context" },
      { role: "user", text: "Follow-up" },
    ]);
  });
});
