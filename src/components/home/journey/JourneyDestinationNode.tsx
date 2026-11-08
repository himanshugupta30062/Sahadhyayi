import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, CheckCircle2, Milestone, Compass, Sparkles } from 'lucide-react';
import { JourneyDestination } from './journeyData';
import { JourneyLandmarkArt } from './JourneyLandmarkArt';
import { JourneyAiStation } from './JourneyAiStation';

interface JourneyDestinationNodeProps {
  destination: JourneyDestination;
  isActive: boolean;
  isPassed: boolean;
  onSelect: (index: number) => void;
}

export const JourneyDestinationNode: React.FC<JourneyDestinationNodeProps> = ({
  destination,
  isActive,
  isPassed,
  onSelect,
}) => {
  return (
    <div
      id={`journey-node-${destination.index}`}
      className={`group relative transition-all duration-500 rounded-3xl p-6 sm:p-8 lg:p-10 ${
        isActive
          ? 'bg-card text-card-foreground shadow-2xl ring-2 ring-[hsl(var(--brand-primary))]'
          : 'bg-card/70 hover:bg-card text-card-foreground/90 shadow-md border border-border/60 hover:border-border'
      }`}
      role="region"
      aria-label={`${destination.title} - ${destination.badge}`}
    >
      {/* Top Banner: Milestone badge + Status */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold tracking-wide uppercase bg-[hsl(var(--brand-primary)/0.1)] text-[hsl(var(--brand-primary))] border border-[hsl(var(--brand-primary)/0.2)]">
          <Milestone className="w-3.5 h-3.5" />
          <span>{destination.badge}</span>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-mono font-semibold px-2.5 py-1 rounded-md bg-muted text-muted-foreground">
            {destination.distanceKm.toFixed(1)} km
          </span>
          {isPassed && !isActive && (
            <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Visited</span>
            </span>
          )}
          {isActive && (
            <span className="inline-flex items-center gap-1.5 text-xs font-bold text-[hsl(var(--brand-primary))] animate-pulse">
              <span className="w-2 h-2 rounded-full bg-[hsl(var(--brand-primary))]" />
              <span>Current Stop</span>
            </span>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        {/* Left Column: Landmark Illustration */}
        <div className="lg:col-span-5 flex flex-col items-center text-center">
          <div className="relative w-full max-w-[280px] sm:max-w-[320px] mx-auto p-4 rounded-2xl bg-gradient-to-b from-muted/50 to-muted/20 border border-border/40">
            <JourneyLandmarkArt id={destination.id} isCurrent={isActive} />
            <div className="mt-3 text-xs font-serif font-medium text-muted-foreground italic">
              {destination.landmarkName}
            </div>
          </div>
        </div>

        {/* Right Column: Title, Lore, Description, Features, CTAs */}
        <div className="lg:col-span-7 space-y-5 text-left">
          <div>
            <h3 className="text-2xl sm:text-3xl font-serif font-bold text-foreground tracking-tight">
              {destination.title}
            </h3>
            <p className="text-sm sm:text-base font-serif italic text-[hsl(var(--brand-secondary))] mt-1">
              {destination.subtitle}
            </p>
          </div>

          {/* Lore Quote Note */}
          <div className="p-3.5 rounded-xl bg-muted/40 border-l-4 border-[hsl(var(--brand-primary))] text-xs sm:text-sm text-foreground/80 italic leading-relaxed">
            &ldquo;{destination.lore}&rdquo;
          </div>

          <p className="text-sm text-muted-foreground leading-relaxed">
            {destination.description}
          </p>

          {/* Key Stats Row */}
          <div className="grid grid-cols-3 gap-3 pt-1">
            {destination.stats.map((stat, idx) => (
              <div key={idx} className="p-2.5 rounded-xl bg-background/80 border border-border/60 text-center">
                <div className="text-base sm:text-lg font-bold font-serif text-foreground">{stat.value}</div>
                <div className="text-[10px] sm:text-xs text-muted-foreground uppercase tracking-wider">{stat.label}</div>
              </div>
            ))}
          </div>

          {/* Feature highlights */}
          <div className="space-y-2 pt-2">
            {destination.features.map((feat, idx) => (
              <div key={idx} className="flex items-start gap-2 text-xs sm:text-sm text-foreground/90">
                <CheckCircle2 className="w-4 h-4 text-[hsl(var(--brand-primary))] shrink-0 mt-0.5" />
                <span>
                  <strong className="font-semibold text-foreground">{feat.label}: </strong>
                  <span className="text-muted-foreground">{feat.description}</span>
                </span>
              </div>
            ))}
          </div>

          {/* Interactive AI Station (only on Destination 8) */}
          {destination.id === 'ai-knowledge-station' && destination.prompts && (
            <div className="pt-2">
              <JourneyAiStation prompts={destination.prompts} />
            </div>
          )}

          {/* Action CTAs */}
          <div className="flex flex-wrap items-center gap-3 pt-3">
            <Link
              to={destination.route}
              className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full bg-[hsl(var(--brand-primary))] hover:opacity-90 text-white font-semibold text-sm shadow-md transition-all hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-[hsl(var(--brand-primary))]"
            >
              <span>{destination.ctaText}</span>
              <ArrowRight className="w-4 h-4" />
            </Link>

            {destination.secondaryRoute && destination.secondaryCtaText && (
              <Link
                to={destination.secondaryRoute}
                className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-full border border-border hover:border-foreground/30 bg-background hover:bg-muted/50 text-foreground text-sm font-medium transition-all"
              >
                <Compass className="w-4 h-4 text-[hsl(var(--brand-secondary))]" />
                <span>{destination.secondaryCtaText}</span>
              </Link>
            )}

            {!isActive && (
              <button
                type="button"
                onClick={() => onSelect(destination.index)}
                className="ml-auto text-xs font-semibold text-muted-foreground hover:text-foreground underline underline-offset-4 cursor-pointer"
              >
                Focus this stop
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
