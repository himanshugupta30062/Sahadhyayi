/** @vitest-environment jsdom */
import React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import HeroAtomicRings from "@/components/hero/HeroAtomicRings";
import { BookExpertContext } from "@/contexts/book-expert.utils";

const orbitFeatures = [
  "Digital Library",
  "Discover Books",
  "Research Papers",
  "Book Archive",
  "Publish Book",
  "My Publications",
  "My Bookshelf",
  "Reading Dashboard",
  "Reading Journal",
  "Quotes & Highlights",
  "Friends Feed",
  "Discover Friends",
  "Readers Map",
  "Readers Around a Book",
  "Reading Groups",
  "Reading Rooms",
  "Book Discussions",
  "Book Reviews",
  "Shared Marginalia",
  "Reading DNA",
  "Short Stories",
  "Life Stories",
  "Articles",
  "Blogs",
  "My Articles",
  "Write Article",
  "Authors",
  "Author Connect",
  "Reviewers & Critics",
  "Scientists",
  "Social Activists",
  "Freedom Fighters",
  "Publishers",
  "Events & Festivals",
  "Newsroom",
  "Activity Hub",
  "Reading Challenges",
  "Literary Games",
  "Reader Meetups"
];

const mockBookExpert = {
  isOpen: false,
  loading: false,
  messages: [],
  toggleChat: vi.fn(),
  closeChat: vi.fn(),
  clearConversation: vi.fn(),
  sendMessage: vi.fn(),
  sendFeedback: vi.fn(),
};

beforeEach(() => {
  Object.defineProperty(window, "matchMedia", {
    configurable: true,
    value: vi.fn().mockImplementation((media: string) => ({
      matches: true,
      media,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });
});

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("HeroAtomicRings", () => {
  it("shows all 40 current Sahadhyayi feature destinations across eight orbit bands", () => {
    render(
      <MemoryRouter>
        <BookExpertContext.Provider value={mockBookExpert}>
          <HeroAtomicRings size={760} />
        </BookExpertContext.Provider>
      </MemoryRouter>,
    );

    expect(
      screen.getByRole("group", {
        name: /40 Sahadhyayi features across eight animated rings/i,
      }),
    ).toBeInTheDocument();

    orbitFeatures.forEach((feature) => {
      expect(
        screen.getByRole("link", { name: "Explore " + feature }),
      ).toBeInTheDocument();
      expect(screen.getByText(feature)).toBeInTheDocument();
    });

    expect(
      screen.getByRole("button", { name: "Open Book Expert AI" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Book Expert AI")).toBeInTheDocument();
  });

  it("opens Book Expert AI from its orbit node", () => {
    render(
      <MemoryRouter>
        <BookExpertContext.Provider value={mockBookExpert}>
          <HeroAtomicRings size={760} />
        </BookExpertContext.Provider>
      </MemoryRouter>,
    );

    screen.getByRole("button", { name: "Open Book Expert AI" }).click();
    expect(mockBookExpert.toggleChat).toHaveBeenCalledTimes(1);
  });
});
