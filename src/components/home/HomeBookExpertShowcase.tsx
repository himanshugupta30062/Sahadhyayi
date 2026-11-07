import React, { useState, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Bot,
  Sparkles,
  BookOpen,
  ArrowRight,
  MessageSquare,
  Search,
  CheckCircle2,
  Cpu,
  Compass,
} from 'lucide-react';
import { BookExpertContext } from '@/contexts/book-expert.utils';

interface ExamplePrompt {
  id: string;
  category: string;
  question: string;
  bookContext: string;
  sampleAnswer: string;
}

const EXAMPLE_PROMPTS: ExamplePrompt[] = [
  {
    id: 'concept',
    category: 'Philosophical Concept',
    question: 'Explain the concept of "Nishkama Karma" in the Bhagavad Gita and how it relates to modern burnout.',
    bookContext: 'The Bhagavad Gita',
    sampleAnswer:
      'Nishkama Karma refers to selfless action performed without anxiety over the fruits or results. Rather than being passive, it advocates total absorption in right action while decoupling personal peace from unpredictable outcomes — a direct antidote to modern performance burnout.',
  },
  {
    id: 'summary',
    category: 'Chapter Summary',
    question: 'Summarize the courtroom climax in Dostoevsky’s The Brothers Karamazov with key thematic takeaways.',
    bookContext: 'The Brothers Karamazov',
    sampleAnswer:
      'The trial of Dmitri Karamazov serves as a dramatic battleground between Western rationalist jurisprudence and Russian spiritual intuition. Dostoevsky demonstrates how empirical circumstantial evidence, while logically airtight, completely misses the moral truth of the human heart.',
  },
  {
    id: 'character',
    category: 'Character Motivations',
    question: 'What psychological factors drive Hori’s tragic compromises in Munshi Premchand’s Godaan?',
    bookContext: 'Godaan by Munshi Premchand',
    sampleAnswer:
      'Hori is trapped between his deep devotion to peasant dignity ("Maryada") and the predatory web of village debt, caste hierarchies, and land tenure. His tragedy is not moral weakness, but an honorable man trying to remain righteous inside an unrighteous socioeconomic order.',
  },
  {
    id: 'compare',
    category: 'Thematic Comparison',
    question: 'Compare the critique of technology and bureaucracy in 1984 vs Brave New World.',
    bookContext: 'George Orwell & Aldous Huxley',
    sampleAnswer:
      'Orwell envisions control through state surveillance, pain, and deprivation ("Big Brother"), whereas Huxley foresees control through manufactured pleasure, consumer complacency, and chemical sedation ("Soma"). Both warn of dehumanization, but through opposing psychological avenues.',
  },
  {
    id: 'recommend',
    category: 'Personalized Recommendation',
    question: 'Recommend 3 books similar to Siddhartha for someone interested in existential philosophy and Eastern thought.',
    bookContext: 'Reading Concierge',
    sampleAnswer:
      '1. "The Prophet" by Kahlil Gibran (poetic spiritual reflection).\n2. "The Razor’s Edge" by W. Somerset Maugham (a seeker’s journey to India).\n3. "The Way of Zen" by Alan Watts (accessible philosophical grounding).',
  },
];

