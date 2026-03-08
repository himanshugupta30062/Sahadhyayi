import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { BookOpen, Clock, BookMarked, Star } from 'lucide-react';
import { useUserBookshelf } from '@/hooks/useUserBookshelf';

const DashboardStats = () => {
  const { data: bookshelf = [] } = useUserBookshelf();

  const completedBooks = bookshelf.filter(book => book.status === 'completed').length;
  const currentlyReading = bookshelf.filter(book => book.status === 'reading').length;
  const wantToRead = bookshelf.filter(book => book.status === 'want_to_read').length;
  const totalBooks = completedBooks + currentlyReading + wantToRead;

  const stats = [
    {
      label: 'Total Books',
      value: totalBooks,
      icon: BookOpen,
      color: 'text-[hsl(var(--brand-primary))]',
      bg: 'bg-[hsl(var(--brand-primary)/0.1)]',
    },
    {
      label: 'Reading',
      value: currentlyReading,
      icon: Clock,
      color: 'text-blue-600',
      bg: 'bg-blue-50',
    },
    {
      label: 'Completed',
      value: completedBooks,
      icon: Star,
      color: 'text-green-600',
      bg: 'bg-green-50',
    },
    {
      label: 'Want to Read',
      value: wantToRead,
      icon: BookMarked,
      color: 'text-amber-600',
      bg: 'bg-amber-50',
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {stats.map((stat, index) => {
        const Icon = stat.icon;
        return (
          <Card key={index} className="border-border hover:shadow-sm transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className={`p-2.5 rounded-xl ${stat.bg}`}>
                  <Icon className={`w-5 h-5 ${stat.color}`} />
                </div>
                <div>
                  <div className="text-2xl font-bold text-foreground">{stat.value}</div>
                  <div className="text-xs text-muted-foreground">{stat.label}</div>
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
