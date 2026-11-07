import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { Session, User } from "@supabase/supabase-js";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client-universal";

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

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const queryClient = useQueryClient();

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, sess) => {
        setSession(sess);
        setUser(sess?.user ?? null);
        setLoading(false);
        if (event === "SIGNED_OUT") {
          try {
            queryClient.clear();
          } catch {
            // Ignore cache reset issues if query client is unmounted
          }
        }
      }
    );

    // Do not race getSession() against this listener; INITIAL_SESSION owns startup.
    return () => subscription.unsubscribe();
  }, [queryClient]);

  const signIn = async (email: string, password: string, captchaToken?: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
      ...(captchaToken ? { options: { captchaToken } } : {}),
    });
    if (error) throw error;
    if (data.session) {
      setUser(data.session.user);
      setSession(data.session);
    }
  };

  const signOut = async () => {
    try {
      // Revoke all sessions when the Auth user still exists.
      const { error } = await supabase.auth.signOut({ scope: "global" });

      if (error) {
        // A deleted account cannot have its global sessions revoked. Still
        // remove this browser's stale session so the user can sign in again.
        const { error: localError } = await supabase.auth.signOut({ scope: "local" });
        if (localError) {
          console.warn("Local signOut warning:", localError);
        }
      }
    } catch (err) {
      console.warn("SignOut network error:", err);
    } finally {
      // Never leave the UI in an authenticated state after a logout attempt.
      setUser(null);
      setSession(null);
      try {
        queryClient.clear();
      } catch {
        // Ignore cache clear error
      }
      try {
        localStorage.removeItem("sessionStart");
        localStorage.removeItem("lastActivity");
        localStorage.removeItem("browserSession");
      } catch {
        // Ignore storage cleanup issues
      }
    }
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}
