import React, { useState } from 'react';
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from '@/components/ui/tooltip';

/*
  Global CSS required:
  @keyframes dashFlow { from { stroke-dashoffset: 0; } to { stroke-dashoffset: 100; } }
*/

// Question data structure: id, label text, grid row/column, and color key
const questions = [
  { id: 'design',  label: 'Design your own book version?',                 row: 1, col: 1, color: 'emerald' },
  { id: 'search',  label: 'Find the desired ebook in library',             row: 1, col: 2, color: 'blue'    },
  { id: 'nearby',  label: "Who's reading same book nearby?",              row: 1, col: 3, color: 'purple'  },
  { id: 'comment', label: 'Discuss book insights with fellow readers?',    row: 2, col: 3, color: 'red'     },
  { id: 'chat',    label: 'Chat with book friends online?',                row: 3, col: 3, color: 'orange'  },
  { id: 'map',     label: 'Explore readers on the map',                    row: 3, col: 2, color: 'yellow'  },
  { id: 'track',   label: 'Track your reading progress?',                  row: 3, col: 1, color: 'cyan'    },
  { id: 'authors', label: 'Discover authors & works',                      row: 2, col: 1, color: 'pink'    }
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
    d={`M50,50 L${x},${y}`} // straight line from center
    stroke="url(#grad)"
    strokeWidth={0.8}
    strokeDasharray="4 2"
    style={{ animation: 'dashFlow 2s linear infinite' }}
    className={hoveredId === id ? 'opacity-100' : 'opacity-30'}
  />
);

// Renders a question bubble within a grid cell
const QuestionBubble: React.FC<{
  id: string; row: number; col: number; label: string; color: string;
  hoveredId: string | null; setHovered: (id: string | null) => void;
}> = ({ id, row, col, label, color, hoveredId, setHovered }) => (
  <Tooltip>
    <TooltipTrigger asChild>
      <div
        className="flex items-center justify-center cursor-pointer"
        style={{ gridColumn: col, gridRow: row }}
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

  // Convert grid row/column into percentage coordinates for SVG lines
  const coord = (i: number) => (i - 0.5) * (100 / 3);

  // Prepare SVG lines and bubble components so every question gets
  // a connection from the center hub.
  const lines: JSX.Element[] = [];
  const bubbles: JSX.Element[] = [];
  questions.forEach((q) => {
    const x = coord(q.col);
    const y = coord(q.row);
    lines.push(
      <CurrentLine
        key={`line-${q.id}`}
        id={q.id}
        x={x}
        y={y}
        hoveredId={hoveredId}
      />
    );
    bubbles.push(
      <QuestionBubble
        key={`bubble-${q.id}`}
        id={q.id}
        row={q.row}
        col={q.col}
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

        {/* Right column: grid with connector lines */}
        <div className="w-1/2 relative">
          {/* SVG lines overlay */}
          <svg viewBox="0 0 100 100" className="absolute inset-0 w-full h-full pointer-events-none">
            <defs>
              <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#22d3ee" />
                <stop offset="100%" stopColor="#3b82f6" />
              </linearGradient>
            </defs>
            {lines}
          </svg>

          {/* Grid positions for hub and bubbles */}
          <div className="absolute inset-0 grid grid-cols-3 grid-rows-3">
            <div
              className="flex items-center justify-center"
              style={{ gridColumn: 2, gridRow: 2 }}
            >
              <div className="w-32 h-32 rounded-full bg-gradient-to-br from-emerald-600 to-teal-400 flex items-center justify-center text-white text-xl font-bold shadow-lg">
                Sahadhyayi
              </div>
            </div>
            {bubbles}
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
};

export default SahadhyayiCircuit;

