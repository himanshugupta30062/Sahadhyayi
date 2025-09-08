import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client-universal';
import { useAuth } from '@/contexts/authHelpers';

export interface Group {
  id: string;
  name: string;
  description?: string;
  image_url?: string;
  created_by: string;
  created_at: string;
  member_count?: number;
  user_role?: 'admin' | 'member';
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

export const useGroups = () => {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['all-groups', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('group_chats')
        .select(`
          *,
          group_members:group_chat_members(count)
        `)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      return data || [];
    },
  });
};

export const useCreateGroup = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ name, description }: { name: string; description?: string }) => {
      console.log('Creating group:', { name, description });
      
      // Check authentication first
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError) {
        console.error('Auth error:', authError);
        throw new Error('Authentication error: ' + authError.message);
      }
      
      if (!user?.id) {
        console.error('No user found');
        throw new Error('Please sign in to create a group');
      }
      
      console.log('User authenticated:', user.id);
      
      // Create group
      const { data: group, error: groupError } = await supabase
        .from('group_chats')
        .insert([{
          name,
          description,
          created_by: user.id
        }])
        .select()
        .single();
      
      if (groupError) {
        console.error('Group creation error:', groupError);
        throw new Error('Failed to create group: ' + groupError.message);
      }
      
      console.log('Group created:', group);
      
      // Add creator as admin
      const { error: memberError } = await supabase
        .from('group_chat_members')
        .insert([{
          group_id: group.id,
          user_id: user.id,
          role: 'admin'
        }]);
      
      if (memberError) {
        console.error('Member creation error:', memberError);
        throw new Error('Failed to add creator as admin: ' + memberError.message);
      }
      
      console.log('Creator added as admin');
      return group;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-groups'] });
      queryClient.invalidateQueries({ queryKey: ['all-groups'] });
      queryClient.invalidateQueries({ queryKey: ['user-joined-groups'] });
    },
  });
};

export const useJoinGroup = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (groupId: string) => {
      const userId = (await supabase.auth.getUser()).data.user?.id;
      if (!userId) throw new Error('User not authenticated');
      
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-groups'] });
      queryClient.invalidateQueries({ queryKey: ['all-groups'] });
      queryClient.invalidateQueries({ queryKey: ['user-joined-groups'] });
    },
  });
};

export const useLeaveGroup = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (groupId: string) => {
      const userId = (await supabase.auth.getUser()).data.user?.id;
      if (!userId) throw new Error('User not authenticated');
      
      const { error } = await supabase
        .from('group_chat_members')
        .delete()
        .eq('group_id', groupId)
        .eq('user_id', userId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-groups'] });
      queryClient.invalidateQueries({ queryKey: ['all-groups'] });
      queryClient.invalidateQueries({ queryKey: ['user-joined-groups'] });
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