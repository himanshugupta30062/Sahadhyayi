import React, { useState, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Sparkles,
  ArrowRight,
  MessageSquare,
  Compass,
  BookOpen,
  CheckCircle2,
  Bot,
} from 'lucide-react';
import { BookExpertContext } from '@/contexts/book-expert.utils';
import { Button } from '@/components/ui/button';

interface QuickPrompt {
  id: string;
  label: string;
  question: string;
  sampleAnswer: string;
  sourceBook: string;
}

const QUICK_PROMPTS: QuickPrompt[] = [
  {
    id: 'recommendations',
    label: 'Recommendations',
    question: 'Recommend 3 books similar to Siddhartha for exploring Eastern philosophy.',
    sampleAnswer:
      '1. "The Prophet" by Kahlil Gibran (poetic spiritual reflection)\n2. "The Razor’s Edge" by W. Somerset Maugham (a seeker’s journey)\n3. "The Way of Zen" by Alan Watts (accessible philosophical grounding)',
    sourceBook: 'Reading Concierge',
  },
  {
    id: 'concept',
    label: 'Deep Concept',
    question: 'Explain the concept of "Nishkama Karma" in the Gita and modern burnout.',
    sampleAnswer:
      'Nishkama Karma advocates total absorption in right action while decoupling personal peace from unpredictable outcomes — a direct antidote to modern performance anxiety.',
    sourceBook: 'The Bhagavad Gita',
  },
  {
    id: 'critique',
    label: 'Literary Critique',
    question: 'Compare the critique of state control in 1984 vs Brave New World.',
    sampleAnswer:
      'Orwell envisions control through surveillance, pain, and fear ("Big Brother"), whereas Huxley foresees control through manufactured pleasure and consumer sedation ("Soma").',
    sourceBook: 'Orwell & Huxley',
  },
];

