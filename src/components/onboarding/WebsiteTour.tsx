import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { ArrowLeft, ArrowRight, BookMarked, Compass, GraduationCap, HelpCircle, LibraryBig, MessageCircle, Sparkles, Users, UserRound, X } from "lucide-react";
import { useAuth } from "@/contexts/authHelpers";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

type TourStep = {
  eyebrow: string; title: string; description: string; detail: string;
  route?: string; icon: React.ComponentType<{ className?: string }>; action?: string;
};

const TOUR_STEPS: TourStep[] = [
  { eyebrow: "WELCOME TO SAHADHYAYI", title: "Your next reading chapter starts here.", description: "Sahadhyayi means “fellow reader”. It brings your books, reading journey, authors and fellow readers into one place.", detail: "This short tour takes about a minute. You can skip it now and replay it any time using the Tour button.", icon: Sparkles },
  { eyebrow: "YOUR HOME", title: "A dashboard for your reading life", description: "Use your dashboard to pick up current reads, see reading activity, manage your goal and discover recommendations.", detail: "Tip: add a book to your bookshelf to make your reading dashboard more useful.", route: "/dashboard", icon: Compass, action: "Explore dashboard" },
  { eyebrow: "DISCOVER BOOKS", title: "Find your next great read", description: "Search the library, browse book details and explore books by title, author or topic. Open a book to see its details and available reading features.", detail: "When you find a book you like, add it to your bookshelf or start reading if that option is available.", route: "/library", icon: LibraryBig, action: "Explore library" },
  { eyebrow: "YOUR BOOKSHELF", title: "Keep your reading organised", description: "Save books you want to read, track what you are reading and keep completed books together in your personal bookshelf.", detail: "Your bookshelf is your personal reading list—not just a collection of book covers.", route: "/bookshelf", icon: BookMarked, action: "Open my bookshelf" },
  { eyebrow: "AUTHORS & PUBLISHERS", title: "Go beyond the book cover", description: "Explore author profiles, learn about writers and discover more of their work. Publisher pages help you browse the wider publishing catalogue.", detail: "Open an author profile from the Authors section to explore the information available for that writer.", route: "/authors", icon: GraduationCap, action: "Meet the authors" },
  { eyebrow: "READ TOGETHER", title: "Find your reading people", description: "Visit Social Media to discover community activity and connect with fellow readers. Reading Groups let people gather around shared reading interests.", detail: "Be thoughtful with personal information and review visibility settings before sharing with the community.", route: "/social", icon: Users, action: "Explore community" },
  { eyebrow: "READING GROUPS", title: "Turn a book into a conversation", description: "Browse reading groups, see what members are reading together and join a group that matches your interests.", detail: "You can also explore the Groups section directly from the main navigation.", route: "/groups", icon: MessageCircle, action: "Browse groups" },
  { eyebrow: "DISCOVER MORE", title: "Explore beyond your usual reading list", description: "Discovery helps you find content in new ways, and the Map section can help you explore reader connections where those features are available.", detail: "Location-based features may depend on your permissions and other readers’ sharing choices. You can choose whether to share location information.", route: "/discovery", icon: Compass, action: "Explore discovery" },
  { eyebrow: "ARTICLES & IDEAS", title: "Read and share ideas", description: "Browse articles from the community, open individual stories and use the writing tools available to create your own reading-related articles.", detail: "Use the Articles section to browse published writing and your profile menu to return to your own articles.", route: "/articles", icon: BookMarked, action: "Browse articles" },
  { eyebrow: "PLAY & LEARN", title: "Make reading playful", description: "Explore the Games section for reading-related activities and book-themed ways to engage with the platform.", detail: "Available games and activities may change as Sahadhyayi evolves.", route: "/games", icon: Sparkles, action: "Explore games" },
  { eyebrow: "AI BOOK EXPERT", title: "Ask questions about books", description: "Use the Book Expert assistant for book-related questions, explanations and reading discovery. Its answers can vary by the book and information available.", detail: "Treat AI responses as a helpful starting point and verify important details against reliable sources.", icon: Sparkles },
  { eyebrow: "MAKE IT YOURS", title: "Your profile, articles and more", description: "Update your profile, share reading interests, explore articles and discover other ways to participate in Sahadhyayi.", detail: "You are all set. Explore at your own pace—you can replay this guided tour whenever you need a refresher.", route: "/profile", icon: UserRound, action: "View my profile" },
];

const storageKey = (userId: string) => "sahadhyayi-website-tour-v1:" + userId;

