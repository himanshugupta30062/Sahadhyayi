import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Book,
  Users,
  MessageCircle,
  MapPin,
  Zap,
  Star,
  BookOpen,
  Search,
  UserPlus,
  Share2,
  Heart,
  Globe
} from 'lucide-react';
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from '@/components/ui/tooltip';

/**
 * SahadhyayiCircuit.tsx
 * Modern circuit-style flowchart with right-angle 'wires' and animated current.
 */
const SahadhyayiCircuit: React.FC = () => {
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);

  // Define nodes with organic positions
  const nodes = [
    {
      id: 'library',
      title: 'Digital Library',
      icon: Book,
      position: { x: 28, y: 19 },
      color: 'from-emerald-400 to-teal-500',
      hoverColor: 'from-emerald-300 to-teal-400',
      features: [
        { name: 'Book Reviews & Ratings', icon: Star },
        { name: 'Reading Progress Tracker', icon: BookOpen },
        { name: 'Advanced Search & Filters', icon: Search },
        { name: '10K+ Books Available', icon: Book }
      ]
    },
    {
      id: 'authors',
      title: 'Authors Connect',
      icon: Users,
      position: { x: 72, y: 17 },
      color: 'from-purple-400 to-indigo-500',
      hoverColor: 'from-purple-300 to-indigo-400',
      features: [
        { name: 'Live Author Sessions', icon: MessageCircle },
        { name: 'Q&A with Writers', icon: Users },
        { name: 'Follow Your Favorites', icon: UserPlus },
        { name: '100+ Featured Authors', icon: Users }
      ]
    },
    {
      id: 'social',
      title: 'Social Community',
      icon: MessageCircle,
      position: { x: 20, y: 82 },
      color: 'from-pink-400 to-rose-500',
      hoverColor: 'from-pink-300 to-rose-400',
      features: [
        { name: 'Reading Feed & Updates', icon: Share2 },
        { name: 'Friends Chat & Groups', icon: MessageCircle },
        { name: 'Like, Share & Comment', icon: Heart },
        { name: '5K+ Active Readers', icon: Users }
      ]
    },
    {
      id: 'map',
      title: 'Reader Map',
      icon: MapPin,
      position: { x: 78, y: 79 },
      color: 'from-orange-400 to-amber-500',
      hoverColor: 'from-orange-300 to-amber-400',
      features: [
        { name: 'Global Reader Network', icon: Globe },
        { name: 'Find Local Book Clubs', icon: MapPin },
        { name: 'Reading Groups Nearby', icon: Users },
        { name: '50+ Countries Connected', icon: Globe }
      ]
    }
  ];

  // Create right-angle wires: hub -> vertical -> horizontal -> node
  const createCircuitPath = (node: typeof nodes[0]) => {
    const cx = 50;
    const cy = 50;
    const nx = node.position.x;
    const ny = node.position.y;
    const offset = 5; // percent offset to connect at box edge
    const entryY = ny > cy ? ny - offset : ny + offset;
    const entryX = nx > cx ? nx - offset : nx + offset;
    return `M ${cx}% ${cy}% L ${cx}% ${entryY}% L ${entryX}% ${entryY}% L ${nx}% ${ny}%`;
  };

  return (
    <TooltipProvider>
      <div className="w-full min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 relative overflow-hidden">
        {/* Circuit Grid Background */}
        <div className="absolute inset-0 opacity-20">
          <svg width="100%" height="100%" className="absolute inset-0">
            <defs>
              <pattern id="circuit-grid" x="0" y="0" width="80" height="80" patternUnits="userSpaceOnUse">
                <circle cx="40" cy="40" r="2" fill="currentColor" className="text-cyan-500/30" />
                <line x1="0" y1="40" x2="80" y2="40" stroke="currentColor" strokeWidth="1" className="text-cyan-500/20" />
                <line x1="40" y1="0" x2="40" y2="80" stroke="currentColor" strokeWidth="1" className="text-cyan-500/20" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#circuit-grid)" />
          </svg>
        </div>

        <div className="relative z-10 py-16 px-4">
          {/* Header */}
          <div className="text-center mb-16">
            <h2 className="text-5xl font-bold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent mb-4">
              Discover What Sahadhyayi Offers
            </h2>
            <p className="text-lg text-blue-200 mx-auto max-w-2xl">
              Explore the standout features designed to enhance your reading and community engagement journey.
            </p>
          </div>

          {/* Circuit Canvas */}
          <div className="relative w-full h-[700px] max-w-6xl mx-auto">
            {/* Animated current video background */}
            <video
              className="absolute inset-0 w-full h-full object-cover pointer-events-none opacity-60"
              autoPlay
              loop
              muted
              playsInline
              src="https://quantel.in/wp-content/uploads/2024/10/Sequence-01_2.mp4"
            />

            {/* Circuit Wires with Animated Current */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 1 }}>
              <defs>
                <linearGradient id="wireGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#22d3ee" stopOpacity="0.8" />
                  <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.8" />
                </linearGradient>
                <filter id="wireGlow">
                  <feGaussianBlur stdDeviation="2" result="coloredBlur" />
                  <feMerge>
                    <feMergeNode in="coloredBlur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>
              {nodes.map(node => (
                <path
                  key={node.id}
                  d={createCircuitPath(node)}
                  fill="none"
                  stroke="url(#wireGradient)"
                  strokeWidth="4"
                  strokeLinecap="round"
                  filter="url(#wireGlow)"
                  className={`opacity-70 transition-opacity duration-300 ${hoveredNode===node.id? 'opacity-100':''}`}
                  strokeDasharray="10,6"
                  style={{ animation: 'dashFlow 3s linear infinite' }}
                />
              ))}
            </svg>

            {/* Central Hub */}
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-20">
              <div className="relative">
                {/* Glow Rings */}
                <div className="absolute inset-0 rounded-full bg-gradient-to-br from-cyan-300 to-blue-500 blur-3xl opacity-50 animate-pulse"></div>
                <div className="absolute inset-0 rounded-full bg-gradient-to-br from-cyan-400 to-blue-600 blur-xl opacity-70 animate-pulse"></div>
                {/* Hub Circle */}
                <div className="relative w-36 h-36 rounded-full bg-gradient-to-br from-cyan-400 to-indigo-600 flex items-center justify-center shadow-2xl border-2 border-cyan-300/40">
                  <Zap className="w-20 h-20 text-white animate-pulse" />
                </div>
                {/* Hub Label */}
                <div className="absolute -bottom-10 left-1/2 transform -translate-x-1/2">
                  <h3 className="text-2xl font-bold text-white shimmer-text">
                    Sahadhyayi Hub
                  </h3>
                </div>
              </div>
            </div>

            {/* Feature Nodes */}
            {nodes.map((node, idx) => {
              const IconComp = node.icon;
              const isHovered = hoveredNode === node.id;
              return (
                <Tooltip key={node.id}>
                  <TooltipTrigger asChild>
                    <motion.div
                      initial={{ opacity: 0, scale: 0.7, y: 30 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      transition={{ delay: idx*0.2, type: 'spring', stiffness: 80, damping: 20 }}
                      className="absolute cursor-pointer z-10" style={{ left:`${node.position.x}%`, top:`${node.position.y}%`, transform:'translate(-50%, -50%)'
