import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getUser: vi.fn(),
  from: vi.fn(),
  insert: vi.fn(),
  select: vi.fn(),
  eq: vi.fn(),
  order: vi.fn(),
  limit: vi.fn(),
}));

vi.mock("@/integrations/supabase/client-universal", () => ({
  supabase: {
    auth: { getUser: mocks.getUser },
    from: mocks.from,
  },
}));

import { listEverydayScienceAttempts, saveEverydayScienceAttempt } from "./attempts";

const evaluation = {
  difficulty: "beginner" as const,
  questionSetVersion: "everyday-science-v2-beginner-difficulty-calibration-v1",
  overallScore: 75,
  categoryScores: { Physics: 75 },
  results: [],
};

describe("everyday science attempt persistence", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getUser.mockResolvedValue({ data: { user: null }, error: null });
    const chain = {
      insert: mocks.insert,
      select: mocks.select,
      eq: mocks.eq,
      order: mocks.order,
      limit: mocks.limit,
    };
    mocks.from.mockReturnValue(chain);
    mocks.insert.mockResolvedValue({ error: null });
    mocks.select.mockReturnValue(chain);
    mocks.eq.mockReturnValue(chain);
    mocks.order.mockReturnValue(chain);
    mocks.limit.mockResolvedValue({ data: [], error: null });
  });

  it("does not write a cloud attempt for a guest user", async () => {
    await expect(saveEverydayScienceAttempt([], evaluation as never)).resolves.toBe(false);
    expect(mocks.from).not.toHaveBeenCalled();
  });

  it("returns no history for a guest user", async () => {
    await expect(listEverydayScienceAttempts()).resolves.toBeNull();
  });

  it("persists a signed-in user's evaluation with ownership taken from the session", async () => {
    mocks.getUser.mockResolvedValue({ data: { user: { id: "user-123" } }, error: null });
    await expect(saveEverydayScienceAttempt(
      [{ questionId: "fan-cooling", answer: "Airflow helps sweat evaporate." }],
      evaluation as never,
    )).resolves.toBe(true);

    expect(mocks.from).toHaveBeenCalledWith("everyday_science_attempts");
    expect(mocks.insert).toHaveBeenCalledWith(expect.objectContaining({
      user_id: "user-123",
      overall_score: 75,
      question_count: 1,
      question_set_version: "everyday-science-v2-beginner-difficulty-calibration-v1",
      difficulty: "beginner",
    }));
  });

  it("propagates a persistence failure instead of pretending the result was saved", async () => {
    mocks.getUser.mockResolvedValue({ data: { user: { id: "user-123" } }, error: null });
    mocks.insert.mockResolvedValue({ error: new Error("database unavailable") });
    await expect(saveEverydayScienceAttempt([], evaluation as never)).rejects.toThrow("database unavailable");
  });

  it("returns recent history and clamps requested limits", async () => {
    mocks.getUser.mockResolvedValue({ data: { user: { id: "user-123" } }, error: null });
    mocks.limit.mockResolvedValue({
      data: [{
        id: "attempt-1",
        overall_score: 75,
        question_count: 10,
        category_scores: { Physics: 75 },
        created_at: "2026-11-17T00:00:00.000Z",
        difficulty: "beginner",
      }],
      error: null,
    });
    const result = await listEverydayScienceAttempts(100);
    expect(mocks.from).toHaveBeenCalledWith("everyday_science_attempts");
    expect(mocks.select).toHaveBeenCalledWith("id,overall_score,question_count,category_scores,created_at,difficulty");
    expect(mocks.eq).toHaveBeenCalledWith("user_id", "user-123");
    expect(mocks.order).toHaveBeenCalledWith("created_at", { ascending: false });
    expect(mocks.limit).toHaveBeenCalledWith(20);
    expect(result?.[0].category_scores).toEqual({ Physics: 75 });
  });

  it("propagates authentication and history-query errors", async () => {
    mocks.getUser.mockResolvedValue({ data: { user: null }, error: new Error("auth unavailable") });
    await expect(listEverydayScienceAttempts()).rejects.toThrow("auth unavailable");

    mocks.getUser.mockResolvedValue({ data: { user: { id: "user-123" } }, error: null });
    mocks.limit.mockResolvedValue({ data: null, error: new Error("query unavailable") });
    await expect(listEverydayScienceAttempts()).rejects.toThrow("query unavailable");
  });
});
