import { useCallback, useEffect, useState } from 'react';
import { RefreshCw, ShieldCheck } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client-universal';

type AuditRow = {
  id: string;
  event_type: string;
  auth_method: string;
  user_id: string | null;
  error_code: string | null;
  created_at: string;
};

const labels: Record<string, string> = {
  sign_in_attempted: 'Sign-in attempted',
  sign_in_succeeded: 'Sign-in successful',
  sign_in_failed: 'Sign-in failed',
  signup_submitted: 'Registration submitted',
  account_created: 'Account created',
};

export default function AuthActivityPanel() {
  const [rows, setRows] = useState<AuditRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const { data, error: rpcError } = await supabase.rpc('get_admin_auth_activity', { p_limit: 100 });
    if (rpcError) {
      setError('Authentication activity is unavailable. Apply the auth audit migration and deploy the auth-audit function.');
      setRows([]);
    } else {
      setError(null);
      setRows((data || []) as AuditRow[]);
    }
    setLoading(false);
  }, []);

  useEffect(() => { void load(); }, [load]);

  return (
    <section id="pulse-panel-auth" role="tabpanel" aria-labelledby="pulse-tab-auth" className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-stone-100">Authentication activity</h3>
          <p className="text-xs text-stone-400">Login attempts, outcomes and registration events. No email addresses, passwords or raw IPs are stored.</p>
        </div>
        <button type="button" onClick={() => void load()} disabled={loading} aria-label="Refresh authentication activity" className="rounded-lg border border-white/10 p-2 text-stone-300 disabled:opacity-50">
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>
      {error && <p role="alert" className="rounded-lg border border-amber-700/40 bg-amber-950/30 p-3 text-xs text-amber-200">{error}</p>}
      {loading && rows.length === 0 ? <p className="text-sm text-stone-400">Loading authentication activity…</p> : null}
      {!loading && !error && rows.length === 0 && <p className="rounded-lg border border-white/10 p-4 text-sm text-stone-400">No authentication events recorded yet.</p>}
      <div className="overflow-x-auto rounded-xl border border-white/10">
        <table className="w-full min-w-[620px] text-left text-xs">
          <thead className="bg-white/[0.04] text-stone-400">
            <tr><th className="p-3">Time</th><th className="p-3">Event</th><th className="p-3">Method</th><th className="p-3">User ID</th><th className="p-3">Error code</th></tr>
          </thead>
          <tbody>
            {rows.map(row => (
              <tr key={row.id} className="border-t border-white/[0.07] text-stone-200">
                <td className="whitespace-nowrap p-3">{new Date(row.created_at).toLocaleString()}</td>
                <td className="p-3"><span className="inline-flex items-center gap-1.5"><ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />{labels[row.event_type] || row.event_type}</span></td>
                <td className="p-3 capitalize">{row.auth_method}</td>
                <td className="p-3 font-mono">{row.user_id ? `${row.user_id.slice(0, 8)}…` : '—'}</td>
                <td className="p-3 font-mono">{row.error_code || '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
