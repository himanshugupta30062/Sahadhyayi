import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, MessageCircle, MapPin, Heart, Share2, TrendingUp } from 'lucide-react';
import { SocialFeed } from '@/components/social/SocialFeed';
import EnhancedFriendsManager from '@/components/social/EnhancedFriendsManager';
import EnhancedReadersMap from '@/components/maps/EnhancedReadersMap';
import { WhatsAppIntegration } from '@/components/social/WhatsAppIntegration';
import { Badge } from '@/components/ui/badge';

const SocialMedia = () => {
  const [activeTab, setActiveTab] = useState('feed');

  const tabData = [
    {
      id: 'feed',
      label: 'Social Feed',
      icon: <TrendingUp className="h-4 w-4" />,
      component: <SocialFeed />
    },
    {
      id: 'friends',
      label: 'Friends',
      icon: <Users className="h-4 w-4" />,
      component: <EnhancedFriendsManager />
    },
    {
      id: 'map',
      label: 'Reading Map',
      icon: <MapPin className="h-4 w-4" />,
      component: <EnhancedReadersMap />
    },
    {
      id: 'whatsapp',
      label: 'WhatsApp',
      icon: <MessageCircle className="h-4 w-4" />,
      component: <WhatsAppIntegration />
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-red-50">
      {/* Header */}
      <div className="bg-white border-b border-orange-100 sticky top-0 z-40">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Social Community</h1>
              <p className="text-gray-600 text-sm">Connect with fellow readers and share your journey</p>
            </div>
            <div className="flex items-center gap-3">
              <Badge variant="secondary" className="flex items-center gap-1">
                <Heart className="h-3 w-3" />
                Reading Community
              </Badge>
              <Badge variant="outline" className="flex items-center gap-1">
                <Share2 className="h-3 w-3" />
                Share & Connect
              </Badge>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-6">
        <Card className="bg-white/90 backdrop-blur-sm border-orange-200 shadow-lg">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-xl">
              <Users className="h-5 w-5 text-orange-500" />
              Social Hub
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <div className="px-6 pb-4">
                <TabsList className="grid w-full grid-cols-4 bg-orange-50 border border-orange-200">
                  {tabData.map((tab) => (
                    <TabsTrigger 
                      key={tab.id}
                      value={tab.id} 
                      className="flex items-center gap-2 data-[state=active]:bg-orange-500 data-[state=active]:text-white"
                    >
                      {tab.icon}
                      <span className="hidden sm:inline">{tab.label}</span>
                    </TabsTrigger>
                  ))}
                </TabsList>
              </div>

              <div className="px-6 pb-6">
                {tabData.map((tab) => (
                  <TabsContent key={tab.id} value={tab.id} className="mt-0">
                    <div className="min-h-[600px]">
                      {tab.component}
                    </div>
                  </TabsContent>
                ))}
              </div>
            </Tabs>
          </CardContent>
        </Card>
      </div>

      {/* Quick Stats Footer */}
      <div className="bg-white border-t border-orange-100 mt-8">
        <div className="container mx-auto px-4 py-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div className="space-y-1">
              <div className="text-2xl font-bold text-orange-600">10K+</div>
              <div className="text-sm text-gray-600">Active Readers</div>
            </div>
            <div className="space-y-1">
              <div className="text-2xl font-bold text-orange-600">50K+</div>
              <div className="text-sm text-gray-600">Books Shared</div>
            </div>
            <div className="space-y-1">
              <div className="text-2xl font-bold text-orange-600">100+</div>
              <div className="text-sm text-gray-600">Reading Groups</div>
            </div>
            <div className="space-y-1">
              <div className="text-2xl font-bold text-orange-600">24/7</div>
              <div className="text-sm text-gray-600">Community Support</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SocialMedia;
