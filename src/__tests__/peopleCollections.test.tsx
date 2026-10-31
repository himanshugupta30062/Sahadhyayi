import { describe, expect, it } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { MemoryRouter } from "react-router-dom";
import { peopleCollections } from "@/data/peopleCollections";
import { PeopleCollectionPage } from "@/components/people/PeopleCollectionPage";

describe("public people collections", () => {
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

  it("renders a searchable Social Activists directory and expands a profile", () => {
    render(
      <MemoryRouter initialEntries={["/social-activists"]}>
        <PeopleCollectionPage collectionKey="social-activists" />
      </MemoryRouter>
    );

    expect(screen.getByRole("heading", { name: "Social Activists" })).toBeInTheDocument();
    expect(screen.getByText("Kailash Satyarthi")).toBeInTheDocument();

    fireEvent.click(screen.getByText("Kailash Satyarthi"));
    expect(screen.getByText("Nobel Peace Prize")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /biographical/i })).toHaveAttribute(
      "href",
      "https://www.nobelprize.org/prizes/peace/2014/satyarthi/biographical/"
    );

    fireEvent.change(screen.getByRole("textbox", { name: /search social activists/i }), {
      target: { value: "Aruna" },
    });
    expect(screen.getByText("Aruna Roy")).toBeInTheDocument();
    expect(screen.queryByText("Kailash Satyarthi")).not.toBeInTheDocument();
  });

  it("renders the Freedom Fighters collection", () => {
    render(
      <MemoryRouter initialEntries={["/freedom-fighters"]}>
        <PeopleCollectionPage collectionKey="freedom-fighters" />
      </MemoryRouter>
    );
    expect(screen.getByRole("heading", { name: "Freedom Fighters" })).toBeInTheDocument();
    expect(screen.getByText("Bhagat Singh")).toBeInTheDocument();
    expect(screen.getByText("Subhas Chandra Bose")).toBeInTheDocument();
  });
});
