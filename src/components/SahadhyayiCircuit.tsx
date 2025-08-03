
import React, { useState, useMemo, useCallback, memo } from 'react';

// TypeScript interfaces for type safety
interface Question {
  id: string;
  label: string;
  pos: [number, number];
  color: ColorKey;
}

type ColorKey = 'emerald' | 'blue' | 'purple' | 'red' | 'orange' | 'yellow' | 'cyan' | 'pink';

// Question data structure
const questions: Question[] = [
  { id: 'design',  label: 'Design your own book version?',                            pos: [50, 14], color: 'emerald' },
  { id: 'search',  label: 'Find the desired ebook in library',                        pos: [76, 24], color: 'blue'    },
  { id: 'nearby',  label: "Who's reading same book nearby?",                         pos: [86, 50], color: 'purple'  },
  { id: 'comment', label: 'Discuss book insights with fellow readers?',               pos: [76, 76], color: 'red'     },
  { id: 'chat',    label: 'Chat with book friends online?',                           pos: [50, 86], color: 'orange'  },
  { id: 'map',     label: 'Explore readers on the map',                              pos: [24, 76], color: 'yellow'  },
  { id: 'track',   label: 'Track your reading progress?',                            pos: [14, 50], color: 'cyan'    },
  { id: 'authors', label: 'Discover authors & works',                                pos: [24, 24], color: 'pink'    }
];

// Map color keys to Tailwind gradient pairs
const gradientClasses: Record<ColorKey, string> = {
  emerald: 'from-emerald-400 to-emerald-600',
  blue:    'from-blue-400 to-blue-600',
  purple:  'from-purple-400 to-purple-600',
  pink:    'from-pink-400 to-pink-600',
  orange:  'from-orange-400 to-orange-600',
  yellow:  'from-yellow-400 to-yellow-600',
  cyan:    'from-cyan-400 to-cyan-600',
  red:     'from-red-400 to-red-600'
};

// Tooltip component for better accessibility
const Tooltip: React.FC<{ text: string; visible: boolean; x: number; y: number }> = ({ text, visible, x, y }) => {
  if (!visible) return null;
  
  return (
    <div
      className="absolute z-20 px-3 py-2 bg-gray-900 text-white text-sm rounded-md shadow-lg max-w-xs transition-opacity duration-200"
      style={{
        left: `${x}%`,
        top: `${y + 5}%`,
        transform: 'translateX(-50%)'
      }}
      role="tooltip"
    >
      {text}
    </div>
  );
};

// Props interfaces for better type safety
interface CurrentLineProps {
  id: string;
  x: number;
  y: number;
  hoveredId: string | null;
}

interface QuestionBubbleProps {
  id: string;
  x: number;
  y: number;
  label: string;
  color: ColorKey;
  hoveredId: string | null;
  focusedId: string | null;
  setHovered: (id: string | null) => void;
  setFocused: (id: string | null) => void;
}

// Memoized CurrentLine component to prevent unnecessary re-renders
const CurrentLine = memo<CurrentLineProps>(({ id, x, y, hoveredId }) => (
  <path
    d={`M50,50 L${x},${y}`}
    stroke="url(#grad)"
    strokeWidth={1.2}
    className={hoveredId === id ? 'opacity-100' : 'opacity-50'}
  />
));

CurrentLine.displayName = 'CurrentLine';

