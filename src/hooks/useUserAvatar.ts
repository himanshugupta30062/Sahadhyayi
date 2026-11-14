import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client-universal';
import { useAuth } from '@/contexts/authHelpers';

export interface UserAvatar {
  id: string;
  user_id: string;
  avatar_json?: Record<string, unknown>;
  avatar_img_url?: string;
  created_at: string;
  updated_at: string;
}

const toAvatarError = (error: unknown, fallback: string): Error => {
  if (error instanceof Error) return error;
  if (error && typeof error === 'object' && typeof (error as Record<string, unknown>).message === 'string') {
    return new Error(String((error as Record<string, unknown>).message));
  }
  return new Error(fallback);
};

const parseAvatar = (value: unknown): UserAvatar | null => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  const avatar = value as Record<string, unknown>;
  if (typeof avatar.user_id !== 'string' || typeof avatar.id !== 'string') return null;

  return {
    id: avatar.id,
    user_id: avatar.user_id,
    avatar_json: avatar.avatar_json && typeof avatar.avatar_json === 'object'
      ? avatar.avatar_json as Record<string, unknown>
      : undefined,
    avatar_img_url: typeof avatar.avatar_img_url === 'string' ? avatar.avatar_img_url : undefined,
    created_at: typeof avatar.created_at === 'string' ? avatar.created_at : '',
    updated_at: typeof avatar.updated_at === 'string' ? avatar.updated_at : '',
  };
};

/** Reads only the signed-in user's avatar through an owner-scoped RPC. */
export const useUserAvatar = (userId?: string) => {
  const { user } = useAuth();
  const targetUserId = userId || user?.id;

  return useQuery({
    queryKey: ['user-avatar', targetUserId],
    queryFn: async () => {
      if (!targetUserId || !user?.id || targetUserId !== user.id) return null;

      const { data, error } = await supabase.rpc('get_my_avatar');
      if (error) throw toAvatarError(error, 'Could not load your saved reading avatar.');
      return parseAvatar(data);
    },
    enabled: !!targetUserId && !!user?.id && targetUserId === user.id,
    staleTime: 60_000,
    refetchOnWindowFocus: false,
  });
};

export const useUpdateUserAvatar = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (avatarData: { avatar_json: Record<string, unknown>; avatar_img_url: string }) => {
      if (!user?.id) throw new Error('Sign in to save your reading avatar.');

      const { data, error } = await supabase.rpc('save_my_avatar', {
        p_avatar_json: avatarData.avatar_json as never,
        p_avatar_img_url: avatarData.avatar_img_url,
      });

      if (error) throw toAvatarError(error, 'Could not save your reading avatar.');
      const savedAvatar = parseAvatar(data);
      if (!savedAvatar) throw new Error('The avatar was saved but the server returned an invalid avatar record.');
      return savedAvatar;
    },
    onSuccess: (avatar) => {
      queryClient.setQueryData(['user-avatar', user?.id], avatar);
      void queryClient.invalidateQueries({ queryKey: ['user-avatar', user?.id] });
    },
  });
};
