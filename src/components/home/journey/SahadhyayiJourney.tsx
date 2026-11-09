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
  Route,
} from 'lucide-react';
import { JOURNEY_DESTINATIONS } from './journeyData';
import { JourneyDestinationNode } from './JourneyDestinationNode';
import { JourneyScenicTrail } from './JourneyScenicTrail';

export const SahadhyayiJourney: React.FC = () => {
  const [activeStopIndex, setActiveStopIndex] = useState<number>(1);
  const [isAutoPlaying, setIsAutoPlaying] = useState<boolean>(false);

  const journeyContainerRef = useRef<HTMLElement>(null);
  const isUserInteractingRef = useRef<boolean>(false);

  const activeDestination =
    JOURNEY_DESTINATIONS[activeStopIndex - 1] || JOURNEY_DESTINATIONS[0];
  const progressPercent = Math.round(
    ((activeDestination.index - 1) / (JOURNEY_DESTINATIONS.length - 1)) * 100
  );

  const scrollToDestination = useCallback((targetIndex: number) => {
    const safeIndex = Math.min(JOURNEY_DESTINATIONS.length, Math.max(1, targetIndex));
    setActiveStopIndex(safeIndex);

    const element = document.getElementById('journey-node-' + safeIndex);
    if (element) {
      isUserInteractingRef.current = true;
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      window.setTimeout(() => {
        isUserInteractingRef.current = false;
      }, 900);
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

  useEffect(() => {
    if (typeof IntersectionObserver === 'undefined') return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (isUserInteractingRef.current) return;

        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          const match = entry.target.id.match(/journey-node-(\d+)/);
          const index = match?.[1] ? Number.parseInt(match[1], 10) : NaN;
          if (Number.isFinite(index) && index >= 1 && index <= JOURNEY_DESTINATIONS.length) {
            setActiveStopIndex(index);
          }
        });
      },
      {
        root: null,
        rootMargin: '-42% 0px -42% 0px',
        threshold: 0.15,
      }
    );

    JOURNEY_DESTINATIONS.forEach((destination) => {
      const element = document.getElementById('journey-node-' + destination.index);
      if (element) observer.observe(element);
    });

    return () => observer.disconnect();
  }, []);

  return (
    <section
      ref={journeyContainerRef}
      id="sahadhyayi-journey"
      className="sahadhyayi-bicycle-adventure relative isolate py-16 sm:py-20 lg:py-24 px-4 sm:px-6 lg:px-8 bg-background transition-colors duration-300 overflow-hidden"
      aria-label="Sahadhyayi interactive cycling journey"
    >
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
        <div className="absolute top-1/4 -left-32 w-[600px] h-[600px] rounded-full bg-[hsl(var(--brand-primary)/0.06)] blur-[140px]" />
        <div className="absolute bottom-1/3 -right-32 w-[600px] h-[600px] rounded-full bg-[hsl(var(--brand-secondary)/0.07)] blur-[150px]" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto">
        <div className="text-center max-w-3xl mx-auto mb-10 sm:mb-12">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[hsl(var(--brand-primary)/0.1)] border border-[hsl(var(--brand-primary)/0.2)] text-[11px] sm:text-xs font-bold uppercase tracking-wider text-[hsl(var(--brand-primary))] mb-4">
            <Bike className="w-4 h-4" />
            <span>Explore Sahadhyayi as You Ride</span>
          </div>

          <h2 className="text-3xl sm:text-4xl md:text-5xl font-serif font-bold text-foreground tracking-tight leading-[1.18] mb-4">
            A Journey Through Sahadhyayi
          </h2>

          <p className="text-base sm:text-lg text-muted-foreground leading-relaxed">
            Follow the trail through Sahadhyayi. Each stop represents a real section of the platform, with its own menu of places to explore.
          </p>
          <p className="mt-3 inline-flex items-center justify-center gap-2 text-xs sm:text-sm font-semibold text-[hsl(var(--brand-primary))]">
            <Route className="w-4 h-4" />
            <span className="inline-flex items-center gap-1.5"><span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-[hsl(var(--brand-primary))] text-white text-[10px]">1</span> Choose a place</span>
            <span aria-hidden="true">→</span>
            <span className="inline-flex items-center gap-1.5"><span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-[hsl(var(--brand-primary))] text-white text-[10px]">2</span> View its menu</span>
            <span aria-hidden="true">→</span>
            <span className="inline-flex items-center gap-1.5"><span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-[hsl(var(--brand-primary))] text-white text-[10px]">3</span> Open a feature</span>
          </p>
        </div>

        <div className="sticky top-20 z-40 mb-8 rounded-3xl bg-card/95 backdrop-blur-xl border border-border shadow-xl p-4 sm:p-5 transition-all">
          <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5 min-w-0">
              <div className="w-12 h-12 rounded-2xl bg-[hsl(var(--brand-primary))] text-white flex items-center justify-center shrink-0 shadow-md">
                <Bike className="w-6 h-6" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[hsl(var(--brand-primary))]">
                  <span>STOP {activeDestination.index} OF {JOURNEY_DESTINATIONS.length}</span>
                  <span>·</span>
                  <span>JOURNEY PROGRESS</span>
                </div>
                <h3 className="text-base sm:text-lg font-serif font-bold text-foreground truncate">
                  {activeDestination.title}
                </h3>
              </div>
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto py-1 scrollbar-none max-w-full" aria-label="Journey destinations">
              {JOURNEY_DESTINATIONS.map((destination) => {
                const isSelected = destination.index === activeStopIndex;
                const isPassed = destination.index < activeStopIndex;
                return (
                  <button
                    key={destination.id}
                    type="button"
                    onClick={() => scrollToDestination(destination.index)}
                    className={
                      'shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all cursor-pointer ' +
                      (isSelected
                        ? 'bg-[hsl(var(--brand-primary))] text-white font-bold shadow-md'
                        : isPassed
                          ? 'bg-muted text-foreground hover:bg-muted/80'
                          : 'bg-background hover:bg-muted text-muted-foreground border border-border')
                    }
                    title={'Jump to ' + destination.title}
                    aria-label={'Jump to ' + destination.title}
                    aria-current={isSelected ? 'step' : undefined}
                  >
                    <span>{destination.index}</span>
                    <span className="hidden md:inline truncate max-w-[90px]">{destination.title.split(' ')[0]}</span>
                  </button>
                );
              })}
            </div>

            <div className="flex items-center gap-2 self-end xl:self-auto shrink-0">
              <button
                type="button"
                onClick={handlePrevStop}
                disabled={activeStopIndex <= 1}
                className="p-2 rounded-xl border border-border bg-background hover:bg-muted text-foreground disabled:opacity-40 transition-all cursor-pointer"
                aria-label="Pedal to previous stop"
                title="Previous Stop"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={() => setIsAutoPlaying((playing) => !playing)}
                className={
                  'inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ' +
                  (isAutoPlaying
                    ? 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30'
                    : 'bg-background border border-border text-foreground hover:bg-muted')
                }
                aria-label={isAutoPlaying ? 'Pause bicycle tour' : 'Start auto tour'}
                title={isAutoPlaying ? 'Pause Auto Tour' : 'Start Auto Tour'}
              >
                {isAutoPlaying ? (
                  <>
                    <Pause className="w-3.5 h-3.5" />
                    <span>Riding...</span>
                  </>
                ) : (
                  <>
                    <Play className="w-3.5 h-3.5" />
                    <span>Auto Ride</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={handleNextStop}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[hsl(var(--brand-primary))] text-white font-semibold text-xs shadow-md hover:opacity-90 transition-all cursor-pointer"
                aria-label="Pedal to next stop"
              >
                <span>Next Stop</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-border">
            <div className="flex items-center justify-between gap-3 text-[11px] text-muted-foreground mb-2">
              <span>START</span>
              <span className="font-semibold text-foreground tabular-nums">
                {progressPercent}% of the journey explored
              </span>
              <span>FINISH</span>
            </div>
            <div
              className="h-2.5 rounded-full bg-muted overflow-hidden"
              role="progressbar"
              aria-label="Cycling journey progress"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={Math.round(progressPercent)}
            >
              <div
                className="h-full rounded-full bg-gradient-to-r from-[hsl(var(--brand-primary))] to-[hsl(var(--brand-secondary))] transition-[width] duration-700 ease-out"
                style={{ width: progressPercent + '%' }}
              />
            </div>
          </div>
        </div>

        <JourneyScenicTrail
          activeStopIndex={activeStopIndex}
          onSelect={scrollToDestination}
        />

        <div
          id={'journey-detail-' + activeDestination.index}
          className="mt-10 sm:mt-12 scroll-mt-36"
          aria-live="polite"
        >
          <div className="flex items-center justify-between gap-3 mb-4 px-1">
            <div>
              <p className="text-[10px] sm:text-xs font-bold uppercase tracking-[.16em] text-[hsl(var(--brand-primary))]">
                Explore this destination
              </p>
              <h2 className="text-xl sm:text-2xl font-serif font-bold text-foreground mt-1">
                {activeDestination.title}
              </h2>
            </div>
            <span className="text-xs text-muted-foreground whitespace-nowrap">
              Stop {activeDestination.index} / 8
            </span>
          </div>
          <JourneyDestinationNode
            destination={activeDestination}
            isActive={true}
            isPassed={false}
            onSelect={scrollToDestination}
          />
        </div>

        <div className="mt-16 sm:mt-20 p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-muted/60 via-card to-muted/40 border border-border text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[hsl(var(--brand-primary)/0.1)] text-[hsl(var(--brand-primary))] text-xs font-semibold uppercase tracking-wider mb-3">
            <Sparkles className="w-3.5 h-3.5" />
            <span>The Journey Continues Every Day</span>
          </div>
          <h3 className="text-xl sm:text-2xl font-serif font-bold text-foreground mb-2">
            Every Book is a New Horizon
          </h3>
          <p className="text-sm text-muted-foreground max-w-xl mx-auto mb-6">
            Whether you are reading in quiet solitude, sharing ideas with your circle, creating stories, or exploring with Book Expert AI, Sahadhyayi is your lifelong literary companion.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => scrollToDestination(1)}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-background hover:bg-muted border border-border text-foreground text-xs sm:text-sm font-semibold transition-all cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Ride From the Beginning</span>
            </button>
            <button
              type="button"
              onClick={() => scrollToDestination(8)}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[hsl(var(--brand-primary))] hover:opacity-90 text-white text-xs sm:text-sm font-semibold shadow-md transition-all cursor-pointer"
            >
              <Compass className="w-3.5 h-3.5" />
              <span>Ascend to AI Knowledge Station</span>
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};