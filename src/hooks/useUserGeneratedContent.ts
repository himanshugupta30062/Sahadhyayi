
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client-universal';
import { useAuth } from '@/contexts/authHelpers';

// Use the generated types from Supabase
export type UserGeneratedContent = {
  id: string;
  user_id: string;
  book_id: string | null;
  title: string;
  content: string;
  content_type: string;
  original_chapter_number: number | null;
  is_published: boolean;
  is_approved: boolean;
  created_at: string;
  updated_at: string;
};

export type ContentFeedback = {
  id: string;
  user_id: string;
  content_id: string | null;
  feedback_type: string;
  comment: string | null;
  created_at: string;
};

export type ContentVote = {
  id: string;
  user_id: string;
  content_id: string | null;
  vote_type: string;
  created_at: string;
};

export const useUserGeneratedContent = (bookId?: string) => {
  return useQuery({
    queryKey: ['user_generated_content', bookId],
    queryFn: async () => {
      let query = supabase
        .from('user_generated_content')
        .select('*')
        .eq('is_published', true)
        .order('created_at', { ascending: false });
      
      if (bookId) {
        query = query.eq('book_id', bookId);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
  });
};

export const useCreateUserContent = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (content: Omit<UserGeneratedContent, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
      if (!user) throw new Error('User not authenticated');
      
      const { data, error } = await supabase
        .from('user_generated_content')
        .insert({
          ...content,
          user_id: user.id,
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user_generated_content'] });
    },
  });
};

export const useContentVotes = (contentId: string) => {
  return useQuery({
    queryKey: ['content_votes', contentId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('content_votes')
        .select('*')
        .eq('content_id', contentId);
      
      if (error) throw error;
      return data || [];
    },
  });
};

export const useVoteContent = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (params: { contentId: string; voteType: 'upvote' | 'downvote' }) => {
      if (!user) throw new Error('User not authenticated');
      
      const { data, error } = await supabase
        .from('content_votes')
        .upsert({
          user_id: user.id,
          content_id: params.contentId,
          vote_type: params.voteType,
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['content_votes', variables.contentId] });
    },
  });
};
