import { useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useNavigate } from "react-router-dom";

export default function SignIn() {
  const { signIn } = useAuth();
  const nav = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);
    setLoading(true);
    try {
      await signIn(email, password); // Supabase + server session init
      nav("/app");
    } catch (e: any) {
      setErr(e.message || "Sign-in failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={onSubmit} className="space-y-3">
      <input value={email} onChange={e=>setEmail(e.target.value)} placeholder="Email" />
      <input type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="Password" />
      {err && <p className="text-red-600">{err}</p>}
      <button disabled={loading}>{loading ? "Signing in..." : "Sign in"}</button>
    </form>
  );
}
