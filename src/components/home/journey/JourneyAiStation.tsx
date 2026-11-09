import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, Bot, ArrowRight, MessageSquare, Compass, CheckCircle2 } from 'lucide-react';
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
  const navigate = useNavigate();

  const handleLaunchPrompt = async (prompt: QuickPrompt) => {
    setSelectedPrompt(prompt);
    setIsLaunching(true);
    try {
      if (expertContext) {
        if (!expertContext.isOpen) {
          expertContext.toggleChat();
        }
        await expertContext.sendMessage(prompt.question);
        setIsLaunching(false);
        return;
      }
    } catch {
      // Fallback to route navigation if chat drawer cannot launch
    }
    navigate(`/book-expert?q=${encodeURIComponent(prompt.question)}`);
    setIsLaunching(false);
  };

  const handleOpenAiFull = () => {
    navigate('/book-expert');
  };

  return (
    <div className="w-full rounded-2xl bg-gradient-to-br from-[#0F172A]/90 via-[#1E293B]/90 to-[#0B132B]/90 border border-[#38BDF8]/30 p-5 sm:p-6 text-white shadow-xl backdrop-blur-md">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 mb-4 border-b border-white/10 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-[#0284C7]/30 border border-[#38BDF8]/40 flex items-center justify-center text-[#38BDF8]">
            <Bot className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h4 className="text-sm sm:text-base font-serif font-bold text-white flex items-center gap-1.5">
              <span>Interactive Book Expert AI</span>
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping inline-block" />
            </h4>
            <p className="text-xs text-sky-200/70">Click any prompt to ask live</p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleOpenAiFull}
          className="text-xs font-semibold px-3 py-1.5 rounded-full bg-sky-500/20 hover:bg-sky-500/30 text-sky-200 border border-sky-400/30 transition-all flex items-center gap-1 cursor-pointer"
        >
          <span>Full Screen</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Prompt Selection Chips */}
      <div className="flex flex-wrap gap-2 mb-4">
        {prompts.map((p) => {
          const isActive = selectedPrompt.id === p.id;
          return (
            <button
              key={p.id}
              type="button"
              onClick={() => setSelectedPrompt(p)}
              className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-all cursor-pointer flex items-center gap-1.5 ${
                isActive
                  ? 'bg-sky-500 text-stone-950 font-semibold shadow-md shadow-sky-500/25'
                  : 'bg-white/10 hover:bg-white/15 text-stone-200 border border-white/10'
              }`}
            >
              <Sparkles className="w-3 h-3" />
              <span>{p.label}</span>
            </button>
          );
        })}
      </div>

      {/* Active Question Box */}
      <div className="rounded-xl bg-black/40 border border-white/10 p-3.5 mb-4">
        <div className="flex items-start gap-2.5">
          <MessageSquare className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
          <div className="space-y-1.5 flex-1 min-w-0">
            <p className="text-xs sm:text-sm font-medium text-sky-100 italic">
              &ldquo;{selectedPrompt.question}&rdquo;
            </p>
            <div className="pt-2 border-t border-white/10 text-xs text-stone-300 font-mono whitespace-pre-line leading-relaxed">
              {selectedPrompt.previewReply}
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-2.5 items-stretch sm:items-center">
        <button
          type="button"
          onClick={() => handleLaunchPrompt(selectedPrompt)}
          disabled={isLaunching}
          className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-sky-500 to-cyan-500 hover:from-sky-400 hover:to-cyan-400 text-stone-950 font-bold text-xs sm:text-sm shadow-md transition-all cursor-pointer disabled:opacity-50"
        >
          <Sparkles className="w-4 h-4" />
          <span>{isLaunching ? 'Opening AI Companion...' : 'Ask AI Live Now'}</span>
        </button>

        <button
          type="button"
          onClick={handleOpenAiFull}
          className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-medium text-xs sm:text-sm border border-white/15 transition-all cursor-pointer"
        >
          <Compass className="w-4 h-4 text-sky-300" />
          <span>Explore AI Hub</span>
        </button>
      </div>
    </div>
  );
};
