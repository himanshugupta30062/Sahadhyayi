
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
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

const SahadhyayiCircuit: React.FC = () => {
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);

  const nodes = [
    {
      id: 'library',
      title: 'Digital Library',
      icon: Book,
      position: { x: 25, y: 20 },
      angle: 225,
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
      position: { x: 75, y: 20 },
      angle: 315,
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
      position: { x: 25, y: 80 },
      angle: 135,
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
      position: { x: 75, y: 80 },
      angle: 45,
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
    const controlX = centerX + (nodeX - centerX) * 0.3;
    const controlY = centerY + (nodeY - centerY) * 0.3;

    return `M ${centerX}% ${centerY}% Q ${controlX}% ${controlY}% ${nodeX}% ${nodeY}%`;
  };

  return (
    <TooltipProvider>
      <div className="w-full min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 relative overflow-hidden">
        {/* Enhanced Circuit Background */}
        <div className="absolute inset-0 opacity-30">
          <div className="absolute inset-0 bg-gradient-to-br from-cyan-400/20 to-blue-600/20"></div>
          <svg width="100%" height="100%" className="absolute inset-0">
            <defs>
              <pattern id="circuit-grid" x="0" y="0" width="80" height="80" patternUnits="userSpaceOnUse">
                <circle cx="40" cy="40" r="2" fill="currentColor" className="text-cyan-400/40 animate-pulse"/>
                <line x1="0" y1="40" x2="80" y2="40" stroke="currentColor" strokeWidth="1" className="text-cyan-400/30"/>
                <line x1="40" y1="0" x2="40" y2="80" stroke="currentColor" strokeWidth="1" className="text-cyan-400/30"/>
                <circle cx="40" cy="40" r="20" fill="none" stroke="currentColor" strokeWidth="0.5" className="text-cyan-400/20"/>
              </pattern>
              <filter id="circuit-glow">
                <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
                <feMerge> 
                  <feMergeNode in="coloredBlur"/>
                  <feMergeNode in="SourceGraphic"/>
                </feMerge>
              </filter>
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

          <div className="relative w-full h-[700px] max-w-6xl mx-auto">
            {/* Enhanced Connection Lines */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 1 }}>
              <defs>
                <linearGradient id="connectionGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#22d3ee" stopOpacity="0.8" />
                  <stop offset="50%" stopColor="#3b82f6" stopOpacity="0.9" />
                  <stop offset="100%" stopColor="#6366f1" stopOpacity="0.7" />
                </linearGradient>
                <filter id="connection-glow">
                  <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
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
                    strokeWidth="3"
                    filter="url(#connection-glow)"
                    className={`transition-all duration-700 ${
                      hoveredNode === node.id ? 'opacity-100 drop-shadow-lg' : 'opacity-70'
                    }`}
                    style={{
                      animation: 'dashFlow 4s linear infinite'
                    }}
                    strokeDasharray="12,8"
                  />
                </g>
              ))}
            </svg>

            {/* Central Glowing Hub - Enhanced */}
            <div 
              className="absolute transform -translate-x-1/2 -translate-y-1/2 z-20"
              style={{ 
                top: '50%', 
                left: '50%' 
              }}
            >
              <div className="relative">
                {/* Outer glow rings */}
                <div className="absolute inset-0 bg-gradient-to-br from-cyan-300 to-blue-500 rounded-full blur-2xl opacity-40 animate-pulse scale-150"></div>
                <div className="absolute inset-0 bg-gradient-to-br from-cyan-400 to-blue-600 rounded-full blur-xl opacity-60 animate-pulse scale-125"></div>
                
                {/* Main hub */}
                <div className="relative bg-gradient-to-br from-cyan-400 via-blue-500 to-indigo-600 rounded-full w-36 h-36 flex items-center justify-center shadow-2xl border-2 border-cyan-300/40 backdrop-blur-sm">
                  <div className="absolute inset-2 bg-gradient-to-br from-white/20 to-transparent rounded-full"></div>
                  <Zap className="w-20 h-20 text-white drop-shadow-2xl animate-pulse relative z-10" />
                </div>
                
                <div className="absolute -bottom-10 left-1/2 transform -translate-x-1/2 whitespace-nowrap">
                  <h3 className="text-2xl font-bold text-white text-center bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent drop-shadow-lg">
                    Sahadhyayi Hub
                  </h3>
                </div>
              </div>
            </div>

            {/* Floating Feature Nodes - Enhanced */}
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
                      <div className={`relative transition-all duration-500 ease-out ${
                        isHovered ? 'scale-110 -translate-y-2' : 'scale-100'
                      }`}>
                        {/* Node glow effect */}
                        <div className={`absolute inset-0 bg-gradient-to-br ${node.color} rounded-3xl blur-lg transition-all duration-500 ${
                          isHovered ? 'opacity-80 scale-110' : 'opacity-50 scale-100'
                        }`}></div>
                        
                        {/* Outer ring */}
                        <div className={`absolute inset-0 bg-gradient-to-br ${node.color} rounded-3xl opacity-30 scale-110 animate-pulse`}></div>
                        
                        {/* Node Content */}
                        <div className={`relative bg-white/95 backdrop-blur-md rounded-3xl p-6 shadow-2xl border border-white/30 transition-all duration-500 min-w-[140px] ${
                          isHovered ? 'bg-white shadow-cyan-500/25 shadow-2xl border-cyan-300/50' : ''
                        }`}>
                          <div className="flex flex-col items-center text-center space-y-3">
                            <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${isHovered ? node.hoverColor : node.color} flex items-center justify-center shadow-xl transition-all duration-500 ${
                              isHovered ? 'scale-110 shadow-2xl' : ''
                            }`}>
                              <IconComponent className="w-7 h-7 text-white drop-shadow-lg" />
                            </div>
                            <div>
                              <h3 className="font-bold text-gray-800 text-sm leading-tight tracking-wide">{node.title}</h3>
                            </div>
                          </div>
                        </div>

                        {/* Floating particles effect */}
                        {isHovered && (
                          <div className="absolute inset-0 pointer-events-none">
                            <div className="absolute top-1/2 left-1/2 w-1 h-1 bg-cyan-400 rounded-full animate-ping opacity-60" style={{transform: 'translate(-50%, -50%) translate(20px, -20px)'}}></div>
                            <div className="absolute top-1/2 left-1/2 w-1 h-1 bg-blue-400 rounded-full animate-ping opacity-60" style={{transform: 'translate(-50%, -50%) translate(-25px, 15px)', animationDelay: '0.5s'}}></div>
                            <div className="absolute top-1/2 left-1/2 w-1 h-1 bg-indigo-400 rounded-full animate-ping opacity-60" style={{transform: 'translate(-50%, -50%) translate(30px, 25px)', animationDelay: '1s'}}></div>
                          </div>
                        )}
                      </div>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent side="top" className="max-w-xs p-6 bg-white/98 backdrop-blur-md border-2 border-gradient-to-r from-cyan-200 to-blue-200 shadow-2xl rounded-2xl">
                    <div className="space-y-4">
                      <h4 className="font-bold text-gray-900 flex items-center gap-3 text-lg">
                        <IconComponent className="w-5 h-5" />
                        {node.title}
                      </h4>
                      <div className="space-y-3">
                        {node.features.map((feature, index) => {
                          const FeatureIcon = feature.icon;
                          return (
                            <div key={index} className="flex items-center gap-3 text-sm text-gray-700 hover:text-gray-900 transition-colors">
                              <FeatureIcon className="w-4 h-4 text-gray-500 flex-shrink-0" />
                              <span className="font-medium">{feature.name}</span>
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

          {/* Enhanced Call to Action */}
          <div className="text-center mt-20">
            <div className="inline-flex items-center justify-center px-10 py-4 bg-gradient-to-r from-cyan-500 via-blue-500 to-indigo-600 text-white font-bold text-lg rounded-full shadow-2xl hover:shadow-cyan-500/25 hover:shadow-2xl hover:scale-105 transition-all duration-300 cursor-pointer border border-cyan-300/30 backdrop-blur-sm">
              <Zap className="w-6 h-6 mr-3 animate-pulse" />
              Explore the Circuit
              <div className="absolute inset-0 bg-gradient-to-r from-cyan-400/20 to-blue-400/20 rounded-full blur-xl -z-10"></div>
            </div>
          </div>
        </div>

        <style>
          {`
            @keyframes dashFlow {
              0% { stroke-dashoffset: 0; }
              100% { stroke-dashoffset: -40; }
            }
          `}
        </style>
      </div>
    </TooltipProvider>
  );
};

export default SahadhyayiCircuit;
