import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/authHelpers';
import { useProfile } from '@/hooks/useProfile';
import { useUserBookshelf } from '@/hooks/useUserBookshelf';
import { useUserJoinedGroups } from '@/hooks/useUserGroups';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, BookOpen, Library, Users, ChevronRight, Flame, Circle, CheckCircle2 } from 'lucide-react';
import SEO from '@/components/SEO';
import DashboardStats from '@/components/dashboard/DashboardStats';
import CurrentReads from '@/components/dashboard/CurrentReads';
import ReadingGoalDialog from '@/components/dashboard/ReadingGoalDialog';
import ReadingGoalModal from '@/components/dashboard/ReadingGoalModal';
import BookRecommendations from '@/components/dashboard/BookRecommendations';
import { trackUiEvent } from '@/lib/analytics';

const Dashboard = () => {
  const { user, loading: authLoading } = useAuth();
  const { data: profile, isLoading: profileLoading } = useProfile();
  const { data: userBooks = [] } = useUserBookshelf();
  const { data: joinedGroups = [] } = useUserJoinedGroups();
  const [readingGoal, setReadingGoal] = useState(12);
  const [showGoalModal, setShowGoalModal] = useState(false);

  useEffect(() => {
    const loadGoal = () => {
      const savedGoal = localStorage.getItem(`readingGoal${new Date().getFullYear()}`);
      if (savedGoal) {
        setReadingGoal(parseInt(savedGoal) || 12);
      }
    };

    loadGoal();

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

  const completedBooks = userBooks.filter(book => book.status === 'completed').length;
  const currentlyReading = userBooks.filter(book => book.status === 'reading').length;
  const wantToRead = userBooks.filter(book => book.status === 'want_to_read').length;
  const totalBooks = completedBooks + currentlyReading + wantToRead;
  const progressPercentage = Math.min(100, Math.round((completedBooks / readingGoal) * 100));
  
  // Get the current book being read for the welcome message
  const currentBook = userBooks.find(book => book.status === 'reading');
  const onboardingChecklist = [
    { key: 'profile', label: 'Complete your profile', done: Boolean(profile?.full_name?.trim()) },
    { key: 'shelf', label: 'Save your first book', done: userBooks.length > 0 },
    { key: 'reading', label: 'Start your first read', done: currentlyReading > 0 || completedBooks > 0 },
    { key: 'group', label: 'Join your first group', done: joinedGroups.length > 0 },
  ];
  const onboardingDone = onboardingChecklist.filter(step => step.done).length;
  const onboardingStepTotal = onboardingChecklist.length;

  const checkReadingGoal = useCallback(() => {
    if (totalBooks >= readingGoal) {
      setShowGoalModal(true);
      return false;
    }
    return true;
  }, [totalBooks, readingGoal]);

  useEffect(() => {
    (window as any).checkReadingGoal = checkReadingGoal;
  }, [checkReadingGoal]);

  useEffect(() => {
    void trackUiEvent('dashboard_onboarding_progress', {
      completed: onboardingDone,
      total: onboardingStepTotal,
    });
  }, [onboardingDone, onboardingStepTotal]);

  if (authLoading || profileLoading) {
    return (
      <div className="min-h-screen bg-background p-4 sm:p-8">
        <div className="max-w-6xl mx-auto space-y-6">
          <Skeleton className="h-32 w-full rounded-2xl" />
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-24 w-full rounded-xl" />
            ))}
          </div>
          <Skeleton className="h-64 w-full rounded-xl" />
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
      
      <div className="min-h-screen bg-background">
        <div className="max-w-6xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
          
          {/* Welcome Header - Clean & Contextual */}
          <Card className="border-0 bg-gradient-to-r from-[hsl(var(--brand-primary))] to-[hsl(var(--brand-secondary))] text-white overflow-hidden relative">
            <CardContent className="p-6 sm:p-8">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 relative z-10">
                <div className="space-y-2">
                  <h1 className="text-2xl sm:text-3xl font-bold">
                    {currentBook 
                      ? `Continue reading, ${userName}` 
                      : `Welcome back, ${userName}!`}
                  </h1>
                  <p className="text-white/90 text-sm sm:text-base max-w-md">
                    {currentBook 
                      ? `Pick up where you left off with "${currentBook.books_library?.title}"`
                      : currentlyReading === 0 
                        ? "Start your reading journey by adding a book to your shelf"
                        : `You have ${totalBooks} books in your collection`}
                  </p>
                </div>
                <div className="flex gap-3">
                  {currentBook ? (
                    <Link to={`/book/${currentBook.book_id}`}>
                      <Button className="bg-white text-[hsl(var(--brand-primary))] hover:bg-white/90 shadow-lg font-semibold">
                        <BookOpen className="w-4 h-4 mr-2" />
                        Continue Reading
                      </Button>
                    </Link>
                  ) : (
                    <Link to="/library">
                      <Button className="bg-white text-[hsl(var(--brand-primary))] hover:bg-white/90 shadow-lg font-semibold">
                        <Plus className="w-4 h-4 mr-2" />
                        Add First Book
                      </Button>
                    </Link>
                  )}
                </div>
              </div>
              {/* Decorative element */}
              <div className="absolute right-0 top-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
              <div className="absolute right-16 bottom-0 w-24 h-24 bg-white/5 rounded-full translate-y-1/2" />
            </CardContent>
          </Card>

          {/* Stats Overview */}
          <DashboardStats />

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Content - 2 columns */}
            <div className="lg:col-span-2 space-y-6">
              {/* Current Reading Section */}
              <CurrentReads userId={user?.id} />
              
              {/* Quick Actions */}
              <Card className="border-border">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base font-semibold">Getting Started Checklist</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-sm text-muted-foreground">
                    {onboardingDone === onboardingStepTotal
                      ? 'Awesome! You have completed all first-run steps.'
                      : `${onboardingDone}/${onboardingStepTotal} steps completed — finish setup to unlock better recommendations.`}
                  </p>
                  <div className="space-y-2">
                    {onboardingChecklist.map((step) => (
                      <div key={step.key} className="flex items-center gap-2 text-sm">
                        {step.done ? (
                          <CheckCircle2 className="w-4 h-4 text-green-600" />
                        ) : (
                          <Circle className="w-4 h-4 text-muted-foreground" />
                        )}
                        <span className={step.done ? 'text-foreground' : 'text-muted-foreground'}>{step.label}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card className="border-border">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base font-semibold flex items-center gap-2">
                    <Library className="w-4 h-4 text-[hsl(var(--brand-primary))]" />
                    Quick Actions
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    <Link to="/library" className="block">
                      <Button variant="outline" className="w-full h-auto py-4 flex flex-col gap-2 border-border hover:border-[hsl(var(--brand-primary))] hover:bg-[hsl(var(--brand-primary)/0.05)] transition-colors">
                        <BookOpen className="w-5 h-5 text-[hsl(var(--brand-primary))]" />
                        <span className="text-xs font-medium">Browse Library</span>
                      </Button>
                    </Link>
                    <Link to="/bookshelf" className="block">
                      <Button variant="outline" className="w-full h-auto py-4 flex flex-col gap-2 border-border hover:border-[hsl(var(--brand-primary))] hover:bg-[hsl(var(--brand-primary)/0.05)] transition-colors">
                        <Library className="w-5 h-5 text-[hsl(var(--brand-primary))]" />
                        <span className="text-xs font-medium">My Bookshelf</span>
                      </Button>
                    </Link>
                    <Link to="/social" className="block">
                      <Button variant="outline" className="w-full h-auto py-4 flex flex-col gap-2 border-border hover:border-[hsl(var(--brand-primary))] hover:bg-[hsl(var(--brand-primary)/0.05)] transition-colors">
                        <Users className="w-5 h-5 text-[hsl(var(--brand-primary))]" />
                        <span className="text-xs font-medium">Community</span>
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>

              {/* Recent Books from Shelf */}
              {userBooks.length > 0 && (
                <Card className="border-border">
                  <CardHeader className="pb-3 flex flex-row items-center justify-between">
                    <CardTitle className="text-base font-semibold">Recent Additions</CardTitle>
                    <Link to="/bookshelf">
                      <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
                        View All <ChevronRight className="w-4 h-4 ml-1" />
                      </Button>
                    </Link>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
                      {userBooks.slice(0, 5).map((item) => (
                        <Link 
                          key={item.id} 
                          to={`/book/${item.book_id}`}
                          className="group"
                        >
                          <div className="aspect-[2/3] rounded-lg overflow-hidden bg-muted shadow-sm group-hover:shadow-md transition-shadow">
                            {item.books_library?.cover_image_url ? (
                              <img
                                src={item.books_library.cover_image_url}
                                alt={item.books_library?.title}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                              />
                            ) : (
                              <div className="w-full h-full bg-gradient-to-br from-[hsl(var(--brand-primary)/0.2)] to-[hsl(var(--brand-secondary)/0.2)] flex items-center justify-center">
                                <BookOpen className="w-6 h-6 text-[hsl(var(--brand-primary))]" />
                              </div>
                            )}
                          </div>
                          <p className="mt-2 text-xs font-medium line-clamp-1 text-foreground group-hover:text-[hsl(var(--brand-primary))] transition-colors">
                            {item.books_library?.title || 'Untitled'}
                          </p>
                        </Link>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Reading Goal - Clean Circular Progress */}
              <Card className="border-border overflow-hidden">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base font-semibold flex items-center gap-2">
                    <Flame className="w-4 h-4 text-[hsl(var(--brand-primary))]" />
                    {new Date().getFullYear()} Reading Goal
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Circular Progress */}
                  <div className="flex justify-center py-4">
                    <div className="relative w-32 h-32">
                      <svg className="w-full h-full transform -rotate-90">
                        <circle
                          cx="64"
                          cy="64"
                          r="56"
                          stroke="currentColor"
                          strokeWidth="12"
                          fill="none"
                          className="text-muted"
                        />
                        <circle
                          cx="64"
                          cy="64"
                          r="56"
                          stroke="currentColor"
                          strokeWidth="12"
                          fill="none"
                          strokeLinecap="round"
                          strokeDasharray={`${2 * Math.PI * 56}`}
                          strokeDashoffset={`${2 * Math.PI * 56 * (1 - progressPercentage / 100)}`}
                          className="text-[hsl(var(--brand-primary))] transition-all duration-500"
                        />
                      </svg>
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className="text-2xl font-bold text-foreground">{completedBooks}</span>
                        <span className="text-xs text-muted-foreground">of {readingGoal}</span>
                      </div>
                    </div>
                  </div>

                  {/* Stats Row */}
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="p-2 rounded-lg bg-muted/50">
                      <div className="text-sm font-semibold text-foreground">{currentlyReading}</div>
                      <div className="text-[10px] text-muted-foreground">Reading</div>
                    </div>
                    <div className="p-2 rounded-lg bg-muted/50">
                      <div className="text-sm font-semibold text-foreground">{completedBooks}</div>
                      <div className="text-[10px] text-muted-foreground">Finished</div>
                    </div>
                    <div className="p-2 rounded-lg bg-muted/50">
                      <div className="text-sm font-semibold text-foreground">{wantToRead}</div>
                      <div className="text-[10px] text-muted-foreground">To Read</div>
                    </div>
                  </div>

                  <ReadingGoalDialog onGoalUpdate={handleGoalUpdate} />
                </CardContent>
              </Card>

              {/* Recommendations */}
              <BookRecommendations />
            </div>
          </div>
        </div>
        
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
