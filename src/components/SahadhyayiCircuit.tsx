import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  BookOpen,
  Users,
  Globe,
  MessageCircle,
  MapPin,
  Zap
} from 'lucide-react';
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider
} from '@/components/ui/tooltip';

/**
 * Global CSS Keyframes (to add in your stylesheet):
 *
 * @keyframes dashFlow {
 *   /* Animate stroke dash offset for moving dash effect */
 *   to { stroke-dashoffset: 1000; }
 * }
 *
 * /* Animates the grid wires to simulate flowing current */
 * @keyframes electricSpark {
 *   0%, 100% { opacity: 1; }
 *   50% { opacity: 0.2; }
 * }
 */

/**
 * createCircuitPath()
 * --------------------
 * Generates a right-angle SVG path from the central hub (50%, 50%)
 * to the target node coordinates. Uses an offset so the line exits
 * the hub just outside its radius and then travels horizontal/vertical
 * before final diagonal.
 */
const createCircuitPath = (node: { position: { x: number; y: number } }) => {
  const cx = 50; // central x-coordinate percent
  const cy = 50; // central y-coordinate percent
  const nx = node.position.x; // node x-coordinate percent
  const ny = node.position.y; // node y-coordinate percent
  const offset = 5; // offset percent to avoid overlapping hub

  // Determine entry point on vertical axis
  const entryY = ny > cy ? ny - offset : ny + offset;
  // Determine entry point on horizontal axis
  const entryX = nx > cx ? nx - offset : nx + offset;

  // Construct an SVG move ('M') and line ('L') path: center -> vertical -> horizontal -> node
  return `M ${cx}% ${cy}% L ${cx}% ${entryY}% L ${entryX}% ${entryY}% L ${nx}% ${ny}%`;
};

/**
 * SahadhyayiCircuit
 * -----------------
 * Renders the animated circuit diagram: background video loop,
 * grid pattern, dynamic wires, central symbol, and interactive nodes.
 */
const SahadhyayiCircuit: React.FC = () => {
  // Track which node is hovered to adjust opacity of wires
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);

  /**
   * nodes[]
   * -------
   * Each node represents a user question/bubble. Includes:
   * - id: unique key
   * - title: bubble label and tooltip content
   * - icon: Lucide icon component
   * - position: x/y coordinates as percent
   * - color & hoverColor: Tailwind gradient classes
   */
  const nodes = [
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
      title: 'Who’s reading the same book nearby and connect?',
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
  ];

  return (
    <TooltipProvider>
      {/* Container: full screen, dark background */}
      <div className="relative w-full h-screen bg-black overflow-hidden">

        {/* 1) Background Video */}
        <video
          className="
            absolute inset-0 w-full h-full object-cover
            filter brightness-40 contrast-120
            pointer-events-none
          "
          src="https://quantel.in/wp-content/uploads/2024/10/Sequence-01_2.mp4"
          autoPlay loop muted playsInline
        />

        {/* 2) SVG: Grid, Connections, and Wires */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none">
          <defs>
            {/* Grid pattern: dots and crosshairs */}
            <pattern id="circuit-grid" x="0" y="0" width="80" height="80" patternUnits="userSpaceOnUse">
              <circle cx="40" cy="40" r="2" fill="currentColor" className="text-cyan-600/20" />
              <line x1="0" y1="40" x2="80" y2="40" stroke="currentColor" strokeWidth="1" className="text-cyan-600/10" />
              <line x1="40" y1="0" x2="40" y2="80" stroke="currentColor" strokeWidth="1" className="text-cyan-600/10" />
            </pattern>
            {/* Gradient for wires */}
            <linearGradient id="wireGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#22d3ee" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.8" />
            </linearGradient>
            {/* Glow filter for neon effect */}
            <filter id="glow">
              <feGaussianBlur stdDeviation="3" result="coloredBlur" />
              <feMerge>
                <feMergeNode in="coloredBlur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Render grid background */}
          <rect width="100%" height="100%" fill="url(#circuit-grid)" />

          {/* Direct linear connections from center */}
          {nodes.map(node => (
            <line
              key={`conn-${node.id}`} // unique key
              x1="50%" y1="50%"        // start at hub center
              x2={`${node.position.x}%`} // end at node x
              y2={`${node.position.y}%`}  // end at node y
              stroke="url(#wireGrad)"
              strokeWidth="2"
              strokeLinecap="round"
              filter="url(#glow)"
              strokeDasharray="6 4"
              style={{ animation: 'dashFlow 4s linear infinite' }}
              className={`opacity-40 transition-opacity ${hoveredNode===node.id?'opacity-100':''}`}
            />
          ))}

          {/* Right-angle wires */}
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
              style={{ animation: 'dashFlow 4s linear infinite' }}
              className={`opacity-60 transition-opacity ${hoveredNode===node.id?'opacity-100':''}`}
            />
          ))}
        </svg>

        {/* 3) Central Hub: Symbol and Glow */}
        <div className="
             absolute top-1/2 left-1/2
             -translate-x-1/2 -translate-y-1/2
             z-30 flex items-center justify-center
           ">
          {/* Outer glow ring */}
          <div className="absolute w-56 h-56 rounded-full bg-gradient-to-br from-emerald-500 to-teal-400 blur-2xl opacity-40 animate-pulse" />
          {/* Inner glow ring */}
          <div className="absolute w-48 h-48 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 blur-xl opacity-60 animate-pulse" />
          {/* Sahadhyayi Logo */}
          <img
            src="/assets/sahadhyayi-symbol.svg"
            alt="Sahadhyayi Symbol"
            className="relative w-32 h-32 object-contain z-40"
          />
        </div>

        {/* 4) Interactive Nodes: Motion, Hover & Tooltip */}
        {nodes.map((node, i) => {
          const Icon = node.icon;
          return (
            <Tooltip key={node.id}>
              <TooltipTrigger asChild>
                <motion.div
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.15 }} // staggered animation
                  onHoverStart={() => setHoveredNode(node.id)}
                  onHoverEnd={() => setHoveredNode(null)}
                  className="absolute z-40 cursor-pointer"
                  style={{
                    left: `${node.position.x}%`,
                    top: `${node.position.y}%`,
                    transform: 'translate(-50%, -50%)'
                  }}
                >
                  {/* Node bubble with gradient background */}
                  <div className={`
                    p-3 rounded-xl bg-gradient-to-br
                    ${hoveredNode===node.id ? node.hoverColor : node.color}
                    text-white shadow-lg flex items-center space-x-2
                  `}>
                    <Icon className="w-6 h-6" />
                    <span className="whitespace-nowrap text-sm">{node.title}</span>
                  </div>
                </motion.div>
              </TooltipTrigger>
              <TooltipContent side="top">
                <p className="max-w-xs text-center">{node.title}</p>
              </TooltipContent>
            </Tooltip>
          );
        })}
      </div>
    </TooltipProvider>
  );
};

export default SahadhyayiCircuit;
