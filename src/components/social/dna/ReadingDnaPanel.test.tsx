import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReadingDnaPanel } from "./ReadingDnaPanel";

vi.mock("@/contexts/authHelpers", () => ({
  useAuth: () => ({ user: { id: "test-user-id" } }),
}));

vi.mock("@/hooks/use-toast", () => ({
  useToast: () => ({ toast: vi.fn() }),
}));

vi.mock("@/hooks/useReadingDna", () => ({
  useReadingDna: vi.fn(),
  useGenerateReadingDna: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useUpdateReadingDnaVisibility: () => ({ mutate: vi.fn(), isPending: false }),
  useUserShelfForCompare: () => ({ data: [] }),
}));

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    from: vi.fn((table: string) => {
      if (table === "friends") {
        return {
          select: vi.fn().mockReturnThis(),
          or: vi.fn().mockResolvedValue({
            data: [{ user1_id: "test-user-id", user2_id: "friend-1" }],
          }),
        };
      }
      if (table === "reading_dna") {
        return {
          select: vi.fn().mockReturnThis(),
          in: vi.fn().mockResolvedValue({
            data: [
              {
                user_id: "friend-1",
                genres: [{ name: "Sci-Fi", weight: 0.8 }],
                moods: ["thoughtful"],
                themes: ["space"],
                pace: "steady",
                generated_at: new Date().toISOString(),
              },
            ],
          }),
        };
      }
      if (table === "profiles") {
        return {
          select: vi.fn().mockReturnThis(),
          in: vi.fn().mockResolvedValue({
            data: [
              {
                id: "friend-1",
                full_name: "Elena Rostova",
                profile_photo_url: null,
              },
            ],
          }),
        };
      }
      return {
        select: vi.fn().mockReturnThis(),
        in: vi.fn().mockResolvedValue({ data: [] }),
      };
    }),
  },
}));

import { useReadingDna } from "@/hooks/useReadingDna";

describe("ReadingDnaPanel", () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
      },
    });
    vi.clearAllMocks();
  });

  const renderComponent = () =>
    render(
      <QueryClientProvider client={queryClient}>
        <ReadingDnaPanel />
      </QueryClientProvider>
    );

  it("renders empty state when no DNA is available", () => {
    vi.mocked(useReadingDna).mockReturnValue({
      data: null,
      isLoading: false,
      error: null,
    } as any);

    renderComponent();

    expect(screen.getByText("No Reading DNA yet")).toBeInTheDocument();
    expect(screen.getByText("Analyze My Shelf & Generate DNA")).toBeInTheDocument();
  });

  it("renders reading DNA and friend matches with transparency notice", async () => {
    vi.mocked(useReadingDna).mockReturnValue({
      data: {
        user_id: "test-user-id",
        genres: [{ name: "Sci-Fi", weight: 0.9 }],
        moods: ["thoughtful"],
        themes: ["space"],
        pace: "steady",
        summary: "A passionate sci-fi explorer",
        signature_color: "#4f46e5",
        generated_at: new Date().toISOString(),
        visibility: "public",
      },
      isLoading: false,
      error: null,
    } as any);

    renderComponent();

    expect(screen.getByText("Reading DNA")).toBeInTheDocument();
    expect(screen.getByText(/DNA visibility: Public/i)).toBeInTheDocument();

    const notice = await screen.findByText(/Compatibility is estimated from shared reading interests, genres, and reading pace/i);
    expect(notice).toBeInTheDocument();

    const friendName = await screen.findByText("Elena Rostova");
    expect(friendName).toBeInTheDocument();
  });
});

