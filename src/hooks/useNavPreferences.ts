import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client-universal';
import { useAuth } from '@/contexts/authHelpers';

export interface NavPreferences {
  visible_tabs: string[];
  onboarding_completed: boolean;
}

// All available nav tab keys with labels and descriptions
export const ALL_NAV_TABS = [
  { key: 'library', label: 'Library', description: 'Browse and discover books', icon: 'BookOpen' },
  { key: 'bookshelf', label: 'My Shelf', description: 'Your personal reading list', icon: 'BookMarked' },
  { key: 'articles', label: 'Articles', description: 'Read and write articles', icon: 'FileText' },
  { key: 'blog', label: 'Publish', description: 'Publish your own content', icon: 'PenTool' },
  { key: 'games', label: 'Games', description: 'Book quizzes and challenges', icon: 'Gamepad2' },
  { key: 'authors', label: 'Authors', description: 'Explore author profiles', icon: 'Users' },
  { key: 'social', label: 'Social Media', description: 'Connect with readers', icon: 'Radio' },
] as const;

// Default tabs shown if no preference set
export const DEFAULT_VISIBLE_TABS = ['library', 'bookshelf'];

// Map tab keys to routes
export const TAB_ROUTES: Record<string, string> = {
  library: '/library',
  bookshelf: '/bookshelf',
  articles: '/articles',
  blog: '/blog',
  games: '/games',
  authors: '/authors',
  social: '/social',
};

export function useNavPreferences() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['nav-preferences', user?.id],
    enabled: !!user,
    queryFn: async (): Promise<NavPreferences> => {
      const { data, error } = await (supabase as any)
        .from('user_nav_preferences')
        .select('visible_tabs, onboarding_completed')
        .eq('user_id', user!.id)
        .maybeSingle();

      if (error) {
        console.error('Error fetching nav preferences:', error);
        return { visible_tabs: DEFAULT_VISIBLE_TABS, onboarding_completed: false };
      }

      if (!data) {
        return { visible_tabs: DEFAULT_VISIBLE_TABS, onboarding_completed: false };
      }

      return {
        visible_tabs: data.visible_tabs || DEFAULT_VISIBLE_TABS,
        onboarding_completed: data.onboarding_completed ?? false,
      };
    },
    staleTime: 5 * 60 * 1000,
  });

  const savePreferences = useMutation({
    mutationFn: async (prefs: { visible_tabs: string[]; onboarding_completed: boolean }) => {
      if (!user) throw new Error('Not authenticated');

      const { error } = await (supabase as any)
        .from('user_nav_preferences')
        .upsert(
          {
            user_id: user.id,
            visible_tabs: prefs.visible_tabs,
            onboarding_completed: prefs.onboarding_completed,
          },
          { onConflict: 'user_id' }
        );

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['nav-preferences', user?.id] });
    },
  });

  return {
    preferences: query.data,
    isLoading: query.isLoading,
    needsOnboarding: !!user && query.data !== undefined && !query.data.onboarding_completed,
    savePreferences,
  };
}
