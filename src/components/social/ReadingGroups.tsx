
import * as React from 'react';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Users, Plus, Search, Calendar, MapPin, Book, MessageCircle, MoreVertical, Pencil, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useUserJoinedGroups } from '@/hooks/useUserGroups';
import { useCreateGroup, useDeleteGroup, useUpdateGroup } from '@/hooks/useGroupManagement';
import { useAuth } from '@/contexts/authHelpers';
import { GroupChatWindow } from './GroupChatWindow';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Label } from '@/components/ui/label';

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
}

const mockGroups: ReadingGroup[] = [
  {
    id: '1',
    name: 'NYC Fiction Lovers',
    description: 'A community for fiction enthusiasts in New York City. We meet monthly to discuss contemporary fiction and classics.',
    coverImage: 'https://via.placeholder.com/100/60/orange/white?text=Fiction',
    members: 45,
    maxMembers: 50,
    currentBook: 'The Seven Husbands of Evelyn Hugo',
    nextMeeting: 'Dec 15, 2024',
    location: 'Central Park Library',
    isJoined: true,
    isPrivate: false,
    genre: ['Fiction', 'Contemporary']
  },
  {
    id: '2',
    name: 'Self-Improvement Circle',
    description: 'Transform your life one book at a time. We focus on personal development, productivity, and mindfulness.',
    coverImage: 'https://via.placeholder.com/100/60/orange/white?text=SelfHelp',
    members: 32,
    maxMembers: 40,
    currentBook: 'Atomic Habits',
    nextMeeting: 'Dec 20, 2024',
    location: 'Online',
    isJoined: false,
    isPrivate: false,
    genre: ['Self-Help', 'Productivity']
  },
  {
    id: '3',
    name: 'Sci-Fi Adventures',
    description: 'Explore new worlds and future possibilities. From classic Asimov to modern space operas.',
    coverImage: 'https://via.placeholder.com/100/60/orange/white?text=SciFi',
    members: 28,
    maxMembers: 35,
    currentBook: 'Dune',
    nextMeeting: 'Jan 5, 2025',
    location: 'Brooklyn Public Library',
    isJoined: false,
    isPrivate: true,
    genre: ['Sci-Fi', 'Fantasy']
  }
];

