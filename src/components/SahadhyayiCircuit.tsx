
import React, { useState, useMemo, useCallback, memo } from 'react';
import { Link } from 'react-router-dom';

// TypeScript interfaces for type safety
interface Question {
  id: string;
  label: string;
  pos: [number, number];
  color: ColorKey;
}

type ColorKey = 'emerald' | 'blue' | 'purple' | 'red' | 'orange' | 'yellow' | 'cyan' | 'pink';

// Question data structure - exactly 8 questions for 8 lines with adjusted positioning
const questions: Question[] = [
  { id: 'design',  label: 'Design your own book version?',                            pos: [50, 12], color: 'emerald' },
  { id: 'search',  label: 'Find the desired ebook in library',                        pos: [75, 25], color: 'blue'    },
  { id: 'nearby',  label: "Who's reading the same book nearby?",                      pos: [85, 50], color: 'purple'  },
  { id: 'comment', label: 'Discuss book insights with fellow readers?',               pos: [75, 75], color: 'red'     },
  { id: 'chat',    label: 'Chat with book friends online?',                           pos: [50, 88], color: 'orange'  },
  { id: 'map',     label: 'Explore readers on the map',                               pos: [25, 75], color: 'yellow'  },
  { id: 'track',   label: 'Track your reading progress?',                             pos: [15, 50], color: 'cyan'    },
  { id: 'authors', label: 'Discover authors & works',                                 pos: [25, 25], color: 'pink'    }
];

// Enhanced gradient classes with more vibrant colors
const gradientClasses: Record<ColorKey, string> = {
  emerald: 'from-emerald-400 via-emerald-500 to-emerald-600',
  blue:    'from-blue-400 via-blue-500 to-blue-600',
  purple:  'from-purple-400 via-purple-500 to-purple-600',
  pink:    'from-pink-400 via-pink-500 to-pink-600',
  orange:  'from-orange-400 via-orange-500 to-orange-600',
  yellow:  'from-yellow-400 via-yellow-500 to-yellow-600',
  cyan:    'from-cyan-400 via-cyan-500 to-cyan-600',
  red:     'from-red-400 via-red-500 to-red-600'
};

// Enhanced tooltip component with better styling
const Tooltip: React.FC<{ text: string; visible: boolean; x: number; y: number }> = ({ text, visible, x, y }) => {
  if (!visible) return null;
  
  return (
    <div
      className="absolute z-20 px-4 py-3 bg-gray-900 text-white text-sm rounded-xl shadow-2xl max-w-xs transition-all duration-300 transform"
      style={{
        left: `${x}%`,
        top: `${y + 5}%`,
        transform: 'translateX(-50%) translateY(-5px)'
      }}
      role="tooltip"
    >
      <div className="relative">
        {text}
        <div className="absolute -top-1 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-gray-900 rotate-45"></div>
      </div>
    </div>
  );
};

// Props interfaces for better type safety
interface CurrentLineProps {
  id: string;
  x: number;
  y: number;
  hoveredId: string | null;
  color: ColorKey;
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

// Enhanced CurrentLine component with animated gradients - ensuring all lines are visible
const CurrentLine = memo<CurrentLineProps>(({ id, x, y, hoveredId, color }) => (
  <line
    x1="50"
    y1="50"
    x2={x}
    y2={y}
    stroke={`url(#grad-${id})`}
    strokeWidth={hoveredId === id ? 3 : 2}
    className={`transition-all duration-300 ${hoveredId === id ? 'opacity-100' : 'opacity-70'}`}
    style={{
      filter: hoveredId === id ? 'drop-shadow(0 0 8px rgba(59, 130, 246, 0.6))' : 'none'
    }}
  />
));

CurrentLine.displayName = 'CurrentLine';

// Enhanced QuestionBubble component with better animations
const QuestionBubble = memo<QuestionBubbleProps>(({ id, x, y, label, color, hoveredId, focusedId, setHovered, setFocused }) => {
  const isHovered = hoveredId === id;
  const isFocused = focusedId === id;

  const handleKeyPress = useCallback((event: React.KeyboardEvent) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
    }
  }, []);
  
  return (
    <>
      <div
        className="absolute cursor-pointer transform transition-all duration-300 z-10"
        style={{ 
          left: `${x}%`, 
          top: `${y}%`, 
          transform: `translate(-50%, -50%) ${isHovered || isFocused ? 'scale(1.05)' : 'scale(1)'}` 
        }}
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
          className={`px-4 py-2 rounded-full bg-gradient-to-r ${gradientClasses[color]} text-white text-sm font-semibold whitespace-nowrap shadow-xl transition-all duration-300 border-2 border-white/20 backdrop-blur-sm ${
            isHovered || isFocused 
              ? 'ring-4 ring-white/30 shadow-2xl' 
              : ''
          }`}
          style={{
            filter: isHovered || isFocused ? 'brightness(1.1)' : 'brightness(1)',
          }}
        >
          {label}
        </div>
      </div>
      <Tooltip text={label} visible={isHovered || isFocused} x={x} y={y} />
    </>
  );
});

QuestionBubble.displayName = 'QuestionBubble';

