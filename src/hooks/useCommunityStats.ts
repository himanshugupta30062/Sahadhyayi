
import { useState, useEffect } from 'react';

interface CommunityStats {
  totalSignups: number;
  totalVisits: number;
  lastUpdated: string;
}

export const useCommunityStats = () => {
  const [stats, setStats] = useState<CommunityStats>({
    totalSignups: 15847,
    totalVisits: 125000,
    lastUpdated: new Date().toISOString()
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch('https://c31baff7-46f5-4cb4-8fc1-fe1c52fc3fe0.supabase.co/functions/v1/community-stats');
      
      if (!response.ok) {
        throw new Error('Failed to fetch community stats');
      }
      
      const data: CommunityStats = await response.json();
      setStats(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      console.error('Failed to fetch community stats:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const joinCommunity = async () => {
    try {
      // Simulate joining the community
      const response = await fetch('https://c31baff7-46f5-4cb4-8fc1-fe1c52fc3fe0.supabase.co/functions/v1/community-stats', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'join' })
      });

      if (response.ok) {
        // Optimistically update the stats
        setStats(prev => ({
          ...prev,
          totalSignups: prev.totalSignups + 1,
          lastUpdated: new Date().toISOString()
        }));
        
        // Fetch updated stats
        await fetchStats();
        
        return true;
      }
    } catch (err) {
      console.error('Failed to join community:', err);
    }
    
    return false;
  };

  useEffect(() => {
    fetchStats();
  }, []);

  return {
    stats,
    isLoading,
    error,
    fetchStats,
    joinCommunity
  };
};
