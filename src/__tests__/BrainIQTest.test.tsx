// @vitest-environment jsdom
import React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import BrainIQTest from "@/pages/BrainIQTest";

const mocks = vi.hoisted(() => ({
  listAttempts: vi.fn(),
  saveAttempt: vi.fn(),
}));

vi.mock("@/components/SEO", () => ({ default: () => null }));
vi.mock("@/lib/brain/attempts", () => ({
  listBrainAssessmentAttempts: mocks.listAttempts,
  saveBrainAssessmentAttempt: mocks.saveAttempt,
}));

function renderPage(initialEntries = ["/brain/iq-test"]) {
  return render(
    <MemoryRouter initialEntries={initialEntries}>
      <BrainIQTest />
    </MemoryRouter>,
  );
}

describe("BrainIQTest page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.listAttempts.mockResolvedValue([]);
    mocks.saveAttempt.mockResolvedValue(null);
    window.localStorage.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("renders the assessment setup screen with difficulty selection", () => {
    renderPage();

    expect(screen.getByRole("heading", { name: /Reasoning test/i })).toBeInTheDocument();
    expect(screen.getByText(/Before you begin/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Begin assessment/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /^Easy/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /^Medium/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /^Hard/i })).toBeInTheDocument();
  });

  it("renders daily mode challenge setup when ?mode=daily", () => {
    renderPage(["/brain/iq-test?mode=daily"]);

    expect(screen.getByRole("heading", { name: /Daily brain challenge/i })).toBeInTheDocument();
    expect(screen.getByText(/3 questions/i)).toBeInTheDocument();
    expect(screen.getByText(/Untimed/i)).toBeInTheDocument();
  });

  it("renders practice mode with focus area filters when ?mode=practice", () => {
    renderPage(["/brain/iq-test?mode=practice"]);

    expect(screen.getByRole("heading", { name: /Skill practice/i })).toBeInTheDocument();
    expect(screen.getByText(/Focus area/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Visual patterns/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Spatial reasoning/i })).toBeInTheDocument();
  });

  it("starts the assessment, allows selecting options, flagging, and completing", async () => {
    renderPage(["/brain/iq-test?mode=daily"]);

    // Begin assessment
    fireEvent.click(screen.getByRole("button", { name: /Begin assessment/i }));

    // Verify first question prompt is visible
    expect(screen.getByText(/Which symbol completes the sequence\?/i)).toBeInTheDocument();
    expect(screen.getByText(/Question progress/i)).toBeInTheDocument();

    // Flag question for review
    const flagBtn = screen.getByRole("button", { name: /Flag/i });
    fireEvent.click(flagBtn);
    expect(screen.getAllByText(/Flagged/i).length).toBeGreaterThan(0);

    // Select option D (diamond: index 3)
    const optionD = screen.getByRole("button", { name: /D.*◇/i });
    fireEvent.click(optionD);

    // Check that it's selected (pressed)
    expect(optionD).toHaveAttribute("aria-pressed", "true");

    // Advance to next question
    fireEvent.click(screen.getByRole("button", { name: /Next question/i }));

    // Question 2 should now be visible
    expect(screen.getByText(/What number comes next\?/i)).toBeInTheDocument();

    // Test keyboard navigation: press 'C' or '3' for 42 (index 2)
    fireEvent.keyDown(window, { key: "c" });

    // Advance to next question via ArrowRight
    fireEvent.keyDown(window, { key: "ArrowRight" });

    // Question 3: Finish test
    const finishBtn = screen.getByRole("button", { name: /Finish test/i });
    fireEvent.click(finishBtn);

    // Results screen
    await waitFor(() => {
      expect(screen.getByRole("heading", { name: /Your practice results/i })).toBeInTheDocument();
    });

    expect(screen.getByText(/Overall Score/i)).toBeInTheDocument();
    expect(screen.getByText(/Answer explanations/i)).toBeInTheDocument();
    expect(mocks.saveAttempt).toHaveBeenCalled();
  });

  it("allows ending assessment early and reviewing results", async () => {
    renderPage(["/brain/iq-test?mode=daily"]);

    fireEvent.click(screen.getByRole("button", { name: /Begin assessment/i }));
    expect(screen.getByText(/Which symbol completes the sequence\?/i)).toBeInTheDocument();

    const endEarlyBtn = screen.getByRole("button", { name: /End assessment early/i });
    fireEvent.click(endEarlyBtn);

    await waitFor(() => {
      expect(screen.getByRole("heading", { name: /Your practice results/i })).toBeInTheDocument();
    });

    // Try again resets test
    fireEvent.click(screen.getByRole("button", { name: /Try again/i }));
    expect(screen.getByRole("heading", { name: /Daily brain challenge/i })).toBeInTheDocument();
  });
});
