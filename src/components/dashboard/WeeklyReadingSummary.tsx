
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { BookOpen, Clock, Target } from 'lucide-react';

interface WeeklyReadingSummaryProps {
  userId?: string;
}

const WeeklyReadingSummary: React.FC<WeeklyReadingSummaryProps> = ({ userId }) => {
  // Mock data - in real app, this would come from Supabase
  const weeklyStats = {
    booksRead: 2,
    totalReadingTime: 8.5, // hours
    goalProgress: 67, // percentage
    booksGoal: 3,
    timeGoal: 12 // hours
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center text-lg">
          <BarChart3 className="w-5 h-5 mr-2 text-amber-600" />
          This Week's Progress
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Books Read */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center">
              <BookOpen className="w-4 h-4 mr-2 text-blue-500" />
              <span className="text-sm font-medium">Books Read</span>
            </div>
            <span className="text-sm text-gray-600">
              {weeklyStats.booksRead}/{weeklyStats.booksGoal}
            </span>
          </div>
          <Progress 
            value={(weeklyStats.booksRead / weeklyStats.booksGoal) * 100} 
            className="h-2"
          />
        </div>

        {/* Reading Time */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center">
              <Clock className="w-4 h-4 mr-2 text-green-500" />
              <span className="text-sm font-medium">Reading Time</span>
            </div>
            <span className="text-sm text-gray-600">
              {weeklyStats.totalReadingTime}h/{weeklyStats.timeGoal}h
            </span>
          </div>
          <Progress 
            value={(weeklyStats.totalReadingTime / weeklyStats.timeGoal) * 100} 
            className="h-2"
          />
        </div>

        {/* Overall Goal Progress */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center">
              <Target className="w-4 h-4 mr-2 text-amber-500" />
              <span className="text-sm font-medium">Weekly Goal</span>
            </div>
            <span className="text-sm text-gray-600">{weeklyStats.goalProgress}%</span>
          </div>
          <Progress value={weeklyStats.goalProgress} className="h-2" />
        </div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-100">
          <div className="text-center">
            <div className="text-2xl font-bold text-amber-600">{weeklyStats.booksRead}</div>
            <div className="text-xs text-gray-500">Books Completed</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{weeklyStats.totalReadingTime}h</div>
            <div className="text-xs text-gray-500">Hours Read</div>
          </div>
        </div>

        {/* Motivational Message */}
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
          <p className="text-sm text-amber-800 text-center">
            {weeklyStats.goalProgress >= 70 
              ? "🎉 Great progress! You're on track to meet your weekly goal!"
              : "📚 Keep going! You're building a great reading habit."
            }
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

// Fix the import - BarChart3 should be imported from lucide-react
import { BarChart3 } from 'lucide-react';

export default WeeklyReadingSummary;
