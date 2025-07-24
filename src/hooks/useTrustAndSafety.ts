import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export const useBlockedUsers = () => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['blocked-users', user?.id],
    queryFn: async () => {
      if (!user?.id) return [] as string[];
      const { data, error } = await supabase
        .from('friendships')
        .select('requester_id, addressee_id')
        .or(`and(requester_id.eq.${user.id},status.eq.blocked),and(addressee_id.eq.${user.id},status.eq.blocked)`);
      if (error) throw error;
      return (
        data?.map((r: any) => (r.requester_id === user.id ? r.addressee_id : r.requester_id)) ?? []
      );
    },
    enabled: !!user?.id,
  });
};

export const useBlockUser = (targetId?: string) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      if (!user?.id || !targetId) throw new Error('Not authenticated');
      const { data } = await supabase
        .from('friendships')
        .select('id')
        .eq('requester_id', user.id)
        .eq('addressee_id', targetId)
        .single();
      if (data) {
        const { error } = await supabase
          .from('friendships')
          .update({ status: 'blocked' })
          .eq('id', data.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('friendships')
          .insert({ requester_id: user.id, addressee_id: targetId, status: 'blocked' });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['blocked-users', user?.id] });
      toast.success('User blocked');
    },
    onError: (err) => {
      console.error('Error blocking user:', err);
      toast.error('Failed to block user');
    },
  });
};

export const useReportContent = () => {
  const { user } = useAuth();
  return useMutation({
    mutationFn: async ({ contentId, contentType, reason }: { contentId: string; contentType: 'post' | 'message'; reason: string }) => {
      if (!user?.id) throw new Error('Not authenticated');
      const { error } = await supabase.from('content_reports').insert({
        reporter_id: user.id,
        content_id: contentId,
        content_type: contentType,
        reason,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Report submitted');
    },
    onError: (err) => {
      console.error('Error reporting content:', err);
      toast.error('Failed to submit report');
    },
  });
};
