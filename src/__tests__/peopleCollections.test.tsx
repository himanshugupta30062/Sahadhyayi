import { afterEach, describe, expect, it } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { vi } from "vitest";
import { peopleCollections } from "@/data/peopleCollections";
import { PeopleCollectionPage } from "@/components/people/PeopleCollectionPage";

vi.mock("@/integrations/supabase/client-universal", () => ({
  supabase: {
    from: () => ({
      select: () => ({
        eq: () => ({
          single: async () => ({ data: null, error: new Error("not found") }),
          eq: () => ({
            order: async () => ({ data: null, error: new Error("not found") }),
          }),
        }),
      }),
    }),
  },
}));

const renderWithQueryClient = (ui: React.ReactElement) => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(<QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>);
};

describe("public people collections", () => {
  afterEach(() => {
    cleanup();
  });
  it("provides both requested collections with source-linked profiles", () => {
    expect(Object.keys(peopleCollections).sort()).toEqual([
      "freedom-fighters",
      "social-activists",
    ]);

    for (const collection of Object.values(peopleCollections)) {
      expect(collection.people.length).toBeGreaterThanOrEqual(3);
      for (const person of collection.people) {
        expect(person.name.trim()).not.toBe("");
        expect(person.summary.trim()).not.toBe("");
        expect(person.story.length).toBeGreaterThanOrEqual(2);
        expect(person.milestones.length).toBeGreaterThan(0);
        expect(person.sources.length).toBeGreaterThan(0);
        for (const source of person.sources) {
          expect(() => new URL(source.url)).not.toThrow();
          expect(source.url).toMatch(/^https?:\/\//);
        }
      }
    }
  });

  it("renders a searchable Social Activists directory and expands a profile", async () => {
    renderWithQueryClient(
      <MemoryRouter initialEntries={["/social-activists"]}>
        <PeopleCollectionPage collectionKey="social-activists" />
      </MemoryRouter>
    );

    expect(screen.getByRole("heading", { name: "Social Activists" })).toBeInTheDocument();
    expect(await screen.findByText("Kailash Satyarthi")).toBeInTheDocument();

    fireEvent.click(screen.getByText("Kailash Satyarthi"));
    expect(await screen.findByText("Nobel Peace Prize")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /biographical/i })).toHaveAttribute(
      "href",
      "https://www.nobelprize.org/prizes/peace/2014/satyarthi/biographical/"
    );

    fireEvent.change(screen.getByRole("textbox", { name: /search social activists/i }), {
      target: { value: "Aruna" },
    });
    expect(screen.getAllByText("Aruna Roy")[0]).toBeInTheDocument();
    expect(screen.queryByText("Kailash Satyarthi")).not.toBeInTheDocument();
  });

  it("renders the Freedom Fighters collection", async () => {
    renderWithQueryClient(
      <MemoryRouter initialEntries={["/freedom-fighters"]}>
        <PeopleCollectionPage collectionKey="freedom-fighters" />
      </MemoryRouter>
    );

    expect(screen.getByRole("heading", { name: "Freedom Fighters" })).toBeInTheDocument();
    expect(await screen.findByText("Bhagat Singh")).toBeInTheDocument();
    expect(screen.getByText("Subhas Chandra Bose")).toBeInTheDocument();
  });
});