export default function WebsiteTour() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const currentStep = TOUR_STEPS[stepIndex];
  const Icon = currentStep.icon;
  const progress = useMemo(() => ((stepIndex + 1) / TOUR_STEPS.length) * 100, [stepIndex]);

  useEffect(() => {
    if (loading || !user) { setOpen(false); return; }
    try {
      if (!localStorage.getItem(storageKey(user.id))) { setStepIndex(0); setOpen(true); }
    } catch { /* Keep onboarding usable when browser storage is disabled. */ }
  }, [loading, user?.id]);

  useEffect(() => {
    if (open && currentStep.route && location.pathname !== currentStep.route) navigate(currentStep.route);
  }, [open, currentStep.route, location.pathname, navigate]);

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

  const startTour = useCallback(() => { setStepIndex(0); setOpen(true); }, []);
  const next = () => stepIndex >= TOUR_STEPS.length - 1 ? finishTour() : setStepIndex((value) => value + 1);
  const previous = () => setStepIndex((value) => Math.max(0, value - 1));

  if (!user || loading) return null;

  return (
    <>
      <Button type="button" variant="outline" size="sm" onClick={startTour} aria-label="Start the Sahadhyayi website tour" className="fixed bottom-5 left-4 z-[90] rounded-full border-[#D7C9AD] bg-background/95 shadow-lg backdrop-blur hover:bg-accent">
        <HelpCircle className="mr-2 h-4 w-4" /> Take a tour
      </Button>
      {open && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-[#101612]/65 p-4 backdrop-blur-sm" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) finishTour(); }}>
          <section role="dialog" aria-modal="true" aria-labelledby="sahadhyayi-tour-title" aria-describedby="sahadhyayi-tour-description" className="relative w-full max-w-xl overflow-hidden rounded-3xl border border-[#E7DFD1] bg-[#FFFEFA] text-[#1C201D] shadow-2xl dark:border-[#303B33] dark:bg-[#111713] dark:text-[#F3F0E7]">
            <div className="h-1.5 w-full bg-[#EDE6D9] dark:bg-[#26332A]"><Progress value={progress} className="h-1.5 rounded-none bg-transparent [&>div]:bg-[#356548]" /></div>
            <div className="p-6 sm:p-8">
              <div className="mb-6 flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#E8EFE6] text-[#245236] dark:bg-[#203528] dark:text-[#B8D9BC]"><Icon className="h-6 w-6" aria-hidden="true" /></div>
                  <div><p className="text-[11px] font-bold tracking-[0.16em] text-[#80632B] dark:text-[#D5B16D]">{currentStep.eyebrow}</p><p className="mt-1 text-xs text-muted-foreground">Step {stepIndex + 1} of {TOUR_STEPS.length}</p></div>
                </div>
                <button type="button" onClick={finishTour} className="rounded-full p-2 text-muted-foreground transition hover:bg-black/5 hover:text-foreground dark:hover:bg-white/10" aria-label="Close website tour"><X className="h-5 w-5" /></button>
              </div>
              <h2 id="sahadhyayi-tour-title" className="text-2xl font-semibold leading-tight tracking-tight sm:text-3xl">{currentStep.title}</h2>
              <p id="sahadhyayi-tour-description" className="mt-4 text-sm leading-6 text-[#515A53] dark:text-[#C1C9C2] sm:text-base">{currentStep.description}</p>
              <div className="mt-5 rounded-2xl border border-[#E7DFD1] bg-[#F7F4EC] p-4 text-sm leading-6 text-[#4E574F] dark:border-[#303B33] dark:bg-[#18211B] dark:text-[#C1C9C2]">{currentStep.detail}</div>
              <div className="mt-7 flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>{stepIndex > 0 ? <Button type="button" variant="ghost" onClick={previous} className="rounded-xl"><ArrowLeft className="mr-2 h-4 w-4" /> Back</Button> : <Button type="button" variant="ghost" onClick={finishTour} className="rounded-xl text-muted-foreground">Skip tour</Button>}</div>
                <div className="flex flex-col gap-2 sm:flex-row">
                  {currentStep.action && <Button type="button" variant="outline" onClick={finishTour} className="rounded-xl">{currentStep.action}</Button>}
                  <Button type="button" onClick={next} className="rounded-xl bg-[#245236] text-white hover:bg-[#1C442D] dark:bg-[#D5B16D] dark:text-[#111713] dark:hover:bg-[#E2C17F]">{stepIndex === TOUR_STEPS.length - 1 ? "Finish tour" : "Next"}<ArrowRight className="ml-2 h-4 w-4" /></Button>
                </div>
              </div>
              <div className="mt-5 flex justify-center gap-1.5" aria-label={"Tour progress " + (stepIndex + 1) + " of " + TOUR_STEPS.length}>
                {TOUR_STEPS.map((step, index) => <span key={step.eyebrow} className={"h-1.5 rounded-full transition-all " + (index === stepIndex ? "w-6 bg-[#356548] dark:bg-[#D5B16D]" : "w-1.5 bg-[#D8D2C6] dark:bg-[#465148]")} />)}
              </div>
            </div>
          </section>
        </div>
      )}
    </>
  );
}
