import { useState, useId } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
  DISCOVERY_MOODS,
  PACE_DEFINITIONS,
  CONTENT_WARNING_OPTIONS,
  type MoodId,
  type PaceFilter,
  type ContentWarningFilterState,
} from '@/utils/moodPaceDiscovery';
import {
  Sparkles,
  Clock,
  ShieldAlert,
  RotateCcw,
  ChevronDown,
  ChevronUp,
  Bookmark,
  Check,
  X,
  Info,
} from 'lucide-react';

interface MoodPaceContentFilterProps {
  selectedMood: MoodId | null;
  onSelectMood: (mood: MoodId | null) => void;
  paceFilter: PaceFilter;
  onChangePace: (pace: PaceFilter) => void;
  includeUnknownLength: boolean;
  onToggleIncludeUnknownLength: (include: boolean) => void;
  contentWarnings: ContentWarningFilterState;
  onChangeContentWarnings: (state: ContentWarningFilterState) => void;
  hasActiveFilters: boolean;
  onClearFilters: () => void;
  isPreferencesSaved: boolean;
  onSavePreferences: () => void;
  onClearPreferences: () => void;
}

export default function MoodPaceContentFilter({
  selectedMood,
  onSelectMood,
  paceFilter,
  onChangePace,
  includeUnknownLength,
  onToggleIncludeUnknownLength,
  contentWarnings,
  onChangeContentWarnings,
  hasActiveFilters,
  onClearFilters,
  isPreferencesSaved,
  onSavePreferences,
  onClearPreferences,
}: MoodPaceContentFilterProps) {
  const [showWarningsPanel, setShowWarningsPanel] = useState(false);
  const [showPreferencesConsent, setShowPreferencesConsent] = useState(false);
  const unknownLengthId = useId();
  const strictSafetyId = useId();

  const toggleWarning = (warning: string) => {
    const exists = contentWarnings.hiddenWarnings.includes(warning);
    const updated = exists
      ? contentWarnings.hiddenWarnings.filter((w) => w !== warning)
      : [...contentWarnings.hiddenWarnings, warning];

    onChangeContentWarnings({
      ...contentWarnings,
      hiddenWarnings: updated,
    });
  };

  const selectedMoodMeta = DISCOVERY_MOODS.find((m) => m.id === selectedMood);

  return (
    <div className="space-y-4">
      {/* 1. Mood Selection Chips */}
      <div className="space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <Label className="text-sm font-semibold flex items-center gap-1.5 text-foreground">
            <Sparkles className="w-4 h-4 text-primary" aria-hidden="true" />
            Reading Mood &amp; Vibe
          </Label>
          {selectedMoodMeta && (
            <span className="text-xs text-muted-foreground hidden sm:inline">
              {selectedMoodMeta.description}
            </span>
          )}
        </div>

        <div
          role="group"
          aria-label="Filter by reading mood"
          className="flex flex-wrap gap-2"
        >
          {DISCOVERY_MOODS.map((mood) => {
            const isSelected = selectedMood === mood.id;
            return (
              <Button
                key={mood.id}
                type="button"
                size="sm"
                variant={isSelected ? 'default' : 'outline'}
                aria-pressed={isSelected}
                onClick={() => onSelectMood(isSelected ? null : mood.id)}
                className={`transition-all rounded-full h-8 px-3 text-xs font-medium ${
                  isSelected
                    ? 'shadow-sm ring-2 ring-primary ring-offset-1'
                    : 'hover:border-primary/50'
                }`}
              >
                <span className="mr-1.5" aria-hidden="true">
                  {mood.icon}
                </span>
                {mood.label}
              </Button>
            );
          })}
        </div>

        <p className="text-xs text-muted-foreground">
          {selectedMoodMeta ? (
            <span className="inline-flex items-center gap-1 text-primary font-medium">
              <Check className="w-3.5 h-3.5" /> Filtering for {selectedMoodMeta.label}. Inferred &amp; reader-tagged books prioritized.
            </span>
          ) : (
            'Choose a reading mood to discover books by atmospheric tone, or combine with pace and content filters below.'
          )}
        </p>
      </div>

      {/* 2. Pace & Length Filter Chips */}
      <div className="space-y-2 pt-2 border-t border-border/60">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <Label className="text-sm font-semibold flex items-center gap-1.5 text-foreground">
            <Clock className="w-4 h-4 text-primary" aria-hidden="true" />
            Reading Pace &amp; Length
          </Label>
          <div className="flex items-center space-x-2">
            <Switch
              id={unknownLengthId}
              checked={includeUnknownLength}
              onCheckedChange={onToggleIncludeUnknownLength}
            />
            <Label htmlFor={unknownLengthId} className="text-xs text-muted-foreground cursor-pointer">
              Include books without page count
            </Label>
          </div>
        </div>

        <div
          role="group"
          aria-label="Filter by reading pace"
          className="grid grid-cols-2 sm:grid-cols-4 gap-2"
        >
          {(Object.keys(PACE_DEFINITIONS) as PaceFilter[]).map((paceKey) => {
            const isSelected = paceFilter === paceKey;
            const pace = PACE_DEFINITIONS[paceKey];
            return (
              <Button
                key={paceKey}
                type="button"
                size="sm"
                variant={isSelected ? 'default' : 'outline'}
                aria-pressed={isSelected}
                onClick={() => onChangePace(paceKey)}
                className={`flex flex-col items-start justify-center h-auto py-2 px-3 text-left transition-all ${
                  isSelected
                    ? 'ring-2 ring-primary ring-offset-1 shadow-sm'
                    : 'hover:border-primary/40'
                }`}
              >
                <span className="font-semibold text-xs">{pace.label}</span>
                <span className="text-[11px] opacity-80">{pace.description}</span>
              </Button>
            );
          })}
        </div>
      </div>

      {/* 3. Content Warning & Preference Safeguards */}
      <div className="pt-2 border-t border-border/60">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Label className="text-sm font-semibold flex items-center gap-1.5 text-foreground">
              <ShieldAlert className="w-4 h-4 text-amber-600 dark:text-amber-400" aria-hidden="true" />
              Content Warnings &amp; Safety
            </Label>
            {contentWarnings.hiddenWarnings.length > 0 && (
              <Badge variant="secondary" className="text-xs bg-amber-500/10 text-amber-700 dark:text-amber-300">
                {contentWarnings.hiddenWarnings.length} excluded
              </Badge>
            )}
          </div>

          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setShowWarningsPanel(!showWarningsPanel)}
            className="text-xs h-7 text-muted-foreground hover:text-foreground"
          >
            {showWarningsPanel ? (
              <>
                Hide safety controls <ChevronUp className="w-3.5 h-3.5 ml-1" />
              </>
            ) : (
              <>
                Configure excluded topics <ChevronDown className="w-3.5 h-3.5 ml-1" />
              </>
            )}
          </Button>
        </div>

        {showWarningsPanel && (
          <Card className="mt-3 border-amber-500/20 bg-amber-500/5">
            <CardContent className="pt-4 pb-4 space-y-3">
              <div className="flex items-start gap-2 text-xs text-muted-foreground">
                <Info className="w-4 h-4 shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
                <p>
                  Warnings are sourced from reader submissions and verified publisher notes—never AI-fabricated.
                  Select topics you wish to hide from discovery results.
                </p>
              </div>

              <div
                role="group"
                aria-label="Content warning exclusions"
                className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 pt-1"
              >
                {CONTENT_WARNING_OPTIONS.map((warning) => {
                  const isHidden = contentWarnings.hiddenWarnings.includes(warning);
                  return (
                    <button
                      key={warning}
                      type="button"
                      aria-pressed={isHidden}
                      onClick={() => toggleWarning(warning)}
                      className={`flex items-center gap-2 px-2.5 py-1.5 rounded-md text-xs border text-left transition-colors ${
                        isHidden
                          ? 'border-red-500/40 bg-red-500/15 text-red-900 dark:text-red-200 font-medium'
                          : 'border-border/70 bg-background/60 text-muted-foreground hover:border-foreground/30'
                      }`}
                    >
                      <span className={`w-3 h-3 rounded flex items-center justify-center border text-[9px] ${
                        isHidden ? 'bg-red-500 text-white border-red-500' : 'border-muted-foreground'
                      }`}>
                        {isHidden && '✕'}
                      </span>
                      <span className="capitalize">{warning}</span>
                    </button>
                  );
                })}
              </div>

              <div className="pt-2 flex flex-wrap items-center justify-between gap-3 border-t border-border/40 text-xs">
                <div className="flex items-center space-x-2">
                  <Switch
                    id={strictSafetyId}
                    checked={contentWarnings.strictUnknown}
                    onCheckedChange={(checked) =>
                      onChangeContentWarnings({
                        ...contentWarnings,
                        strictUnknown: checked,
                      })
                    }
                  />
                  <Label htmlFor={strictSafetyId} className="cursor-pointer text-muted-foreground">
                    Strict mode: Hide unreviewed books when exclusions are active
                  </Label>
                </div>

                {contentWarnings.hiddenWarnings.length > 0 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                      onChangeContentWarnings({
                        hiddenWarnings: [],
                        strictUnknown: false,
                      })
                    }
                    className="text-xs h-6 px-2 text-muted-foreground hover:text-foreground"
                  >
                    Clear safety exclusions
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* 4. Filter Action Bar & User Consent Preferences */}
      <div className="pt-2 border-t border-border/60 flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          {hasActiveFilters && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onClearFilters}
              className="text-xs h-7 text-muted-foreground hover:text-foreground"
            >
              <RotateCcw className="w-3.5 h-3.5 mr-1" />
              Reset all discovery filters
            </Button>
          )}

          {isPreferencesSaved ? (
            <div className="flex items-center gap-1.5">
              <Badge variant="outline" className="text-xs gap-1 border-primary/40 text-primary">
                <Check className="w-3 h-3" /> Preferences saved
              </Badge>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={onClearPreferences}
                className="text-xs h-6 px-1.5 text-muted-foreground hover:text-destructive"
                title="Clear saved preferences from this device"
              >
                <X className="w-3 h-3" />
              </Button>
            </div>
          ) : (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setShowPreferencesConsent(true)}
              className="text-xs h-7"
            >
              <Bookmark className="w-3.5 h-3.5 mr-1" />
              Save these preferences
            </Button>
          )}
        </div>

        {showPreferencesConsent && !isPreferencesSaved && (
          <div className="w-full rounded-lg border border-primary/20 bg-primary/5 p-3 text-xs space-y-2 mt-2">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="font-semibold text-foreground">Save discovery preferences on this device?</p>
                <p className="text-muted-foreground mt-0.5">
                  We will remember your chosen mood, pace, and content filters for future visits.
                  Your reading choices stay private and are never used to infer sensitive personal traits.
                </p>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setShowPreferencesConsent(false)}
                className="h-6 w-6 p-0 text-muted-foreground"
              >
                ✕
              </Button>
            </div>
            <div className="flex justify-end gap-2 pt-1">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setShowPreferencesConsent(false)}
                className="h-7 text-xs"
              >
                Cancel
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={() => {
                  onSavePreferences();
                  setShowPreferencesConsent(false);
                }}
                className="h-7 text-xs"
              >
                Confirm &amp; Save
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
