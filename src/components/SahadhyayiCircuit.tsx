
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Book, 
  Users, 
  MessageCircle, 
  MapPin, 
  Star, 
  BookOpen, 
  UserPlus, 
  Search,
  Zap,
  Heart,
  Share2,
  Globe
} from "lucide-react";

const SahadhyayiCircuit: React.FC = () => {
  const features = [
    {
      id: 'library',
      title: 'Digital Library',
      description: 'Access thousands of books',
      icon: Book,
      position: { top: '20%', left: '10%' },
      connections: ['hub'],
      subFeatures: [
        { name: 'Book Reviews', icon: Star },
        { name: 'Reading Progress', icon: BookOpen },
        { name: 'Book Search', icon: Search }
      ]
    },
    {
      id: 'authors',
      title: 'Authors Connect',
      description: 'Connect with your favorite authors',
      icon: Users,
      position: { top: '20%', right: '10%' },
      connections: ['hub'],
      subFeatures: [
        { name: 'Author Chat', icon: MessageCircle },
        { name: 'Live Events', icon: Zap },
        { name: 'Follow Authors', icon: UserPlus }
      ]
    },
    {
      id: 'social',
      title: 'Social Community',
      description: 'Connect with fellow readers',
      icon: MessageCircle,
      position: { bottom: '20%', left: '10%' },
      connections: ['hub'],
      subFeatures: [
        { name: 'Reading Feed', icon: Share2 },
        { name: 'Friends Chat', icon: MessageCircle },
        { name: 'Like & Share', icon: Heart }
      ]
    },
    {
      id: 'map',
      title: 'Reader Map',
      description: 'Discover readers worldwide',
      icon: MapPin,
      position: { bottom: '20%', right: '10%' },
      connections: ['hub'],
      subFeatures: [
        { name: 'Global Map', icon: Globe },
        { name: 'Local Readers', icon: MapPin },
        { name: 'Reading Groups', icon: Users }
      ]
    }
  ];

  const hubPosition = { top: '50%', left: '50%' };

  return (
    <div className="w-full min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8 relative overflow-hidden">
      {/* Background Circuit Pattern */}
      <div className="absolute inset-0 opacity-10">
        <svg width="100%" height="100%" viewBox="0 0 1000 1000" className="w-full h-full">
          <defs>
            <pattern id="circuit" x="0" y="0" width="100" height="100" patternUnits="userSpaceOnUse">
              <circle cx="50" cy="50" r="2" fill="currentColor"/>
              <line x1="0" y1="50" x2="100" y2="50" stroke="currentColor" strokeWidth="1"/>
              <line x1="50" y1="0" x2="50" y2="100" stroke="currentColor" strokeWidth="1"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#circuit)"/>
        </svg>
      </div>

      <div className="relative z-10">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">Sahadhyayi Circuit</h2>
          <p className="text-xl text-gray-600">Your interconnected reading ecosystem</p>
        </div>

        <div className="relative w-full h-[800px]">
          {/* Connection Lines */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 1 }}>
            {features.map((feature) => (
              <g key={`connection-${feature.id}`}>
                <line
                  x1="50%"
                  y1="50%"
                  x2={feature.position.left ? `${parseFloat(feature.position.left) + 15}%` : `${100 - parseFloat(feature.position.right!) - 15}%`}
                  y2={feature.position.top ? `${parseFloat(feature.position.top) + 10}%` : `${100 - parseFloat(feature.position.bottom!) - 10}%`}
                  stroke="#3B82F6"
                  strokeWidth="3"
                  strokeDasharray="10,5"
                  className="animate-pulse"
                />
                <circle
                  cx="50%"
                  cy="50%"
                  r="4"
                  fill="#3B82F6"
                  className="animate-ping"
                />
              </g>
            ))}
          </svg>

          {/* Central Hub */}
          <div 
            className="absolute transform -translate-x-1/2 -translate-y-1/2 z-20"
            style={{ 
              top: hubPosition.top, 
              left: hubPosition.left 
            }}
          >
            <Card className="w-64 h-64 border-4 border-blue-500 shadow-2xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white hover:scale-105 transition-transform duration-300">
              <CardContent className="flex flex-col items-center justify-center h-full p-6">
                <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mb-4">
                  <Zap className="w-8 h-8 text-blue-600" />
                </div>
                <h3 className="text-2xl font-bold text-center mb-2">Sahadhyayi Hub</h3>
                <p className="text-center text-blue-100">Central Connection Point</p>
              </CardContent>
            </Card>
          </div>

          {/* Feature Cards */}
          {features.map((feature) => {
            const IconComponent = feature.icon;
            return (
              <div
                key={feature.id}
                className="absolute transform -translate-x-1/2 -translate-y-1/2 z-10"
                style={{
                  top: feature.position.top || 'auto',
                  bottom: feature.position.bottom || 'auto',
                  left: feature.position.left || 'auto',
                  right: feature.position.right || 'auto',
                }}
              >
                <Card className="w-80 border-2 border-gray-200 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 bg-white">
                  <CardHeader className="pb-3">
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                        <IconComponent className="w-6 h-6 text-blue-600" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">{feature.title}</CardTitle>
                        <CardDescription>{feature.description}</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <h4 className="font-semibold text-sm text-gray-700 mb-2">Key Features:</h4>
                      {feature.subFeatures.map((subFeature, index) => {
                        const SubIcon = subFeature.icon;
                        return (
                          <div key={index} className="flex items-center space-x-2">
                            <SubIcon className="w-4 h-4 text-gray-500" />
                            <span className="text-sm text-gray-600">{subFeature.name}</span>
                          </div>
                        );
                      })}
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="w-full mt-3 hover:bg-blue-50"
                      >
                        Explore {feature.title}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            );
          })}
        </div>

        {/* Bottom Stats */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="text-center p-6">
            <h3 className="text-2xl font-bold text-blue-600">10K+</h3>
            <p className="text-gray-600">Books Available</p>
          </Card>
          <Card className="text-center p-6">
            <h3 className="text-2xl font-bold text-green-600">5K+</h3>
            <p className="text-gray-600">Active Readers</p>
          </Card>
          <Card className="text-center p-6">
            <h3 className="text-2xl font-bold text-purple-600">100+</h3>
            <p className="text-gray-600">Featured Authors</p>
          </Card>
          <Card className="text-center p-6">
            <h3 className="text-2xl font-bold text-orange-600">50+</h3>
            <p className="text-gray-600">Countries</p>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default SahadhyayiCircuit;
