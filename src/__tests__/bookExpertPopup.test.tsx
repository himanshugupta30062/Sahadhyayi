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
          setMessages((current: Array<{ sender: string; text: string }>) => [...current, { sender: "user", text }]);
        },
        sendFeedback: async () => undefined,
      };
    },
  };
});

import BookExpert from "@/components/book-expert/BookExpert";

describe("BookExpert responsive reader controls", () => {
  it("keeps a visible close control inside the reader and restores focus to its launcher", () => {
    render(<BookExpert />);
    fireEvent.click(screen.getByRole("button", { name: /open the sahadhyayi reading room/i }));
    const dialog = screen.getByRole("dialog", { name: /the reading room/i });

    expect(dialog).toHaveAttribute("aria-modal", "true");
    expect(dialog.className).toContain("reader-room-panel-enter");
    expect(within(dialog).getByRole("button", { name: /close reading room/i })).toBeInTheDocument();
    expect(screen.getByRole("textbox", { name: /your question for the reading room/i })).not.toHaveFocus();

    fireEvent.click(within(dialog).getByRole("button", { name: /close reading room/i }));
    expect(screen.queryByRole("dialog", { name: /the reading room/i })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: /open the sahadhyayi reading room/i })).toHaveFocus();
  });

  it("closes when the backdrop is clicked", () => {
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
    fireEvent.keyDown(window, { key: "Escape" });
    expect(screen.queryByRole("dialog", { name: /the reading room/i })).not.toBeInTheDocument();
  });

  it("keeps keyboard focus inside the reader while it is open", () => {
    render(<BookExpert />);
    fireEvent.click(screen.getByRole("button", { name: /open the sahadhyayi reading room/i }));
    const dialog = screen.getByRole("dialog", { name: /the reading room/i });
    const closeButton = within(dialog).getByRole("button", { name: /close reading room/i });
    const sendButton = within(dialog).getByRole("button", { name: /send message/i });

    sendButton.focus();
    fireEvent.keyDown(window, { key: "Tab" });
    expect(closeButton).toHaveFocus();
  });

  it("preserves the conversation when the reader is closed and reopened", async () => {
    render(<BookExpert />);
    fireEvent.click(screen.getByRole("button", { name: /open the sahadhyayi reading room/i }));
    const textbox = screen.getByRole("textbox", { name: /your question for the reading room/i });
    fireEvent.change(textbox, { target: { value: "Remember this conversation" } });
    fireEvent.keyDown(textbox, { key: "Enter", shiftKey: false });
    expect(await screen.findByText("Remember this conversation")).toBeInTheDocument();

    fireEvent.click(within(screen.getByRole("dialog", { name: /the reading room/i })).getByRole("button", { name: /close reading room/i }));
    fireEvent.click(screen.getByRole("button", { name: /open the sahadhyayi reading room/i }));
    expect(screen.getByText("Remember this conversation")).toBeInTheDocument();
  });

  it("uses compact height and width constraints for mobile and desktop", () => {
    render(<BookExpert />);
    fireEvent.click(screen.getByRole("button", { name: /open the sahadhyayi reading room/i }));
    const dialog = screen.getByRole("dialog", { name: /the reading room/i });

    expect(dialog.className).toContain("h-[min(70dvh,600px)]");
    expect(dialog.className).toContain("sm:h-[min(650px,calc(100dvh-3rem))]");
    expect(dialog.className).toContain("sm:w-[min(400px,calc(100vw-3rem))]");
  });
});