// Memoized QuestionBubble component with keyboard navigation support
const QuestionBubble = memo<QuestionBubbleProps>(({ id, x, y, label, color, hoveredId, focusedId, setHovered, setFocused }) => {
  const isHovered = hoveredId === id;
  const isFocused = focusedId === id;

  const handleKeyPress = useCallback((event: React.KeyboardEvent) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      // Could add click handler here if needed
    }
  }, []);
  
  return (
    <>
      <div
        className="absolute cursor-pointer"
        style={{ left: `${x}%`, top: `${y}%`, transform: 'translate(-50%, -50%)' }}
        onMouseEnter={() => setHovered(id)}
        onMouseLeave={() => setHovered(null)}
        onFocus={() => setFocused(id)}
        onBlur={() => setFocused(null)}
        onKeyPress={handleKeyPress}
        tabIndex={0}
        role="button"
        aria-label={label}
        aria-describedby={`tooltip-${id}`}
      >
        <div
          className={`px-3 py-1 rounded-full bg-gradient-to-br ${gradientClasses[color]} text-white text-sm font-medium whitespace-nowrap shadow-lg transition-all duration-300 ${isHovered || isFocused ? 'scale-105 ring-2 ring-white ring-opacity-50' : ''}`}
        >
          {label}
        </div>
      </div>
      <Tooltip text={label} visible={isHovered || isFocused} x={x} y={y} />
    </>
  );
});

QuestionBubble.displayName = 'QuestionBubble';

// Main hero component with improved performance and accessibility
const SahadhyayiCircuit: React.FC = () => {
  const [hoveredId, setHovered] = useState<string | null>(null);
  const [focusedId, setFocused] = useState<string | null>(null);

  // Memoize callbacks to prevent unnecessary re-renders
  const handleSetHovered = useCallback((id: string | null) => {
    setHovered(id);
  }, []);

  const handleSetFocused = useCallback((id: string | null) => {
    setFocused(id);
  }, []);

  // Memoize lines and bubbles to prevent unnecessary re-renders
  const lines = useMemo(() => {
    return questions.map((q) => (
      <CurrentLine
        key={`line-${q.id}`}
        id={q.id}
        x={q.pos[0]}
        y={q.pos[1]}
        hoveredId={hoveredId}
      />
    ));
  }, [hoveredId]);

  const bubbles = useMemo(() => {
    return questions.map((q) => (
      <QuestionBubble
        key={`bubble-${q.id}`}
        id={q.id}
        x={q.pos[0]}
        y={q.pos[1]}
        label={q.label}
        color={q.color}
        hoveredId={hoveredId}
        focusedId={focusedId}
        setHovered={handleSetHovered}
        setFocused={handleSetFocused}
      />
    ));
  }, [hoveredId, focusedId, handleSetHovered, handleSetFocused]);

  return (
    <div className="flex flex-col lg:flex-row w-full min-h-screen bg-black text-white overflow-hidden">

      {/* Left column: headline and call-to-action */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center px-6 md:px-12 lg:px-16 py-12 lg:py-0 space-y-6 z-10">
        <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold leading-tight">
          Want an intellectual friend from reading community?
        </h1>
        <p className="text-xl md:text-2xl text-blue-100">Let's Explore Sahadhyayi!</p>
        <a
          href="/signup"
          className="mt-4 inline-block w-auto max-w-xs px-6 py-3 bg-cyan-500 hover:bg-cyan-600 text-white text-lg font-semibold rounded-full shadow-lg transition-all duration-300 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:ring-opacity-50 text-center"
          aria-label="Join the Reading Circle - Sign up for Sahadhyayi"
        >
          Join the Reading Circle
        </a>
      </div>

      {/* Right column: circuit diagram with animated lines and bubbles */}
      <div className="w-full lg:w-1/2 relative min-h-[500px] lg:min-h-screen">
        {/* SVG definitions and animated lines */}
        <svg 
          viewBox="0 0 100 100" 
          className="absolute inset-0 w-full h-full pointer-events-none"
          aria-hidden="true"
        >
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
          <div className="w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28 lg:w-32 lg:h-32 rounded-full bg-gradient-to-br from-emerald-600 to-teal-400 flex items-center justify-center text-white text-base sm:text-lg md:text-xl font-bold shadow-xl transition-all duration-300 hover:scale-105 cursor-default">
            Sahadhyayi
          </div>
        </div>

        {/* Render each question bubbles */}
        {bubbles}
      </div>
    </div>
  );
};

export default SahadhyayiCircuit;
