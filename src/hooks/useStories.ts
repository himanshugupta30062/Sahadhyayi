
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client-universal';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';

interface Story {
  id: string;
  title: string;
  content: string | null;
  description: string | null;
  format: string | null;
  audio_url: string | null;
  created_at: string;
  user_id: string;
}

export const useStories = () => {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['stories', user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      const { data, error } = await supabase
        .from('stories')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as Story[];
    },
    enabled: !!user,
  });
};

export const useCreateStory = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (story: Omit<Story, 'id' | 'created_at' | 'user_id'>) => {
      if (!user) throw new Error('No user');

      const { data, error } = await supabase
        .from('stories')
        .insert({ ...story, user_id: user.id })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stories'] });
      toast({ title: 'Story Created', description: 'Your story has been saved!' });
    },
  });
};

export const useDeleteStory = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (storyId: string) => {
      const { error } = await supabase
        .from('stories')
        .delete()
        .eq('id', storyId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stories'] });
      toast({ title: 'Story Deleted', description: 'The story has been removed.' });
    },
  });
};
