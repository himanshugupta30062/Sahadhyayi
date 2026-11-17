import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { Session, User } from "@supabase/supabase-js";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client-universal";
import { recordAuthAudit } from "@/lib/authAudit";

type AuthContextType = {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signIn: (email: string, password: string, captchaToken?: string) => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType>(null!);

/**
 * Core authenticated session state only. Import useAuth from authHelpers for
 * the application-level wrapper that adds sign-up, OAuth, and password-reset actions.
 */
// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => useContext(AuthContext);

/**
 * Supabase auth callbacks run while the auth client's internal lock may be held.
 * Never make another Supabase request from inside the callback: defer optional
 * telemetry until the callback has returned and the auth operation can release
 * its lock. Telemetry must never delay session restoration or sign-in.
 */
const deferAuthAudit = (
  event: Parameters<typeof recordAuthAudit>[0],
  method: Parameters<typeof recordAuthAudit>[1],
  details?: Parameters<typeof recordAuthAudit>[2],
) => {
  setTimeout(() => {
    void recordAuthAudit(event, method, details);
  }, 0);
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const queryClient = useQueryClient();

  useEffect(() => {
    let mounted = true;

    // Register the listener first. INITIAL_SESSION is the single source of
    // truth for restoring persisted sessions; do not race it with getSession().
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, nextSession) => {
        if (!mounted) return;

        setSession(nextSession);
        setUser(nextSession?.user ?? null);
        // A null INITIAL_SESSION is a valid signed-out state, not a loading error.
        setLoading(false);

        if (event === "SIGNED_IN" && nextSession?.user) {
          deferAuthAudit("sign_in_succeeded", "unknown", {
            userId: nextSession.user.id,
          });
        }

        if (event === "SIGNED_OUT") {
          // Cache clearing is local-only and safe inside this synchronous callback.
          queryClient.clear();
        }
      },
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [queryClient]);

  const signIn = async (email: string, password: string, captchaToken?: string) => {
    let auditHandled = false;
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
        ...(captchaToken ? { options: { captchaToken } } : {}),
      });

      if (error) {
        const code = typeof (error as { code?: unknown }).code === "string"
          ? (error as { code: string }).code
          : "auth_error";
        auditHandled = true;
        deferAuthAudit("sign_in_attempted", "password");
        deferAuthAudit("sign_in_failed", "password", { errorCode: code });
        throw error;
      }

      if (data.session) {
        setUser(data.session.user);
        setSession(data.session);
      }
      // Record the attempt only after the auth request has released its lock.
      deferAuthAudit("sign_in_attempted", "password");
    } catch (error) {
      // Network/transport exceptions do not necessarily arrive as AuthError.
      // Record them after the failed auth operation, without masking the error.
      if (!auditHandled) {
        deferAuthAudit("sign_in_attempted", "password");
        deferAuthAudit("sign_in_failed", "password", { errorCode: "network_or_transport_error" });
      }
      throw error;
    }
  };

  const signOut = async () => {
    // Prefer revoking all sessions. If that fails (e.g. a deleted account or
    // transient server issue), still attempt to clear this browser's session.
    let shouldSignOutLocally = false;
    try {
      const { error: globalError } = await supabase.auth.signOut({ scope: "global" });
      shouldSignOutLocally = Boolean(globalError);
    } catch {
      // A network exception while revoking all sessions must not prevent a
      // best-effort local sign-out from clearing this browser's credentials.
      shouldSignOutLocally = true;
    }

    if (shouldSignOutLocally) {
      const { error: localError } = await supabase.auth.signOut({ scope: "local" });
      if (localError) {
        // Keep the in-memory state consistent with the SDK's still-present
        // session instead of pretending the user has been signed out.
        throw localError;
      }
    }

    setUser(null);
    setSession(null);
    queryClient.clear();

    try {
      localStorage.removeItem("sessionStart");
      localStorage.removeItem("lastActivity");
      localStorage.removeItem("browserSession");
    } catch {
      // Storage cleanup is best-effort; sign-out itself has already succeeded.
    }
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}
