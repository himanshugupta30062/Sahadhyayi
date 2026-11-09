import React, { useState, useContext } from 'react';
import { Sparkles, Bot, ArrowRight, MessageSquare, Compass } from 'lucide-react';
import { BookExpertContext } from '@/contexts/book-expert.utils';
import { QuickPrompt } from './journeyData';

interface JourneyAiStationProps {
  prompts: QuickPrompt[];
}

export const JourneyAiStation: React.FC<JourneyAiStationProps> = ({ prompts }) => {
  const [selectedPrompt, setSelectedPrompt] = useState<QuickPrompt>(prompts[0] || {
    id: 'rec-default',
    label: 'Philosophy',
    question: 'Recommend 3 books similar to Siddhartha for exploring inner peace.',
    previewReply: '1. "The Prophet" by Kahlil Gibran\n2. "The Razor\'s Edge" by W. Somerset Maugham\n3. "The Way of Zen" by Alan Watts',
  });
  const [isLaunching, setIsLaunching] = useState(false);
  const expertContext = useContext(BookExpertContext);

  const openAssistant = () => {
    if (!expertContext) return false;
    if (!expertContext.isOpen) expertContext.toggleChat();
    return true;
  };

  const handleLaunchPrompt = async (prompt: QuickPrompt) => {
    setSelectedPrompt(prompt);
    if (!expertContext) return;

    setIsLaunching(true);
    try {
      openAssistant();
      await expertContext.sendMessage(prompt.question);
    } finally {
      setIsLaunching(false);
    }
  };

  const handleOpenAiFull = () => {
    openAssistant();
  };

  return (
    <div className="w-full rounded-2xl bg-card text-card-foreground border border-border p-5 sm:p-6 shadow-lg">
      <div className="flex items-center justify-between gap-3 mb-4 border-b border-border pb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-[hsl(var(--brand-primary)/0.12)] border border-[hsl(var(--brand-primary)/0.2)] flex items-center justify-center text-[hsl(var(--brand-primary))]">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm sm:text-base font-serif font-bold flex items-center gap-1.5">
              <span>Meet Book Expert AI</span>
              <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
            </h4>
            <p className="text-xs text-muted-foreground">Choose an example or open the assistant</p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleOpenAiFull}
          className="text-xs font-semibold px-3 py-1.5 rounded-full bg-muted hover:bg-muted/80 text-foreground border border-border transition-all inline-flex items-center gap-1"
        >
          <span>Open assistant</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="flex flex-wrap gap-2 mb-4">
        {prompts.map((prompt) => {
          const isActive = selectedPrompt.id === prompt.id;
          return (
            <button
              key={prompt.id}
              type="button"
              onClick={() => setSelectedPrompt(prompt)}
              className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-all inline-flex items-center gap-1.5 ${
                isActive
                  ? 'bg-[hsl(var(--brand-primary))] text-white font-semibold shadow-sm'
                  : 'bg-muted hover:bg-muted/80 text-foreground border border-border'
              }`}
            >
              <Sparkles className="w-3 h-3" />
              <span>{prompt.label}</span>
            </button>
          );
        })}
      </div>

      <div className="rounded-xl bg-muted/50 border border-border p-3.5 mb-4">
        <div className="flex items-start gap-2.5">
          <MessageSquare className="w-4 h-4 text-[hsl(var(--brand-primary))] shrink-0 mt-0.5" />
          <div className="space-y-1.5 flex-1 min-w-0">
            <p className="text-xs sm:text-sm font-medium text-foreground italic">
              &ldquo;{selectedPrompt.question}&rdquo;
            </p>
            <div className="pt-2 border-t border-border text-xs text-muted-foreground whitespace-pre-line leading-relaxed">
              {selectedPrompt.previewReply}
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-2.5 items-stretch sm:items-center">
        <button
          type="button"
          onClick={() => void handleLaunchPrompt(selectedPrompt)}
          disabled={isLaunching || !expertContext}
          className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[hsl(var(--brand-primary))] hover:opacity-90 text-white font-bold text-xs sm:text-sm shadow-md transition-all disabled:opacity-50"
        >
          <Sparkles className="w-4 h-4" />
          <span>{isLaunching ? 'Opening AI Companion...' : 'Ask AI Live Now'}</span>
        </button>

        <button
          type="button"
          onClick={handleOpenAiFull}
          disabled={!expertContext}
          className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-background hover:bg-muted text-foreground font-medium text-xs sm:text-sm border border-border transition-all disabled:opacity-50"
        >
          <Compass className="w-4 h-4 text-[hsl(var(--brand-secondary))]" />
          <span>Open Book Expert</span>
        </button>
      </div>
    </div>
  );
};
