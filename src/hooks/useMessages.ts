
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface PrivateMessage {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  is_read: boolean;
  created_at: string;
  sender_profile?: {
    id: string;
    full_name: string;
    profile_photo_url?: string;
  };
}

export interface GroupMessage {
  id: string;
  group_id: string;
  sender_id: string;
  content: string;
  created_at: string;
  sender_profile?: {
    id: string;
    full_name: string;
    profile_photo_url?: string;
  };
}

export const usePrivateMessages = (friendId: string) => {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['private-messages', user?.id, friendId],
    queryFn: async () => {
      if (!user?.id || !friendId) return [];
      
      const { data, error } = await supabase
        .from('private_messages')
        .select(`
          *,
          sender_profile:profiles!sender_id(id, full_name, profile_photo_url)
        `)
        .or(`and(sender_id.eq.${user.id},receiver_id.eq.${friendId}),and(sender_id.eq.${friendId},receiver_id.eq.${user.id})`)
        .order('created_at', { ascending: true });
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id && !!friendId,
  });
};

export const useSendPrivateMessage = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ receiverId, content }: { receiverId: string; content: string }) => {
      const { data, error } = await supabase
        .from('private_messages')
        .insert([{
          sender_id: (await supabase.auth.getUser()).data.user?.id,
          receiver_id: receiverId,
          content,
          message_type: 'text'
        }])
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['private-messages'] });
    },
  });
};

export const useGroupMessages = (groupId: string) => {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['group-messages', groupId],
    queryFn: async () => {
      if (!groupId) return [];
      
      const { data, error } = await supabase
        .from('group_messages')
        .select(`
          *,
          sender_profile:profiles!sender_id(id, full_name, profile_photo_url)
        `)
        .eq('group_id', groupId)
        .order('created_at', { ascending: true });
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!groupId && !!user?.id,
  });
};

export const useSendGroupMessage = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ groupId, content }: { groupId: string; content: string }) => {
      const { data, error } = await supabase
        .from('group_messages')
        .insert([{
          group_id: groupId,
          sender_id: (await supabase.auth.getUser()).data.user?.id,
          content,
          message_type: 'text'
        }])
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['group-messages', variables.groupId] });
    },
  });
};
