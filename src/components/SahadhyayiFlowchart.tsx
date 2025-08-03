import React, { useCallback } from 'react';
import {
  ReactFlow,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  Edge,
  Node,
  Background,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { 
  BookOpen, 
  Search, 
  Users, 
  Info, 
  MessageCircle, 
  Bot, 
  Palette,
  Home
} from 'lucide-react';

// Custom Node Component
const FeatureNode = ({ data }: { data: any }) => {
  const IconComponent = data.icon;
  
  return (
    <div className="relative">
      {/* Glowing background effect */}
      <div 
        className="absolute inset-0 rounded-2xl blur-xl opacity-60"
        style={{ 
          background: data.glowColor,
          transform: 'scale(1.2)',
        }}
      />
      
      {/* Main node content */}
      <div className="relative bg-gray-900/95 backdrop-blur-sm border-2 rounded-2xl p-6 min-w-[200px] text-center transition-all duration-300 hover:scale-105"
           style={{ 
             borderColor: data.borderColor,
             boxShadow: `0 0 30px ${data.glowColor}40, inset 0 0 20px ${data.glowColor}20`,
           }}>
        
        {/* Icon with glow */}
        <div className="flex justify-center mb-3">
          <div 
            className="p-3 rounded-full"
            style={{ 
              background: `linear-gradient(135deg, ${data.iconBg}, ${data.iconBgSecondary})`,
              boxShadow: `0 0 20px ${data.glowColor}60`,
            }}
          >
            <IconComponent 
              className="w-8 h-8" 
              style={{ color: data.iconColor }}
            />
          </div>
        </div>
        
        {/* Title */}
        <h3 className="text-white font-bold text-lg mb-2">{data.label}</h3>
        
        {/* Description */}
        <p className="text-gray-300 text-sm leading-relaxed">{data.description}</p>
      </div>
    </div>
  );
};

// Node types
const nodeTypes = {
  feature: FeatureNode,
};

// Initial nodes configuration
const initialNodes: Node[] = [
  // Central Hub
  {
    id: 'hub',
    type: 'feature',
    position: { x: 400, y: 300 },
    data: {
      label: 'Sahadhyayi Homepage',
      description: 'Your gateway to the reading community',
      icon: Home,
      glowColor: '#f59e0b',
      borderColor: '#f59e0b',
      iconBg: '#fbbf24',
      iconBgSecondary: '#f59e0b',
      iconColor: '#ffffff',
    },
    draggable: false,
  },
  
  // Library Section - Top
  {
    id: 'library',
    type: 'feature',
    position: { x: 400, y: 50 },
    data: {
      label: 'Library Section',
      description: 'Explore thousands of e-books across genres like Fiction, Self-Help, History, Finance, and more.',
      icon: BookOpen,
      glowColor: '#3b82f6',
      borderColor: '#3b82f6',
      iconBg: '#60a5fa',
      iconBgSecondary: '#3b82f6',
      iconColor: '#ffffff',
    },
    draggable: false,
  },
  
  // Search & Filter - Top Right
  {
    id: 'search',
    type: 'feature',
    position: { x: 650, y: 150 },
    data: {
      label: 'Search & Filter',
      description: 'Quickly find books with powerful search and intuitive filters by genre, popularity, and more.',
      icon: Search,
      glowColor: '#10b981',
      borderColor: '#10b981',
      iconBg: '#34d399',
      iconBgSecondary: '#10b981',
      iconColor: '#ffffff',
    },
    draggable: false,
  },
  
  // Know Your Author - Right
  {
    id: 'authors',
    type: 'feature',
    position: { x: 750, y: 300 },
    data: {
      label: 'Know Your Author',
      description: 'Discover author biographies, achievements, and explore their complete works and articles.',
      icon: Users,
      glowColor: '#8b5cf6',
      borderColor: '#8b5cf6',
      iconBg: '#a78bfa',
      iconBgSecondary: '#8b5cf6',
      iconColor: '#ffffff',
    },
    draggable: false,
  },
  
  // About Us - Bottom Right
  {
    id: 'about',
    type: 'feature',
    position: { x: 650, y: 450 },
    data: {
      label: 'About Us',
      description: 'Learn about Sahadhyayi\'s mission, vision, and our commitment to fostering trust and transparency.',
      icon: Info,
      glowColor: '#f59e0b',
      borderColor: '#f59e0b',
      iconBg: '#fbbf24',
      iconBgSecondary: '#f59e0b',
      iconColor: '#ffffff',
    },
    draggable: false,
  },
  
  // Community Engagement - Bottom
  {
    id: 'community',
    type: 'feature',
    position: { x: 400, y: 550 },
    data: {
      label: 'Community Engagement',
      description: 'Connect with readers through comment sections, forums, and join book discussion groups.',
      icon: MessageCircle,
      glowColor: '#ef4444',
      borderColor: '#ef4444',
      iconBg: '#f87171',
      iconBgSecondary: '#ef4444',
      iconColor: '#ffffff',
    },
    draggable: false,
  },
  
  // AI Assistant - Bottom Left
  {
    id: 'ai-assistant',
    type: 'feature',
    position: { x: 150, y: 450 },
    data: {
      label: 'AI Assistant',
      description: 'Your always-on reading companion for help, recommendations, and Q&A as you browse.',
      icon: Bot,
      glowColor: '#06b6d4',
      borderColor: '#06b6d4',
      iconBg: '#22d3ee',
      iconBgSecondary: '#06b6d4',
      iconColor: '#ffffff',
    },
    draggable: false,
  },
  
  // User Interface - Left
  {
    id: 'ui',
    type: 'feature',
    position: { x: 50, y: 300 },
    data: {
      label: 'User Interface',
      description: 'Clean, minimalist design with responsive layout that adapts beautifully to all devices.',
      icon: Palette,
      glowColor: '#ec4899',
      borderColor: '#ec4899',
      iconBg: '#f472b6',
      iconBgSecondary: '#ec4899',
      iconColor: '#ffffff',
    },
    draggable: false,
  },
  
  // Top Left
  {
    id: 'responsive',
    type: 'feature',
    position: { x: 150, y: 150 },
    data: {
      label: 'Responsive Design',
      description: 'Seamless experience across web and mobile platforms with consistent, user-friendly navigation.',
      icon: Palette,
      glowColor: '#14b8a6',
      borderColor: '#14b8a6',
      iconBg: '#2dd4bf',
      iconBgSecondary: '#14b8a6',
      iconColor: '#ffffff',
    },
    draggable: false,
  },
];

// Initial edges configuration
const initialEdges: Edge[] = [
  { id: 'hub-library', source: 'hub', target: 'library', type: 'smoothstep', style: { stroke: '#3b82f6', strokeWidth: 3 }, animated: true },
  { id: 'hub-search', source: 'hub', target: 'search', type: 'smoothstep', style: { stroke: '#10b981', strokeWidth: 3 }, animated: true },
  { id: 'hub-authors', source: 'hub', target: 'authors', type: 'smoothstep', style: { stroke: '#8b5cf6', strokeWidth: 3 }, animated: true },
  { id: 'hub-about', source: 'hub', target: 'about', type: 'smoothstep', style: { stroke: '#f59e0b', strokeWidth: 3 }, animated: true },
  { id: 'hub-community', source: 'hub', target: 'community', type: 'smoothstep', style: { stroke: '#ef4444', strokeWidth: 3 }, animated: true },
  { id: 'hub-ai', source: 'hub', target: 'ai-assistant', type: 'smoothstep', style: { stroke: '#06b6d4', strokeWidth: 3 }, animated: true },
  { id: 'hub-ui', source: 'hub', target: 'ui', type: 'smoothstep', style: { stroke: '#ec4899', strokeWidth: 3 }, animated: true },
  { id: 'hub-responsive', source: 'hub', target: 'responsive', type: 'smoothstep', style: { stroke: '#14b8a6', strokeWidth: 3 }, animated: true },
];

const SahadhyayiFlowchart: React.FC = () => {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges],
  );

  return (
    <section className="py-16 bg-gray-900 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-4xl lg:text-5xl font-bold text-white mb-6">
            Sahadhyayi Platform Features
          </h2>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            Discover how our interconnected features work together to create the ultimate reading experience
          </p>
        </div>
        
        <div className="h-[700px] w-full rounded-2xl overflow-hidden border border-gray-700 bg-gradient-to-br from-gray-900 via-gray-800 to-black">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            nodeTypes={nodeTypes}
            fitView
            attributionPosition="bottom-left"
            proOptions={{ hideAttribution: true }}
            style={{ 
              background: 'transparent',
            }}
          >
            <Background 
              color="#374151" 
              gap={20} 
              size={1}
            />
          </ReactFlow>
        </div>
        
        <div className="text-center mt-8">
          <p className="text-gray-400 text-sm">
            Interactive flowchart showing how Sahadhyayi connects readers, authors, and knowledge
          </p>
        </div>
      </div>
    </section>
  );
};

export default SahadhyayiFlowchart;