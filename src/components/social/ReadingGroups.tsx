
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Users, 
  Plus, 
  Search, 
  Calendar, 
  MessageCircle, 
  Settings,
  Lock,
  Globe,
  UserPlus
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ReadingGroup {
  id: string;
  name: string;
  description: string;
  coverImage?: string;
  privacy: 'public' | 'private' | 'invite-only';
  memberCount: number;
  isJoined: boolean;
  isAdmin: boolean;
  categories: string[];
  language: string;
  recentActivity: string;
}

const mockGroups: ReadingGroup[] = [
  {
    id: '1',
    name: 'Mystery Book Club',
    description: 'For lovers of mystery, thriller, and detective novels. We meet monthly to discuss our latest reads.',
    privacy: 'public',
    memberCount: 324,
    isJoined: true,
    isAdmin: false,
    categories: ['Mystery', 'Thriller'],
    language: 'English',
    recentActivity: '2 hours ago'
  },
  {
    id: '2',
    name: 'Historical Fiction Fans',
    description: 'Exploring the past through fiction. Join us for discussions about historical novels and their contexts.',
    privacy: 'public',
    memberCount: 201,
    isJoined: false,
    isAdmin: false,
    categories: ['Historical Fiction'],
    language: 'English',
    recentActivity: '5 hours ago'
  }
];

