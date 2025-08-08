import React from 'react';
import { BookOpen } from 'lucide-react';

export function Loader() {
  return (
    <div className="flex items-end gap-2">
      <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-r from-amber-500 to-orange-600 text-white shadow-sm">
        <BookOpen className="h-3 w-3" />
      </div>
      <div className="bg-white border border-gray-200 rounded-lg px-3 py-2">
        <div className="flex space-x-1">
          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
        </div>
      </div>
    </div>
  );
}

export default Loader;
