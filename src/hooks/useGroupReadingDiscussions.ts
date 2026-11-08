import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
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

const discussionsKey = (groupId: string) => ['group-reading-discussions', groupId] as const;
const commentsKey = (discussionId: string) => ['group-reading-discussion-comments', discussionId] as const;

export const useGroupReadingDiscussions = (groupId: string, enabled = false) =>
  useQuery({
    queryKey: discussionsKey(groupId),
    queryFn: async () => {
      const { data, error } = await supabase.rpc('list_group_reading_discussions', {
        p_group_id: groupId,
        p_limit: 60,
      });
      if (error) throw new Error(error.message || 'Could not load group discussions.');
      return (data ?? []) as GroupReadingDiscussion[];
    },
    enabled: Boolean(groupId && enabled),
    staleTime: 20_000,
  });

export const useGroupReadingDiscussionComments = (discussionId: string, enabled = false) =>
  useQuery({
    queryKey: commentsKey(discussionId),
    queryFn: async () => {
      const { data, error } = await supabase.rpc('list_group_reading_discussion_comments', {
        p_discussion_id: discussionId,
        p_limit: 100,
      });
      if (error) throw new Error(error.message || 'Could not load replies.');
      return (data ?? []) as GroupReadingDiscussionComment[];
    },
    enabled: Boolean(discussionId && enabled),
    staleTime: 15_000,
  });

export const useCreateGroupReadingDiscussion = () => {
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
      void queryClient.invalidateQueries({ queryKey: discussionsKey(input.groupId) });
    },
  });
};

export const useCreateGroupReadingDiscussionComment = () => {
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
      void queryClient.invalidateQueries({ queryKey: commentsKey(input.discussionId) });
      void queryClient.invalidateQueries({ queryKey: discussionsKey(input.groupId) });
    },
  });
};

export const useDeleteGroupReadingDiscussion = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ discussionId }: { groupId: string; discussionId: string }) => {
      const { error } = await supabase.rpc('delete_group_reading_discussion', {
        p_discussion_id: discussionId,
      });
      if (error) throw new Error(error.message || 'Could not remove this discussion.');
    },
    onSuccess: (_, input) => {
      void queryClient.invalidateQueries({ queryKey: discussionsKey(input.groupId) });
    },
  });
};

export const useDeleteGroupReadingDiscussionComment = () => {
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
      void queryClient.invalidateQueries({ queryKey: commentsKey(input.discussionId) });
      void queryClient.invalidateQueries({ queryKey: discussionsKey(input.groupId) });
    },
  });
};
