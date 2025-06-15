import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

// Profile fields as stored in the Supabase `profiles` table
// Includes additional columns from recent database changes
export interface Profile {
  id: string;
  full_name: string | null;
  username: string | null;
  email?: string | null; // Optional: not in table, but sometimes useful
  profile_photo_url: string | null;
  avatar_url?: string | null; // Kept for legacy/compat
  bio: string | null;
  writing_frequency: string | null;
  stories_written_count: number | null;
  stories_read_count: number | null;
  tags_used: string[] | null; // jsonb array of tags
  created_at: string;
  updated_at: string | null;
  // The following fields are unused/substituted for legacy reasons — fill or omit as needed:
  notification_settings?: Record<string, unknown> | null;
}

export const useProfile = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['profile', user?.id],
    queryFn: async () => {
      if (!user) return null;

      const { data, error } = await supabase
        .from('profiles')
        .select(`
          id, full_name, username, profile_photo_url, avatar_url, bio, writing_frequency,
          stories_written_count, stories_read_count, tags_used, created_at, updated_at
        `)
        .eq('id', user.id)
        .maybeSingle();

      if (error) throw error;
      if (!data || typeof data !== 'object') return null;

      // Only spread if data is a non-null object
      return Object.assign({}, data, { notification_settings: undefined }) as Profile;
    },
    enabled: !!user,
  });
};

export const useUpdateProfile = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (updates: Partial<Profile>) => {
      if (!user) throw new Error('No user');

      const { data, error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', user.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
    },
  });
};
