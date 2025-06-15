
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BookOpen, Edit, Users, Library } from 'lucide-react';
import { Link } from 'react-router-dom';

const QuickActions = () => {
  const actions = [
    {
      title: 'Start Reading',
      description: 'Continue your current book',
      icon: BookOpen,
      href: '/bookshelf',
      variant: 'default' as const,
    },
    {
      title: 'Write Story',
      description: 'Create a new story',
      icon: Edit,
      href: '/dashboard?tab=stories',
      variant: 'secondary' as const,
    },
    {
      title: 'Join Groups',
      description: 'Connect with readers',
      icon: Users,
      href: '/groups',
      variant: 'outline' as const,
    },
    {
      title: 'Browse Library',
      description: 'Discover new books',
      icon: Library,
      href: '/library',
      variant: 'ghost' as const,
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Quick Actions</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-3">
          {actions.map((action) => {
            const Icon = action.icon;
            return (
              <Link key={action.title} to={action.href}>
                <Button 
                  variant={action.variant} 
                  className="w-full h-auto p-4 flex flex-col items-center gap-2"
                >
                  <Icon className="w-6 h-6" />
                  <div className="text-center">
                    <div className="font-medium text-sm">{action.title}</div>
                    <div className="text-xs opacity-70">{action.description}</div>
                  </div>
                </Button>
              </Link>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};

export default QuickActions;
