
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Users, Plus, Search, Calendar, MapPin, Book, MessageCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useUserJoinedGroups } from '@/hooks/useUserGroups';
import { type GroupChat, useCreateGroup, useGroups, useJoinGroup, useLeaveGroup } from '@/hooks/useGroupManagement';

interface ReadingGroup {
  id: string;
  name: string;
  description: string;
  coverImage: string;
  members: number;
  maxMembers: number;
  currentBook: string;
  nextMeeting: string;
  location: string;
  isJoined: boolean;
  isPrivate: boolean;
  genre: string[];
  createdAt?: string;
}

type GroupListItem = GroupChat & {
  group_members?: Array<{ count?: number | null }> | null;
};

const toReadingGroup = (group: GroupListItem, joinedGroupIds: Set<string>): ReadingGroup => ({
  id: group.id,
  name: group.name || 'Untitled group',
  description: group.description || 'No description available.',
  coverImage: group.image_url || '',
  members: Array.isArray(group.group_members) ? (group.group_members[0]?.count ?? 0) : 0,
  maxMembers: 50,
  currentBook: '',
  nextMeeting: '',
  location: 'Online',
  isJoined: joinedGroupIds.has(group.id),
  isPrivate: false,
  genre: [],
  createdAt: group.created_at,
});

export const ReadingGroups = () => {
  const navigate = useNavigate();
  const [groups, setGroups] = useState<ReadingGroup[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newGroup, setNewGroup] = useState({
    name: '',
    description: '',
    maxMembers: 25,
    isPrivate: false
  });
  const { toast } = useToast();
  
  // Use real data from database
  const { data: userGroups = [] } = useUserJoinedGroups();
  const { data: allGroups = [], isLoading: isLoadingGroups } = useGroups();
  const createGroupMutation = useCreateGroup();
  const joinGroupMutation = useJoinGroup();
  const leaveGroupMutation = useLeaveGroup();

  useEffect(() => {
    const joinedGroupIds = new Set(userGroups.map((membership) => membership.group_id));

    const normalizedGroups = allGroups.map((group) => toReadingGroup(group, joinedGroupIds));
    const joinedOnlyGroups = userGroups
      .map((membership) => membership.groups)
      .filter(Boolean)
      .map((group) => toReadingGroup(group, joinedGroupIds));

    const mergedGroups = [...joinedOnlyGroups, ...normalizedGroups].filter((group, index, array) =>
      array.findIndex(candidate => candidate.id === group.id) === index
    );

    setGroups(mergedGroups);
  }, [allGroups, userGroups]);

  const filteredGroups = groups.filter(group =>
    (group.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (group.description || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    group.genre?.some(g => (g || '').toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const handleJoinGroup = async (group: ReadingGroup) => {
    try {
      if (group.isJoined) {
        await leaveGroupMutation.mutateAsync(group.id);
      } else {
        await joinGroupMutation.mutateAsync(group.id);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Please try again.';
      toast({
        title: group.isJoined ? 'Failed to leave group' : 'Failed to join group',
        description: message,
        variant: 'destructive'
      });
    }
  };

  const handleCreateGroup = async () => {
    const trimmedName = newGroup.name.trim();
    const trimmedDescription = newGroup.description.trim();
    const normalizedMaxMembers = Number.isFinite(newGroup.maxMembers)
      ? Math.min(100, Math.max(5, newGroup.maxMembers))
      : 25;

    if (!trimmedName || !trimmedDescription) {
      toast({ title: 'Please fill in all required fields', variant: 'destructive' });
      return;
    }

    try {
      const createdGroupRecord = await createGroupMutation.mutateAsync({
        name: trimmedName,
        description: trimmedDescription
      });

      const createdGroup: ReadingGroup = {
        id: createdGroupRecord.id,
        name: createdGroupRecord.name,
        description: createdGroupRecord.description || '',
        coverImage: '',
        members: 1,
        maxMembers: normalizedMaxMembers,
        currentBook: '',
        nextMeeting: '',
        location: 'Online',
        isJoined: true,
        isPrivate: newGroup.isPrivate,
        genre: []
      };

      setGroups(prev => {
        const remainingGroups = prev.filter(group => group.id !== createdGroup.id);
        return [createdGroup, ...remainingGroups];
      });
      setNewGroup({ name: '', description: '', maxMembers: 25, isPrivate: false });
      setShowCreateDialog(false);
      toast({ title: 'Reading group created successfully!' });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Please try again.';
      toast({
        title: 'Failed to create group',
        description: message,
        variant: 'destructive'
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="bg-white shadow-sm border-0 rounded-xl">
        <CardHeader className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Users className="w-5 h-5 text-orange-600" />
                Reading Groups
              </CardTitle>
              <p className="text-sm text-gray-600 mt-1">
                Join or create reading groups to discuss books with fellow enthusiasts
              </p>
            </div>
            <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
              <DialogTrigger asChild>
                <Button className="bg-orange-600 hover:bg-orange-700 rounded-xl">
                  <Plus className="w-4 h-4 mr-1" />
                  Create Group
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Create Reading Group</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Group Name</label>
                    <Input
                      placeholder="Enter group name"
                      value={newGroup.name}
                      onChange={(e) => setNewGroup({ ...newGroup, name: e.target.value })}
                      className="rounded-xl"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                    <Textarea
                      placeholder="Describe your reading group"
                      value={newGroup.description}
                      onChange={(e) => setNewGroup({ ...newGroup, description: e.target.value })}
                      className="rounded-xl"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Max Members</label>
                    <Input
                      type="number"
                      min="5"
                      max="100"
                      value={newGroup.maxMembers}
                      onChange={(e) => setNewGroup({
                        ...newGroup,
                        maxMembers: Number.parseInt(e.target.value, 10)
                      })}
                      className="rounded-xl"
                    />
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="private"
                      checked={newGroup.isPrivate}
                      onChange={(e) => setNewGroup({ ...newGroup, isPrivate: e.target.checked })}
                      className="rounded"
                    />
                    <label htmlFor="private" className="text-sm text-gray-700">
                      Private group (invitation only)
                    </label>
                  </div>
                  <div className="flex gap-2 pt-4">
                    <Button
                      onClick={handleCreateGroup}
                      disabled={createGroupMutation.isPending}
                      className="flex-1 bg-orange-600 hover:bg-orange-700 rounded-xl"
                    >
                      {createGroupMutation.isPending ? 'Creating...' : 'Create Group'}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setShowCreateDialog(false)}
                      className="flex-1 rounded-xl"
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
      </Card>

      {/* Search */}
      <Card className="bg-white shadow-sm border-0 rounded-xl">
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Search groups by name, description, or genre..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-gray-50 border-0 rounded-xl"
            />
          </div>
        </CardContent>
      </Card>

      {/* User's Real Groups */}
      {userGroups.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">Your Groups</h3>
          <div className="grid gap-4">
            {userGroups.map((membership) => {
              const group = membership.groups;
              if (!group) return null;
              
              return (
                <Card key={group.id} className="bg-white shadow-sm border-0 rounded-xl">
                  <CardContent className="p-4">
                    <div className="flex gap-4">
                      {/* Group Image/Avatar */}
                      <div className="w-20 h-12 rounded-lg bg-gradient-to-br from-orange-400 to-amber-500 flex-shrink-0 flex items-center justify-center text-white font-bold text-lg">
                        {group.image_url ? (
                          <img
                            src={group.image_url}
                            alt={`${group.name} cover`}
                            className="w-full h-full rounded-lg object-cover"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none';
                              e.currentTarget.parentElement!.querySelector('.fallback-text')?.classList.remove('hidden');
                            }}
                          />
                        ) : null}
                        <div className={`fallback-text ${group.image_url ? 'hidden' : ''}`}>
                          {group.name?.charAt(0)?.toUpperCase() || 'G'}
                        </div>
                      </div>
                      
                      {/* Group Info */}
                      <div className="flex-1">
                        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="font-semibold text-gray-900">{group.name}</h3>
                              {membership.role === 'admin' && (
                                <Badge variant="outline" className="text-xs">
                                  Admin
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                              {group.description || 'No description available'}
                            </p>
                          </div>
                          <Button
                            variant="outline"
                            className="border-orange-300 text-orange-700 hover:bg-orange-50 rounded-xl w-full sm:w-auto whitespace-nowrap"
                            onClick={() => navigate(`/groups/${group.id}`)}
                          >
                            View Group
                          </Button>
                        </div>
                        
                        {/* Group Stats */}
                        <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-sm text-gray-500 mt-3">
                          <span className="flex items-center gap-1 whitespace-nowrap">
                            <Users className="w-4 h-4 flex-shrink-0" />
                            <span className="truncate">Member since {new Date(membership.joined_at).toLocaleDateString()}</span>
                          </span>
                          <span className="flex items-center gap-1 whitespace-nowrap">
                            <Calendar className="w-4 h-4 flex-shrink-0" />
                            <span className="truncate">{new Date(group.created_at).toLocaleDateString()}</span>
                          </span>
                        </div>
                        
                        <div className="flex gap-2 mt-3">
                          <Button variant="ghost" size="sm" className="text-orange-600 hover:text-orange-700">
                            <MessageCircle className="w-4 h-4 mr-1" />
                            Group Chat
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* Mock Groups List */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900">Discover Groups</h3>
        <div className="grid gap-4">
          {isLoadingGroups ? (
            <Card className="bg-white shadow-sm border-0 rounded-xl">
              <CardContent className="p-8 text-center text-gray-500">Loading groups...</CardContent>
            </Card>
          ) : filteredGroups.map((group) => (
          <Card key={group.id} className="bg-white shadow-sm border-0 rounded-xl">
            <CardContent className="p-4">
              <div className="flex gap-4">
                {/* Group Image/Avatar */}
                <div className="w-20 h-12 rounded-lg bg-gradient-to-br from-orange-400 to-amber-500 flex-shrink-0 flex items-center justify-center text-white font-bold text-lg">
                  {group.coverImage && group.coverImage.startsWith('http') ? (
                    <img
                      src={group.coverImage}
                      alt={`${group.name} cover`}
                      className="w-full h-full rounded-lg object-cover"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                        e.currentTarget.nextElementSibling?.classList.remove('hidden');
                      }}
                    />
                  ) : null}
                  <div className={group.coverImage && group.coverImage.startsWith('http') ? 'hidden' : ''}>
                    {group.name?.charAt(0)?.toUpperCase() || 'G'}
                  </div>
                </div>
                
                {/* Group Info */}
                <div className="flex-1">
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-gray-900">{group.name}</h3>
                        {group.isPrivate && (
                          <Badge variant="outline" className="text-xs">
                            Private
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                        {group.description}
                      </p>
                      <div className="flex flex-wrap gap-1 mb-2">
                        {group.genre.map((g, index) => (
                          <Badge key={index} variant="secondary" className="text-xs">
                            {g}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <Button
                      onClick={() => handleJoinGroup(group)}
                      variant={group.isJoined ? "outline" : "default"}
                      className={`${group.isJoined 
                        ? "border-orange-300 text-orange-700 hover:bg-orange-50" 
                        : "bg-orange-600 hover:bg-orange-700"
                      } rounded-xl w-full sm:w-auto whitespace-nowrap`}
                    >
                      {group.isJoined ? 'Leave' : 'Join'}
                    </Button>
                  </div>
                  
                  {/* Group Stats */}
                  <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs sm:text-sm text-gray-500 mt-3">
                    <span className="flex items-center gap-1 whitespace-nowrap">
                      <Users className="w-4 h-4 flex-shrink-0" />
                      <span className="truncate">{group.members}/{group.maxMembers} members</span>
                    </span>
                    <span className="flex items-center gap-1 whitespace-nowrap">
                      <Book className="w-4 h-4 flex-shrink-0" />
                      <span className="truncate">{group.currentBook}</span>
                    </span>
                    <span className="flex items-center gap-1 whitespace-nowrap">
                      <Calendar className="w-4 h-4 flex-shrink-0" />
                      <span className="truncate">{group.nextMeeting}</span>
                    </span>
                    <span className="flex items-center gap-1 whitespace-nowrap">
                      <MapPin className="w-4 h-4 flex-shrink-0" />
                      <span className="truncate">{group.location}</span>
                    </span>
                  </div>
                  
                  {group.isJoined && (
                    <div className="flex gap-2 mt-3">
                      <Button variant="ghost" size="sm" className="text-orange-600 hover:text-orange-700">
                        <MessageCircle className="w-4 h-4 mr-1" />
                        Group Chat
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-orange-600 hover:text-orange-700"
                        onClick={() => navigate(`/groups/${group.id}`)}
                      >
                        View Details
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
          ))}
        </div>
      </div>

      {!isLoadingGroups && filteredGroups.length === 0 && (
        <Card className="bg-white shadow-sm border-0 rounded-xl">
          <CardContent className="p-8 text-center">
            <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="font-medium text-gray-900 mb-2">No groups found</h3>
            <p className="text-gray-500">
              Try adjusting your search or create a new reading group to get started.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
