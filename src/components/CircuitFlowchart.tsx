import React, { useState } from 'react';
import { 
  BookOpen, 
  Search, 
  Users, 
  Info, 
  MessageCircle, 
  Bot, 
  Palette,
  Home,
  Zap
} from 'lucide-react';

interface CircuitNode {
  id: string;
  x: number;
  y: number;
  label: string;
  description: string;
  icon: React.ComponentType<any>;
  color: string;
  glowColor: string;
}

interface CircuitConnection {
  from: string;
  to: string;
  path: string;
  delay: number;
}

const CircuitFlowchart: React.FC = () => {
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);

  const nodes: CircuitNode[] = [
    // Central Hub
    {
      id: 'hub',
      x: 400,
      y: 300,
      label: 'Sahadhyayi Hub',
      description: 'Central Processing Unit',
      icon: Home,
      color: '#f59e0b',
      glowColor: '#fbbf24',
    },
    
    // Top row
    {
      id: 'library',
      x: 200,
      y: 100,
      label: 'Library Core',
      description: 'Book Database',
      icon: BookOpen,
      color: '#3b82f6',
      glowColor: '#60a5fa',
    },
    {
      id: 'search',
      x: 600,
      y: 100,
      label: 'Search Engine',
      description: 'Query Processor',
      icon: Search,
      color: '#10b981',
      glowColor: '#34d399',
    },
    
    // Middle row
    {
      id: 'authors',
      x: 100,
      y: 300,
      label: 'Author Module',
      description: 'Creator Network',
      icon: Users,
      color: '#8b5cf6',
      glowColor: '#a78bfa',
    },
    {
      id: 'ai',
      x: 700,
      y: 300,
      label: 'AI Assistant',
      description: 'Neural Network',
      icon: Bot,
      color: '#06b6d4',
      glowColor: '#22d3ee',
    },
    
    // Bottom row
    {
      id: 'community',
      x: 200,
      y: 500,
      label: 'Community Hub',
      description: 'Social Network',
      icon: MessageCircle,
      color: '#ef4444',
      glowColor: '#f87171',
    },
    {
      id: 'ui',
      x: 600,
      y: 500,
      label: 'Interface Layer',
      description: 'User Experience',
      icon: Palette,
      color: '#ec4899',
      glowColor: '#f472b6',
    },
  ];

  const connections: CircuitConnection[] = [
    // Hub to all nodes - circuit-like paths
    { from: 'hub', to: 'library', path: 'M 400 280 L 400 200 L 200 200 L 200 120', delay: 0 },
    { from: 'hub', to: 'search', path: 'M 420 280 L 420 200 L 600 200 L 600 120', delay: 0.2 },
    { from: 'hub', to: 'authors', path: 'M 380 300 L 120 300', delay: 0.4 },
    { from: 'hub', to: 'ai', path: 'M 420 300 L 680 300', delay: 0.6 },
    { from: 'hub', to: 'community', path: 'M 400 320 L 400 400 L 200 400 L 200 480', delay: 0.8 },
    { from: 'hub', to: 'ui', path: 'M 420 320 L 420 400 L 600 400 L 600 480', delay: 1.0 },
    
    // Inter-connections for circuit complexity
    { from: 'library', to: 'search', path: 'M 220 100 L 580 100', delay: 1.2 },
    { from: 'authors', to: 'community', path: 'M 120 320 L 120 460 L 180 460', delay: 1.4 },
    { from: 'ai', to: 'ui', path: 'M 680 320 L 680 460 L 620 460', delay: 1.6 },
  ];

  const CircuitNode: React.FC<{ node: CircuitNode }> = ({ node }) => {
    const IconComponent = node.icon;
    const isHovered = hoveredNode === node.id;
    
    return (
      <g
        transform={`translate(${node.x}, ${node.y})`}
        onMouseEnter={() => setHoveredNode(node.id)}
        onMouseLeave={() => setHoveredNode(null)}
        className="cursor-pointer"
      >
        {/* Outer glow effect */}
        <circle
          cx="0"
          cy="0"
          r={isHovered ? "35" : "30"}
          fill="none"
          stroke={node.glowColor}
          strokeWidth="3"
          opacity={isHovered ? "0.8" : "0.4"}
          className="transition-all duration-300"
          filter="url(#glow)"
        />
        
        {/* Circuit board trace effect */}
        <circle
          cx="0"
          cy="0"
          r="25"
          fill="rgba(0,0,0,0.9)"
          stroke={node.color}
          strokeWidth="2"
          className="transition-all duration-300"
        />
        
        {/* Inner circuit pattern */}
        <circle
          cx="0"
          cy="0"
          r="15"
          fill="none"
          stroke={node.glowColor}
          strokeWidth="1"
          opacity="0.6"
          strokeDasharray="2,2"
        />
        
        {/* Icon */}
        <foreignObject x="-12" y="-12" width="24" height="24">
          <IconComponent 
            size={24} 
            color={node.glowColor}
            className="transition-all duration-300"
          />
        </foreignObject>
        
        {/* Label */}
        <text
          x="0"
          y="45"
          textAnchor="middle"
          fill="white"
          fontSize="12"
          fontWeight="bold"
          className="transition-all duration-300"
        >
          {node.label}
        </text>
        
        {/* Description on hover */}
        {isHovered && (
          <text
            x="0"
            y="60"
            textAnchor="middle"
            fill={node.glowColor}
            fontSize="10"
            opacity="0.8"
          >
            {node.description}
          </text>
        )}
      </g>
    );
  };

  const CircuitPath: React.FC<{ connection: CircuitConnection }> = ({ connection }) => {
    return (
      <g>
        {/* Background path */}
        <path
          d={connection.path}
          fill="none"
          stroke="rgba(255,255,255,0.1)"
          strokeWidth="3"
          strokeLinecap="round"
        />
        
        {/* Animated data flow */}
        <path
          d={connection.path}
          fill="none"
          stroke="url(#dataFlow)"
          strokeWidth="2"
          strokeLinecap="round"
          strokeDasharray="8,8"
          className="animate-pulse"
          style={{
            animationDelay: `${connection.delay}s`,
            animationDuration: '2s'
          }}
        />
        
        {/* Circuit connection points */}
        <circle
          cx={connection.path.split(' ')[1]}
          cy={connection.path.split(' ')[2]}
          r="2"
          fill="#fbbf24"
          className="animate-pulse"
          style={{ animationDelay: `${connection.delay}s` }}
        />
      </g>
    );
  };

  return (
    <section className="py-16 bg-gray-900 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-4xl lg:text-5xl font-bold text-white mb-6 flex items-center justify-center gap-3">
            <Zap className="text-yellow-400" />
            Sahadhyayi Circuit Architecture
            <Zap className="text-yellow-400" />
          </h2>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            Explore how our interconnected systems power the ultimate reading experience
          </p>
        </div>
        
        <div className="bg-gradient-to-br from-gray-900 via-gray-800 to-black rounded-2xl p-8 border border-gray-700">
          <svg 
            width="800" 
            height="600" 
            viewBox="0 0 800 600" 
            className="w-full h-auto"
            style={{ background: 'radial-gradient(circle at center, rgba(59, 130, 246, 0.1), transparent)' }}
          >
            {/* SVG Definitions */}
            <defs>
              {/* Glow filter */}
              <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="4" result="coloredBlur"/>
                <feMerge> 
                  <feMergeNode in="coloredBlur"/>
                  <feMergeNode in="SourceGraphic"/>
                </feMerge>
              </filter>
              
              {/* Data flow gradient */}
              <linearGradient id="dataFlow" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="transparent"/>
                <stop offset="50%" stopColor="#fbbf24"/>
                <stop offset="100%" stopColor="transparent"/>
              </linearGradient>
              
              {/* Grid pattern */}
              <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
                <path d="M 20 0 L 0 0 0 20" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="1"/>
              </pattern>
            </defs>
            
            {/* Background grid */}
            <rect width="100%" height="100%" fill="url(#grid)" />
            
            {/* Circuit connections */}
            {connections.map((connection, index) => (
              <CircuitPath key={index} connection={connection} />
            ))}
            
            {/* Circuit nodes */}
            {nodes.map((node) => (
              <CircuitNode key={node.id} node={node} />
            ))}
            
            {/* Power indicators */}
            <g transform="translate(50, 50)">
              <circle cx="0" cy="0" r="4" fill="#10b981" className="animate-pulse" />
              <text x="10" y="5" fill="#10b981" fontSize="10">ONLINE</text>
            </g>
            
            <g transform="translate(50, 550)">
              <circle cx="0" cy="0" r="4" fill="#ef4444" className="animate-pulse" />
              <text x="10" y="5" fill="#ef4444" fontSize="10">ACTIVE</text>
            </g>
          </svg>
        </div>
        
        <div className="text-center mt-8">
          <p className="text-gray-400 text-sm">
            Interactive circuit diagram • Hover over nodes to explore • Data flows continuously
          </p>
        </div>
      </div>
    </section>
  );
};

export default CircuitFlowchart;