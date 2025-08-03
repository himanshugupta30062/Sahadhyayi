
import React, { useState } from 'react';
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
} from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

const SahadhyayiCircuit: React.FC = () => {
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);

  const nodes = [
    {
      id: 'library',
      title: 'Digital Library',
      icon: Book,
      position: { x: 30, y: 25 },
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
      position: { x: 70, y: 25 },
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
      position: { x: 30, y: 75 },
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
      position: { x: 70, y: 75 },
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

  const createCurvedPath = (node: typeof nodes[0]) => {
    const centerX = 50;
    const centerY = 50;
    const nodeX = node.position.x;
    const nodeY = node.position.y;

    // Create a curved path using quadratic bezier
    const controlX = centerX + (nodeX - centerX) * 0.4;
    const controlY = centerY + (nodeY - centerY) * 0.4;

    return `M ${centerX}% ${centerY}% Q ${controlX}% ${controlY}% ${nodeX}% ${nodeY}%`;
  };

  return (
    <div className="w-full min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 relative overflow-hidden">
      {/* Enhanced Circuit Background */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute inset-0 bg-gradient-to-br from-cyan-400/10 to-blue-600/10"></div>
        <svg width="100%" height="100%" className="absolute inset-0">
          <defs>
            <pattern id="circuit-grid" x="0" y="0" width="60" height="60" patternUnits="userSpaceOnUse">
              <circle cx="30" cy="30" r="1.5" fill="currentColor" className="text-cyan-400/30 animate-pulse"/>
              <line x1="0" y1="30" x2="60" y2="30" stroke="currentColor" strokeWidth="0.5" className="text-cyan-400/20"/>
              <line x1="30" y1="0" x2="30" y2="60" stroke="currentColor" strokeWidth="0.5" className="text-cyan-400/20"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#circuit-grid)"/>
        </svg>
      </div>

      <div className="relative z-10 py-16 px-4">
        <div className="text-center mb-16">
          <h2 className="text-5xl font-bold text-white mb-6 bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
            Sahadhyayi Circuit
          </h2>
          <p className="text-xl text-blue-200 max-w-2xl mx-auto">
            Your interconnected digital reading ecosystem where every connection enhances your literary journey
          </p>
        </div>

        <div className="relative w-full h-[600px] max-w-5xl mx-auto">
          {/* SVG Connection Lines */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 1 }}>
            <defs>
              <linearGradient id="connectionGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#22d3ee" stopOpacity="0.8" />
                <stop offset="50%" stopColor="#3b82f6" stopOpacity="0.9" />
                <stop offset="100%" stopColor="#6366f1" stopOpacity="0.6" />
              </linearGradient>
              <filter id="connection-glow">
                <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
                <feMerge> 
                  <feMergeNode in="coloredBlur"/>
                  <feMergeNode in="SourceGraphic"/>
                </feMerge>
              </filter>
            </defs>
            {nodes.map((node) => (
              <g key={`connection-${node.id}`}>
                <path
                  d={createCurvedPath(node)}
                  fill="none"
                  stroke="url(#connectionGradient)"
                  strokeWidth="2"
                  filter="url(#connection-glow)"
                  className={`transition-all duration-500 ${
                    hoveredNode === node.id ? 'opacity-100' : 'opacity-60'
                  }`}
                  strokeDasharray="8,4"
                  style={{
                    animation: 'dashFlow 3s linear infinite'
                  }}
                />
              </g>
            ))}
          </svg>

          {/* Central Glowing Hub */}
          <div 
            className="absolute transform -translate-x-1/2 -translate-y-1/2 z-20"
            style={{ 
              top: '50%', 
              left: '50%' 
            }}
          >
            <div className="relative">
              {/* Outer glow rings */}
              <div className="absolute inset-0 bg-gradient-to-br from-cyan-400/30 to-blue-500/30 rounded-full blur-2xl animate-pulse scale-150"></div>
              <div className="absolute inset-0 bg-gradient-to-br from-cyan-400/40 to-blue-600/40 rounded-full blur-xl animate-pulse scale-125"></div>
              
              {/* Main hub */}
              <div className="relative bg-gradient-to-br from-cyan-400 via-blue-500 to-indigo-600 rounded-full w-32 h-32 flex items-center justify-center shadow-2xl border-2 border-cyan-300/40">
                <div className="absolute inset-2 bg-gradient-to-br from-white/20 to-transparent rounded-full"></div>
                <Zap className="w-16 h-16 text-white drop-shadow-2xl animate-pulse relative z-10" />
              </div>
              
              <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 whitespace-nowrap">
                <h3 className="text-xl font-bold text-white text-center bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
                  Sahadhyayi Hub
                </h3>
              </div>
            </div>
          </div>

          {/* Floating Feature Nodes */}
          {nodes.map((node) => {
            const IconComponent = node.icon;
            const isHovered = hoveredNode === node.id;
            
            return (
              <Tooltip key={node.id}>
                <TooltipTrigger asChild>
                  <div
                    className="absolute transform -translate-x-1/2 -translate-y-1/2 z-10 cursor-pointer group"
                    style={{
                      left: `${node.position.x}%`,
                      top: `${node.position.y}%`,
                    }}
                    onMouseEnter={() => setHoveredNode(node.id)}
                    onMouseLeave={() => setHoveredNode(null)}
                  >
                    <div className={`relative transition-all duration-300 ease-out ${
                      isHovered ? 'scale-110 -translate-y-1' : 'scale-100'
                    }`}>
                      {/* Node glow effect */}
                      <div className={`absolute inset-0 bg-gradient-to-br ${node.color} rounded-2xl blur-md transition-all duration-300 ${
                        isHovered ? 'opacity-60 scale-105' : 'opacity-40'
                      }`}></div>
                      
                      {/* Node Content */}
                      <div className={`relative bg-white/95 backdrop-blur-sm rounded-2xl p-4 shadow-lg border border-white/20 transition-all duration-300 min-w-[120px] ${
                        isHovered ? 'bg-white shadow-cyan-200/50 shadow-xl border-cyan-200/40' : ''
                      }`}>
                        <div className="flex flex-col items-center text-center space-y-2">
                          <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${isHovered ? node.hoverColor : node.color} flex items-center justify-center shadow-md transition-all duration-300 ${
                            isHovered ? 'scale-105 shadow-lg' : ''
                          }`}>
                            <IconComponent className="w-6 h-6 text-white drop-shadow" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-gray-800 text-xs leading-tight">{node.title}</h3>
                          </div>
                        </div>
                      </div>

                      {/* Floating particles effect */}
                      {isHovered && (
                        <div className="absolute inset-0 pointer-events-none">
                          <div className="absolute top-1/2 left-1/2 w-1 h-1 bg-cyan-400 rounded-full animate-ping opacity-40" style={{transform: 'translate(-50%, -50%) translate(15px, -15px)'}}></div>
                          <div className="absolute top-1/2 left-1/2 w-1 h-1 bg-blue-400 rounded-full animate-ping opacity-40" style={{transform: 'translate(-50%, -50%) translate(-20px, 10px)', animationDelay: '0.3s'}}></div>
                          <div className="absolute top-1/2 left-1/2 w-1 h-1 bg-indigo-400 rounded-full animate-ping opacity-40" style={{transform: 'translate(-50%, -50%) translate(20px, 20px)', animationDelay: '0.6s'}}></div>
                        </div>
                      )}
                    </div>
                  </div>
                </TooltipTrigger>
                <TooltipContent side="top" className="max-w-xs p-4 bg-white/96 backdrop-blur-sm border border-gray-200 shadow-xl rounded-xl">
                  <div className="space-y-3">
                    <h4 className="font-bold text-gray-900 flex items-center gap-2 text-base">
                      <IconComponent className="w-4 h-4" />
                      {node.title}
                    </h4>
                    <div className="space-y-2">
                      {node.features.map((feature, index) => {
                        const FeatureIcon = feature.icon;
                        return (
                          <div key={index} className="flex items-center gap-2 text-sm text-gray-700">
                            <FeatureIcon className="w-3 h-3 text-gray-500 flex-shrink-0" />
                            <span>{feature.name}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </TooltipContent>
              </Tooltip>
            );
          })}
        </div>

        {/* Call to Action */}
        <div className="text-center mt-16">
          <div className="inline-flex items-center justify-center px-8 py-3 bg-gradient-to-r from-cyan-500 via-blue-500 to-indigo-600 text-white font-semibold text-base rounded-full shadow-xl hover:shadow-cyan-400/25 hover:shadow-2xl hover:scale-105 transition-all duration-300 cursor-pointer border border-cyan-300/30">
            <Zap className="w-5 h-5 mr-2 animate-pulse" />
            Explore the Circuit
          </div>
        </div>
      </div>

      <style>
        {`
          @keyframes dashFlow {
            0% { stroke-dashoffset: 0; }
            100% { stroke-dashoffset: -24; }
          }
        `}
      </style>
    </div>
  );
};

export default SahadhyayiCircuit;
