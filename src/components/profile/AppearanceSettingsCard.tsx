import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Palette,
  Sun,
  Moon,
  Calendar,
  Sparkles,
  Check,
  RotateCcw,
  Clock,
} from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';
import {
  DAILY_THEMES_ORDERED,
  DailyThemeId,
  ThemeMode,
  getTodayDailyTheme,
  getThemeConfigById,
} from '@/config/dailyThemes';
import { toast } from '@/components/ui/use-toast';

export const AppearanceSettingsCard: React.FC = () => {
  const {
    mode,
    activeDailyTheme,
    resolvedTheme,
    setMode,
    setCustomTheme,
    resetToDailyTheme,
  } = useTheme();

  const todayThemeId = getTodayDailyTheme();
  const todayConfig = getThemeConfigById(todayThemeId);
  const activeConfig = getThemeConfigById(activeDailyTheme);

  const handleSelectMode = (newMode: ThemeMode) => {
    setMode(newMode);
    toast({
      title: 'Theme Updated',
      description:
        newMode === 'daily'
          ? `Switched to Daily Dynamic Theme (Today: ${todayConfig.dayName} · ${todayConfig.name}).`
          : newMode === 'dark'
          ? 'Dark theme enabled for low-light reading.'
          : newMode === 'light'
          ? 'Standard pure white light theme enabled.'
          : 'Custom theme mode active. Choose your favorite day theme below.',
    });
  };

  const handleSelectCustomTheme = (themeId: DailyThemeId) => {
    setCustomTheme(themeId);
    const chosen = getThemeConfigById(themeId);
    toast({
      title: 'Custom Theme Applied',
      description: `${chosen.name} (${chosen.dayName}) is now your active theme.`,
    });
  };

  const handleResetToDaily = () => {
    resetToDailyTheme();
    toast({
      title: 'Daily Theme Restored',
      description: `Now automatically synced with ${todayConfig.dayName}'s ${todayConfig.name} theme.`,
    });
  };

  return (
    <Card className="rounded-2xl border-border bg-card shadow-xs overflow-hidden">
      <CardHeader className="pb-3 border-b border-border/70">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[hsl(var(--brand-primary)/0.1)] text-[hsl(var(--brand-primary))] flex items-center justify-center">
              <Palette className="w-5 h-5" />
            </div>
            <div>
              <CardTitle className="text-base font-semibold text-foreground flex items-center gap-2">
                <span>Appearance & Themes</span>
                <Badge variant="outline" className="text-[10px] uppercase font-bold tracking-wider py-0 px-1.5 border-[hsl(var(--brand-primary)/0.3)] text-[hsl(var(--brand-primary))]">
                  7 Daily Styles
                </Badge>
              </CardTitle>
              <p className="text-xs text-muted-foreground mt-0.5">
                Dynamic day-wise aesthetics calibrated for literary immersion & comfortable reading.
              </p>
            </div>
          </div>

          {/* Current Status Pill */}
          <div className="flex items-center gap-2 self-start sm:self-auto">
            {mode !== 'daily' && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleResetToDaily}
                className="text-xs h-8 text-[hsl(var(--brand-primary))] hover:bg-muted"
                title="Switch back to dynamic day-of-week theme"
              >
                <RotateCcw className="w-3.5 h-3.5 mr-1" />
                Return to Daily Theme
              </Button>
            )}
            <span className="text-xs px-2.5 py-1 rounded-full bg-muted text-foreground border border-border flex items-center gap-1.5 font-medium">
              <Clock className="w-3 h-3 text-muted-foreground" />
              <span>
                {mode === 'dark'
                  ? 'Dark Theme'
                  : mode === 'light'
                  ? 'Pure White'
                  : `${activeConfig.dayName} · ${activeConfig.name}`}
              </span>
            </span>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-5 sm:p-6 space-y-6">
        {/* Mode Selector Tabs */}
        <div className="space-y-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block">
            Theme Mode
          </span>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {/* 1. Daily Theme */}
            <button
              type="button"
              onClick={() => handleSelectMode('daily')}
              className={`p-3 rounded-xl border text-left transition-all relative ${
                mode === 'daily'
                  ? 'border-[hsl(var(--brand-primary))] bg-[hsl(var(--brand-primary)/0.08)] shadow-xs ring-1 ring-[hsl(var(--brand-primary))]'
                  : 'border-border bg-card hover:bg-muted/50'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <Calendar className="w-4 h-4 text-[hsl(var(--brand-primary))]" />
                {mode === 'daily' && <Check className="w-3.5 h-3.5 text-[hsl(var(--brand-primary))]" />}
              </div>
              <p className="text-xs font-semibold text-foreground">Daily Dynamic</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">
                Changes by weekday (Default)
              </p>
            </button>

            {/* 2. Light Theme */}
            <button
              type="button"
              onClick={() => handleSelectMode('light')}
              className={`p-3 rounded-xl border text-left transition-all ${
                mode === 'light'
                  ? 'border-[hsl(var(--brand-primary))] bg-[hsl(var(--brand-primary)/0.08)] shadow-xs ring-1 ring-[hsl(var(--brand-primary))]'
                  : 'border-border bg-card hover:bg-muted/50'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <Sun className="w-4 h-4 text-amber-500" />
                {mode === 'light' && <Check className="w-3.5 h-3.5 text-[hsl(var(--brand-primary))]" />}
              </div>
              <p className="text-xs font-semibold text-foreground">Pure White</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">Always editorial white</p>
            </button>

            {/* 3. Dark Theme */}
            <button
              type="button"
              onClick={() => handleSelectMode('dark')}
              className={`p-3 rounded-xl border text-left transition-all ${
                mode === 'dark'
                  ? 'border-[hsl(var(--brand-primary))] bg-[hsl(var(--brand-primary)/0.08)] shadow-xs ring-1 ring-[hsl(var(--brand-primary))]'
                  : 'border-border bg-card hover:bg-muted/50'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <Moon className="w-4 h-4 text-indigo-400" />
                {mode === 'dark' && <Check className="w-3.5 h-3.5 text-[hsl(var(--brand-primary))]" />}
              </div>
              <p className="text-xs font-semibold text-foreground">Dark Theme</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">Night reading mode</p>
            </button>

            {/* 4. Custom Theme */}
            <button
              type="button"
              onClick={() => handleSelectMode('custom')}
              className={`p-3 rounded-xl border text-left transition-all ${
                mode === 'custom'
                  ? 'border-[hsl(var(--brand-primary))] bg-[hsl(var(--brand-primary)/0.08)] shadow-xs ring-1 ring-[hsl(var(--brand-primary))]'
                  : 'border-border bg-card hover:bg-muted/50'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <Sparkles className="w-4 h-4 text-purple-500" />
                {mode === 'custom' && <Check className="w-3.5 h-3.5 text-[hsl(var(--brand-primary))]" />}
              </div>
              <p className="text-xs font-semibold text-foreground">Custom Theme</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">Lock to your favorite day</p>
            </button>
          </div>
        </div>

        {/* 7 Daily Theme Swatches & Cards */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block">
              7 Day-Wise Literary Palettes
            </span>
            <span className="text-[11px] text-muted-foreground">
              {mode === 'daily'
                ? `Today is ${todayConfig.dayName}`
                : 'Tap any day to preview & set'}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-7 gap-3">
            {DAILY_THEMES_ORDERED.map((themeConfig) => {
              const isToday = themeConfig.id === todayThemeId;
              const isSelected =
                resolvedTheme !== 'dark' && activeDailyTheme === themeConfig.id;

              return (
                <button
                  key={themeConfig.id}
                  type="button"
                  onClick={() => handleSelectCustomTheme(themeConfig.id)}
                  className={`group relative p-3 rounded-xl border text-left transition-all flex flex-col justify-between h-full ${
                    isSelected
                      ? 'border-[hsl(var(--brand-primary))] ring-2 ring-[hsl(var(--brand-primary))] shadow-sm'
                      : 'border-border bg-card hover:border-[hsl(var(--brand-primary)/0.5)] hover:shadow-xs'
                  }`}
                  style={{
                    backgroundColor: themeConfig.swatch.background,
                  }}
                >
                  <div>
                    {/* Header: Day & Badges */}
                    <div className="flex items-center justify-between gap-1 mb-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground" style={{ color: themeConfig.swatch.ink }}>
                        {themeConfig.dayName.slice(0, 3)}
                      </span>
                      {isToday && (
                        <span className="text-[9px] font-bold px-1.5 py-0.2 rounded-full bg-[hsl(var(--brand-primary))] text-white">
                          Today
                        </span>
                      )}
                    </div>

                    {/* Color Swatch Bars */}
                    <div className="flex items-center gap-1.5 mb-2.5">
                      <span
                        className="w-4 h-4 rounded-full border border-black/10 shadow-2xs"
                        style={{ backgroundColor: themeConfig.swatch.background }}
                        title="Background"
                      />
                      <span
                        className="w-4 h-4 rounded-full border border-black/10 shadow-2xs"
                        style={{ backgroundColor: themeConfig.swatch.surface }}
                        title="Surface"
                      />
                      <span
                        className="w-4 h-4 rounded-full border border-black/10 shadow-2xs"
                        style={{ backgroundColor: themeConfig.swatch.border }}
                        title="Border"
                      />
                      <span
                        className="w-4 h-4 rounded-full border border-black/10 shadow-2xs"
                        style={{ backgroundColor: themeConfig.swatch.accent }}
                        title="Accent"
                      />
                    </div>

                    <p className="text-xs font-bold leading-tight" style={{ color: themeConfig.swatch.ink }}>
                      {themeConfig.name}
                    </p>
                    <p className="text-[10px] text-muted-foreground mt-0.5 line-clamp-1" style={{ color: themeConfig.swatch.ink, opacity: 0.75 }}>
                      {themeConfig.direction}
                    </p>
                  </div>

                  {/* Active Indicator footer */}
                  <div className="mt-3 pt-2 border-t border-black/5 flex items-center justify-between">
                    <span className="text-[9px] font-medium" style={{ color: themeConfig.swatch.ink, opacity: 0.65 }}>
                      {isSelected ? 'Active' : 'Apply'}
                    </span>
                    {isSelected && (
                      <span
                        className="w-4 h-4 rounded-full flex items-center justify-center text-white"
                        style={{ backgroundColor: themeConfig.swatch.accent }}
                      >
                        <Check className="w-2.5 h-2.5 font-bold" />
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default AppearanceSettingsCard;
