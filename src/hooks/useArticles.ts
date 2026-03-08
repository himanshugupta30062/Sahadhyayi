import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/authHelpers';
import { toast } from '@/hooks/use-toast';

export interface Article {
  id: string;
  user_id: string;
  title: string;
  subtitle: string | null;
  content: string;
  cover_image_url: string | null;
  tags: string[];
  is_published: boolean;
  reading_time_minutes: number;
  likes_count: number;
  views_count: number;
  slug: string | null;
  created_at: string;
  updated_at: string;
  published_at: string | null;
  author_name?: string;
  author_avatar?: string;
}

function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 80)
    + '-' + Date.now().toString(36);
}

function estimateReadingTime(content: string): number {
  const words = content.trim().split(/\s+/).length;
  return Math.max(1, Math.round(words / 200));
}

export function usePublishedArticles() {
  return useQuery({
    queryKey: ['articles', 'published'],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('articles')
        .select('*')
        .eq('is_published', true)
        .order('published_at', { ascending: false });

      if (error) throw error;

      // Fetch author profiles
      const userIds = [...new Set((data as Article[]).map((a: Article) => a.user_id))];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name, profile_photo_url')
        .in('id', userIds);

      const profileMap = new Map(
        (profiles || []).map((p) => [p.id, p])
      );

      return (data as Article[]).map((article: Article) => {
        const profile = profileMap.get(article.user_id);
        return {
          ...article,
          author_name: profile?.full_name || 'Anonymous',
          author_avatar: profile?.profile_photo_url || '',
        };
      });
    },
  });
}

export function useMyArticles() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['articles', 'mine', user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('articles')
        .select('*')
        .eq('user_id', user!.id)
        .order('updated_at', { ascending: false });

      if (error) throw error;
      return data as Article[];
    },
  });
}

export function useArticleBySlug(slug: string | undefined) {
  return useQuery({
    queryKey: ['articles', 'slug', slug],
    enabled: !!slug,
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('articles')
        .select('*')
        .eq('slug', slug)
        .single();

      if (error) throw error;

      const { data: profile } = await supabase
        .from('profiles')
        .select('id, full_name, profile_photo_url')
        .eq('id', (data as Article).user_id)
        .single();

      return {
        ...(data as Article),
        author_name: profile?.full_name || 'Anonymous',
        author_avatar: profile?.profile_photo_url || '',
      } as Article;
    },
  });
}

export function useCreateArticle() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (article: { title: string; content: string; subtitle?: string; tags?: string[]; cover_image_url?: string; is_published?: boolean }) => {
      const slug = generateSlug(article.title);
      const readingTime = estimateReadingTime(article.content);

      const { data, error } = await (supabase as any)
        .from('articles')
        .insert({
          user_id: user!.id,
          title: article.title,
          subtitle: article.subtitle || null,
          content: article.content,
          cover_image_url: article.cover_image_url || null,
          tags: article.tags || [],
          is_published: article.is_published || false,
          reading_time_minutes: readingTime,
          slug,
          published_at: article.is_published ? new Date().toISOString() : null,
        })
        .select()
        .single();

      if (error) throw error;
      return data as Article;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['articles'] });
      toast({ title: 'Article saved!' });
    },
    onError: (err: any) => {
      toast({ title: 'Error saving article', description: err.message, variant: 'destructive' });
    },
  });
}

export function useUpdateArticle() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Article> & { id: string }) => {
      const payload: any = { ...updates };
      if (updates.content) {
        payload.reading_time_minutes = estimateReadingTime(updates.content);
      }
      if (updates.is_published && !updates.published_at) {
        payload.published_at = new Date().toISOString();
      }

      const { data, error } = await (supabase as any)
        .from('articles')
        .update(payload)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as Article;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['articles'] });
      toast({ title: 'Article updated!' });
    },
    onError: (err: any) => {
      toast({ title: 'Error updating article', description: err.message, variant: 'destructive' });
    },
  });
}

export function useDeleteArticle() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase as any)
        .from('articles')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['articles'] });
      toast({ title: 'Article deleted' });
    },
  });
}
