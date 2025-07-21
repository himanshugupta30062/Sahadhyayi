
import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useProfile } from '@/hooks/useProfile';
import { useUserBookshelf } from '@/hooks/useUserBookshelf';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, TrendingUp, Users, Target, BookOpen } from 'lucide-react';
import SEO from '@/components/SEO';
import DashboardStats from '@/components/dashboard/DashboardStats';
import EnhancedBookshelf from '@/components/dashboard/EnhancedBookshelf';
import CurrentReads from '@/components/dashboard/CurrentReads';
import ReadingTracker from '@/components/dashboard/ReadingTracker';
import ReadingGoalDialog from '@/components/dashboard/ReadingGoalDialog';
import ReadingGoalModal from '@/components/dashboard/ReadingGoalModal';

const Dashboard = () => {
  const { user } = useAuth();
  const { data: profile, isLoading: profileLoading } = useProfile();
  const { data: userBooks = [] } = useUserBookshelf();
  const [readingGoal, setReadingGoal] = useState(12);
  const [showGoalModal, setShowGoalModal] = useState(false);

  // Load reading goal from localStorage and listen for updates
  useEffect(() => {
    const loadGoal = () => {
      const savedGoal = localStorage.getItem('readingGoal2024');
      if (savedGoal) {
        setReadingGoal(parseInt(savedGoal) || 12);
      }
    };

    loadGoal();

    // Listen for goal updates from the dialog
    const handleGoalUpdate = (event: CustomEvent) => {
      setReadingGoal(event.detail.goal);
    };

    window.addEventListener('readingGoalUpdated', handleGoalUpdate as EventListener);

    return () => {
      window.removeEventListener('readingGoalUpdated', handleGoalUpdate as EventListener);
    };
  }, []);

  const handleGoalUpdate = (newGoal: number) => {
    setReadingGoal(newGoal);
  };

  const userName =
    profile?.full_name?.split(' ')[0] || user?.email?.split('@')[0] || 'Reader';

  // Calculate reading stats from user bookshelf
  const completedBooks = userBooks.filter(book => book.status === 'completed').length;
  const currentlyReading = userBooks.filter(book => book.status === 'reading').length;
  const totalBooks = completedBooks + currentlyReading;
  const progressPercentage = Math.min(100, Math.round((completedBooks / readingGoal) * 100));

  // Function to check reading goal before adding books
  const checkReadingGoal = useCallback(() => {
    if (totalBooks >= readingGoal) {
      setShowGoalModal(true);
      return false; // Block adding book
    }
    return true; // Allow adding book
  }, [totalBooks, readingGoal]);

  // Expose function globally for other components to use
  useEffect(() => {
    (window as any).checkReadingGoal = checkReadingGoal;
  }, [checkReadingGoal]);

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
    <>
      <SEO
        title="My Library - Personal Reading Dashboard | Sahadhyayi"
        description="Manage your personal reading collection, track progress, and discover new books in your customized library."
        canonical="https://sahadhyayi.com/dashboard"
        url="https://sahadhyayi.com/dashboard"
      />
      
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-red-50">
        <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
          {/* Welcome Header */}
          <div className="mb-8">
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-amber-200 shadow-lg p-6 sm:p-8">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
                    Welcome back, {userName}! 📚
                  </h1>
                  <p className="text-gray-600 text-sm sm:text-base">
                    Continue your reading journey and discover new books in your personal library.
                  </p>
                </div>
                <div className="flex gap-2">
                  <Link to="/library">
                    <Button className="bg-amber-600 hover:bg-amber-700 shadow-lg">
                      <Plus className="w-4 h-4 mr-2" />
                      Add Books
                    </Button>
                  </Link>
                  <Link to="/social?tab=groups">
                    <Button variant="outline" className="border-amber-200 hover:bg-amber-50">
                      <Users className="w-4 h-4 mr-2" />
                      Community
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </div>

          {/* Stats Overview */}
          <DashboardStats />

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Main Content Area */}
            <div className="lg:col-span-3 space-y-6">
              {/* Current Reading Section */}
              <CurrentReads userId={user?.id} />
              
              {/* Reading Progress Tracker */}
              {user?.id && <ReadingTracker userId={user.id} />}
              
              {/* My Library Section */}
              <EnhancedBookshelf />
              
              {/* Quick Actions */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center text-lg">
                    <TrendingUp className="w-5 h-5 mr-2 text-amber-600" />
                    Discover & Connect
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <Link to="/library">
                      <Button variant="outline" className="w-full h-16 flex flex-col gap-2 border-amber-200 hover:bg-amber-50">
                        <BookOpen className="w-5 h-5 text-amber-600" />
                        <span className="text-sm">Browse Library</span>
                      </Button>
                    </Link>
                    <Link to="/social">
                      <Button variant="outline" className="w-full h-16 flex flex-col gap-2 border-amber-200 hover:bg-amber-50">
                        <Users className="w-5 h-5 text-amber-600" />
                        <span className="text-sm">Social Feed</span>
                      </Button>
                    </Link>
                    <Link to="/social?tab=groups">
                      <Button variant="outline" className="w-full h-16 flex flex-col gap-2 border-amber-200 hover:bg-amber-50">
                        <Target className="w-5 h-5 text-amber-600" />
                        <span className="text-sm">Reading Groups</span>
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Reading Goal */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">2024 Reading Goal</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="text-center p-4 bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">{completedBooks} / {readingGoal}</div>
                    <div className="text-sm text-gray-600">Books This Year</div>
                    <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                      <div 
                        className="bg-green-500 h-2 rounded-full transition-all duration-300" 
                        style={{ width: `${progressPercentage}%` }}
                      ></div>
                    </div>
                    <div className="text-xs text-gray-500 mt-1">{progressPercentage}% Complete</div>
                  </div>
                  
                  {/* Reading Progress Details */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Currently Reading:</span>
                      <span className="font-medium">{currentlyReading} books</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Total Progress:</span>
                      <span className="font-medium">{totalBooks} books</span>
                    </div>
                  </div>
                  
                  <ReadingGoalDialog onGoalUpdate={handleGoalUpdate} />
                </CardContent>
              </Card>

              {/* Recent Activity */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Recent Activity</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8 text-gray-500">
                    <Users className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                    <p className="text-sm mb-4">No recent activity</p>
                    <Link to="/social">
                      <Button size="sm" variant="outline">
                        Join Community
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>

              {/* Recommendations */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Recommended for You</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-6 text-gray-500">
                    <BookOpen className="w-10 h-10 mx-auto mb-2 text-gray-300" />
                    <p className="text-sm mb-4">Start reading to get personalized recommendations!</p>
                    <Link to="/library">
                      <Button size="sm" className="bg-amber-600 hover:bg-amber-700">
                        Explore Books
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
        
        {/* Reading Goal Modal */}
        <ReadingGoalModal
          isOpen={showGoalModal}
          onClose={() => setShowGoalModal(false)}
          currentGoal={readingGoal}
          totalBooksRead={totalBooks}
          onGoalUpdate={handleGoalUpdate}
        />
      </div>
    </>
  );
};

export default Dashboard;