export const HomeBookExpertShowcase: React.FC = () => {
  const [selectedPrompt, setSelectedPrompt] = useState<ExamplePrompt>(EXAMPLE_PROMPTS[0]);
  const expertContext = useContext(BookExpertContext);
  const navigate = useNavigate();

  const handleLaunchPrompt = async (promptText: string) => {
    try {
      if (expertContext) {
        if (!expertContext.isOpen) {
          expertContext.toggleChat();
        }
        await expertContext.sendMessage(promptText);
        return;
      }
    } catch {
      // Fallback navigation below
    }
    navigate(`/book-expert?q=${encodeURIComponent(promptText)}`);
  };

  return (
    <section
      className="home-book-expert-showcase relative isolate py-16 sm:py-20 lg:py-24 px-4 sm:px-6 lg:px-8 bg-[#0F1412] text-[#F3F0E7] border-y border-[#202A24] overflow-hidden"
      aria-label="Meet Your Book Expert AI"
    >
      {/* Background ambient lighting */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
        <div className="absolute top-1/4 -left-20 w-96 h-96 rounded-full bg-[#1C442D]/30 blur-[130px]" />
        <div className="absolute bottom-1/4 -right-20 w-96 h-96 rounded-full bg-[#D5B16D]/15 blur-[140px]" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-12 sm:mb-14">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#18221D] border border-[#2D3A32] text-[11px] font-bold uppercase tracking-wider text-[#D5B16D] mb-4">
              <Sparkles className="w-3.5 h-3.5 text-[#D5B16D]" />
              <span>Gemini 2.5 Flash & RAG Architecture</span>
            </div>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-serif font-bold text-white tracking-tight">
              Meet Your Book Expert AI
            </h2>
            <p className="mt-2.5 text-sm sm:text-base text-[#A5ADA6] leading-relaxed">
              Not a generic chatbot — an intelligent literary companion connected directly to Sahadhyayi’s digitized library and vector embeddings. Ask deep questions, unpack challenging passages, and discover literature with context.
            </p>
          </div>

          <div className="flex items-center gap-3 self-start md:self-end">
            <button
              type="button"
              onClick={() => handleLaunchPrompt(selectedPrompt.question)}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-[#D5B16D] hover:bg-[#e4c688] text-stone-950 font-semibold text-xs sm:text-sm transition-all shadow-md shadow-[#D5B16D]/20 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-[#D5B16D]"
            >
              <Bot className="w-4 h-4 text-stone-950" />
              <span>Ask Book Expert Now</span>
            </button>
          </div>
        </div>

        {/* Interactive Dual-Panel Showcase */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-stretch">
          {/* Left Column: Interactive Questions Picker */}
          <div className="lg:col-span-5 flex flex-col justify-between space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-[#A5ADA6] px-1">
              Select an inquiry type:
            </p>
            {EXAMPLE_PROMPTS.map((p) => {
              const isActive = selectedPrompt.id === p.id;
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setSelectedPrompt(p)}
                  className={`text-left p-4 rounded-xl border transition-all duration-200 flex items-start justify-between gap-3 ${
                    isActive
                      ? 'bg-[#18231D] border-[#D5B16D] shadow-sm text-white'
                      : 'bg-[#131916] border-[#222E26] hover:bg-[#18201B] hover:border-[#2F3F34] text-[#A5ADA6]'
                  }`}
                >
                  <div className="min-w-0">
                    <span
                      className={`text-[10px] font-bold uppercase tracking-wider block mb-1 ${
                        isActive ? 'text-[#D5B16D]' : 'text-[#6E7B6F]'
                      }`}
                    >
                      {p.category}
                    </span>
                    <p
                      className={`text-xs sm:text-sm font-medium line-clamp-2 leading-snug ${
                        isActive ? 'text-white' : 'text-[#C9D1CB]'
                      }`}
                    >
                      {p.question}
                    </p>
                  </div>
                  <span
                    className={`shrink-0 text-xs px-2 py-0.5 rounded ${
                      isActive ? 'bg-[#D5B16D]/20 text-[#D5B16D]' : 'bg-[#1C2420] text-[#717E73]'
                    }`}
                  >
                    {p.bookContext}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Right Column: Simulated Live Response & Deep Dive Preview */}
          <div className="lg:col-span-7 flex flex-col justify-between rounded-2xl bg-[#131A16] border border-[#26352B] p-6 sm:p-8 relative">
            <div>
              {/* Question bubble */}
              <div className="mb-6 p-4 rounded-xl bg-[#1A251E] border border-[#2D3F33] text-sm text-[#F3F0E7]">
                <div className="flex items-center gap-2 text-xs font-semibold text-[#D5B16D] mb-1.5">
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>Reader Question:</span>
                </div>
                <p className="font-serif italic text-base leading-relaxed text-white">
                  "{selectedPrompt.question}"
                </p>
              </div>

              {/* Bot response box */}
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-[#26352B] pb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-[#D5B16D]/20 text-[#D5B16D] flex items-center justify-center font-bold text-xs">
                      AI
                    </div>
                    <div>
                      <p className="text-xs font-bold text-white">Sahadhyayi Book Expert</p>
                      <p className="text-[10px] text-[#869288]">Vector-retrieved literature synthesis</p>
                    </div>
                  </div>
                  <span className="text-[10px] text-emerald-400 font-mono flex items-center gap-1 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800/60">
                    <CheckCircle2 className="w-3 h-3" /> Live Assistant
                  </span>
                </div>

                <div className="text-xs sm:text-sm text-[#D7DBD8] leading-relaxed whitespace-pre-line font-sans">
                  {selectedPrompt.sampleAnswer}
                </div>
              </div>
            </div>

            {/* Bottom Action Footer */}
            <div className="mt-8 pt-6 border-t border-[#26352B] flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-2 text-xs text-[#869288]">
                <Cpu className="w-4 h-4 text-[#D5B16D]" />
                <span>Powered by Gemini AI with RAG retrieval</span>
              </div>

              <button
                type="button"
                onClick={() => handleLaunchPrompt(selectedPrompt.question)}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-[#1C442D] hover:bg-[#25573A] text-white font-semibold text-xs sm:text-sm transition-colors border border-[#306243]"
              >
                <span>Ask this in live chat</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HomeBookExpertShowcase;
