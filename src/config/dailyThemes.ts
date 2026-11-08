export type DailyThemeId =
  | 'cream'
  | 'pure-white'
  | 'lavender'
  | 'mint'
  | 'warm-yellow'
  | 'soft-pink'
  | 'sky-blue';

export type ThemeMode = 'daily' | 'light' | 'dark' | 'custom';

export type WeekdayThemeKey =\n  | 'monday'\n  | 'tuesday'\n  | 'wednesday'\n  | 'thursday'\n  | 'friday'\n  | 'saturday'\n  | 'sunday';\n\nexport interface DailyThemeConfig {
  id: DailyThemeId;
  dayIndex: number; // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
  dayName: string;
  name: string;
  subtitle: string;
  direction: string;
  swatch: {
    background: string;
    surface: string;
    border: string;
    accent: string;
    ink: string;
  };
  description: string;
}

export const DAILY_THEMES: Record<WeekdayThemeKey, DailyThemeConfig> = {
  monday: {
    id: 'pure-white',
    dayIndex: 1,
    dayName: 'Monday',
    name: 'Pure White',
    subtitle: 'Editorial & Clean',
    direction: 'Clean, minimal, editorial',
    swatch: {
      background: '#FFFFFF',
      surface: '#F8FAFC',
      border: '#E2E8F0',
      accent: '#1C442D',
      ink: '#0F172A',
    },
    description: 'Crisp white surfaces with sharp editorial contrast for a focused start to the week.',
  },
  tuesday: {
    id: 'lavender',
    dayIndex: 2,
    dayName: 'Tuesday',
    name: 'Soft Lavender',
    subtitle: 'Calm & Literary',
    direction: 'Calm, creative, literary',
    swatch: {
      background: '#F8F5FC',
      surface: '#FFFFFF',
      border: '#E6DCF5',
      accent: '#5E338A',
      ink: '#221630',
    },
    description: 'A soothing lavender haze that inspires contemplative, poetic reading.',
  },
  wednesday: {
    id: 'mint',
    dayIndex: 3,
    dayName: 'Wednesday',
    name: 'Mint Green',
    subtitle: 'Fresh & Peaceful',
    direction: 'Fresh, natural, peaceful',
    swatch: {
      background: '#F4F9F6',
      surface: '#FFFFFF',
      border: '#D4E8DC',
      accent: '#1C442D',
      ink: '#14241B',
    },
    description: 'Gentle mint and sage botanicals that bring natural freshness to the mid-week reading flow.',
  },
  thursday: {
    id: 'warm-yellow',
    dayIndex: 4,
    dayName: 'Thursday',
    name: 'Warm Yellow',
    subtitle: 'Optimistic & Warm',
    direction: 'Bright, optimistic, energetic',
    swatch: {
      background: '#FCF9F0',
      surface: '#FFFFFF',
      border: '#ECE1BD',
      accent: '#8F681C',
      ink: '#261F10',
    },
    description: 'Sunlit warmth and honeyed amber undertones for uplifting literary immersion.',
  },
  friday: {
    id: 'soft-pink',
    dayIndex: 5,
    dayName: 'Friday',
    name: 'Soft Pink',
    subtitle: 'Warm & Expressive',
    direction: 'Warm, expressive, elegant',
    swatch: {
      background: '#FAF4F6',
      surface: '#FFFFFF',
      border: '#ECD7DF',
      accent: '#8A2A48',
      ink: '#27141C',
    },
    description: 'Delicate rose quartz and warm blush tones that welcome the weekend with elegance.',
  },
  saturday: {
    id: 'sky-blue',
    dayIndex: 6,
    dayName: 'Saturday',
    name: 'Sky Blue',
    subtitle: 'Relaxed & Open',
    direction: 'Relaxed, open, immersive',
    swatch: {
      background: '#F3F8FC',
      surface: '#FFFFFF',
      border: '#CEE2F4',
      accent: '#1A4D78',
      ink: '#101F30',
    },
    description: 'Airy morning azure and soft horizon blues for relaxed, unhurried reading marathons.',
  },
  sunday: {
    id: 'cream',
    dayIndex: 0,
    dayName: 'Sunday',
    name: 'Warm Ivory & Cream',
    subtitle: 'Cozy & Bookish',
    direction: 'Cozy, bookish, premium',
    swatch: {
      background: '#FAF7F2',
      surface: '#FFFFFF',
      border: '#E8E0D2',
      accent: '#1C442D',
      ink: '#1C201D',
    },
    description: 'Sahadhyayi’s signature antique parchment and warm ivory for cozy Sunday chapter sessions.',
  },
} as const;

// Ordered array by day of week (Sunday 0 to Saturday 6)
export const DAILY_THEMES_ORDERED: DailyThemeConfig[] = [
  DAILY_THEMES.sunday,
  DAILY_THEMES.monday,
  DAILY_THEMES.tuesday,
  DAILY_THEMES.wednesday,
  DAILY_THEMES.thursday,
  DAILY_THEMES.friday,
  DAILY_THEMES.saturday,
];

export const DAILY_THEME_IDS: DailyThemeId[] = [
  'cream',
  'pure-white',
  'lavender',
  'mint',
  'warm-yellow',
  'soft-pink',
  'sky-blue',
];

/**
 * Resolves the DailyThemeId corresponding to a specific JS day index (0 = Sunday ... 6 = Saturday).
 */
export function getDailyThemeForDayIndex(dayIndex: number): DailyThemeId {
  const normalizedIndex = ((dayIndex % 7) + 7) % 7;
  const config = DAILY_THEMES_ORDERED[normalizedIndex];
  return config ? config.id : 'cream';
}

/**
 * Returns today's DailyThemeId based on the client's current local date.
 */
export function getTodayDailyTheme(): DailyThemeId {
  const localDayIndex = new Date().getDay();
  return getDailyThemeForDayIndex(localDayIndex);
}

/**
 * Finds the config object for a given theme id.
 */
export function getThemeConfigById(themeId: DailyThemeId): DailyThemeConfig {
  const match = Object.values(DAILY_THEMES).find((t) => t.id === themeId);
  return match || DAILY_THEMES.sunday;
}
