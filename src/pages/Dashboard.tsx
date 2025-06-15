
import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useProfile } from '@/hooks/useProfile';
import { useNavigate } from "react-router-dom";
import { SidebarProvider } from "@/components/ui/sidebar";
import AppSidebar from "@/components/dashboard/AppSidebar";
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Pencil, Mic, Upload, Tag, BookOpen } from "lucide-react";
import DashboardStats from '@/components/dashboard/DashboardStats';
import Navigation from "@/components/Navigation";
import { useStories } from '@/hooks/useStories'; // <-- fixed import

const actionButtons = [
  {
    label: "New Story (Text)",
    icon: Pencil,
    onClick: (navigate: any) => navigate("/stories/upload"),
  },
  {
    label: "Record Voice Story",
    icon: Mic,
    onClick: (navigate: any) => navigate("/audio-journal"),
  },
  {
    label: "Upload Audio File",
    icon: Upload,
    onClick: (navigate: any) => navigate("/stories/upload"),
  },
  {
    label: "Tag Your Story",
    icon: Tag,
    onClick: (navigate: any) => navigate("/tags"),
  },
  {
    label: "Explore Stories",
    icon: BookOpen,
    onClick: (navigate: any) => navigate("/reviews"),
  },
];

const Dashboard = () => {
  const { user } = useAuth();
  const { data: profile, isLoading: profileLoading } = useProfile();
  const { data: stories = [] } = useStories(); // <-- fixed usage
  const navigate = useNavigate();

  // MOCKED reading data; in reality, you would get this from a read-tracking table
  const storiesReadThisMonth = 12;

  // Get date of most recent story (for writing frequency)
  const lastStoryAt = stories.length > 0 ? stories[0].created_at : null;

  if (profileLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-red-50 p-8">
        <div className="max-w-4xl mx-auto space-y-4">
          <Skeleton className="h-12 w-64" />
          <Skeleton className="h-64 w-full" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-32 w-full" />
          </div>
        </div>
      </div>
    );
  }

  const firstName = profile?.full_name?.split(" ")[0] || user?.email?.split("@")[0] || "Reader";

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <div className="hidden lg:block w-64 flex-shrink-0">
          <AppSidebar />
        </div>
        <div className="flex-1 flex flex-col bg-gradient-to-b from-amber-50 to-white">
          {/* Sticky Top Navbar */}
          <Navigation />
          <main className="flex-1 p-0 sm:p-8">
            {/* Welcome Header */}
            <div className="bg-gradient-to-r from-amber-100 to-orange-100 rounded-lg p-6 mt-4 shadow-sm">
              <h1 className="text-3xl font-bold text-gray-800 mb-2">
                Welcome back, {firstName} 👋
              </h1>
              {/* Frequency & Stats Row */}
              <div className="py-2">
                <DashboardStats
                  storiesCount={stories.length}
                  lastStoryAt={lastStoryAt}
                  storiesReadThisMonth={storiesReadThisMonth}
                />
              </div>
            </div>

            {/* Dashboard Action Buttons */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
              {actionButtons.map((btn) => (
                <Card key={btn.label} className="cursor-pointer group hover:shadow-xl transition" tabIndex={0} onClick={() => btn.onClick(navigate)} onKeyDown={e => (e.key === "Enter" || e.key === " ") && btn.onClick(navigate)} role="button" aria-label={btn.label}>
                  <CardContent className="flex flex-col items-center py-6">
                    <btn.icon className="w-8 h-8 mb-2 text-amber-600 group-hover:scale-110 transition-transform" strokeWidth={2.2} />
                    <span className="font-semibold text-lg text-gray-900 text-center">{btn.label}</span>
                  </CardContent>
                </Card>
              ))}
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default Dashboard;
