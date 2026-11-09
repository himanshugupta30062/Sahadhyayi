/** @vitest-environment jsdom */
import React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import HeroAtomicRings from "@/components/hero/HeroAtomicRings";

const orbitFeatures = ["Library", "Authors", "Social Media", "Articles", "Games"];

beforeEach(() => {
  Object.defineProperty(window, "matchMedia", {
    configurable: true,
    value: vi.fn().mockImplementation((media: string) => ({
      matches: true,
      media,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe("HeroAtomicRings", () => {
  it("shows every current Sahadhyayi destination as a labelled, accessible orbit", () => {
    render(
      <MemoryRouter>
        <HeroAtomicRings size={720} />
      </MemoryRouter>,
    );

    expect(
      screen.getByRole("group", {
        name: /Library, Authors, Social Media, Articles, and Games orbits/i,
      }),
    ).toBeInTheDocument();

    orbitFeatures.forEach((feature) => {
      expect(
        screen.getByRole("link", { name: `Explore ${feature}` }),
      ).toBeInTheDocument();
      expect(screen.getByText(feature)).toBeInTheDocument();
    });
  });
});
