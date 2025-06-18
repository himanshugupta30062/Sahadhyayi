
import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useProfile } from '@/hooks/useProfile';
import { SidebarProvider } from "@/components/ui/sidebar";
import AppSidebar from "@/components/dashboard/AppSidebar";
import { Skeleton } from '@/components/ui/skeleton';
import DashboardHeader from '@/components/dashboard/DashboardHeader';
import CurrentReads from '@/components/dashboard/CurrentReads';
import ReadingFeed from '@/components/dashboard/ReadingFeed';
import BookRecommendations from '@/components/dashboard/BookRecommendations';
import QuickActionsPanel from '@/components/dashboard/QuickActionsPanel';
import WeeklyReadingSummary from '@/components/dashboard/WeeklyReadingSummary';

const Dashboard = () => {
  const { user } = useAuth();
  const { data: profile, isLoading: profileLoading } = useProfile();

  if (profileLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-red-50 p-4 sm:p-8">
        <div className="max-w-7xl mx-auto space-y-4 sm:space-y-6">
          <Skeleton className="h-20 sm:h-24 w-full" />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
            <div className="lg:col-span-2 space-y-4 sm:space-y-6">
              <Skeleton className="h-48 sm:h-64 w-full" />
              <Skeleton className="h-64 sm:h-96 w-full" />
            </div>
            <div className="space-y-4 sm:space-y-6">
              <Skeleton className="h-32 w-full" />
              <Skeleton className="h-48 w-full" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <div className="hidden lg:block w-64 flex-shrink-0">
          <AppSidebar />
        </div>
        
        <div className="flex-1 bg-gradient-to-b from-amber-50 to-white">
          <main className="max-w-7xl mx-auto p-3 sm:p-6">
            {/* Welcome Header */}
            <DashboardHeader user={user} profile={profile} />
            
            {/* Main Dashboard Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 mt-6 sm:mt-8">
              {/* Left Column - Main Content */}
              <div className="lg:col-span-2 space-y-6 sm:space-y-8">
                {/* Current Reads Section */}
                <CurrentReads userId={user?.id} />
                
                {/* Reading Feed */}
                <ReadingFeed />
                
                {/* Book Recommendations */}
                <BookRecommendations userId={user?.id} />
              </div>
              
              {/* Right Column - Sidebar Content */}
              <div className="space-y-4 sm:space-y-6">
                {/* Quick Actions Panel */}
                <QuickActionsPanel />
                
                {/* Weekly Reading Summary */}
                <WeeklyReadingSummary userId={user?.id} />
              </div>
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default Dashboard;
