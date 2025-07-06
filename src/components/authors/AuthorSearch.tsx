
import React from 'react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Filter } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';

interface AuthorSearchProps {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  sortOption: string;
  setSortOption: (option: string) => void;
}

const AuthorSearch = ({ searchTerm, setSearchTerm, sortOption, setSortOption }: AuthorSearchProps) => {
  const isMobile = useIsMobile();

  return (
    <div className="space-y-4">
      <h2 className={`${isMobile ? 'text-xl' : 'text-2xl'} font-bold text-gray-900 mb-4`}>
        Discover Authors
      </h2>
      
      {/* Search and Filter Row */}
      <div className={`flex ${isMobile ? 'flex-col space-y-4' : 'flex-row items-center space-x-4'}`}>
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            type="text"
            placeholder="Search authors by name, genre, or book..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 h-12 bg-white/90 backdrop-blur-sm border-2 border-orange-200 focus:border-orange-400 rounded-xl"
          />
        </div>

        {/* Sort Dropdown */}
        <div className={`flex items-center gap-2 ${isMobile ? 'w-full' : 'min-w-[200px]'}`}>
          <Filter className="w-4 h-4 text-gray-500" />
          <Select value={sortOption} onValueChange={setSortOption}>
            <SelectTrigger className={`${isMobile ? 'w-full' : 'w-[180px]'} h-12 bg-white/90 backdrop-blur-sm border-2 border-orange-200 focus:border-orange-400 rounded-xl`}>
              <SelectValue placeholder="Sort by..." />
            </SelectTrigger>
            <SelectContent className="bg-white border-orange-200">
              <SelectItem value="rating">Sort by Rating</SelectItem>
              <SelectItem value="name">Sort by Name</SelectItem>
              <SelectItem value="followers">Sort by Followers</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Search Results Info */}
      {searchTerm && (
        <div className="text-sm text-gray-600 bg-orange-50 px-4 py-2 rounded-lg border border-orange-200">
          <span className="font-medium">Searching for:</span> "{searchTerm}"
        </div>
      )}
    </div>
  );
};

export default AuthorSearch;
