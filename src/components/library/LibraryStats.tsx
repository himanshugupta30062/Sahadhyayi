import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  BookOpen, 
  Target, 
  Flame, 
  Trophy, 
  Clock, 
  TrendingUp,
  Star,
  Users,
  Award,
  Calendar
} from 'lucide-react';

interface LibraryStatsProps {
  booksRead?: number;
  readingGoal?: number;
  streak?: number;
  totalReadingTime?: number;
}

const LibraryStats = ({ 
  booksRead = 47, 
  readingGoal = 50, 
  streak = 12,
  totalReadingTime = 156 
}: LibraryStatsProps) => {
  const progressPercentage = (booksRead / readingGoal) * 100;
  
  const achievements = [
    { icon: BookOpen, name: 'Bibliophile', description: 'Read 25+ books', earned: true },
    { icon: Star, name: 'Critic', description: 'Rate 50+ books', earned: true },
    { icon: Users, name: 'Social Reader', description: 'Join 5+ discussions', earned: false },
    { icon: Target, name: 'Goal Crusher', description: 'Complete reading goal', earned: false },
  ];

  const stats = [
    { 
      icon: BookOpen, 
      label: 'Books Read', 
      value: booksRead.toString(), 
      subtitle: 'This year',
      color: 'text-library-primary',
      bgColor: 'bg-library-primary/10'
    },
    { 
      icon: Flame, 
      label: 'Reading Streak', 
      value: streak.toString(), 
      subtitle: 'Days in a row',
      color: 'text-orange-500',
      bgColor: 'bg-orange-50'
    },
    { 
      icon: Clock, 
      label: 'Reading Time', 
      value: `${totalReadingTime}h`, 
      subtitle: 'Total hours',
      color: 'text-blue-500',
      bgColor: 'bg-blue-50'
    },
    { 
      icon: TrendingUp, 
      label: 'This Month', 
      value: '8', 
      subtitle: 'Books completed',
      color: 'text-green-500',
      bgColor: 'bg-green-50'
    },
  ];

  return (
    <div className="space-y-6">
      {/* Reading Goal Progress */}
      <Card className="bg-gradient-to-br from-library-primary/5 to-library-secondary/5 border-library-primary/20">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-library-primary/10 rounded-lg">
                <Target className="w-6 h-6 text-library-primary" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">2024 Reading Goal</h3>
                <p className="text-sm text-gray-600">{booksRead} of {readingGoal} books</p>
              </div>
            </div>
            <Badge variant={progressPercentage >= 100 ? 'default' : 'secondary'} className="px-3 py-1">
              {progressPercentage.toFixed(0)}%
            </Badge>
          </div>
          
          <Progress value={progressPercentage} className="h-3 mb-2" />
          
          <div className="flex justify-between text-sm text-gray-600">
            <span>{readingGoal - booksRead} books to go</span>
            <span>{progressPercentage >= 100 ? 'Goal achieved! 🎉' : 'Keep going!'}</span>
          </div>
        </CardContent>
      </Card>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, index) => (
          <Card key={stat.label} className="bg-white/80 backdrop-blur-sm hover:shadow-lg transition-all duration-200">
            <CardContent className="p-4 text-center">
              <div className={`inline-flex items-center justify-center w-12 h-12 rounded-full ${stat.bgColor} mb-3`}>
                <stat.icon className={`w-6 h-6 ${stat.color}`} />
              </div>
              <div className="text-2xl font-bold text-gray-900 mb-1">{stat.value}</div>
              <div className="text-sm font-medium text-gray-700 mb-1">{stat.label}</div>
              <div className="text-xs text-gray-500">{stat.subtitle}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Achievements */}
      <Card className="bg-white/80 backdrop-blur-sm">
        <CardContent className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <Trophy className="w-6 h-6 text-yellow-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">Achievements</h3>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {achievements.map((achievement, index) => (
              <div 
                key={achievement.name}
                className={`flex items-center gap-3 p-3 rounded-lg border ${
                  achievement.earned 
                    ? 'bg-yellow-50 border-yellow-200' 
                    : 'bg-gray-50 border-gray-200'
                }`}
              >
                <div className={`p-2 rounded-full ${
                  achievement.earned 
                    ? 'bg-yellow-100 text-yellow-600' 
                    : 'bg-gray-200 text-gray-400'
                }`}>
                  <achievement.icon className="w-4 h-4" />
                </div>
                <div className="flex-1">
                  <div className={`font-medium text-sm ${
                    achievement.earned ? 'text-gray-900' : 'text-gray-500'
                  }`}>
                    {achievement.name}
                    {achievement.earned && <Award className="w-4 h-4 inline ml-1 text-yellow-500" />}
                  </div>
                  <div className="text-xs text-gray-600">{achievement.description}</div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Reading Calendar */}
      <Card className="bg-white/80 backdrop-blur-sm">
        <CardContent className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Calendar className="w-6 h-6 text-blue-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">Reading Activity</h3>
          </div>
          
          <div className="grid grid-cols-7 gap-1 text-center text-xs text-gray-500 mb-2">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <div key={day} className="p-1">{day}</div>
            ))}
          </div>
          
          <div className="grid grid-cols-7 gap-1">
            {[...Array(28)].map((_, i) => {
              const hasActivity = Math.random() > 0.4;
              const intensity = Math.random();
              return (
                <div 
                  key={i}
                  className={`aspect-square rounded-sm ${
                    hasActivity 
                      ? intensity > 0.7 
                        ? 'bg-library-primary' 
                        : intensity > 0.4 
                          ? 'bg-library-primary/60' 
                          : 'bg-library-primary/30'
                      : 'bg-gray-100'
                  }`}
                  title={hasActivity ? `${Math.floor(intensity * 3) + 1} books read` : 'No activity'}
                />
              );
            })}
          </div>
          
          <div className="flex items-center justify-between mt-3 text-xs text-gray-500">
            <span>Less</span>
            <div className="flex gap-1">
              <div className="w-3 h-3 bg-gray-100 rounded-sm" />
              <div className="w-3 h-3 bg-library-primary/30 rounded-sm" />
              <div className="w-3 h-3 bg-library-primary/60 rounded-sm" />
              <div className="w-3 h-3 bg-library-primary rounded-sm" />
            </div>
            <span>More</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default LibraryStats;