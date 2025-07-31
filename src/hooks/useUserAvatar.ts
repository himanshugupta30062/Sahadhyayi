
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface UserAvatar {
  id: string;
  user_id: string;
  avatar_json?: Record<string, unknown>;
  avatar_img_url?: string;
  created_at: string;
  updated_at: string;
}

export const useUserAvatar = (userId?: string) => {
  const { user } = useAuth();
  const targetUserId = userId || user?.id;

  return useQuery({
    queryKey: ['user-avatar', targetUserId],
    queryFn: async () => {
      if (!targetUserId) return null;

      const { data, error } = await supabase
        .from('user_avatars')
        .select('*')
        .eq('user_id', targetUserId)
        .maybeSingle();

      if (error) throw error;
      return data as UserAvatar | null;
    },
    enabled: !!targetUserId,
  });
};

export const useUpdateUserAvatar = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (avatarData: { avatar_json?: Record<string, unknown>; avatar_img_url?: string }) => {
      if (!user) throw new Error('No authenticated user');

      const { data, error } = await supabase
        .from('user_avatars')
        .upsert({
          user_id: user.id,
          ...avatarData,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-avatar'] });
    },
  });
};
