import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, ArrowRight, BookOpen, BookMarked, Compass, GraduationCap, HelpCircle, LibraryBig, MessageCircle, Sparkles, Users, UserRound, X, ChevronRight } from "lucide-react";
import { useAuth } from "@/contexts/authHelpers";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

type TourStep = {
  eyebrow: string;
  title: string;
  description: string;
  tip: string;
  route?: string;
  action?: string;
  icon: React.ComponentType<{ className?: string }>;
};

const TOUR_STEPS: TourStep[] = [
  { eyebrow: "START HERE", title: "Your reading life, in one place", description: "Welcome to Sahadhyayi — discover books, follow authors, meet readers and share what you learn. This quick tour takes about a minute.", tip: "You’re in control. Explore the tour, skip it, or jump straight into the site.", icon: Sparkles },
  { eyebrow: "1 · DISCOVER", title: "Find your next great read", description: "Search the library, explore book details, discover authors and publishers, and find fresh recommendations.", tip: "Start with a book you already love, or browse by curiosity.", route: "/library", action: "Explore the library", icon: LibraryBig },
  { eyebrow: "2 · MAKE IT YOURS", title: "Build your reading space", description: "Keep a personal bookshelf, update your profile and return to your reading journey from your dashboard.", tip: "Saving a book is a simple first step toward a more personal experience.", route: "/dashboard", action: "Open dashboard", icon: BookMarked },
  { eyebrow: "3 · READ TOGETHER", title: "Meet your reading people", description: "Explore community activity, join reading groups and discover readers on the map when location-based features are available.", tip: "Your location and profile visibility should always reflect what you’re comfortable sharing.", route: "/social", action: "Explore community", icon: Users },
  { eyebrow: "4 · CREATE & EXPLORE", title: "Share ideas and keep exploring", description: "Read articles and blog posts, write your own articles, explore book-related games and ask the Book Expert questions.", tip: "Articles are community-created; blog posts are site updates and editorial content.", route: "/articles", action: "Explore articles", icon: BookOpen },
  { eyebrow: "YOU’RE READY", title: "Choose your own adventure", description: "That’s the essentials. There are more features to discover, but you don’t need to learn everything at once.", tip: "You can reopen this guide any time with the “Take a tour” button. Pick one small action and start reading.", route: "/library", action: "Start discovering", icon: Compass },
];

type Feature = { title: string; description: string; route?: string; icon: React.ComponentType<{ className?: string }> };
type FeatureGroup = { title: string; subtitle: string; features: Feature[] };

const FEATURE_GROUPS: FeatureGroup[] = [
  { title: "Discover", subtitle: "Find books, writers and ideas", features: [
    { title: "Library & book details", description: "Browse the catalogue and open individual books.", route: "/library", icon: LibraryBig },
    { title: "Authors", description: "Explore writer profiles and related books.", route: "/authors", icon: GraduationCap },
    { title: "Publishers", description: "Browse publisher information and catalogue titles.", route: "/publishers", icon: BookOpen },
    { title: "Discovery", description: "Explore more reading-related content.", route: "/discovery", icon: Compass },
    { title: "Reader map", description: "Explore location-based reader discovery when available.", route: "/map", icon: Compass },
  ]},
  { title: "Your reading", subtitle: "Keep your reading life organised", features: [
    { title: "Dashboard", description: "Return to your reading home and activity.", route: "/dashboard", icon: Compass },
    { title: "Bookshelf", description: "Revisit books you have saved.", route: "/bookshelf", icon: BookMarked },
    { title: "Profile", description: "Review your profile and reading identity.", route: "/profile", icon: UserRound },
    { title: "Book Expert", description: "Ask book-related questions when the assistant is available.", icon: Sparkles },
  ]},
  { title: "Community", subtitle: "Read and connect with others", features: [
    { title: "Social space", description: "Explore community activity.", route: "/social", icon: Users },
    { title: "Reading groups", description: "Find and open reading communities.", route: "/groups", icon: MessageCircle },
  ]},
  { title: "Create & play", subtitle: "Publish ideas and enjoy reading", features: [
    { title: "Articles", description: "Read community writing and open full articles.", route: "/articles", icon: BookOpen },
    { title: "Write an article", description: "Create reading-related writing.", route: "/articles/write", icon: BookOpen },
    { title: "My articles", description: "Return to your own article entries.", route: "/articles/my", icon: UserRound },
    { title: "Games", description: "Explore book-related activities.", route: "/games", icon: Sparkles },
    { title: "Publish a book", description: "Open the book-publishing workflow.", route: "/publish", icon: BookMarked },
    { title: "My publications", description: "Review publications associated with your account.", route: "/my-publications", icon: BookMarked },
  ]},
  { title: "Read & learn", subtitle: "Editorial content and site information", features: [
    { title: "Blog", description: "Read site updates and editorial posts.", route: "/blog", icon: BookOpen },
    { title: "About", description: "Learn about Sahadhyayi and its purpose.", route: "/about", icon: HelpCircle },
    { title: "Help center", description: "Find help and support information.", route: "/help-center", icon: HelpCircle },
    { title: "Feedback", description: "Share feedback about your experience.", route: "/feedback", icon: MessageCircle },
  ]},
  { title: "Your choices", subtitle: "Policies and community guidance", features: [
    { title: "Community guidelines", description: "Review expectations for community participation.", route: "/community-guidelines", icon: HelpCircle },
    { title: "Privacy policy", description: "Understand the platform’s privacy practices.", route: "/privacy-policy", icon: HelpCircle },
    { title: "Terms of service", description: "Review the terms for using the site.", route: "/terms-of-service", icon: HelpCircle },
    { title: "Cookie policy", description: "Learn about cookies and related technologies.", route: "/cookie-policy", icon: HelpCircle },
  ]},
];

