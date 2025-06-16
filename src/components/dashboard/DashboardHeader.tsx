
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { BookOpen, Plus } from 'lucide-react';
import AddBookDialog from '@/components/AddBookDialog';

interface DashboardHeaderProps {
  user: any;
  profile: any;
}

const DashboardHeader: React.FC<DashboardHeaderProps> = ({ user, profile }) => {
  const [showAddBook, setShowAddBook] = useState(false);
  
  const firstName = profile?.full_name?.split(' ')[0] || user?.email?.split('@')[0] || 'Reader';
  const initials = profile?.full_name ? 
    profile.full_name.split(' ').map((n: string) => n[0]).join('').toUpperCase() : 
    firstName.charAt(0).toUpperCase();

  return (
    <>
      <div className="bg-gradient-to-r from-amber-100 to-orange-100 rounded-2xl p-8 shadow-sm border border-amber-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Avatar className="w-16 h-16 border-2 border-amber-300">
              <AvatarImage src={profile?.profile_photo_url} />
              <AvatarFallback className="bg-amber-200 text-amber-800 text-lg font-semibold">
                {initials}
              </AvatarFallback>
            </Avatar>
            
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Welcome back, {firstName}! 📚
              </h1>
              <p className="text-gray-600 text-lg">
                Ready to continue your reading journey?
              </p>
            </div>
          </div>
          
          <Button 
            onClick={() => setShowAddBook(true)}
            className="bg-amber-600 hover:bg-amber-700 text-white px-6 py-3 text-lg shadow-lg"
            size="lg"
          >
            <BookOpen className="w-5 h-5 mr-2" />
            Start Reading
          </Button>
        </div>
      </div>
      
      <AddBookDialog open={showAddBook} onOpenChange={setShowAddBook} />
    </>
  );
};

export default DashboardHeader;
