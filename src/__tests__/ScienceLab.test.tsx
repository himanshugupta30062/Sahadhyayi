// @vitest-environment jsdom
import React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import ScienceLab from "@/pages/ScienceLab";

const mocks = vi.hoisted(() => ({
  select: vi.fn(),
  insert: vi.fn(),
  from: vi.fn(),
  getUser: vi.fn(),
}));

vi.mock("@/components/SEO", () => ({ default: () => null }));
vi.mock("@/integrations/supabase/client-universal", () => ({
  supabase: {
    from: mocks.from,
    auth: {
      getUser: mocks.getUser,
    },
  },
}));

describe("ScienceLab page and experiments section", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getUser.mockResolvedValue({ data: { user: null }, error: null });

    const queryBuilder = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue({ data: [], error: null }),
      insert: mocks.insert.mockResolvedValue({ error: null }),
    };
    mocks.from.mockReturnValue(queryBuilder);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  function renderPage(initialEntries = ["/science-lab"]) {
    return render(
      <MemoryRouter initialEntries={initialEntries}>
        <ScienceLab />
      </MemoryRouter>,
    );
  }

  it("renders the Science Lab banner, tabs, and curated experiments", async () => {
    renderPage();

    expect(screen.getByRole("heading", { name: /Don't just read science/i })).toBeInTheDocument();
    expect(screen.getByText(/Find an experiment to try/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Discover Experiments/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Community Discoveries/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /My Experiment Journal/i })).toBeInTheDocument();

    // Verify key experiments exist in catalog
    expect(screen.getByText("Build a Strong Paper Bridge")).toBeInTheDocument();
    expect(screen.getByText("Bend Water with Static Electricity")).toBeInTheDocument();
    expect(screen.getByText("Make a Layered Liquid Density Tower")).toBeInTheDocument();
  });

  it("filters experiments by category, difficulty, duration and search text", async () => {
    renderPage();

    // Filter by Physics
    const physicsBtn = screen.getByRole("button", { name: "Physics" });
    fireEvent.click(physicsBtn);
    expect(screen.getByText("Bend Water with Static Electricity")).toBeInTheDocument();
    expect(screen.queryByText("Make a Layered Liquid Density Tower")).not.toBeInTheDocument();

    // Filter by Difficulty
    const intermediateBtn = screen.getByRole("button", { name: "Intermediate" });
    fireEvent.click(intermediateBtn);
    expect(screen.getByText("Build a Simple Periscope with Two Mirrors")).toBeInTheDocument();
    expect(screen.queryByText("Bend Water with Static Electricity")).not.toBeInTheDocument();

    // Search query
    const searchInput = screen.getByPlaceholderText(/Search materials or topics/i);
    fireEvent.change(searchInput, { target: { value: "Periscope" } });
    expect(screen.getByText("Build a Simple Periscope with Two Mirrors")).toBeInTheDocument();

    // Clear filters
    const resetBtn = screen.getByRole("button", { name: /Reset all filters/i });
    fireEvent.click(resetBtn);
    expect(screen.getByText("Build a Strong Paper Bridge")).toBeInTheDocument();
  });

  it("opens an experiment modal, interacts with materials and steps checklist, and controls the timer", async () => {
    renderPage();

    const viewButtons = screen.getAllByRole("button", { name: /View experiment & steps/i });
    fireEvent.click(viewButtons[0]); // Opens Paper Bridge

    // Modal is open
    const dialog = screen.getByRole("dialog");
    expect(dialog).toBeInTheDocument();
    expect(within(dialog).getByRole("heading", { name: "Build a Strong Paper Bridge" })).toBeInTheDocument();

    // Check off material
    const materialItem = screen.getByText("3 sheets of standard copy paper");
    fireEvent.click(materialItem);
    expect(materialItem).toHaveClass("line-through");

    // Check off step
    const step1 = screen.getByText(/Place two equal-height books 15 cm apart/i);
    fireEvent.click(step1);

    // Timer controls
    const startTimerBtn = screen.getByRole("button", { name: /Start timer/i });
    fireEvent.click(startTimerBtn);
    expect(screen.getByRole("button", { name: /Pause/i })).toBeInTheDocument();

    // Add +1m
    const add1mBtn = screen.getByRole("button", { name: "+1m" });
    fireEvent.click(add1mBtn);
    expect(screen.getByText("01:00")).toBeInTheDocument();

    // Scientific inquiry variables
    expect(screen.getByText(/Try changing variables: "What if you\.\.\.\?"/i)).toBeInTheDocument();

    // Cross-link to Explain Science Around You
    const theoryLinks = screen.getAllByRole("link", { name: /Explain Science Around You/i });
    expect(theoryLinks.some((l) => l.getAttribute("href") === "/science-around-you")).toBe(true);

    // Close modal
    const closeBtn = screen.getByRole("button", { name: /Close experiment/i });
    fireEvent.click(closeBtn);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("submits an experiment observation attempt when authenticated", async () => {
    mocks.getUser.mockResolvedValue({ data: { user: { id: "test-user-1" } }, error: null });
    renderPage();

    const viewButtons = screen.getAllByRole("button", { name: /View experiment & steps/i });
    fireEvent.click(viewButtons[0]);

    const recordBtn = screen.getByRole("button", { name: /I've tried this — record my observations/i });
    fireEvent.click(recordBtn);

    const obsTextarea = await screen.findByLabelText(/What did you observe\? \*/i);
    fireEvent.change(obsTextarea, {
      target: { value: "The folded accordion paper carried 32 coins before sagging, while flat paper fell on 2 coins." },
    });

    const saveBtn = screen.getByRole("button", { name: /Save experiment to journal/i });
    fireEvent.click(saveBtn);

    await waitFor(() => {
      expect(mocks.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          user_id: "test-user-1",
          observations: expect.stringContaining("The folded accordion paper carried 32 coins"),
          share_public: true,
        }),
      );
    });
  });

  it("submits an experiment request idea when requested", async () => {
    mocks.getUser.mockResolvedValue({ data: { user: { id: "test-user-1" } }, error: null });
    renderPage();

    const requestBtns = screen.getAllByRole("button", { name: /Request an experiment/i });
    fireEvent.click(requestBtns[0]);

    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /Suggest an experiment/i })).toBeInTheDocument();

    const titleInput = screen.getByLabelText(/What would you like to investigate\? \*/i);
    fireEvent.change(titleInput, { target: { value: "Make an electric lemon battery" } });

    const submitBtn = screen.getByRole("button", { name: /Submit experiment suggestion/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(mocks.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          user_id: "test-user-1",
          title: "Make an electric lemon battery",
        }),
      );
    });
  });
});