const storageKey = (userId: string) => "sahadhyayi-website-tour-v2:" + userId;

export default function WebsiteTour() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const [showFeatures, setShowFeatures] = useState(false);
  const currentStep = TOUR_STEPS[stepIndex];
  const Icon = currentStep.icon;
  const progress = useMemo(() => ((stepIndex + 1) / TOUR_STEPS.length) * 100, [stepIndex]);

  useEffect(() => {
    if (loading || !user) { setOpen(false); return; }
    try {
      if (!localStorage.getItem(storageKey(user.id))) {
        setStepIndex(0);
        setShowFeatures(false);
        setOpen(true);
      }
    } catch { /* Keep onboarding usable when browser storage is disabled. */ }
  }, [loading, user?.id]);

  const finishTour = useCallback(() => {
    if (user) {
      try { localStorage.setItem(storageKey(user.id), "completed"); }
      catch { /* The tour can still be closed when storage is unavailable. */ }
    }
    setOpen(false);
  }, [user]);

  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") finishTour();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, finishTour]);

  const startTour = useCallback(() => {
    setStepIndex(0);
    setShowFeatures(false);
    setOpen(true);
  }, []);
  const goToFeature = (route?: string) => {
    finishTour();
    if (route) navigate(route);
  };
  const next = () => stepIndex >= TOUR_STEPS.length - 1 ? finishTour() : setStepIndex(value => value + 1);
  const previous = () => setStepIndex(value => Math.max(0, value - 1));

  if (!user || loading) return null;

  return (
    <>
      <Button type="button" variant="outline" size="sm" onClick={startTour} aria-label="Start the Sahadhyayi website tour" className="fixed bottom-5 left-4 z-[90] rounded-full border-[#D7C9AD] bg-background/95 shadow-lg backdrop-blur hover:bg-accent">
        <HelpCircle className="mr-2 h-4 w-4" /> Take a tour
      </Button>
      {open && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-[#101612]/65 p-3 sm:p-5 backdrop-blur-sm" role="presentation" onMouseDown={event => { if (event.target === event.currentTarget) finishTour(); }}>
          <section role="dialog" aria-modal="true" aria-labelledby="sahadhyayi-tour-title" aria-describedby="sahadhyayi-tour-description" className="relative flex max-h-[min(88dvh,760px)] w-full max-w-2xl flex-col overflow-hidden rounded-3xl border border-[#E7DFD1] bg-[#FFFEFA] text-[#1C201D] shadow-2xl dark:border-[#303B33] dark:bg-[#111713] dark:text-[#F3F0E7]">
            <div className="h-1.5 w-full shrink-0 bg-[#EDE6D9] dark:bg-[#26332A]"><Progress value={progress} className="h-1.5 rounded-none bg-transparent [&>div]:bg-[#356548]" /></div>
            <div className="overflow-y-auto p-5 sm:p-8">
              <div className="mb-5 flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#E8EFE6] text-[#245236] dark:bg-[#203528] dark:text-[#B8D9BC]"><Icon className="h-6 w-6" aria-hidden="true" /></div>
                  <div><p className="text-[11px] font-bold tracking-[0.16em] text-[#80632B] dark:text-[#D5B16D]">{currentStep.eyebrow}</p><p className="mt-1 text-xs text-muted-foreground">Quick tour · {stepIndex + 1} of {TOUR_STEPS.length}</p></div>
                </div>
                <button type="button" onClick={finishTour} className="rounded-full p-2 text-muted-foreground transition hover:bg-black/5 hover:text-foreground dark:hover:bg-white/10" aria-label="Close website tour"><X className="h-5 w-5" /></button>
              </div>
              <h2 id="sahadhyayi-tour-title" className="text-2xl font-semibold leading-tight tracking-tight sm:text-3xl">{currentStep.title}</h2>
              <p id="sahadhyayi-tour-description" className="mt-3 text-sm leading-6 text-[#515A53] dark:text-[#C1C9C2] sm:text-base">{currentStep.description}</p>
              <div className="mt-5 flex gap-3 rounded-2xl border border-[#E7DFD1] bg-[#F7F4EC] p-4 text-sm leading-6 text-[#4E574F] dark:border-[#303B33] dark:bg-[#18211B] dark:text-[#C1C9C2]">
                <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-[#80632B]" /><p>{currentStep.tip}</p>
              </div>
              {currentStep.route && (
                <button type="button" onClick={() => goToFeature(currentStep.route)} className="mt-5 flex w-full items-center justify-between rounded-2xl border border-[#D8E3D5] bg-[#F0F5EE] p-4 text-left transition hover:border-[#9CB79D] hover:bg-[#E8F0E5] dark:border-[#344A39] dark:bg-[#1A2A1F] dark:hover:bg-[#213729]">
                  <span><span className="block text-sm font-semibold">{currentStep.action}</span><span className="mt-1 block text-xs text-[#5D6A5F] dark:text-[#B8C7B9]">Go there now — you can come back to the tour later.</span></span>
                  <ChevronRight className="h-5 w-5 shrink-0" />
                </button>
              )}
              <div className="mt-5">
                <button type="button" onClick={() => setShowFeatures(value => !value)} aria-expanded={showFeatures} className="flex w-full items-center justify-between rounded-xl border border-border px-4 py-3 text-left text-sm font-medium transition hover:bg-accent">
                  <span>{showFeatures ? "Hide feature guide" : "Explore all features"} <span className="ml-1 text-xs font-normal text-muted-foreground">· {FEATURE_GROUPS.reduce((sum, group) => sum + group.features.length, 0)} quick links</span></span>
                  <ChevronRight className={"h-4 w-4 transition-transform " + (showFeatures ? "rotate-90" : "")} />
                </button>
                {showFeatures && <div className="mt-3 space-y-4">
                  {FEATURE_GROUPS.map(group => (
                    <div key={group.title}>
                      <div className="mb-2"><h3 className="text-sm font-semibold">{group.title}</h3><p className="text-xs text-muted-foreground">{group.subtitle}</p></div>
                      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                        {group.features.map(feature => {
                          const FeatureIcon = feature.icon;
                          return <button key={feature.title} type="button" onClick={() => goToFeature(feature.route)} className="flex min-w-0 items-start gap-3 rounded-xl border border-border p-3 text-left transition hover:border-[#9CB79D] hover:bg-accent">
                            <span className="rounded-lg bg-muted p-2"><FeatureIcon className="h-4 w-4" /></span>
                            <span className="min-w-0 flex-1"><span className="block text-sm font-medium">{feature.title}</span><span className="mt-1 block text-xs leading-5 text-muted-foreground">{feature.description}</span></span>
                            {feature.route && <ChevronRight className="mt-1 h-4 w-4 shrink-0 text-muted-foreground" />}
                          </button>;
                        })}
                      </div>
                    </div>
                  ))}
                </div>}
              </div>
              <div className="mt-6 flex flex-col-reverse gap-3 border-t border-border pt-5 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center justify-between gap-2 sm:justify-start">
                  {stepIndex > 0 ? <Button type="button" variant="ghost" onClick={previous} className="rounded-xl"><ArrowLeft className="mr-2 h-4 w-4" /> Back</Button> : <Button type="button" variant="ghost" onClick={finishTour} className="rounded-xl text-muted-foreground">Skip tour</Button>}
                  <span className="text-xs text-muted-foreground sm:hidden">{stepIndex + 1}/{TOUR_STEPS.length}</span>
                </div>
                <div className="flex gap-2">
                  <Button type="button" onClick={next} className="w-full rounded-xl bg-[#245236] text-white hover:bg-[#1C442D] dark:bg-[#D5B16D] dark:text-[#111713] dark:hover:bg-[#E2C17F] sm:w-auto">{stepIndex === TOUR_STEPS.length - 1 ? "Finish tour" : "Next"}<ArrowRight className="ml-2 h-4 w-4" /></Button>
                </div>
              </div>
              <div className="mt-4 flex justify-center gap-1.5" aria-label={"Tour progress " + (stepIndex + 1) + " of " + TOUR_STEPS.length}>
                {TOUR_STEPS.map((step, index) => <button key={step.eyebrow} type="button" onClick={() => setStepIndex(index)} aria-label={"Go to step " + (index + 1)} aria-current={index === stepIndex ? "step" : undefined} className={"h-1.5 rounded-full transition-all " + (index === stepIndex ? "w-6 bg-[#356548] dark:bg-[#D5B16D]" : "w-1.5 bg-[#D8D2C6] dark:bg-[#465148]")} />)}
              </div>
            </div>
          </section>
        </div>
      )}
    </>
  );
}
