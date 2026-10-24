import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/authHelpers';
import { supabase } from '@/integrations/supabase/client-universal';

export interface ReadingGoalData {
  goal: number;
  currentYear: number;
  setGoal: (newGoal: number) => Promise<void>;
  isLoading: boolean;
}

export const useReadingGoal = (): ReadingGoalData => {
  const { user } = useAuth();
  const currentYear = new Date().getFullYear();
  const storageKey = `readingGoal${currentYear}`;
  const userStorageKey = user?.id ? `sahadhyayi_goal_${user.id}_${currentYear}` : storageKey;

  const getInitialGoal = (): number => {
    // 1. Check user metadata if available
    const metaGoal = user?.user_metadata?.[`reading_goal_${currentYear}`];
    if (metaGoal && typeof metaGoal === 'number' && metaGoal > 0) {
      return metaGoal;
    }
    // 2. Check user-specific localStorage
    const localUserGoal = localStorage.getItem(userStorageKey);
    if (localUserGoal) {
      const parsed = Number.parseInt(localUserGoal, 10);
      if (parsed > 0) return parsed;
    }
    // 3. Check legacy general localStorage
    const legacyGoal = localStorage.getItem(storageKey);
    if (legacyGoal) {
      const parsed = Number.parseInt(legacyGoal, 10);
      if (parsed > 0) return parsed;
    }
    return 12;
  };

  const [goal, setGoalState] = useState<number>(getInitialGoal);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Sync state when user changes or when custom event fires
  useEffect(() => {
    setGoalState(getInitialGoal());

    const handleGoalUpdate = (event: Event) => {
      const customEvent = event as CustomEvent<{ goal: number }>;
      if (customEvent.detail?.goal) {
        setGoalState(customEvent.detail.goal);
      }
    };

    window.addEventListener('readingGoalUpdated', handleGoalUpdate);
    return () => {
      window.removeEventListener('readingGoalUpdated', handleGoalUpdate);
    };
  }, [user?.id, currentYear]);

  const setGoal = useCallback(
    async (newGoal: number) => {
      if (newGoal <= 0) return;
      setIsLoading(true);

      // Instant optimistic UI update
      setGoalState(newGoal);

      // Persist to local storage
      try {
        localStorage.setItem(storageKey, String(newGoal));
        if (user?.id) {
          localStorage.setItem(userStorageKey, String(newGoal));
        }
      } catch (err) {
        console.warn('Could not persist goal to localStorage:', err);
      }

      // Broadcast to other components in session
      window.dispatchEvent(
        new CustomEvent('readingGoalUpdated', { detail: { goal: newGoal } })
      );

      // Persist to Supabase user metadata if authenticated
      if (user) {
        try {
          await supabase.auth.updateUser({
            data: {
              [`reading_goal_${currentYear}`]: newGoal,
            },
          });
        } catch (error) {
          console.warn('Failed to sync reading goal to user profile metadata:', error);
        }
      }

      setIsLoading(false);
    },
    [user, storageKey, userStorageKey, currentYear]
  );

  return {
    goal,
    currentYear,
    setGoal,
    isLoading,
  };
};

