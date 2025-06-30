
import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

interface BookDetailsHeaderProps {
  title: string;
}

const BookDetailsHeader = ({ title }: BookDetailsHeaderProps) => {
  return (
    <div className="space-y-8">
      <Link to="/library" className="inline-flex items-center text-sm text-blue-600 hover:underline font-medium">
        <ArrowLeft className="w-4 h-4 mr-1" /> Back to Library
      </Link>
      
      <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
        <div className="p-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-6">{title}</h1>
        </div>
      </div>
    </div>
  );
};

export default BookDetailsHeader;
