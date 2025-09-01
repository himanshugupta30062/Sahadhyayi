import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { createClient, Session, User } from "@supabase/supabase-js";
import { setCsrfToken } from "../security/useSecureApi";
import { sessionClientLogin } from "../security/sessionClient";
import { secureFetch } from "../security/secureFetch";

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL!,
  import.meta.env.VITE_SUPABASE_ANON_KEY!
);

type AuthContextType = {
  user: User | null;
  session: Session | null;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType>(null!);
export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);

  useEffect(() => {
    const { data: subscription } = supabase.auth.onAuthStateChange(async (event, sess) => {
      if (event === "SIGNED_IN" && sess?.user) {
        setUser(sess.user);
        setSession(sess);
        try {
          await sessionClientLogin(); // sync server cookie + csrf
        } catch (e) {
          console.warn("server session init failed", e);
        }
      } else if (event === "SIGNED_OUT") {
        setUser(null);
        setSession(null);
        setCsrfToken(null);
        try {
          await secureFetch("/api/session", { method: "DELETE" });
        } catch (e) {
          console.warn("/api/session DELETE failed", e);
        }
      }
    });

    return () => subscription.subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    if (data.session) {
      setUser(data.session.user);
      setSession(data.session);
      try {
        await sessionClientLogin(); // ensure server session is in lockstep
      } catch (e) {
        console.warn("server session init failed", e);
      }
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setCsrfToken(null);
    try {
      await secureFetch("/api/session", { method: "DELETE" });
    } catch (e) {
      console.warn("/api/session DELETE failed", e);
    }
  };

  return (
    <AuthContext.Provider value={{ user, session, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}
