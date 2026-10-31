import { describe, expect, it } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { MemoryRouter } from "react-router-dom";
import { peopleCollections } from "@/data/peopleCollections";
import { PeopleCollectionPage } from "@/components/people/PeopleCollectionPage";

describe("public people collections", () => {
  it("provides all three requested collections with source-linked profiles", () => {
    expect(Object.keys(peopleCollections).sort()).toEqual([
      "freedom-fighters",
      "life-stories",
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

  it("renders a searchable Life Stories directory and expands a profile", () => {
    render(
      <MemoryRouter initialEntries={["/life-stories"]}>
        <PeopleCollectionPage collectionKey="life-stories" />
      </MemoryRouter>
    );

    expect(screen.getByRole("heading", { name: "Life Stories" })).toBeInTheDocument();
    expect(screen.getByText("Arunima Sinha")).toBeInTheDocument();

    fireEvent.click(screen.getByText("Arunima Sinha"));
    expect(screen.getByText("Everest summit")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Press Information Bureau/i })).toHaveAttribute(
      "href",
      "https://www.pib.gov.in/newsite/erelcontent.aspx?lang=2&reg=48&relid=170314"
    );

    fireEvent.change(screen.getByRole("textbox", { name: /search life stories/i }), {
      target: { value: "Verghese" },
    });
    expect(screen.getByText("Verghese Kurien")).toBeInTheDocument();
    expect(screen.queryByText("Arunima Sinha")).not.toBeInTheDocument();
  });

  it("renders the activists and freedom fighter collections with distinct titles", () => {
    const { unmount } = render(
      <MemoryRouter initialEntries={["/social-activists"]}>
        <PeopleCollectionPage collectionKey="social-activists" />
      </MemoryRouter>
    );
    expect(screen.getByRole("heading", { name: "Social Activists" })).toBeInTheDocument();
    expect(screen.getByText("Ela Bhatt")).toBeInTheDocument();
    unmount();

    render(
      <MemoryRouter initialEntries={["/freedom-fighters"]}>
        <PeopleCollectionPage collectionKey="freedom-fighters" />
      </MemoryRouter>
    );
    expect(screen.getByRole("heading", { name: "Freedom Fighters" })).toBeInTheDocument();
    expect(screen.getByText("Bhagat Singh")).toBeInTheDocument();
  });
});
