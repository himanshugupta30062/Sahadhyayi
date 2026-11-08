import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Users, Calendar, MapPin, BookOpen, MessageCircle, ShieldCheck, Lock } from 'lucide-react';
import { Group } from '@/hooks/useGroupManagement';
import { DEFAULT_READING_GROUP_NAME, useJoinGroup, useLeaveGroup } from '@/hooks/useGroupManagement';
import { useAuth } from '@/contexts/authHelpers';
import { toast } from 'sonner';

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
  const { user } = useAuth();
  const joinGroup = useJoinGroup();
  const leaveGroup = useLeaveGroup();

  const memberCount = group.group_members?.[0]?.count || 0;
  // Keep compatibility with legacy encrypted groups while preferring explicit join policy.
  const requiresInvitation = group.join_policy === 'invite_only' || Boolean(group.is_encrypted);

  const handleJoinLeave = () => {
    if (!user) {
      toast.error('Please sign in to join groups');
      return;
    }

    if (!isJoined && requiresInvitation) {
      toast.error('This reading group is invite-only. Request an invitation from an admin to join.');
      return;
    }

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
        <div className="flex flex-wrap items-center gap-1.5 pt-1 text-xs">
          <Badge variant="outline" className="text-[10px] border-emerald-300 bg-emerald-50 text-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-300 gap-1"><BookOpen className="w-2.5 h-2.5" /> Book of the Month</Badge>
          <Badge variant="outline" className="text-[10px] border-amber-300 bg-amber-50 text-amber-800 dark:bg-amber-950/30 dark:text-amber-300 gap-1"><ShieldCheck className="w-2.5 h-2.5" /> Spoiler-Safe Discussions</Badge>
        </div>
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
            disabled={joinGroup.isPending || leaveGroup.isPending || (isJoined && group.name === DEFAULT_READING_GROUP_NAME) || (!isJoined && requiresInvitation)}
            className={`${isJoined && onChat ? 'flex-1' : 'w-full'} ${
              isJoined && group.name === DEFAULT_READING_GROUP_NAME
                ? "bg-muted text-muted-foreground cursor-default"
                : isJoined
                  ? "bg-red-600 hover:bg-red-700"
                  : requiresInvitation
                    ? "bg-muted text-muted-foreground border border-border cursor-not-allowed opacity-80"
                    : "bg-amber-600 hover:bg-amber-700"
            }`}
          >
            {isJoined && group.name === DEFAULT_READING_GROUP_NAME
              ? 'Permanent Community Member'
              : isJoined
                ? 'Leave Group'
                : requiresInvitation
                  ? (
                    <span className="flex items-center justify-center gap-1.5">
                      <Lock className="w-3.5 h-3.5" /> Invite-Only
                    </span>
                  )
                  : 'Join Group'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default GroupCard;