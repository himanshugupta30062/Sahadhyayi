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
  user_role?: 'admin' | 'member';
  group_members?: { count: number }[];
  is_encrypted?: boolean | null;
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
