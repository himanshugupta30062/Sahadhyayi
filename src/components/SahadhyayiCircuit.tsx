
import React from "react";
import { BookOpen, Users, Map, Calendar, MessageCircle, Star, Heart, UserPlus } from "lucide-react";

const SahadhyayiCircuit = () => {
  return (
    <section className="py-16 bg-gray-900 relative overflow-hidden">
      <div className="max-w-6xl mx-auto px-4 text-center relative">
        <h2 className="text-4xl lg:text-5xl font-bold text-white mb-6">
          Sahadhyayi Platform Features
        </h2>
        <p className="text-xl text-gray-300 max-w-3xl mx-auto mb-12">
          A connected ecosystem of tools for every reader
        </p>
        
        {/* Interactive Circuit Diagram */}
        <div className="relative mx-auto w-full max-w-4xl h-96 mb-8">
          {/* Connection Lines */}
          <svg className="absolute inset-0 w-full h-full" xmlns="http://www.w3.org/2000/svg">
            {/* Central hub connections */}
            <line x1="50%" y1="50%" x2="20%" y2="25%" stroke="#3b82f6" strokeWidth="2" className="animate-pulse" />
            <line x1="50%" y1="50%" x2="80%" y2="25%" stroke="#22c55e" strokeWidth="2" className="animate-pulse" />
            <line x1="50%" y1="50%" x2="15%" y2="75%" stroke="#a855f7" strokeWidth="2" className="animate-pulse" />
            <line x1="50%" y1="50%" x2="85%" y2="75%" stroke="#f59e0b" strokeWidth="2" className="animate-pulse" />
            
            {/* Inter-feature connections */}
            <line x1="20%" y1="25%" x2="80%" y2="25%" stroke="#6366f1" strokeWidth="1" strokeDasharray="5,5" className="animate-pulse" />
            <line x1="15%" y1="75%" x2="85%" y2="75%" stroke="#ec4899" strokeWidth="1" strokeDasharray="5,5" className="animate-pulse" />
            <line x1="20%" y1="25%" x2="15%" y2="75%" stroke="#10b981" strokeWidth="1" strokeDasharray="5,5" className="animate-pulse" />
            <line x1="80%" y1="25%" x2="85%" y2="75%" stroke="#f97316" strokeWidth="1" strokeDasharray="5,5" className="animate-pulse" />
          </svg>

          {/* Central Hub */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-32 h-32 rounded-full bg-gradient-to-r from-orange-600 to-red-600 flex items-center justify-center text-white font-bold text-lg shadow-2xl border-4 border-white/20 backdrop-blur-sm">
              Sahadhyayi<br/>Hub
            </div>
          </div>

          {/* Library Feature - Top Left */}
          <div
            className="absolute flex flex-col items-center -translate-x-1/2 -translate-y-1/2 group cursor-pointer"
            style={{ left: "20%", top: "25%" }}
          >
            <div className="bg-blue-600 p-4 rounded-2xl shadow-2xl border-2 border-blue-400/50 backdrop-blur-sm hover:scale-110 transition-all duration-300 group-hover:shadow-blue-500/50">
              <BookOpen className="w-8 h-8 text-white" />
            </div>
            <div className="mt-2 text-center">
              <h3 className="text-white font-semibold text-sm">Digital Library</h3>
              <div className="flex gap-1 mt-1">
                <span className="px-2 py-1 bg-blue-500/20 text-blue-300 rounded-full text-xs">Browse</span>
                <span className="px-2 py-1 bg-blue-500/20 text-blue-300 rounded-full text-xs flex items-center gap-1">
                  <Star className="w-3 h-3" />
                  Review
                </span>
              </div>
            </div>
          </div>

          {/* Authors Feature - Top Right */}
          <div
            className="absolute flex flex-col items-center -translate-x-1/2 -translate-y-1/2 group cursor-pointer"
            style={{ left: "80%", top: "25%" }}
          >
            <div className="bg-green-600 p-4 rounded-2xl shadow-2xl border-2 border-green-400/50 backdrop-blur-sm hover:scale-110 transition-all duration-300 group-hover:shadow-green-500/50">
              <Users className="w-8 h-8 text-white" />
            </div>
            <div className="mt-2 text-center">
              <h3 className="text-white font-semibold text-sm">Authors</h3>
              <div className="flex gap-1 mt-1">
                <span className="px-2 py-1 bg-green-500/20 text-green-300 rounded-full text-xs">Connect</span>
                <span className="px-2 py-1 bg-green-500/20 text-green-300 rounded-full text-xs">Q&A</span>
              </div>
            </div>
          </div>

          {/* Social Media Feature - Bottom Left */}
          <div
            className="absolute flex flex-col items-center -translate-x-1/2 -translate-y-1/2 group cursor-pointer"
            style={{ left: "15%", top: "75%" }}
          >
            <div className="bg-purple-600 p-4 rounded-2xl shadow-2xl border-2 border-purple-400/50 backdrop-blur-sm hover:scale-110 transition-all duration-300 group-hover:shadow-purple-500/50">
              <MessageCircle className="w-8 h-8 text-white" />
            </div>
            <div className="mt-2 text-center">
              <h3 className="text-white font-semibold text-sm">Social Community</h3>
              <div className="flex gap-1 mt-1 flex-wrap justify-center">
                <span className="px-2 py-1 bg-purple-500/20 text-purple-300 rounded-full text-xs">Feed</span>
                <span className="px-2 py-1 bg-purple-500/20 text-purple-300 rounded-full text-xs flex items-center gap-1">
                  <UserPlus className="w-3 h-3" />
                  Friends
                </span>
                <span className="px-2 py-1 bg-purple-500/20 text-purple-300 rounded-full text-xs">Chat</span>
              </div>
            </div>
          </div>

          {/* Map Feature - Bottom Right */}
          <div
            className="absolute flex flex-col items-center -translate-x-1/2 -translate-y-1/2 group cursor-pointer"
            style={{ left: "85%", top: "75%" }}
          >
            <div className="bg-amber-600 p-4 rounded-2xl shadow-2xl border-2 border-amber-400/50 backdrop-blur-sm hover:scale-110 transition-all duration-300 group-hover:shadow-amber-500/50">
              <Map className="w-8 h-8 text-white" />
            </div>
            <div className="mt-2 text-center">
              <h3 className="text-white font-semibold text-sm">Reader Map</h3>
              <div className="flex gap-1 mt-1">
                <span className="px-2 py-1 bg-amber-500/20 text-amber-300 rounded-full text-xs">Location</span>
                <span className="px-2 py-1 bg-amber-500/20 text-amber-300 rounded-full text-xs">Groups</span>
              </div>
            </div>
          </div>
        </div>

        {/* Feature Highlight Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
          <div className="bg-blue-900/30 backdrop-blur-sm border border-blue-500/30 rounded-xl p-6 text-center hover:bg-blue-900/50 transition-all duration-300">
            <BookOpen className="w-12 h-12 text-blue-400 mx-auto mb-3" />
            <h3 className="text-white font-semibold mb-2">Library Access</h3>
            <p className="text-gray-300 text-sm">Browse thousands of books, write reviews, and track your reading progress</p>
          </div>
          
          <div className="bg-green-900/30 backdrop-blur-sm border border-green-500/30 rounded-xl p-6 text-center hover:bg-green-900/50 transition-all duration-300">
            <Users className="w-12 h-12 text-green-400 mx-auto mb-3" />
            <h3 className="text-white font-semibold mb-2">Author Connect</h3>
            <p className="text-gray-300 text-sm">Engage with authors through live sessions, Q&As, and exclusive content</p>
          </div>
          
          <div className="bg-purple-900/30 backdrop-blur-sm border border-purple-500/30 rounded-xl p-6 text-center hover:bg-purple-900/50 transition-all duration-300">
            <MessageCircle className="w-12 h-12 text-purple-400 mx-auto mb-3" />
            <h3 className="text-white font-semibold mb-2">Social Features</h3>
            <p className="text-gray-300 text-sm">Share updates, connect with friends, and join reading discussions</p>
          </div>
          
          <div className="bg-amber-900/30 backdrop-blur-sm border border-amber-500/30 rounded-xl p-6 text-center hover:bg-amber-900/50 transition-all duration-300">
            <Map className="w-12 h-12 text-amber-400 mx-auto mb-3" />
            <h3 className="text-white font-semibold mb-2">Global Community</h3>
            <p className="text-gray-300 text-sm">Find readers nearby and join local reading groups on the map</p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default SahadhyayiCircuit;
