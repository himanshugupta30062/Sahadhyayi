
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, Calendar, Map } from "lucide-react";
import { readingGroups } from "@/mockData";

const ReadingGroups = () => {

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

  return (
    <div className="min-h-screen py-8 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">Reading Groups</h1>
          <p className="text-xl text-gray-700 max-w-3xl mx-auto mb-8">
            Join book-specific discussion groups and connect with fellow readers who share your literary interests. 
            Participate in meaningful conversations and deepen your understanding of great books.
          </p>
          <Button className="bg-amber-600 hover:bg-amber-700 text-white px-8 py-3 text-lg">
            Create New Group
          </Button>
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
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {readingGroups.map((group) => (
              <Card key={group.id} className="bg-white/70 backdrop-blur-sm border-amber-200 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-xl text-gray-900 mb-1">{group.bookTitle}</CardTitle>
                      <p className="text-gray-600 text-sm">by {group.author}</p>
                    </div>
                    <Badge 
                      variant={group.status === "Open" ? "default" : "secondary"}
                      className={group.status === "Open" ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}
                    >
                      {group.status}
                    </Badge>
                  </div>
                  <h3 className="text-lg font-semibold text-amber-700">{group.groupName}</h3>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-gray-700 text-sm">{group.description}</p>
                  
                  <div className="flex flex-wrap gap-1">
                    {group.topics.map((topic, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {topic}
                      </Badge>
                    ))}
                  </div>

                  <div className="space-y-2 text-sm text-gray-600">
                    <div className="flex items-center space-x-2">
                      <Users className="w-4 h-4" />
                      <span>{group.members} members</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Map className="w-4 h-4" />
                      <span>{group.location} • {group.meetingType}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Calendar className="w-4 h-4" />
                      <span>Next: {group.nextMeeting}</span>
                    </div>
                  </div>

                  <Button 
                    className={`w-full ${group.status === "Open" ? "bg-amber-600 hover:bg-amber-700" : "bg-gray-400 cursor-not-allowed"}`}
                    disabled={group.status === "Closed"}
                  >
                    {group.status === "Open" ? "Join Group" : "Group Full"}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
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
  );
};

export default ReadingGroups;
