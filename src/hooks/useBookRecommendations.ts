import { useQuery } from '@tanstack/react-query';

export interface RecommendedBook {
  id: string;
  title: string;
  author?: string;
  genre?: string;
  cover_image_url?: string;
  description?: string;
}

const BASE_URL =
  (import.meta.env.VITE_RECOMMENDATIONS_URL as string | undefined) ||
  `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/recommendations`;

export const useBookRecommendations = (userId?: string) => {
  return useQuery({
    queryKey: ['book-recommendations', userId],
    queryFn: async (): Promise<RecommendedBook[]> => {
      if (!userId) return [];
      const response = await fetch(`${BASE_URL}/${userId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch recommendations');
      }
      const data = await response.json();
      return data.recommendations || [];
    },
    enabled: !!userId,
  });
};
