
import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MessageCircle, Users, Search } from 'lucide-react';
import { WhatsAppIntegration } from './WhatsAppIntegration';
import { WhatsAppDiscovery } from './WhatsAppDiscovery';

export const WhatsAppTab = () => {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">WhatsApp Integration</h2>
        <p className="text-gray-600">Connect with your WhatsApp contacts and discover reading friends</p>
      </div>

      <Tabs defaultValue="setup" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="setup" className="flex items-center gap-2">
            <MessageCircle className="w-4 h-4" />
            Setup
          </TabsTrigger>
          <TabsTrigger value="discover" className="flex items-center gap-2">
            <Search className="w-4 h-4" />
            Discover
          </TabsTrigger>
        </TabsList>

        <TabsContent value="setup" className="mt-6">
          <WhatsAppIntegration />
        </TabsContent>

        <TabsContent value="discover" className="mt-6">
          <WhatsAppDiscovery />
        </TabsContent>
      </Tabs>
    </div>
  );
};
