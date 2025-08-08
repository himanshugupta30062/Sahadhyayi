import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client-universal';

export const useGroupMessages = (groupId: string) => {
  return useQuery({
    queryKey: ['group-messages', groupId],
    queryFn: async () => {
      if (!groupId) return [];
      
      const { data, error } = await supabase
        .from('group_messages')
        .select(`
          *,
          sender:profiles!sender_id(id, full_name, profile_photo_url, username)
        `)
        .eq('group_id', groupId)
        .order('created_at', { ascending: true })
        .limit(100);
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!groupId,
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
          user_profile:profiles!user_id(id, full_name, profile_photo_url, username)
        `)
        .eq('group_id', groupId);
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!groupId,
  });
};

export const useSendMessage = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ groupId, content, messageType = 'text' }: { 
      groupId: string; 
      content: string; 
      messageType?: string; 
    }) => {
      const userId = (await supabase.auth.getUser()).data.user?.id;
      if (!userId) throw new Error('User not authenticated');
      
      const { data, error } = await supabase
        .from('group_messages')
        .insert([{
          group_id: groupId,
          sender_id: userId,
          content,
          message_type: messageType,
        }])
        .select(`
          *,
          sender:profiles!sender_id(id, full_name, profile_photo_url, username)
        `)
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['group-messages', data.group_id] });
    },
  });
};