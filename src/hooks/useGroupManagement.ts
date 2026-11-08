import { useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client-universal';
import { useAuth } from '@/contexts/authHelpers';
import { toast } from 'sonner';
import { uniqueChannelName } from '@/lib/realtime';

export const DEFAULT_READING_GROUP_NAME = 'Sahadhyayi Community Reading Circle';

export interface Group {
  id: string;
  name: string;
  description?: string | null;
  image_url?: string | null;
  created_by: string | null;
  created_at: string | null;
  member_count?: number;
  user_role?: 'owner' | 'admin' | 'moderator' | 'member';
  group_members?: { count: number }[];
  is_encrypted?: boolean | null;
  visibility?: 'public' | 'private' | 'unlisted' | null;
  join_policy?: 'open' | 'approval' | 'invite_only' | null;
}

export interface GroupChat {
  id: string;
  name: string;
  description?: string;
  image_url?: string;
  created_by: string;
  created_at: string;
  member_count?: number;
  user_role?: 'admin' | 'member';
}

export const useGroups = (options: { enabled?: boolean } = {}) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const enabled = options.enabled ?? true;
  const userId = user?.id;
  const queryEnabled = enabled && Boolean(user?.id);

  useEffect(() => {
    if (!queryEnabled || !userId) return;

    const refreshGroups = () => {
      void queryClient.invalidateQueries({ queryKey: ['all-groups'] });
      void queryClient.invalidateQueries({ queryKey: ['user-groups'] });
      void queryClient.invalidateQueries({ queryKey: ['user-joined-groups'] });
    };

    const channel = supabase
      .channel(uniqueChannelName(`reading-groups-directory-${userId}`))
      .on('postgres_changes', { event: '*', schema: 'public', table: 'group_chats' }, refreshGroups)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'group_chat_members' }, refreshGroups)
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [queryClient, userId, queryEnabled]);

  return useQuery({
    queryKey: ['all-groups', userId],
    queryFn: async () => {
      if (!user?.id) {
        throw new Error('Sign in to browse reading groups.');
      }

      const { data, error } = await supabase
        .from('group_chats')
        .select(`
          *,
          group_members:group_chat_members(count)
        `)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Failed to load reading groups:', error);
        throw error;
      }

      // An empty result is a genuine empty state. Never replace backend failures or
      // zero rows with hard-coded demo groups and fabricated member counts.
      return data ?? [];
    },
    enabled: queryEnabled,
  });
};

export const useCreateGroup = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      name,
      description,
      isPrivate,
      visibility,
      joinPolicy,
      category,
      languageCode,
      rules,
    }: {
      name: string;
      description?: string;
      isPrivate?: boolean;
      visibility?: 'public' | 'private' | 'unlisted';
      joinPolicy?: 'open' | 'approval' | 'invite_only';
      category?: string;
      languageCode?: string;
      rules?: string;
    }) => {
      const sanitizedName = name.trim();
      if (!sanitizedName) throw new Error('Group name is required');

      const resolvedVisibility = visibility ?? (isPrivate ? 'private' : 'public');
      const resolvedJoinPolicy = joinPolicy ?? (resolvedVisibility === 'private' ? 'invite_only' : 'open');
      if (resolvedVisibility === 'private' && resolvedJoinPolicy === 'open') {
        throw new Error('Private groups cannot allow open joining.');
      }

      const { data, error } = await supabase.rpc('create_reading_group', {
        p_name: sanitizedName,
        p_description: description?.trim() || null,
        p_visibility: resolvedVisibility,
        p_join_policy: resolvedJoinPolicy,
        p_category: category?.trim() || null,
        p_language_code: languageCode?.trim() || null,
        p_rules: rules?.trim() || null,
      });
      if (error) throw new Error(error.message || 'Failed to create reading group.');
      return data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['user-groups'] });
      void queryClient.invalidateQueries({ queryKey: ['all-groups'] });
      void queryClient.invalidateQueries({ queryKey: ['user-joined-groups'] });
    },
  });
};

