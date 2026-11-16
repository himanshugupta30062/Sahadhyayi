// @vitest-environment jsdom

import React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { MemoryRouter } from "react-router-dom";
import HelpCenter from "@/pages/HelpCenter";

// Mock SEO
vi.mock("@/components/SEO", () => ({
  default: ({ title, description, schema }: any) => (
    <div data-testid="seo-mock" data-title={title} data-description={description} data-schema={JSON.stringify(schema)} />
  ),
}));

// Mock WhatsApp support helper
const mockOpenWhatsApp = vi.fn();
vi.mock("@/components/support/whatsappSupport", () => ({
  SAHADHYAYI_PHONE: "+91 8920785645",
  SAHADHYAYI_PHONE_RAW: "918920785645",
  SAHADHYAYI_EMAIL: "gyan@sahadhyayi.com",
  openSahadhyayiWhatsApp: (...args: any[]) => mockOpenWhatsApp(...args),
}));

// Mock ContactFormDialog
vi.mock("@/components/ContactFormDialog", () => ({
  default: ({ trigger }: { trigger: React.ReactNode }) => (
    <div data-testid="contact-dialog-wrapper">{trigger}</div>
  ),
}));

// Mock Sonner toast
vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    info: vi.fn(),
    error: vi.fn(),
  },
}));

describe("HelpCenter Component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  it("renders page header, breadcrumbs, search input, and status badge", () => {
    render(
      <MemoryRouter>
        <HelpCenter />
      </MemoryRouter>
    );

    expect(
      screen.getByRole("heading", { name: /How can we help your reading journey\?/i })
    ).toBeInTheDocument();

    expect(screen.getByText(/All Systems Operational/i)).toBeInTheDocument();
    expect(screen.getByRole("textbox", { name: /Search help articles and FAQs/i })).toBeInTheDocument();
    expect(screen.getByRole("navigation", { name: /Breadcrumb/i })).toBeInTheDocument();
  });

  it("filters FAQs based on search input", () => {
    render(
      <MemoryRouter>
        <HelpCenter />
      </MemoryRouter>
    );

    const searchInput = screen.getByRole("textbox", { name: /Search help articles and FAQs/i });
    fireEvent.change(searchInput, { target: { value: "Ghost Mode" } });

    expect(screen.getByText(/What is Ghost Mode and how do I enable it\?/i)).toBeInTheDocument();
    expect(
      screen.queryByText(/How can published authors get a verified profile/i)
    ).not.toBeInTheDocument();
    expect(screen.getByText(/Showing 1 results for "Ghost Mode"/i)).toBeInTheDocument();
  });

  it("allows clearing the search query", () => {
    render(
      <MemoryRouter>
        <HelpCenter />
      </MemoryRouter>
    );

    const searchInput = screen.getByRole("textbox", { name: /Search help articles and FAQs/i });
    fireEvent.change(searchInput, { target: { value: "offline" } });

    expect(screen.getByText(/Showing \d+ results for "offline"/i)).toBeInTheDocument();

    // Click the clear button inside input
    const clearButton = screen.getByRole("button", { name: "Clear search input" });
    fireEvent.click(clearButton);

    expect(searchInput).toHaveValue("");
    expect(screen.getByText(/Showing \d+ articles in all topics/i)).toBeInTheDocument();
  });

  it("filters FAQs when clicking category navigation cards", () => {
    render(
      <MemoryRouter>
        <HelpCenter />
      </MemoryRouter>
    );

    // Click on "Authors & Publishing" category card
    const authorsCard = screen.getByRole("button", { name: "Category: Authors & Publishing" });
    fireEvent.click(authorsCard);

    expect(screen.getByText(/How can published authors get a verified profile/i)).toBeInTheDocument();
    expect(screen.getByText(/How do I submit an article or academic research paper\?/i)).toBeInTheDocument();
    expect(
      screen.queryByText(/What is Ghost Mode and how do I enable it\?/i)
    ).not.toBeInTheDocument();

    // Reset filter
    const resetButton = screen.getByRole("button", { name: /Reset category filter/i });
    fireEvent.click(resetButton);

    expect(screen.getByText(/What is Ghost Mode and how do I enable it\?/i)).toBeInTheDocument();
  });

  it("renders interactive feature walkthrough guides without rickroll iframes", () => {
    render(
      <MemoryRouter>
        <HelpCenter />
      </MemoryRouter>
    );

    // Ensure no mock YouTube or Rickroll iframes exist
    expect(screen.queryByTitle(/Getting Started/i)).not.toBeInTheDocument();
    const iframes = document.querySelectorAll("iframe");
    expect(iframes.length).toBe(0);

    // Check that genuine feature guides exist
    expect(screen.getByText(/Master the Digital Reader & Offline Storage/i)).toBeInTheDocument();
    expect(screen.getByText(/Connect on the Social Map with Complete Privacy/i)).toBeInTheDocument();
    expect(screen.getByText(/Deep Comprehension with the AI Book Companion/i)).toBeInTheDocument();
    expect(screen.getByText(/Join Live Reading Rooms & Silent Sprints/i)).toBeInTheDocument();

    // Verify CTAs
    expect(screen.getByRole("link", { name: /Explore Library/i })).toHaveAttribute("href", "/library");
    expect(screen.getByRole("link", { name: /Open Social Map/i })).toHaveAttribute("href", "/map");
  });

  it("supports helpful voting on FAQ answers", () => {
    render(
      <MemoryRouter>
        <HelpCenter />
      </MemoryRouter>
    );

    // Click first FAQ accordion trigger to open its content
    const faqTrigger = screen.getByRole("button", { name: /How do I create an account and personalize my reading profile\?/i });
    fireEvent.click(faqTrigger);

    const yesButton = screen.getByRole("button", { name: /Yes, this answer was helpful/i });
    expect(yesButton).toBeInTheDocument();

    fireEvent.click(yesButton);
    expect(yesButton).toBeDisabled();
  });

  it("triggers WhatsApp support when clicking Chat on WhatsApp", () => {
    render(
      <MemoryRouter>
        <HelpCenter />
      </MemoryRouter>
    );

    const waButton = screen.getByRole("button", { name: /Chat on WhatsApp/i });
    fireEvent.click(waButton);

    expect(mockOpenWhatsApp).toHaveBeenCalledWith(
      expect.stringContaining("Namaste Sahadhyayi Support")
    );
  });

  it("renders support options including in-app message dialog, email, and bug reporting", () => {
    render(
      <MemoryRouter>
        <HelpCenter />
      </MemoryRouter>
    );

    expect(screen.getByTestId("contact-dialog-wrapper")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Open Message Form/i })).toBeInTheDocument();

    const emailLink = screen.getByRole("link", { name: /Send Email/i });
    expect(emailLink).toHaveAttribute(
      "href",
      expect.stringContaining("mailto:gyan@sahadhyayi.com")
    );

    const bugLink = screen.getByRole("link", { name: /Report an Issue/i });
    expect(bugLink).toHaveAttribute("href", "/feedback?type=bug");
  });

  it("renders SEO with FAQPage JSON-LD schema", () => {
    render(
      <MemoryRouter>
        <HelpCenter />
      </MemoryRouter>
    );

    const seoElement = screen.getByTestId("seo-mock");
    expect(seoElement).toBeInTheDocument();
    expect(seoElement.getAttribute("data-title")).toContain("Help Center & Knowledge Base");

    const schema = JSON.parse(seoElement.getAttribute("data-schema") || "{}");
    expect(schema["@type"]).toBe("FAQPage");
    expect(schema.mainEntity.length).toBeGreaterThan(10);
  });
});
