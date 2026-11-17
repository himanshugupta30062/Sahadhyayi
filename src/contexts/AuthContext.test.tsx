/** @vitest-environment jsdom */
import React from "react";
import { act, fireEvent, render, screen, waitFor, cleanup } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import "@testing-library/jest-dom/vitest";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";

const mocks = vi.hoisted(() => ({
  authCallback: null as null | ((event: string, session: any) => void),
  onAuthStateChange: vi.fn(),
  signInWithPassword: vi.fn(),
  signOut: vi.fn(),
  clear: vi.fn(),
  recordAuthAudit: vi.fn(),
}));

vi.mock("@/integrations/supabase/client-universal", () => ({
  supabase: {
    auth: {
      onAuthStateChange: (callback: (event: string, session: any) => void) => {
        mocks.authCallback = callback;
        return {
          data: { subscription: { unsubscribe: vi.fn() } },
        };
      },
      signInWithPassword: (...args: any[]) => mocks.signInWithPassword(...args),
      signOut: (...args: any[]) => mocks.signOut(...args),
    },
  },
}));

vi.mock("@/lib/authAudit", () => ({
  recordAuthAudit: (...args: any[]) => mocks.recordAuthAudit(...args),
}));

vi.mock("@tanstack/react-query", () => ({
  useQueryClient: () => ({ clear: mocks.clear }),
}));

const session = {
  access_token: "test-access-token",
  refresh_token: "test-refresh-token",
  user: { id: "reader-1", email: "reader@example.com" },
} as any;

const Probe = () => {
  const { user, session: currentSession, loading, signIn, signOut } = useAuth();
  return (
    <div>
      <span data-testid="auth-state">{loading ? "loading" : user ? "signed-in" : "signed-out"}</span>
      <span data-testid="user-id">{user?.id ?? "none"}</span>
      <span data-testid="session">{currentSession ? "present" : "none"}</span>
      <button onClick={() => void signIn("reader@example.com", "password")}>Sign in</button>
      <button onClick={() => void signOut().catch(() => undefined)}>Sign out</button>
    </div>
  );
};

const renderProvider = () => render(
  <AuthProvider>
    <Probe />
  </AuthProvider>,
);

beforeEach(() => {
  mocks.authCallback = null;
  mocks.signInWithPassword.mockReset();
  mocks.signOut.mockReset();
  mocks.clear.mockReset();
  mocks.recordAuthAudit.mockReset();
});

afterEach(() => {
  cleanup();
  vi.clearAllTimers();
});

describe("AuthProvider session lifecycle", () => {
  it("restores a persisted session from INITIAL_SESSION", async () => {
    renderProvider();

    expect(screen.getByTestId("auth-state")).toHaveTextContent("loading");
    act(() => mocks.authCallback?.("INITIAL_SESSION", session));

    expect(screen.getByTestId("auth-state")).toHaveTextContent("signed-in");
    expect(screen.getByTestId("user-id")).toHaveTextContent("reader-1");
    expect(screen.getByTestId("session")).toHaveTextContent("present");
  });

  it("settles into signed-out state when INITIAL_SESSION has no session", () => {
    renderProvider();

    act(() => mocks.authCallback?.("INITIAL_SESSION", null));

    expect(screen.getByTestId("auth-state")).toHaveTextContent("signed-out");
    expect(screen.getByTestId("user-id")).toHaveTextContent("none");
  });

  it("defers sign-in audit telemetry until after the auth callback returns", async () => {
    renderProvider();

    act(() => mocks.authCallback?.("SIGNED_IN", session));

    expect(screen.getByTestId("auth-state")).toHaveTextContent("signed-in");
    expect(mocks.recordAuthAudit).not.toHaveBeenCalled();

    await waitFor(() => {
      expect(mocks.recordAuthAudit).toHaveBeenCalledWith(
        "sign_in_succeeded",
        "unknown",
        { userId: "reader-1" },
      );
    });
  });

  it("records a password sign-in attempt only after the auth request resolves", async () => {
    let resolveSignIn!: (value: any) => void;
    mocks.signInWithPassword.mockReturnValueOnce(new Promise((resolve) => {
      resolveSignIn = resolve;
    }));

    renderProvider();
    fireEvent.click(screen.getByRole("button", { name: "Sign in" }));

    expect(mocks.recordAuthAudit).not.toHaveBeenCalled();

    await act(async () => {
      resolveSignIn({ data: { session }, error: null });
    });

    await waitFor(() => {
      expect(mocks.recordAuthAudit).toHaveBeenCalledWith("sign_in_attempted", "password", undefined);
    });
    expect(screen.getByTestId("auth-state")).toHaveTextContent("signed-in");
  });

  it("falls back to local sign-out if global session revocation throws", async () => {
    mocks.signOut
      .mockRejectedValueOnce(new Error("network unavailable"))
      .mockResolvedValueOnce({ error: null });

    renderProvider();
    act(() => mocks.authCallback?.("INITIAL_SESSION", session));

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Sign out" }));
    });

    expect(mocks.signOut).toHaveBeenNthCalledWith(1, { scope: "global" });
    expect(mocks.signOut).toHaveBeenNthCalledWith(2, { scope: "local" });
    expect(screen.getByTestId("auth-state")).toHaveTextContent("signed-out");
    expect(mocks.clear).toHaveBeenCalled();
  });

  it("does not clear the authenticated UI when both sign-out attempts fail", async () => {
    mocks.signOut
      .mockResolvedValueOnce({ error: { message: "global failed" } })
      .mockResolvedValueOnce({ error: { message: "local failed" } });

    const onUnhandledError = vi.spyOn(console, "error").mockImplementation(() => undefined);
    renderProvider();
    act(() => mocks.authCallback?.("INITIAL_SESSION", session));

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Sign out" }));
    });

    expect(screen.getByTestId("auth-state")).toHaveTextContent("signed-in");
    onUnhandledError.mockRestore();
  });
});
