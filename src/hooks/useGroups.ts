
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

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

export interface GroupMember {
  id: string;
  group_id: string;
  user_id: string;
  role: 'admin' | 'member';
  joined_at: string;
  user_profile?: {
    full_name: string;
    profile_photo_url?: string;
    username?: string;
  };
}

export const useUserGroups = () => {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['user-groups', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const { data, error } = await supabase
        .from('group_chat_members')
        .select(`
          role,
          group_chats (
            id,
            name,
            description,
            image_url,
            created_by,
            created_at
          )
        `)
        .eq('user_id', user.id);
      
      if (error) throw error;
      
      return data.map(item => ({
        ...item.group_chats,
        user_role: item.role
      })) as GroupChat[];
    },
    enabled: !!user?.id,
  });
};

export const useCreateGroup = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ name, description }: { name: string; description?: string }) => {
      const userId = (await supabase.auth.getUser()).data.user?.id;
      if (!userId) throw new Error('User not authenticated');
      
      // Create group
      const { data: group, error: groupError } = await supabase
        .from('group_chats')
        .insert([{
          name,
          description,
          created_by: userId
        }])
        .select()
        .single();
      
      if (groupError) throw groupError;
      
      // Add creator as admin
      const { error: memberError } = await supabase
        .from('group_chat_members')
        .insert([{
          group_id: group.id,
          user_id: userId,
          role: 'admin'
        }]);
      
      if (memberError) throw memberError;
      
      return group;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-groups'] });
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
      queryClient.invalidateQueries({ queryKey: ['group-members', variables.groupId] });
    },
  });
};

export const useGroupMembers = (groupId: string) => {
  return useQuery({
    queryKey: ['group-members', groupId],
    queryFn: async () => {
      if (!groupId) return [];
      
      const { data, error } = await supabase
        .from('group_chat_members')
        .select(`
          *,
          user_profile:profiles!user_id(full_name, profile_photo_url, username)
        `)
        .eq('group_id', groupId);
      
      if (error) throw error;
      return data as GroupMember[];
    },
    enabled: !!groupId,
  });
};
