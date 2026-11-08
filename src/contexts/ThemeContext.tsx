import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import {
  DailyThemeId,
  ThemeMode,
  getTodayDailyTheme,
  DAILY_THEME_IDS,
  getThemeConfigById,
} from '@/config/dailyThemes';
import { supabase } from '@/integrations/supabase/client-universal';

export type Theme = 'light' | 'dark';

export interface ThemePreferenceState {
  mode: ThemeMode;
  customTheme: DailyThemeId;
}

export interface ThemeContextType {
  theme: Theme;
  mode: ThemeMode;
  activeDailyTheme: DailyThemeId;
  resolvedTheme: 'dark' | DailyThemeId;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
  setMode: (mode: ThemeMode) => void;
  setCustomTheme: (themeId: DailyThemeId) => void;
  resetToDailyTheme: () => void;
}

const STORAGE_PREF_KEY = 'sahadhyayi-theme-preference';
const STORAGE_LEGACY_KEY = 'sahadhyayi-theme';

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

function getInitialPreferences(): ThemePreferenceState {
  const defaultToday = getTodayDailyTheme();
  if (typeof window === 'undefined') {
    return { mode: 'daily', customTheme: defaultToday };
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_PREF_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<ThemePreferenceState>;
      const validMode: ThemeMode =
        parsed.mode === 'daily' ||
        parsed.mode === 'light' ||
        parsed.mode === 'dark' ||
        parsed.mode === 'custom'
          ? parsed.mode
          : 'daily';

      const validCustomTheme: DailyThemeId =
        parsed.customTheme && DAILY_THEME_IDS.includes(parsed.customTheme)
          ? parsed.customTheme
          : defaultToday;

      return { mode: validMode, customTheme: validCustomTheme };
    }

    // Check legacy key for existing users
    const legacyTheme = window.localStorage.getItem(STORAGE_LEGACY_KEY);
    if (legacyTheme === 'dark') {
      return { mode: 'dark', customTheme: defaultToday };
    }
    if (legacyTheme === 'light') {
      return { mode: 'light', customTheme: 'pure-white' };
    }
  } catch {
    // LocalStorage might be restricted
  }

  return { mode: 'daily', customTheme: defaultToday };
}

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [prefs, setPrefs] = useState<ThemePreferenceState>(getInitialPreferences);
  const [currentDayTheme, setCurrentDayTheme] = useState<DailyThemeId>(getTodayDailyTheme);

  // Keep track of day changes automatically in local time
  const checkDayTransition = useCallback(() => {
    const today = getTodayDailyTheme();
    setCurrentDayTheme((prev) => (prev !== today ? today : prev));
  }, []);

  useEffect(() => {
    checkDayTransition();

    // Check on visibility change (device wake-up / tab focus after midnight)
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        checkDayTransition();
      }
    };

    window.addEventListener('visibilitychange', handleVisibility);
    window.addEventListener('focus', checkDayTransition);

    // Periodically re-check every minute
    const interval = window.setInterval(checkDayTransition, 60 * 1000);

    return () => {
      window.removeEventListener('visibilitychange', handleVisibility);
      window.removeEventListener('focus', checkDayTransition);
      window.clearInterval(interval);
    };
  }, [checkDayTransition]);

  // Sync with logged-in user's account metadata if available
  useEffect(() => {
    let isSubscribed = true;

    async function loadUserPreference() {
      try {
        const { data } = await supabase.auth.getSession();
        const user = data?.session?.user;
        const remotePref = user?.user_metadata?.theme_preference as Partial<ThemePreferenceState> | undefined;

        if (remotePref && isSubscribed) {
          if (
            remotePref.mode &&
            ['daily', 'light', 'dark', 'custom'].includes(remotePref.mode)
          ) {
            setPrefs((current) => {
              const newMode = remotePref.mode as ThemeMode;
              const newCustom =
                remotePref.customTheme && DAILY_THEME_IDS.includes(remotePref.customTheme)
                  ? remotePref.customTheme
                  : current.customTheme;

              if (current.mode === newMode && current.customTheme === newCustom) {
                return current;
              }
              return { mode: newMode, customTheme: newCustom };
            });
          }
        }
      } catch {
        // Fallback to local storage
      }
    }

    void loadUserPreference();

    return () => {
      isSubscribed = false;
    };
  }, []);

  // Compute resolved themes
  const activeDailyTheme: DailyThemeId =
    prefs.mode === 'daily'
      ? currentDayTheme
      : prefs.mode === 'custom'
      ? prefs.customTheme
      : prefs.mode === 'light'
      ? 'pure-white'
      : currentDayTheme;

  const isDark = prefs.mode === 'dark';
  const theme: Theme = isDark ? 'dark' : 'light';
  const resolvedTheme: 'dark' | DailyThemeId = isDark ? 'dark' : activeDailyTheme;

  // Apply DOM classes and design token attributes
  useEffect(() => {
    const root = document.documentElement;

    if (isDark) {
      root.classList.add('dark');
      root.classList.remove('light');
      root.setAttribute('data-theme', 'dark');
      root.setAttribute('data-theme-mode', prefs.mode);
      // Remove all theme classes
      DAILY_THEME_IDS.forEach((id) => root.classList.remove(`theme-${id}`));
    } else {
      root.classList.remove('dark');
      root.classList.add('light');
      root.setAttribute('data-theme', activeDailyTheme);
      root.setAttribute('data-theme-mode', prefs.mode);

      // Clean old theme classes and add active one
      DAILY_THEME_IDS.forEach((id) => {
        if (id === activeDailyTheme) {
          root.classList.add(`theme-${id}`);
        } else {
          root.classList.remove(`theme-${id}`);
        }
      });
    }

    // Persist locally
    try {
      window.localStorage.setItem(STORAGE_PREF_KEY, JSON.stringify(prefs));
      window.localStorage.setItem(STORAGE_LEGACY_KEY, theme);
    } catch {
      // Storage unavailable
    }
  }, [isDark, activeDailyTheme, prefs, theme]);

  // Save preference remotely for authenticated users
  const persistPreference = useCallback(async (newPrefs: ThemePreferenceState) => {
    try {
      const { data } = await supabase.auth.getSession();
      if (data?.session?.user) {
        await supabase.auth.updateUser({
          data: { theme_preference: newPrefs },
        });
      }
    } catch {
      // Offline or network error
    }
  }, []);

  const setMode = useCallback(
    (newMode: ThemeMode) => {
      setPrefs((prev) => {
        const updated = { ...prev, mode: newMode };
        void persistPreference(updated);
        return updated;
      });
    },
    [persistPreference]
  );

  const setCustomTheme = useCallback(
    (themeId: DailyThemeId) => {
      setPrefs((prev) => {
        const updated: ThemePreferenceState = { mode: 'custom', customTheme: themeId };
        void persistPreference(updated);
        return updated;
      });
    },
    [persistPreference]
  );

  const resetToDailyTheme = useCallback(() => {
    setMode('daily');
  }, [setMode]);

  // Backward compatibility: setTheme('light') / setTheme('dark')
  const setTheme = useCallback(
    (newTheme: Theme) => {
      if (newTheme === 'dark') {
        setMode('dark');
      } else {
        // If switching from dark to light, respect previous non-dark mode, or default to daily
        setMode(prefs.mode === 'dark' ? 'daily' : prefs.mode);
      }
    },
    [setMode, prefs.mode]
  );

  const toggleTheme = useCallback(() => {
    if (isDark) {
      setMode(prefs.customTheme ? 'daily' : 'daily');
    } else {
      setMode('dark');
    }
  }, [isDark, setMode, prefs.customTheme]);

  return (
    <ThemeContext.Provider
      value={{
        theme,
        mode: prefs.mode,
        activeDailyTheme,
        resolvedTheme,
        setTheme,
        toggleTheme,
        setMode,
        setCustomTheme,
        resetToDailyTheme,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

const fallbackThemeContext: ThemeContextType = {
  theme: 'light',
  mode: 'daily',
  activeDailyTheme: 'cream',
  resolvedTheme: 'cream',
  setTheme: () => {},
  toggleTheme: () => {},
  setMode: () => {},
  setCustomTheme: () => {},
  resetToDailyTheme: () => {},
};

// eslint-disable-next-line react-refresh/only-export-components
export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    return fallbackThemeContext;
  }
  return context;
};
