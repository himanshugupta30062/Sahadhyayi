
import React, { useState, useMemo } from 'react';
import { BookOpen, Users, Globe, MessageCircle, MapPin, Zap } from 'lucide-react';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';

/**
 * Right-angle path from center (50%,50%) to node.
 */
const createCircuitPath = (node: { position: { x: number; y: number } }) => {
  const cx = 50, cy = 50;
  const { x: nx, y: ny } = node.position;
  const offset = 5;
  const entryY = ny > cy ? ny - offset : ny + offset;
  const entryX = nx > cx ? nx - offset : nx + offset;
  return `M ${cx}% ${cy}% L ${cx}% ${entryY}% L ${entryX}% ${entryY}% L ${nx}% ${ny}%`;
};

const SahadhyayiCircuit: React.FC = () => {
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);

  const nodes = useMemo(() => [
    { 
      id: 'designBooks', 
      title: 'Want to design your own version of a book?', 
      icon: BookOpen, 
      position: { x: 50, y: 10 }, 
      color: 'from-emerald-400 to-teal-500', 
      hoverColor: 'from-emerald-300 to-teal-400' 
    },
    { 
      id: 'nearbyReaders', 
      title: 'Who\'s reading the same book nearby and connect?', 
      icon: Users, 
      position: { x: 85, y: 30 }, 
      color: 'from-purple-400 to-indigo-500', 
      hoverColor: 'from-purple-300 to-indigo-400' 
    },
    { 
      id: 'authorInfo', 
      title: 'Want to know about authors and the books they published?', 
      icon: Globe, 
      position: { x: 85, y: 70 }, 
      color: 'from-pink-400 to-rose-500', 
      hoverColor: 'from-pink-300 to-rose-400' 
    },
    { 
      id: 'chatFriends', 
      title: 'Want to talk to book friends online?', 
      icon: MessageCircle, 
      position: { x: 50, y: 90 }, 
      color: 'from-orange-400 to-amber-500', 
      hoverColor: 'from-orange-300 to-amber-400' 
    },
    { 
      id: 'readerMap', 
      title: 'Explore where fellow readers are on the map!', 
      icon: MapPin, 
      position: { x: 15, y: 70 }, 
      color: 'from-yellow-400 to-lime-500', 
      hoverColor: 'from-yellow-300 to-lime-400' 
    },
    { 
      id: 'trackProgress', 
      title: 'Want to track your overall reading progress?', 
      icon: Zap, 
      position: { x: 15, y: 30 }, 
      color: 'from-cyan-400 to-blue-500', 
      hoverColor: 'from-cyan-300 to-blue-400' 
    }
  ], []);

  return (
    <div className="relative w-full h-screen bg-black overflow-hidden">
      <style>
        {`
          @keyframes dashFlow {
            0% { stroke-dashoffset: 0; }
            100% { stroke-dashoffset: -20; }
          }
          @keyframes electricSpark {
            0%, 100% { opacity: 0.3; transform: scale(1); }
            50% { opacity: 0.8; transform: scale(1.1); }
          }
          .animate-electricSpark {
            animation: electricSpark 2s ease-in-out infinite;
          }
        `}
      </style>
      
      <svg className="absolute inset-0 w-full h-full pointer-events-none">
        <defs>
          <pattern id="circuit-grid" x="0" y="0" width="80" height="80" patternUnits="userSpaceOnUse">
            <circle cx="40" cy="40" r="2" fill="currentColor" className="text-cyan-600/20" />
            <line x1="0" y1="40" x2="80" y2="40" stroke="currentColor" strokeWidth="1" className="text-cyan-600/10" />
            <line x1="40" y1="0" x2="40" y2="80" stroke="currentColor" strokeWidth="1" className="text-cyan-600/10" />
          </pattern>
          <linearGradient id="wireGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#22d3ee" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.8" />
          </linearGradient>
          <filter id="glow">
            <feGaussianBlur stdDeviation="3" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        <rect width="100%" height="100%" fill="url(#circuit-grid)" />

        {/* Animated rings around center */}
        {[35, 45, 55].map((r, i) => (
          <circle
            key={i}
            cx="50%"
            cy="50%"
            r={`${r}%`}
            fill="none"
            stroke="url(#wireGrad)"
            strokeWidth="2"
            filter="url(#glow)"
            className="opacity-30 transform origin-center animate-spin"
            style={{ animationDuration: `${60 - i * 20}s` }}
          />
        ))}

        {/* Electric spark at center */}
        <circle
          cx="50%"
          cy="50%"
          r="8%"
          stroke="#00FFF0"
          strokeWidth="1"
          fill="none"
          filter="url(#glow)"
          className="opacity-50 animate-electricSpark"
        />

        {/* Straight lines to nodes */}
        {nodes.map(node => (
          <line
            key={`conn-${node.id}`}
            x1="50%" y1="50%" x2={`${node.position.x}%`} y2={`${node.position.y}%`} 
            stroke="url(#wireGrad)" strokeWidth="2" strokeLinecap="round"
            filter="url(#glow)" strokeDasharray="6 4"
            className={`transition-opacity ${hoveredNode===node.id ? 'opacity-100' : 'opacity-40'}`} 
            style={{ animation: 'dashFlow 4s linear infinite' }}
          />
        ))}

        {/* Right-angle connections to nodes */}
        {nodes.map(node => (
          <path
            key={node.id}
            d={createCircuitPath(node)}
            fill="none"
            stroke="url(#wireGrad)"
            strokeWidth="3"
            strokeLinecap="round"
            filter="url(#glow)"
            strokeDasharray="8 6"
            className={`transition-opacity ${hoveredNode===node.id ? 'opacity-100' : 'opacity-60'}`}
            style={{ animation: 'dashFlow 4s linear infinite' }}
          />
        ))}
      </svg>

      {/* Central hub */}
      <div className="absolute inset-0 flex items-center justify-center z-30">
        <div className="absolute w-56 h-56 rounded-full bg-gradient-to-br from-emerald-500 to-teal-400 blur-2xl opacity-40 animate-pulse" />
        <div className="absolute w-48 h-48 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 blur-xl opacity-60 animate-pulse" />
        <img
          src="/assets/sahadhyayi-symbol.svg"
          alt="Sahadhyayi Symbol"
          className="relative w-32 h-32 object-contain z-40"
        />
      </div>

      {/* Interactive nodes */}
      {nodes.map((node, i) => {
        const Icon = node.icon;
        return (
          <Tooltip key={node.id}>
            <TooltipTrigger asChild>
              <div
                onMouseEnter={() => setHoveredNode(node.id)}
                onMouseLeave={() => setHoveredNode(null)}
                className="absolute z-40 cursor-pointer transition-transform duration-200 hover:scale-110"
                style={{ left: `${node.position.x}%`, top: `${node.position.y}%`, transform: 'translate(-50%, -50%)' }}
              >
                <div className={`p-3 rounded-xl bg-gradient-to-br ${hoveredNode===node.id? node.hoverColor : node.color} text-white shadow-lg flex items-center space-x-2`}>
                  <Icon className="w-6 h-6" />
                  <span className="whitespace-nowrap text-sm">{node.title}</span>
                </div>
              </div>
            </TooltipTrigger>
            <TooltipContent side="top">
              <p className="max-w-xs text-center">{node.title}</p>
            </TooltipContent>
          </Tooltip>
        );
      })}
    </div>
  );
};

export default SahadhyayiCircuit;
