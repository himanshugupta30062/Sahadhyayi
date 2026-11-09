/** @vitest-environment jsdom */

import React from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen, within, act } from "@testing-library/react";

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
  it("renders the WhatsApp floating action button sized exactly like book reader and aligned directly above it", () => {
    render(<WhatsAppCallCenterFab />);
    const button = screen.getByRole("button", { name: /call center and whatsapp support/i });
    expect(button).toBeInTheDocument();
    expect(button).toHaveAttribute("data-testid", "whatsapp-callcenter-fab");
    // Verify dimensions match Book Reader launcher (48px mobile w-12 h-12, 56px desktop sm:w-14 sm:h-14)
    expect(button).toHaveClass("w-12", "h-12", "sm:w-14", "sm:h-14");
    // Verify vertical alignment directly above Book Reader (aligned on right-4 sm:right-5 lg:right-6)
    expect(button).toHaveClass("right-4", "sm:right-5", "lg:right-6");
    expect(button).toHaveClass("bottom-[76px]", "sm:bottom-[88px]", "lg:bottom-[96px]");
  });

  it("opens the Helpline modal on click with call action and WhatsApp option without displaying raw phone number", () => {
    render(<WhatsAppCallCenterFab />);
    const button = screen.getByRole("button", { name: /call center and whatsapp support/i });
    fireEvent.click(button);

    expect(screen.getByRole("dialog", { name: /sahadhyayi support & call center/i })).toBeInTheDocument();
    expect(screen.getByText(/sahadhyayi helpline/i)).toBeInTheDocument();

    // Verify phone number is NOT visible to the user in text
    expect(screen.queryByText(/8920785645/)).not.toBeInTheDocument();
    expect(screen.queryByText(/\+91/)).not.toBeInTheDocument();

    const callLink = screen.getByRole("link", { name: /call support helpline/i });
    expect(callLink).toHaveAttribute("href", `tel:${SAHADHYAYI_PHONE_RAW}`);
    expect(SAHADHYAYI_PHONE_RAW).toBe("918920785645");
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

  it("minimizes Reading Room to an icon and restores the same open panel", () => {
    render(<BookExpert />);
    fireEvent.click(screen.getByRole("button", { name: /open the sahadhyayi reading room/i }));
    const dialog = screen.getByRole("dialog", { name: /the reading room/i });

    fireEvent.click(within(dialog).getByRole("button", { name: /minimize reading room to floating icon/i }));
    expect(screen.queryByRole("dialog", { name: /the reading room/i })).not.toBeInTheDocument();

    const launcher = screen.getByRole("button", { name: /restore reading room ai/i });
    expect(launcher).toHaveAttribute("data-testid", "reading-room-mini-launcher");
    fireEvent.click(launcher);

    expect(screen.getByRole("dialog", { name: /the reading room/i })).toBeInTheDocument();
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

  it("folds and unfolds the Book Expert launcher label like Estate Mitra", () => {
    vi.useFakeTimers();
    render(<BookExpert />);

    // Initially unfolded with label visible
    const label = screen.getByTestId("reading-room-launcher-label");
    expect(label).toHaveClass("max-w-[170px]");
    expect(label).toHaveClass("opacity-100");
    expect(screen.getByText("Book Expert AI")).toBeInTheDocument();

    // After 5s timeout, it collapses / folds into the compact icon
    act(() => {
      vi.advanceTimersByTime(5000);
    });
    expect(label).toHaveClass("max-w-0");
    expect(label).toHaveClass("opacity-0");

    // After 30s cycle, it unfolds again briefly
    act(() => {
      vi.advanceTimersByTime(25000); // reaches 30s total
    });
    expect(label).toHaveClass("max-w-[170px]");
    expect(label).toHaveClass("opacity-100");

    vi.useRealTimers();
  });

  it("coordinates correct spacing and alignment between Book Expert and Call Center FAB", () => {
    const { container } = render(
      <>
        <WhatsAppCallCenterFab />
        <BookExpert />
      </>
    );

    const callCenterFab = screen.getByTestId("whatsapp-callcenter-fab");
    const bookExpertLauncher = screen.getByTestId("reading-room-launcher");

    // Book Expert positioned at bottom-4 right-4 on mobile and sm:bottom-5 sm:right-5 on desktop
    expect(bookExpertLauncher.className).toContain("bottom-4");
    expect(bookExpertLauncher.className).toContain("right-4");
    expect(bookExpertLauncher.className).toContain("sm:bottom-5");
    expect(bookExpertLauncher.className).toContain("sm:right-5");

    // Call Center FAB positioned at bottom-[76px] right-4 (12px gap) and sm:bottom-[88px] sm:right-5 (12px gap)
    expect(callCenterFab.className).toContain("bottom-[76px]");
    expect(callCenterFab.className).toContain("right-4");
    expect(callCenterFab.className).toContain("sm:bottom-[88px]");
    expect(callCenterFab.className).toContain("sm:right-5");
    expect(callCenterFab.className).toContain("w-12");
    expect(callCenterFab.className).toContain("sm:w-14");

    // Verifies Call Center uses the Support / Help icon (LifeBuoy SVG)
    const supportSvg = callCenterFab.querySelector("svg");
    expect(supportSvg).toBeInTheDocument();
  });
});
