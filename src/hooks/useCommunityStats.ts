
import { useState, useEffect } from 'react';

interface CommunityStats {
  totalSignups: number;
  totalVisits: number;
  lastUpdated: string;
}

export const useCommunityStats = () => {
  const [stats, setStats] = useState<CommunityStats>({
    totalSignups: 0,
    totalVisits: 0,
    lastUpdated: new Date().toISOString()
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Try to fetch from the community stats API
      const response = await fetch('https://rknxtatvlzunatpyqxro.supabase.co/functions/v1/community-stats', {
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setStats({
          totalSignups: data.totalSignups || 0,
          totalVisits: data.totalVisits || 0,
          lastUpdated: new Date().toISOString()
        });
      } else {
        // If API fails, show 0 values
        setStats({
          totalSignups: 0,
          totalVisits: 0,
          lastUpdated: new Date().toISOString()
        });
      }
    } catch (err) {
      console.error('Failed to fetch community stats:', err);
      // Show 0 values if API fails
      setStats({
        totalSignups: 0,
        totalVisits: 0,
        lastUpdated: new Date().toISOString()
      });
      setError('Failed to load community stats');
    } finally {
      setIsLoading(false);
    }
  };

  const joinCommunity = async () => {
    try {
      const response = await fetch('https://rknxtatvlzunatpyqxro.supabase.co/functions/v1/community-stats', {
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