export const HomeBookExpertShowcase: React.FC = () => {
  const [activePrompt, setActivePrompt] = useState<QuickPrompt>(QUICK_PROMPTS[0]);
  const expertContext = useContext(BookExpertContext);
  const navigate = useNavigate();

  const handleLaunchAI = async (promptText?: string) => {
    const textToSend = promptText || activePrompt.question;
    try {
      if (expertContext) {
        if (!expertContext.isOpen) {
          expertContext.toggleChat();
        }
        if (textToSend) {
          await expertContext.sendMessage(textToSend);
        }
        return;
      }
    } catch {
      // Fallback to route navigation
    }
    navigate(textToSend ? `/book-expert?q=${encodeURIComponent(textToSend)}` : '/book-expert');
  };

  return (
    <section
      className="home-book-expert-showcase relative isolate py-16 sm:py-20 lg:py-24 px-4 sm:px-6 lg:px-8 bg-background/80 transition-colors duration-300 border-y border-border overflow-hidden"
      aria-label="Meet Your Book Expert AI"
    >
      {/* Subtle theme-aware ambient background illumination */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
        <div className="absolute top-1/3 -left-24 w-96 h-96 rounded-full bg-[hsl(var(--brand-primary)/0.07)] blur-[100px] motion-reduce:hidden" />
        <div className="absolute bottom-1/4 -right-24 w-96 h-96 rounded-full bg-[hsl(var(--brand-secondary)/0.08)] blur-[110px] motion-reduce:hidden" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center">
          {/* Left Column: Heading, Concise Value Copy, Primary & Secondary CTAs */}
          <div className="lg:col-span-6 space-y-6 text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[hsl(var(--brand-primary)/0.1)] border border-[hsl(var(--brand-primary)/0.2)] text-[11px] font-semibold tracking-wider text-[hsl(var(--brand-primary))] uppercase">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Intelligent Literary Companion</span>
            </div>

            <div className="space-y-3">
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-serif font-bold text-foreground tracking-tight leading-tight">
                Meet Your Book Expert AI
              </h2>
              <p className="text-base sm:text-lg italic text-[hsl(var(--brand-secondary))] font-serif">
                Your personal AI companion for everything books.
              </p>
              <p className="text-sm sm:text-base text-muted-foreground leading-relaxed pt-1">
                Discover books, understand complex ideas, explore authors, and get personalized reading recommendations.
              </p>
            </div>

            {/* Quick Inspiration Pills */}
            <div className="space-y-2 pt-1">
              <span className="text-xs font-medium text-muted-foreground block">
                Try asking about:
              </span>
              <div className="flex flex-wrap gap-2">
                {QUICK_PROMPTS.map((p) => {
                  const isSelected = activePrompt.id === p.id;
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setActivePrompt(p)}
                      className={`text-xs px-3 py-1.5 rounded-full border transition-all ${
                        isSelected
                          ? 'bg-[hsl(var(--brand-primary))] text-white border-[hsl(var(--brand-primary))] shadow-xs font-semibold'
                          : 'bg-card text-muted-foreground border-border hover:border-[hsl(var(--brand-primary)/0.5)] hover:text-foreground'
                      }`}
                    >
                      {p.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Action Buttons: Primary & Secondary CTAs */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3.5 pt-2">
              <Button
                type="button"
                onClick={() => handleLaunchAI()}
                className="inline-flex items-center justify-center gap-2 px-6 py-6 rounded-xl bg-[hsl(var(--brand-primary))] hover:bg-[hsl(var(--brand-primary)/0.9)] text-white font-semibold text-sm shadow-md transition-all duration-200 hover:shadow-lg focus:ring-2 focus:ring-[hsl(var(--brand-primary))]"
              >
                <Bot className="w-4 h-4" />
                <span>Ask Book Expert AI</span>
              </Button>

              <Link to="/library" className="inline-flex">
                <Button
                  variant="outline"
                  type="button"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-6 rounded-xl border-border bg-card text-foreground hover:bg-muted text-sm font-semibold transition-colors"
                >
                  <BookOpen className="w-4 h-4 text-muted-foreground" />
                  <span>Explore Books</span>
                </Button>
              </Link>
            </div>
          </div>

          {/* Right Column: AI Visual Avatar + Interactive Conversation Card */}
          <div className="lg:col-span-6 relative">
            <div className="relative rounded-2xl border border-border bg-card/95 backdrop-blur-sm p-6 sm:p-7 shadow-lg shadow-black/5 space-y-5 transition-all">
              {/* Header with AI Avatar & Status */}
              <div className="flex items-center justify-between border-b border-border/70 pb-4">
                <div className="flex items-center gap-3">
                  <div className="relative w-12 h-12 rounded-xl bg-[hsl(var(--brand-primary)/0.1)] border border-[hsl(var(--brand-primary)/0.2)] flex items-center justify-center overflow-hidden shrink-0 shadow-xs">
                    <img
                      src="/optimized-assets/book-expert-icon.webp"
                      alt="Sahadhyayi Book Expert AI Avatar"
                      className="w-9 h-9 object-contain"
                      loading="lazy"
                    />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-foreground flex items-center gap-1.5">
                      <span>Book Expert AI</span>
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    </h3>
                    <p className="text-xs text-muted-foreground">Connected to Sahadhyayi Library</p>
                  </div>
                </div>

                <span className="text-[11px] font-medium text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800/60 px-2.5 py-1 rounded-full flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Ready to Chat
                </span>
              </div>

              {/* Reader Question Bubble */}
              <div className="rounded-xl bg-muted/50 border border-border/60 p-3.5 text-xs text-foreground space-y-1">
                <div className="flex items-center gap-1.5 text-[11px] font-semibold text-[hsl(var(--brand-secondary))]">
                  <MessageSquare className="w-3 h-3" />
                  <span>Prompt:</span>
                </div>
                <p className="font-serif italic text-sm text-foreground">
                  "{activePrompt.question}"
                </p>
              </div>

              {/* Simulated Answer */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                  <span className="font-semibold uppercase tracking-wider text-[hsl(var(--brand-primary))]">
                    Synthesis preview
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-muted">
                    {activePrompt.sourceBook}
                  </span>
                </div>
                <div className="text-xs sm:text-sm text-foreground/90 leading-relaxed whitespace-pre-line bg-muted/20 p-3.5 rounded-xl border border-border/40 font-sans">
                  {activePrompt.sampleAnswer}
                </div>
              </div>

              {/* Bottom Quick-Launch in Live Chat */}
              <div className="pt-2 border-t border-border/70 flex items-center justify-between gap-3">
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Compass className="w-3.5 h-3.5 text-[hsl(var(--brand-secondary))]" />
                  <span>RAG Vector Search + Gemini 2.5</span>
                </div>

                <button
                  type="button"
                  onClick={() => handleLaunchAI(activePrompt.question)}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-[hsl(var(--brand-primary))] hover:underline"
                >
                  <span>Ask this in live chat</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HomeBookExpertShowcase;
