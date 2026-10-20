import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client-universal';
import { useAuth } from '@/contexts/authHelpers';
import { useToast } from '@/hooks/use-toast';
import { useCallback, useEffect, useState } from 'react';
import { uniqueChannelName } from '@/lib/realtime';

const SOCIAL_POST_PAGE_SIZE = 25;

export interface SocialPost {
  id: string;
  user_id: string;
  content: string;
  image_url?: string;
  book_id?: string;
  feeling_emoji?: string;
  feeling_label?: string;
  created_at: string;
  updated_at: string;
  likes_count: number;
  comments_count: number;
  reposts_count?: number;
  repost_of_id?: string | null;
  profiles?: {
    id: string;
    full_name?: string;
    username?: string;
    profile_photo_url?: string;
  };
  books_library?: {
    id: string;
    title: string;
    author?: string;
    cover_image_url?: string;
  };
  reposted_post?: SocialPost | null;
  user_liked?: boolean;
  user_reposted?: boolean;
}

export const useSocialPosts = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [hasMore, setHasMore] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [loadMoreError, setLoadMoreError] = useState<Error | null>(null);

  // Fetch posts with user info and book details
  const { data: posts = [], isLoading, error, refetch } = useQuery({
    queryKey: ['social-posts', user?.id],
    queryFn: async () => {
      try {
        let data: any[] = [];
        const { data: fetchedPosts, error: postsError } = await supabase
          .from('posts')
          .select(`
            *,
            profiles!posts_user_id_profiles_fkey(id, full_name, username, profile_photo_url),
            books_library(id, title, author, cover_image_url)
          `)
          .order('created_at', { ascending: false })
          .order('id', { ascending: false })
          .limit(SOCIAL_POST_PAGE_SIZE);

        if (postsError) {
          console.warn('Posts fetch with relations failed, attempting plain fallback:', postsError);
          const { data: fallbackPosts, error: fbError } = await supabase
            .from('posts')
            .select('*')
            .order('created_at', { ascending: false })
            .order('id', { ascending: false })
            .limit(SOCIAL_POST_PAGE_SIZE);
          if (fbError) {
            console.error('Plain posts fallback also failed:', fbError);
            throw fbError;
          }
          data = fallbackPosts || [];
        } else {
          data = fetchedPosts || [];
        }

        if (!data || data.length === 0) return [];

        // Enrich missing profiles and books if relational embeds were missing or failed
        const missingProfileUserIds = Array.from(
          new Set(data.filter((p) => !p.profiles && p.user_id).map((p) => p.user_id))
        );
        const missingBookIds = Array.from(
          new Set(data.filter((p) => !p.books_library && p.book_id).map((p) => p.book_id))
        );

        let profilesMap = new Map<string, any>();
        let booksMap = new Map<string, any>();

        if (missingProfileUserIds.length > 0) {
          try {
            const { data: pubProfs, error: pubErr } = await (supabase as any)
              .from('public_profiles')
              .select('id, full_name, username, profile_photo_url')
              .in('id', missingProfileUserIds);
            if (!pubErr && pubProfs && pubProfs.length > 0) {
              profilesMap = new Map(pubProfs.map((pr: any) => [pr.id, pr]));
            } else {
              const { data: profs } = await supabase
                .from('profiles')
                .select('id, full_name, username, profile_photo_url')
                .in('id', missingProfileUserIds);
              if (profs) {
                profilesMap = new Map(profs.map((pr: any) => [pr.id, pr]));
              }
            }
          } catch {
            // non-fatal
          }
        }

        if (missingBookIds.length > 0) {
          try {
            const { data: bks } = await supabase
              .from('books_library')
              .select('id, title, author, cover_image_url')
              .in('id', missingBookIds);
            if (bks) {
              booksMap = new Map(bks.map((b: any) => [b.id, b]));
            }
          } catch {
            // non-fatal
          }
        }

        data = data.map((post) => ({
          ...post,
          profiles: post.profiles || profilesMap.get(post.user_id) || null,
          books_library: post.books_library || booksMap.get(post.book_id) || null,
        }));

        // If any posts are reposts, fetch original posts in a clean batch
        const repostIds = data
          .map((p) => p.repost_of_id)
          .filter((id): id is string => Boolean(id));

        if (repostIds.length > 0) {
          try {
            const { data: originalPosts } = await supabase
              .from('posts')
              .select('*')
              .in('id', repostIds);

            if (originalPosts && originalPosts.length > 0) {
              const origUserIds = Array.from(new Set(originalPosts.map((p: any) => p.user_id).filter(Boolean)));
              const origBookIds = Array.from(new Set(originalPosts.map((p: any) => p.book_id).filter(Boolean)));

              let origProfilesMap = new Map<string, any>();
              let origBooksMap = new Map<string, any>();

              if (origUserIds.length > 0) {
                const { data: oProfs } = await supabase
                  .from('profiles')
                  .select('id, full_name, username, profile_photo_url')
                  .in('id', origUserIds);
                if (oProfs) origProfilesMap = new Map(oProfs.map((pr: any) => [pr.id, pr]));
              }

              if (origBookIds.length > 0) {
                const { data: oBks } = await supabase
                  .from('books_library')
                  .select('id, title, author, cover_image_url')
                  .in('id', origBookIds);
                if (oBks) origBooksMap = new Map(oBks.map((b: any) => [b.id, b]));
              }

              const originalMap = new Map(
                originalPosts.map((op: any) => [
                  op.id,
                  {
                    ...op,
                    profiles: origProfilesMap.get(op.user_id) || null,
                    books_library: origBooksMap.get(op.book_id) || null,
                  },
                ])
              );

              data = data.map((post) => ({
                ...post,
                reposted_post: post.repost_of_id ? originalMap.get(post.repost_of_id) || null : null,
              }));
            }
          } catch (repostErr) {
            console.warn('Failed to load original reposted posts:', repostErr);
          }
        }

        if (user?.id && data.length > 0) {
          try {
            const postIds = data.map((post) => post.id);
            const [{ data: userLikes }, { data: userReposts }] = await Promise.all([
              supabase.from('post_likes').select('post_id').eq('user_id', user.id).in('post_id', postIds),
              supabase.from('posts').select('repost_of_id').eq('user_id', user.id).not('repost_of_id', 'is', null).in('repost_of_id', postIds),
            ]);

            const likedPostIds = new Set(userLikes?.map((l) => l.post_id) || []);
            const repostedIds = new Set(userReposts?.map((r) => r.repost_of_id as string) || []);

            return data.map((post) => ({
              ...post,
              user_liked: likedPostIds.has(post.id),
              user_reposted: repostedIds.has(post.id),
            }));
          } catch {
            return data;
          }
        }

        return data;
      } catch (err) {
        // Keep the query in an error state so the UI can distinguish a backend
        // failure from a genuinely empty feed and offer a retry action.
        console.error('Unexpected error fetching social posts:', err);
        throw err;
      }
    },
    enabled: true,
  });

  // An empty/short first page means there is no older page to request.
  useEffect(() => {
    if (!isLoading && !error && posts.length < SOCIAL_POST_PAGE_SIZE) {
      setHasMore(false);
    } else if (posts.length >= SOCIAL_POST_PAGE_SIZE) {
      setHasMore(true);
    }
  }, [posts.length, isLoading, error]);

  const loadMore = useCallback(async () => {
    if (isLoadingMore || !hasMore || posts.length === 0) return;
    const cursor = posts[posts.length - 1];
    if (!cursor?.created_at || !cursor?.id) return;

    setIsLoadingMore(true);
    setLoadMoreError(null);
    try {
      const cursorFilter = `created_at.lt.${cursor.created_at},and(created_at.eq.${cursor.created_at},id.lt.${cursor.id})`;
      const { data: page, error: pageError } = await supabase
        .from('posts')
        .select(`
          *,
          profiles!posts_user_id_profiles_fkey(id, full_name, username, profile_photo_url),
          books_library(id, title, author, cover_image_url)
        `)
        .or(cursorFilter)
        .order('created_at', { ascending: false })
        .order('id', { ascending: false })
        .limit(SOCIAL_POST_PAGE_SIZE);

      let olderPosts = page || [];
      if (pageError) {
        const fallback = await supabase
          .from('posts')
          .select('*')
          .or(cursorFilter)
          .order('created_at', { ascending: false })
          .order('id', { ascending: false })
          .limit(SOCIAL_POST_PAGE_SIZE);
        if (fallback.error) throw fallback.error;
        olderPosts = fallback.data || [];
      }

      if (olderPosts.length > 0) {
        const missingProfileIds = Array.from(new Set(olderPosts.filter((post: any) => !post.profiles && post.user_id).map((post: any) => post.user_id)));
        const missingBookIds = Array.from(new Set(olderPosts.filter((post: any) => !post.books_library && post.book_id).map((post: any) => post.book_id)));
        const [profileResult, bookResult] = await Promise.all([
          missingProfileIds.length
            ? (supabase as any).from('public_profiles').select('id, full_name, username, profile_photo_url').in('id', missingProfileIds)
            : Promise.resolve({ data: [] }),
          missingBookIds.length
            ? supabase.from('books_library').select('id, title, author, cover_image_url').in('id', missingBookIds)
            : Promise.resolve({ data: [] }),
        ]);
        const profileMap = new Map((profileResult.data || []).map((profile: any) => [profile.id, profile]));
        const bookMap = new Map((bookResult.data || []).map((book: any) => [book.id, book]));
        olderPosts = olderPosts.map((post: any) => ({
          ...post,
          profiles: post.profiles || profileMap.get(post.user_id) || null,
          books_library: post.books_library || bookMap.get(post.book_id) || null,
        }));

        // Keep repost cards as rich as the first page instead of rendering them
        // as blank posts when the original post is on another page.
        const repostIds = Array.from(new Set(olderPosts.map((post: any) => post.repost_of_id).filter(Boolean)));
        if (repostIds.length > 0) {
          const { data: originals } = await supabase.from('posts').select('*').in('id', repostIds);
          if (originals?.length) {
            const originalUserIds = Array.from(new Set(originals.map((post: any) => post.user_id).filter(Boolean)));
            const originalBookIds = Array.from(new Set(originals.map((post: any) => post.book_id).filter(Boolean)));
            const [originalProfiles, originalBooks] = await Promise.all([
              originalUserIds.length
                ? (supabase as any).from('public_profiles').select('id, full_name, username, profile_photo_url').in('id', originalUserIds)
                : Promise.resolve({ data: [] }),
              originalBookIds.length
                ? supabase.from('books_library').select('id, title, author, cover_image_url').in('id', originalBookIds)
                : Promise.resolve({ data: [] }),
            ]);
            const originalProfileMap = new Map((originalProfiles.data || []).map((profile: any) => [profile.id, profile]));
            const originalBookMap = new Map((originalBooks.data || []).map((book: any) => [book.id, book]));
            const originalMap = new Map(originals.map((post: any) => [post.id, {
              ...post,
              profiles: originalProfileMap.get(post.user_id) || null,
              books_library: originalBookMap.get(post.book_id) || null,
            }]));
            olderPosts = olderPosts.map((post: any) => ({
              ...post,
              reposted_post: post.repost_of_id ? originalMap.get(post.repost_of_id) || null : null,
            }));
          }
        }

        if (user?.id) {
          const ids = olderPosts.map((post: any) => post.id);
          const [likesResult, repostsResult] = await Promise.all([
            supabase.from('post_likes').select('post_id').eq('user_id', user.id).in('post_id', ids),
            supabase.from('posts').select('repost_of_id').eq('user_id', user.id).not('repost_of_id', 'is', null).in('repost_of_id', ids),
          ]);
          const likedIds = new Set((likesResult.data || []).map((like: any) => like.post_id));
          const repostedIds = new Set((repostsResult.data || []).map((repost: any) => repost.repost_of_id));
          olderPosts = olderPosts.map((post: any) => ({
            ...post,
            user_liked: likedIds.has(post.id),
            user_reposted: repostedIds.has(post.id),
          }));
        }

        queryClient.setQueryData<SocialPost[]>(['social-posts', user?.id], (current = []) => {
          const existingIds = new Set(current.map((post) => post.id));
          return [...current, ...olderPosts.filter((post: any) => !existingIds.has(post.id))];
        });
      }
      setHasMore(olderPosts.length === SOCIAL_POST_PAGE_SIZE);
    } catch (loadError) {
      console.error('Failed to load more social posts:', loadError);
      setLoadMoreError(loadError instanceof Error ? loadError : new Error('Unable to load more posts.'));
    } finally {
      setIsLoadingMore(false);
    }
  }, [hasMore, isLoadingMore, posts, queryClient, user?.id]);

  // Real-time subscription for new posts
  useEffect(() => {
    if (!user?.id) return;

    const channel = supabase
      .channel(uniqueChannelName('social-posts-realtime'))
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'posts'
        },
        async (payload) => {
          // Fetch the complete post with user details
          const { data: newPost } = await supabase
            .from('posts')
            .select(`
              *,
              profiles!posts_user_id_profiles_fkey(id, full_name, username, profile_photo_url),
              books_library(id, title, author, cover_image_url)
            `)
            .eq('id', payload.new.id)
            .single();

          if (newPost) {
            queryClient.setQueriesData<SocialPost[]>({ queryKey: ['social-posts'] }, (old = []) => {
              if (old.some((p) => p.id === newPost.id)) return old;
              return [{ ...newPost, user_liked: false }, ...old];
            });

            // Show notification for posts from others
            if (newPost.user_id !== user.id) {
              toast({
                title: 'New Post',
                description: `${newPost.profiles?.full_name || 'Someone'} shared a new post`,
              });
            }
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'posts'
        },
        (payload) => {
          queryClient.setQueriesData<SocialPost[]>({ queryKey: ['social-posts'] }, (old = []) => {
            return old.map(post => 
              post.id === payload.new.id 
                ? { ...post, ...payload.new }
                : post
            );
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, queryClient, toast]);

  return { posts, isLoading, error, refetch, hasMore, isLoadingMore, loadMore, loadMoreError };
};

export const useCreatePost = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (postData: {
      content: string;
      image_url?: string;
      book_id?: string;
      feeling_emoji?: string;
      feeling_label?: string;
    }) => {
      if (!user?.id) throw new Error('Not authenticated');

      // 1. Ensure user has a profile record to satisfy posts_user_id_profiles_fkey
      try {
        const { data: profile } = await supabase
          .from('profiles')
          .select('id')
          .eq('id', user.id)
          .maybeSingle();

        if (!profile) {
          const fallbackName =
            user.user_metadata?.full_name ||
            user.user_metadata?.name ||
            user.email?.split('@')[0] ||
            'Reader';
          const fallbackUsername =
            user.user_metadata?.username ||
            user.email?.split('@')[0] ||
            `user_${user.id.slice(0, 6)}`;
          await supabase.from('profiles').upsert(
            {
              id: user.id,
              full_name: fallbackName,
              username: fallbackUsername,
              profile_photo_url: user.user_metadata?.avatar_url || null,
            },
            { onConflict: 'id' }
          );
        }
      } catch (err) {
        console.warn('Profile pre-check failed (continuing post creation):', err);
      }

      // Ensure empty string is converted to null to prevent invalid UUID syntax error
      const validBookId =
        postData.book_id && postData.book_id.trim() !== ''
          ? postData.book_id.trim()
          : null;

      const payload = {
        content: postData.content.trim(),
        user_id: user.id,
        book_id: validBookId,
        feeling_emoji: postData.feeling_emoji?.trim() || null,
        feeling_label: postData.feeling_label?.trim() || null,
        image_url: postData.image_url?.trim() || null,
      };

      // Debug log to help surface issues when inserting posts
      console.debug('Creating social post', { payload, userId: user?.id });

      let createdPost: any = null;

      // Try insert with relations for immediate rich display
      const { data, error } = await supabase
        .from('posts')
        .insert(payload)
        .select(`
          *,
          profiles!posts_user_id_profiles_fkey(id, full_name, username, profile_photo_url),
          books_library(id, title, author, cover_image_url)
        `)
        .maybeSingle();

      if (error) {
        console.warn('Rich insert select failed, falling back to standard insert:', error);
        const fallback = await supabase
          .from('posts')
          .insert(payload)
          .select()
          .single();

        if (fallback.error) throw fallback.error;
        createdPost = fallback.data;
      } else {
        createdPost = data;
      }

      return (
        createdPost || {
          ...payload,
          id: crypto.randomUUID(),
          created_at: new Date().toISOString(),
          likes_count: 0,
          comments_count: 0,
          reposts_count: 0,
          user_liked: false,
          user_reposted: false,
        }
      );
    },
    onSuccess: (newPost) => {
      if (newPost) {
        queryClient.setQueriesData<SocialPost[]>({ queryKey: ['social-posts'] }, (old = []) => {
          if (old.some((p) => p.id === newPost.id)) return old;
          return [{ ...newPost, user_liked: false, user_reposted: false }, ...old];
        });
      }
      queryClient.invalidateQueries({ queryKey: ['social-posts'] });
      toast({
        title: 'Success',
        description: 'Your post has been shared!',
      });
    },
    onError: (error: Error) => {
      console.error('Error creating post:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to create post. Please try again.',
        variant: 'destructive',
      });
    },
  });
};

