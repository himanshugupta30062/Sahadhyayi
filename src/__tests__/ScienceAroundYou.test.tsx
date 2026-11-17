// @vitest-environment jsdom
import React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import ScienceAroundYou from "@/pages/ScienceAroundYou";
import { SCIENCE_QUESTIONS } from "@/lib/science/questionBank";

const mocks = vi.hoisted(() => ({
  invoke: vi.fn(),
  listAttempts: vi.fn(),
  saveAttempt: vi.fn(),
}));

vi.mock("@/components/SEO", () => ({ default: () => null }));
vi.mock("@/integrations/supabase/client-universal", () => ({
  supabase: { functions: { invoke: mocks.invoke } },
}));
vi.mock("@/lib/science/attempts", () => ({
  listEverydayScienceAttempts: mocks.listAttempts,
  saveEverydayScienceAttempt: mocks.saveAttempt,
}));

function makeEvaluation(score = 80) {
  return {
    difficulty: "beginner",
    questionSetVersion: "everyday-science-v1-beginner-difficulty-calibration-v1",
    overallScore: score,
    categoryScores: {
      Physics: score,
      Chemistry: 55,
      "Technology & engineering": 75,
      "Earth & space science": 90,
    },
    results: SCIENCE_QUESTIONS.map((question) => ({
      questionId: question.id,
      domain: question.domain,
      score,
      dimensions: {
        accuracy: score,
        conceptualUnderstanding: score,
        reasoning: score,
        completeness: score,
        clarity: score,
      },
      strengths: ["You identified the main scientific process."],
      improvements: ["Explain one more step in the process."],
      feedback: "Your explanation is scientifically sound.",
      misconceptionCorrection: null,
      correctExplanation: "This is the verified scientific explanation for the topic.",
    })),
  };
}

function renderPage() {
  return render(
    <MemoryRouter>
      <ScienceAroundYou />
    </MemoryRouter>,
  );
}

async function completeAssessment() {
  fireEvent.click(screen.getByRole("button", { name: /Start the science test/i }));
  fireEvent.change(screen.getByLabelText("Your explanation"), {
    target: { value: "Moving air increases heat transfer from skin and helps sweat evaporate." },
  });
  fireEvent.click(screen.getByRole("button", { name: "Go to question 10" }));
  fireEvent.click(screen.getByRole("button", { name: /Evaluate my answers/i }));
  await screen.findByRole("heading", { name: /Your everyday science report/i });
}