export const useJoinGroup = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (groupId: string) => {
      if (!groupId) throw new Error('Group ID is required');
      const { data, error } = await supabase.rpc('request_or_join_reading_group', {
        p_group_id: groupId,
      });
      if (error) throw new Error(error.message || 'Unable to join/request access to this group.');
      return data as 'active' | 'pending';
    },
    onSuccess: (status) => {
      toast.success(status === 'pending' ? 'Join request sent for approval.' : 'Successfully joined the group!');
      void queryClient.invalidateQueries({ queryKey: ['user-groups'] });
      void queryClient.invalidateQueries({ queryKey: ['all-groups'] });
      void queryClient.invalidateQueries({ queryKey: ['user-joined-groups'] });
    },
    onError: (error: Error) => {
      toast.error(`Failed to join group: ${error.message}`);
    },
  });
};

export const useLeaveGroup = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (groupId: string) => {
      if (!groupId) throw new Error('Group ID is required');
      const { error } = await supabase.rpc('leave_reading_group', { p_group_id: groupId });
      if (error) throw new Error(error.message || 'Unable to leave this group.');
    },
    onSuccess: () => {
      toast.success('Successfully left the group');
      void queryClient.invalidateQueries({ queryKey: ['user-groups'] });
      void queryClient.invalidateQueries({ queryKey: ['all-groups'] });
      void queryClient.invalidateQueries({ queryKey: ['user-joined-groups'] });
    },
    onError: (error: Error) => {
      toast.error(`Failed to leave group: ${error.message}`);
    },
  });
};

export const useAddGroupMember = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ groupId, userId }: { groupId: string; userId: string }) => {
      const { data, error } = await supabase
        .from('group_chat_members')
        .insert([{
          group_id: groupId,
          user_id: userId,
          role: 'member'
        }])
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      void queryClient.invalidateQueries({ queryKey: ['group-members', variables.groupId] });
    },
  });
};

export const useUpdateGroup = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ groupId, name, description }: { groupId: string; name?: string; description?: string | null }) => {
      const updates: Record<string, unknown> = {};
      if (name !== undefined) {
        const sanitizedName = name.trim();
        if (!sanitizedName) throw new Error('Group name is required');
        updates.name = sanitizedName;
      }
      if (description !== undefined) updates.description = (description ?? '').toString().trim() || null;
      if (Object.keys(updates).length === 0) return;
      const { error } = await supabase.from('group_chats').update(updates).eq('id', groupId);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Group updated');
      void queryClient.invalidateQueries({ queryKey: ['all-groups'] });
      void queryClient.invalidateQueries({ queryKey: ['user-groups'] });
      void queryClient.invalidateQueries({ queryKey: ['user-joined-groups'] });
    },
    onError: (error: Error) => toast.error(`Failed to update group: ${error.message}`),
  });
};

export const useDeleteGroup = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (groupId: string) => {
      const { error } = await supabase.from('group_chats').delete().eq('id', groupId);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Group deleted');
      void queryClient.invalidateQueries({ queryKey: ['all-groups'] });
      void queryClient.invalidateQueries({ queryKey: ['user-groups'] });
      void queryClient.invalidateQueries({ queryKey: ['user-joined-groups'] });
    },
    onError: (error: Error) => toast.error(`Failed to delete group: ${error.message}`),
  });
};

/** Creates a high-entropy invitation credential; the database stores only its digest. */
export const useCreateGroupInvitation = () => {
  return useMutation({
    mutationFn: async ({ groupId, expiresInDays = 7, maxUses }: { groupId: string; expiresInDays?: number; maxUses?: number }) => {
      if (!groupId) throw new Error('Group ID is required');
      if (!Number.isInteger(expiresInDays) || expiresInDays < 1 || expiresInDays > 90) {
        throw new Error('Invitation expiry must be between 1 and 90 days.');
      }
      const bytes = new Uint8Array(32);
      crypto.getRandomValues(bytes);
      const token = Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');
      const expiresAt = new Date(Date.now() + expiresInDays * 86400000).toISOString();
      const { data, error } = await supabase.rpc('create_reading_group_invitation', {
        p_group_id: groupId,
        p_token: token,
        p_expires_at: expiresAt,
        p_max_uses: maxUses ?? null,
      });
      if (error) throw new Error(error.message || 'Could not create invitation.');
      return { token, invitationId: data as string, expiresAt };
    },
  });
};