export const useTogglePostLike = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ postId, isLiked }: { postId: string; isLiked: boolean }) => {
      if (!user?.id) throw new Error('Not authenticated');

      if (isLiked) {
        // Unlike the post
        const { error } = await supabase
          .from('post_likes')
          .delete()
          .eq('user_id', user.id)
          .eq('post_id', postId);
        
        if (error) throw error;
      } else {
        // Like the post
        const { error } = await supabase
          .from('post_likes')
          .insert([{ user_id: user.id, post_id: postId }]);
        
        if (error) throw error;
      }

      return { postId, isLiked: !isLiked };
    },
    onSuccess: ({ postId, isLiked }) => {
      // Update the posts in cache across all queries with matching prefix
      queryClient.setQueriesData<SocialPost[]>({ queryKey: ['social-posts'] }, (old = []) => {
        return old.map(post => 
          post.id === postId 
            ? { 
                ...post, 
                user_liked: isLiked, 
                likes_count: isLiked ? post.likes_count + 1 : Math.max(0, post.likes_count - 1) 
              }
            : post
        );
      });
    },
    onError: (error) => {
      console.error('Error toggling like:', error);
    },
  });
};

export const usePostComments = (postId: string) => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['post-comments', postId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('post_comments')
        .select(`
          *,
          profiles!post_comments_user_id_profiles_fkey(id, full_name, username, profile_photo_url)
        `)
        .eq('post_id', postId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      const comments = data || [];
      if (!comments.length) return [];

      const commentIds = comments.map((c: any) => c.id);
      const [{ data: likesRows }, { data: myLikes }] = await Promise.all([
        supabase.from('post_comment_likes').select('comment_id').in('comment_id', commentIds),
        user?.id
          ? supabase.from('post_comment_likes').select('comment_id').eq('user_id', user.id).in('comment_id', commentIds)
          : Promise.resolve({ data: [] as { comment_id: string }[] }),
      ]);

      const counts = new Map<string, number>();
      (likesRows || []).forEach((r: any) => counts.set(r.comment_id, (counts.get(r.comment_id) || 0) + 1));
      const liked = new Set((myLikes || []).map((r: any) => r.comment_id));

      return comments.map((c: any) => ({
        ...c,
        likes_count: counts.get(c.id) || 0,
        user_liked: liked.has(c.id),
      }));
    },
    enabled: !!postId,
  });
};

