// @vitest-environment jsdom

import React from "react";
import { act, cleanup, render, screen } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import DeferredSection from "./DeferredSection";

class MockIntersectionObserver {
  static instances: MockIntersectionObserver[] = [];
  private callback: IntersectionObserverCallback;
  private observedTarget: Element | null = null;

  constructor(callback: IntersectionObserverCallback) {
    this.callback = callback;
    MockIntersectionObserver.instances.push(this);
  }

  observe = vi.fn((target: Element) => {
    this.observedTarget = target;
  });
  disconnect = vi.fn();
  unobserve = vi.fn();

  triggerIntersection() {
    const entry = {
      isIntersecting: true,
      target: this.observedTarget ?? document.body,
    } as IntersectionObserverEntry;
    this.callback([entry], this as unknown as IntersectionObserver);
  }
}

describe("DeferredSection layout stability", () => {
  beforeEach(() => {
    MockIntersectionObserver.instances = [];
    vi.stubGlobal("IntersectionObserver", MockIntersectionObserver);
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  it("keeps its reserved minimum height after deferred content mounts", async () => {
    const { container } = render(
      <DeferredSection
        minHeightClassName="min-h-[320px]"
        fallback={<div>Reserved placeholder</div>}
      >
        <div>Loaded section content</div>
      </DeferredSection>,
    );

    const reservedContainer = container.firstElementChild as HTMLElement;
    expect(reservedContainer).toHaveClass("min-h-[320px]");
    expect(screen.getByText("Reserved placeholder")).toBeInTheDocument();

    const observer = MockIntersectionObserver.instances[0];
    expect(observer).toBeDefined();

    await act(async () => {
      observer.triggerIntersection();
    });

    expect(screen.getByText("Loaded section content")).toBeInTheDocument();
    expect(reservedContainer).toHaveClass("min-h-[320px]");
  });
});
