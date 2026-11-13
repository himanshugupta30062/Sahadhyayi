import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReaderDiscoveryList } from "./ReaderDiscoveryList";
import { type ReadingDna } from "@/lib/readingDna";

const mockSendFriendRequest = vi.fn().mockResolvedValue({ id: "req-1" });

vi.mock("@/contexts/authHelpers", () => ({
  useAuth: () => ({ user: { id: "my-user-id" } }),
}));

vi.mock("@/hooks/use-toast", () => ({
  useToast: () => ({ toast: vi.fn() }),
}));

vi.mock("@/hooks/useFriends", () => ({
  useSendFriendRequest: () => ({
    mutateAsync: mockSendFriendRequest,
    isPending: false,
  }),
  useFriendRequests: () => ({
    data: [],
  }),
}));

const mockDiscoverableReaders = [
  {
    user_id: "reader-a",
    username: "booklover",
    full_name: "Aria Montgomery",
    profile_photo_url: "https://example.com/aria.jpg",
    bio: "Passionate about high fantasy and sci-fi epics",
    genres: [{ name: "Fantasy", weight: 0.9 }, { name: "Sci-Fi", weight: 0.7 }],
    moods: ["thoughtful", "adventurous"],
    pace: "steady",
    themes: ["magic", "rebellion"],
    summary: "An imaginative fantasy reader",
    signature_color: "#6366f1",
    generated_at: "2026-02-01T12:00:00Z",
    friend_request_status: "none",
  },
  {
    user_id: "reader-b",
    username: "mysteryfan",
    full_name: "Benjamin Linus",
    profile_photo_url: null,
    bio: "Noir and detective fiction enthusiast",
    genres: [{ name: "Mystery", weight: 0.9 }, { name: "Thriller", weight: 0.8 }],
    moods: ["dark", "mysterious"],
    pace: "fast",
    themes: ["secrets"],
    summary: "Sharp-witted detective fiction fan",
    signature_color: "#10b981",
    generated_at: "2026-02-01T12:00:00Z",
    friend_request_status: "none",
  },
];

vi.mock("@/hooks/useReadingDna", () => ({
  useDiscoverableReaders: vi.fn(() => ({
    data: mockDiscoverableReaders,
    isLoading: false,
    isError: false,
  })),
  useUserShelfForCompare: () => ({ data: [] }),
}));

const myDna: ReadingDna = {
  user_id: "my-user-id",
  genres: [{ name: "Fantasy", weight: 0.85 }, { name: "Sci-Fi", weight: 0.6 }],
  moods: ["thoughtful"],
  pace: "steady",
  themes: ["magic"],
  summary: "Exploring worldbuilding and mythologies",
  signature_color: "#f59e0b",
  generated_at: "2026-01-01T12:00:00Z",
  visibility: "public",
};

describe("ReaderDiscoveryList", () => {
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
        <ReaderDiscoveryList myDna={myDna} />
      </QueryClientProvider>
    );

  it("renders discoverable readers with compatibility match, badges, and narrative", () => {
    renderComponent();

    expect(screen.getByText("Discover Compatible Readers")).toBeInTheDocument();
    expect(screen.getByText("Aria Montgomery")).toBeInTheDocument();
    expect(screen.getByText("Benjamin Linus")).toBeInTheDocument();

    // Compatibility scores should be visible
    expect(screen.getAllByText(/% match/i).length).toBeGreaterThan(0);

    // Confidence indicator
    expect(screen.getAllByText(/data/i).length).toBeGreaterThan(0);

    // Connect button should be available
    const connectButtons = screen.getAllByRole("button", { name: /Connect/i });
    expect(connectButtons.length).toBe(2);
  });

  it("allows sending a friend request to a discovered reader", async () => {
    renderComponent();

    const connectButtons = screen.getAllByRole("button", { name: /Connect/i });
    fireEvent.click(connectButtons[0]);

    await waitFor(() => {
      expect(mockSendFriendRequest).toHaveBeenCalledWith({
        addresseeId: "reader-a",
      });
    });
  });

  it("filters readers when searching by name", () => {
    renderComponent();

    const searchInput = screen.getByLabelText("Search discoverable readers");
    fireEvent.change(searchInput, { target: { value: "Aria" } });

    expect(screen.getByText("Aria Montgomery")).toBeInTheDocument();
    expect(screen.queryByText("Benjamin Linus")).not.toBeInTheDocument();
  });

  it("filters readers by reading pace", () => {
    renderComponent();

    const fastPaceBtn = screen.getByRole("button", { name: /^fast$/i });
    fireEvent.click(fastPaceBtn);

    expect(screen.getByText("Benjamin Linus")).toBeInTheDocument();
    expect(screen.queryByText("Aria Montgomery")).not.toBeInTheDocument();
  });

  it("opens DNA comparison modal when clicking Compare", () => {
    renderComponent();

    const compareButtons = screen.getAllByRole("button", { name: /Compare/i });
    fireEvent.click(compareButtons[0]);

    expect(screen.getByRole("heading", { name: /Reading DNA Comparison/i })).toBeInTheDocument();
  });
});
