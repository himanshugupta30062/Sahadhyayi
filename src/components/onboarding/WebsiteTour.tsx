import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, ArrowRight, BookOpen, Compass, HelpCircle, LibraryBig, MessageCircle, Search, Sparkles, Users, X } from "lucide-react";
import { useAuth } from "@/contexts/authHelpers";
import { Button } from "@/components/ui/button";

type TourStep = {
  target?: string;
  label: string;
  title: string;
  description: string;
  tip?: string;
};

const TOUR_STEPS: TourStep[] = [
  {
    label: "WELCOME",
    title: "Your personal reading space",
    description: "Let’s take a quick look around Sahadhyayi. We’ll point out a few useful places right on the page.",
    tip: "This tour is optional. Skip it now and explore at your own pace.",
  },
  {
    target: "library",
    label: "STEP 1 OF 4",
    title: "Discover your next read",
    description: "Open the Library to search books, browse titles and explore book details.",
    tip: "Choose any book to start exploring.",
  },
  {
    target: "search",
    label: "STEP 2 OF 4",
    title: "Find something specific",
    description: "Use Search to find books, authors and reading content without browsing the whole site.",
    tip: "On smaller screens, the search control stays in the top bar.",
  },
  {
    target: "community",
    label: "STEP 3 OF 4",
    title: "Read with a community",
    description: "Visit Social Media to explore community activity and connect with other readers.",
    tip: "Only share profile or location details you’re comfortable sharing.",
  },
  {
    target: "articles",
    label: "STEP 4 OF 4",
    title: "Share what you learn",
    description: "Articles are for community-created writing. Blog posts are editorial updates published by Sahadhyayi.",
    tip: "You can revisit this guide whenever you need it.",
  },
  {
    label: "ALL SET",
    title: "You’re ready to explore",
    description: "That’s the essentials. We’ll get out of your way now — choose a book, explore a topic or meet fellow readers.",
    tip: "You can reopen this guided tour anytime using “Take a tour”.",
  },
];

const storageKey = (userId: string) => "sahadhyayi-website-tour-v3:" + userId;

type TargetRect = { top: number; left: number; right: number; bottom: number; width: number; height: number };
type TooltipPosition = { top: number; left: number };

