import { useMemo, useState } from 'react';
import { Crown, Loader2, Shield, ShieldCheck, UserCheck, UserX } from 'lucide-react';
import { toast } from 'sonner';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  GroupModerationMember,
  useGroupModerationMembers,
  useModerateGroupMember,
  useSetGroupMemberRole,
  useTransferGroupOwnership,
} from '@/hooks/useGroupManagement';

interface GroupModerationPanelProps {
  groupId: string;
  currentUserId: string;
  actorRole: 'owner' | 'admin' | 'moderator';
}

const roleLabel: Record<GroupModerationMember['role'], string> = {
  owner: 'Owner',
  admin: 'Admin',
  moderator: 'Moderator',
  member: 'Member',
};

const GroupModerationPanel = ({ groupId, currentUserId, actorRole }: GroupModerationPanelProps) => {
  const { data: memberships = [], isLoading, error, refetch } = useGroupModerationMembers(groupId, true);
  const moderateMember = useModerateGroupMember();
  const setMemberRole = useSetGroupMemberRole();
  const transferOwnership = useTransferGroupOwnership();
  const [transferTarget, setTransferTarget] = useState<GroupModerationMember | null>(null);

  const pendingMembers = useMemo(
    () => memberships.filter((member) => member.status === 'pending'),
    [memberships],
  );
  const activeMembers = useMemo(
    () => memberships.filter((member) => member.status === 'active'),
    [memberships],
  );
  const bannedMembers = useMemo(
    () => memberships.filter((member) => member.status === 'banned'),
    [memberships],
  );

  const runModeration = (member: GroupModerationMember, action: 'approve' | 'reject' | 'ban' | 'unban') => {
    moderateMember.mutate(
      { groupId, userId: member.user_id, action },
      {
        onSuccess: () => {
          const messages = {
            approve: 'Join request approved.',
            reject: 'Join request rejected.',
            ban: 'Member blocked from this group.',
            unban: 'Member restored to the group.',
          };
          toast.success(messages[action]);
        },
      },
    );
  };

  const runRoleUpdate = (member: GroupModerationMember, role: 'admin' | 'moderator' | 'member') => {
    setMemberRole.mutate(
      { groupId, userId: member.user_id, role },
      { onSuccess: () => toast.success(`${member.full_name || 'Member'} is now a ${roleLabel[role]}.`) },
    );
  };

  const confirmOwnershipTransfer = () => {
    if (!transferTarget) return;
    transferOwnership.mutate(
      { groupId, newOwnerId: transferTarget.user_id },
      {
        onSuccess: () => {
          toast.success('Group ownership transferred.');
          setTransferTarget(null);
        },
      },
    );
  };

  const canModerateTarget = (member: GroupModerationMember) =>
    member.user_id !== currentUserId &&
    member.role !== 'owner' &&
    !(actorRole === 'moderator' && member.role === 'admin');

  const renderMember = (member: GroupModerationMember, section: 'pending' | 'active' | 'banned') => {
    const initials = (member.full_name || member.username || 'R').trim().slice(0, 1).toUpperCase();

    return (
      <div key={member.membership_id} className="flex flex-col gap-3 rounded-xl border border-border/70 bg-background p-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-center gap-3">
          <Avatar className="h-9 w-9 shrink-0">
            <AvatarImage src={member.profile_photo_url || ''} alt={member.full_name || 'Reader'} />
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-foreground">{member.full_name || 'Sahadhyayi reader'}</p>
            <p className="truncate text-xs text-muted-foreground">
              {member.username ? `@${member.username} · ` : ''}{roleLabel[member.role]}
            </p>
          </div>
          <Badge variant={section === 'pending' ? 'secondary' : section === 'banned' ? 'destructive' : 'outline'}>
            {section === 'pending' ? 'Pending' : section === 'banned' ? 'Blocked' : roleLabel[member.role]}
          </Badge>
        </div>

        <div className="flex flex-wrap items-center gap-2 sm:justify-end">
          {section === 'pending' && (
            <>
              <Button size="sm" onClick={() => runModeration(member, 'approve')} disabled={moderateMember.isPending}>
                <UserCheck className="mr-1.5 h-3.5 w-3.5" /> Approve
              </Button>
              <Button size="sm" variant="outline" onClick={() => runModeration(member, 'reject')} disabled={moderateMember.isPending}>
                Reject
              </Button>
            </>
          )}

          {section === 'active' && canModerateTarget(member) && (
            <Button size="sm" variant="outline" className="text-destructive hover:text-destructive" onClick={() => runModeration(member, 'ban')} disabled={moderateMember.isPending}>
              <UserX className="mr-1.5 h-3.5 w-3.5" /> Block
            </Button>
          )}

          {section === 'banned' && canModerateTarget(member) && (
            <Button size="sm" variant="outline" onClick={() => runModeration(member, 'unban')} disabled={moderateMember.isPending}>
              <UserCheck className="mr-1.5 h-3.5 w-3.5" /> Restore
            </Button>
          )}

          {section === 'active' && actorRole === 'owner' && member.user_id !== currentUserId && (
            <>
              <Select
                value={member.role === 'owner' ? 'member' : member.role}
                onValueChange={(value) => runRoleUpdate(member, value as 'admin' | 'moderator' | 'member')}
                disabled={setMemberRole.isPending}
              >
                <SelectTrigger className="h-8 w-[132px]" aria-label={`Change role for ${member.full_name || 'member'}`}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="member">Member</SelectItem>
                  <SelectItem value="moderator">Moderator</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
              <Button size="sm" variant="ghost" onClick={() => setTransferTarget(member)}>
                <Crown className="mr-1.5 h-3.5 w-3.5" /> Transfer owner
              </Button>
            </>
          )}
        </div>
      </div>
    );
  };

  return (
    <>
      <Card className="border-border bg-card">
        <CardHeader className="border-b border-border pb-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 text-base">
                <ShieldCheck className="h-4 w-4 text-[hsl(var(--brand-primary))]" />
                Group management
              </CardTitle>
              <CardDescription className="mt-1">
                Review join requests and keep your reading group welcoming and safe.
              </CardDescription>
            </div>
            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary">{pendingMembers.length} pending</Badge>
              <Badge variant="outline">{activeMembers.length} active</Badge>
              <Badge variant="outline">{bannedMembers.length} blocked</Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6 p-4 sm:p-5">
          {isLoading && (
            <div className="flex items-center gap-2 py-5 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" /> Loading group membership…
            </div>
          )}

          {error && (
            <Alert variant="destructive">
              <AlertDescription className="flex flex-wrap items-center justify-between gap-2">
                <span>Could not load moderation details. Your permissions may have changed.</span>
                <Button size="sm" variant="outline" onClick={() => void refetch()}>Retry</Button>
              </AlertDescription>
            </Alert>
          )}

          {!isLoading && !error && (
            <>
              <section className="space-y-3">
                <div className="flex items-center gap-2">
                  <UserCheck className="h-4 w-4 text-muted-foreground" />
                  <h3 className="text-sm font-semibold">Join requests</h3>
                  <Badge variant="secondary">{pendingMembers.length}</Badge>
                </div>
                {pendingMembers.length ? (
                  <div className="space-y-2">{pendingMembers.map((member) => renderMember(member, 'pending'))}</div>
                ) : (
                  <p className="rounded-lg bg-muted/40 px-3 py-4 text-sm text-muted-foreground">No requests waiting for approval.</p>
                )}
              </section>

              <section className="space-y-3 border-t border-border pt-5">
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4 text-muted-foreground" />
                  <h3 className="text-sm font-semibold">Active members</h3>
                  <Badge variant="outline">{activeMembers.length}</Badge>
                </div>
                {activeMembers.length ? (
                  <div className="space-y-2">{activeMembers.map((member) => renderMember(member, 'active'))}</div>
                ) : (
                  <p className="rounded-lg bg-muted/40 px-3 py-4 text-sm text-muted-foreground">No active members yet.</p>
                )}
              </section>

              {bannedMembers.length > 0 && (
                <section className="space-y-3 border-t border-border pt-5">
                  <div className="flex items-center gap-2">
                    <UserX className="h-4 w-4 text-muted-foreground" />
                    <h3 className="text-sm font-semibold">Blocked members</h3>
                    <Badge variant="destructive">{bannedMembers.length}</Badge>
                  </div>
                  <div className="space-y-2">{bannedMembers.map((member) => renderMember(member, 'banned'))}</div>
                </section>
              )}

              {actorRole !== 'owner' && (
                <p className="border-t border-border pt-4 text-xs text-muted-foreground">
                  Role changes and ownership transfers are reserved for the group owner.
                </p>
              )}
            </>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={Boolean(transferTarget)} onOpenChange={(open) => { if (!open && !transferOwnership.isPending) setTransferTarget(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Transfer group ownership?</AlertDialogTitle>
            <AlertDialogDescription>
              {transferTarget?.full_name || 'This member'} will become the owner. Your role will change to admin, and the transfer cannot be undone by this action.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={transferOwnership.isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={(event) => { event.preventDefault(); confirmOwnershipTransfer(); }} disabled={transferOwnership.isPending}>
              {transferOwnership.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Transfer ownership
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default GroupModerationPanel;
