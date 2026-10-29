import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ShieldCheck, UserPlus, UserMinus, RefreshCw, Users, LockKeyhole } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client-universal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';

type UserRole = { user_id: string; email: string; role: string; created_at: string };
const ROLE_OPTIONS = [
  { value: 'admin', label: 'Administrator', description: 'Full platform administration and role management.' },
  { value: 'moderator', label: 'Moderator', description: 'Community moderation tasks where explicitly permitted.' },
  { value: 'editor', label: 'Editor', description: 'Content editing tasks where explicitly permitted.' },
  { value: 'support', label: 'Support', description: 'Support workflows where explicitly permitted.' },
];

export default function AdminRoleManagement() {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('editor');
  const [filter, setFilter] = useState('');
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const rolesQuery = useQuery({
    queryKey: ['admin-user-roles'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('admin_list_user_roles');
      if (error) throw error;
      return (data ?? []) as UserRole[];
    },
  });

  const setRoleMutation = useMutation({
    mutationFn: async ({ targetEmail, targetRole, grant }: { targetEmail: string; targetRole: string; grant: boolean }) => {
      const { data, error } = await supabase.rpc('admin_set_user_role', {
        p_email: targetEmail,
        p_role: targetRole,
        p_grant: grant,
      });
      if (error) throw error;
      return data;
    },
    onSuccess: async (_data, variables) => {
      toast({ title: variables.grant ? 'Role granted' : 'Role removed', description: variables.targetEmail + ' · ' + variables.targetRole });
      setEmail('');
      await queryClient.invalidateQueries({ queryKey: ['admin-user-roles'] });
    },
    onError: (error: Error) => toast({ title: 'Could not update role', description: error.message, variant: 'destructive' }),
  });

  const filteredRoles = useMemo(() => {
    const q = filter.trim().toLowerCase();
    return (rolesQuery.data ?? []).filter((item) => !q || item.email?.toLowerCase().includes(q) || item.role.toLowerCase().includes(q));
  }, [rolesQuery.data, filter]);

  const submitRole = (grant: boolean, targetEmail = email, targetRole = role) => {
    if (!targetEmail.trim()) {
      toast({ title: 'Email required', description: 'Enter the email address of an existing Sahadhyayi account.', variant: 'destructive' });
      return;
    }
    setRoleMutation.mutate({ targetEmail: targetEmail.trim(), targetRole, grant });
  };

  return (
    <main className="min-h-screen bg-background px-4 py-8 md:px-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="mb-2 flex items-center gap-2 text-sm text-muted-foreground"><ShieldCheck className="h-4 w-4" /> Security & access</div>
            <h1 className="text-3xl font-bold tracking-tight">Role Management</h1>
            <p className="mt-1 text-muted-foreground">Grant or revoke platform roles independently of a hard-coded Gmail address.</p>
          </div>
          <Button variant="outline" onClick={() => rolesQuery.refetch()} disabled={rolesQuery.isFetching}>
            <RefreshCw className={`mr-2 h-4 w-4 ${rolesQuery.isFetching ? 'animate-spin' : ''}`} /> Refresh
          </Button>
        </header>

        <div className="grid gap-4 md:grid-cols-3">
          <Card><CardHeader className="pb-2"><CardDescription>Role assignments</CardDescription><CardTitle className="text-3xl">{rolesQuery.data?.length ?? '—'}</CardTitle></CardHeader><CardContent className="text-sm text-muted-foreground">Current user-role entries</CardContent></Card>
          <Card><CardHeader className="pb-2"><CardDescription>Administrators</CardDescription><CardTitle className="text-3xl">{rolesQuery.data?.filter((r) => r.role === 'admin').length ?? '—'}</CardTitle></CardHeader><CardContent className="text-sm text-muted-foreground">Keep at least one admin account</CardContent></Card>
          <Card><CardHeader className="pb-2"><CardDescription>Authorization</CardDescription><CardTitle className="flex items-center gap-2 text-xl"><LockKeyhole className="h-5 w-5" /> Database enforced</CardTitle></CardHeader><CardContent className="text-sm text-muted-foreground">Changes are checked server-side</CardContent></Card>
        </div>

        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><UserPlus className="h-5 w-5" /> Assign a role</CardTitle><CardDescription>The user must already have registered with this email. A role only grants access to features that explicitly check it.</CardDescription></CardHeader>
          <CardContent>
            <form className="grid gap-3 md:grid-cols-[minmax(0,1fr)_220px_auto]" onSubmit={(event) => { event.preventDefault(); submitRole(true); }}>
              <Input type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="user@example.com" autoComplete="off" required />
              <Select value={role} onValueChange={setRole}><SelectTrigger><SelectValue placeholder="Select role" /></SelectTrigger><SelectContent>{ROLE_OPTIONS.map((item) => <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>)}</SelectContent></Select>
              <Button type="submit" disabled={setRoleMutation.isPending}><UserPlus className="mr-2 h-4 w-4" /> Grant role</Button>
            </form>
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              {ROLE_OPTIONS.map((item) => <div key={item.value} className="rounded-lg border p-3"><div className="font-medium">{item.label}</div><p className="text-sm text-muted-foreground">{item.description}</p></div>)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div><CardTitle className="flex items-center gap-2"><Users className="h-5 w-5" /> Assigned roles</CardTitle><CardDescription>One row per role assignment. Removing a role does not delete the user account.</CardDescription></div><Input className="sm:max-w-xs" value={filter} onChange={(event) => setFilter(event.target.value)} placeholder="Filter email or role…" /></div></CardHeader>
          <CardContent>
            {rolesQuery.isLoading ? <p className="py-8 text-center text-muted-foreground">Loading role assignments…</p> : rolesQuery.error ? <div className="rounded-lg border border-destructive/40 p-4 text-sm text-destructive">Could not load roles: {(rolesQuery.error as Error).message}</div> : filteredRoles.length === 0 ? <p className="py-8 text-center text-muted-foreground">No matching role assignments.</p> : (
              <div className="space-y-2">{filteredRoles.map((item) => <div key={item.user_id + item.role} className="flex flex-col gap-3 rounded-xl border p-4 sm:flex-row sm:items-center sm:justify-between"><div className="min-w-0"><div className="break-all font-medium">{item.email || item.user_id}</div><div className="mt-1 text-xs text-muted-foreground">Assigned {new Date(item.created_at).toLocaleDateString()}</div></div><div className="flex items-center gap-2"><Badge variant={item.role === 'admin' ? 'default' : 'secondary'}>{ROLE_OPTIONS.find((r) => r.value === item.role)?.label ?? item.role}</Badge><Button size="sm" variant="outline" disabled={setRoleMutation.isPending} onClick={() => { setEmail(item.email); setRole(item.role); submitRole(false, item.email, item.role); }}><UserMinus className="mr-2 h-4 w-4" /> Revoke</Button></div></div>)}</div>
            )}
          </CardContent>
        </Card>
        <p className="text-xs text-muted-foreground">Important: role management is separate from feature permissions. Existing admin-only pages continue to require the database admin check; moderator, editor, and support permissions must be explicitly wired into the relevant workflows.</p>
      </div>
    </main>
  );
}
