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
  { eyebrow: "WELCOME", title: "Welcome to Sahadhyayi", description: "Sahadhyayi brings your books, reading journey, authors and fellow readers together in one place.", detail: "This guided tour walks through the main reader-facing pages. You can skip it at any time and replay it later from the Take a tour button.", icon: Sparkles },
  { eyebrow: "YOUR READING HOME", title: "Dashboard", description: "Your personal starting point for reading activity, goals and getting back to your current reading journey.", detail: "The dashboard requires an account. Add books to your bookshelf to make your reading space more useful.", route: "/dashboard", icon: Compass, action: "Open dashboard" },
  { eyebrow: "BOOK DISCOVERY", title: "Library", description: "Search and browse the book catalogue. Open any book card to visit its details page and see the information and reading options available for that title.", detail: "The Library is the starting point for discovering books; individual book details are opened from a book card.", route: "/library", icon: LibraryBig, action: "Open library" },
  { eyebrow: "BOOK DETAILS", title: "Explore an individual book", description: "A book details page brings together the information available for a title and its related reading and community features.", detail: "Choose a book from the Library to open its specific details page. This tour does not invent a book ID or force you into a random title.", route: "/library", icon: BookMarked, action: "Choose a book" },
  { eyebrow: "YOUR BOOKSHELF", title: "Organise your reading", description: "Use your bookshelf to keep track of books you have saved and organise your personal reading list.", detail: "The books and controls shown can depend on your account and the data you have added.", route: "/bookshelf", icon: BookMarked, action: "Open bookshelf" },
  { eyebrow: "AUTHORS", title: "Discover writers", description: "Browse author profiles and explore available biographical information and other works associated with a writer.", detail: "Open an author card to view the individual author page. Some author pages use a slug-based URL.", route: "/authors", icon: GraduationCap, action: "Browse authors" },
  { eyebrow: "PUBLISHERS", title: "Explore publishers", description: "Browse publisher information and discover books associated with publishers in the catalogue.", detail: "Publisher information depends on the metadata available for each listing.", route: "/publishers", icon: LibraryBig, action: "Browse publishers" },
  { eyebrow: "COMMUNITY", title: "Social space", description: "Visit the social area to explore community activity and ways to connect with fellow readers.", detail: "Share thoughtfully and review the information you make visible to other people.", route: "/social", icon: Users, action: "Open social" },
  { eyebrow: "READING GROUPS", title: "Read together", description: "Browse reading groups, find people with shared interests and open a group to see its details.", detail: "Joining, posting or participating may require signing in and may depend on each group's settings.", route: "/groups", icon: MessageCircle, action: "Browse groups" },
  { eyebrow: "GROUP DETAILS", title: "Inside a reading group", description: "Each group has its own detail page for information about that particular reading community.", detail: "Open a group card from the Groups page to see its current details and available actions.", route: "/groups", icon: Users, action: "Choose a group" },
  { eyebrow: "READER MAP", title: "Explore the map", description: "The map page presents location-related reader discovery where the feature and data are available.", detail: "Location visibility depends on user choices and permissions. You do not need to share your location to continue this tour.", route: "/map", icon: Compass, action: "Open map" },
  { eyebrow: "DISCOVERY", title: "Find new ways to explore", description: "Use Discovery to explore reading-related content and find things beyond your current list.", detail: "What appears can vary with the catalogue and features currently available.", route: "/discovery", icon: Compass, action: "Open discovery" },
  { eyebrow: "ARTICLES", title: "Read ideas from the community", description: "Browse published articles and open an article to read the full piece.", detail: "Article detail pages open from article cards and use the article's own URL.", route: "/articles", icon: BookMarked, action: "Browse articles" },
  { eyebrow: "WRITE", title: "Create an article", description: "The article-writing page lets you work on reading-related writing using the fields and publishing options available there.", detail: "Review your draft before publishing and only submit content you have the right to share.", route: "/articles/write", icon: BookMarked, action: "Open writing page" },
  { eyebrow: "YOUR ARTICLES", title: "Manage your writing", description: "My Articles is the place to return to your own article entries and related management options.", detail: "This page requires sign-in. Your list depends on articles associated with your account.", route: "/articles/my", icon: UserRound, action: "Open my articles" },
  { eyebrow: "GAMES", title: "Play and learn", description: "Explore book-related games and reading activities available on Sahadhyayi.", detail: "Activities may evolve as the site changes.", route: "/games", icon: Sparkles, action: "Explore games" },
  { eyebrow: "AI BOOK EXPERT", title: "Ask book-related questions", description: "Use the Book Expert assistant for book questions, explanations and reading discovery when the assistant is available on the page.", detail: "AI responses can be incomplete or incorrect. Verify important facts against reliable sources.", icon: Sparkles },
  { eyebrow: "PUBLISHING", title: "Publish a book", description: "The Publish page is the entry point for the book-publishing workflow available to signed-in users.", detail: "Follow the page's instructions and submit only material you own or are authorised to publish.", route: "/publish", icon: BookMarked, action: "Open publishing" },
  { eyebrow: "YOUR PUBLICATIONS", title: "Return to your publications", description: "My Publications provides a place to review publication entries associated with your account.", detail: "This is an account-specific page and may be empty until you have created or submitted a publication.", route: "/my-publications", icon: UserRound, action: "Open my publications" },
  { eyebrow: "BLOG", title: "Read site updates and posts", description: "Browse the blog and open an individual post to read it in full.", detail: "Individual blog posts open from the Blog page.", route: "/blog", icon: BookMarked, action: "Browse blog" },
  { eyebrow: "YOUR PROFILE", title: "Make your profile yours", description: "Visit your profile to review and update the personal information and reading identity supported by the site.", detail: "Only add profile details you are comfortable sharing.", route: "/profile", icon: UserRound, action: "Open profile" },
  { eyebrow: "ABOUT", title: "Learn about Sahadhyayi", description: "The About page explains the platform and its purpose.", detail: "You can revisit this page whenever you want context about the project.", route: "/about", icon: HelpCircle, action: "About Sahadhyayi" },
  { eyebrow: "HELP", title: "Find help and share feedback", description: "Use Help Center for support information and Feedback to share your experience or report an issue.", detail: "Clear feedback about what you were doing and what happened helps make reports more useful.", route: "/help-center", icon: HelpCircle, action: "Open help center" },
  { eyebrow: "FEEDBACK", title: "Help improve the experience", description: "The Feedback page gives you a way to share comments about your experience with Sahadhyayi.", detail: "Avoid including passwords, private keys or other sensitive account information in feedback.", route: "/feedback", icon: MessageCircle, action: "Share feedback" },
  { eyebrow: "YOU'RE READY", title: "Explore at your own pace", description: "You now have a map of the main reader-facing areas of Sahadhyayi—from finding books to connecting with readers and sharing ideas.", detail: "The tour is only a guide. You can revisit it using the Take a tour button whenever you want a refresher.", route: "/dashboard", icon: Sparkles, action: "Go to dashboard" },
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