describe("Explain Science Around You", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.listAttempts.mockResolvedValue(null);
    mocks.saveAttempt.mockResolvedValue(false);
    mocks.invoke.mockResolvedValue({ data: makeEvaluation(), error: null });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("starts as its own open-ended assessment and renders per-answer feedback and learning links", async () => {
    renderPage();

    expect(screen.getByRole("heading", { name: /Explain the science around you/i })).toBeInTheDocument();
    expect(screen.getByText(/Your Everyday Science Understanding Score summarises/i)).toBeInTheDocument();

    await completeAssessment();

    expect(mocks.invoke).toHaveBeenCalledWith("everyday-science-evaluate", {
      body: expect.objectContaining({
        difficulty: "beginner",
        answers: expect.arrayContaining([
          expect.objectContaining({ questionId: expect.any(String), answer: expect.stringContaining("Moving air") }),
        ]),
      }),
    });
    expect(screen.getByText("80")).toBeInTheDocument();
    expect(screen.getByText("Good foundation")).toBeInTheDocument();
    expect(screen.getByText(/Strongest area in this attempt/i)).toBeInTheDocument();
    expect(screen.getAllByText("AI feedback").length).toBeGreaterThan(0);
    expect(screen.getAllByText("The science, explained").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Related scientist / inventor").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Related reading").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Watch and explore").length).toBeGreaterThan(0);
    expect(screen.getByText(/could not be saved to your profile/i)).toBeInTheDocument();

    const answerSections = screen.getAllByRole("button").filter((button) => button.hasAttribute("aria-expanded"));
    expect(answerSections.length).toBe(10);
    fireEvent.click(answerSections[0]);
    expect(answerSections[0]).toHaveAttribute("aria-expanded", "false");
    fireEvent.click(answerSections[1]);
    expect(answerSections[1]).toHaveAttribute("aria-expanded", "true");

    fireEvent.click(screen.getByRole("button", { name: /Try again/i }));
    expect(screen.getByText(/Question 1 of 10/i)).toBeInTheDocument();
  });

  it("sends the selected advanced level and shows its deeper prompt", async () => {
    const advancedEvaluation = makeEvaluation();
    advancedEvaluation.difficulty = "advanced";
    mocks.invoke.mockResolvedValue({ data: advancedEvaluation, error: null });
    renderPage();
    fireEvent.click(screen.getByRole("button", { name: /Advanced.*Deeper mechanisms/i }));
    fireEvent.click(screen.getByRole("button", { name: /Start the science test/i }));
    expect(screen.getByText(/Analyze the underlying mechanism in depth/i)).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("Your explanation"), {
      target: { value: "The bus slows due to braking forces while the passenger's body tends to maintain its velocity because of inertia." },
    });
    fireEvent.click(screen.getByRole("button", { name: "Go to question 10" }));
    fireEvent.click(screen.getByRole("button", { name: /Evaluate my answers/i }));
    await screen.findByRole("heading", { name: /Your everyday science report/i });
    expect(mocks.invoke).toHaveBeenCalledWith("everyday-science-evaluate", {
      body: expect.objectContaining({ difficulty: "advanced" }),
    });
  });

  it("shows a previous attempt and confirms successful profile history saving", async () => {
    mocks.listAttempts
      .mockResolvedValueOnce([{
        id: "attempt-1",
        overall_score: 68,
        question_count: 10,
        category_scores: { Physics: 68 },
        created_at: "2026-11-16T10:00:00.000Z",
        difficulty: "beginner",
      }])
      .mockResolvedValue([]);
    mocks.saveAttempt.mockResolvedValue(true);

    renderPage();
    expect(await screen.findByText("Your last science assessment")).toBeInTheDocument();
    expect(screen.getByText("68%")).toBeInTheDocument();

    await completeAssessment();
    expect(screen.getByText(/saved to your Sahadhyayi profile/i)).toBeInTheDocument();
    expect(mocks.saveAttempt).toHaveBeenCalledTimes(1);
  });

  it("shows a retry message if Gemini fails, then accepts a valid retry", async () => {
    mocks.invoke
      .mockRejectedValueOnce(new Error("Gemini is temporarily unavailable"))
      .mockResolvedValueOnce({ data: makeEvaluation(92), error: null });

    renderPage();
    fireEvent.click(screen.getByRole("button", { name: /Start the science test/i }));
    fireEvent.change(screen.getByLabelText("Your explanation"), {
      target: { value: "The body keeps moving due to inertia when the bus slows down." },
    });
    fireEvent.click(screen.getByRole("button", { name: "Go to question 10" }));
    fireEvent.click(screen.getByRole("button", { name: /Evaluate my answers/i }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Gemini is temporarily unavailable");
    fireEvent.click(screen.getByRole("button", { name: "Try again" }));
    expect(await screen.findByText("Strong understanding")).toBeInTheDocument();
    expect(mocks.invoke).toHaveBeenCalledTimes(2);
  });

  it.each([
    [95, "Strong understanding"],
    [80, "Good foundation"],
    [60, "Developing understanding"],
    [40, "Early understanding"],
    [20, "A place to begin"],
  ])("labels a %s-point result as %s", async (score, label) => {
    mocks.invoke.mockResolvedValue({ data: makeEvaluation(score), error: null });
    renderPage();
    await completeAssessment();
    expect(screen.getByText(label)).toBeInTheDocument();
  });

  it("prevents evaluation when every question is skipped", () => {
    renderPage();
    fireEvent.click(screen.getByRole("button", { name: /Start the science test/i }));
    fireEvent.click(screen.getByRole("button", { name: "Go to question 10" }));
    expect(screen.getByRole("button", { name: /Evaluate my answers/i })).toBeDisabled();
  });

  it("handles malformed evaluator output without rendering a partial report", async () => {
    mocks.invoke.mockResolvedValue({
      data: { overallScore: 100, categoryScores: {}, results: [] },
      error: null,
    });

    renderPage();
    fireEvent.click(screen.getByRole("button", { name: /Start the science test/i }));
    fireEvent.change(screen.getByLabelText("Your explanation"), { target: { value: "A thoughtful scientific answer." } });
    fireEvent.click(screen.getByRole("button", { name: "Go to question 10" }));
    fireEvent.click(screen.getByRole("button", { name: /Evaluate my answers/i }));

    expect(await screen.findByRole("alert")).toHaveTextContent("incomplete result");
    await waitFor(() => expect(screen.queryByRole("heading", { name: /Your everyday science report/i })).not.toBeInTheDocument());
  });
});