export default function WebsiteTour() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const [targetRect, setTargetRect] = useState<TargetRect | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState<TooltipPosition>({ top: 120, left: 16 });
  const currentStep = TOUR_STEPS[stepIndex];
  const progress = useMemo(() => ((stepIndex + 1) / TOUR_STEPS.length) * 100, [stepIndex]);

  useEffect(() => {
    if (loading || !user) {
      setOpen(false);
      return;
    }
    try {
      if (!localStorage.getItem(storageKey(user.id))) {
        setStepIndex(0);
        setOpen(true);
      }
    } catch {
      // Keep onboarding usable when browser storage is disabled.
    }
  }, [loading, user?.id]);

  const finishTour = useCallback(() => {
    if (user) {
      try { localStorage.setItem(storageKey(user.id), "completed"); }
      catch { /* Closing still works if browser storage is unavailable. */ }
    }
    setOpen(false);
  }, [user]);

  const startTour = useCallback(() => {
    setStepIndex(0);
    setOpen(true);
  }, []);

  const next = useCallback(() => {
    if (stepIndex >= TOUR_STEPS.length - 1) finishTour();
    else setStepIndex(value => value + 1);
  }, [stepIndex, finishTour]);

  const previous = useCallback(() => setStepIndex(value => Math.max(0, value - 1)), []);

  useEffect(() => {
    if (!open) return;
    const updatePosition = () => {
      const target = currentStep.target
        ? document.querySelector<HTMLElement>(`[data-tour-target="${currentStep.target}"]`)
        : null;
      if (target) {
        const rect = target.getBoundingClientRect();
        if (rect.width > 0 && rect.height > 0) {
          const nextRect = {
            top: rect.top, left: rect.left, right: rect.right, bottom: rect.bottom,
            width: rect.width, height: rect.height,
          };
          setTargetRect(nextRect);
          const tooltipWidth = Math.min(370, window.innerWidth - 24);
          const left = Math.max(12, Math.min(rect.left + rect.width / 2 - tooltipWidth / 2, window.innerWidth - tooltipWidth - 12));
          const estimatedTooltipHeight = 245;
          const below = rect.bottom + 18;
          const top = below + estimatedTooltipHeight <= window.innerHeight - 12
            ? below
            : Math.max(12, rect.top - estimatedTooltipHeight - 18);
          setTooltipPosition({ top, left });
          return;
        }
      }
      setTargetRect(null);
      const tooltipWidth = Math.min(370, window.innerWidth - 24);
      setTooltipPosition({
        top: Math.max(16, Math.min((window.innerHeight - 250) / 2, window.innerHeight - 270)),
        left: Math.max(12, (window.innerWidth - tooltipWidth) / 2),
      });
    };

    updatePosition();
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);
    return () => {
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [open, currentStep]);

  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") finishTour();
      if (event.key === "ArrowRight") next();
      if (event.key === "ArrowLeft") previous();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, finishTour, next, previous]);

  if (!user || loading) return null;

  const targetSelector = currentStep.target
    ? `[data-tour-target="${currentStep.target}"]`
    : undefined;
  const tooltipWidth = "min(370px, calc(100vw - 24px))";

  return (
    <>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={startTour}
        aria-label="Start the Sahadhyayi guided tour"
        className="fixed bottom-5 left-4 z-[90] rounded-full border-[#D7C9AD] bg-background/95 shadow-lg backdrop-blur hover:bg-accent"
      >
        <HelpCircle className="mr-2 h-4 w-4" /> Take a tour
      </Button>

      {open && (
        <div className="fixed inset-0 z-[120]" role="presentation">
          <svg className="pointer-events-none fixed inset-0 h-full w-full" aria-hidden="true">
            <defs>
              <mask id="sahadhyayi-tour-spotlight">
                <rect width="100%" height="100%" fill="white" />
                {targetRect && (
                  <rect
                    x={Math.max(0, targetRect.left - 5)}
                    y={Math.max(0, targetRect.top - 5)}
                    width={targetRect.width + 10}
                    height={targetRect.height + 10}
                    rx="12"
                    fill="black"
                  />
                )}
              </mask>
            </defs>
            <rect width="100%" height="100%" fill="rgba(8, 14, 10, 0.72)" mask="url(#sahadhyayi-tour-spotlight)" />
          </svg>

          {targetRect && (
            <>
              <div
                className="pointer-events-none fixed rounded-xl border-2 border-[#B8E2A9] shadow-[0_0_0_3px_rgba(64,125,76,0.28)]"
                style={{
                  top: targetRect.top - 5,
                  left: targetRect.left - 5,
                  width: targetRect.width + 10,
                  height: targetRect.height + 10,
                }}
                aria-hidden="true"
              />
              <div
                className="pointer-events-none fixed flex h-7 w-7 items-center justify-center rounded-full border-2 border-white bg-[#2F6B43] text-xs font-bold text-white shadow-lg"
                style={{ top: Math.max(4, targetRect.top - 16), left: Math.min(window.innerWidth - 32, targetRect.right - 12) }}
                aria-hidden="true"
              >
                {stepIndex}
              </div>
            </>
          )}

          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="sahadhyayi-tour-title"
            aria-describedby="sahadhyayi-tour-description"
            className="fixed z-[122] overflow-hidden rounded-2xl border border-[#DCE7D8] bg-[#FFFEFA] text-[#1C201D] shadow-2xl dark:border-[#303B33] dark:bg-[#111713] dark:text-[#F3F0E7]"
            style={{ top: tooltipPosition.top, left: tooltipPosition.left, width: tooltipWidth, maxHeight: "calc(100dvh - 24px)" }}
          >
            <div className="h-1 w-full bg-[#EDE6D9] dark:bg-[#26332A]">
              <div className="h-full bg-[#356548] transition-all duration-300" style={{ width: `${progress}%` }} />
            </div>
            <div className="p-5 sm:p-6">
              <div className="mb-3 flex items-center justify-between gap-3">
                <span className="inline-flex items-center gap-2 text-[10px] font-bold tracking-[0.16em] text-[#80632B] dark:text-[#D5B16D]">
                  {currentStep.target === "library" ? <LibraryBig className="h-4 w-4" /> : currentStep.target === "search" ? <Search className="h-4 w-4" /> : currentStep.target === "community" ? <Users className="h-4 w-4" /> : currentStep.target === "articles" ? <BookOpen className="h-4 w-4" /> : <Sparkles className="h-4 w-4" />}
                  {currentStep.label}
                </span>
                <button type="button" onClick={finishTour} aria-label="Close tour" className="rounded-full p-1.5 text-muted-foreground transition hover:bg-black/5 dark:hover:bg-white/10">
                  <X className="h-4 w-4" />
                </button>
              </div>

              <h2 id="sahadhyayi-tour-title" className="text-xl font-semibold leading-tight tracking-tight sm:text-2xl">{currentStep.title}</h2>
              <p id="sahadhyayi-tour-description" className="mt-2 text-sm leading-6 text-[#515A53] dark:text-[#C1C9C2]">{currentStep.description}</p>
              {currentStep.tip && (
                <p className="mt-3 flex gap-2 rounded-xl bg-[#F1F5ED] px-3 py-2.5 text-xs leading-5 text-[#4E574F] dark:bg-[#18211B] dark:text-[#C1C9C2]">
                  <MessageCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#356548]" />
                  <span>{currentStep.tip}</span>
                </p>
              )}

              <div className="mt-5 flex items-center justify-between gap-3">
                <div className="flex items-center gap-1.5">
                  {stepIndex > 0 ? (
                    <Button type="button" variant="ghost" size="sm" onClick={previous} className="rounded-lg px-2">
                      <ArrowLeft className="mr-1.5 h-4 w-4" /> Back
                    </Button>
                  ) : (
                    <Button type="button" variant="ghost" size="sm" onClick={finishTour} className="rounded-lg px-2 text-muted-foreground">
                      Skip tour
                    </Button>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <span className="hidden text-xs text-muted-foreground sm:inline">{stepIndex + 1} / {TOUR_STEPS.length}</span>
                  <Button type="button" onClick={next} size="sm" className="rounded-lg bg-[#245236] text-white hover:bg-[#1C442D] dark:bg-[#D5B16D] dark:text-[#111713]">
                    {stepIndex === TOUR_STEPS.length - 1 ? "Finish" : "Next"} <ArrowRight className="ml-1.5 h-4 w-4" />
                  </Button>
                </div>
              </div>
              <div className="mt-3 flex items-center justify-between border-t border-border pt-3 text-[11px] text-muted-foreground">
                <span>Press Esc to skip</span>
                <span>{stepIndex + 1} of {TOUR_STEPS.length}</span>
              </div>
            </div>
          </section>
        </div>
      )}
    </>
  );
}
