
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Edit, Users, Bookmark, BarChart3 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const QuickActionsPanel: React.FC = () => {
  const navigate = useNavigate();
  
  const actions = [
    {
      title: 'Add Book',
      description: 'Add a new book to your library',
      icon: Plus,
      onClick: () => {}, // This would open AddBookDialog
      color: 'bg-green-500 hover:bg-green-600'
    },
    {
      title: 'Write Review',
      description: 'Share your thoughts on a book',
      icon: Edit,
      onClick: () => navigate('/social'),
      color: 'bg-blue-500 hover:bg-blue-600'
    },
    {
      title: 'Join Group',
      description: 'Find reading communities',
      icon: Users,
      onClick: () => navigate('/groups'),
      color: 'bg-purple-500 hover:bg-purple-600'
    },
    {
      title: 'My Bookmarks',
      description: 'View saved books and quotes',
      icon: Bookmark,
      onClick: () => navigate('/bookshelf'),
      color: 'bg-orange-500 hover:bg-orange-600'
    },
    {
      title: 'Reading Stats',
      description: 'Track your reading progress',
      icon: BarChart3,
      onClick: () => {}, // This would show detailed stats
      color: 'bg-amber-500 hover:bg-amber-600'
    }
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base sm:text-lg">Quick Actions</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2 sm:space-y-3">
          {actions.map((action) => {
            const Icon = action.icon;
            return (
              <Button
                key={action.title}
                variant="outline"
                className="w-full justify-start p-3 sm:p-4 h-auto border-2 hover:border-amber-300 transition-colors"
                onClick={action.onClick}
              >
                <div className={`p-1.5 sm:p-2 rounded-lg ${action.color} text-white mr-2 sm:mr-3 flex-shrink-0`}>
                  <Icon className="w-3 h-3 sm:w-4 sm:h-4" />
                </div>
                <div className="text-left min-w-0 flex-1">
                  <div className="font-medium text-gray-900 text-sm sm:text-base truncate">{action.title}</div>
                  <div className="text-xs text-gray-500 hidden sm:block">{action.description}</div>
                </div>
              </Button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};

export default QuickActionsPanel;
