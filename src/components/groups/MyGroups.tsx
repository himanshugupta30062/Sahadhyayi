import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Users, MessageCircle, Calendar, Settings } from 'lucide-react';
import { useUserJoinedGroups } from '@/hooks/useUserGroups';
import GroupMessaging from './GroupMessaging';
import { formatDistanceToNow } from 'date-fns';

const MyGroups: React.FC = () => {
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [selectedGroupName, setSelectedGroupName] = useState<string>('');
  
  const { data: joinedGroups = [], isLoading } = useUserJoinedGroups();

  const handleOpenChat = (groupId: string, groupName: string) => {
    setSelectedGroupId(groupId);
    setSelectedGroupName(groupName);
  };

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <div key={index} className="animate-pulse">
            <div className="bg-gray-200 h-48 rounded-lg"></div>
          </div>
        ))}
      </div>
    );
  }

  if (joinedGroups.length === 0) {
    return (
      <Card className="text-center py-12">
        <CardContent>
          <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-medium text-gray-600 mb-2">No groups joined yet</h3>
          <p className="text-gray-500 mb-4">
            Join reading groups to start engaging with fellow book lovers!
          </p>
          <Button 
            onClick={() => window.location.href = '/groups'}
            className="bg-amber-600 hover:bg-amber-700"
          >
            Browse Groups
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {joinedGroups.map((membership) => {
          const group = membership.groups;
          if (!group) return null;

          const memberCount = group.group_members?.[0]?.count || 0;

          return (
            <Card key={membership.id} className="bg-white/70 backdrop-blur-sm border-amber-200 hover:shadow-lg transition-all duration-300">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg text-gray-900 mb-2">{group.name}</CardTitle>
                    {group.description && (
                      <p className="text-gray-600 text-sm mb-3 line-clamp-2">{group.description}</p>
                    )}
                  </div>
                  <div className="flex flex-col gap-1">
                    <Badge variant={membership.role === 'admin' ? 'default' : 'secondary'}>
                      {membership.role === 'admin' ? 'Admin' : 'Member'}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between text-sm text-gray-600">
                  <div className="flex items-center space-x-2">
                    <Users className="w-4 h-4" />
                    <span>{memberCount} members</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Calendar className="w-4 h-4" />
                    <span>Joined {formatDistanceToNow(new Date(membership.joined_at || ''), { addSuffix: true })}</span>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button
                    onClick={() => handleOpenChat(group.id, group.name)}
                    className="flex-1 bg-blue-50 text-blue-700 hover:bg-blue-100"
                    variant="outline"
                  >
                    <MessageCircle className="w-4 h-4 mr-2" />
                    Open Chat
                  </Button>
                  
                  {membership.role === 'admin' && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="px-3"
                    >
                      <Settings className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {selectedGroupId && (
        <GroupMessaging
          groupId={selectedGroupId}
          groupName={selectedGroupName}
          isOpen={!!selectedGroupId}
          onClose={() => setSelectedGroupId(null)}
        />
      )}
    </>
  );
};

export default MyGroups;