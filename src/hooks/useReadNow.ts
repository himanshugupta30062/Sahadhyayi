import { useAuth } from '@/contexts/AuthContext';
import { useAddToBookshelf } from '@/hooks/useUserBookshelf';
import { toast } from '@/hooks/use-toast';

export const useReadNow = () => {
  const { user } = useAuth();
  const addToBookshelf = useAddToBookshelf();

  const handleReadNow = async (bookId: string, bookTitle: string) => {
    if (!user) {
      toast({
        title: 'Authentication Required',
        description: 'Please sign in to add books to your reading list.',
        variant: 'destructive',
      });
      return false;
    }

    // Check reading goal before adding
    const checkReadingGoal = (window as any).checkReadingGoal;
    if (checkReadingGoal && !checkReadingGoal()) {
      return false; // Goal enforcement will show modal
    }

    try {
      await addToBookshelf.mutateAsync({ 
        bookId, 
        status: 'reading' 
      });
      
      toast({
        title: 'Success',
        description: `Added "${bookTitle}" to your current reads!`,
      });
      
      return true;
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to add book to reading list',
        variant: 'destructive',
      });
      return false;
    }
  };

  return {
    handleReadNow,
    isLoading: addToBookshelf.isPending,
  };
};