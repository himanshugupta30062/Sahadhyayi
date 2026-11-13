import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReadingDnaPanel } from "./ReadingDnaPanel";

const mockUpdateVisibility = vi.fn().mockResolvedValue("friends");

vi.mock("@/contexts/authHelpers", () => ({
  useAuth: () => ({ user: { id: "my-user-id" } }),
}));

vi.mock("@/hooks/use-toast", () => ({
  useToast: () => ({ toast: vi.fn() }),
}));

vi.mock("@/hooks/useFriends", () => ({
  useSendFriendRequest: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useFriendRequests: () => ({ data: [] }),
}));

vi.mock("@/hooks/useReadingDna", () => ({
  useReadingDna: vi.fn(),
  useGenerateReadingDna: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useUpdateReadingDnaVisibility: () => ({
    mutateAsync: mockUpdateVisibility,
    isPending: false,
  }),
  useUserShelfForCompare: () => ({ data: [] }),
  useDiscoverableReaders: () => ({
    data: [
      {
        user_id: "reader-discovered-1",
        username: "solaris",
        full_name: "Stanisław Lem",
        profile_photo_url: null,
        bio: "Philosophical sci-fi author & reader",
        genres: [{ name: "Sci-Fi", weight: 0.9 }],
        moods: ["thoughtful"],
        pace: "steady",
        themes: ["cosmos"],
        summary: "Cosmic explorer",
        signature_color: "#3b82f6",
        generated_at: new Date().toISOString(),
        friend_request_status: "none",
      },
    ],
    isLoading: false,
    isError: false,
  }),
}));

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    from: vi.fn((table: string) => {
      if (table === "friends") {
        return {
          select: vi.fn().mockReturnThis(),
          or: vi.fn().mockResolvedValue({
            data: [{ user1_id: "my-user-id", user2_id: "friend-1" }],
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
                visibility: "friends",
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
      defaultOptions: { queries: { retry: false } },
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

  it("renders 3-way privacy controls and allows changing visibility", async () => {
    vi.mocked(useReadingDna).mockReturnValue({
      data: {
        user_id: "my-user-id",
        genres: [{ name: "Sci-Fi", weight: 0.9 }],
        moods: ["thoughtful"],
        themes: ["space"],
        pace: "steady",
        summary: "Cosmic mind",
        signature_color: "#4f46e5",
        generated_at: new Date().toISOString(),
        visibility: "public",
      },
      isLoading: false,
      error: null,
    } as any);

    renderComponent();

    // Verify 3-way privacy buttons exist
    const publicBtn = screen.getByRole("button", { name: /^public$/i });
    const friendsBtn = screen.getByRole("button", { name: /^friends$/i });
    const privateBtn = screen.getByRole("button", { name: /^private$/i });

    expect(publicBtn).toBeInTheDocument();
    expect(friendsBtn).toBeInTheDocument();
    expect(privateBtn).toBeInTheDocument();

    // Click Friends Only
    fireEvent.click(friendsBtn);

    await waitFor(() => {
      expect(mockUpdateVisibility).toHaveBeenCalledWith("friends");
    });
  });

  it("allows switching between Discover Readers and Friend Matches tabs", async () => {
    vi.mocked(useReadingDna).mockReturnValue({
      data: {
        user_id: "my-user-id",
        genres: [{ name: "Sci-Fi", weight: 0.9 }],
        moods: ["thoughtful"],
        themes: ["space"],
        pace: "steady",
        summary: "Cosmic mind",
        signature_color: "#4f46e5",
        generated_at: new Date().toISOString(),
        visibility: "public",
      },
      isLoading: false,
      error: null,
    } as any);

    renderComponent();

    // Initially on Discover Readers tab
    expect(screen.getByText("Discover Compatible Readers")).toBeInTheDocument();
    expect(screen.getByText("Stanisław Lem")).toBeInTheDocument();

    // Click Friend Matches tab
    const friendsTab = screen.getByRole("button", { name: /friend matches/i });
    fireEvent.click(friendsTab);

    // Friend Matches should now be rendered with transparency notice
    const friendName = await screen.findByText("Elena Rostova");
    expect(friendName).toBeInTheDocument();

    const notice = screen.getByText(
      /Compatibility is estimated from shared reading interests, genres, and reading pace/i
    );
    expect(notice).toBeInTheDocument();
  });
});
