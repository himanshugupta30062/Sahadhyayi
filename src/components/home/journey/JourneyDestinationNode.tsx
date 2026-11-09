import React, { useContext } from 'react';
import { ArrowUpRight, Bot, LockKeyhole } from 'lucide-react';
import { Link } from 'react-router-dom';
import { JourneyDestination, JourneyMenuItem } from './journeyData';
import { JourneyLandmarkArt } from './JourneyLandmarkArt';
import { JourneyAiStation } from './JourneyAiStation';
import { BookExpertContext } from '@/contexts/book-expert.utils';

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
  const bookExpert = useContext(BookExpertContext);

  const openMenuAction = (item: JourneyMenuItem) => {
    if (item.action === 'open-book-expert' && bookExpert && !bookExpert.isOpen) {
      bookExpert.toggleChat();
    }
  };

  return (
    <div
      className={`group relative rounded-3xl border p-5 sm:p-7 lg:p-8 transition-colors duration-300 ${
        isActive
          ? 'bg-card text-card-foreground border-[hsl(var(--brand-primary)/0.35)] shadow-xl'
          : 'bg-card/70 hover:bg-card text-card-foreground/90 border-border/60 shadow-md'
      }`}
      role="region"
      aria-label={`${destination.title} destination menu`}
    >
      <div className="grid grid-cols-1 lg:grid-cols-[minmax(220px,0.75fr)_minmax(0,1.5fr)] gap-6 lg:gap-9 items-start">
        <div className="flex flex-col items-center text-center">
          <div className="w-full max-w-[300px] rounded-2xl bg-gradient-to-b from-muted/60 to-muted/20 border border-border/60 p-4">
            <JourneyLandmarkArt id={destination.id} isCurrent={isActive} />
          </div>
          <p className="mt-3 text-xs text-muted-foreground italic font-serif">{destination.landmarkName}</p>
        </div>

        <div className="min-w-0 space-y-5">
          <header>
            <p className="text-[10px] sm:text-xs font-bold uppercase tracking-[.16em] text-[hsl(var(--brand-primary))]">
              Stop {destination.index} of 8 · Destination guide
            </p>
            <h3 className="mt-1 text-2xl sm:text-3xl font-serif font-bold text-foreground tracking-tight">
              {destination.title}
            </h3>
            <p className="mt-1 text-sm sm:text-base font-serif italic text-[hsl(var(--brand-secondary))]">
              {destination.subtitle}
            </p>
            <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
              {destination.description}
            </p>
          </header>

          <section aria-labelledby={`journey-menu-heading-${destination.index}`}>
            <div className="flex flex-wrap items-end justify-between gap-2 mb-3">
              <div>
                <p className="text-[10px] font-bold tracking-[.16em] uppercase text-muted-foreground">Inside this destination</p>
                <h4 id={`journey-menu-heading-${destination.index}`} className="mt-1 text-lg font-serif font-bold text-foreground">
                  Choose where to go
                </h4>
              </div>
              <p className="text-xs text-muted-foreground">Select a menu item to open that section</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5" data-testid="journey-feature-menu">
              {destination.menuItems.map((item) => (
                <MenuAction
                  key={item.id}
                  item={item}
                  onAction={() => openMenuAction(item)}
                />
              ))}
            </div>

            {destination.menuItems.some((item) => item.requiresAuth) && (
              <p className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
                <LockKeyhole className="h-3.5 w-3.5 shrink-0" />
                Some destinations ask you to sign in before continuing.
              </p>
            )}
          </section>

          {destination.id === 'ai-knowledge-station' && destination.prompts && (
            <div className="pt-1">
              <JourneyAiStation prompts={destination.prompts} />
            </div>
          )}

          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
            <span className="text-xs text-muted-foreground">Continue exploring the journey</span>
            <button
              type="button"
              onClick={() => onSelect(destination.index === 8 ? 1 : destination.index + 1)}
              className="inline-flex items-center gap-2 rounded-full bg-[hsl(var(--brand-primary))] px-4 py-2.5 text-xs sm:text-sm font-semibold text-white shadow-sm transition hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--brand-primary))] focus-visible:ring-offset-2"
            >
              {destination.index === 8 ? 'Back to the beginning' : 'Next destination'}
              <ArrowUpRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

interface MenuActionProps {
  item: JourneyMenuItem;
  onAction: () => void;
}

const MenuAction: React.FC<MenuActionProps> = ({ item, onAction }) => {
  const content = (
    <>
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[hsl(var(--brand-primary)/0.1)] text-[hsl(var(--brand-primary))]">
        {item.action === 'open-book-expert' ? <Bot className="h-4 w-4" /> : <ArrowUpRight className="h-4 w-4" />}
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex flex-wrap items-center gap-2">
          <strong className="text-sm font-semibold text-foreground">{item.label}</strong>
          {item.requiresAuth && (
            <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold text-muted-foreground">
              <LockKeyhole className="h-3 w-3" /> Sign in
            </span>
          )}
        </span>
        <span className="mt-1 block text-xs leading-relaxed text-muted-foreground">{item.description}</span>
      </span>
      <ArrowUpRight className="h-4 w-4 shrink-0 text-muted-foreground" />
    </>
  );

  const className = 'group/menu flex min-h-[76px] w-full items-center gap-3 rounded-2xl border border-border bg-background/80 p-3 text-left transition hover:border-[hsl(var(--brand-primary)/0.45)] hover:bg-muted/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--brand-primary))] focus-visible:ring-offset-2';

  if (item.action === 'open-book-expert') {
    return (
      <button type="button" onClick={onAction} className={className}>
        {content}
      </button>
    );
  }

  if (!item.route) return null;

  return (
    <Link to={item.route} className={className}>
      {content}
    </Link>
  );
};
