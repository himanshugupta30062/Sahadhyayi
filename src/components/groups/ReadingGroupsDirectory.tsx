import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AlertCircle,
  Loader2,
  MessageCircle,
  MoreVertical,
  Pencil,
  Plus,
  Search,
  Trash2,
  Users,
} from 'lucide-react';
import { useAuth } from '@/contexts/authHelpers';
import {
  Group,
  useCreateGroup,
  useDeleteGroup,
  useGroups,
  useJoinGroup,
  useLeaveGroup,
  useUpdateGroup,
} from '@/hooks/useGroupManagement';
import { useUserJoinedGroups } from '@/hooks/useUserGroups';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import GroupMessaging from './GroupMessaging';
import { toast } from 'sonner';

type EditableGroup = Pick<Group, 'id' | 'name'> & { description: string };

const getErrorMessage = (error: unknown, fallback: string) =>
  error instanceof Error && error.message ? error.message : fallback;

const GroupSkeleton = () => (
  <Card className="border-border">
    <CardContent className="p-5 space-y-4">
      <div className="flex items-start gap-3">
        <Skeleton className="h-11 w-11 rounded-lg" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-5 w-2/3" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-4/5" />
        </div>
      </div>
      <Skeleton className="h-9 w-full" />
    </CardContent>
  </Card>
);

