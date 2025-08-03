
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
      position: { top: '15%', left: '20%' },
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
      position: { top: '15%', right: '20%' },
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
      position: { bottom: '15%', left: '20%' },
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
      position: { bottom: '15%', right: '20%' },
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
    
    let nodeX, nodeY;
    if (node.position.left) {
      nodeX = parseFloat(node.position.left);
      nodeY = node.position.top ? parseFloat(node.position.top) : (100 - parseFloat(node.position.bottom!));
    } else {
      nodeX = 100 - parseFloat(node.position.right!);
      nodeY = node.position.top ? parseFloat(node.position.top) : (100 - parseFloat(node.position.bottom!));
    }

    // Add some curve to the path
    const controlX = (centerX + nodeX) / 2 + (Math.random() - 0.5) * 10;
    const controlY = (centerY + nodeY) / 2 + (Math.random() - 0.5) * 10;

    return `M ${centerX}% ${centerY}% Q ${controlX}% ${controlY}% ${nodeX}% ${nodeY}%`;
  };

  return (
    <TooltipProvider>
      <div className="w-full min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 relative overflow-hidden">
        {/* Animated Circuit Background */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute inset-0 bg-gradient-to-br from-cyan-400/10 to-blue-600/10"></div>
          <svg width="100%" height="100%" className="absolute inset-0">
            <defs>
              <pattern id="circuit-grid" x="0" y="0" width="60" height="60" patternUnits="userSpaceOnUse">
                <circle cx="30" cy="30" r="1" fill="currentColor" className="text-cyan-400/30"/>
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

          <div className="relative w-full h-[600px] max-w-6xl mx-auto">
            {/* Connection Lines */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 1 }}>
              <defs>
                <filter id="glow">
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
                    strokeWidth="2"
                    filter="url(#glow)"
                    className={`transition-all duration-500 ${
                      hoveredNode === node.id ? 'opacity-100' : 'opacity-60'
                    }`}
                    style={{
                      animation: 'dashFlow 3s linear infinite'
                    }}
                    strokeDasharray="8,4"
                  />
                </g>
              ))}
              <defs>
                <linearGradient id="connectionGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#22d3ee" />
                  <stop offset="50%" stopColor="#3b82f6" />
                  <stop offset="100%" stopColor="#6366f1" />
                </linearGradient>
              </defs>
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
                <div className="absolute inset-0 bg-gradient-to-br from-cyan-400 to-blue-600 rounded-full blur-xl opacity-60 animate-pulse"></div>
                <div className="relative bg-gradient-to-br from-cyan-400 via-blue-500 to-indigo-600 rounded-full w-32 h-32 flex items-center justify-center shadow-2xl border border-cyan-300/30">
                  <Zap className="w-16 h-16 text-white drop-shadow-lg animate-pulse" />
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
                      className="absolute transform -translate-x-1/2 -translate-y-1/2 z-10 cursor-pointer"
                      style={{
                        top: node.position.top || 'auto',
                        bottom: node.position.bottom || 'auto',
                        left: node.position.left || 'auto',
                        right: node.position.right || 'auto',
                      }}
                      onMouseEnter={() => setHoveredNode(node.id)}
                      onMouseLeave={() => setHoveredNode(null)}
                    >
                      <div className={`relative transition-all duration-300 ${
                        isHovered ? 'scale-110' : 'scale-100'
                      }`}>
                        {/* Glow Effect */}
                        <div className={`absolute inset-0 bg-gradient-to-br ${node.color} rounded-2xl blur-lg opacity-40 transition-opacity duration-300 ${
                          isHovered ? 'opacity-70' : 'opacity-40'
                        }`}></div>
                        
                        {/* Node Content */}
                        <div className={`relative bg-white/90 backdrop-blur-sm rounded-2xl p-6 shadow-xl border border-white/20 transition-all duration-300 ${
                          isHovered ? 'bg-white/95 shadow-2xl' : ''
                        }`}>
                          <div className="flex flex-col items-center text-center space-y-3">
                            <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${isHovered ? node.hoverColor : node.color} flex items-center justify-center shadow-lg transition-all duration-300`}>
                              <IconComponent className="w-6 h-6 text-white" />
                            </div>
                            <div>
                              <h3 className="font-bold text-gray-800 text-sm leading-tight">{node.title}</h3>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent side="top" className="max-w-xs p-4 bg-white/95 backdrop-blur-sm border border-gray-200 shadow-xl">
                    <div className="space-y-3">
                      <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                        <IconComponent className="w-4 h-4" />
                        {node.title}
                      </h4>
                      <div className="space-y-2">
                        {node.features.map((feature, index) => {
                          const FeatureIcon = feature.icon;
                          return (
                            <div key={index} className="flex items-center gap-2 text-sm text-gray-600">
                              <FeatureIcon className="w-3 h-3 text-gray-400" />
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
            <div className="inline-flex items-center justify-center px-8 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-semibold rounded-full shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300 cursor-pointer">
              <Zap className="w-5 h-5 mr-2" />
              Explore the Circuit
            </div>
          </div>
        </div>

        <style jsx>{`
          @keyframes dashFlow {
            0% { stroke-dashoffset: 0; }
            100% { stroke-dashoffset: -24; }
          }
        `}</style>
      </div>
    </TooltipProvider>
  );
};

export default SahadhyayiCircuit;
