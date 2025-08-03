import React, { useState } from 'react';
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from '@/components/ui/tooltip';

/*
  Global CSS required:
  @keyframes dashFlow { from { stroke-dashoffset: 0; } to { stroke-dashoffset: 100; } }
*/

// Question data structure: id, label text, position, and color key
const questions = [
  { id: 'design',  label: 'Design your own book version?',                            pos: [50, 5],  color: 'emerald' },
  { id: 'search',  label: 'Find the desired ebook in library',                        pos: [82, 18], color: 'blue'    },
  { id: 'nearby',  label: "Who's reading same book nearby?",                         pos: [95, 50], color: 'purple'  },
  { id: 'comment', label: 'Discuss book insights with fellow readers?',               pos: [82, 82], color: 'red'     },
  { id: 'chat',    label: 'Chat with book friends online?',                           pos: [50, 95], color: 'orange'  },
  { id: 'map',     label: 'Explore readers on the map',                              pos: [18, 82], color: 'yellow'  },
  { id: 'track',   label: 'Track your reading progress?',                            pos: [5, 50],  color: 'cyan'    },
  { id: 'authors', label: 'Discover authors & works',                                pos: [18, 18], color: 'pink'    }
];

// Map color keys to Tailwind gradient pairs (safelist these classes in config)
const gradientClasses: Record<string, string> = {
  emerald: 'from-emerald-400 to-emerald-600',
  blue:    'from-blue-400 to-blue-600',
  purple:  'from-purple-400 to-purple-600',
  pink:    'from-pink-400   to-pink-600',
  orange:  'from-orange-400 to-orange-600',
  yellow:  'from-yellow-400 to-yellow-600',
  cyan:    'from-cyan-400   to-cyan-600',
  red:     'from-red-400    to-red-600'
};

// Renders an animated SVG path (the “current” line) for a single question
const CurrentLine: React.FC<{
  id: string; x: number; y: number; hoveredId: string | null;
}> = ({ id, x, y, hoveredId }) => (
  <path
    d={`M50,50 L${x},${y}`}                // straight line from center
    stroke="url(#grad)"
    strokeWidth={0.8}
    strokeDasharray="4 2"
    style={{ animation: 'dashFlow 2s linear infinite' }} // animate flow
    className={hoveredId === id ? 'opacity-100' : 'opacity-30'}
  />
);

// Renders a question bubble with tooltip and hover handlers
const QuestionBubble: React.FC<{
  id: string; x: number; y: number; label: string; color: string;
  hoveredId: string | null; setHovered: (id: string | null) => void;
}> = ({ id, x, y, label, color, hoveredId, setHovered }) => (
  <Tooltip>
    <TooltipTrigger asChild>
      <div
        className="absolute cursor-pointer"
        style={{ left: `${x}%`, top: `${y}%`, transform: 'translate(-50%, -50%)' }}
        onMouseEnter={() => setHovered(id)}
        onMouseLeave={() => setHovered(null)}
      >
        <div
          className={`px-3 py-1 rounded-full bg-gradient-to-br ${gradientClasses[color]} text-white text-sm font-medium whitespace-nowrap shadow-lg`}
        >
          {label}
        </div>
      </div>
    </TooltipTrigger>
    <TooltipContent side="top">
      <span>{label}</span>
    </TooltipContent>
  </Tooltip>
);

/**
 * Main hero component: left side for headline/CTA, right side for circuit diagram.
 */
const SahadhyayiCircuit: React.FC = () => {
  const [hoveredId, setHovered] = useState<string | null>(null);

  // Prepare SVG lines and bubble components so every question gets
  // a radial connection from the center hub.
  const lines: JSX.Element[] = [];
  const bubbles: JSX.Element[] = [];
  questions.forEach((q) => {
    lines.push(
      <CurrentLine
        key={`line-${q.id}`}
        id={q.id}
        x={q.pos[0]}
        y={q.pos[1]}
        hoveredId={hoveredId}
      />
    );
    bubbles.push(
      <QuestionBubble
        key={`bubble-${q.id}`}
        id={q.id}
        x={q.pos[0]}
        y={q.pos[1]}
        label={q.label}
        color={q.color}
        hoveredId={hoveredId}
        setHovered={setHovered}
      />
    );
  });

  return (
    <TooltipProvider>
      <div className="flex w-full h-screen bg-black text-white">
        <style>{`
          @keyframes dashFlow { from { stroke-dashoffset: 0; } to { stroke-dashoffset: 100; } }
        `}</style>

        {/* Left column: headline and call-to-action */}
        <div className="w-1/2 flex flex-col justify-center px-16 space-y-6">
          <h1 className="text-4xl md:text-5xl font-bold leading-snug">
            Want an intellectual friend from reading community?
          </h1>
          <p className="text-2xl text-blue-100">Let's Explore Sahadhyayi!</p>
          <a
            href="/signup"
            className="mt-4 inline-block w-44 px-6 py-3 bg-cyan-500 hover:bg-cyan-600 text-white text-lg font-semibold rounded-full shadow-lg transition-transform hover:scale-105"
          >
            Join the Reading Circle
          </a>
        </div>

        {/* Right column: circuit diagram with animated lines and bubbles */}
        <div className="w-1/2 relative">
          {/* SVG definitions and animated lines */}
          <svg viewBox="0 0 100 100" className="absolute inset-0 w-full h-full pointer-events-none">
            <defs>
              <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#22d3ee" />
                <stop offset="100%" stopColor="#3b82f6" />
              </linearGradient>
            </defs>
            {lines}
          </svg>

          {/* Central hub circle with brand name */}
          <div className="absolute inset-0 flex items-center justify-center z-10">
            <div className="w-32 h-32 rounded-full bg-gradient-to-br from-emerald-600 to-teal-400 flex items-center justify-center text-white text-xl font-bold shadow-lg">
              Sahadhyayi
            </div>
          </div>

          {/* Render each question bubble */}
          {bubbles}
        </div>
      </div>
    </TooltipProvider>
  );
};

export default SahadhyayiCircuit;

