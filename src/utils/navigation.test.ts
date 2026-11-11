import { describe, expect, it, vi } from "vitest";
import type { NavigateFunction } from "react-router-dom";
import { redirectToUserHome } from "./navigation";

describe("redirectToUserHome", () => {
  it("navigates to dashboard and replaces the current history entry", () => {
    const navigate = vi.fn() as unknown as NavigateFunction;
    redirectToUserHome(navigate);
    expect(navigate).toHaveBeenCalledTimes(1);
    expect(navigate).toHaveBeenCalledWith("/dashboard", { replace: true });
  });
});