// Main enhanced component
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

  // Create gradient definitions for each line - ensuring all 8 gradients are created
  const gradientDefs = useMemo(() => {
    return questions.map((q) => {
      const colors = {
        emerald: ['#34d399', '#059669'],
        blue: ['#60a5fa', '#2563eb'],
        purple: ['#a78bfa', '#7c3aed'],
        pink: ['#f472b6', '#ec4899'],
        orange: ['#fb923c', '#ea580c'],
        yellow: ['#fbbf24', '#d97706'],
        cyan: ['#22d3ee', '#0891b2'],
        red: ['#f87171', '#dc2626']
      };
      
      return (
        <linearGradient key={`grad-${q.id}`} id={`grad-${q.id}`} x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor={colors[q.color][0]} />
          <stop offset="100%" stopColor={colors[q.color][1]} />
        </linearGradient>
      );
    });
  }, []);

  // Memoize lines - ensuring all 8 lines are rendered
  const lines = useMemo(() => {
    return questions.map((q) => (
      <CurrentLine
        key={`line-${q.id}`}
        id={q.id}
        x={q.pos[0]}
        y={q.pos[1]}
        hoveredId={hoveredId}
        color={q.color}
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
    <div className="flex flex-col lg:flex-row w-full min-h-screen bg-black text-white overflow-hidden relative">
      {/* Enhanced background with animated gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-black to-gray-900 opacity-50"></div>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(59,130,246,0.1)_0%,transparent_70%)]"></div>
      
      {/* Left column: enhanced headline and call-to-action */}
      <div className="w-full lg:w-2/5 flex flex-col justify-center px-6 md:px-8 lg:px-12 py-12 lg:py-0 space-y-8 z-10 relative">
        <div className="space-y-6">
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold leading-tight bg-gradient-to-r from-blue-400 via-purple-400 to-emerald-400 bg-clip-text text-transparent">
            Want an intellectual friend from reading community?
          </h1>
          <p className="text-lg md:text-xl text-blue-100 font-medium">
            Let's Explore Sahadhyayi!
          </p>
        </div>
        
        <Link
          to="/signup"
          className="mt-6 inline-block w-auto max-w-sm px-8 py-4 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white text-lg font-bold rounded-full shadow-2xl transition-all duration-300 hover:scale-105 hover:shadow-cyan-500/25 focus:outline-none focus:ring-4 focus:ring-cyan-400/50 text-center transform hover:-translate-y-1"
          aria-label="Join the Reading Circle - Sign up for Sahadhyayi"
        >
          <span className="relative z-10">Join the Reading Circle</span>
        </Link>
      </div>

      {/* Right column: enhanced circuit diagram with all 8 lines visible */}
      <div className="w-full lg:w-3/5 relative min-h-[600px] lg:min-h-screen overflow-visible px-6 md:px-8 lg:px-12 py-8">
        <div className="absolute inset-0 transform lg:-translate-x-[10%]">
          {/* Enhanced SVG with better gradients and all 8 lines */}
          <svg
            viewBox="0 0 100 100"
            className="absolute inset-0 w-full h-full pointer-events-none z-0"
            aria-hidden="true"
            preserveAspectRatio="xMidYMid meet"
            style={{ overflow: 'visible' }}
          >
            <defs>
              {gradientDefs}
              <filter id="glow">
                <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
                <feMerge>
                  <feMergeNode in="coloredBlur"/>
                  <feMergeNode in="SourceGraphic"/>
                </feMerge>
              </filter>
            </defs>
            <g className="lines-group">
              {lines}
            </g>
          </svg>

          {/* Enhanced central hub with pulsing animation */}
          <div className="absolute inset-0 flex items-center justify-center z-10">
            <div className="relative">
              {/* Pulsing outer ring */}
              <div className="absolute inset-0 w-28 h-28 md:w-32 md:h-32 lg:w-36 lg:h-36 rounded-full bg-gradient-to-r from-emerald-400 to-cyan-400 opacity-30 animate-ping"></div>

              {/* Main hub */}
              <div className="relative w-24 h-24 md:w-28 md:h-28 lg:w-32 lg:h-32 rounded-full bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-500 flex items-center justify-center text-white text-base md:text-lg lg:text-xl font-bold shadow-2xl border-4 border-white/20 backdrop-blur-sm transition-all duration-300 hover:scale-105 cursor-default z-20">
                <span className="text-center leading-tight">Sahadhyayi</span>

                {/* Inner glow effect */}
                <div className="absolute inset-2 rounded-full bg-gradient-to-br from-white/20 to-transparent pointer-events-none"></div>
              </div>
            </div>
          </div>

          {/* Enhanced question bubbles with proper positioning - all 8 bubbles */}
          <div className="absolute inset-0 pointer-events-none">
            <div className="relative w-full h-full">
              {bubbles}
            </div>
          </div>

          {/* Floating particles for extra visual appeal */}
          <div className="absolute inset-0 pointer-events-none">
            {[...Array(12)].map((_, i) => (
              <div
                key={i}
                className="absolute w-1 h-1 bg-cyan-400 rounded-full animate-pulse opacity-60"
                style={{
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                  animationDelay: `${Math.random() * 3}s`,
                  animationDuration: `${2 + Math.random() * 2}s`,
                }}
              ></div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SahadhyayiCircuit;