export const ReadingGroups = () => {
  const navigate = useNavigate();
  const [groups, setGroups] = useState<ReadingGroup[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('reading-groups');
        return stored ? JSON.parse(stored) : mockGroups;
      } catch {
        return mockGroups;
      }
    }
    return mockGroups;
  });
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
  const { user } = useAuth();
  const { data: userGroups = [] } = useUserJoinedGroups();
  const createGroupMutation = useCreateGroup();
  const updateGroupMutation = useUpdateGroup();
  const deleteGroupMutation = useDeleteGroup();

  // Chat & admin dialogs
  const [chatGroupId, setChatGroupId] = useState<string | null>(null);
  const [editGroup, setEditGroup] = useState<{ id: string; name: string; description: string } | null>(null);
  const [deleteGroupId, setDeleteGroupId] = useState<string | null>(null);

  const filteredGroups = groups.filter(group =>
    (group.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (group.description || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    group.genre?.some(g => (g || '').toLowerCase().includes(searchQuery.toLowerCase()))
  );

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('reading-groups', JSON.stringify(groups));
    }
  }, [groups]);

  const handleJoinGroup = (groupId: string) => {
    setGroups(prev =>
      prev.map(group =>
        group.id === groupId
          ? { ...group, isJoined: !group.isJoined, members: group.isJoined ? group.members - 1 : group.members + 1 }
          : group
      )
    );
    toast({ title: 'Group membership updated!' });
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
      <Card className="bg-gradient-to-br from-brand-primary/10 via-card to-brand-secondary/5 border-brand-primary/20 rounded-2xl overflow-hidden">
        <CardHeader className="p-5">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="w-11 h-11 rounded-xl bg-gradient-button flex items-center justify-center shadow-[var(--shadow-button)] flex-shrink-0">
                <Users className="w-5 h-5 text-white" />
              </div>
              <div>
                <CardTitle className="text-lg text-foreground">Reading Groups</CardTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  Join or create groups to discuss books with fellow readers
                </p>
              </div>
            </div>
            <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
              <DialogTrigger asChild>
                <Button className="bg-gradient-button text-white shadow-[var(--shadow-button)] hover:shadow-[var(--shadow-elevated)] hover:opacity-95 rounded-xl w-full sm:w-auto">
                  <Plus className="w-4 h-4 mr-1.5" />
                  Create Group
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Create Reading Group</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Group Name</Label>
                    <Input
                      placeholder="Enter group name"
                      value={newGroup.name}
                      onChange={(e) => setNewGroup({ ...newGroup, name: e.target.value })}
                      className="rounded-xl"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Description</Label>
                    <Textarea
                      placeholder="Describe your reading group"
                      value={newGroup.description}
                      onChange={(e) => setNewGroup({ ...newGroup, description: e.target.value })}
                      className="rounded-xl min-h-[90px]"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Max Members</Label>
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
                  <div className="flex items-center space-x-2 pt-1">
                    <input
                      type="checkbox"
                      id="private"
                      checked={newGroup.isPrivate}
                      onChange={(e) => setNewGroup({ ...newGroup, isPrivate: e.target.checked })}
                      className="rounded accent-brand-primary"
                    />
                    <Label htmlFor="private" className="text-sm text-foreground cursor-pointer">
                      Private group (invitation only)
                    </Label>
                  </div>
                  <div className="flex gap-2 pt-2">
                    <Button
                      onClick={handleCreateGroup}
                      disabled={createGroupMutation.isPending}
                      className="flex-1 bg-gradient-button text-white hover:opacity-95 rounded-xl"
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
      <Card className="bg-card border-border rounded-2xl">
        <CardContent className="p-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search groups by name, description, or genre..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-muted/40 border-border focus-visible:border-brand-primary focus-visible:ring-2 focus-visible:ring-brand-primary/20 rounded-xl"
            />
          </div>
        </CardContent>
      </Card>

      {/* User's Real Groups */}
      {userGroups.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-semibold text-foreground">Your Groups</h3>
            <Badge variant="secondary" className="bg-brand-primary/10 text-brand-primary border-0">{userGroups.length}</Badge>
          </div>
          <div className="grid gap-4">
            {userGroups.map((membership) => {
              const group = membership.groups;
              if (!group) return null;

              return (
                <Card key={group.id} className="bg-card border-border rounded-2xl hover:shadow-[var(--shadow-elevated)] hover:border-brand-primary/30 transition-all">
                  <CardContent className="p-4">
                    <div className="flex gap-4">
                      {/* Group Image/Avatar */}
                      <div className="w-14 h-14 rounded-xl bg-gradient-button flex-shrink-0 flex items-center justify-center text-white font-bold text-xl shadow-[var(--shadow-button)] overflow-hidden">
                        {group.image_url ? (
                          <img
                            src={group.image_url}
                            alt={`${group.name} cover`}
                            className="w-full h-full object-cover"
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
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1 flex-wrap">
                              <h3 className="font-semibold text-foreground">{group.name}</h3>
                              {membership.role === 'admin' && (
                                <Badge variant="outline" className="text-[10px] border-brand-primary/40 text-brand-primary">
                                  Admin
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                              {group.description || 'No description available'}
                            </p>
                          </div>
                          <div className="flex items-center gap-2 w-full sm:w-auto">
                            <Button
                              variant="outline"
                              size="sm"
                              className="border-brand-primary/40 text-brand-primary hover:bg-brand-primary/10 rounded-lg flex-1 sm:flex-none whitespace-nowrap"
                              onClick={() => navigate(`/groups/${group.id}`)}
                            >
                              View Group
                            </Button>
                            {(membership.role === 'admin' || group.created_by === user?.id) && (
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="outline" size="icon" className="rounded-lg h-9 w-9" aria-label="Group settings">
                                    <MoreVertical className="w-4 h-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem
                                    onClick={() =>
                                      setEditGroup({
                                        id: group.id,
                                        name: group.name || '',
                                        description: group.description || '',
                                      })
                                    }
                                  >
                                    <Pencil className="w-4 h-4 mr-2" /> Edit group
                                  </DropdownMenuItem>
                                  {group.created_by === user?.id && (
                                    <DropdownMenuItem
                                      className="text-destructive focus:text-destructive"
                                      onClick={() => setDeleteGroupId(group.id)}
                                    >
                                      <Trash2 className="w-4 h-4 mr-2" /> Delete group
                                    </DropdownMenuItem>
                                  )}
                                </DropdownMenuContent>
                              </DropdownMenu>
                            )}
                          </div>
                        </div>

                        {/* Group Stats */}
                        <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground mt-2">
                          <span className="flex items-center gap-1 whitespace-nowrap">
                            <Users className="w-3.5 h-3.5 flex-shrink-0" />
                            <span>Member since {new Date(membership.joined_at).toLocaleDateString()}</span>
                          </span>
                          <span className="flex items-center gap-1 whitespace-nowrap">
                            <Calendar className="w-3.5 h-3.5 flex-shrink-0" />
                            <span>Created {new Date(group.created_at).toLocaleDateString()}</span>
                          </span>
                        </div>

                        <div className="flex gap-2 mt-3">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-brand-primary hover:bg-brand-primary/10 rounded-lg"
                            onClick={() => setChatGroupId(group.id)}
                          >
                            <MessageCircle className="w-4 h-4 mr-1.5" />
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

      {/* Discover Groups */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-foreground">Discover Groups</h3>
        <div className="grid gap-4">
          {filteredGroups.map((group) => (
          <Card key={group.id} className="bg-card border-border rounded-2xl hover:shadow-[var(--shadow-elevated)] hover:border-brand-primary/30 transition-all">
            <CardContent className="p-4">
              <div className="flex gap-4">
                {/* Group Image/Avatar */}
                <div className="w-14 h-14 rounded-xl bg-gradient-button flex-shrink-0 flex items-center justify-center text-white font-bold text-xl shadow-[var(--shadow-button)] overflow-hidden">
                  {group.coverImage && group.coverImage.startsWith('http') ? (
                    <img
                      src={group.coverImage}
                      alt={`${group.name} cover`}
                      className="w-full h-full object-cover"
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
                <div className="flex-1 min-w-0">
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <h3 className="font-semibold text-foreground">{group.name}</h3>
                        {group.isPrivate && (
                          <Badge variant="outline" className="text-[10px]">
                            Private
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                        {group.description}
                      </p>
                      <div className="flex flex-wrap gap-1 mb-2">
                        {group.genre.map((g, index) => (
                          <Badge key={index} variant="secondary" className="text-[10px] bg-brand-primary/10 text-brand-primary border-0">
                            {g}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <Button
                      onClick={() => handleJoinGroup(group.id)}
                      variant={group.isJoined ? "outline" : "default"}
                      size="sm"
                      className={`${group.isJoined
                        ? "border-brand-primary/40 text-brand-primary hover:bg-brand-primary/10"
                        : "bg-gradient-button text-white shadow-[var(--shadow-button)] hover:opacity-95"
                      } rounded-lg w-full sm:w-auto whitespace-nowrap`}
                    >
                      {group.isJoined ? 'Leave' : 'Join'}
                    </Button>
                  </div>

                  {/* Group Stats */}
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs text-muted-foreground mt-2">
                    <span className="flex items-center gap-1 whitespace-nowrap">
                      <Users className="w-3.5 h-3.5 flex-shrink-0" />
                      <span>{group.members}/{group.maxMembers} members</span>
                    </span>
                    <span className="flex items-center gap-1 whitespace-nowrap min-w-0">
                      <Book className="w-3.5 h-3.5 flex-shrink-0" />
                      <span className="truncate">{group.currentBook}</span>
                    </span>
                    <span className="flex items-center gap-1 whitespace-nowrap">
                      <Calendar className="w-3.5 h-3.5 flex-shrink-0" />
                      <span>{group.nextMeeting}</span>
                    </span>
                    <span className="flex items-center gap-1 whitespace-nowrap">
                      <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
                      <span>{group.location}</span>
                    </span>
                  </div>

                  {group.isJoined && (
                    <div className="flex gap-2 mt-3">
                      <Button variant="ghost" size="sm" className="text-brand-primary hover:bg-brand-primary/10 rounded-lg">
                        <MessageCircle className="w-4 h-4 mr-1.5" />
                        Group Chat
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-brand-primary hover:bg-brand-primary/10 rounded-lg"
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

      {filteredGroups.length === 0 && (
        <Card className="bg-card border-border rounded-2xl">
          <CardContent className="p-10 text-center">
            <div className="w-16 h-16 mx-auto mb-3 rounded-2xl bg-brand-primary/10 flex items-center justify-center">
              <Users className="w-8 h-8 text-brand-primary" />
            </div>
            <h3 className="font-semibold text-foreground mb-1">No groups found</h3>
            <p className="text-sm text-muted-foreground">
              Try adjusting your search or create a new reading group to get started.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Group Chat */}
      {chatGroupId && (
        <GroupChatWindow
          groupId={chatGroupId}
          isOpen={!!chatGroupId}
          onClose={() => setChatGroupId(null)}
        />
      )}

      {/* Edit Group Dialog */}
      <Dialog open={!!editGroup} onOpenChange={(open) => !open && setEditGroup(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Group</DialogTitle>
          </DialogHeader>
          {editGroup && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="edit-group-name">Group Name</Label>
                <Input
                  id="edit-group-name"
                  value={editGroup.name}
                  onChange={(e) => setEditGroup({ ...editGroup, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-group-description">Description</Label>
                <Textarea
                  id="edit-group-description"
                  value={editGroup.description}
                  onChange={(e) => setEditGroup({ ...editGroup, description: e.target.value })}
                  rows={3}
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setEditGroup(null)}>
                  Cancel
                </Button>
                <Button
                  className="bg-orange-600 hover:bg-orange-700"
                  disabled={updateGroupMutation.isPending || !editGroup.name.trim()}
                  onClick={async () => {
                    await updateGroupMutation.mutateAsync({
                      groupId: editGroup.id,
                      name: editGroup.name,
                      description: editGroup.description,
                    });
                    setEditGroup(null);
                  }}
                >
                  Save changes
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Group Confirm */}
      <AlertDialog open={!!deleteGroupId} onOpenChange={(open) => !open && setDeleteGroupId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this group?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove the group and all its memberships. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700"
              onClick={async () => {
                if (!deleteGroupId) return;
                await deleteGroupMutation.mutateAsync(deleteGroupId);
                setDeleteGroupId(null);
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
