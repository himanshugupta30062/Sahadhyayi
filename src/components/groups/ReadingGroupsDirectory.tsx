import { useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  AlertCircle,
  Loader2,
  MessageCircle,
  MoreVertical,
  Pencil,
  Plus,
  Search,
  Share2,
  Trash2,
  Users,
  Link2,
  CheckCircle2,
  UserPlus,
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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import GroupMessaging from './GroupMessaging';
import SignInLink from '@/components/SignInLink';
import { toast } from 'sonner';

type EditableGroup = Pick<Group, 'id' | 'name'> & { description: string };

const getErrorMessage = (error: unknown, fallback: string) =>
  error instanceof Error && error.message ? error.message : fallback;

const GroupSkeleton = () => (
  <Card className="border-border">
    <CardContent className="p-5 space-y-4">
      <div className="flex items-start gap-3">
        <Skeleton className="h-12 w-12 rounded-xl" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-5 w-2/3" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-4/5" />
        </div>
      </div>
      <div className="flex gap-2">
        <Skeleton className="h-9 flex-1" />
        <Skeleton className="h-9 w-24" />
      </div>
    </CardContent>
  </Card>
);

/** Copies an invite link and shows feedback */
const useGroupInvite = () => {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const copyInviteLink = (group: Pick<Group, 'id' | 'name'>) => {
    const url = `${window.location.origin}/social?tab=groups&join=${group.id}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopiedId(group.id);
      toast.success(`Invite link copied! Share it with friends to join "${group.name}".`);
      setTimeout(() => setCopiedId(null), 3000);
    }).catch(() => {
      toast.error('Could not copy link. Try manually sharing the page URL.');
    });
  };

  return { copiedId, copyInviteLink };
};

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
  const { copiedId, copyInviteLink } = useGroupInvite();

  const [searchParams] = useSearchParams();
  const joinGroupId = searchParams.get('join');

  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'mine'>('all');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newGroup, setNewGroup] = useState({ name: '', description: '' });
  const [editGroup, setEditGroup] = useState<EditableGroup | null>(null);
  const [deleteGroupId, setDeleteGroupId] = useState<string | null>(null);
  const [chatGroup, setChatGroup] = useState<Pick<Group, 'id' | 'name'> | null>(null);

  const memberships = membershipsQuery.data ?? [];
  const membershipByGroup = useMemo(
    () => new Map(memberships.map((m) => [m.group_id, m])),
    [memberships],
  );

  const normalizedSearch = searchQuery.trim().toLowerCase();

  const allGroups = groupsQuery.data ?? [];

  const invitedGroup = useMemo(
    () => allGroups.find((g) => g.id === joinGroupId),
    [allGroups, joinGroupId],
  );

  const filteredGroups = useMemo(() => {
    const base = activeTab === 'mine'
      ? allGroups.filter((g) => membershipByGroup.has(g.id))
      : allGroups;
    if (!normalizedSearch) return base;
    return base.filter(
      (g) =>
        g.name.toLowerCase().includes(normalizedSearch) ||
        (g.description ?? '').toLowerCase().includes(normalizedSearch),
    );
  }, [allGroups, activeTab, membershipByGroup, normalizedSearch]);

  const myGroupsCount = useMemo(
    () => allGroups.filter((g) => membershipByGroup.has(g.id)).length,
    [allGroups, membershipByGroup],
  );

  const openCreate = () => {
    if (!user) {
      navigate('/signin?redirect=%2Fsocial%3Ftab%3Dgroups');
      return;
    }
    setShowCreateDialog(true);
  };

  const handleCreate = async () => {
    const name = newGroup.name.trim();
    if (!name) return;
    try {
      const created = await createGroup.mutateAsync({ name, description: newGroup.description });
      setNewGroup({ name: '', description: '' });
      setShowCreateDialog(false);
      toast.success(`Reading group "${name}" created!`);
      // Auto-copy invite link after creation
      if (created) copyInviteLink({ id: (created as Group).id, name });
    } catch (error) {
      toast.error(getErrorMessage(error, 'Could not create the group. Please try again.'));
    }
  };

  const handleMembership = async (group: Group, isJoined: boolean) => {
    if (!user) {
      toast.error('Sign in to join reading groups');
      return;
    }
    try {
      if (isJoined) {
        await leaveGroup.mutateAsync(group.id);
        toast.success(`Left "${group.name}"`);
      } else {
        await joinGroup.mutateAsync(group.id);
        toast.success(`Joined "${group.name}"! Open Chat to start a conversation.`);
      }
    } catch {
      // mutation error surfaced by the hook
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
      toast.success('Group updated');
    } catch {
      // keep dialog open for retry
    }
  };

  const handleDelete = async () => {
    if (!deleteGroupId) return;
    try {
      await deleteGroup.mutateAsync(deleteGroupId);
      setDeleteGroupId(null);
      toast.success('Group deleted');
    } catch {
      // keep dialog open for retry
    }
  };

  const isLoading = groupsQuery.isLoading || (Boolean(user) && membershipsQuery.isLoading);
  const loadError = groupsQuery.error || membershipsQuery.error;

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <div className="flex flex-col gap-4 border-b border-border pb-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
            <Users className="w-5 h-5 text-brand-primary" />
            Reading Groups
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {user
              ? 'Find a circle, join its conversation, or start one of your own.'
              : 'Browse public reading groups. Sign in to join or create your own.'}
          </p>
        </div>

        {user ? (
          <Button onClick={openCreate} className="bg-gradient-button text-primary-foreground sm:w-auto gap-2">
            <Plus className="h-4 w-4" />
            Create Group
          </Button>
        ) : (
          <SignInLink>
            <Button className="bg-gradient-button text-primary-foreground sm:w-auto gap-2">
              <UserPlus className="h-4 w-4" />
              Sign In to Join
            </Button>
          </SignInLink>
        )}
      </div>

      {/* ── Group Invitation Callout (when arrived via ?join=<id>) ── */}
      {invitedGroup && !membershipByGroup.has(invitedGroup.id) && (
        <div className="bg-gradient-to-r from-brand-primary/10 via-brand-primary/5 to-background border-2 border-brand-primary/30 rounded-2xl p-5 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="w-12 h-12 rounded-xl bg-brand-primary text-white flex items-center justify-center font-bold text-lg shrink-0 shadow-sm">
                {invitedGroup.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold uppercase tracking-wider text-brand-primary">Group Invitation</span>
                  <span className="w-1.5 h-1.5 rounded-full bg-brand-primary" />
                  <span className="text-xs text-muted-foreground">{invitedGroup.group_members?.[0]?.count ?? 0} members</span>
                </div>
                <h3 className="text-lg font-bold text-foreground mt-0.5">{invitedGroup.name}</h3>
                <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
                  {invitedGroup.description || 'You have been invited to join this reading circle on Sahadhyayi.'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
              {user ? (
                <Button
                  onClick={() => void handleMembership(invitedGroup, false)}
                  disabled={joinGroup.isPending}
                  className="bg-brand-primary hover:bg-brand-primary/90 text-white font-medium gap-2 px-5"
                >
                  {joinGroup.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}
                  Join This Group
                </Button>
              ) : (
                <SignInLink>
                  <Button className="bg-brand-primary hover:bg-brand-primary/90 text-white font-medium gap-2 px-5">
                    <UserPlus className="h-4 w-4" />
                    Sign In to Join
                  </Button>
                </SignInLink>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Search + Tab Filters ── */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            aria-label="Search reading groups"
            placeholder="Search by name or topic…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {user && (
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'all' | 'mine')} className="w-auto">
            <TabsList className="h-9 p-1 bg-muted/60">
              <TabsTrigger value="all" className="h-7 text-xs px-3">
                All Groups
                <Badge variant="secondary" className="ml-1.5 text-[10px] h-4 px-1 bg-muted-foreground/15">
                  {allGroups.length}
                </Badge>
              </TabsTrigger>
              <TabsTrigger value="mine" className="h-7 text-xs px-3">
                My Groups
                {myGroupsCount > 0 && (
                  <Badge variant="secondary" className="ml-1.5 text-[10px] h-4 px-1 bg-brand-primary/15 text-brand-primary">
                    {myGroupsCount}
                  </Badge>
                )}
              </TabsTrigger>
            </TabsList>
          </Tabs>
        )}
      </div>

      {/* ── Error ── */}
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

      {/* ── Skeletons ── */}
      {isLoading && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3" aria-label="Loading reading groups">
          {Array.from({ length: 6 }).map((_, i) => <GroupSkeleton key={i} />)}
        </div>
      )}

      {/* ── Group Grid ── */}
      {!isLoading && !loadError && filteredGroups.length > 0 && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredGroups.map((group) => {
            const membership = membershipByGroup.get(group.id);
            const isJoined = Boolean(membership);
            const canEdit = membership?.role === 'admin' || group.created_by === user?.id;
            const canDelete = group.created_by === user?.id;
            const membershipPending =
              (joinGroup.isPending && joinGroup.variables === group.id) ||
              (leaveGroup.isPending && leaveGroup.variables === group.id);
            const memberCount = group.group_members?.[0]?.count ?? 0;
            const isCopied = copiedId === group.id;

            return (
              <Card
                key={group.id}
                className={`border transition-shadow hover:shadow-md flex flex-col ${
                  isJoined
                    ? 'border-brand-primary/30 bg-brand-primary/3 dark:bg-brand-primary/5'
                    : 'border-border'
                }`}
              >
                <CardContent className="flex flex-col h-full p-5 gap-4">
                  {/* Top: avatar + title + menu */}
                  <div className="flex items-start gap-3">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-brand-primary/10 font-bold text-brand-primary text-lg">
                      {group.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="font-semibold text-foreground break-words leading-snug">{group.name}</h3>
                        <div className="flex items-center gap-1 shrink-0">
                          {isJoined && (
                            <Badge variant="outline" className="text-[10px] h-5 px-1.5 border-brand-primary/40 text-brand-primary bg-brand-primary/5">
                              Joined
                            </Badge>
                          )}
                          {/* Admin/manage menu */}
                          {canEdit && (
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" aria-label={`Manage ${group.name}`}>
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => copyInviteLink(group)}>
                                  <Link2 className="mr-2 h-4 w-4" /> Copy Invite Link
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={() => setEditGroup({ id: group.id, name: group.name, description: group.description ?? '' })}>
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
                      </div>
                      <p className="mt-1 line-clamp-2 text-xs text-muted-foreground leading-relaxed">
                        {group.description || 'A space for readers to discuss books together.'}
                      </p>
                    </div>
                  </div>

                  {/* Meta: member count + role */}
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1.5">
                      <Users className="h-3.5 w-3.5" />
                      <span>{memberCount} {memberCount === 1 ? 'member' : 'members'}</span>
                    </div>
                    {membership?.role === 'admin' && (
                      <Badge variant="outline" className="text-[10px] h-4 px-1.5">Admin</Badge>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="mt-auto flex flex-wrap gap-2">
                    {isJoined ? (
                      <>
                        <Button
                          variant="default"
                          size="sm"
                          className="flex-1 bg-brand-primary hover:bg-brand-primary/90 text-white gap-1.5"
                          onClick={() => setChatGroup({ id: group.id, name: group.name })}
                        >
                          <MessageCircle className="h-3.5 w-3.5" />
                          Open Chat
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="gap-1.5 text-xs"
                          onClick={() => copyInviteLink(group)}
                          title="Copy invite link to share with others"
                        >
                          {isCopied ? (
                            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                          ) : (
                            <Share2 className="h-3.5 w-3.5" />
                          )}
                          {isCopied ? 'Copied!' : 'Invite'}
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 text-xs"
                          disabled={membershipPending}
                          onClick={() => void handleMembership(group, true)}
                        >
                          {membershipPending && <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />}
                          Leave
                        </Button>
                      </>
                    ) : (
                      <>
                        {user ? (
                          <Button
                            size="sm"
                            className="flex-1 bg-gradient-button text-primary-foreground gap-1.5"
                            disabled={membershipPending}
                            onClick={() => void handleMembership(group, false)}
                          >
                            {membershipPending
                              ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              : <UserPlus className="h-3.5 w-3.5" />}
                            Join Group
                          </Button>
                        ) : (
                          <SignInLink>
                            <Button size="sm" className="flex-1 bg-gradient-button text-primary-foreground gap-1.5">
                              <UserPlus className="h-3.5 w-3.5" />
                              Sign In to Join
                            </Button>
                          </SignInLink>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          className="gap-1.5 text-xs"
                          onClick={() => copyInviteLink(group)}
                          title="Copy a link to share this group"
                        >
                          {isCopied ? (
                            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                          ) : (
                            <Share2 className="h-3.5 w-3.5" />
                          )}
                          Share
                        </Button>
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* ── Empty States ── */}
      {!isLoading && !loadError && filteredGroups.length === 0 && (
        <div className="py-16 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-primary/10">
            <Users className="h-8 w-8 text-brand-primary" />
          </div>
          <h3 className="font-semibold text-foreground text-base">
            {normalizedSearch
              ? 'No groups match your search'
              : activeTab === 'mine'
              ? user
                ? "You haven't joined any groups yet"
                : 'Sign in to see your groups'
              : 'No reading groups yet'}
          </h3>
          <p className="mx-auto mt-2 max-w-sm text-sm text-muted-foreground">
            {normalizedSearch
              ? 'Try a different keyword or browse all groups.'
              : activeTab === 'mine'
              ? 'Join a group to start reading and chatting together.'
              : user
              ? 'Create the first group and invite readers into the conversation.'
              : 'Sign in to join groups, chat with readers, and invite your friends.'}
          </p>
          <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
            {normalizedSearch && (
              <Button variant="outline" onClick={() => setSearchQuery('')}>
                Clear Search
              </Button>
            )}
            {activeTab === 'mine' && (
              <Button variant="outline" onClick={() => setActiveTab('all')}>
                Browse All Groups
              </Button>
            )}
            {!normalizedSearch && activeTab === 'all' && user && (
              <Button onClick={openCreate} className="bg-gradient-button text-primary-foreground gap-2">
                <Plus className="h-4 w-4" /> Create First Group
              </Button>
            )}
            {!user && (
              <SignInLink>
                <Button className="bg-gradient-button text-primary-foreground gap-2">
                  <UserPlus className="h-4 w-4" /> Sign In to Get Started
                </Button>
              </SignInLink>
            )}
          </div>
        </div>
      )}

      {/* ── Create Group Dialog ── */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create a Reading Group</DialogTitle>
            <DialogDescription>
              Create a group around a book, author, genre, or theme. You'll be the admin and can invite others.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label htmlFor="new-group-name">
                Group name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="new-group-name"
                placeholder="e.g. Dune Readers, Midnight Library Club…"
                value={newGroup.name}
                onChange={(e) => setNewGroup((c) => ({ ...c, name: e.target.value }))}
                maxLength={100}
                autoFocus
              />
              <p className="text-xs text-muted-foreground">{newGroup.name.length}/100 characters</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-group-description">Description</Label>
              <Textarea
                id="new-group-description"
                placeholder="What books or topics will this group focus on? Who should join?"
                value={newGroup.description}
                onChange={(e) => setNewGroup((c) => ({ ...c, description: e.target.value }))}
                rows={3}
                maxLength={500}
              />
              <p className="text-xs text-muted-foreground">{newGroup.description.length}/500 characters</p>
            </div>
            <div className="bg-muted/50 rounded-lg p-3 text-xs text-muted-foreground flex items-start gap-2">
              <Link2 className="w-3.5 h-3.5 mt-0.5 shrink-0" />
              After creating, an invite link will be copied automatically so you can share it immediately.
            </div>
            <div className="flex justify-end gap-2 pt-1">
              <Button variant="outline" onClick={() => setShowCreateDialog(false)} disabled={createGroup.isPending}>
                Cancel
              </Button>
              <Button
                onClick={() => void handleCreate()}
                disabled={createGroup.isPending || !newGroup.name.trim()}
                className="gap-2"
              >
                {createGroup.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                Create Group
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Edit Group Dialog ── */}
      <Dialog open={Boolean(editGroup)} onOpenChange={(open) => { if (!open && !updateGroup.isPending) setEditGroup(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Reading Group</DialogTitle>
          </DialogHeader>
          {editGroup && (
            <div className="space-y-4 pt-2">
              <div className="space-y-2">
                <Label htmlFor="edit-group-name">Group name</Label>
                <Input
                  id="edit-group-name"
                  value={editGroup.name}
                  onChange={(e) => setEditGroup({ ...editGroup, name: e.target.value })}
                  maxLength={100}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-group-description">Description</Label>
                <Textarea
                  id="edit-group-description"
                  value={editGroup.description}
                  onChange={(e) => setEditGroup({ ...editGroup, description: e.target.value })}
                  rows={3}
                  maxLength={500}
                />
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

      {/* ── Delete Confirmation ── */}
      <AlertDialog open={Boolean(deleteGroupId)} onOpenChange={(open) => { if (!open && !deleteGroup.isPending) setDeleteGroupId(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this reading group?</AlertDialogTitle>
            <AlertDialogDescription>
              This permanently removes all memberships, messages, and group data. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteGroup.isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => { e.preventDefault(); void handleDelete(); }}
              disabled={deleteGroup.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteGroup.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Delete Group
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ── Group Chat ── */}
      {chatGroup && (
        <GroupMessaging groupId={chatGroup.id} groupName={chatGroup.name} isOpen onClose={() => setChatGroup(null)} />
      )}
    </div>
  );
};

export default ReadingGroupsDirectory;