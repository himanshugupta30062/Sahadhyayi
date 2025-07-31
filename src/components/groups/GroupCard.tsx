import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Users, Calendar, MapPin, BookOpen, MessageCircle } from 'lucide-react';
import { Group } from '@/hooks/useGroupManagement';
import { useJoinGroup, useLeaveGroup } from '@/hooks/useGroupManagement';

interface GroupCardProps {
  group: Group & { group_members?: { count: number }[] };
  isJoined?: boolean;
  onJoin?: (groupId: string) => void;
  onLeave?: (groupId: string) => void;
  onChat?: (groupId: string) => void;
}

const GroupCard: React.FC<GroupCardProps> = ({
  group,
  isJoined = false,
  onJoin,
  onLeave,
  onChat
}) => {
  const joinGroup = useJoinGroup();
  const leaveGroup = useLeaveGroup();

  const memberCount = group.group_members?.[0]?.count || 0;

  const handleJoinLeave = () => {
    if (isJoined) {
      if (onLeave) {
        onLeave(group.id);
      } else {
        leaveGroup.mutate(group.id);
      }
    } else {
      if (onJoin) {
        onJoin(group.id);
      } else {
        joinGroup.mutate(group.id);
      }
    }
  };

  return (
    <Card className="bg-white/70 backdrop-blur-sm border-amber-200 hover:shadow-lg transition-all duration-300">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-xl text-gray-900 mb-2">{group.name}</CardTitle>
            {group.description && (
              <p className="text-gray-700 text-sm mb-3">{group.description}</p>
            )}
          </div>
          <Badge className="bg-amber-100 text-amber-800">
            <BookOpen className="w-3 h-3 mr-1" />
            Reading Group
          </Badge>
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
            <span>Active</span>
          </div>
        </div>

        <div className="flex items-center space-x-2 text-sm text-gray-600">
          <MapPin className="w-4 h-4" />
          <span>Online & Local Meetups</span>
        </div>

        <div className="flex gap-2">
          {isJoined && onChat && (
            <Button
              onClick={() => onChat(group.id)}
              className="flex-1 bg-blue-50 text-blue-700 hover:bg-blue-100"
              variant="outline"
            >
              <MessageCircle className="w-4 h-4 mr-2" />
              Chat
            </Button>
          )}
          <Button
            onClick={handleJoinLeave}
            disabled={joinGroup.isPending || leaveGroup.isPending}
            className={`${isJoined && onChat ? 'flex-1' : 'w-full'} ${
              isJoined
                ? "bg-red-600 hover:bg-red-700"
                : "bg-amber-600 hover:bg-amber-700"
            }`}
          >
            {isJoined ? 'Leave Group' : 'Join Group'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default GroupCard;