
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export const useBookStats = (bookId: string) => {
  return useQuery({
    queryKey: ['book_stats', bookId],
    queryFn: async () => {
      // Simulate book reading statistics
      const totalReaders = Math.floor(Math.random() * 1000) + 100;
      const currentReaders = Math.floor(Math.random() * 50) + 10;
      const pastReaders = totalReaders - currentReaders;

      return {
        totalReaders,
        currentReaders,
        pastReaders,
        readers: [
          { id: '1', name: 'John Doe', status: 'reading', avatar: null },
          { id: '2', name: 'Jane Smith', status: 'completed', avatar: null },
          { id: '3', name: 'Mike Johnson', status: 'reading', avatar: null },
        ]
      };
    },
  });
};
