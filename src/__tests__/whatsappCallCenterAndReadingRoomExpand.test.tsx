/** @vitest-environment jsdom */

import React from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";

vi.mock("@/contexts/book-expert.utils", async () => {
  const ReactModule = await import("react");
  const welcome = "Welcome to Book Expert. Find your next read, explore an author, or ask about a book.";
  return {
    useBookExpert: () => {
      const [isOpen, setIsOpen] = ReactModule.useState(false);
      return {
        isOpen,
        toggleChat: () => setIsOpen((c: boolean) => !c),
        closeChat: () => setIsOpen(false),
        clearConversation: vi.fn(),
        messages: [{ sender: "bot", text: welcome }],
        loading: false,
        sendMessage: vi.fn(),
        sendFeedback: vi.fn(),
      };
    },
  };
});

import WhatsAppCallCenterFab from "@/components/support/WhatsAppCallCenterFab";
import {
  SAHADHYAYI_PHONE,
  SAHADHYAYI_PHONE_RAW,
  openSahadhyayiWhatsApp,
} from "@/components/support/whatsappSupport";
import BookExpert from "@/components/book-expert/BookExpert";

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe("WhatsAppCallCenterFab & Reading Room Expand/Collapse UI", () => {
  it("renders the WhatsApp floating action button above the bottom bar", () => {
    render(<WhatsAppCallCenterFab />);
    const button = screen.getByRole("button", { name: /call center and whatsapp support/i });
    expect(button).toBeInTheDocument();
    expect(button).toHaveAttribute("data-testid", "whatsapp-callcenter-fab");
  });

  it("opens the Helpline modal on click with phone number and WhatsApp option", () => {
    render(<WhatsAppCallCenterFab />);
    const button = screen.getByRole("button", { name: /call center and whatsapp support/i });
    fireEvent.click(button);

    expect(screen.getByRole("dialog", { name: /sahadhyayi support & call center/i })).toBeInTheDocument();
    expect(screen.getByText(/sahadhyayi helpline/i)).toBeInTheDocument();
    expect(screen.getByText(new RegExp(SAHADHYAYI_PHONE.replace('+', '\\+')))).toBeInTheDocument();

    const callLink = screen.getByRole("link", { name: new RegExp(`call us \\(${SAHADHYAYI_PHONE.replace('+', '\\+')}\\)`, "i") });
    expect(callLink).toHaveAttribute("href", `tel:${SAHADHYAYI_PHONE_RAW}`);
  });

  it("triggers window.open with the correct WhatsApp URL on Chat on WhatsApp click", () => {
    const windowOpenSpy = vi.spyOn(window, "open").mockImplementation(() => null);
    render(<WhatsAppCallCenterFab />);
    fireEvent.click(screen.getByRole("button", { name: /call center and whatsapp support/i }));

    const chatButton = screen.getByRole("button", { name: /chat on whatsapp/i });
    fireEvent.click(chatButton);

    expect(windowOpenSpy).toHaveBeenCalledTimes(1);
    const calledUrl = windowOpenSpy.mock.calls[0][0];
    expect(calledUrl).toContain(`https://wa.me/${SAHADHYAYI_PHONE_RAW}`);
    expect(calledUrl).toContain("Namaste");
  });

  it("switches inquiry topics and includes them in WhatsApp URL", () => {
    const windowOpenSpy = vi.spyOn(window, "open").mockImplementation(() => null);
    render(<WhatsAppCallCenterFab />);
    fireEvent.click(screen.getByRole("button", { name: /call center and whatsapp support/i }));

    // Select "Author Publishing"
    const authorTopicBtn = screen.getByRole("button", { name: /author publishing/i });
    fireEvent.click(authorTopicBtn);

    const chatButton = screen.getByRole("button", { name: /chat on whatsapp/i });
    fireEvent.click(chatButton);

    const calledUrl = windowOpenSpy.mock.calls[0][0];
    expect(calledUrl).toContain("submitting%20an%20article");
  });

  it("closes the Helpline modal on Escape", () => {
    render(<WhatsAppCallCenterFab />);
    fireEvent.click(screen.getByRole("button", { name: /call center and whatsapp support/i }));
    expect(screen.getByRole("dialog", { name: /sahadhyayi support & call center/i })).toBeInTheDocument();

    fireEvent.keyDown(window, { key: "Escape" });
    expect(screen.queryByRole("dialog", { name: /sahadhyayi support & call center/i })).not.toBeInTheDocument();
  });

  it("allows expanding Reading Room to widescreen mode and collapsing back", () => {
    render(<BookExpert />);
    fireEvent.click(screen.getByRole("button", { name: /open the sahadhyayi reading room/i }));
    const dialog = screen.getByRole("dialog", { name: /the reading room/i });

    // Initial compact view
    expect(dialog.className).toContain("sm:w-[min(420px,calc(100vw-3rem))]");

    // Click Expand to wide view
    const expandButton = within(dialog).getByRole("button", { name: /expand to wide view/i });
    fireEvent.click(expandButton);

    // Should now have the expanded widescreen class
    expect(dialog.className).toContain("sm:w-[min(720px,calc(100vw-3rem))]");

    // Click Collapse to compact view
    const collapseButton = within(dialog).getByRole("button", { name: /collapse to compact view/i });
    fireEvent.click(collapseButton);

    // Should be restored to compact view
    expect(dialog.className).toContain("sm:w-[min(420px,calc(100vw-3rem))]");
  });

  it("includes a direct WhatsApp Help button in the Reading Room header", () => {
    const windowOpenSpy = vi.spyOn(window, "open").mockImplementation(() => null);
    render(<BookExpert />);
    fireEvent.click(screen.getByRole("button", { name: /open the sahadhyayi reading room/i }));
    const dialog = screen.getByRole("dialog", { name: /the reading room/i });

    const whatsappHelpBtn = within(dialog).getByRole("button", { name: /connect with call center on whatsapp/i });
    expect(whatsappHelpBtn).toBeInTheDocument();

    fireEvent.click(whatsappHelpBtn);
    expect(windowOpenSpy).toHaveBeenCalledTimes(1);
    expect(windowOpenSpy.mock.calls[0][0]).toContain(`https://wa.me/${SAHADHYAYI_PHONE_RAW}`);
  });
});
