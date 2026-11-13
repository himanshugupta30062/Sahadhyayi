import React, { useContext } from 'react';
import { ArrowUpRight, Bot, LockKeyhole, MapPin } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { JourneyDestination, JourneyMenuItem } from './journeyData';
import { JourneyLandmarkArt } from './JourneyLandmarkArt';
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
  onSelect,
}) => {
  const bookExpert = useContext(BookExpertContext);

  const openMenuAction = (item: JourneyMenuItem) => {
    if (item.action === 'open-book-expert' && bookExpert && !bookExpert.isOpen) {
      bookExpert.toggleChat();
    }
  };

  const accentColor = destination.accentColor;

  return (
    <div
      className="rounded-3xl bg-card border border-border/60 overflow-hidden"
      role="region"
      aria-label={`${destination.title} destination menu`}
    >
      {/* Accent top strip */}
      <div
        className="h-1 w-full"
        style={{ background: accentColor }}
        aria-hidden="true"
      />

      <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-0">

        {/* Left: landmark art + identity */}
        <div
          className="flex flex-col items-center justify-between gap-4 p-6 sm:p-7 border-b lg:border-b-0 lg:border-r border-border/60"
          style={{
            background: `linear-gradient(160deg, ${accentColor}0A 0%, ${accentColor}04 100%)`,
          }}
        >
          <div className="w-full flex flex-col items-center text-center">
            {/* Stop badge */}
            <div
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-white text-[10px] font-bold uppercase tracking-widest mb-4"
              style={{ background: accentColor }}
            >
              <MapPin className="w-3 h-3" />
              Stop {destination.index} of 8
            </div>

            {/* Landmark illustration */}
            <div
              className="w-full max-w-[220px] rounded-2xl p-4 border"
              style={{
                background: `${accentColor}10`,
                borderColor: `${accentColor}22`,
              }}
            >
              <JourneyLandmarkArt id={destination.id} isCurrent={isActive} />
            </div>

            {/* Landmark name */}
            <p className="mt-3 text-xs text-muted-foreground italic font-serif leading-snug">
              {destination.landmarkName}
            </p>
          </div>

          {/* Title + subtitle in left column */}
          <div className="text-center">
            <h3 className="text-xl sm:text-2xl font-serif font-bold text-foreground leading-tight">
              {destination.title}
            </h3>
            <p
              className="mt-1 text-sm font-serif italic"
              style={{ color: accentColor }}
            >
              {destination.subtitle}
            </p>
            <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
              {destination.description}
            </p>
          </div>
        </div>

        {/* Right: menu items */}
        <div className="p-6 sm:p-7 lg:p-8 flex flex-col gap-5">
          <div>
            <p
              className="text-[10px] font-bold tracking-[.16em] uppercase mb-1"
              style={{ color: accentColor }}
            >
              Inside this destination
            </p>
            <h4 className="text-lg sm:text-xl font-serif font-bold text-foreground">
              Choose where to go
            </h4>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3" data-testid="journey-feature-menu">
            {destination.menuItems.map((item) => (
              <MenuAction
                key={item.id}
                item={item}
                accentColor={accentColor}
                onAction={() => openMenuAction(item)}
              />
            ))}
          </div>

          {destination.menuItems.some((item) => item.requiresAuth) && (
            <p className="flex items-center gap-2 text-xs text-muted-foreground pt-1">
              <LockKeyhole className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
              Some pages require you to sign in before continuing.
            </p>
          )}

          {/* Footer nav */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-border/60 mt-auto">
            <span className="text-xs text-muted-foreground">Continue the journey</span>
            <button
              type="button"
              onClick={() => onSelect(destination.index === 8 ? 1 : destination.index + 1)}
              className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs sm:text-sm font-semibold text-white shadow-sm transition hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
              style={{ background: accentColor }}
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
  accentColor: string;
  onAction: () => void;
}

const MenuAction: React.FC<MenuActionProps> = ({ item, accentColor, onAction }) => {
  const content = (
    <>
      <span
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-white transition-transform group-hover/menu:scale-110"
        style={{ background: accentColor }}
      >
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
        <span className="mt-0.5 block text-xs leading-relaxed text-muted-foreground">{item.description}</span>
      </span>
    </>
  );

  const className =
    'group/menu flex min-h-[72px] w-full items-center gap-3 rounded-2xl border border-border/60 bg-background/70 p-3 text-left transition-all hover:border-transparent hover:shadow-md hover:bg-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 cursor-pointer';

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
