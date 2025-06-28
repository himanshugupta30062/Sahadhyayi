
import React from 'react';
import { BookOpen } from 'lucide-react';
import BookGrid from '@/components/library/BookGrid';

const BookLibrary = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center space-x-3">
            <BookOpen className="w-8 h-8 text-orange-600" />
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Library (पुस्तकालय)
              </h1>
              <p className="text-gray-600 mt-1">
                Discover and explore our collection of books
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="py-8">
        <BookGrid />
      </div>
    </div>
  );
};

export default BookLibrary;
