/** @vitest-environment jsdom */

import React from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";

afterEach(() => cleanup());

vi.mock("@/contexts/book-expert.utils", async () => {
  const ReactModule = await import("react");
  const welcome = "Welcome to Book Expert. Find your next read, explore an author, or ask about a book.";
  return {
    useBookExpert: () => {
      const [isOpen, setIsOpen] = ReactModule.useState(false);
      const [messages, setMessages] = ReactModule.useState([{ sender: "bot", text: welcome }]);
      return {
        isOpen,
        toggleChat: () => setIsOpen((current: boolean) => !current),
        closeChat: () => setIsOpen(false),
        clearConversation: () => setMessages([{ sender: "bot", text: welcome }]),
        messages,
        loading: false,
        sendMessage: async (text: string) => {
          setMessages((current: Array<{ sender: string; text: string }>) => [
            ...current,
            { sender: "user", text },
          ]);
        },
        sendFeedback: async () => undefined,
      };
    },
  };
});

import BookExpert from "@/components/book-expert/BookExpert";

describe("BookExpert popup controls", () => {
  it("shows an explicit close action and restores focus to the launcher", () => {
    render(<BookExpert />);

    fireEvent.click(screen.getByRole("button", { name: /open the sahadhyayi reading room/i }));
    const dialog = screen.getByRole("dialog", { name: /the reading room/i });

    expect(dialog).toBeInTheDocument();
    expect(within(dialog).getByRole("button", { name: /close reading room/i })).toBeInTheDocument();
    // On mobile, opening the panel must not summon the on-screen keyboard.
    expect(screen.getByRole("textbox", { name: /your question for the reading room/i })).not.toHaveFocus();

    fireEvent.click(within(dialog).getByRole("button", { name: /close reading room/i }));

    expect(screen.queryByRole("dialog", { name: /the reading room/i })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: /open the sahadhyayi reading room/i })).toHaveFocus();
  });

  it("closes when the reader taps outside the panel", () => {
    const { container } = render(<BookExpert />);

    fireEvent.click(screen.getByRole("button", { name: /open the sahadhyayi reading room/i }));
    expect(screen.getByRole("dialog", { name: /the reading room/i })).toBeInTheDocument();

    const backdrop = container.querySelector("button.fixed.inset-0");
    expect(backdrop).not.toBeNull();
    fireEvent.click(backdrop!);

    expect(screen.queryByRole("dialog", { name: /the reading room/i })).not.toBeInTheDocument();
  });

  it("closes on Escape", () => {
    render(<BookExpert />);

    fireEvent.click(screen.getByRole("button", { name: /open the sahadhyayi reading room/i }));
    expect(screen.getByRole("dialog", { name: /the reading room/i })).toBeInTheDocument();

    fireEvent.keyDown(window, { key: "Escape" });

    expect(screen.queryByRole("dialog", { name: /the reading room/i })).not.toBeInTheDocument();
  });

  it("keeps the existing conversation available after closing and reopening", async () => {
    render(<BookExpert />);

    fireEvent.click(screen.getByRole("button", { name: /open the sahadhyayi reading room/i }));
    const textbox = screen.getByRole("textbox", { name: /your question for the reading room/i });
    fireEvent.change(textbox, { target: { value: "Remember this conversation" } });
    fireEvent.keyDown(textbox, { key: "Enter", shiftKey: false });

    expect(await screen.findByText("Remember this conversation")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /close reading room/i }));
    fireEvent.click(screen.getByRole("button", { name: /open the sahadhyayi reading room/i }));

    expect(screen.getByText("Remember this conversation")).toBeInTheDocument();
  });

});