import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { BookOpen, Clock, BookMarked, Star } from 'lucide-react';
import { useUserBookshelf } from '@/hooks/useUserBookshelf';
import { useReadingProgress } from '@/hooks/useReadingProgress';

const DashboardStats = () => {
  const { data: bookshelf = [] } = useUserBookshelf();
  const { data: readingProgress = [] } = useReadingProgress();

  // Calculate stats from actual data
  const completedBooks = bookshelf.filter(book => book.status === 'completed').length;
  const currentlyReading = bookshelf.filter(book => book.status === 'reading').length + readingProgress.length;
  const wantToRead = bookshelf.filter(book => book.status === 'want_to_read').length;
  const totalReviews = 0; // We can implement this later when reviews are connected
  
  // Calculate dynamic books per month (if reading 6 books total, and there are 12 months)
  const booksPerMonth = completedBooks > 0 ? Math.max(1, Math.round(completedBooks / 12)) : 1;

  const stats = [
    {
      label: 'Books Read',
      value: completedBooks,
      icon: BookOpen,
      bgGradient: 'from-blue-50 to-blue-100',
      borderColor: 'border-blue-200',
      iconBg: 'bg-blue-600',
      textColor: 'text-blue-800',
      subtextColor: 'text-blue-600',
    },
    {
      label: 'Reading Now',
      value: currentlyReading,
      icon: Clock,
      bgGradient: 'from-green-50 to-green-100',
      borderColor: 'border-green-200',
      iconBg: 'bg-green-600',
      textColor: 'text-green-800',
      subtextColor: 'text-green-600',
    },
    {
      label: 'Want to Read',
      value: wantToRead,
      icon: BookMarked,
      bgGradient: 'from-purple-50 to-purple-100',
      borderColor: 'border-purple-200',
      iconBg: 'bg-purple-600',
      textColor: 'text-purple-800',
      subtextColor: 'text-purple-600',
    },
    {
      label: 'Reviews',
      value: totalReviews,
      icon: Star,
      bgGradient: 'from-amber-50 to-amber-100',
      borderColor: 'border-amber-200',
      iconBg: 'bg-amber-600',
      textColor: 'text-amber-800',
      subtextColor: 'text-amber-600',
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      {stats.map((stat, index) => {
        const Icon = stat.icon;
        return (
          <Card key={index} className={`bg-gradient-to-br ${stat.bgGradient} ${stat.borderColor}`}>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className={`p-2 ${stat.iconBg} rounded-lg`}>
                  <Icon className="w-5 h-5 text-white" />
                </div>
                <div>
                  <div className={`font-bold text-lg ${stat.textColor}`}>{stat.value}</div>
                  <div className={`text-sm ${stat.subtextColor}`}>{stat.label}</div>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

export default DashboardStats;