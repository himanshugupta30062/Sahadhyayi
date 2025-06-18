
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

  const handleAddBook = (book: any) => {
    console.log('Adding book:', book);
    // Here you would typically add the book to the user's library
    setShowAddBook(false);
  };

  return (
    <>
      <div className="bg-gradient-to-r from-amber-100 to-orange-100 rounded-xl sm:rounded-2xl p-4 sm:p-8 shadow-sm border border-amber-200">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 sm:gap-0">
          <div className="flex flex-col sm:flex-row items-center space-y-3 sm:space-y-0 sm:space-x-4 text-center sm:text-left">
            <Avatar className="w-12 h-12 sm:w-16 sm:h-16 border-2 border-amber-300">
              <AvatarImage src={profile?.profile_photo_url} />
              <AvatarFallback className="bg-amber-200 text-amber-800 text-sm sm:text-lg font-semibold">
                {initials}
              </AvatarFallback>
            </Avatar>
            
            <div>
              <h1 className="text-xl sm:text-3xl font-bold text-gray-900 mb-1 sm:mb-2">
                Welcome back, {firstName}! 📚
              </h1>
              <p className="text-gray-600 text-sm sm:text-lg">
                Ready to continue your reading journey?
              </p>
            </div>
          </div>
          
          <Button 
            onClick={() => setShowAddBook(true)}
            className="bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 sm:px-6 sm:py-3 text-sm sm:text-lg shadow-lg w-full sm:w-auto"
            size="lg"
          >
            <BookOpen className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
            Start Reading
          </Button>
        </div>
      </div>
      
      <AddBookDialog onAddBook={handleAddBook} />
    </>
  );
};

export default DashboardHeader;
