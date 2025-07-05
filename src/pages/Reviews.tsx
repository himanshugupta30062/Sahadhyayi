
import { useState, useMemo } from "react";
import { Search, Plus, BookOpen, Users, TrendingUp, Globe } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import SEO from "@/components/SEO";
import { ReadingFeed } from "@/components/reviews/ReadingFeed";
import { LeftSidebar } from "@/components/reviews/LeftSidebar";
import { RightSidebar } from "@/components/reviews/RightSidebar";
import { ChatWindow } from "@/components/reviews/ChatWindow";
import type { ChatConversation } from "@/components/reviews/chatData";

import { CreatePostForm } from "@/components/reviews/CreatePostForm";
import {
  Drawer,
  DrawerContent,
  DrawerTrigger,
  DrawerClose,
} from "@/components/ui/drawer";

const Reviews = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [showCreatePost, setShowCreatePost] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedConversation, setSelectedConversation] = useState<ChatConversation | null>(null);
  const [isLeftOpen, setIsLeftOpen] = useState(false);
  const [isRightOpen, setIsRightOpen] = useState(false);
  const { toast } = useToast();

  const handleCreatePost = (newPost: any) => {
    // In a real app, this would be handled by the ReadingFeed component or a global state
    toast({
      title: "Post Created!",
      description: "Your reading update has been shared with the community.",
    });
    setShowCreatePost(false);
  };

  const communityStats = [
    { label: "Active Readers", value: "2,847", icon: Users, color: "text-blue-600" },
    { label: "Books Shared", value: "15,632", icon: BookOpen, color: "text-green-600" },
    { label: "Reading Posts", value: "8,429", icon: TrendingUp, color: "text-purple-600" },
    { label: "Countries", value: "156", icon: Globe, color: "text-orange-600" }
  ];

  return (
    <>
      <SEO
        title="Reading Community - Sahadhyayi"
        description="Share your reading journey, connect with book lovers, and discover new books through our vibrant reading community."
        canonical="https://sahadhyayi.com/reviews"
        url="https://sahadhyayi.com/reviews"
      />
      
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-white to-orange-50 grid grid-cols-1 lg:grid-cols-[20%_60%_20%]">
        {/* Left Sidebar */}
        <div className="hidden lg:block border-r border-gray-200 bg-white overflow-y-auto">
          <div className="p-4">
            <LeftSidebar onSelectConversation={setSelectedConversation} />
          </div>
        </div>

        {/* Center Feed / Chat */}
        <div className="overflow-y-auto">
          <div className="max-w-2xl mx-auto px-4 py-6">
            {selectedConversation ? (
              <ChatWindow conversation={selectedConversation} onClose={() => setSelectedConversation(null)} />
            ) : (
              <>
            
            {/* Header Section */}
            <div className="text-center mb-8">
              <div className="flex items-center justify-center space-x-3 mb-4">
                <div className="p-3 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl shadow-lg">
                  <Users className="w-6 h-6 text-white" />
                </div>
                <h1 className="text-2xl md:text-4xl font-bold bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent">
                  Reading Community
                </h1>
              </div>
              <p className="text-gray-700 max-w-2xl mx-auto mb-6 text-sm md:text-base">
                Share your reading moments, discover book inspiration, and connect with fellow book lovers from around the world.
              </p>
              
              {/* Search and Action Bar */}
              <div className="flex flex-col md:flex-row items-center justify-center gap-4 mb-6">
                {/* Search Bar */}
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Search books, people, or reading groups..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border-2 border-amber-200 focus:border-amber-400 rounded-lg bg-white text-gray-900 placeholder-gray-500 text-sm"
                  />
                </div>
                
                {/* Action Buttons */}
                <div className="flex items-center gap-3">
                  <Button 
                    onClick={() => setShowCreatePost(!showCreatePost)}
                    className="bg-amber-600 hover:bg-amber-700 text-white text-sm md:text-base"
                    size="sm"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Share Reading
                  </Button>
                  <Button variant="outline" size="sm" className="border-amber-200 text-amber-700">
                    <BookOpen className="w-4 h-4 mr-2" />
                    Browse Library
                  </Button>
                </div>
              </div>
            </div>

            {/* Community Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              {communityStats.map((stat, index) => (
                <Card key={index} className="bg-white/80 backdrop-blur-sm border-amber-200 hover:shadow-lg transition-all duration-300">
                  <CardContent className="p-4 text-center">
                    <div className="flex items-center justify-center mb-2">
                      <stat.icon className={`w-6 h-6 ${stat.color}`} />
                    </div>
                    <div className="text-xl md:text-2xl font-bold text-gray-900">{stat.value}</div>
                    <div className="text-xs md:text-sm text-gray-600">{stat.label}</div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Create Post Form */}
            {showCreatePost && (
              <div className="mb-6">
                <CreatePostForm
                  onClose={() => setShowCreatePost(false)}
                  onSubmit={handleCreatePost}
                />
              </div>
            )}

            {/* Main Feed - Centered like Facebook */}
            <div className="relative z-20">
              <ReadingFeed />
            </div>

            </>
          </div>
        </div>

        {/* Right Sidebar */}
        <div className="hidden lg:block border-l border-gray-200 bg-white overflow-y-auto">
          <div className="p-4">
            <RightSidebar />
          </div>
        </div>

      </div>

      {/* Mobile Sidebar Triggers */}
      <div className="lg:hidden">
        {/* Left Sidebar Drawer */}
        <Drawer open={isLeftOpen} onOpenChange={setIsLeftOpen}>
          <DrawerTrigger asChild>
            <Button
              variant="outline"
              className="fixed bottom-4 left-4 z-40 rounded-full p-2 bg-white shadow"
            >
              <Users className="w-5 h-5" />
            </Button>
          </DrawerTrigger>
          <DrawerContent className="h-[80vh]">
            <div className="p-4 overflow-y-auto h-full">
              <DrawerClose asChild>
                <button className="absolute top-2 right-2 text-gray-500">
                  ✕
                </button>
              </DrawerClose>
              <LeftSidebar
                onSelectConversation={(c) => {
                  setIsLeftOpen(false);
                  setSelectedConversation(c);
                }}
              />
            </div>
          </DrawerContent>
        </Drawer>

        {/* Right Sidebar Drawer */}
        <Drawer open={isRightOpen} onOpenChange={setIsRightOpen}>
          <DrawerTrigger asChild>
            <Button
              variant="outline"
              className="fixed bottom-4 right-4 z-40 rounded-full p-2 bg-white shadow"
            >
              <Globe className="w-5 h-5" />
            </Button>
          </DrawerTrigger>
          <DrawerContent className="h-[80vh]">
            <div className="p-4 overflow-y-auto h-full">
              <DrawerClose asChild>
                <button className="absolute top-2 right-2 text-gray-500">
                  ✕
                </button>
              </DrawerClose>
              <RightSidebar />
            </div>
          </DrawerContent>
        </Drawer>
      </div>
    </>
  );
};

export default Reviews;
