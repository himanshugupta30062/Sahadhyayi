import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  ArrowLeft, 
  Users, 
  MessageCircle, 
  Share2, 
  Radio, 
  UserPlus, 
  Loader2, 
  CheckCircle2, 
  BookOpen, 
  Sparkles,
  Globe,
  Lock,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import SEO from '@/components/SEO';
import Breadcrumb from '@/components/Breadcrumb';
import { useAuth } from '@/contexts/authHelpers';
import { DEFAULT_READING_GROUP_NAME, useGroups, useJoinGroup, useLeaveGroup, useCreateGroupInvitation, Group } from '@/hooks/useGroupManagement';
import GroupModerationPanel from '@/components/groups/GroupModerationPanel';
import { useUserJoinedGroups } from '@/hooks/useUserGroups';
import { useGroupMembers } from '@/hooks/useGroupMessaging';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client-universal';
import GroupMessaging from '@/components/groups/GroupMessaging';
import GroupReadingBoard from '@/components/groups/GroupReadingBoard';
import GroupReadingDiscussions from '@/components/groups/GroupReadingDiscussions';
import { toast } from 'sonner';

const GroupDetails = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [showChat, setShowChat] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  const { data: groups = [], isLoading: groupsLoading } = useGroups();
  const { data: joinedGroups = [] } = useUserJoinedGroups();
  const { data: members = [], isLoading: membersLoading } = useGroupMembers(id || '');

  const joinGroup = useJoinGroup();
  const leaveGroup = useLeaveGroup();
  const createInvitation = useCreateGroupInvitation();

  // Try finding group in cache first, fallback to direct query for deep links
  const cachedGroup = groups.find(g => g.id === id);

  const { data: directGroup, isLoading: directLoading } = useQuery({
    queryKey: ['group-direct-detail', id],
    queryFn: async () => {
      if (!id) return null;
      if (user?.id) {
        const { data, error } = await supabase
          .from('group_chats')
          .select(`
            *,
            group_members:group_chat_members(count)
          `)
          .eq('id', id)
          .maybeSingle();
        if (error) throw error;
        return data as Group | null;
      }

      // Public group details use the count-only RPC, not raw membership rows.
      const [{ data, error }, { data: counts, error: countsError }] = await Promise.all([
        supabase.from('group_chats').select('*').eq('id', id).maybeSingle(),
        supabase.rpc('get_public_group_member_counts'),
      ]);
      if (error) throw error;
      if (countsError) throw countsError;
      if (!data) return null;
      const countRow = (counts || []).find((row: { group_id: string }) => row.group_id === data.id);
      const count = Number(countRow?.member_count) || 0;
      return { ...data, member_count: count, group_members: [{ count }] } as Group;
    },
    enabled: !cachedGroup && !!id,
  });

  const group = cachedGroup || directGroup;
  const myMembership = group ? joinedGroups.find((membership) => membership.group_id === group.id) : undefined;
  const isMember = myMembership ? (myMembership.status ? myMembership.status === 'active' : true) : false;
  const isRequestPending = myMembership?.status === 'pending';
  const isBanned = myMembership?.status === 'banned';
  const actorRole = myMembership?.role || (group?.created_by && user?.id && group.created_by === user.id ? 'owner' : undefined);
  const canManageGroup = isMember && (
    actorRole === 'owner' || actorRole === 'admin' || actorRole === 'moderator'
  );
  const activeMembers = members.filter((member) => member.status === 'active');
  const memberCount = membersLoading || !user?.id || !isMember
    ? Number(group?.member_count ?? group?.group_members?.[0]?.count ?? 0)
    : activeMembers.length;
  const requiresInvitation = group?.join_policy === 'invite_only' || group?.is_encrypted === true;
  const isDefaultReadingGroup = group?.name === DEFAULT_READING_GROUP_NAME;

  const copyInviteLink = async () => {
    if (!group) return;
    try {
      const invitation = await createInvitation.mutateAsync({ groupId: group.id, expiresInDays: 7 });
      const url = new URL('/social', window.location.origin);
      url.searchParams.set('tab', 'groups');
      url.searchParams.set('invite', invitation.token);
      await navigator.clipboard.writeText(url.toString());
      setIsCopied(true);
      toast.success('Secure invite copied (expires in 7 days).');
      window.setTimeout(() => setIsCopied(false), 2500);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not create or copy invitation.');
    }
  };

  const copyGroupPageLink = async () => {
    if (!group) return;
    try {
      const url = new URL(`/groups/${group.id}`, window.location.origin);
      await navigator.clipboard.writeText(url.toString());
      setIsCopied(true);
      toast.success('Group page link copied.');
      window.setTimeout(() => setIsCopied(false), 2500);
    } catch {
      toast.error('Could not copy the group link. Please try again.');
    }
  };

  const handleMembership = async () => {
    if (!group) return;
    if (isMember) {
      await leaveGroup.mutateAsync(group.id);
    } else {
      await joinGroup.mutateAsync(group.id);
    }
  };

  const breadcrumbItems = [
    { name: 'Reading Groups', path: '/groups' },
    { name: group?.name || 'Group Details', path: `/groups/${id}`, current: true },
  ];

  if (groupsLoading || directLoading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center space-y-4">
        <Loader2 className="w-8 h-8 animate-spin text-[hsl(var(--brand-primary))]" />
        <p className="text-sm text-muted-foreground">Loading reading group...</p>
      </div>
    );
  }

  if (!group) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
        <Card className="max-w-md w-full p-6 text-center border-border">
          <Users className="w-12 h-12 mx-auto text-muted-foreground/50 mb-3" />
          <h2 className="text-xl font-bold text-foreground mb-2">Group Not Found</h2>
          <p className="text-sm text-muted-foreground mb-6">
            This reading group may have been removed or does not exist.
          </p>
          <Link to="/groups">
            <Button className="bg-[hsl(var(--brand-primary))] hover:bg-[hsl(var(--brand-primary)/0.9)] text-white">
              Back to Groups Directory
            </Button>
          </Link>
        </Card>
      </div>
    );
  }

  return (
    <>
      <SEO
        title={`${group.name} | Sahadhyayi Reading Group`}
        description={group.description || `Join ${group.name} to read and discuss books together on Sahadhyayi.`}
        canonical={`https://sahadhyayi.com/groups/${group.id}`}
        schema={{
          "@context": "https://schema.org",
          "@type": "CommunityGroup",
          "name": group.name,
          "description": group.description || `Reading and book discussions in ${group.name}.`,
          "url": `https://sahadhyayi.com/groups/${group.id}`,
          "memberCount": memberCount
        }}
      />

      <div className="min-h-screen bg-background py-8 px-4">
        <div className="max-w-4xl mx-auto space-y-6">
          <Breadcrumb items={breadcrumbItems} className="mb-2" />

          {/* Group Header Card */}
          <Card className="border-border overflow-hidden bg-card shadow-xs">
            <div className="h-32 bg-gradient-to-r from-[hsl(var(--brand-primary)/0.2)] via-[hsl(var(--brand-secondary)/0.15)] to-transparent p-6 flex items-end">
              <div className="flex items-center gap-2">
                <span className="p-2 rounded-xl bg-background shadow-xs text-[hsl(var(--brand-primary))]">
                  <Users className="w-6 h-6" />
                </span>
                <Badge variant={isMember ? 'default' : isBanned ? 'destructive' : 'secondary'} className="text-xs">
                  {isMember ? 'Joined Member' : isRequestPending ? 'Request Pending' : isBanned ? 'Blocked' : 'Not Joined'}
                </Badge>
                {requiresInvitation ? (
                  <Badge variant="outline" className="text-xs gap-1 border-amber-500/40 text-amber-600 dark:text-amber-400 bg-background/80">
                    <Lock className="w-3 h-3" /> Invite-Only Group
                  </Badge>
                ) : group.visibility === 'private' ? (
                  <Badge variant="outline" className="text-xs gap-1 border-amber-500/40 text-amber-600 dark:text-amber-400 bg-background/80">
                    <Lock className="w-3 h-3" /> Private Group
                  </Badge>
                ) : group.visibility === 'unlisted' ? (
                  <Badge variant="secondary" className="text-xs gap-1 bg-background/80">Unlisted Group</Badge>
                ) : (
                  <Badge variant="secondary" className="text-xs gap-1 bg-background/80">
                    <Globe className="w-3 h-3 text-muted-foreground" /> Public Group
                  </Badge>
                )}
              </div>
            </div>

            <CardContent className="p-6 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                <div>
                  <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
                    {group.name}
                  </h1>
                  <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5" />
                    {memberCount} {memberCount === 1 ? 'member' : 'members'}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {isMember ? (
                    <>
                      <Button
                        onClick={() => setShowChat(true)}
                        className="bg-[hsl(var(--brand-primary))] hover:bg-[hsl(var(--brand-primary)/0.9)] text-white gap-1.5"
                      >
                        <MessageCircle className="w-4 h-4" />
                        Open Group Chat
                      </Button>

                      {canManageGroup && (
                        <Button
                          variant="outline"
                          onClick={() => void copyInviteLink()}
                          aria-label="Copy group invite link"
                          disabled={createInvitation.isPending}
                          className="gap-1.5 border-border"
                        >
                          {isCopied ? <CheckCircle2 className="w-4 h-4 text-emerald-500" /> : <Share2 className="w-4 h-4" />}
                          {isCopied ? 'Link Copied' : 'Invite'}
                        </Button>
                      )}
                      {!canManageGroup && group.visibility !== 'private' && !requiresInvitation && (
                        <Button variant="outline" onClick={() => void copyGroupPageLink()} className="gap-1.5 border-border">
                          <Share2 className="h-4 w-4" /> Share Group
                        </Button>
                      )}

                      {isDefaultReadingGroup ? (
                      <Badge variant="secondary" className="text-xs">Permanent Community Member</Badge>
                    ) : (
                      <Button
                        variant="ghost"
                        onClick={handleMembership}
                        disabled={leaveGroup.isPending}
                        aria-label="Leave reading group"
                        className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 text-xs"
                      >
                        {leaveGroup.isPending && <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" />}
                        Leave Group
                      </Button>
                    )}
                    </>
                  ) : (
                    <>
                      {isRequestPending ? (
                        <Badge variant="secondary" className="text-xs">Join request pending</Badge>
                      ) : isBanned ? (
                        <Badge variant="destructive" className="text-xs">You cannot join this group</Badge>
                      ) : requiresInvitation ? (
                        <Badge variant="secondary" className="text-xs">An invitation is required to join</Badge>
                      ) : (
                        <Button
                          onClick={handleMembership}
                          disabled={joinGroup.isPending}
                          aria-label="Join reading group"
                          className="bg-[hsl(var(--brand-primary))] hover:bg-[hsl(var(--brand-primary)/0.9)] text-white gap-1.5"
                        >
                          {joinGroup.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
                          Join Group
                        </Button>
                      )}
                      {group.visibility !== 'private' && !requiresInvitation && (
                        <Button
                          variant="outline"
                          onClick={() => void copyGroupPageLink()}
                          aria-label="Share reading group page"
                          className="gap-1.5 border-border"
                        >
                          {isCopied ? <CheckCircle2 className="w-4 h-4 text-emerald-500" /> : <Share2 className="w-4 h-4" />}
                          {isCopied ? 'Link Copied' : 'Share Group'}
                        </Button>
                      )}
                    </>
                  )}
                </div>
              </div>

              {group.description && (
                <div className="pt-2 border-t border-border">
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {group.description}
                  </p>
                </div>
              )}

              {/* Group Quick Links */}
              <div className="flex flex-wrap gap-3 pt-2">
                <Link to="/social?tab=rooms">
                  <Button
                    size="sm"
                    variant="outline"
                    className="border-border hover:border-emerald-500/50 hover:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs gap-1.5"
                  >
                    <Radio className="w-3.5 h-3.5" />
                    Live Reading Rooms
                  </Button>
                </Link>

                <Link to="/library">
                  <Button
                    size="sm"
                    variant="outline"
                    className="border-border text-xs gap-1.5"
                  >
                    <BookOpen className="w-3.5 h-3.5" />
                    Browse Group Books
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>

          {isMember && <GroupReadingBoard groupId={group.id} canManage={canManageGroup} />}
          {isMember && <GroupReadingDiscussions groupId={group.id} canModerate={canManageGroup} />}

          {/* Members List */}
          <Card className="border-border bg-card">
            <CardHeader className="pb-3 border-b border-border">
              <CardTitle className="text-base font-semibold flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-[hsl(var(--brand-primary))]" />
                  Group Members ({activeMembers.length})
                </span>
                {isMember && (
                  <span className="text-xs text-muted-foreground font-normal">
                    You are a member
                  </span>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              {!user?.id ? (
                <p className="text-sm text-muted-foreground py-4 text-center">
                  Sign in to view member profiles.
                </p>
              ) : membersLoading ? (
                <div className="space-y-3 animate-pulse">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-muted" />
                      <div className="h-4 bg-muted rounded w-32" />
                    </div>
                  ))}
                </div>
               ) : activeMembers.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4 text-center">
                  No member profiles loaded yet.
                </p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {activeMembers.map(member => (
                    <div 
                      key={member.id} 
                      className="flex items-center gap-2.5 p-2 rounded-lg bg-muted/30 border border-border/50 hover:bg-muted/60 transition-colors"
                    >
                      <Avatar className="w-8 h-8 shrink-0">
                        <AvatarImage 
                          src={member.user_profile?.profile_photo_url || ''} 
                          alt={member.user_profile?.full_name || 'Member'} 
                        />
                        <AvatarFallback className="text-xs bg-[hsl(var(--brand-primary)/0.1)] text-[hsl(var(--brand-primary))]">
                          {member.user_profile?.full_name?.charAt(0) || 'U'}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-medium text-foreground truncate">
                          {member.user_profile?.full_name || 'Member'}
                        </p>
                        {member.user_profile?.username && (
                          <p className="text-[10px] text-muted-foreground truncate">
                            @{member.user_profile.username}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {canManageGroup && (actorRole === 'owner' || actorRole === 'admin' || actorRole === 'moderator') && (
            <GroupModerationPanel
              groupId={group.id}
              currentUserId={user?.id || ''}
              actorRole={actorRole}
            />
          )}
        </div>
      </div>

      {/* Real-time Group Messaging Dialog */}
      {showChat && (
        <GroupMessaging
          groupId={group.id}
          groupName={group.name}
          isOpen={showChat}
          onClose={() => setShowChat(false)}
        />
      )}
    </>
  );
};

export default GroupDetails;
