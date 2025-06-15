
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

// Types for user_profile
export interface UserProfile {
  id: string;
  name: string | null;
  username: string | null;
  email: string | null;
  profile_picture_url: string | null;
  bio: string | null;
  dob: string | null;
  gender: 'male' | 'female' | 'other' | null;
  location: string | null;
  writing_frequency: string | null;
  stories_written_count: number | null;
  stories_read_count: number | null;
  joined_at: string | null;
  life_tags: string[] | null;
  social_links: Record<string, string> | null;
  deleted: boolean | null;
  last_updated: string | null;
}

export const useUserProfile = () => {
  const { user } = useAuth();
  return useQuery<UserProfile | null>({
    queryKey: ['user_profile', user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data, error } = await supabase
        .from('user_profile')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();
      if (error) throw error;
      return data as UserProfile;
    },
    enabled: !!user,
  });
};

export const useUpsertUserProfile = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (updates: Partial<UserProfile>) => {
      if (!user) throw new Error('No user');
      // Upsert merges by primary key
      const { data, error } = await supabase
        .from('user_profile')
        .upsert({ ...updates, id: user.id }, { onConflict: 'id' })
        .select()
        .single();
      if (error) throw error;
      return data as UserProfile;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user_profile'] });
    },
  });
};

export const useDeleteUserProfile = () => {
  // Soft delete by setting "deleted" to TRUE
  const queryClient = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async () => {
      if (!user) throw new Error('No user');
      const { error } = await supabase
        .from('user_profile')
        .update({ deleted: true })
        .eq('id', user.id);
      if (error) throw error;
      return;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user_profile'] });
    },
  });
};

// Profile picture upload helper (uses Supabase Storage)
export async function uploadProfilePicture(file: File, userId: string) {
  // Create a public bucket 'avatars' if not present
  const bucket = 'avatars';
  const filePath = `${userId}/${Date.now()}_${file.name}`;
  // Ensure file type is image
  if (!file.type.startsWith('image/')) throw new Error('Only image uploads allowed');
  const { error } = await supabase.storage.createBucket(bucket, { public: true }).catch(() => ({ error: null }));
  const { data, error: uploadError } = await supabase.storage
    .from(bucket)
    .upload(filePath, file, { upsert: true });
  if (uploadError) throw uploadError;
  const imageUrl = supabase.storage.from(bucket).getPublicUrl(filePath).data.publicUrl;
  return imageUrl;
}