export const ReadingGroups = () => {
  const [groups, setGroups] = useState<ReadingGroup[]>(mockGroups);
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newGroup, setNewGroup] = useState({
    name: '',
    description: '',
    privacy: 'public' as const,
    categories: [] as string[]
  });
  const { toast } = useToast();

  const handleCreateGroup = () => {
    if (!newGroup.name.trim()) {
      toast({ title: 'Error', description: 'Group name is required', variant: 'destructive' });
      return;
    }

    const group: ReadingGroup = {
      id: Date.now().toString(),
      name: newGroup.name,
      description: newGroup.description,
      privacy: newGroup.privacy,
      memberCount: 1,
      isJoined: true,
      isAdmin: true,
      categories: newGroup.categories,
      language: 'English',
      recentActivity: 'now'
    };

    setGroups([group, ...groups]);
    setNewGroup({ name: '', description: '', privacy: 'public', categories: [] });
    setShowCreateDialog(false);
    toast({ title: 'Group created successfully!' });
  };

  const handleJoinGroup = (groupId: string) => {
    setGroups(groups.map(group => 
      group.id === groupId 
        ? { ...group, isJoined: true, memberCount: group.memberCount + 1 }
        : group
    ));
    toast({ title: 'Joined group successfully!' });
  };

  const handleLeaveGroup = (groupId: string) => {
    setGroups(groups.map(group => 
      group.id === groupId 
        ? { ...group, isJoined: false, memberCount: group.memberCount - 1 }
        : group
    ));
    toast({ title: 'Left group successfully!' });
  };

  const filteredGroups = groups.filter(group =>
    group.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    group.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const myGroups = groups.filter(group => group.isJoined);
  const publicGroups = groups.filter(group => !group.isJoined);

  return (
    <div className="space-y-6">
      <Tabs defaultValue="my-groups" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="my-groups">My Groups ({myGroups.length})</TabsTrigger>
          <TabsTrigger value="discover">Discover Groups</TabsTrigger>
        </TabsList>

        <TabsContent value="my-groups" className="space-y-6">
          {/* Create Group Button */}
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold text-gray-900">My Reading Groups</h2>
            <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
              <DialogTrigger asChild>
                <Button className="bg-orange-600 hover:bg-orange-700">
                  <Plus className="w-4 h-4 mr-2" />
                  Create Group
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Create New Reading Group</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700">Group Name</label>
                    <Input
                      value={newGroup.name}
                      onChange={(e) => setNewGroup({ ...newGroup, name: e.target.value })}
                      placeholder="Enter group name"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Description</label>
                    <Textarea
                      value={newGroup.description}
                      onChange={(e) => setNewGroup({ ...newGroup, description: e.target.value })}
                      placeholder="Describe your group"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Privacy</label>
                    <Select value={newGroup.privacy} onValueChange={(value: any) => setNewGroup({ ...newGroup, privacy: value })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="public">Public</SelectItem>
                        <SelectItem value="private">Private</SelectItem>
                        <SelectItem value="invite-only">Invite Only</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button onClick={handleCreateGroup} className="w-full bg-orange-600 hover:bg-orange-700">
                    Create Group
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {/* My Groups List */}
          <div className="grid gap-6">
            {myGroups.length === 0 ? (
              <Card className="bg-white/90 backdrop-blur-sm border-amber-200">
                <CardContent className="p-8 text-center">
                  <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Groups Yet</h3>
                  <p className="text-gray-600 mb-4">Create your first reading group or join existing ones to get started.</p>
                  <Button onClick={() => setShowCreateDialog(true)} className="bg-orange-600 hover:bg-orange-700">
                    Create Your First Group
                  </Button>
                </CardContent>
              </Card>
            ) : (
              myGroups.map((group) => (
                <Card key={group.id} className="bg-white/95 backdrop-blur-sm border-amber-200 hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-xl font-semibold text-gray-900">{group.name}</h3>
                          <div className="flex items-center gap-1">
                            {group.privacy === 'public' ? <Globe className="w-4 h-4 text-green-600" /> : <Lock className="w-4 h-4 text-gray-600" />}
                            <Badge variant="outline" className="text-xs">
                              {group.privacy}
                            </Badge>
                          </div>
                          {group.isAdmin && (
                            <Badge className="bg-orange-100 text-orange-800 text-xs">Admin</Badge>
                          )}
                        </div>
                        <p className="text-gray-600 mb-3">{group.description}</p>
                        <div className="flex items-center gap-4 text-sm text-gray-500">
                          <span className="flex items-center gap-1">
                            <Users className="w-4 h-4" />
                            {group.memberCount} members
                          </span>
                          <span>Active {group.recentActivity}</span>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline">
                          <MessageCircle className="w-4 h-4 mr-2" />
                          Chat
                        </Button>
                        {group.isAdmin && (
                          <Button size="sm" variant="outline">
                            <Settings className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {group.categories.map((category) => (
                        <Badge key={category} variant="secondary" className="text-xs">
                          {category}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="discover" className="space-y-6">
          {/* Search and Filters */}
          <Card className="bg-white/90 backdrop-blur-sm border-amber-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Search className="w-5 h-5" />
                Discover Reading Groups
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-3">
                <Input
                  placeholder="Search groups by name or description..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="flex-1"
                />
                <Button className="bg-orange-600 hover:bg-orange-700">
                  <Search className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Public Groups */}
          <div className="grid gap-6">
            {filteredGroups.filter(group => !group.isJoined).map((group) => (
              <Card key={group.id} className="bg-white/95 backdrop-blur-sm border-amber-200 hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-xl font-semibold text-gray-900">{group.name}</h3>
                        <div className="flex items-center gap-1">
                          {group.privacy === 'public' ? <Globe className="w-4 h-4 text-green-600" /> : <Lock className="w-4 h-4 text-gray-600" />}
                          <Badge variant="outline" className="text-xs">
                            {group.privacy}
                          </Badge>
                        </div>
                      </div>
                      <p className="text-gray-600 mb-3">{group.description}</p>
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <span className="flex items-center gap-1">
                          <Users className="w-4 h-4" />
                          {group.memberCount} members
                        </span>
                        <span>Active {group.recentActivity}</span>
                      </div>
                    </div>
                    <Button
                      onClick={() => handleJoinGroup(group.id)}
                      className="bg-orange-600 hover:bg-orange-700"
                    >
                      <UserPlus className="w-4 h-4 mr-2" />
                      Join Group
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {group.categories.map((category) => (
                      <Badge key={category} variant="secondary" className="text-xs">
                        {category}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};