export const useCreateComment = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ postId, content, parentCommentId }: { postId: string; content: string; parentCommentId?: string | null }) => {
      if (!user?.id) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('post_comments')
        .insert([{ post_id: postId, content, user_id: user.id, parent_comment_id: parentCommentId ?? null }])
        .select(`
          *,
          profiles!post_comments_user_id_profiles_fkey(id, full_name, username, profile_photo_url)
        `)
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, { postId }) => {
      queryClient.invalidateQueries({ queryKey: ['post-comments', postId] });
      queryClient.invalidateQueries({ queryKey: ['social-posts'] });
      toast({
        title: 'Comment added',
        description: 'Your comment has been posted.',
      });
    },
    onError: (error) => {
      console.error('Error creating comment:', error);
      toast({
        title: 'Error',
        description: 'Failed to post comment. Please try again.',
        variant: 'destructive',
      });
    },
  });
};

export const useToggleRepost = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ post, isReposted, comment }: { post: SocialPost; isReposted: boolean; comment?: string }) => {
      if (!user?.id) throw new Error('Not authenticated');
      const targetId = post.repost_of_id || post.id;

      if (isReposted) {
        const { error } = await supabase
          .from('posts')
          .delete()
          .eq('user_id', user.id)
          .eq('repost_of_id', targetId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('posts').insert({
          user_id: user.id,
          content: comment?.trim() || '',
          repost_of_id: targetId,
        });
        if (error) throw error;
      }
      return { targetId, isReposted: !isReposted };
    },
    onSuccess: ({ isReposted }) => {
      queryClient.invalidateQueries({ queryKey: ['social-posts'] });
      toast({
        title: isReposted ? 'Reposted' : 'Repost removed',
        description: isReposted ? 'Shared with your followers.' : '',
      });
    },
    onError: (error: Error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });
};

