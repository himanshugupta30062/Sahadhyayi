import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Book, Users, MessageCircle, MapPin, Zap, Star, BookOpen, 
  Search, UserPlus, Share2, Heart, Globe, ArrowRight, Play 
} from 'lucide-react';
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from '@/components/ui/tooltip';

const SahadhyayiLanding = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  
  // Features from the circuit diagram
  const features = [
    { id: 'library', icon: Book, title: 'Resource Library', description: 'Access curated educational content' },
    { id: 'community', icon: Users, title: 'Educator Community', description: 'Connect with peers and experts' },
    { id: 'discussions', icon: MessageCircle, title: 'Discussion Forums', description: 'Share insights and solutions' },
    { id: 'locations', icon: MapPin, title: 'Location Services', description: 'Find resources near you' },
    { id: 'quickActions', icon: Zap, title: 'Quick Actions', description: 'Streamline daily operations' },
    { id: 'ratings', icon: Star, title: 'Rating System', description: 'Evaluate and improve quality' },
    { id: 'courses', icon: BookOpen, title: 'Course Management', description: 'Create and manage courses' },
    { id: 'search', icon: Search, title: 'Smart Search', description: 'Find exactly what you need' },
    { id: 'userManagement', icon: UserPlus, title: 'User Management', description: 'Handle students and staff' },
    { id: 'sharing', icon: Share2, title: 'Content Sharing', description: 'Distribute materials easily' },
    { id: 'favorites', icon: Heart, title: 'Favorites', description: 'Save important resources' },
    { id: 'global', icon: Globe, title: 'Global Reach', description: 'Expand your audience worldwide' }
  ];

  // Pain points from the reference image
  const painPoints = [
    "Got an Education Business Idea?",
    "Looking to Expand?",
    "Passionate About Education but Struggling?",
    "Has Your Growth Stagnated?",
    "Facing Challenges in the Education Sector?"
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-800 text-white overflow-hidden">
      {/* Hero Section with Video Background */}
      <section className="relative h-screen flex items-center justify-center overflow-hidden">
        {/* Video Background */}
        <div className="absolute inset-0 z-0">
          <video 
            autoPlay 
            muted 
            loop 
            playsInline
            className="w-full h-full object-cover opacity-40"
            poster="https://quantel.in/wp-content/uploads/2024/10/Sequence-01_2.jpg"
          >
            <source src="https://quantel.in/wp-content/uploads/2024/10/Sequence-01_2.mp4" type="video/mp4" />
            Your browser does not support the video tag.
          </video>
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent"></div>
        </div>
        
        <div className="relative z-10 text-center px-4 max-w-4xl">
          <motion.h1 
            className="text-5xl md:text-7xl font-bold mb-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            Struggling with Your <span className="text-pink-400">Education Business</span>?
          </motion.h1>
          
          <motion.p 
            className="text-xl md:text-2xl mb-10 text-indigo-200"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            Let's Turn It Around! Start your Growth Journey
          </motion.p>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="flex flex-col sm:flex-row gap-4 justify-center"
          >
            <button className="bg-pink-600 hover:bg-pink-700 text-white font-bold py-3 px-8 rounded-full transition-all transform hover:scale-105 flex items-center justify-center gap-2">
              Get Started <ArrowRight size={20} />
            </button>
            <button 
              onClick={() => setIsPlaying(true)}
              className="bg-transparent border-2 border-white hover:bg-white/10 text-white font-bold py-3 px-8 rounded-full transition-all flex items-center justify-center gap-2"
            >
              <Play size={20} fill="white" /> Watch Demo
            </button>
          </motion.div>
        </div>
        
        {/* Animated floating elements */}
        <div className="absolute top-20 left-10 w-16 h-16 rounded-full bg-pink-500/20 blur-xl animate-pulse"></div>
        <div className="absolute bottom-40 right-20 w-24 h-24 rounded-full bg-indigo-500/20 blur-xl animate-pulse"></div>
      </section>

      {/* Pain Points Section */}
      <section className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <motion.div 
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-4xl font-bold mb-4">Facing These Challenges?</h2>
            <p className="text-xl text-indigo-200 max-w-3xl mx-auto">
              You're not alone. Many education businesses struggle with these common issues
            </p>
          </motion.div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {painPoints.map((point, index) => (
              <motion.div
                key={index}
                className="bg-white/10 backdrop-blur-lg p-6 rounded-2xl border border-white/20 hover:border-pink-400 transition-all"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <div className="flex items-start gap-4">
                  <div className="bg-pink-500/20 p-3 rounded-full">
                    <Zap className="text-pink-400" size={24} />
                  </div>
                  <h3 className="text-xl font-semibold">{point}</h3>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section with Circuit Diagram */}
      <section className="py-20 px-4 relative">
        <div className="absolute inset-0 bg-grid-white/[0.05] bg-[length:40px_40px]"></div>
        
        <div className="max-w-6xl mx-auto relative z-10">
          <motion.div 
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-4xl font-bold mb-4">Sahadhyayi Features</h2>
            <p className="text-xl text-indigo-200 max-w-3xl mx-auto">
              Our comprehensive platform addresses all your education business needs
            </p>
          </motion.div>
          
          {/* Circuit-style feature grid */}
          <div className="relative min-h-[600px]">
            {/* Central Hub */}
            <motion.div 
              className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-20"
              initial={{ scale: 0 }}
              whileInView={{ scale: 1 }}
              viewport={{ once: true }}
              transition={{ type: 'spring', stiffness: 100, damping: 15 }}
            >
              <div className="w-40 h-40 rounded-full bg-gradient-to-r from-pink-600 to-purple-600 flex items-center justify-center shadow-2xl shadow-pink-500/30">
                <div className="text-center">
                  <div className="text-2xl font-bold mb-1">Sahadhyayi</div>
                  <div className="text-sm">Hub</div>
                </div>
              </div>
            </motion.div>
            
            {/* Feature Nodes */}
            {features.map((feature, index) => {
              const angle = (index / features.length) * Math.PI * 2;
              const radius = 250;
              const x = 50 + Math.cos(angle) * (radius / 6);
              const y = 50 + Math.sin(angle) * (radius / 6);
              
              return (
                <motion.div
                  key={feature.id}
                  className="absolute z-10"
                  style={{ left: `${x}%`, top: `${y}%`, transform: 'translate(-50%, -50%)' }}
                  initial={{ opacity: 0, scale: 0.7 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1, type: 'spring', stiffness: 80, damping: 20 }}
                >
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="w-16 h-16 rounded-full bg-white/10 backdrop-blur-lg flex items-center justify-center border-2 border-white/30 hover:border-pink-400 transition-all cursor-pointer group">
                          <feature.icon className="text-white group-hover:text-pink-400 transition-colors" size={24} />
                        </div>
                      </TooltipTrigger>
                      <TooltipContent side="top" className="bg-black/80 backdrop-blur-lg border-white/20 text-white">
                        <div className="font-semibold">{feature.title}</div>
                        <div className="text-sm text-indigo-200">{feature.description}</div>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </motion.div>
              );
            })}
            
            {/* Animated connections */}
            <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
              {features.map((_, index) => {
                const angle = (index / features.length) * Math.PI * 2;
                const radius = 25;
                const x = 50 + Math.cos(angle) * radius;
                const y = 50 + Math.sin(angle) * radius;
                
                return (
                  <motion.line
                    key={index}
                    x1="50"
                    y1="50"
                    x2={x}
                    y2={y}
                    stroke="url(#gradient)"
                    strokeWidth="0.5"
                    strokeDasharray="5,5"
                    initial={{ pathLength: 0 }}
                    whileInView={{ pathLength: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 1, delay: index * 0.1 + 0.5 }}
                  />
                );
              })}
              <defs>
                <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#ec4899" />
                  <stop offset="100%" stopColor="#8b5cf6" />
                </linearGradient>
              </defs>
            </svg>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-4xl font-bold mb-6">Ready to Transform Your Education Business?</h2>
            <p className="text-xl text-indigo-200 mb-10 max-w-2xl mx-auto">
              Join thousands of educators who have revolutionized their businesses with Sahadhyayi
            </p>
            <button className="bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-700 hover:to-purple-700 text-white font-bold py-4 px-10 rounded-full text-lg transition-all transform hover:scale-105 shadow-lg shadow-pink-500/30">
              Start Your Free Trial
            </button>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-10 px-4 border-t border-white/10">
        <div className="max-w-6xl mx-auto text-center text-indigo-300">
          <p>© {new Date().getFullYear()} Sahadhyayi. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default SahadhyayiLanding;
