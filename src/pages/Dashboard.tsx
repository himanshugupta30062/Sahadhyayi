import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useProfile } from '@/hooks/useProfile';
import QuickActions from '@/components/dashboard/QuickActions';
import EnhancedReadingTracker from '@/components/dashboard/EnhancedReadingTracker';
import EnhancedStoriesSection from '@/components/dashboard/EnhancedStoriesSection';
import LibraryPreview from '@/components/dashboard/LibraryPreview';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { User, Calendar, Trophy } from 'lucide-react';
import DashboardStats from '@/components/dashboard/DashboardStats';

const Dashboard = () => {
  const { user } = useAuth();
  const { data: profile, isLoading: profileLoading } = useProfile();
  const { data: stories = [] } = require('@/hooks/useStories').useStories?.() || { data: [] };

  // MOCKED reading data; in reality, you would get this from a read-tracking table
  const storiesReadThisMonth = 12; // ← TODO: get from backend

  // Get date of most recent story (for writing frequency)
  const lastStoryAt = stories.length > 0 ? stories[0].created_at : null;

  if (profileLoading) {
    return (
      <div className="max-w-7xl mx-auto p-6 space-y-6">
        <Skeleton className="h-12 w-64" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <Skeleton key={i} className="h-64" />
          ))}
        </div>
      </div>
    );
  }

  const welcomeName = profile?.full_name || user?.email?.split('@')[0] || 'Reader';

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Welcome Header */}
      <div className="bg-gradient-to-r from-amber-100 to-orange-100 rounded-lg p-6">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">
          Welcome back, {welcomeName}! 📚
        </h1>
        <p className="text-gray-600">
          Continue your reading journey and discover new stories.
        </p>
        {/* FREQUENCY STATS */}
        <DashboardStats
          storiesCount={stories.length}
          lastStoryAt={lastStoryAt}
          storiesReadThisMonth={storiesReadThisMonth}
        />
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="flex items-center p-6">
            <User className="w-8 h-8 text-blue-500 mr-3" />
            <div>
              <p className="text-2xl font-bold">Welcome</p>
              <p className="text-sm text-gray-500">Member since {new Date(profile?.created_at || '').toLocaleDateString()}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center p-6">
            <Calendar className="w-8 h-8 text-green-500 mr-3" />
            <div>
              <p className="text-2xl font-bold">Daily Goal</p>
              <p className="text-sm text-gray-500">30 minutes reading</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center p-6">
            <Trophy className="w-8 h-8 text-yellow-500 mr-3" />
            <div>
              <p className="text-2xl font-bold">Achievements</p>
              <p className="text-sm text-gray-500">Unlock your first badge!</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Dashboard Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Quick Actions */}
        <div className="space-y-6">
          <QuickActions />
          <LibraryPreview />
        </div>

        {/* Middle Column - Reading Progress */}
        <div className="space-y-6">
          <EnhancedReadingTracker />
        </div>

        {/* Right Column - Stories */}
        <div className="space-y-6">
          <EnhancedStoriesSection />
        </div>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-sm">Joined Sahadhyayi community</span>
              <span className="text-xs text-gray-500 ml-auto">Just now</span>
            </div>
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <span className="text-sm">Profile created successfully</span>
              <span className="text-xs text-gray-500 ml-auto">Today</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;
