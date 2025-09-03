import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client-universal';
import { useAuth } from '@/contexts/authHelpers';
import { useToast } from '@/hooks/use-toast';
import { useEffect } from 'react';

export interface GroupMessage {
  id: string;
  group_id: string;
  sender_id: string;
  content: string;
  message_type: string;
  created_at: string;
  updated_at: string;
  sender?: {
    id: string;
    full_name: string;
    profile_photo_url?: string;
    username?: string;
  };
}

export const useGroupMessages = (groupId: string) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Set up real-time subscription
  useEffect(() => {
    if (!groupId || !user?.id) return;

    const channel = supabase
      .channel(`group-messages-realtime-${groupId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'group_messages',
          filter: `group_id=eq.${groupId}`
        },
        async (payload) => {
          // Fetch the complete message with sender details
          const { data: newMessage } = await supabase
            .from('group_messages')
            .select(`
              *,
              sender:profiles!sender_id(id, full_name, profile_photo_url, username)
            `)
            .eq('id', payload.new.id)
            .single();

          if (newMessage) {
            queryClient.setQueryData<GroupMessage[]>(['group-messages', groupId], (old = []) => {
              // Check if message already exists to avoid duplicates
              if (old.some(msg => msg.id === newMessage.id)) return old;
              return [...old, newMessage];
            });

            // Show notification for messages from others
            if (newMessage.sender_id !== user.id) {
              toast({
                title: 'New Message',
                description: `${newMessage.sender?.full_name || 'Someone'} sent a message`,
              });
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [groupId, user?.id, queryClient, toast]);

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
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: async ({ groupId, content, messageType = 'text' }: { 
      groupId: string; 
      content: string; 
      messageType?: string; 
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user?.id) throw new Error('User not authenticated');
      
      // Check if user is member of the group
      const { data: membership } = await supabase
        .from('group_chat_members')
        .select('id')
        .eq('group_id', groupId)
        .eq('user_id', user.id)
        .single();
      
      if (!membership) {
        throw new Error('You are not a member of this group');
      }
      
      const { data, error } = await supabase
        .from('group_messages')
        .insert([{
          group_id: groupId,
          sender_id: user.id,
          content: content.trim(),
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
      // Don't invalidate - real-time subscription will handle updates
      console.log('Message sent successfully:', data.id);
    },
    onError: (error) => {
      console.error('Error sending message:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to send message. Please try again.',
        variant: 'destructive',
      });
    },
  });
};