const ReadingGroupsDirectory = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const groupsQuery = useGroups();
  const membershipsQuery = useUserJoinedGroups();
  const createGroup = useCreateGroup();
  const joinGroup = useJoinGroup();
  const leaveGroup = useLeaveGroup();
  const updateGroup = useUpdateGroup();
  const deleteGroup = useDeleteGroup();

  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newGroup, setNewGroup] = useState({ name: '', description: '' });
  const [editGroup, setEditGroup] = useState<EditableGroup | null>(null);
  const [deleteGroupId, setDeleteGroupId] = useState<string | null>(null);
  const [chatGroup, setChatGroup] = useState<Pick<Group, 'id' | 'name'> | null>(null);

  const memberships = membershipsQuery.data ?? [];
  const membershipByGroup = useMemo(
    () => new Map(memberships.map((membership) => [membership.group_id, membership])),
    [memberships],
  );
  const normalizedSearch = searchQuery.trim().toLowerCase();
  const filteredGroups = useMemo(
    () => (groupsQuery.data ?? []).filter((group) => {
      if (!normalizedSearch) return true;
      return group.name.toLowerCase().includes(normalizedSearch)
        || (group.description ?? '').toLowerCase().includes(normalizedSearch);
    }),
    [groupsQuery.data, normalizedSearch],
  );

  const openCreate = () => {
    if (!user) {
      navigate('/signin?redirect=%2Fgroups');
      return;
    }
    setShowCreateDialog(true);
  };

  const handleCreate = async () => {
    const name = newGroup.name.trim();
    if (!name) return;

    try {
      await createGroup.mutateAsync({ name, description: newGroup.description });
      setNewGroup({ name: '', description: '' });
      setShowCreateDialog(false);
      toast.success('Reading group created');
    } catch (error) {
      toast.error(getErrorMessage(error, 'Could not create the group. Please try again.'));
    }
  };

  const handleMembership = async (groupId: string, isJoined: boolean) => {
    if (!user) {
      navigate('/signin?redirect=%2Fgroups');
      return;
    }
    try {
      if (isJoined) await leaveGroup.mutateAsync(groupId);
      else await joinGroup.mutateAsync(groupId);
    } catch {
      // The mutation displays the database error and retains the current state.
    }
  };

  const handleUpdate = async () => {
    if (!editGroup?.name.trim()) return;
    try {
      await updateGroup.mutateAsync({
        groupId: editGroup.id,
        name: editGroup.name,
        description: editGroup.description,
      });
      setEditGroup(null);
    } catch {
      // Keep the dialog open so the administrator can retry.
    }
  };

  const handleDelete = async () => {
    if (!deleteGroupId) return;
    try {
      await deleteGroup.mutateAsync(deleteGroupId);
      setDeleteGroupId(null);
    } catch {
      // Keep the confirmation open so the creator can retry.
    }
  };

  const isLoading = groupsQuery.isLoading || (Boolean(user) && membershipsQuery.isLoading);
  const loadError = groupsQuery.error || membershipsQuery.error;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 border-b border-border pb-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Reading Groups</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Find a circle, join its conversation, or start one of your own.
          </p>
        </div>
        <Button onClick={openCreate} className="bg-gradient-button text-primary-foreground sm:w-auto">
          <Plus className="mr-2 h-4 w-4" />
          Create Group
        </Button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          aria-label="Search reading groups"
          placeholder="Search groups by name or description"
          value={searchQuery}
          onChange={(event) => setSearchQuery(event.target.value)}
          className="pl-10"
        />
      </div>

      {loadError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <span>{getErrorMessage(loadError, 'Reading groups could not be loaded.')}</span>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => void Promise.all([groupsQuery.refetch(), membershipsQuery.refetch()])}
            >
              Try again
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {isLoading && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3" aria-label="Loading reading groups">
          {Array.from({ length: 6 }).map((_, index) => <GroupSkeleton key={index} />)}
        </div>
      )}

      {!isLoading && !loadError && filteredGroups.length > 0 && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredGroups.map((group) => {
            const membership = membershipByGroup.get(group.id);
            const isJoined = Boolean(membership);
            const canEdit = membership?.role === 'admin' || group.created_by === user?.id;
            const canDelete = group.created_by === user?.id;
            const membershipPending = (joinGroup.isPending && joinGroup.variables === group.id)
              || (leaveGroup.isPending && leaveGroup.variables === group.id);
            const memberCount = group.group_members?.[0]?.count ?? 0;

            return (
              <Card key={group.id} className="border-border transition-shadow hover:shadow-md">
                <CardContent className="flex h-full flex-col p-5">
                  <div className="mb-4 flex items-start gap-3">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-brand-primary/10 font-semibold text-brand-primary">
                      {group.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="break-words font-semibold text-foreground">{group.name}</h3>
                        {canEdit && (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" aria-label={`Manage ${group.name}`}>
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => setEditGroup({
                                id: group.id,
                                name: group.name,
                                description: group.description ?? '',
                              })}>
                                <Pencil className="mr-2 h-4 w-4" /> Edit group
                              </DropdownMenuItem>
                              {canDelete && (
                                <DropdownMenuItem
                                  className="text-destructive focus:text-destructive"
                                  onClick={() => setDeleteGroupId(group.id)}
                                >
                                  <Trash2 className="mr-2 h-4 w-4" /> Delete group
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        )}
                      </div>
                      <p className="mt-1 line-clamp-3 text-sm text-muted-foreground">
                        {group.description || 'A space for readers to discuss books together.'}
                      </p>
                    </div>
                  </div>

                  <div className="mb-4 flex items-center gap-2 text-xs text-muted-foreground">
                    <Users className="h-4 w-4" />
                    <span>{memberCount} {memberCount === 1 ? 'member' : 'members'}</span>
                    {membership?.role === 'admin' && <Badge variant="outline">Admin</Badge>}
                  </div>

                  <div className="mt-auto flex flex-wrap gap-2">
                    {isJoined && (
                      <>
                        <Button variant="outline" size="sm" onClick={() => navigate(`/groups/${group.id}`)}>
                          View Group
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => setChatGroup({ id: group.id, name: group.name })}>
                          <MessageCircle className="mr-2 h-4 w-4" /> Chat
                        </Button>
                      </>
                    )}
                    <Button
                      size="sm"
                      variant={isJoined ? 'ghost' : 'default'}
                      disabled={membershipPending}
                      onClick={() => void handleMembership(group.id, isJoined)}
                      className={!isJoined ? 'bg-gradient-button text-primary-foreground' : undefined}
                    >
                      {membershipPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      {isJoined ? 'Leave' : 'Join Group'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {!isLoading && !loadError && filteredGroups.length === 0 && (
        <div className="py-14 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-lg bg-brand-primary/10">
            <Users className="h-7 w-7 text-brand-primary" />
          </div>
          <h3 className="font-semibold text-foreground">
            {normalizedSearch ? 'No matching groups' : user ? 'No reading groups yet' : 'Sign in to start a reading group'}
          </h3>
          <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
            {normalizedSearch
              ? 'Try a different name or description.'
              : user
                ? 'Create the first group and invite readers into the conversation.'
                : 'Create an account to build a lasting reading community.'}
          </p>
          {!normalizedSearch && <Button onClick={openCreate} className="mt-5 bg-gradient-button text-primary-foreground">{user ? 'Create First Group' : 'Sign In'}</Button>}
        </div>
      )}

      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>Create Reading Group</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="new-group-name">Group name</Label>
              <Input id="new-group-name" value={newGroup.name} onChange={(event) => setNewGroup((current) => ({ ...current, name: event.target.value }))} maxLength={100} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-group-description">Description</Label>
              <Textarea id="new-group-description" value={newGroup.description} onChange={(event) => setNewGroup((current) => ({ ...current, description: event.target.value }))} rows={4} maxLength={500} />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowCreateDialog(false)} disabled={createGroup.isPending}>Cancel</Button>
              <Button onClick={() => void handleCreate()} disabled={createGroup.isPending || !newGroup.name.trim()}>
                {createGroup.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Create Group
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(editGroup)} onOpenChange={(open) => { if (!open && !updateGroup.isPending) setEditGroup(null); }}>
        <DialogContent>
          <DialogHeader><DialogTitle>Edit Reading Group</DialogTitle></DialogHeader>
          {editGroup && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="edit-group-name">Group name</Label>
                <Input id="edit-group-name" value={editGroup.name} onChange={(event) => setEditGroup({ ...editGroup, name: event.target.value })} maxLength={100} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-group-description">Description</Label>
                <Textarea id="edit-group-description" value={editGroup.description} onChange={(event) => setEditGroup({ ...editGroup, description: event.target.value })} rows={4} maxLength={500} />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setEditGroup(null)} disabled={updateGroup.isPending}>Cancel</Button>
                <Button onClick={() => void handleUpdate()} disabled={updateGroup.isPending || !editGroup.name.trim()}>
                  {updateGroup.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Save Changes
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog open={Boolean(deleteGroupId)} onOpenChange={(open) => { if (!open && !deleteGroup.isPending) setDeleteGroupId(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this reading group?</AlertDialogTitle>
            <AlertDialogDescription>This permanently removes its memberships and messages. This cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteGroup.isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={(event) => { event.preventDefault(); void handleDelete(); }} disabled={deleteGroup.isPending} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {deleteGroup.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Delete Group
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {chatGroup && (
        <GroupMessaging groupId={chatGroup.id} groupName={chatGroup.name} isOpen onClose={() => setChatGroup(null)} />
      )}
    </div>
  );
};

export default ReadingGroupsDirectory;