import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface AuthorQuestion {
  id: string;
  author_id: string;
  user_id: string;
  question: string;
  answer?: string;
  is_answered: boolean;
  is_published: boolean;
  created_at: string;
  updated_at: string;
  answered_at?: string;
}

export const useAuthorQuestions = (authorId?: string) => {
  return useQuery({
    queryKey: ['author-questions', authorId],
    enabled: !!authorId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('author_questions')
        .select('*')
        .eq('author_id', authorId)
        .eq('is_published', true)
        .eq('is_answered', true)
        .order('answered_at', { ascending: false });

      if (error) throw error;
      return data as AuthorQuestion[];
    },
  });
};

export const useAskQuestion = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ authorId, question }: { authorId: string; question: string }) => {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error('You must be logged in to ask questions');

      const { data, error } = await supabase
        .from('author_questions')
        .insert([{
          author_id: authorId,
          user_id: userData.user.id,
          question: question.trim(),
        }])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast({
        title: "Question submitted!",
        description: "Your question has been sent to the author.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to submit question",
        variant: "destructive",
      });
    },
  });
};

export const useAnswerQuestion = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ questionId, answer }: { questionId: string; answer: string }) => {
      const { data, error } = await supabase
        .from('author_questions')
        .update({
          answer: answer.trim(),
          is_answered: true,
          answered_at: new Date().toISOString(),
        })
        .eq('id', questionId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['author-questions', data.author_id] });
      toast({
        title: "Question answered!",
        description: "Your answer has been published.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to answer question",
        variant: "destructive",
      });
    },
  });
};

export const useAuthorPendingQuestions = (authorId?: string) => {
  return useQuery({
    queryKey: ['author-pending-questions', authorId],
    enabled: !!authorId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('author_questions')
        .select('*')
        .eq('author_id', authorId)
        .eq('is_answered', false)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as AuthorQuestion[];
    },
  });
};