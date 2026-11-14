import { useState, useEffect, useCallback, useRef } from 'react';

type UserTier = 'new' | 'exploring' | 'engaged' | 'power';

interface EngagementData {
  visits: number;
  totalTimeSeconds: number;
  sectionsViewed: string[];
  lastVisit: string;
  tier: UserTier;
}

const STORAGE_KEY = 'sahadhyayi_home_engagement';
const TIER_THRESHOLDS = {
  exploring: { visits: 2, time: 60 },      // 2 visits or 1 min total
  engaged: { visits: 5, time: 300 },      // 5 visits or 5 min total
  power: { visits: 15, time: 1800 },      // 15 visits or 30 min total
};

function calculateTier(data: Pick<EngagementData, 'visits' | 'totalTimeSeconds'>): UserTier {
  if (data.visits >= TIER_THRESHOLDS.power.visits || data.totalTimeSeconds >= TIER_THRESHOLDS.power.time) {
    return 'power';
  }
  if (data.visits >= TIER_THRESHOLDS.engaged.visits || data.totalTimeSeconds >= TIER_THRESHOLDS.engaged.time) {
    return 'engaged';
  }
  if (data.visits >= TIER_THRESHOLDS.exploring.visits || data.totalTimeSeconds >= TIER_THRESHOLDS.exploring.time) {
    return 'exploring';
  }
  return 'new';
}

export function useHomeEngagement(): {
  tier: UserTier;
  data: EngagementData;
  trackSectionView: (sectionId: string) => void;
  resetEngagement: () => void;
} {
  const [engagementData, setEngagementData] = useState<EngagementData>(() => {
    // Initialize from localStorage
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as Partial<EngagementData>;
        const tier = calculateTier({ visits: parsed.visits ?? 0, totalTimeSeconds: parsed.totalTimeSeconds ?? 0 });
        return {
          visits: parsed.visits ?? 0,
          totalTimeSeconds: parsed.totalTimeSeconds ?? 0,
          sectionsViewed: parsed.sectionsViewed ?? [],
          lastVisit: parsed.lastVisit ?? new Date().toISOString(),
          tier,
        };
      }
    } catch {
      // Ignore parse errors
    }
    return {
      visits: 0,
      totalTimeSeconds: 0,
      sectionsViewed: [],
      lastVisit: new Date().toISOString(),
      tier: 'new' as UserTier,
    };
  });

  // Ref to always have latest data for localStorage persistence
  const engagementDataRef = useRef(engagementData);
  engagementDataRef.current = engagementData;

  const sessionStartRef = useRef<number>(Date.now());
  const hasTrackedVisitRef = useRef<boolean>(false);

  // Track visit on mount (once per session)
  useEffect(() => {
    if (hasTrackedVisitRef.current) return;

    const now = Date.now();
    const lastVisit = engagementData.lastVisit ? new Date(engagementData.lastVisit).getTime() : 0;
    const isNewVisit = now - lastVisit > 30 * 60 * 1000; // 30 min session gap

    if (isNewVisit) {
      setEngagementData(prev => {
        const newVisits = prev.visits + 1;
        const newTier = calculateTier({ visits: newVisits, totalTimeSeconds: prev.totalTimeSeconds });
        return { ...prev, visits: newVisits, lastVisit: new Date().toISOString(), tier: newTier };
      });
    }
    hasTrackedVisitRef.current = true;
  }, [engagementData.lastVisit]);

  // Track time spent on page
  useEffect(() => {
    const interval = window.setInterval(() => {
      const sessionTime = Math.floor((Date.now() - sessionStartRef.current) / 1000);
      setEngagementData(prev => {
        // Only update every 30 seconds to avoid excessive writes
        if (sessionTime % 30 !== 0) return prev;

        const newTotalTime = prev.totalTimeSeconds + 30;
        const newTier = calculateTier({ visits: prev.visits, totalTimeSeconds: newTotalTime });

        if (newTier !== prev.tier) {
          return { ...prev, totalTimeSeconds: newTotalTime, tier: newTier };
        }
        return { ...prev, totalTimeSeconds: newTotalTime };
      });
    }, 1000);

    return () => window.clearInterval(interval);
  }, []);

  // Persist to localStorage - use ref to avoid dependency on engagementData object
  useEffect(() => {
    const interval = window.setInterval(() => {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(engagementDataRef.current));
      } catch {
        // Ignore quota errors
      }
    }, 30_000); // Save every 30 seconds

    // Also save on unload
    const handleBeforeUnload = () => {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(engagementDataRef.current));
      } catch {
        // Ignore
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.clearInterval(interval);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, []);

  const trackSectionView = useCallback((sectionId: string) => {
    setEngagementData(prev => {
      if (prev.sectionsViewed.includes(sectionId)) return prev;
      return { ...prev, sectionsViewed: [...prev.sectionsViewed, sectionId] };
    });
  }, []);

  const resetEngagement = useCallback(() => {
    const freshData: EngagementData = {
      visits: 0,
      totalTimeSeconds: 0,
      sectionsViewed: [],
      lastVisit: new Date().toISOString(),
      tier: 'new',
    };
    setEngagementData(freshData);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // Ignore
    }
  }, []);

  return {
    tier: engagementData.tier,
    data: engagementData,
    trackSectionView,
    resetEngagement,
  };
}

export type { UserTier, EngagementData };