import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Bike,
  ChevronRight,
  ChevronLeft,
  Play,
  Pause,
  RotateCcw,
  Sparkles,
  Compass,
  MapPin,
  Bookmark,
  X,
} from 'lucide-react';
import { JOURNEY_DESTINATIONS } from './journeyData';
import { JourneyDestinationNode } from './JourneyDestinationNode';
import { JourneyScenicTrail } from './JourneyScenicTrail';

const JOURNEY_STORAGE_KEY = 'sahadhyayi_journey_progress';

type JourneyProgress = {
  activeStopIndex: number;
  visitedStops: number[];
  lastVisitedAt: string;
  completedAt?: string;
};

export const SahadhyayiJourney: React.FC = () => {
  const [activeStopIndex, setActiveStopIndex] = useState<number>(1);
  const [isAutoPlaying, setIsAutoPlaying] = useState<boolean>(false);
  const [showResumeBanner, setShowResumeBanner] = useState<boolean>(false);
  const [savedProgress, setSavedProgress] = useState<JourneyProgress | null>(null);
  const [hasInteracted, setHasInteracted] = useState<boolean>(false);

  const journeyContainerRef = useRef<HTMLElement>(null);

  // Load saved progress from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(JOURNEY_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as JourneyProgress;
        // Only restore if progress is meaningful (not just first stop)
        if (parsed.activeStopIndex > 1 || (parsed.visitedStops?.length ?? 0) > 1) {
          setSavedProgress(parsed);
          // Show resume banner after a short delay
          setTimeout(() => setShowResumeBanner(true), 1000);
        }
      }
    } catch {
      // Ignore localStorage errors
    }
  }, []);

  // Save progress to localStorage whenever activeStopIndex changes
  useEffect(() => {
    if (!hasInteracted) return; // Don't save initial load

    try {
      const existing = localStorage.getItem(JOURNEY_STORAGE_KEY);
      const existingProgress = existing ? JSON.parse(existing) as JourneyProgress : { activeStopIndex: 1, visitedStops: [], lastVisitedAt: '' };

      const visitedStops = Array.from(new Set([...existingProgress.visitedStops, activeStopIndex]));
      const isComplete = visitedStops.length >= JOURNEY_DESTINATIONS.length;

      const progress: JourneyProgress = {
        activeStopIndex,
        visitedStops,
        lastVisitedAt: new Date().toISOString(),
        completedAt: isComplete ? new Date().toISOString() : undefined,
      };

      localStorage.setItem(JOURNEY_STORAGE_KEY, JSON.stringify(progress));
      setSavedProgress(progress);
    } catch {
      // Ignore localStorage errors
    }
  }, [activeStopIndex, hasInteracted]);

  const activeDestination =
    JOURNEY_DESTINATIONS[activeStopIndex - 1] || JOURNEY_DESTINATIONS[0];
  const progressPercent = Math.round(
    ((activeDestination.index - 1) / (JOURNEY_DESTINATIONS.length - 1)) * 100
  );

  const scrollToDestination = useCallback((targetIndex: number, scrollIntoDetail = false) => {
    const safeIndex = Math.min(JOURNEY_DESTINATIONS.length, Math.max(1, targetIndex));
    setActiveStopIndex(safeIndex);
    setHasInteracted(true);
    setShowResumeBanner(false); // Hide banner once user interacts

    if (scrollIntoDetail) {
      const detailElement = document.getElementById('journey-detail-section');
      if (detailElement) {
        detailElement.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    }
  }, []);

  const handleNextStop = useCallback(() => {
    scrollToDestination(activeStopIndex < JOURNEY_DESTINATIONS.length ? activeStopIndex + 1 : 1);
  }, [activeStopIndex, scrollToDestination]);

  const handlePrevStop = useCallback(() => {
    if (activeStopIndex > 1) {
      scrollToDestination(activeStopIndex - 1);
    }
  }, [activeStopIndex, scrollToDestination]);

  const handleResumeJourney = useCallback(() => {
    if (savedProgress) {
      scrollToDestination(savedProgress.activeStopIndex, true);
      setShowResumeBanner(false);
    }
  }, [savedProgress, scrollToDestination]);

  const handleDismissBanner = useCallback(() => {
    setShowResumeBanner(false);
  }, []);

  const handleRestartJourney = useCallback(() => {
    scrollToDestination(1, true);
    setShowResumeBanner(false);
  }, [scrollToDestination]);

  useEffect(() => {
    if (!isAutoPlaying) return;
    const interval = window.setInterval(handleNextStop, 6000);
    return () => window.clearInterval(interval);
  }, [isAutoPlaying, handleNextStop]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const tag = target?.tagName?.toLowerCase();
      if (tag === 'input' || tag === 'textarea' || target?.isContentEditable) return;
      if (event.altKey || event.metaKey || event.ctrlKey) return;

      const container = journeyContainerRef.current;
      if (!container) return;
      const rect = container.getBoundingClientRect();
      if (rect.top >= window.innerHeight || rect.bottom <= 0) return;

      if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
        event.preventDefault();
        handleNextStop();
      } else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
        event.preventDefault();
        handlePrevStop();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleNextStop, handlePrevStop]);

  const visitedCount = savedProgress?.visitedStops?.length ?? 0;
  const isComplete = visitedCount >= JOURNEY_DESTINATIONS.length;

  return (
    <section
      ref={journeyContainerRef}
      id="sahadhyayi-journey"
      className="sahadhyayi-bicycle-adventure relative isolate py-16 sm:py-20 lg:py-28 px-4 sm:px-6 lg:px-8 bg-background transition-colors duration-300 overflow-hidden"
      aria-label="Sahadhyayi interactive cycling journey"
    >
      {/* Ambient background glows */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
        <div className="absolute top-1/4 -left-40 w-[700px] h-[700px] rounded-full bg-[hsl(var(--brand-primary)/0.05)] blur-[160px]" />
        <div className="absolute bottom-1/3 -right-40 w-[700px] h-[700px] rounded-full bg-[hsl(var(--brand-secondary)/0.06)] blur-[180px]" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto">

        {/* ── Resume Journey Banner ── */}
        {showResumeBanner && savedProgress && (
          <div
            className="mb-8 relative overflow-hidden rounded-2xl bg-white/90 dark:bg-[#131715]/90 border border-[#8F681C]/30 dark:border-[#D5B16D]/30 p-4 sm:p-5 shadow-lg backdrop-blur-sm animate-slide-down"
            role="status"
            aria-live="polite"
          >
            <style>{`
              @keyframes slide-down {
                from { opacity: 0; transform: translateY(-10px); }
                to { opacity: 1; transform: translateY(0); }
              }
              .animate-slide-down { animation: slide-down 400ms cubic-bezier(.2,.7,.2,1); }
            `}</style>
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
              <div className="flex items-center gap-3 shrink-0">
                <div className="w-10 h-10 rounded-xl bg-[#8F681C]/10 dark:bg-[#D5B16D]/10 flex items-center justify-center">
                  <Bookmark className="w-5 h-5 text-[#8F681C] dark:text-[#D5B16D]" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-[#1C201D] dark:text-[#F3F0E7]">
                    You've explored {visitedCount} of {JOURNEY_DESTINATIONS.length} destinations
                  </p>
                  <p className="text-xs text-[#636B65] dark:text-[#A5ADA6]">
                    Last stop: {JOURNEY_DESTINATIONS[savedProgress.activeStopIndex - 1]?.title || 'Library City'}
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2 sm:ml-auto">
                <button
                  type="button"
                  onClick={handleResumeJourney}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#1C442D] hover:bg-[#143221] dark:bg-[#D5B16D] dark:hover:bg-[#e4c688] text-white dark:text-stone-950 text-sm font-semibold transition-all shadow-sm"
                >
                  <MapPin className="w-3.5 h-3.5" />
                  <span>Resume Journey</span>
                </button>
                <button
                  type="button"
                  onClick={handleRestartJourney}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full border border-[#E5E0D8] hover:border-[#8F681C]/50 bg-white hover:bg-[#FAF7F0] dark:border-[#242E28] dark:hover:border-[#38483D] dark:bg-[#18201B] dark:hover:bg-[#202923] text-[#1C201D] dark:text-[#F3F0E7] text-sm font-semibold transition-all"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Start Over</span>
                </button>
                <button
                  type="button"
                  onClick={handleDismissBanner}
                  className="p-1.5 rounded-lg text-[#636B65] dark:text-[#A5ADA6] hover:bg-[#E5E0D8] dark:hover:bg-[#242E28] transition-colors"
                  aria-label="Dismiss resume banner"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
            {isComplete && (
              <div className="mt-3 pt-3 border-t border-[#E5E0D8] dark:border-[#242E28] flex items-center gap-2 text-xs text-[#8F681C] dark:text-[#D5B16D]">
                <Sparkles className="w-3.5 h-3.5" />
                <span className="font-semibold">Journey complete! 🎉 You've visited all {JOURNEY_DESTINATIONS.length} destinations.</span>
              </div>
            )}
          </div>
        )}

        {/* ── Section header ── */}
        <div className="text-center max-w-2xl mx-auto mb-12 sm:mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[hsl(var(--brand-primary)/0.08)] border border-[hsl(var(--brand-primary)/0.18)] text-[11px] font-bold uppercase tracking-widest text-[hsl(var(--brand-primary))] mb-5">
            <Bike className="w-3.5 h-3.5" />
            <span>Explore as You Ride</span>
          </div>

          <h2 className="text-3xl sm:text-4xl md:text-[2.75rem] font-serif font-bold text-foreground tracking-tight leading-[1.15] mb-4">
            A Journey Through<br className="hidden sm:block" /> Sahadhyayi
          </h2>

          <p className="text-base sm:text-lg text-muted-foreground leading-relaxed">
            Eight destinations. One winding road. Click any landmark to discover what lives inside each corner of Sahadhyayi.
          </p>
        </div>

        {/* ── Sticky control bar ── */}
        <div className="sticky top-20 z-40 mb-10 rounded-2xl bg-card/95 backdrop-blur-xl border border-border/80 shadow-lg shadow-black/5 overflow-hidden">
          {/* Accent top line using active destination color */}
          <div
            className="h-0.5 w-full transition-colors duration-500"
            style={{ background: activeDestination.accentColor }}
            aria-hidden="true"
          />

          <div className="p-3 sm:p-4">
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">

              {/* Current stop identity */}
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <div
                  className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl flex items-center justify-center shrink-0 text-white shadow-md transition-colors duration-500"
                  style={{ background: activeDestination.accentColor }}
                >
                  <Bike className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] font-bold uppercase tracking-[.14em] text-muted-foreground">
                    Stop {activeDestination.index} of {JOURNEY_DESTINATIONS.length}
                  </p>
                  <p className="text-sm sm:text-base font-serif font-bold text-foreground truncate leading-tight">
                    {activeDestination.title}
                  </p>
                </div>
              </div>

              {/* Dot-step navigator */}
              <div
                className="flex items-center gap-1.5 overflow-x-auto scrollbar-none shrink-0"
                aria-label="Journey stops"
              >
                {JOURNEY_DESTINATIONS.map((dest) => {
                  const isActive = dest.index === activeStopIndex;
                  const isPast = dest.index < activeStopIndex;
                  const isVisited = savedProgress?.visitedStops?.includes(dest.index) ?? false;
                  return (
                    <button
                      key={dest.id}
                      type="button"
                      onClick={() => scrollToDestination(dest.index)}
                      title={dest.title}
                      aria-label={`Go to stop ${dest.index}: ${dest.title}${isVisited && isPast ? ' (visited)' : ''}`}
                      aria-current={isActive ? 'step' : undefined}
                      className="group relative shrink-0 transition-all duration-200 cursor-pointer"
                    >
                      <span
                        className={
                          'flex items-center justify-center rounded-full text-[10px] font-bold transition-all duration-200 ' +
                          (isActive
                            ? 'w-7 h-7 text-white shadow-md'
                            : isPast
                              ? 'w-5 h-5 opacity-70 hover:opacity-100'
                              : 'w-5 h-5 bg-muted border border-border text-muted-foreground hover:bg-muted/80')
                        }
                        style={
                          isActive
                            ? { background: activeDestination.accentColor }
                            : isVisited && isPast
                              ? { background: dest.accentColor, color: '#fff' }
                              : isPast
                                ? { background: dest.accentColor, color: '#fff', opacity: 0.6 }
                                : {}
                        }
                      >
                        {dest.index}
                      </span>
                      {/* Visited checkmark for past stops */}
                      {isVisited && isPast && !isActive && (
                        <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-green-500 text-white text-[10px] flex items-center justify-center">
                          ✓
                        </span>
                      )}
                      {/* Tooltip on hover */}
                      <span className="pointer-events-none absolute -bottom-7 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-md bg-popover border border-border text-popover-foreground text-[10px] px-2 py-0.5 shadow-sm opacity-0 group-hover:opacity-100 transition-opacity duration-150 z-50">
                        {dest.title.split(' ')[0]}{isVisited && isPast ? ' ✓' : ''}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Navigation controls */}
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={handlePrevStop}
                  disabled={activeStopIndex <= 1}
                  className="p-2 rounded-lg border border-border bg-background hover:bg-muted text-foreground disabled:opacity-30 transition-all cursor-pointer"
                  aria-label="Previous stop"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>

                <button
                  type="button"
                  onClick={() => setIsAutoPlaying((p) => !p)}
                  className={
                    'inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer border ' +
                    (isAutoPlaying
                      ? 'bg-amber-50 text-amber-700 border-amber-300 dark:bg-amber-900/20 dark:text-amber-300 dark:border-amber-700/40'
                      : 'bg-background border-border text-foreground hover:bg-muted')
                  }
                  aria-label={isAutoPlaying ? 'Pause tour' : 'Auto ride'}
                >
                  {isAutoPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                  <span className="hidden sm:inline">{isAutoPlaying ? 'Pause' : 'Auto'}</span>
                </button>

                <button
                  type="button"
                  onClick={handleNextStop}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-white font-semibold text-xs shadow-sm hover:opacity-90 transition-all cursor-pointer"
                  style={{ background: activeDestination.accentColor }}
                  aria-label="Next stop"
                >
                  <span>Next</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Progress bar */}
            <div className="mt-3 pt-3 border-t border-border/60">
              <div
                className="h-1.5 rounded-full bg-muted overflow-hidden"
                role="progressbar"
                aria-label="Journey progress"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={progressPercent}
              >
                <div
                  className="h-full rounded-full transition-[width] duration-700 ease-out"
                  style={{
                    width: progressPercent + '%',
                    background: `linear-gradient(90deg, ${activeDestination.accentColor}, ${activeDestination.accentColor}99)`,
                  }}
                />
              </div>
              <div className="flex justify-between mt-1 text-[10px] text-muted-foreground">
                <span>Start</span>
                <span className="font-medium text-foreground">{progressPercent}% explored</span>
                <span>Finish</span>
              </div>
            </div>
          </div>
        </div>

        {/* ── Scenic trail map ── */}
        <JourneyScenicTrail
          activeStopIndex={activeStopIndex}
          onSelect={scrollToDestination}
        />

        {/* ── Destination detail panel ── */}
        <div
          id="journey-detail-section"
          className="mt-12 sm:mt-14 scroll-mt-28"
          aria-live="polite"
        >
          {/* Destination tab switcher — single row, clean pills */}
          <div
            className="flex items-center gap-2 overflow-x-auto pb-3 mb-6 scrollbar-none"
            role="tablist"
            aria-label="Destination tabs"
          >
            {JOURNEY_DESTINATIONS.map((dest) => {
              const isActive = dest.index === activeStopIndex;
              const isVisited = savedProgress?.visitedStops?.includes(dest.index) ?? false;
              return (
                <button
                  key={dest.id}
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  onClick={() => scrollToDestination(dest.index, false)}
                  className={
                    'shrink-0 inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-semibold transition-all duration-200 cursor-pointer border whitespace-nowrap ' +
                    (isActive
                      ? 'text-white border-transparent shadow-md'
                      : 'bg-background border-border text-muted-foreground hover:text-foreground hover:border-border/80 hover:bg-muted/60')
                  }
                  style={isActive ? { background: dest.accentColor, borderColor: dest.accentColor } : {}}
                >
                  <MapPin className="w-3 h-3" />
                  <span>{dest.title}</span>
                  {isVisited && !isActive && (
                    <span className="w-3.5 h-3.5 rounded-full bg-green-500 text-white text-[9px] flex items-center justify-center">✓</span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Active destination card */}
          <div
            id={'journey-detail-' + activeDestination.index}
            className="rounded-3xl border border-border/60 overflow-hidden shadow-xl transition-all duration-300"
            style={{
              borderTopColor: activeDestination.accentColor,
              borderTopWidth: '3px',
            }}
          >
            <JourneyDestinationNode
              destination={activeDestination}
              isActive={true}
              isPassed={false}
              onSelect={scrollToDestination}
            />
          </div>
        </div>

        {/* ── Footer CTA ── */}
        <div className="mt-16 sm:mt-20 relative overflow-hidden rounded-3xl border border-border/50 bg-gradient-to-br from-card via-card/80 to-muted/30 p-8 sm:p-10 text-center">
          {/* Soft background accent */}
          <div
            className="pointer-events-none absolute inset-0 opacity-[0.04]"
            style={{
              background: `radial-gradient(ellipse at 50% 0%, ${activeDestination.accentColor}, transparent 70%)`,
            }}
            aria-hidden="true"
          />
          <div className="relative z-10">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[hsl(var(--brand-primary)/0.08)] border border-[hsl(var(--brand-primary)/0.18)] text-[hsl(var(--brand-primary))] text-xs font-semibold uppercase tracking-wider mb-4">
              <Sparkles className="w-3.5 h-3.5" />
              <span>The Journey Never Ends</span>
            </div>
            <h3 className="text-2xl sm:text-3xl font-serif font-bold text-foreground mb-3">
              Every Book is a New Horizon
            </h3>
            <p className="text-sm sm:text-base text-muted-foreground max-w-lg mx-auto mb-7 leading-relaxed">
              Whether reading in solitude, sharing ideas with friends, writing stories, or exploring with Book Expert AI — Sahadhyayi is your lifelong literary companion.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => scrollToDestination(1, true)}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-background hover:bg-muted border border-border text-foreground text-sm font-semibold transition-all cursor-pointer shadow-sm"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Ride from the Start</span>
              </button>
              <button
                type="button"
                onClick={() => scrollToDestination(
                  activeStopIndex < JOURNEY_DESTINATIONS.length ? activeStopIndex + 1 : 1,
                  true,
                )}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-white text-sm font-semibold shadow-md transition-all cursor-pointer hover:opacity-90"
                style={{ background: activeDestination.accentColor }}
              >
                <Compass className="w-3.5 h-3.5" />
                <span>
                  {activeStopIndex < JOURNEY_DESTINATIONS.length
                    ? `Next: ${JOURNEY_DESTINATIONS[activeStopIndex].title}`
                    : 'Back to Library City'}
                </span>
              </button>
            </div>
          </div>
        </div>

      </div>
    </section>
  );
};