export const useToggleCommentLike = (postId: string) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ commentId, isLiked }: { commentId: string; isLiked: boolean }) => {
      if (!user?.id) throw new Error('Not authenticated');
      if (isLiked) {
        const { error } = await supabase
          .from('post_comment_likes')
          .delete()
          .eq('user_id', user.id)
          .eq('comment_id', commentId);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('post_comment_likes')
          .insert({ user_id: user.id, comment_id: commentId });
        if (error) throw error;
      }
      return { commentId, isLiked: !isLiked };
    },
    onSuccess: ({ commentId, isLiked }) => {
      queryClient.setQueryData<any[]>(['post-comments', postId], (old = []) =>
        (old || []).map((c) =>
          c.id === commentId
            ? { ...c, user_liked: isLiked, likes_count: Math.max(0, (c.likes_count || 0) + (isLiked ? 1 : -1)) }
            : c
        )
      );
    },
  });
};

export const useDeletePost = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: async (postId: string) => {
      if (!user?.id) throw new Error('Not authenticated');
      const { error } = await supabase.from('posts').delete().eq('id', postId).eq('user_id', user.id);
      if (error) throw error;
      return postId;
    },
    onSuccess: (deletedId) => {
      queryClient.setQueriesData<SocialPost[]>({ queryKey: ['social-posts'] }, (old = []) => {
        return old.filter(post => post.id !== deletedId);
      });
      queryClient.invalidateQueries({ queryKey: ['social-posts'] });
      toast({ title: 'Post deleted' });
    },
  });
};
