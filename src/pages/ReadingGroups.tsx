import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Users, Calendar, Map, Plus } from "lucide-react";
import { useGroups, useCreateGroup } from "@/hooks/useGroups";
import GroupCard from "@/components/groups/GroupCard";
import SEO from "@/components/SEO";

const ReadingGroups = () => {
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [newGroup, setNewGroup] = useState({
    name: '',
    description: ''
  });

  const { data: groups = [], isLoading } = useGroups();
  const createGroup = useCreateGroup();

  const upcomingEvents = [
    {
      title: "Book Discussion: The Midnight Library",
      date: "March 15, 2025",
      time: "7:00 PM IST",
      type: "Virtual",
      attendees: 45
    },
    {
      title: "Author Meet: Local Indian Author",
      date: "March 16, 2025",
      time: "6:00 PM IST",
      type: "Physical - Mumbai",
      attendees: 25
    },
    {
      title: "Reading Marathon Weekend",
      date: "March 23-24, 2025",
      time: "All Day",
      type: "Global Virtual Event",
      attendees: 500
    }
  ];

  const handleCreateGroup = async () => {
    if (!newGroup.name) return;
    
    try {
      await createGroup.mutateAsync(newGroup);
      setNewGroup({ name: '', description: '' });
      setShowCreateGroup(false);
    } catch (error) {
      console.error('Error creating group:', error);
    }
  };

  return (
    <>
      <SEO
        title="Reading Groups - Connect with Fellow Readers | Sahadhyayi"
        description="Join or create book discussion groups and participate in engaging events with readers who share your interests."
        canonical="https://sahadhyayi.com/groups"
        url="https://sahadhyayi.com/groups"
      />
      <div className="min-h-screen py-8 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">Reading Groups</h1>
          <p className="text-xl text-gray-700 max-w-3xl mx-auto mb-8">
            Join book-specific discussion groups and connect with fellow readers who share your literary interests. 
            Participate in meaningful conversations and deepen your understanding of great books.
          </p>
          
          <Dialog open={showCreateGroup} onOpenChange={setShowCreateGroup}>
            <DialogTrigger asChild>
              <Button className="bg-amber-600 hover:bg-amber-700 text-white px-8 py-3 text-lg">
                <Plus className="w-5 h-5 mr-2" />
                Create New Group
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create Reading Group</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="group-name">Group Name</Label>
                  <Input
                    id="group-name"
                    value={newGroup.name}
                    onChange={(e) => setNewGroup(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Enter group name"
                  />
                </div>
                <div>
                  <Label htmlFor="group-description">Description</Label>
                  <Textarea
                    id="group-description"
                    value={newGroup.description}
                    onChange={(e) => setNewGroup(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Describe your reading group"
                    rows={3}
                  />
                </div>
                <div className="flex gap-2">
                  <Button 
                    onClick={handleCreateGroup}
                    disabled={createGroup.isPending || !newGroup.name}
                    className="bg-amber-600 hover:bg-amber-700"
                  >
                    {createGroup.isPending ? 'Creating...' : 'Create Group'}
                  </Button>
                  <Button variant="outline" onClick={() => setShowCreateGroup(false)}>
                    Cancel
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Upcoming Events */}
        <div className="mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-6">Upcoming Events</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {upcomingEvents.map((event, index) => (
              <Card key={index} className="bg-gradient-to-br from-amber-50 to-orange-50 border-amber-200">
                <CardHeader>
                  <CardTitle className="text-lg text-gray-900">{event.title}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex items-center space-x-2 text-gray-700">
                    <Calendar className="w-4 h-4" />
                    <span>{event.date}</span>
                  </div>
                  <div className="flex items-center space-x-2 text-gray-700">
                    <span className="font-medium">{event.time}</span>
                  </div>
                  <div className="flex items-center space-x-2 text-gray-700">
                    <Map className="w-4 h-4" />
                    <span>{event.type}</span>
                  </div>
                  <div className="flex items-center space-x-2 text-gray-700">
                    <Users className="w-4 h-4" />
                    <span>{event.attendees} attending</span>
                  </div>
                  <Button className="w-full mt-4 bg-amber-600 hover:bg-amber-700">
                    Join Event
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Reading Groups */}
        <div>
          <h2 className="text-3xl font-bold text-gray-900 mb-6">Active Reading Groups</h2>
          
          {isLoading && (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 6 }).map((_, index) => (
                <div key={index} className="animate-pulse">
                  <div className="bg-gray-200 h-64 rounded-lg"></div>
                </div>
              ))}
            </div>
          )}

          {!isLoading && (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {groups.map((group) => (
                <GroupCard key={group.id} group={group} />
              ))}
            </div>
          )}

          {!isLoading && groups.length === 0 && (
            <div className="text-center py-12">
              <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-medium text-gray-600 mb-2">No groups found</h3>
              <p className="text-gray-500 mb-4">Be the first to create a reading group!</p>
              <Button 
                onClick={() => setShowCreateGroup(true)}
                className="bg-amber-600 hover:bg-amber-700"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create First Group
              </Button>
            </div>
          )}
        </div>

        {/* Interactive Map Placeholder */}
        <div className="mt-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-6">Find Groups Near You</h2>
          <Card className="bg-white/70 backdrop-blur-sm border-amber-200">
            <CardContent className="p-8">
              <div className="bg-gradient-to-br from-amber-100 to-orange-100 rounded-lg h-64 flex items-center justify-center">
                <div className="text-center">
                  <Map className="w-16 h-16 text-amber-600 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">Interactive Map Coming Soon</h3>
                  <p className="text-gray-700">
                    Discover reading groups and bookstores in your area. Connect with local readers and find physical meeting locations.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
    </>
  );
};

export default ReadingGroups;