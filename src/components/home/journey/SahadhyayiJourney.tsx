import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Bike,
  Milestone,
  ChevronRight,
  ChevronLeft,
  Play,
  Pause,
  RotateCcw,
  Sparkles,
  Compass,
} from 'lucide-react';
import { JOURNEY_DESTINATIONS, JourneyDestination } from './journeyData';
import { StudentCyclist } from './StudentCyclist';
import { JourneyDestinationNode } from './JourneyDestinationNode';

export const SahadhyayiJourney: React.FC = () => {
  const [activeStopIndex, setActiveStopIndex] = useState<number>(1);
  const [isAutoPlaying, setIsAutoPlaying] = useState<boolean>(false);
  const [isPedaling, setIsPedaling] = useState<boolean>(true);
  const [cyclistFacing, setCyclistFacing] = useState<'right' | 'left'>('right');

  const journeyContainerRef = useRef<HTMLDivElement>(null);
  const isUserInteractingRef = useRef<boolean>(false);

  const activeDestination =
    JOURNEY_DESTINATIONS.find((d) => d.index === activeStopIndex) || JOURNEY_DESTINATIONS[0];

  const totalDistance = 30.0;
  const progressPercent = Math.min(100, Math.max(0, (activeDestination.distanceKm / totalDistance) * 100));

  // Scroll to destination node smoothly
  const scrollToDestination = useCallback((targetIndex: number) => {
    setActiveStopIndex((prev) => {
      if (targetIndex > prev) setCyclistFacing('right');
      if (targetIndex < prev) setCyclistFacing('left');
      return targetIndex;
    });

    setIsPedaling(true);
    const element = document.getElementById(`journey-node-${targetIndex}`);
    if (element) {
      isUserInteractingRef.current = true;
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      setTimeout(() => {
        isUserInteractingRef.current = false;
      }, 800);
    }
  }, []);

  const handleNextStop = useCallback(() => {
    if (activeStopIndex < JOURNEY_DESTINATIONS.length) {
      scrollToDestination(activeStopIndex + 1);
    } else {
      scrollToDestination(1); // loop back
    }
  }, [activeStopIndex, scrollToDestination]);

  const handlePrevStop = useCallback(() => {
    if (activeStopIndex > 1) {
      scrollToDestination(activeStopIndex - 1);
    }
  }, [activeStopIndex, scrollToDestination]);

  // Autoplay / Auto-Ride timer
  useEffect(() => {
    if (!isAutoPlaying) return;

    const interval = setInterval(() => {
      handleNextStop();
    }, 6000);

    return () => clearInterval(interval);
  }, [isAutoPlaying, handleNextStop]);

  // Keyboard navigation (Arrow keys when journey container is in focus or viewport)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't intercept if user is typing in an input/textarea
      const tag = (e.target as HTMLElement)?.tagName?.toLowerCase();
      if (tag === 'input' || tag === 'textarea' || (e.target as HTMLElement)?.isContentEditable) {
        return;
      }

      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        if (e.altKey || e.metaKey) return;
        // Check if journey is on screen
        if (journeyContainerRef.current) {
          const rect = journeyContainerRef.current.getBoundingClientRect();
          if (rect.top < window.innerHeight && rect.bottom > 0) {
            e.preventDefault();
            handleNextStop();
          }
        }
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        if (e.altKey || e.metaKey) return;
        if (journeyContainerRef.current) {
          const rect = journeyContainerRef.current.getBoundingClientRect();
          if (rect.top < window.innerHeight && rect.bottom > 0) {
            e.preventDefault();
            handlePrevStop();
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleNextStop, handlePrevStop]);

  // Scroll sync: detect which landmark node is centered on screen
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (isUserInteractingRef.current) return; // avoid feedback loop during auto-scroll

        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const id = entry.target.id;
            const match = id.match(/journey-node-(\d+)/);
            if (match && match[1]) {
              const idx = parseInt(match[1], 10);
              setActiveStopIndex((prev) => {
                if (idx !== prev) {
                  setCyclistFacing(idx >= prev ? 'right' : 'left');
                }
                return idx;
              });
            }
          }
        });
      },
      {
        root: null,
        rootMargin: '-30% 0px -30% 0px', // Trigger when node is in center 40% of viewport
        threshold: 0.2,
      }
    );

    JOURNEY_DESTINATIONS.forEach((d) => {
      const el = document.getElementById(`journey-node-${d.index}`);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, []);

  return (
    <section
      ref={journeyContainerRef}
      id="sahadhyayi-journey"
      className="sahadhyayi-bicycle-adventure relative isolate py-16 sm:py-20 lg:py-28 px-4 sm:px-6 lg:px-8 bg-background transition-colors duration-300 overflow-hidden"
      aria-label="Sahadhyayi Literary Bicycle Adventure"
    >
      {/* Ambient background landscape glow matching active daily theme */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
        <div className="absolute top-1/4 -left-32 w-[600px] h-[600px] rounded-full bg-[hsl(var(--brand-primary)/0.06)] blur-[140px]" />
        <div className="absolute bottom-1/3 -right-32 w-[600px] h-[600px] rounded-full bg-[hsl(var(--brand-secondary)/0.07)] blur-[150px]" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-12 sm:mb-16">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[hsl(var(--brand-primary)/0.1)] border border-[hsl(var(--brand-primary)/0.2)] text-[11px] sm:text-xs font-bold uppercase tracking-wider text-[hsl(var(--brand-primary))] mb-4">
            <Bike className="w-4 h-4" />
            <span>Interactive Literary Odyssey</span>
          </div>

          <h2 className="text-3xl sm:text-4xl md:text-5xl font-serif font-bold text-foreground tracking-tight leading-[1.18] mb-4">
            A Journey Through Sahadhyayi
          </h2>

          <p className="text-base sm:text-lg text-muted-foreground leading-relaxed">
            Follow a young student riding a bicycle across our continuous world of reading, discovery, and shared wisdom. Traverse 8 distinct destinations from the classical archives to the AI observatory.
          </p>
        </div>

        {/* --- STICKY JOURNEY HUD & CYCLIST COMPASS BAR --- */}
        <div className="sticky top-20 z-30 mb-12 rounded-3xl bg-card/90 backdrop-blur-xl border border-border shadow-xl p-4 sm:p-5 transition-all">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            {/* Left: Active Destination Badge & Kilometer Ticker */}
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-[hsl(var(--brand-primary))] text-white flex items-center justify-center shrink-0 shadow-md">
                <Bike className="w-6 h-6" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[hsl(var(--brand-primary))]">
                  <span>Stop {activeDestination.index} of 8</span>
                  <span>·</span>
                  <span>{activeDestination.distanceKm.toFixed(1)} km</span>
                </div>
                <h3 className="text-base sm:text-lg font-serif font-bold text-foreground truncate">
                  {activeDestination.title}
                </h3>
              </div>
            </div>

            {/* Center: Interactive Waypoint Buttons */}
            <div className="flex items-center gap-1.5 overflow-x-auto py-1 scrollbar-none max-w-full">
              {JOURNEY_DESTINATIONS.map((dest) => {
                const isSelected = dest.index === activeStopIndex;
                const isPassed = dest.index < activeStopIndex;

                return (
                  <button
                    key={dest.id}
                    type="button"
                    onClick={() => scrollToDestination(dest.index)}
                    className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-[hsl(var(--brand-primary))] text-white font-bold shadow-md'
                        : isPassed
                        ? 'bg-muted text-foreground hover:bg-muted/80'
                        : 'bg-background hover:bg-muted text-muted-foreground border border-border'
                    }`}
                    title={`${dest.title} (${dest.distanceKm.toFixed(1)} km)`}
                    aria-label={`Jump to ${dest.title}`}
                  >
                    <span>{dest.index}</span>
                    <span className="hidden md:inline truncate max-w-[90px]">{dest.title.split(' ')[0]}</span>
                  </button>
                );
              })}
            </div>

            {/* Right: Controls (Previous, Next, Auto Ride) */}
            <div className="flex items-center gap-2 self-end lg:self-auto shrink-0">
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
                onClick={() => setIsAutoPlaying(!isAutoPlaying)}
                className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  isAutoPlaying
                    ? 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30'
                    : 'bg-background border border-border text-foreground hover:bg-muted'
                }`}
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

          {/* Continuous Scenic Road Ribbon with Dynamic Cyclist */}
          <div className="relative mt-4 pt-4 border-t border-border">
            {/* Road Track */}
            <div className="relative h-10 w-full rounded-xl bg-gradient-to-r from-stone-200 via-stone-300 to-stone-200 dark:from-stone-800 dark:via-stone-700 dark:to-stone-800 overflow-hidden shadow-inner flex items-center">
              {/* Road center dashed line */}
              <div
                className="absolute inset-x-0 h-0.5 border-t border-dashed border-white/60 dark:border-white/40"
                style={{ top: '50%' }}
              />

              {/* Waypoint milestones along the track */}
              {JOURNEY_DESTINATIONS.map((dest) => {
                const markLeft = (dest.distanceKm / totalDistance) * 100;
                return (
                  <div
                    key={dest.id}
                    className="absolute -translate-x-1/2 flex flex-col items-center pointer-events-none"
                    style={{ left: `${markLeft}%` }}
                  >
                    <div className="w-2 h-2 rounded-full bg-stone-400 dark:bg-stone-500" />
                    <span className="text-[9px] font-mono text-stone-500 dark:text-stone-400 mt-1">
                      {dest.distanceKm.toFixed(0)}k
                    </span>
                  </div>
                );
              })}

              {/* Animated Student Cyclist positioned dynamically on road */}
              <div
                className="absolute top-1/2 -translate-y-1/2 transition-all duration-700 ease-out pointer-events-none"
                style={{
                  left: `clamp(20px, ${progressPercent}%, calc(100% - 60px))`,
                  transform: 'translate(-50%, -50%)',
                }}
              >
                <StudentCyclist
                  size={58}
                  isPedaling={isPedaling}
                  facing={cyclistFacing}
                  tiltAngle={0}
                  accentColor="#1C442D"
                />
              </div>
            </div>

            {/* Distance Progress Legend */}
            <div className="flex items-center justify-between text-[11px] font-mono text-muted-foreground mt-2 px-1">
              <span>Km 0.0 · Library City</span>
              <span className="font-semibold text-foreground">
                Total Route: 30.0 km ({progressPercent.toFixed(0)}% Completed)
              </span>
              <span>Km 30.0 · AI Observatory</span>
            </div>
          </div>
        </div>

        {/* --- CONTINUOUS 8 DESTINATIONS PATHWAY --- */}
        <div className="space-y-12 sm:space-y-16 lg:space-y-20 relative">
          {/* Vertical connecting road dashed spine */}
          <div
            className="hidden lg:block absolute left-1/2 top-10 bottom-10 -translate-x-1/2 w-3 rounded-full bg-gradient-to-b from-[hsl(var(--brand-primary)/0.2)] via-[hsl(var(--brand-secondary)/0.25)] to-[#0284C7]/30 pointer-events-none"
            aria-hidden="true"
          >
            <div className="w-full h-full border-l-2 border-dashed border-[hsl(var(--brand-primary)/0.4)] ml-1" />
          </div>

          {JOURNEY_DESTINATIONS.map((destination) => (
            <JourneyDestinationNode
              key={destination.id}
              destination={destination}
              isActive={destination.index === activeStopIndex}
              isPassed={destination.index < activeStopIndex}
              onSelect={scrollToDestination}
            />
          ))}
        </div>

        {/* Bottom Journey Summary Banner */}
        <div className="mt-16 sm:mt-20 p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-muted/60 via-card to-muted/40 border border-border text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[hsl(var(--brand-primary)/0.1)] text-[hsl(var(--brand-primary))] text-xs font-semibold uppercase tracking-wider mb-3">
            <Sparkles className="w-3.5 h-3.5" />
            <span>The Journey Continues Every Day</span>
          </div>
          <h3 className="text-xl sm:text-2xl font-serif font-bold text-foreground mb-2">
            Every Book is a New Horizon
          </h3>
          <p className="text-sm text-muted-foreground max-w-xl mx-auto mb-6">
            Whether you are reading in quiet solitude, debating with your circle, or seeking answers with Book Expert AI, Sahadhyayi is your lifelong literary companion.
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