/** Redeems an invitation token; only the token is sent to the server. */
export const useRedeemGroupInvitation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (token: string) => {
      if (!token || token.length !== 64 || !/^[a-f0-9]+$/i.test(token)) {
        throw new Error('This invitation link is invalid.');
      }
      const { data, error } = await supabase.rpc('redeem_reading_group_invitation', { p_token: token });
      if (error) throw new Error(error.message || 'Invitation could not be redeemed.');
      return data as 'active';
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['user-groups'] });
      void queryClient.invalidateQueries({ queryKey: ['all-groups'] });
      void queryClient.invalidateQueries({ queryKey: ['user-joined-groups'] });
    },
  });
};

export const useModerateGroupMember = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ groupId, userId, action }: {
      groupId: string; userId: string; action: 'approve' | 'reject' | 'ban' | 'unban';
    }) => {
      const { data, error } = await supabase.rpc('moderate_reading_group_member', {
        p_group_id: groupId, p_user_id: userId, p_action: action,
      });
      if (error) throw new Error(error.message || 'Membership moderation failed.');
      return data;
    },
    onSuccess: (_, variables) => {
      void queryClient.invalidateQueries({ queryKey: ['group-members', variables.groupId] });
      void queryClient.invalidateQueries({ queryKey: ['group-moderation-members', variables.groupId] });
      void queryClient.invalidateQueries({ queryKey: ['user-groups'] });
      void queryClient.invalidateQueries({ queryKey: ['user-joined-groups'] });
    },
    onError: (error: Error) => toast.error(error.message),
  });
};

export interface GroupModerationMember {
  membership_id: string;
  user_id: string;
  role: 'owner' | 'admin' | 'moderator' | 'member';
  status: 'pending' | 'active' | 'banned';
  joined_at: string | null;
  full_name: string | null;
  username: string | null;
  profile_photo_url: string | null;
}

/** Returns private membership details only through the moderator-authorized RPC. */
export const useGroupModerationMembers = (groupId: string, enabled = false) => {
  return useQuery({
    queryKey: ['group-moderation-members', groupId],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_reading_group_moderation_members', {
        p_group_id: groupId,
      });
      if (error) throw new Error(error.message || 'Could not load group moderation details.');
      return (data ?? []) as GroupModerationMember[];
    },
    enabled: Boolean(groupId && enabled),
  });
};

export const useSetGroupMemberRole = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ groupId, userId, role }: {
      groupId: string;
      userId: string;
      role: 'admin' | 'moderator' | 'member';
    }) => {
      const { data, error } = await supabase.rpc('set_reading_group_member_role', {
        p_group_id: groupId,
        p_user_id: userId,
        p_role: role,
      });
      if (error) throw new Error(error.message || 'Could not update member role.');
      return data as string;
    },
    onSuccess: (_, variables) => {
      void queryClient.invalidateQueries({ queryKey: ['group-moderation-members', variables.groupId] });
      void queryClient.invalidateQueries({ queryKey: ['group-members', variables.groupId] });
      void queryClient.invalidateQueries({ queryKey: ['user-groups'] });
      void queryClient.invalidateQueries({ queryKey: ['user-joined-groups'] });
    },
    onError: (error: Error) => toast.error(error.message),
  });
};

export const useTransferGroupOwnership = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ groupId, newOwnerId }: { groupId: string; newOwnerId: string }) => {
      const { error } = await supabase.rpc('transfer_reading_group_ownership', {
        p_group_id: groupId,
        p_new_owner_id: newOwnerId,
      });
      if (error) throw new Error(error.message || 'Could not transfer group ownership.');
    },
    onSuccess: (_, variables) => {
      void queryClient.invalidateQueries({ queryKey: ['group-moderation-members', variables.groupId] });
      void queryClient.invalidateQueries({ queryKey: ['group-members', variables.groupId] });
      void queryClient.invalidateQueries({ queryKey: ['user-groups'] });
      void queryClient.invalidateQueries({ queryKey: ['user-joined-groups'] });
      void queryClient.invalidateQueries({ queryKey: ['all-groups'] });
    },
    onError: (error: Error) => toast.error(error.message),
  });
};
