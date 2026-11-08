import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/authHelpers';
import { supabase } from '@/integrations/supabase/client-universal';

export type GroupReadingDiscussionType = 'discussion' | 'question' | 'reflection' | 'quote';

export interface GroupReadingDiscussion {
  id: string;
  group_id: string;
  group_reading_book_id: string;
  book_id: string;
  book_title: string;
  chapter_number: number;
  spoiler_chapter: number;
  topic_type: GroupReadingDiscussionType;
  title: string;
  body: string | null;
  is_unlocked: boolean;
  created_by: string;
  author_name: string;
  author_photo_url: string | null;
  created_at: string;
  updated_at: string;
  reply_count: number;
}

export interface GroupReadingDiscussionComment {
  id: string;
  discussion_id: string;
  user_id: string;
  body: string | null;
  spoiler_chapter: number;
  is_unlocked: boolean;
  author_name: string;
  author_photo_url: string | null;
  created_at: string;
}

// Discussion bodies are reader-dependent because the RPC unlocks spoilers per user.
// Keep every cached response isolated by authenticated identity, including during
// account switches that do not emit a SIGNED_OUT event.
const discussionsKey = (groupId: string, userId: string | null) =>
  ['group-reading-discussions', groupId, userId] as const;
const commentsKey = (discussionId: string, userId: string | null) =>
  ['group-reading-discussion-comments', discussionId, userId] as const;

export const useGroupReadingDiscussions = (groupId: string, enabled = false) => {
  const { user } = useAuth();
  const userId = user?.id ?? null;

  return useQuery({
    queryKey: discussionsKey(groupId, userId),
    queryFn: async () => {
      const { data, error } = await supabase.rpc('list_group_reading_discussions', {
        p_group_id: groupId,
        p_limit: 60,
      });
      if (error) throw new Error(error.message || 'Could not load group discussions.');
      return (data ?? []) as GroupReadingDiscussion[];
    },
    enabled: Boolean(groupId && userId && enabled),
    staleTime: 20_000,
  });
};

export const useGroupReadingDiscussionComments = (discussionId: string, enabled = false) => {
  const { user } = useAuth();
  const userId = user?.id ?? null;

  return useQuery({
    queryKey: commentsKey(discussionId, userId),
    queryFn: async () => {
      const { data, error } = await supabase.rpc('list_group_reading_discussion_comments', {
        p_discussion_id: discussionId,
        p_limit: 100,
      });
      if (error) throw new Error(error.message || 'Could not load replies.');
      return (data ?? []) as GroupReadingDiscussionComment[];
    },
    enabled: Boolean(discussionId && userId && enabled),
    staleTime: 15_000,
  });
};

export const useCreateGroupReadingDiscussion = () => {
  const { user } = useAuth();
  const userId = user?.id ?? null;
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      groupId: string;
      groupReadingBookId: string;
      chapterNumber: number;
      spoilerChapter: number;
      topicType: GroupReadingDiscussionType;
      title: string;
      body: string;
    }) => {
      const { data, error } = await supabase.rpc('create_group_reading_discussion', {
        p_group_id: input.groupId,
        p_group_reading_book_id: input.groupReadingBookId,
        p_chapter_number: input.chapterNumber,
        p_spoiler_chapter: input.spoilerChapter,
        p_topic_type: input.topicType,
        p_title: input.title.trim(),
        p_body: input.body.trim(),
      });
      if (error) throw new Error(error.message || 'Could not start this discussion.');
      return data as string;
    },
    onSuccess: (_, input) => {
      void queryClient.invalidateQueries({ queryKey: discussionsKey(input.groupId, userId) });
    },
  });
};

export const useCreateGroupReadingDiscussionComment = () => {
  const { user } = useAuth();
  const userId = user?.id ?? null;
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      groupId: string;
      discussionId: string;
      body: string;
      spoilerChapter: number;
    }) => {
      const { data, error } = await supabase.rpc('create_group_reading_discussion_comment', {
        p_discussion_id: input.discussionId,
        p_body: input.body.trim(),
        p_spoiler_chapter: input.spoilerChapter,
      });
      if (error) throw new Error(error.message || 'Could not add this reply.');
      return data as string;
    },
    onSuccess: (_, input) => {
      void queryClient.invalidateQueries({ queryKey: commentsKey(input.discussionId, userId) });
      void queryClient.invalidateQueries({ queryKey: discussionsKey(input.groupId, userId) });
    },
  });
};

export const useDeleteGroupReadingDiscussion = () => {
  const { user } = useAuth();
  const userId = user?.id ?? null;
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ discussionId }: { groupId: string; discussionId: string }) => {
      const { error } = await supabase.rpc('delete_group_reading_discussion', {
        p_discussion_id: discussionId,
      });
      if (error) throw new Error(error.message || 'Could not remove this discussion.');
    },
    onSuccess: (_, input) => {
      void queryClient.invalidateQueries({ queryKey: discussionsKey(input.groupId, userId) });
    },
  });
};

export const useDeleteGroupReadingDiscussionComment = () => {
  const { user } = useAuth();
  const userId = user?.id ?? null;
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      groupId: string;
      discussionId: string;
      commentId: string;
    }) => {
      const { error } = await supabase.rpc('delete_group_reading_discussion_comment', {
        p_comment_id: input.commentId,
      });
      if (error) throw new Error(error.message || 'Could not remove this reply.');
    },
    onSuccess: (_, input) => {
      void queryClient.invalidateQueries({ queryKey: commentsKey(input.discussionId, userId) });
      void queryClient.invalidateQueries({ queryKey: discussionsKey(input.groupId, userId) });
    },
  });
};
