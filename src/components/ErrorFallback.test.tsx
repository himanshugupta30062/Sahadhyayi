// @vitest-environment jsdom
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ErrorFallback } from "./ErrorFallback";

describe("ErrorFallback", () => {
  it("renders default title and description", () => {
    render(<ErrorFallback />);
    expect(screen.getByText("Something went wrong")).toBeInTheDocument();
    expect(screen.getByText("An unexpected error occurred. Please try again.")).toBeInTheDocument();
  });

  it("renders supplied title and description", () => {
    render(<ErrorFallback title="Unable to load" description="Please check your connection." />);
    expect(screen.getByText("Unable to load")).toBeInTheDocument();
    expect(screen.getByText("Please check your connection.")).toBeInTheDocument();
  });

  it("shows retry action and calls resetError when clicked", () => {
    const resetError = vi.fn();
    render(<ErrorFallback resetError={resetError} />);
    fireEvent.click(screen.getByRole("button", { name: "Try Again" }));
    expect(resetError).toHaveBeenCalledTimes(1);
  });

  it("does not show retry when disabled or no reset callback is provided", () => {
    const { rerender } = render(<ErrorFallback resetError={vi.fn()} showRetry={false} />);
    expect(screen.queryByRole("button", { name: "Try Again" })).not.toBeInTheDocument();
    rerender(<ErrorFallback />);
    expect(screen.queryByRole("button", { name: "Try Again" })).not.toBeInTheDocument();
  });
});
