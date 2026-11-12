// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
afterEach(() => cleanup());
import LoadingSpinner from "./LoadingSpinner";

describe("LoadingSpinner", () => {
  it("renders the default compact loader", () => {
    const { container } = render(<LoadingSpinner />);
    expect(container.querySelector(".flex.items-center.justify-center.py-8")).toBeInTheDocument();
  });

  it("renders the page loader with library loading text", () => {
    render(<LoadingSpinner type="page" />);
    expect(screen.getByText("Loading your library...")).toBeInTheDocument();
  });

  it("renders posts skeletons", () => {
    const { container } = render(<LoadingSpinner type="posts" />);
    expect(container.querySelectorAll(".bg-card.rounded-lg.border.p-4")).toHaveLength(3);
  });

  it("renders eight book skeleton cards", () => {
    const { container } = render(<LoadingSpinner type="books" />);
    expect(container.querySelectorAll(".bg-card.rounded-lg.shadow-sm.p-4")).toHaveLength(8);
  });

  it("falls back to the default loader for an unknown type", () => {
    const { container } = render(<LoadingSpinner type={"unknown" as "default"} />);
    expect(container.querySelector(".flex.items-center.justify-center.py-8")).toBeInTheDocument();
  });
});
