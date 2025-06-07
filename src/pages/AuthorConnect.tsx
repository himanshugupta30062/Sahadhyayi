
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, Users, Headphones, BookOpen, Star } from "lucide-react";

const AuthorConnect = () => {
  const upcomingSessions = [
    {
      id: 1,
      author: "Chetan Bhagat",
      title: "From Engineering to Bestselling Author",
      date: "March 15, 2025",
      time: "7:00 PM IST",
      type: "Live Q&A",
      duration: "60 minutes",
      registrations: 1250,
      price: "₹299",
      description: "Join India's most popular contemporary author as he discusses his journey from IIT to becoming a bestselling novelist. Get insights into writing, publishing, and connecting with Indian readers.",
      topics: ["Writing Process", "Publishing in India", "Contemporary Fiction"]
    },
    {
      id: 2,
      author: "Ruskin Bond",
      title: "The Art of Simple Storytelling",
      date: "March 20, 2025",
      time: "6:00 PM IST",
      type: "Masterclass",
      duration: "90 minutes",
      registrations: 890,
      price: "₹499",
      description: "The beloved master of simple, heartwarming stories shares his decades of experience in crafting tales that touch the heart. Perfect for aspiring writers and literature lovers.",
      topics: ["Short Stories", "Nature Writing", "Character Development"]
    },
    {
      id: 3,
      author: "Amish Tripathi",
      title: "Mythology in Modern Literature",
      date: "March 25, 2025",
      time: "8:00 PM IST",
      type: "Panel Discussion",
      duration: "75 minutes",
      registrations: 1500,
      price: "₹399",
      description: "Explore how ancient Indian mythology can be reimagined for contemporary readers. Discussion on research, cultural sensitivity, and creative adaptation.",
      topics: ["Mythology", "Indian Culture", "Historical Fiction"]
    },
    {
      id: 4,
      author: "Sudha Murty",
      title: "Writing for Children and Adults",
      date: "March 30, 2025",
      time: "5:00 PM IST",
      type: "Workshop",
      duration: "120 minutes",
      registrations: 650,
      price: "₹599",
      description: "Learn from the chairperson of Infosys Foundation about creating meaningful stories that resonate across age groups. Emphasis on moral values and social themes.",
      topics: ["Children's Literature", "Social Issues", "Value-based Writing"]
    }
  ];

  const pastSessions = [
    {
      author: "Arundhati Roy",
      title: "The God of Small Things: 25 Years Later",
      date: "February 28, 2025",
      attendees: 2100,
      rating: 4.9
    },
    {
      author: "Vikram Seth",
      title: "Poetry and Prose: Finding Your Voice",
      date: "February 15, 2025",
      attendees: 1300,
      rating: 4.8
    },
    {
      author: "Jhumpa Lahiri",
      title: "Writing Across Cultures",
      date: "February 10, 2025",
      attendees: 1800,
      rating: 4.9
    }
  ];

  const featuredAuthors = [
    {
      name: "Shashi Tharoor",
      upcoming: "April 5, 2025",
      specialty: "Political Non-fiction",
      books: 25
    },
    {
      name: "Kiran Desai",
      upcoming: "April 12, 2025",
      specialty: "Literary Fiction",
      books: 3
    },
    {
      name: "Devdutt Pattanaik",
      upcoming: "April 18, 2025",
      specialty: "Mythology & Philosophy",
      books: 40
    }
  ];

  return (
    <div className="min-h-screen py-8 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">Author Connect</h1>
          <p className="text-xl text-gray-700 max-w-3xl mx-auto mb-8">
            Get exclusive access to live sessions, workshops, and Q&A with renowned authors. 
            Learn from the masters and enhance your reading and writing journey.
          </p>
          <Button className="bg-amber-600 hover:bg-amber-700 text-white px-8 py-3 text-lg">
            Schedule a Session
          </Button>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Upcoming Sessions */}
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-6">Upcoming Sessions</h2>
              <div className="space-y-6">
                {upcomingSessions.map((session) => (
                  <Card key={session.id} className="bg-white/70 backdrop-blur-sm border-amber-200 hover:shadow-xl transition-all duration-300">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-2xl text-gray-900 mb-2">{session.title}</CardTitle>
                          <p className="text-xl font-semibold text-amber-700">with {session.author}</p>
                        </div>
                        <div className="text-right">
                          <Badge className="bg-amber-100 text-amber-800 mb-2">
                            {session.type}
                          </Badge>
                          <div className="text-2xl font-bold text-amber-600">{session.price}</div>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <p className="text-gray-700 leading-relaxed">{session.description}</p>
                      
                      <div className="flex flex-wrap gap-2">
                        {session.topics.map((topic, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {topic}
                          </Badge>
                        ))}
                      </div>

                      <div className="grid md:grid-cols-2 gap-4 text-sm text-gray-600">
                        <div className="flex items-center space-x-2">
                          <Calendar className="w-4 h-4" />
                          <span>{session.date} at {session.time}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Users className="w-4 h-4" />
                          <span>{session.registrations} registered</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Headphones className="w-4 h-4" />
                          <span>Duration: {session.duration}</span>
                        </div>
                      </div>

                      <Button className="w-full bg-amber-600 hover:bg-amber-700">
                        Register Now
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            {/* Past Sessions */}
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-6">Past Sessions</h2>
              <div className="grid md:grid-cols-2 gap-4">
                {pastSessions.map((session, index) => (
                  <Card key={index} className="bg-gradient-to-br from-amber-50 to-orange-50 border-amber-200">
                    <CardContent className="p-6">
                      <h3 className="font-semibold text-gray-900 mb-1">{session.title}</h3>
                      <p className="text-amber-700 font-medium mb-2">with {session.author}</p>
                      <div className="space-y-1 text-sm text-gray-600">
                        <div className="flex items-center space-x-2">
                          <Calendar className="w-4 h-4" />
                          <span>{session.date}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Users className="w-4 h-4" />
                          <span>{session.attendees} attended</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Star className="w-4 h-4 text-yellow-500" />
                          <span>{session.rating}/5 rating</span>
                        </div>
                      </div>
                      <Button variant="outline" className="w-full mt-4 text-amber-600 border-amber-600 hover:bg-amber-50">
                        Watch Recording
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Featured Authors */}
            <Card className="bg-white/70 backdrop-blur-sm border-amber-200">
              <CardHeader>
                <CardTitle className="text-xl text-gray-900 flex items-center">
                  <BookOpen className="w-5 h-5 text-amber-600 mr-2" />
                  Coming Soon
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {featuredAuthors.map((author, index) => (
                  <div key={index} className="border-b border-amber-100 last:border-b-0 pb-4 last:pb-0">
                    <h3 className="font-semibold text-gray-900">{author.name}</h3>
                    <p className="text-sm text-gray-600">{author.specialty}</p>
                    <p className="text-sm text-amber-600">{author.upcoming}</p>
                    <p className="text-xs text-gray-500">{author.books} published books</p>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Session Types */}
            <Card className="bg-gradient-to-br from-amber-50 to-orange-50 border-amber-200">
              <CardHeader>
                <CardTitle className="text-xl text-gray-900">Session Types</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-medium">Live Q&A</span>
                  <Badge variant="outline">45-60 min</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-medium">Masterclass</span>
                  <Badge variant="outline">90-120 min</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-medium">Workshop</span>
                  <Badge variant="outline">2-3 hours</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-medium">Panel Discussion</span>
                  <Badge variant="outline">60-90 min</Badge>
                </div>
              </CardContent>
            </Card>

            {/* Audio Content */}
            <Card className="bg-white/70 backdrop-blur-sm border-amber-200">
              <CardHeader>
                <CardTitle className="text-xl text-gray-900 flex items-center">
                  <Headphones className="w-5 h-5 text-amber-600 mr-2" />
                  Podcast Series
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <h4 className="font-medium text-gray-900">Reading Culture in India</h4>
                  <p className="text-sm text-gray-600">12 episodes exploring literary traditions</p>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900">Author Journeys</h4>
                  <p className="text-sm text-gray-600">Intimate conversations with writers</p>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900">Book Club Discussions</h4>
                  <p className="text-sm text-gray-600">Deep dives into popular reads</p>
                </div>
                <Button variant="outline" className="w-full text-amber-600 border-amber-600 hover:bg-amber-50">
                  Browse Podcasts
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthorConnect;
