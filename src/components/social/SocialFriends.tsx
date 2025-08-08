
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Search, MessageCircle, UserMinus, Shield, Users } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client-universal';
import { WhatsAppTab } from './WhatsAppTab';

interface Friend {
  id: string;
  name: string;
  avatar: string;
  isOnline: boolean;
  mutualBooks: number;
  commonInterests: string[];
}

export const SocialFriends = () => {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [friends, setFriends] = useState<Friend[]>([]);

  // Mock data for demonstration
  useEffect(() => {
    const mockFriends: Friend[] = [
      {
        id: '1',
        name: 'Sarah Johnson',
        avatar: '',
        isOnline: true,
        mutualBooks: 12,
        commonInterests: ['Fiction', 'Mystery', 'Biography']
      },
      {
        id: '2',
        name: 'Mike Chen',
        avatar: '',
        isOnline: false,
        mutualBooks: 8,
        commonInterests: ['Technology', 'Science Fiction']
      },
      {
        id: '3',
        name: 'Emma Wilson',
        avatar: '',
        isOnline: true,
        mutualBooks: 15,
        commonInterests: ['Romance', 'Historical Fiction', 'Poetry']
      }
    ];
    setFriends(mockFriends);
  }, []);

  const filteredFriends = friends.filter(friend =>
    friend.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border h-fit">
      <div className="p-4 border-b">
        <h3 className="font-semibold text-gray-900 mb-3">Friends & Connections</h3>
        
        <Tabs defaultValue="friends" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="friends" className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              Friends
            </TabsTrigger>
            <TabsTrigger value="whatsapp" className="flex items-center gap-2">
              <MessageCircle className="w-4 h-4" />
              WhatsApp
            </TabsTrigger>
          </TabsList>

          <TabsContent value="friends" className="mt-0">
            <div className="space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search friends..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>

              <div className="space-y-3 max-h-96 overflow-y-auto">
                {filteredFriends.map((friend) => (
                  <div key={friend.id} className="flex items-center justify-between group hover:bg-gray-50 p-2 rounded-lg transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <Avatar className="w-10 h-10">
                          <AvatarImage src={friend.avatar} />
                          <AvatarFallback className="text-sm">
                            {getInitials(friend.name)}
                          </AvatarFallback>
                        </Avatar>
                        {friend.isOnline && (
                          <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {friend.name}
                        </p>
                        <p className="text-xs text-gray-500">
                          {friend.mutualBooks} mutual books
                        </p>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {friend.commonInterests.slice(0, 2).map((interest) => (
                            <Badge key={interest} variant="secondary" className="text-xs">
                              {interest}
                            </Badge>
                          ))}
                          {friend.commonInterests.length > 2 && (
                            <Badge variant="secondary" className="text-xs">
                              +{friend.commonInterests.length - 2}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                        <MessageCircle className="w-4 h-4" />
                      </Button>
                      <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-red-600 hover:text-red-700">
                        <UserMinus className="w-4 h-4" />
                      </Button>
                      <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-red-600 hover:text-red-700">
                        <Shield className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
                
                {filteredFriends.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <Users className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No friends found</p>
                  </div>
                )}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="whatsapp" className="mt-0">
            <div className="max-h-96 overflow-y-auto">
              <WhatsAppTab />
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};
